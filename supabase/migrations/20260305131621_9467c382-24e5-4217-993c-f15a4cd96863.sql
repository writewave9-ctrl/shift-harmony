
-- Restrict initial role insertion to only 'worker' role to prevent privilege escalation
DROP POLICY IF EXISTS "Users can insert their initial role" ON public.user_roles;

CREATE POLICY "Users can insert worker role only" ON public.user_roles 
FOR INSERT WITH CHECK (
  user_id = auth.uid() 
  AND role = 'worker'::app_role
  AND NOT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid())
);
