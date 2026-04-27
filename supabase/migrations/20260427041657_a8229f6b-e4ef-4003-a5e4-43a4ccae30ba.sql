
-- 1) Tighten teams INSERT policy to prevent cross-org team creation
DROP POLICY IF EXISTS "Managers can create initial team" ON public.teams;

CREATE POLICY "Managers can create initial team"
  ON public.teams
  FOR INSERT
  TO authenticated
  WITH CHECK (
    (public.has_role(auth.uid(), 'manager'::app_role) OR public.has_role(auth.uid(), 'admin'::app_role))
    AND organization_id = public.get_user_organization(auth.uid())
    AND organization_id IS NOT NULL
  );

-- 2) Hide invitation token_hash column from authenticated/anon roles.
-- Managers only need id/team_id/email/status/expires_at to render the UI;
-- only the service role (via edge functions) needs to read token_hash to verify accept-invite.
REVOKE SELECT (token_hash) ON public.team_invitations FROM authenticated;
REVOKE SELECT (token_hash) ON public.team_invitations FROM anon;

-- Make sure managers can still read the non-sensitive columns they need
GRANT SELECT (id, team_id, email, invited_by, status, expires_at, created_at)
  ON public.team_invitations TO authenticated;

-- 3) Revoke EXECUTE on internal SECURITY DEFINER helper functions from anon / authenticated.
-- These are only meant to be called from inside RLS policies and other DB functions,
-- not directly via the PostgREST API. RLS policy evaluation runs as the table owner
-- and is unaffected by these EXECUTE grants.
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, app_role) FROM anon, authenticated, public;
REVOKE EXECUTE ON FUNCTION public.get_profile_id(uuid) FROM anon, authenticated, public;
REVOKE EXECUTE ON FUNCTION public.get_user_organization(uuid) FROM anon, authenticated, public;
REVOKE EXECUTE ON FUNCTION public.get_user_team(uuid) FROM anon, authenticated, public;
REVOKE EXECUTE ON FUNCTION public.get_user_active_team(uuid) FROM anon, authenticated, public;
REVOKE EXECUTE ON FUNCTION public.get_user_teams(uuid) FROM anon, authenticated, public;
REVOKE EXECUTE ON FUNCTION public.is_member_of_team(uuid, uuid) FROM anon, authenticated, public;
REVOKE EXECUTE ON FUNCTION public.is_active_team(uuid, uuid) FROM anon, authenticated, public;
REVOKE EXECUTE ON FUNCTION public.get_org_plan(uuid) FROM anon, authenticated, public;
REVOKE EXECUTE ON FUNCTION public.get_org_worker_count(uuid) FROM anon, authenticated, public;

-- get_team_member_directory IS intentionally exposed to authenticated users
-- (used by the worker team directory feature), so keep its EXECUTE grant.
GRANT EXECUTE ON FUNCTION public.get_team_member_directory() TO authenticated;
