
-- Allow managers to view roles of users in their team
CREATE POLICY "Managers can view team member roles"
ON public.user_roles
FOR SELECT
TO authenticated
USING (
  (has_role(auth.uid(), 'manager'::app_role) OR has_role(auth.uid(), 'admin'::app_role))
  AND EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.user_id = user_roles.user_id
    AND p.team_id = get_user_team(auth.uid())
  )
);
