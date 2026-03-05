
-- Fix: Workers should only see their own attendance records, not all team members'
DROP POLICY IF EXISTS "Users can view attendance in their team" ON public.attendance_records;

CREATE POLICY "Workers can view own attendance" 
ON public.attendance_records
FOR SELECT
TO authenticated
USING (
  worker_id = get_profile_id(auth.uid())
  OR has_role(auth.uid(), 'manager'::app_role)
  OR has_role(auth.uid(), 'admin'::app_role)
);

-- Ensure the notify_swap_request_changes trigger exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'on_swap_request_change'
  ) THEN
    CREATE TRIGGER on_swap_request_change
      AFTER INSERT OR UPDATE ON public.swap_requests
      FOR EACH ROW
      EXECUTE FUNCTION public.notify_swap_request_changes();
  END IF;
END $$;
