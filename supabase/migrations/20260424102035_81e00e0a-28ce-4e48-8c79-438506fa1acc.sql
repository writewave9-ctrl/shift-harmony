-- 1. team_memberships: require valid invitation for joining
DROP POLICY IF EXISTS "Users can join via invitation" ON public.team_memberships;
CREATE POLICY "Users can join via invitation"
ON public.team_memberships
FOR INSERT
WITH CHECK (
  user_id = auth.uid()
  AND EXISTS (
    SELECT 1 FROM public.team_invitations ti
    WHERE ti.team_id = team_memberships.team_id
      AND ti.status = 'pending'
      AND ti.expires_at > now()
      AND lower(ti.email) = lower(COALESCE((auth.jwt() ->> 'email'), ''))
  )
);

-- 2. attendance_records: scope manager view to their team
DROP POLICY IF EXISTS "Workers can view own attendance" ON public.attendance_records;
CREATE POLICY "Workers and team managers can view attendance"
ON public.attendance_records
FOR SELECT
USING (
  worker_id = public.get_profile_id(auth.uid())
  OR (
    (public.has_role(auth.uid(), 'manager'::app_role) OR public.has_role(auth.uid(), 'admin'::app_role))
    AND EXISTS (
      SELECT 1 FROM public.shifts s
      WHERE s.id = attendance_records.shift_id
        AND public.is_member_of_team(auth.uid(), s.team_id)
    )
  )
);

-- 3. shift_messages: validate sender is in the shift's team
DROP POLICY IF EXISTS "Users can send messages" ON public.shift_messages;
CREATE POLICY "Team members can send shift messages"
ON public.shift_messages
FOR INSERT
WITH CHECK (
  sender_id = public.get_profile_id(auth.uid())
  AND EXISTS (
    SELECT 1 FROM public.shifts s
    WHERE s.id = shift_messages.shift_id
      AND public.is_member_of_team(auth.uid(), s.team_id)
  )
);

-- 4. shift_requests: restrict the broad team SELECT to managers/admins
DROP POLICY IF EXISTS "Managers can view all team shift requests" ON public.shift_requests;
CREATE POLICY "Managers can view all team shift requests"
ON public.shift_requests
FOR SELECT
TO authenticated
USING (
  (public.has_role(auth.uid(), 'manager'::app_role) OR public.has_role(auth.uid(), 'admin'::app_role))
  AND EXISTS (
    SELECT 1 FROM public.shifts s
    WHERE s.id = shift_requests.shift_id
      AND public.is_member_of_team(auth.uid(), s.team_id)
  )
);

-- 5. notifications: managers can only notify users in same organization
DROP POLICY IF EXISTS "Managers can create notifications" ON public.notifications;
CREATE POLICY "Managers can create notifications"
ON public.notifications
FOR INSERT
WITH CHECK (
  user_id = auth.uid()
  OR (
    (public.has_role(auth.uid(), 'manager'::app_role) OR public.has_role(auth.uid(), 'admin'::app_role))
    AND public.get_user_organization(notifications.user_id) = public.get_user_organization(auth.uid())
    AND public.get_user_organization(notifications.user_id) IS NOT NULL
  )
);