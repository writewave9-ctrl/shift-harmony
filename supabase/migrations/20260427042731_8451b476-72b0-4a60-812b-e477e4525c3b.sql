-- Revoke anonymous EXECUTE on get_team_member_directory; keep authenticated access
-- because the function uses auth.uid() internally to scope results to the caller's team.
REVOKE EXECUTE ON FUNCTION public.get_team_member_directory() FROM anon, public;

-- Defensive re-grant for authenticated callers (worker directory page).
GRANT EXECUTE ON FUNCTION public.get_team_member_directory() TO authenticated;