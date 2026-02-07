-- Add team_settings table for manager preferences
CREATE TABLE IF NOT EXISTS public.team_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id uuid REFERENCES public.teams(id) ON DELETE CASCADE NOT NULL UNIQUE,
  default_check_in_radius_meters integer DEFAULT 100,
  notification_shift_reminder_hours integer DEFAULT 2,
  notification_swap_requests boolean DEFAULT true,
  notification_attendance_alerts boolean DEFAULT true,
  allow_worker_shift_requests boolean DEFAULT true,
  auto_approve_swaps boolean DEFAULT false,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  updated_at timestamp with time zone DEFAULT now() NOT NULL
);

-- Enable RLS
ALTER TABLE public.team_settings ENABLE ROW LEVEL SECURITY;

-- RLS Policies for team_settings
CREATE POLICY "Users can view their team settings"
  ON public.team_settings FOR SELECT
  USING (team_id = get_user_team(auth.uid()));

CREATE POLICY "Managers can manage team settings"
  ON public.team_settings FOR ALL
  USING (
    team_id = get_user_team(auth.uid()) 
    AND (has_role(auth.uid(), 'manager') OR has_role(auth.uid(), 'admin'))
  );

-- Add shift_requests table for workers to request open shifts
CREATE TABLE IF NOT EXISTS public.shift_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  shift_id uuid REFERENCES public.shifts(id) ON DELETE CASCADE NOT NULL,
  worker_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  status text DEFAULT 'pending' NOT NULL CHECK (status IN ('pending', 'approved', 'declined')),
  notes text,
  reviewed_by uuid REFERENCES public.profiles(id),
  reviewed_at timestamp with time zone,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  updated_at timestamp with time zone DEFAULT now() NOT NULL,
  UNIQUE(shift_id, worker_id)
);

-- Enable RLS
ALTER TABLE public.shift_requests ENABLE ROW LEVEL SECURITY;

-- RLS Policies for shift_requests
CREATE POLICY "Workers can view their own requests"
  ON public.shift_requests FOR SELECT
  USING (worker_id = get_profile_id(auth.uid()));

CREATE POLICY "Managers can view all team shift requests"
  ON public.shift_requests FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM shifts s 
      WHERE s.id = shift_requests.shift_id 
      AND s.team_id = get_user_team(auth.uid())
    )
  );

CREATE POLICY "Workers can create shift requests"
  ON public.shift_requests FOR INSERT
  WITH CHECK (worker_id = get_profile_id(auth.uid()));

CREATE POLICY "Managers can update shift requests"
  ON public.shift_requests FOR UPDATE
  USING (
    (has_role(auth.uid(), 'manager') OR has_role(auth.uid(), 'admin'))
    AND EXISTS (
      SELECT 1 FROM shifts s 
      WHERE s.id = shift_requests.shift_id 
      AND s.team_id = get_user_team(auth.uid())
    )
  );

-- Enable realtime for shift_requests
ALTER PUBLICATION supabase_realtime ADD TABLE public.shift_requests;

-- Create updated_at trigger for team_settings
CREATE TRIGGER update_team_settings_updated_at
  BEFORE UPDATE ON public.team_settings
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- Create updated_at trigger for shift_requests
CREATE TRIGGER update_shift_requests_updated_at
  BEFORE UPDATE ON public.shift_requests
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();