-- 1. Remove the client-side INSERT policy on user_roles.
-- New user roles are assigned exclusively by the handle_new_user_signup trigger
-- (SECURITY DEFINER). Removing this policy eliminates the race-condition path
-- and prevents any client from inserting a row into user_roles directly.
DROP POLICY IF EXISTS "Users can insert worker role only" ON public.user_roles;

-- Add a unique constraint on user_id alone to enforce single-role-per-user at the DB level
-- (defense in depth). Drop the (user_id, role) unique because user_id alone implies it.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'user_roles_user_id_unique'
      AND conrelid = 'public.user_roles'::regclass
  ) THEN
    -- Only add if no duplicates exist
    IF NOT EXISTS (
      SELECT user_id FROM public.user_roles GROUP BY user_id HAVING COUNT(*) > 1
    ) THEN
      ALTER TABLE public.user_roles ADD CONSTRAINT user_roles_user_id_unique UNIQUE (user_id);
    END IF;
  END IF;
END $$;

-- 2. Update get_user_team to use active team memberships instead of stale profiles.team_id.
CREATE OR REPLACE FUNCTION public.get_user_team(_user_id uuid)
RETURNS uuid
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $function$
  SELECT COALESCE(
    (SELECT COALESCE(active_team_id, team_id) FROM public.profiles WHERE user_id = _user_id LIMIT 1),
    (SELECT team_id FROM public.team_memberships
     WHERE user_id = _user_id AND is_active = true
     ORDER BY joined_at ASC LIMIT 1)
  )
$function$;

-- 3. Restrict invitation SELECT to managers/admins of the team only.
-- Invited users obtain their token via email link and pass it to the accept-invite
-- edge function, which uses the service role to validate and consume it.
DROP POLICY IF EXISTS "Users can view their own invitations" ON public.team_invitations;

CREATE POLICY "Managers can view team invitations"
ON public.team_invitations
FOR SELECT
TO authenticated
USING (
  (has_role(auth.uid(), 'manager'::app_role) OR has_role(auth.uid(), 'admin'::app_role))
  AND team_id = get_user_team(auth.uid())
);