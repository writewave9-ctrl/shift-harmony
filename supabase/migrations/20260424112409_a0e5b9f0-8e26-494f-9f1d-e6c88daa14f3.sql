
-- 1. Tighten swap_requests targeted-worker UPDATE with WITH CHECK.
-- The worker can either accept (status=approved, approved_by=themselves) or
-- decline. They cannot reassign the shift, change the requester, or escalate
-- a different worker's swap.
DROP POLICY IF EXISTS "Targeted worker can respond to swap" ON public.swap_requests;

CREATE POLICY "Targeted worker can respond to swap"
ON public.swap_requests
FOR UPDATE
USING (
  requested_worker_id = public.get_profile_id(auth.uid())
  AND status = 'pending'::swap_request_status
)
WITH CHECK (
  requested_worker_id = public.get_profile_id(auth.uid())
  AND status IN ('approved'::swap_request_status, 'declined'::swap_request_status)
  AND approved_by = public.get_profile_id(auth.uid())
);

-- 2. Hide invitation tokens at the column level.
-- The accept-invite edge function uses the service role and is unaffected.
REVOKE SELECT (token) ON public.team_invitations FROM authenticated;
REVOKE SELECT (token) ON public.team_invitations FROM anon;
