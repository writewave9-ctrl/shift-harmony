-- 1. Tighten attendance_records UPDATE for workers: prevent override field tampering
DROP POLICY IF EXISTS "Workers can update their own attendance" ON public.attendance_records;

CREATE POLICY "Workers can update their own attendance"
ON public.attendance_records
FOR UPDATE
USING (worker_id = public.get_profile_id(auth.uid()))
WITH CHECK (
  worker_id = public.get_profile_id(auth.uid())
  -- Workers cannot set/modify manager-only override fields
  AND manual_override_by IS NULL
  AND override_timestamp IS NULL
  AND override_notes IS NULL
);

-- 2. Explicit deny for non-admin direct inserts into user_roles.
-- The handle_new_user_signup trigger uses SECURITY DEFINER and bypasses RLS,
-- so trigger-driven role assignment is unaffected. Direct client inserts are blocked.
DROP POLICY IF EXISTS "Block direct role inserts" ON public.user_roles;
CREATE POLICY "Block direct role inserts"
ON public.user_roles
FOR INSERT
TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

-- 3. Remove team_invitations from realtime publication (tokens must not be broadcast)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime'
      AND schemaname = 'public'
      AND tablename = 'team_invitations'
  ) THEN
    EXECUTE 'ALTER PUBLICATION supabase_realtime DROP TABLE public.team_invitations';
  END IF;
END $$;