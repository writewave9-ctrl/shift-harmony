-- ============================================================================
-- 1. team_memberships table
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.team_memberships (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  team_id uuid NOT NULL REFERENCES public.teams(id) ON DELETE CASCADE,
  joined_at timestamptz NOT NULL DEFAULT now(),
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, team_id)
);

CREATE INDEX IF NOT EXISTS idx_team_memberships_user ON public.team_memberships(user_id) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_team_memberships_team ON public.team_memberships(team_id) WHERE is_active = true;

ALTER TABLE public.team_memberships ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- 2. profiles.active_team_id
-- ============================================================================
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS active_team_id uuid REFERENCES public.teams(id) ON DELETE SET NULL;

-- Backfill memberships from existing profiles.team_id
INSERT INTO public.team_memberships (user_id, team_id)
SELECT p.user_id, p.team_id
FROM public.profiles p
WHERE p.team_id IS NOT NULL
ON CONFLICT (user_id, team_id) DO NOTHING;

-- Set active_team_id to current team_id for everyone
UPDATE public.profiles
SET active_team_id = team_id
WHERE active_team_id IS NULL AND team_id IS NOT NULL;

-- ============================================================================
-- 3. Helper functions
-- ============================================================================
CREATE OR REPLACE FUNCTION public.get_user_active_team(_user_id uuid)
RETURNS uuid
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT COALESCE(active_team_id, team_id) FROM public.profiles WHERE user_id = _user_id LIMIT 1
$$;

CREATE OR REPLACE FUNCTION public.is_member_of_team(_user_id uuid, _team_id uuid)
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.team_memberships tm
    WHERE tm.user_id = _user_id AND tm.team_id = _team_id AND tm.is_active = true
  )
$$;

CREATE OR REPLACE FUNCTION public.is_active_team(_user_id uuid, _team_id uuid)
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.user_id = _user_id
      AND COALESCE(p.active_team_id, p.team_id) = _team_id
  )
$$;

CREATE OR REPLACE FUNCTION public.get_user_teams(_user_id uuid)
RETURNS TABLE(team_id uuid, team_name text, joined_at timestamptz, is_active_team boolean)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT
    t.id,
    t.name,
    tm.joined_at,
    (t.id = (SELECT COALESCE(active_team_id, team_id) FROM public.profiles WHERE user_id = _user_id LIMIT 1)) AS is_active_team
  FROM public.team_memberships tm
  JOIN public.teams t ON t.id = tm.team_id
  WHERE tm.user_id = _user_id AND tm.is_active = true
  ORDER BY tm.joined_at ASC
$$;

-- ============================================================================
-- 4. team_memberships RLS
-- ============================================================================
DROP POLICY IF EXISTS "Users can view their own memberships" ON public.team_memberships;
CREATE POLICY "Users can view their own memberships"
ON public.team_memberships FOR SELECT
USING (user_id = auth.uid() OR (
  (has_role(auth.uid(), 'manager'::app_role) OR has_role(auth.uid(), 'admin'::app_role))
  AND is_member_of_team(auth.uid(), team_id)
));

DROP POLICY IF EXISTS "Users can leave their own teams" ON public.team_memberships;
CREATE POLICY "Users can leave their own teams"
ON public.team_memberships FOR DELETE
USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Managers can manage team memberships" ON public.team_memberships;
CREATE POLICY "Managers can manage team memberships"
ON public.team_memberships FOR ALL
USING (
  (has_role(auth.uid(), 'manager'::app_role) OR has_role(auth.uid(), 'admin'::app_role))
  AND is_member_of_team(auth.uid(), team_id)
)
WITH CHECK (
  (has_role(auth.uid(), 'manager'::app_role) OR has_role(auth.uid(), 'admin'::app_role))
  AND is_member_of_team(auth.uid(), team_id)
);

-- Allow inserting self via accept-invite (service role bypasses anyway)
DROP POLICY IF EXISTS "Users can join via invitation" ON public.team_memberships;
CREATE POLICY "Users can join via invitation"
ON public.team_memberships FOR INSERT
WITH CHECK (user_id = auth.uid());

-- updated_at trigger
DROP TRIGGER IF EXISTS update_team_memberships_updated_at ON public.team_memberships;
CREATE TRIGGER update_team_memberships_updated_at
BEFORE UPDATE ON public.team_memberships
FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- ============================================================================
-- 5. Rewrite RLS on team-scoped tables to use is_member_of_team
-- ============================================================================

-- shifts
DROP POLICY IF EXISTS "Users can view shifts in their team" ON public.shifts;
CREATE POLICY "Users can view shifts in their team"
ON public.shifts FOR SELECT
USING (is_member_of_team(auth.uid(), team_id));

DROP POLICY IF EXISTS "Managers can manage shifts" ON public.shifts;
CREATE POLICY "Managers can manage shifts"
ON public.shifts FOR ALL
USING (
  is_member_of_team(auth.uid(), team_id)
  AND (has_role(auth.uid(), 'manager'::app_role) OR has_role(auth.uid(), 'admin'::app_role))
)
WITH CHECK (
  is_member_of_team(auth.uid(), team_id)
  AND (has_role(auth.uid(), 'manager'::app_role) OR has_role(auth.uid(), 'admin'::app_role))
);

-- shift_templates
DROP POLICY IF EXISTS "Users can view templates in their team" ON public.shift_templates;
CREATE POLICY "Users can view templates in their team"
ON public.shift_templates FOR SELECT
USING (is_member_of_team(auth.uid(), team_id));

DROP POLICY IF EXISTS "Managers can manage templates" ON public.shift_templates;
CREATE POLICY "Managers can manage templates"
ON public.shift_templates FOR ALL
USING (
  is_member_of_team(auth.uid(), team_id)
  AND (has_role(auth.uid(), 'manager'::app_role) OR has_role(auth.uid(), 'admin'::app_role))
)
WITH CHECK (
  is_member_of_team(auth.uid(), team_id)
  AND (has_role(auth.uid(), 'manager'::app_role) OR has_role(auth.uid(), 'admin'::app_role))
);

-- team_settings
DROP POLICY IF EXISTS "Users can view their team settings" ON public.team_settings;
CREATE POLICY "Users can view their team settings"
ON public.team_settings FOR SELECT
USING (is_member_of_team(auth.uid(), team_id));

DROP POLICY IF EXISTS "Managers can manage team settings" ON public.team_settings;
CREATE POLICY "Managers can manage team settings"
ON public.team_settings FOR ALL
USING (
  is_member_of_team(auth.uid(), team_id)
  AND (has_role(auth.uid(), 'manager'::app_role) OR has_role(auth.uid(), 'admin'::app_role))
)
WITH CHECK (
  is_member_of_team(auth.uid(), team_id)
  AND (has_role(auth.uid(), 'manager'::app_role) OR has_role(auth.uid(), 'admin'::app_role))
);

-- attendance_records (team derived via shift)
DROP POLICY IF EXISTS "Managers can manage attendance" ON public.attendance_records;
CREATE POLICY "Managers can manage attendance"
ON public.attendance_records FOR ALL
USING (
  (has_role(auth.uid(), 'manager'::app_role) OR has_role(auth.uid(), 'admin'::app_role))
  AND EXISTS (
    SELECT 1 FROM public.shifts s
    WHERE s.id = attendance_records.shift_id
      AND is_member_of_team(auth.uid(), s.team_id)
  )
);

-- availability_settings
DROP POLICY IF EXISTS "Managers can view team availability" ON public.availability_settings;
CREATE POLICY "Managers can view team availability"
ON public.availability_settings FOR SELECT
USING (
  (has_role(auth.uid(), 'manager'::app_role) OR has_role(auth.uid(), 'admin'::app_role))
  AND EXISTS (
    SELECT 1 FROM public.profiles p
    JOIN public.team_memberships tm ON tm.user_id = p.user_id AND tm.is_active = true
    WHERE p.id = availability_settings.worker_id
      AND is_member_of_team(auth.uid(), tm.team_id)
  )
);

-- swap_requests
DROP POLICY IF EXISTS "Users can view swap requests in their team" ON public.swap_requests;
CREATE POLICY "Users can view swap requests in their team"
ON public.swap_requests FOR SELECT
USING (EXISTS (
  SELECT 1 FROM public.shifts s
  WHERE s.id = swap_requests.shift_id AND is_member_of_team(auth.uid(), s.team_id)
));

DROP POLICY IF EXISTS "Managers can manage swap requests" ON public.swap_requests;
CREATE POLICY "Managers can manage swap requests"
ON public.swap_requests FOR UPDATE
USING (
  (has_role(auth.uid(), 'manager'::app_role) OR has_role(auth.uid(), 'admin'::app_role))
  AND EXISTS (
    SELECT 1 FROM public.shifts s
    WHERE s.id = swap_requests.shift_id AND is_member_of_team(auth.uid(), s.team_id)
  )
);

-- Add policy: targeted worker can update swap request to accept/decline (status only)
DROP POLICY IF EXISTS "Targeted worker can respond to swap" ON public.swap_requests;
CREATE POLICY "Targeted worker can respond to swap"
ON public.swap_requests FOR UPDATE
USING (
  requested_worker_id = get_profile_id(auth.uid())
  AND status = 'pending'::swap_request_status
);

-- shift_requests
DROP POLICY IF EXISTS "Managers can view all team shift requests" ON public.shift_requests;
CREATE POLICY "Managers can view all team shift requests"
ON public.shift_requests FOR SELECT
USING (EXISTS (
  SELECT 1 FROM public.shifts s
  WHERE s.id = shift_requests.shift_id AND is_member_of_team(auth.uid(), s.team_id)
));

DROP POLICY IF EXISTS "Managers can update shift requests" ON public.shift_requests;
CREATE POLICY "Managers can update shift requests"
ON public.shift_requests FOR UPDATE
USING (
  (has_role(auth.uid(), 'manager'::app_role) OR has_role(auth.uid(), 'admin'::app_role))
  AND EXISTS (
    SELECT 1 FROM public.shifts s
    WHERE s.id = shift_requests.shift_id AND is_member_of_team(auth.uid(), s.team_id)
  )
);

-- shift_messages
DROP POLICY IF EXISTS "Users can view messages for their team shifts" ON public.shift_messages;
CREATE POLICY "Users can view messages for their team shifts"
ON public.shift_messages FOR SELECT
USING (EXISTS (
  SELECT 1 FROM public.shifts s
  WHERE s.id = shift_messages.shift_id AND is_member_of_team(auth.uid(), s.team_id)
));

-- call_off_requests
DROP POLICY IF EXISTS "Workers see own call-offs managers see team" ON public.call_off_requests;
CREATE POLICY "Workers see own call-offs managers see team"
ON public.call_off_requests FOR SELECT
USING (
  worker_id = get_profile_id(auth.uid())
  OR (
    (has_role(auth.uid(), 'manager'::app_role) OR has_role(auth.uid(), 'admin'::app_role))
    AND EXISTS (
      SELECT 1 FROM public.shifts s
      WHERE s.id = call_off_requests.shift_id AND is_member_of_team(auth.uid(), s.team_id)
    )
  )
);

DROP POLICY IF EXISTS "Managers can manage call-off requests" ON public.call_off_requests;
CREATE POLICY "Managers can manage call-off requests"
ON public.call_off_requests FOR UPDATE
USING (
  (has_role(auth.uid(), 'manager'::app_role) OR has_role(auth.uid(), 'admin'::app_role))
  AND EXISTS (
    SELECT 1 FROM public.shifts s
    WHERE s.id = call_off_requests.shift_id AND is_member_of_team(auth.uid(), s.team_id)
  )
);

-- profiles (managers see profiles of users that share any team with them)
DROP POLICY IF EXISTS "Managers can view team profiles" ON public.profiles;
CREATE POLICY "Managers can view team profiles"
ON public.profiles FOR SELECT
USING (
  (has_role(auth.uid(), 'manager'::app_role) OR has_role(auth.uid(), 'admin'::app_role))
  AND EXISTS (
    SELECT 1
    FROM public.team_memberships tm_target
    JOIN public.team_memberships tm_self ON tm_self.team_id = tm_target.team_id
    WHERE tm_target.user_id = profiles.user_id
      AND tm_self.user_id = auth.uid()
      AND tm_target.is_active = true
      AND tm_self.is_active = true
  )
);

DROP POLICY IF EXISTS "Managers can update team member profiles" ON public.profiles;
CREATE POLICY "Managers can update team member profiles"
ON public.profiles FOR UPDATE
USING (
  (has_role(auth.uid(), 'manager'::app_role) OR has_role(auth.uid(), 'admin'::app_role))
  AND EXISTS (
    SELECT 1
    FROM public.team_memberships tm_target
    JOIN public.team_memberships tm_self ON tm_self.team_id = tm_target.team_id
    WHERE tm_target.user_id = profiles.user_id
      AND tm_self.user_id = auth.uid()
      AND tm_target.is_active = true
      AND tm_self.is_active = true
  )
);

-- user_roles (managers see roles of teammates in any shared team)
DROP POLICY IF EXISTS "Managers can view team member roles" ON public.user_roles;
CREATE POLICY "Managers can view team member roles"
ON public.user_roles FOR SELECT TO authenticated
USING (
  (has_role(auth.uid(), 'manager'::app_role) OR has_role(auth.uid(), 'admin'::app_role))
  AND EXISTS (
    SELECT 1
    FROM public.team_memberships tm_target
    JOIN public.team_memberships tm_self ON tm_self.team_id = tm_target.team_id
    WHERE tm_target.user_id = user_roles.user_id
      AND tm_self.user_id = auth.uid()
      AND tm_target.is_active = true
      AND tm_self.is_active = true
  )
);

-- ============================================================================
-- 6. Update directory function to use active team
-- ============================================================================
CREATE OR REPLACE FUNCTION public.get_team_member_directory()
RETURNS TABLE(id uuid, full_name text, avatar_url text, role_position text)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT
    p.id,
    p.full_name,
    p.avatar_url,
    p.position AS role_position
  FROM public.profiles p
  JOIN public.team_memberships tm ON tm.user_id = p.user_id AND tm.is_active = true
  WHERE tm.team_id = public.get_user_active_team(auth.uid())
$$;

-- ============================================================================
-- 7. Update signup trigger to support invite tokens
-- ============================================================================
CREATE OR REPLACE FUNCTION public.handle_new_user_signup()
RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  _role app_role;
  _invite_token text;
  _invitation record;
BEGIN
  _invite_token := NEW.raw_user_meta_data ->> 'invitation_token';

  -- Look up invitation if token provided
  IF _invite_token IS NOT NULL AND _invite_token <> '' THEN
    SELECT * INTO _invitation
    FROM public.team_invitations
    WHERE token = _invite_token
      AND status = 'pending'
      AND expires_at > now()
    LIMIT 1;
  END IF;

  -- Determine role: invited users are workers; otherwise default to manager (first signup)
  IF _invitation.id IS NOT NULL THEN
    _role := 'worker'::app_role;
  ELSE
    _role := COALESCE(
      (NEW.raw_user_meta_data ->> 'role')::app_role,
      'manager'::app_role
    );
  END IF;

  IF _role = 'admin' THEN
    _role := 'worker';
  END IF;

  -- Create profile
  INSERT INTO public.profiles (user_id, full_name, email)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data ->> 'full_name', ''),
    COALESCE(NEW.email, '')
  )
  ON CONFLICT (user_id) DO NOTHING;

  -- Create role
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, _role)
  ON CONFLICT (user_id, role) DO NOTHING;

  -- If invited, attach to team
  IF _invitation.id IS NOT NULL THEN
    INSERT INTO public.team_memberships (user_id, team_id)
    VALUES (NEW.id, _invitation.team_id)
    ON CONFLICT (user_id, team_id) DO UPDATE SET is_active = true;

    UPDATE public.profiles
    SET team_id = _invitation.team_id,
        active_team_id = _invitation.team_id,
        organization_id = (SELECT organization_id FROM public.teams WHERE id = _invitation.team_id)
    WHERE user_id = NEW.id;

    UPDATE public.team_invitations
    SET status = 'accepted'
    WHERE id = _invitation.id;
  END IF;

  RETURN NEW;
END;
$$;

-- Ensure trigger exists
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user_signup();