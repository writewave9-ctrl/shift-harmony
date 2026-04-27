import { useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { qk } from '@/lib/queryClient';

export interface ShiftRequest {
  id: string;
  shift_id: string;
  worker_id: string;
  status: 'pending' | 'approved' | 'declined';
  notes: string | null;
  reviewed_by: string | null;
  reviewed_at: string | null;
  created_at: string;
  worker?: {
    id: string;
    full_name: string;
    avatar_url: string | null;
    position: string | null;
  };
  shift?: {
    id: string;
    date: string;
    start_time: string;
    end_time: string;
    position: string;
    location: string;
  };
}

const SELECT = `
  *,
  worker:profiles!shift_requests_worker_id_fkey(id, full_name, avatar_url, position),
  shift:shifts!shift_requests_shift_id_fkey(id, date, start_time, end_time, position, location)
` as const;

async function fetchRequests(role: string | undefined, profileId: string): Promise<ShiftRequest[]> {
  let query = supabase
    .from('shift_requests')
    .select(SELECT)
    .order('created_at', { ascending: false });
  if (role === 'worker') query = query.eq('worker_id', profileId);
  const { data, error } = await query;
  if (error) throw error;
  return (data || []) as ShiftRequest[];
}

export function useShiftRequests() {
  const { profile, userRole } = useAuth();
  const teamId = profile?.team_id ?? null;
  const profileId = profile?.id ?? null;
  const qc = useQueryClient();

  const query = useQuery({
    queryKey: profileId
      ? userRole?.role === 'worker'
        ? qk.shiftRequests.byWorker(profileId)
        : teamId
          ? qk.shiftRequests.byTeam(teamId)
          : ['shiftRequests', 'no-team']
      : ['shiftRequests', 'no-profile'],
    queryFn: () => fetchRequests(userRole?.role, profileId as string),
    enabled: !!profileId,
  });

  useEffect(() => {
    if (!teamId) return;
    const channel = supabase
      .channel(`shift-requests:${teamId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'shift_requests' }, () => {
        query.refetch();
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [teamId]);

  const invalidate = () => {
    if (profileId && userRole?.role === 'worker') {
      qc.invalidateQueries({ queryKey: qk.shiftRequests.byWorker(profileId) });
    }
    if (teamId) {
      qc.invalidateQueries({ queryKey: qk.shiftRequests.byTeam(teamId) });
      qc.invalidateQueries({ queryKey: qk.shifts.byTeam(teamId) });
    }
  };

  const requestShift = useMutation({
    mutationKey: ['shiftRequests', 'request'],
    mutationFn: async ({ shiftId, notes }: { shiftId: string; notes?: string }) => {
      if (!profileId) throw new Error('Not signed in');
      const { data, error } = await supabase
        .from('shift_requests')
        .insert({ shift_id: shiftId, worker_id: profileId, notes: notes || null })
        .select(SELECT)
        .single();
      if (error) {
        if (error.code === '23505') throw new Error('You have already requested this shift');
        throw error;
      }
      return data;
    },
    onSuccess: () => { invalidate(); toast.success('Shift request submitted!'); },
    onError: (e: Error) => toast.error(e.message || 'Failed to request shift'),
  });

  const approveRequest = useMutation({
    mutationKey: ['shiftRequests', 'approve'],
    mutationFn: async ({ requestId, shiftId, workerId }: { requestId: string; shiftId: string; workerId: string }) => {
      if (!profileId) throw new Error('Not signed in');
      const { error: requestError } = await supabase
        .from('shift_requests')
        .update({ status: 'approved', reviewed_by: profileId, reviewed_at: new Date().toISOString() })
        .eq('id', requestId);
      if (requestError) throw requestError;
      const { error: shiftError } = await supabase
        .from('shifts')
        .update({ assigned_worker_id: workerId, is_vacant: false })
        .eq('id', shiftId);
      if (shiftError) throw shiftError;
      await supabase
        .from('shift_requests')
        .update({ status: 'declined', reviewed_by: profileId, reviewed_at: new Date().toISOString() })
        .eq('shift_id', shiftId)
        .eq('status', 'pending')
        .neq('id', requestId);
    },
    onSuccess: () => { invalidate(); toast.success('Request approved! Worker assigned to shift.'); },
    onError: () => toast.error('Failed to approve request'),
  });

  const declineRequest = useMutation({
    mutationKey: ['shiftRequests', 'decline'],
    mutationFn: async (requestId: string) => {
      if (!profileId) throw new Error('Not signed in');
      const { error } = await supabase
        .from('shift_requests')
        .update({ status: 'declined', reviewed_by: profileId, reviewed_at: new Date().toISOString() })
        .eq('id', requestId);
      if (error) throw error;
    },
    onSuccess: () => { invalidate(); toast.success('Request declined'); },
    onError: () => toast.error('Failed to decline request'),
  });

  const requests = query.data ?? [];

  return {
    requests,
    loading: query.isLoading,
    requestShift: (shiftId: string, notes?: string) =>
      requestShift.mutateAsync({ shiftId, notes }).catch(() => null),
    approveRequest: (requestId: string, shiftId: string, workerId: string) =>
      approveRequest.mutateAsync({ requestId, shiftId, workerId }).then(() => true).catch(() => false),
    declineRequest: (id: string) => declineRequest.mutateAsync(id).then(() => true).catch(() => false),
    refetch: () => query.refetch(),
    pendingRequests: requests.filter(r => r.status === 'pending'),
  };
}
