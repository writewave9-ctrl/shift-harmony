-- =========================================================================
-- Fix 1: Privilege escalation risk on public.user_roles
-- Add explicit WITH CHECK to the admin-manage policy and ensure the
-- "Block direct role inserts" policy is genuinely restrictive (it currently
-- only protects admin self-insert; no non-admin can insert anyway because
-- the ALL admin policy is the only INSERT-permitting policy alongside it).
-- We tighten by:
--   * Recreating the admin manage policy with both USING and WITH CHECK
--   * Replacing the permissive "Block direct role inserts" with a RESTRICTIVE
--     policy that blocks ALL direct inserts unless caller is admin, providing
--     defense-in-depth even if another permissive INSERT policy is added later.
-- =========================================================================

DROP POLICY IF EXISTS "Admins can manage roles" ON public.user_roles;
CREATE POLICY "Admins can manage roles"
  ON public.user_roles
  FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

DROP POLICY IF EXISTS "Block direct role inserts" ON public.user_roles;
CREATE POLICY "Restrict role inserts to admins"
  ON public.user_roles
  AS RESTRICTIVE
  FOR INSERT
  TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

-- Also restrict UPDATE/DELETE with a defense-in-depth restrictive policy
CREATE POLICY "Restrict role updates to admins"
  ON public.user_roles
  AS RESTRICTIVE
  FOR UPDATE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Restrict role deletes to admins"
  ON public.user_roles
  AS RESTRICTIVE
  FOR DELETE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role));

-- =========================================================================
-- Fix 2: Team invitation token exposure
-- Managers currently can SELECT the raw `token` column of pending invites,
-- letting any manager hijack a pending invitation by joining as the invitee.
-- We revoke column-level SELECT on `token` for the `authenticated` and
-- `anon` roles. The service role (used by the accept-invite edge function)
-- retains full access. Token is only used server-side.
-- =========================================================================

REVOKE SELECT (token) ON public.team_invitations FROM authenticated;
REVOKE SELECT (token) ON public.team_invitations FROM anon;

-- Grant SELECT on all OTHER columns explicitly so manager UI keeps working
GRANT SELECT
  (id, team_id, email, invited_by, status, expires_at, created_at)
  ON public.team_invitations TO authenticated;