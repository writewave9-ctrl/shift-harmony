
-- Drop the restrictive admin-only policy that blocks managers
DROP POLICY IF EXISTS "Admins can manage organizations" ON public.organizations;

-- Drop the new policy we just created (will recreate properly)
DROP POLICY IF EXISTS "Managers can create organizations" ON public.organizations;
DROP POLICY IF EXISTS "Managers can update their organization" ON public.organizations;

-- Recreate as permissive policies
CREATE POLICY "Admins can manage organizations"
ON public.organizations FOR ALL
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Managers can create organizations"
ON public.organizations FOR INSERT
TO authenticated
WITH CHECK (
  has_role(auth.uid(), 'manager'::app_role)
  AND get_user_organization(auth.uid()) IS NULL
);

CREATE POLICY "Managers can update their organization"
ON public.organizations FOR UPDATE
TO authenticated
USING (
  id = get_user_organization(auth.uid())
  AND has_role(auth.uid(), 'manager'::app_role)
);

-- Fix teams table too - drop restrictive ALL policy
DROP POLICY IF EXISTS "Managers and admins can manage teams" ON public.teams;
DROP POLICY IF EXISTS "Managers can create teams" ON public.teams;

CREATE POLICY "Managers and admins can manage teams"
ON public.teams FOR ALL
TO authenticated
USING (
  (organization_id = get_user_organization(auth.uid()))
  AND (has_role(auth.uid(), 'manager'::app_role) OR has_role(auth.uid(), 'admin'::app_role))
)
WITH CHECK (
  has_role(auth.uid(), 'manager'::app_role) OR has_role(auth.uid(), 'admin'::app_role)
);
