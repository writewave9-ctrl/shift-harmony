
-- Allow managers to create organizations (for initial workspace setup)
CREATE POLICY "Managers can create organizations"
ON public.organizations FOR INSERT
TO authenticated
WITH CHECK (
  has_role(auth.uid(), 'manager'::app_role)
  AND get_user_organization(auth.uid()) IS NULL
);

-- Allow managers to update their own organization
CREATE POLICY "Managers can update their organization"
ON public.organizations FOR UPDATE
TO authenticated
USING (
  id = get_user_organization(auth.uid())
  AND (has_role(auth.uid(), 'manager'::app_role) OR has_role(auth.uid(), 'admin'::app_role))
);

-- Allow managers to create teams in their organization (or when setting up)
CREATE POLICY "Managers can create teams"
ON public.teams FOR INSERT
TO authenticated
WITH CHECK (
  has_role(auth.uid(), 'manager'::app_role) OR has_role(auth.uid(), 'admin'::app_role)
);

-- Allow managers to update profile org/team during setup
CREATE POLICY "Managers can update team member profiles"
ON public.profiles FOR UPDATE
TO authenticated
USING (
  (has_role(auth.uid(), 'manager'::app_role) OR has_role(auth.uid(), 'admin'::app_role))
  AND team_id = get_user_team(auth.uid())
);
