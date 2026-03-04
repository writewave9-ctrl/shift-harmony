-- Security hardening: tighten profile visibility and invitation access
DROP POLICY IF EXISTS "Users can view profiles in their team/organization" ON public.profiles;
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Managers can view team profiles" ON public.profiles;

CREATE POLICY "Users can view their own profile"
ON public.profiles
FOR SELECT
TO authenticated
USING (user_id = auth.uid());

CREATE POLICY "Managers can view team profiles"
ON public.profiles
FOR SELECT
TO authenticated
USING (
  (public.has_role(auth.uid(), 'manager'::public.app_role)
   OR public.has_role(auth.uid(), 'admin'::public.app_role))
  AND team_id = public.get_user_team(auth.uid())
);

-- Limited team directory view (no email/phone)
CREATE OR REPLACE VIEW public.team_member_directory AS
SELECT
  p.id,
  p.team_id,
  p.full_name,
  p.avatar_url,
  p.position
FROM public.profiles p
WHERE p.team_id = public.get_user_team(auth.uid());

GRANT SELECT ON public.team_member_directory TO authenticated;

-- Secure invitation visibility (remove public read)
DROP POLICY IF EXISTS "Anyone can view invitation by token" ON public.team_invitations;
DROP POLICY IF EXISTS "Managers can view team invitations" ON public.team_invitations;

CREATE POLICY "Managers can view team invitations"
ON public.team_invitations
FOR SELECT
TO authenticated
USING (
  (
    (public.has_role(auth.uid(), 'manager'::public.app_role)
     OR public.has_role(auth.uid(), 'admin'::public.app_role))
    AND team_id = public.get_user_team(auth.uid())
  )
  OR lower(email) = lower(coalesce(auth.jwt() ->> 'email', ''))
);

-- Explicit DELETE/immutability policies to remove ambiguity
DROP POLICY IF EXISTS "Only admins can delete profiles" ON public.profiles;
CREATE POLICY "Only admins can delete profiles"
ON public.profiles
FOR DELETE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'::public.app_role));

DROP POLICY IF EXISTS "Users can delete their own notifications" ON public.notifications;
CREATE POLICY "Users can delete their own notifications"
ON public.notifications
FOR DELETE
TO authenticated
USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Shift messages are immutable (no update)" ON public.shift_messages;
CREATE POLICY "Shift messages are immutable (no update)"
ON public.shift_messages
FOR UPDATE
TO authenticated
USING (false)
WITH CHECK (false);

DROP POLICY IF EXISTS "Shift messages cannot be deleted" ON public.shift_messages;
CREATE POLICY "Shift messages cannot be deleted"
ON public.shift_messages
FOR DELETE
TO authenticated
USING (false);

DROP POLICY IF EXISTS "Swap requests cannot be deleted" ON public.swap_requests;
CREATE POLICY "Swap requests cannot be deleted"
ON public.swap_requests
FOR DELETE
TO authenticated
USING (false);

DROP POLICY IF EXISTS "Call-off requests cannot be deleted" ON public.call_off_requests;
CREATE POLICY "Call-off requests cannot be deleted"
ON public.call_off_requests
FOR DELETE
TO authenticated
USING (false);

DROP POLICY IF EXISTS "Attendance records cannot be deleted" ON public.attendance_records;
CREATE POLICY "Attendance records cannot be deleted"
ON public.attendance_records
FOR DELETE
TO authenticated
USING (false);

DROP POLICY IF EXISTS "Shift requests cannot be deleted" ON public.shift_requests;
CREATE POLICY "Shift requests cannot be deleted"
ON public.shift_requests
FOR DELETE
TO authenticated
USING (false);

-- Web push subscriptions
CREATE TABLE IF NOT EXISTS public.push_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  endpoint TEXT NOT NULL UNIQUE,
  p256dh TEXT NOT NULL,
  auth TEXT NOT NULL,
  user_agent TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  last_seen_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.push_subscriptions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own push subscriptions" ON public.push_subscriptions;
CREATE POLICY "Users can view own push subscriptions"
ON public.push_subscriptions
FOR SELECT
TO authenticated
USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can create own push subscriptions" ON public.push_subscriptions;
CREATE POLICY "Users can create own push subscriptions"
ON public.push_subscriptions
FOR INSERT
TO authenticated
WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can update own push subscriptions" ON public.push_subscriptions;
CREATE POLICY "Users can update own push subscriptions"
ON public.push_subscriptions
FOR UPDATE
TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can delete own push subscriptions" ON public.push_subscriptions;
CREATE POLICY "Users can delete own push subscriptions"
ON public.push_subscriptions
FOR DELETE
TO authenticated
USING (user_id = auth.uid());

CREATE INDEX IF NOT EXISTS idx_push_subscriptions_user_id ON public.push_subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_push_subscriptions_active ON public.push_subscriptions(is_active) WHERE is_active = true;

DROP TRIGGER IF EXISTS trg_push_subscriptions_updated_at ON public.push_subscriptions;
CREATE TRIGGER trg_push_subscriptions_updated_at
BEFORE UPDATE ON public.push_subscriptions
FOR EACH ROW
EXECUTE FUNCTION public.handle_updated_at();

-- Shift reminder log for deduping reminders
CREATE TABLE IF NOT EXISTS public.shift_reminders_sent (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  shift_id UUID NOT NULL REFERENCES public.shifts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  reminder_for TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (shift_id, user_id, reminder_for)
);

ALTER TABLE public.shift_reminders_sent ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "No direct access to reminder logs" ON public.shift_reminders_sent;
CREATE POLICY "No direct access to reminder logs"
ON public.shift_reminders_sent
FOR ALL
TO authenticated
USING (false)
WITH CHECK (false);

-- Generate reminder notifications when due (invokable from app/backend functions)
CREATE OR REPLACE FUNCTION public.enqueue_due_shift_reminders()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  inserted_count INTEGER := 0;
BEGIN
  WITH candidate_reminders AS (
    SELECT
      s.id AS shift_id,
      p.user_id,
      (s.date::timestamp + s.start_time) AS shift_start,
      GREATEST(COALESCE(ts.notification_shift_reminder_hours, 2), 1) AS reminder_hours
    FROM public.shifts s
    JOIN public.profiles p ON p.id = s.assigned_worker_id
    LEFT JOIN public.team_settings ts ON ts.team_id = s.team_id
    WHERE s.status = 'scheduled'
      AND s.assigned_worker_id IS NOT NULL
  ),
  due_reminders AS (
    SELECT
      c.shift_id,
      c.user_id,
      (c.shift_start - make_interval(hours => c.reminder_hours)) AS reminder_for,
      c.shift_start
    FROM candidate_reminders c
    WHERE now() >= (c.shift_start - make_interval(hours => c.reminder_hours))
      AND now() < c.shift_start
  ),
  inserted_logs AS (
    INSERT INTO public.shift_reminders_sent (shift_id, user_id, reminder_for)
    SELECT d.shift_id, d.user_id, d.reminder_for
    FROM due_reminders d
    ON CONFLICT (shift_id, user_id, reminder_for) DO NOTHING
    RETURNING shift_id, user_id
  ),
  inserted_notifications AS (
    INSERT INTO public.notifications (user_id, type, title, message, priority, related_shift_id)
    SELECT
      l.user_id,
      'reminder',
      'Upcoming shift reminder',
      'Your shift starts soon. Please be ready to check in.',
      'normal',
      l.shift_id
    FROM inserted_logs l
    RETURNING 1
  )
  SELECT COUNT(*) INTO inserted_count FROM inserted_notifications;

  RETURN COALESCE(inserted_count, 0);
END;
$$;

-- Auto-create swap alert notifications for managers/workers
CREATE OR REPLACE FUNCTION public.notify_swap_request_changes()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO public.notifications (user_id, type, title, message, priority, related_shift_id)
    SELECT
      manager_profile.user_id,
      'swap_request',
      'New swap request',
      COALESCE(requester.full_name, 'A worker') || ' requested a shift swap.',
      'high',
      NEW.shift_id
    FROM public.shifts s
    JOIN public.profiles manager_profile ON manager_profile.team_id = s.team_id
    JOIN public.user_roles ur ON ur.user_id = manager_profile.user_id AND ur.role IN ('manager', 'admin')
    LEFT JOIN public.profiles requester ON requester.id = NEW.requester_id
    WHERE s.id = NEW.shift_id;

  ELSIF TG_OP = 'UPDATE' AND OLD.status IS DISTINCT FROM NEW.status AND NEW.status IN ('approved', 'declined') THEN
    INSERT INTO public.notifications (user_id, type, title, message, priority, related_shift_id)
    SELECT
      requester.user_id,
      'swap_request',
      CASE WHEN NEW.status = 'approved' THEN 'Swap request approved' ELSE 'Swap request declined' END,
      CASE WHEN NEW.status = 'approved'
        THEN 'Your swap request was approved.'
        ELSE 'Your swap request was declined.'
      END,
      CASE WHEN NEW.status = 'approved' THEN 'normal' ELSE 'high' END,
      NEW.shift_id
    FROM public.profiles requester
    WHERE requester.id = NEW.requester_id;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_notify_swap_request_changes ON public.swap_requests;
CREATE TRIGGER trg_notify_swap_request_changes
AFTER INSERT OR UPDATE ON public.swap_requests
FOR EACH ROW
EXECUTE FUNCTION public.notify_swap_request_changes();