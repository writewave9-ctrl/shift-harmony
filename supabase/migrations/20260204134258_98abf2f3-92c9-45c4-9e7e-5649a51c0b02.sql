-- Create enum types
CREATE TYPE public.app_role AS ENUM ('admin', 'manager', 'worker');
CREATE TYPE public.shift_status AS ENUM ('scheduled', 'in_progress', 'completed', 'cancelled');
CREATE TYPE public.attendance_status AS ENUM ('present', 'late', 'not_checked_in', 'manually_approved', 'absent');
CREATE TYPE public.swap_request_status AS ENUM ('pending', 'approved', 'declined', 'expired');
CREATE TYPE public.call_off_reason AS ENUM ('sick', 'family_emergency', 'transportation', 'personal', 'other');
CREATE TYPE public.willingness_level AS ENUM ('low', 'medium', 'high');
CREATE TYPE public.availability_type AS ENUM ('blocked', 'preferred');

-- Organizations table
CREATE TABLE public.organizations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Teams table (within organizations)
CREATE TABLE public.teams (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  location TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- User profiles table
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  organization_id UUID REFERENCES public.organizations(id) ON DELETE SET NULL,
  team_id UUID REFERENCES public.teams(id) ON DELETE SET NULL,
  full_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  avatar_url TEXT,
  position TEXT,
  weekly_hours_target INTEGER DEFAULT 40,
  willingness_for_extra willingness_level DEFAULT 'medium',
  reliability_score INTEGER DEFAULT 80 CHECK (reliability_score >= 0 AND reliability_score <= 100),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- User roles table (separate for security)
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  UNIQUE (user_id, role)
);

-- Shifts table
CREATE TABLE public.shifts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id UUID REFERENCES public.teams(id) ON DELETE CASCADE NOT NULL,
  assigned_worker_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  date DATE NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  position TEXT NOT NULL,
  location TEXT NOT NULL,
  status shift_status DEFAULT 'scheduled' NOT NULL,
  is_vacant BOOLEAN DEFAULT false NOT NULL,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Attendance records table
CREATE TABLE public.attendance_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  shift_id UUID REFERENCES public.shifts(id) ON DELETE CASCADE NOT NULL,
  worker_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  status attendance_status DEFAULT 'not_checked_in' NOT NULL,
  check_in_time TIMESTAMP WITH TIME ZONE,
  check_out_time TIMESTAMP WITH TIME ZONE,
  is_proximity_based BOOLEAN DEFAULT false,
  manual_override_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  override_notes TEXT,
  override_timestamp TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  UNIQUE (shift_id, worker_id)
);

-- Worker availability settings
CREATE TABLE public.availability_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  worker_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  day_of_week INTEGER CHECK (day_of_week >= 0 AND day_of_week <= 6), -- 0=Sunday, 6=Saturday
  specific_date DATE,
  start_time TIME,
  end_time TIME,
  availability_type availability_type DEFAULT 'blocked' NOT NULL,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Swap requests table
CREATE TABLE public.swap_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  shift_id UUID REFERENCES public.shifts(id) ON DELETE CASCADE NOT NULL,
  requester_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  requested_worker_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  reason TEXT NOT NULL,
  status swap_request_status DEFAULT 'pending' NOT NULL,
  is_open_to_all BOOLEAN DEFAULT false,
  approved_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Call-off requests table
CREATE TABLE public.call_off_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  shift_id UUID REFERENCES public.shifts(id) ON DELETE CASCADE NOT NULL,
  worker_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  reason call_off_reason NOT NULL,
  custom_reason TEXT,
  status swap_request_status DEFAULT 'pending' NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Notifications table
CREATE TABLE public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  read BOOLEAN DEFAULT false NOT NULL,
  action_url TEXT,
  related_shift_id UUID REFERENCES public.shifts(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Shift messages table
CREATE TABLE public.shift_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  shift_id UUID REFERENCES public.shifts(id) ON DELETE CASCADE NOT NULL,
  sender_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  message TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Enable RLS on all tables
ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shifts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attendance_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.availability_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.swap_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.call_off_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shift_messages ENABLE ROW LEVEL SECURITY;

-- Security definer function to check roles
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- Function to get user's profile id
CREATE OR REPLACE FUNCTION public.get_profile_id(_user_id UUID)
RETURNS UUID
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT id FROM public.profiles WHERE user_id = _user_id LIMIT 1
$$;

-- Function to get user's organization
CREATE OR REPLACE FUNCTION public.get_user_organization(_user_id UUID)
RETURNS UUID
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT organization_id FROM public.profiles WHERE user_id = _user_id LIMIT 1
$$;

-- Function to get user's team
CREATE OR REPLACE FUNCTION public.get_user_team(_user_id UUID)
RETURNS UUID
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT team_id FROM public.profiles WHERE user_id = _user_id LIMIT 1
$$;

-- RLS Policies for organizations
CREATE POLICY "Users can view their organization"
  ON public.organizations FOR SELECT
  USING (id = public.get_user_organization(auth.uid()));

CREATE POLICY "Admins can manage organizations"
  ON public.organizations FOR ALL
  USING (public.has_role(auth.uid(), 'admin'));

-- RLS Policies for teams
CREATE POLICY "Users can view teams in their organization"
  ON public.teams FOR SELECT
  USING (organization_id = public.get_user_organization(auth.uid()));

CREATE POLICY "Managers and admins can manage teams"
  ON public.teams FOR ALL
  USING (
    organization_id = public.get_user_organization(auth.uid()) AND
    (public.has_role(auth.uid(), 'manager') OR public.has_role(auth.uid(), 'admin'))
  );

-- RLS Policies for profiles
CREATE POLICY "Users can view profiles in their team/organization"
  ON public.profiles FOR SELECT
  USING (
    organization_id = public.get_user_organization(auth.uid()) OR
    user_id = auth.uid()
  );

CREATE POLICY "Users can update their own profile"
  ON public.profiles FOR UPDATE
  USING (user_id = auth.uid());

CREATE POLICY "Users can insert their own profile"
  ON public.profiles FOR INSERT
  WITH CHECK (user_id = auth.uid());

-- RLS Policies for user_roles
CREATE POLICY "Users can view their own roles"
  ON public.user_roles FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Admins can manage roles"
  ON public.user_roles FOR ALL
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Users can insert their initial role"
  ON public.user_roles FOR INSERT
  WITH CHECK (user_id = auth.uid());

-- RLS Policies for shifts
CREATE POLICY "Users can view shifts in their team"
  ON public.shifts FOR SELECT
  USING (team_id = public.get_user_team(auth.uid()));

CREATE POLICY "Managers can manage shifts"
  ON public.shifts FOR ALL
  USING (
    team_id = public.get_user_team(auth.uid()) AND
    (public.has_role(auth.uid(), 'manager') OR public.has_role(auth.uid(), 'admin'))
  );

-- RLS Policies for attendance_records
CREATE POLICY "Users can view attendance in their team"
  ON public.attendance_records FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.shifts s
      WHERE s.id = shift_id AND s.team_id = public.get_user_team(auth.uid())
    )
  );

CREATE POLICY "Workers can check in to their own shifts"
  ON public.attendance_records FOR INSERT
  WITH CHECK (worker_id = public.get_profile_id(auth.uid()));

CREATE POLICY "Workers can update their own attendance"
  ON public.attendance_records FOR UPDATE
  USING (worker_id = public.get_profile_id(auth.uid()));

CREATE POLICY "Managers can manage attendance"
  ON public.attendance_records FOR ALL
  USING (
    (public.has_role(auth.uid(), 'manager') OR public.has_role(auth.uid(), 'admin')) AND
    EXISTS (
      SELECT 1 FROM public.shifts s
      WHERE s.id = shift_id AND s.team_id = public.get_user_team(auth.uid())
    )
  );

-- RLS Policies for availability_settings
CREATE POLICY "Workers can view their own availability"
  ON public.availability_settings FOR SELECT
  USING (worker_id = public.get_profile_id(auth.uid()));

CREATE POLICY "Managers can view team availability"
  ON public.availability_settings FOR SELECT
  USING (
    (public.has_role(auth.uid(), 'manager') OR public.has_role(auth.uid(), 'admin')) AND
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = worker_id AND p.team_id = public.get_user_team(auth.uid())
    )
  );

CREATE POLICY "Workers can manage their own availability"
  ON public.availability_settings FOR ALL
  USING (worker_id = public.get_profile_id(auth.uid()));

-- RLS Policies for swap_requests
CREATE POLICY "Users can view swap requests in their team"
  ON public.swap_requests FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.shifts s
      WHERE s.id = shift_id AND s.team_id = public.get_user_team(auth.uid())
    )
  );

CREATE POLICY "Workers can create swap requests"
  ON public.swap_requests FOR INSERT
  WITH CHECK (requester_id = public.get_profile_id(auth.uid()));

CREATE POLICY "Managers can manage swap requests"
  ON public.swap_requests FOR UPDATE
  USING (
    (public.has_role(auth.uid(), 'manager') OR public.has_role(auth.uid(), 'admin')) AND
    EXISTS (
      SELECT 1 FROM public.shifts s
      WHERE s.id = shift_id AND s.team_id = public.get_user_team(auth.uid())
    )
  );

-- RLS Policies for call_off_requests
CREATE POLICY "Users can view call-off requests in their team"
  ON public.call_off_requests FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.shifts s
      WHERE s.id = shift_id AND s.team_id = public.get_user_team(auth.uid())
    )
  );

CREATE POLICY "Workers can create call-off requests"
  ON public.call_off_requests FOR INSERT
  WITH CHECK (worker_id = public.get_profile_id(auth.uid()));

CREATE POLICY "Managers can manage call-off requests"
  ON public.call_off_requests FOR UPDATE
  USING (
    (public.has_role(auth.uid(), 'manager') OR public.has_role(auth.uid(), 'admin')) AND
    EXISTS (
      SELECT 1 FROM public.shifts s
      WHERE s.id = shift_id AND s.team_id = public.get_user_team(auth.uid())
    )
  );

-- RLS Policies for notifications
CREATE POLICY "Users can view their own notifications"
  ON public.notifications FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Users can update their own notifications"
  ON public.notifications FOR UPDATE
  USING (user_id = auth.uid());

CREATE POLICY "System can create notifications"
  ON public.notifications FOR INSERT
  WITH CHECK (true);

-- RLS Policies for shift_messages
CREATE POLICY "Users can view messages for their team shifts"
  ON public.shift_messages FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.shifts s
      WHERE s.id = shift_id AND s.team_id = public.get_user_team(auth.uid())
    )
  );

CREATE POLICY "Users can send messages"
  ON public.shift_messages FOR INSERT
  WITH CHECK (sender_id = public.get_profile_id(auth.uid()));

-- Enable realtime for notifications
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;
ALTER PUBLICATION supabase_realtime ADD TABLE public.attendance_records;
ALTER PUBLICATION supabase_realtime ADD TABLE public.swap_requests;

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply updated_at triggers
CREATE TRIGGER handle_organizations_updated_at BEFORE UPDATE ON public.organizations FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
CREATE TRIGGER handle_teams_updated_at BEFORE UPDATE ON public.teams FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
CREATE TRIGGER handle_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
CREATE TRIGGER handle_shifts_updated_at BEFORE UPDATE ON public.shifts FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
CREATE TRIGGER handle_attendance_records_updated_at BEFORE UPDATE ON public.attendance_records FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
CREATE TRIGGER handle_availability_settings_updated_at BEFORE UPDATE ON public.availability_settings FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
CREATE TRIGGER handle_swap_requests_updated_at BEFORE UPDATE ON public.swap_requests FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
CREATE TRIGGER handle_call_off_requests_updated_at BEFORE UPDATE ON public.call_off_requests FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();