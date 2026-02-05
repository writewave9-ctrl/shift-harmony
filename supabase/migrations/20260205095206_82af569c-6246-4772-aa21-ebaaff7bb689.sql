-- Create team_invitations table
CREATE TABLE public.team_invitations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id UUID NOT NULL REFERENCES public.teams(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  invited_by UUID NOT NULL REFERENCES public.profiles(id),
  token TEXT NOT NULL UNIQUE DEFAULT encode(gen_random_bytes(32), 'hex'),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'expired')),
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT (now() + interval '7 days'),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(team_id, email)
);

-- Enable RLS
ALTER TABLE public.team_invitations ENABLE ROW LEVEL SECURITY;

-- Managers can manage invitations for their team
CREATE POLICY "Managers can manage team invitations"
ON public.team_invitations
FOR ALL
USING (
  (has_role(auth.uid(), 'manager') OR has_role(auth.uid(), 'admin'))
  AND team_id = get_user_team(auth.uid())
);

-- Anyone can view invitation by token (for accepting)
CREATE POLICY "Anyone can view invitation by token"
ON public.team_invitations
FOR SELECT
USING (true);

-- Add location coordinates to shifts for proximity check-in
ALTER TABLE public.shifts 
ADD COLUMN IF NOT EXISTS latitude DECIMAL(10, 8),
ADD COLUMN IF NOT EXISTS longitude DECIMAL(11, 8),
ADD COLUMN IF NOT EXISTS check_in_radius_meters INTEGER DEFAULT 100;

-- Add location to teams for default coordinates
ALTER TABLE public.teams
ADD COLUMN IF NOT EXISTS latitude DECIMAL(10, 8),
ADD COLUMN IF NOT EXISTS longitude DECIMAL(11, 8);

-- Enable realtime for team_invitations
ALTER PUBLICATION supabase_realtime ADD TABLE public.team_invitations;