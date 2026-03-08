
CREATE OR REPLACE FUNCTION public.notify_shift_request_changes()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO public.notifications (user_id, type, title, message, priority, related_shift_id)
    SELECT
      manager_profile.user_id,
      'shift_request',
      'New shift request',
      COALESCE(worker.full_name, 'A worker') || ' requested to pick up a shift.',
      'high',
      NEW.shift_id
    FROM public.shifts s
    JOIN public.profiles manager_profile ON manager_profile.team_id = s.team_id
    JOIN public.user_roles ur ON ur.user_id = manager_profile.user_id AND ur.role IN ('manager', 'admin')
    LEFT JOIN public.profiles worker ON worker.id = NEW.worker_id
    WHERE s.id = NEW.shift_id;

  ELSIF TG_OP = 'UPDATE' AND OLD.status IS DISTINCT FROM NEW.status AND NEW.status IN ('approved', 'declined') THEN
    INSERT INTO public.notifications (user_id, type, title, message, priority, related_shift_id)
    SELECT
      worker.user_id,
      'shift_request',
      CASE WHEN NEW.status = 'approved' THEN 'Shift request approved!' ELSE 'Shift request declined' END,
      CASE WHEN NEW.status = 'approved'
        THEN 'Your shift request was approved. You have been assigned to the shift.'
        ELSE 'Your shift request was not approved.'
      END,
      CASE WHEN NEW.status = 'approved' THEN 'normal' ELSE 'high' END,
      NEW.shift_id
    FROM public.profiles worker
    WHERE worker.id = NEW.worker_id;
  END IF;

  RETURN NEW;
END;
$function$;

CREATE TRIGGER on_shift_request_change
  AFTER INSERT OR UPDATE ON public.shift_requests
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_shift_request_changes();
