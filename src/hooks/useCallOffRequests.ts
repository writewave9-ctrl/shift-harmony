import { useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { qk } from '@/lib/queryClient';

export type CallOffStatus = 'pending' | 'approved' | 'declined' | 'expired';

export interface CallOffRequest {
  id: string;
  shift_id: string;
  worker_id: string;
  reason: 'sick' | 'family_emergency' | 'transportation' | 'personal' | 'other';
  custom_reason: string | null;
  status: CallOffStatus;
  created_at: string;
  updated_at: string;
  worker?: { id: string; full_name: string; avatar_url: string | null; position: string | null };
  shift?: { id: string; date: string; start_time: string; end_time: string; position: string; location: string };
}

const REASON_LABEL: Record<CallOffRequest['reason'], string> = {
  sick: 'Feeling unwell',
  family_emergency: 'Family emergency',
  transportation: 'Transportation',
  personal: 'Personal',
  other: 'Other',
};

export const callOffReasonLabel = (r: CallOffRequest['reason']) => REASON_LABEL[r];

const SELECT = `
  *,
  worker:profiles!call_off_requests_worker_id_fkey(id, full_name, avatar_url, position),
  shift:shifts!call_off_requests_shift_id_fkey(id, date, start_time, end_time, position, location)
` as const;

async function fetchCallOffs(): Promise<CallOffRequest[]> {
  const { data, error } = await supabase
    .from('call_off_requests')
    .select(SELECT)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return (data || []) as CallOffRequest[];
}

export function useCallOffRequests() {
  const { profile } = useAuth();
  const teamId = profile?.team_id ?? null;
  const qc = useQueryClient();

  const query = useQuery({
    queryKey: teamId ? qk.callOffs.byTeam(teamId) : ['callOffs', 'no-team'],
    queryFn: fetchCallOffs,
    enabled: !!profile?.id,
  });

  // Realtime — RLS scopes results to team automatically
  useEffect(() => {
    if (!teamId) return;
    const channel = supabase
      .channel(`call-off-requests:${teamId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'call_off_requests' }, () => {
        qc.invalidateQueries({ queryKey: qk.callOffs.byTeam(teamId) });
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [teamId, qc]);

  const approveCallOff = useMutation({
    mutationKey: ['callOffs', 'approve'],
    mutationFn: async (req: CallOffRequest) => {
      const { data: fresh } = await supabase
        .from('call_off_requests').select('status').eq('id', req.id).maybeSingle();
      if (!fresh || fresh.status !== 'pending') throw new Error('Already handled');
      const { error: shiftErr } = await supabase.from('shifts')
        .update({ assigned_worker_id: null, is_vacant: true })
        .eq('id', req.shift_id);
      if (shiftErr) throw shiftErr;
      const { error } = await supabase.from('call_off_requests')
        .update({ status: 'approved' }).eq('id', req.id);
      if (error) throw error;
    },
    onSuccess: () => {
      if (teamId) {
        qc.invalidateQueries({ queryKey: qk.callOffs.byTeam(teamId) });
        qc.invalidateQueries({ queryKey: qk.shifts.byTeam(teamId) });
      }
      toast.success('Call-off approved — shift posted as open');
    },
    onError: (e: Error) => toast.error(e.message || 'Failed to approve call-off'),
  });

  const declineCallOff = useMutation({
    mutationKey: ['callOffs', 'decline'],
    mutationFn: async (id: string) => {
      const { data: fresh } = await supabase
        .from('call_off_requests').select('status').eq('id', id).maybeSingle();
      if (!fresh || fresh.status !== 'pending') throw new Error('Already handled');
      const { error } = await supabase.from('call_off_requests')
        .update({ status: 'declined' }).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      if (teamId) qc.invalidateQueries({ queryKey: qk.callOffs.byTeam(teamId) });
      toast.success('Call-off declined');
    },
    onError: (e: Error) => toast.error(e.message || 'Failed to decline'),
  });

  const requests = query.data ?? [];
  const pendingForManager = requests.filter(r => r.status === 'pending');
  const myCallOffs = requests.filter(r => r.worker_id === profile?.id);

  return {
    requests,
    loading: query.isLoading,
    pendingForManager,
    myCallOffs,
    approveCallOff: (req: CallOffRequest) => approveCallOff.mutateAsync(req).then(() => true).catch(() => false),
    declineCallOff: (id: string) => declineCallOff.mutateAsync(id).then(() => true).catch(() => false),
    refetch: () => query.refetch(),
  };
}
