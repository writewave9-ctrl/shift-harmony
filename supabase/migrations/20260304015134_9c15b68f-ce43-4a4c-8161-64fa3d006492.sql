-- Replace security-definer view with controlled RPC function
DROP VIEW IF EXISTS public.team_member_directory;

CREATE OR REPLACE FUNCTION public.get_team_member_directory()
RETURNS TABLE (
  id UUID,
  full_name TEXT,
  avatar_url TEXT,
  role_position TEXT
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    p.id,
    p.full_name,
    p.avatar_url,
    p.position AS role_position
  FROM public.profiles p
  WHERE p.team_id = public.get_user_team(auth.uid());
$$;

GRANT EXECUTE ON FUNCTION public.get_team_member_directory() TO authenticated;