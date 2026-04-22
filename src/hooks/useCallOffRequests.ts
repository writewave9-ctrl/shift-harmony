import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

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

export function useCallOffRequests() {
  const { profile } = useAuth();
  const [requests, setRequests] = useState<CallOffRequest[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchRequests = useCallback(async () => {
    if (!profile?.id) { setRequests([]); setLoading(false); return; }
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('call_off_requests')
        .select(`
          *,
          worker:profiles!call_off_requests_worker_id_fkey(id, full_name, avatar_url, position),
          shift:shifts!call_off_requests_shift_id_fkey(id, date, start_time, end_time, position, location)
        `)
        .order('created_at', { ascending: false });
      if (error) throw error;
      setRequests((data || []) as CallOffRequest[]);
    } catch (err) {
      console.error('Error fetching call-offs:', err);
    } finally {
      setLoading(false);
    }
  }, [profile?.id]);

  // Manager approves: unassign worker, mark shift vacant
  const approveCallOff = async (req: CallOffRequest): Promise<boolean> => {
    try {
      // Race-condition guard
      const { data: fresh } = await supabase
        .from('call_off_requests').select('status').eq('id', req.id).maybeSingle();
      if (!fresh || fresh.status !== 'pending') {
        toast.error('Already handled');
        fetchRequests();
        return false;
      }
      await supabase.from('shifts').update({
        assigned_worker_id: null, is_vacant: true,
      }).eq('id', req.shift_id);
      const { error } = await supabase.from('call_off_requests')
        .update({ status: 'approved' }).eq('id', req.id);
      if (error) throw error;
      toast.success('Call-off approved — shift posted as open');
      fetchRequests();
      return true;
    } catch (err: any) {
      toast.error(err.message || 'Failed to approve call-off');
      return false;
    }
  };

  const declineCallOff = async (id: string): Promise<boolean> => {
    try {
      const { data: fresh } = await supabase
        .from('call_off_requests').select('status').eq('id', id).maybeSingle();
      if (!fresh || fresh.status !== 'pending') {
        toast.error('Already handled');
        fetchRequests();
        return false;
      }
      const { error } = await supabase.from('call_off_requests')
        .update({ status: 'declined' }).eq('id', id);
      if (error) throw error;
      toast.success('Call-off declined');
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
      .channel('call-off-requests-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'call_off_requests' }, () => fetchRequests())
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [profile?.team_id, fetchRequests]);

  const pendingForManager = requests.filter(r => r.status === 'pending');
  const myCallOffs = requests.filter(r => r.worker_id === profile?.id);

  return {
    requests, loading, pendingForManager, myCallOffs,
    approveCallOff, declineCallOff, refetch: fetchRequests,
  };
}
