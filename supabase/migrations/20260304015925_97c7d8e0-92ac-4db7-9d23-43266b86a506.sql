-- Fix critical: notification INSERT should only allow system functions or self-created
DROP POLICY IF EXISTS "Authenticated users can create notifications" ON public.notifications;

-- Managers can create notifications for their team members
CREATE POLICY "Managers can create notifications"
ON public.notifications
FOR INSERT
TO authenticated
WITH CHECK (
  (public.has_role(auth.uid(), 'manager'::public.app_role)
   OR public.has_role(auth.uid(), 'admin'::public.app_role))
  OR user_id = auth.uid()
);

-- Fix: attendance records INSERT should validate shift assignment  
DROP POLICY IF EXISTS "Workers can check in to their own shifts" ON public.attendance_records;
CREATE POLICY "Workers can check in to their own assigned shifts"
ON public.attendance_records
FOR INSERT
TO authenticated
WITH CHECK (
  worker_id = public.get_profile_id(auth.uid())
  AND EXISTS (
    SELECT 1 FROM public.shifts s
    WHERE s.id = shift_id
    AND s.assigned_worker_id = worker_id
  )
);

-- Fix: call-off request details only visible to requester + managers
DROP POLICY IF EXISTS "Users can view call-off requests in their team" ON public.call_off_requests;
CREATE POLICY "Workers see own call-offs, managers see team"
ON public.call_off_requests
FOR SELECT
TO authenticated
USING (
  worker_id = public.get_profile_id(auth.uid())
  OR (
    (public.has_role(auth.uid(), 'manager'::public.app_role)
     OR public.has_role(auth.uid(), 'admin'::public.app_role))
    AND EXISTS (
      SELECT 1 FROM public.shifts s
      WHERE s.id = call_off_requests.shift_id
      AND s.team_id = public.get_user_team(auth.uid())
    )
  )
);