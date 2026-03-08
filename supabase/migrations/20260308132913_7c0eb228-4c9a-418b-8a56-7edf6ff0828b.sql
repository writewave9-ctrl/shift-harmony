
-- Add a permissive INSERT policy for teams that allows managers during initial setup
CREATE POLICY "Managers can create initial team"
ON public.teams FOR INSERT
TO authenticated
WITH CHECK (
  has_role(auth.uid(), 'manager'::app_role) OR has_role(auth.uid(), 'admin'::app_role)
);
