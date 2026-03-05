
-- Create a secure signup helper that handles role assignment
-- This runs as SECURITY DEFINER to bypass the worker-only RLS policy
CREATE OR REPLACE FUNCTION public.handle_new_user_signup()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _role app_role;
BEGIN
  -- Get role from user metadata, default to 'worker'
  _role := COALESCE(
    (NEW.raw_user_meta_data ->> 'role')::app_role,
    'worker'::app_role
  );
  
  -- Only allow worker or manager via self-signup (not admin)
  IF _role = 'admin' THEN
    _role := 'worker';
  END IF;

  -- Create profile
  INSERT INTO public.profiles (user_id, full_name, email)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data ->> 'full_name', ''),
    COALESCE(NEW.email, '')
  )
  ON CONFLICT (user_id) DO NOTHING;

  -- Create role
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, _role)
  ON CONFLICT (user_id, role) DO NOTHING;

  RETURN NEW;
END;
$$;

-- Attach trigger to auth.users on insert
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user_signup();
