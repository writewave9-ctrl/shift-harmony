-- Create shift_templates table for recurring shifts
CREATE TABLE public.shift_templates (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  team_id UUID NOT NULL REFERENCES public.teams(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  position TEXT NOT NULL,
  location TEXT NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  latitude NUMERIC,
  longitude NUMERIC,
  check_in_radius_meters INTEGER DEFAULT 100,
  notes TEXT,
  days_of_week INTEGER[] DEFAULT '{}', -- 0=Sunday, 1=Monday, etc.
  is_active BOOLEAN DEFAULT true,
  created_by UUID REFERENCES public.profiles(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.shift_templates ENABLE ROW LEVEL SECURITY;

-- RLS policies for shift_templates
CREATE POLICY "Users can view templates in their team"
  ON public.shift_templates
  FOR SELECT
  USING (team_id = get_user_team(auth.uid()));

CREATE POLICY "Managers can manage templates"
  ON public.shift_templates
  FOR ALL
  USING (
    team_id = get_user_team(auth.uid()) 
    AND (has_role(auth.uid(), 'manager') OR has_role(auth.uid(), 'admin'))
  );

-- Add updated_at trigger
CREATE TRIGGER update_shift_templates_updated_at
  BEFORE UPDATE ON public.shift_templates
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- Add priority field to notifications for push notification ordering
ALTER TABLE public.notifications ADD COLUMN IF NOT EXISTS priority TEXT DEFAULT 'normal';

-- Enable realtime for shift_templates
ALTER PUBLICATION supabase_realtime ADD TABLE public.shift_templates;