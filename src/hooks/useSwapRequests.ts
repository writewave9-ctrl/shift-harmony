import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

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

export function useSwapRequests() {
  const { profile, userRole } = useAuth();
  const [requests, setRequests] = useState<SwapRequest[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchRequests = useCallback(async () => {
    if (!profile?.id) { setRequests([]); setLoading(false); return; }
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('swap_requests')
        .select(`
          *,
          requester:profiles!swap_requests_requester_id_fkey(id, full_name, avatar_url, position),
          requested_worker:profiles!swap_requests_requested_worker_id_fkey(id, full_name, avatar_url, position),
          shift:shifts!swap_requests_shift_id_fkey(id, date, start_time, end_time, position, location)
        `)
        .order('created_at', { ascending: false });
      if (error) throw error;
      setRequests((data || []) as SwapRequest[]);
    } catch (err) {
      console.error('Error fetching swap requests:', err);
    } finally {
      setLoading(false);
    }
  }, [profile?.id]);

  // Worker accepts a swap targeted at them → swap assigned worker on the shift
  const acceptSwap = async (request: SwapRequest) => {
    if (!profile?.id || request.requested_worker_id !== profile.id) return false;
    try {
      // Reassign shift to current worker
      const { error: shiftError } = await supabase
        .from('shifts')
        .update({ assigned_worker_id: profile.id, is_vacant: false })
        .eq('id', request.shift_id);
      if (shiftError) throw shiftError;

      const { error: swapError } = await supabase
        .from('swap_requests')
        .update({ status: 'approved' })
        .eq('id', request.id);
      if (swapError) throw swapError;

      toast.success('Swap accepted — the shift is now yours');
      fetchRequests();
      return true;
    } catch (err: any) {
      console.error('Error accepting swap:', err);
      toast.error(err.message || 'Failed to accept swap');
      return false;
    }
  };

  const declineSwap = async (requestId: string) => {
    try {
      const { error } = await supabase
        .from('swap_requests')
        .update({ status: 'declined' })
        .eq('id', requestId);
      if (error) throw error;
      toast.success('Swap declined');
      fetchRequests();
      return true;
    } catch (err: any) {
      toast.error(err.message || 'Failed to decline');
      return false;
    }
  };

  const managerApproveSwap = async (request: SwapRequest, newWorkerId: string) => {
    if (!profile?.id) return false;
    try {
      await supabase.from('shifts').update({
        assigned_worker_id: newWorkerId, is_vacant: false,
      }).eq('id', request.shift_id);
      await supabase.from('swap_requests').update({
        status: 'approved', approved_by: profile.id,
      }).eq('id', request.id);
      toast.success('Swap approved');
      fetchRequests();
      return true;
    } catch (err: any) {
      toast.error(err.message || 'Failed to approve');
      return false;
    }
  };

  const managerDeclineSwap = async (requestId: string) => {
    if (!profile?.id) return false;
    try {
      await supabase.from('swap_requests').update({
        status: 'declined', approved_by: profile.id,
      }).eq('id', requestId);
      toast.success('Swap declined');
      fetchRequests();
      return true;
    } catch (err: any) {
      toast.error(err.message || 'Failed to decline');
      return false;
    }
  };

  useEffect(() => { fetchRequests(); }, [fetchRequests]);

  // Realtime
  useEffect(() => {
    if (!profile?.team_id) return;
    const channel = supabase
      .channel('swap-requests-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'swap_requests' }, () => fetchRequests())
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [profile?.team_id, fetchRequests]);

  // Filtered views
  const incomingForMe = requests.filter(
    r => r.requested_worker_id === profile?.id && r.status === 'pending'
  );
  const myOutgoing = requests.filter(r => r.requester_id === profile?.id);
  const pendingForManager = requests.filter(r => r.status === 'pending');

  return {
    requests, loading, incomingForMe, myOutgoing, pendingForManager,
    acceptSwap, declineSwap, managerApproveSwap, managerDeclineSwap, refetch: fetchRequests,
  };
}
