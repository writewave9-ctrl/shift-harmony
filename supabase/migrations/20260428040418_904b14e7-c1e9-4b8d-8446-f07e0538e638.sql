-- Persistent shift message read receipts
CREATE TABLE IF NOT EXISTS public.shift_message_reads (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  message_id UUID NOT NULL REFERENCES public.shift_messages(id) ON DELETE CASCADE,
  shift_id UUID NOT NULL,
  user_id UUID NOT NULL,
  read_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE (message_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_shift_message_reads_shift ON public.shift_message_reads(shift_id);
CREATE INDEX IF NOT EXISTS idx_shift_message_reads_message ON public.shift_message_reads(message_id);
CREATE INDEX IF NOT EXISTS idx_shift_message_reads_user ON public.shift_message_reads(user_id);

ALTER TABLE public.shift_message_reads ENABLE ROW LEVEL SECURITY;

-- Insert: only for self, and only if the user is a team member of the shift
CREATE POLICY "Users mark their own reads on team shifts"
ON public.shift_message_reads
FOR INSERT
TO authenticated
WITH CHECK (
  user_id = auth.uid()
  AND EXISTS (
    SELECT 1 FROM public.shifts s
    WHERE s.id = shift_message_reads.shift_id
      AND public.is_member_of_team(auth.uid(), s.team_id)
  )
);

-- Select: any team member of the shift can view read receipts for that shift
CREATE POLICY "Team members view shift read receipts"
ON public.shift_message_reads
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.shifts s
    WHERE s.id = shift_message_reads.shift_id
      AND public.is_member_of_team(auth.uid(), s.team_id)
  )
);

-- Immutable: no updates, no deletes
CREATE POLICY "Reads are immutable"
ON public.shift_message_reads
FOR UPDATE
TO authenticated
USING (false)
WITH CHECK (false);

CREATE POLICY "Reads cannot be deleted"
ON public.shift_message_reads
FOR DELETE
TO authenticated
USING (false);

-- Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.shift_message_reads;