import { useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { qk } from '@/lib/queryClient';

export interface SwapRequest {
  id: string;
  shift_id: string;
  requester_id: string;
  requested_worker_id: string | null;
  reason: string;
  status: 'pending' | 'approved' | 'declined' | 'expired';
  is_open_to_all: boolean;
  approved_by: string | null;
  created_at: string;
  requester?: { id: string; full_name: string; avatar_url: string | null; position: string | null };
  requested_worker?: { id: string; full_name: string; avatar_url: string | null; position: string | null };
  shift?: { id: string; date: string; start_time: string; end_time: string; position: string; location: string };
}

const SELECT = `
  *,
  requester:profiles!swap_requests_requester_id_fkey(id, full_name, avatar_url, position),
  requested_worker:profiles!swap_requests_requested_worker_id_fkey(id, full_name, avatar_url, position),
  shift:shifts!swap_requests_shift_id_fkey(id, date, start_time, end_time, position, location)
` as const;

async function fetchSwaps(): Promise<SwapRequest[]> {
  const { data, error } = await supabase
    .from('swap_requests')
    .select(SELECT)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return (data || []) as SwapRequest[];
}

export function useSwapRequests() {
  const { profile } = useAuth();
  const teamId = profile?.team_id ?? null;
  const qc = useQueryClient();

  const query = useQuery({
    queryKey: teamId ? qk.swaps.byTeam(teamId) : ['swaps', 'no-team'],
    queryFn: fetchSwaps,
    enabled: !!profile?.id,
  });

  useEffect(() => {
    if (!teamId) return;
    const channel = supabase
      .channel(`swap-requests:${teamId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'swap_requests' }, () => {
        qc.invalidateQueries({ queryKey: qk.swaps.byTeam(teamId) });
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [teamId, qc]);

  const invalidate = () => {
    if (teamId) {
      qc.invalidateQueries({ queryKey: qk.swaps.byTeam(teamId) });
      qc.invalidateQueries({ queryKey: qk.shifts.byTeam(teamId) });
    }
  };

  const acceptSwap = useMutation({
    mutationKey: ['swaps', 'accept'],
    mutationFn: async (request: SwapRequest) => {
      if (!profile?.id || request.requested_worker_id !== profile.id) {
        throw new Error('Not authorized');
      }
      const { error: shiftError } = await supabase
        .from('shifts')
        .update({ assigned_worker_id: profile.id, is_vacant: false })
        .eq('id', request.shift_id);
      if (shiftError) throw shiftError;
      const { error: swapError } = await supabase
        .from('swap_requests')
        .update({ status: 'approved', approved_by: profile.id })
        .eq('id', request.id);
      if (swapError) throw swapError;
    },
    onSuccess: () => { invalidate(); toast.success('Swap accepted — the shift is now yours'); },
    onError: (e: Error) => toast.error(e.message || 'Failed to accept swap'),
  });

  const declineSwap = useMutation({
    mutationKey: ['swaps', 'decline'],
    mutationFn: async (requestId: string) => {
      if (!profile?.id) throw new Error('Not signed in');
      const { error } = await supabase
        .from('swap_requests')
        .update({ status: 'declined', approved_by: profile.id })
        .eq('id', requestId);
      if (error) throw error;
    },
    onSuccess: () => { invalidate(); toast.success('Swap declined'); },
    onError: (e: Error) => toast.error(e.message || 'Failed to decline'),
  });

  const managerApproveSwap = useMutation({
    mutationKey: ['swaps', 'managerApprove'],
    mutationFn: async ({ request, newWorkerId }: { request: SwapRequest; newWorkerId: string }) => {
      if (!profile?.id) throw new Error('Not signed in');
      const { error: sErr } = await supabase.from('shifts')
        .update({ assigned_worker_id: newWorkerId, is_vacant: false })
        .eq('id', request.shift_id);
      if (sErr) throw sErr;
      const { error } = await supabase.from('swap_requests')
        .update({ status: 'approved', approved_by: profile.id })
        .eq('id', request.id);
      if (error) throw error;
    },
    onSuccess: () => { invalidate(); toast.success('Swap approved'); },
    onError: (e: Error) => toast.error(e.message || 'Failed to approve'),
  });

  const managerDeclineSwap = useMutation({
    mutationKey: ['swaps', 'managerDecline'],
    mutationFn: async (requestId: string) => {
      if (!profile?.id) throw new Error('Not signed in');
      const { error } = await supabase.from('swap_requests')
        .update({ status: 'declined', approved_by: profile.id })
        .eq('id', requestId);
      if (error) throw error;
    },
    onSuccess: () => { invalidate(); toast.success('Swap declined'); },
    onError: (e: Error) => toast.error(e.message || 'Failed to decline'),
  });

  const requests = query.data ?? [];
  const incomingForMe = requests.filter(
    r => r.requested_worker_id === profile?.id && r.status === 'pending'
  );
  const myOutgoing = requests.filter(r => r.requester_id === profile?.id);
  const pendingForManager = requests.filter(r => r.status === 'pending');

  return {
    requests,
    loading: query.isLoading,
    incomingForMe,
    myOutgoing,
    pendingForManager,
    acceptSwap: (r: SwapRequest) => acceptSwap.mutateAsync(r).then(() => true).catch(() => false),
    declineSwap: (id: string) => declineSwap.mutateAsync(id).then(() => true).catch(() => false),
    managerApproveSwap: (r: SwapRequest, newWorkerId: string) =>
      managerApproveSwap.mutateAsync({ request: r, newWorkerId }).then(() => true).catch(() => false),
    managerDeclineSwap: (id: string) => managerDeclineSwap.mutateAsync(id).then(() => true).catch(() => false),
    refetch: () => query.refetch(),
  };
}
