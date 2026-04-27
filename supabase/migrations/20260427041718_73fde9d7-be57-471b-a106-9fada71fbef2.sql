
REVOKE EXECUTE ON FUNCTION public.enqueue_due_shift_reminders() FROM anon, authenticated, public;
REVOKE EXECUTE ON FUNCTION public.handle_new_user_signup() FROM anon, authenticated, public;
REVOKE EXECUTE ON FUNCTION public.notify_shift_request_changes() FROM anon, authenticated, public;
REVOKE EXECUTE ON FUNCTION public.notify_swap_request_changes() FROM anon, authenticated, public;
REVOKE EXECUTE ON FUNCTION public.set_ticket_priority_from_plan() FROM anon, authenticated, public;
