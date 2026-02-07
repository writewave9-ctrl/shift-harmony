import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

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

export function useShiftRequests() {
  const { profile, userRole } = useAuth();
  const [requests, setRequests] = useState<ShiftRequest[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchRequests = async () => {
    if (!profile?.id) return;

    try {
      setLoading(true);
      
      let query = supabase
        .from('shift_requests')
        .select(`
          *,
          worker:profiles!shift_requests_worker_id_fkey(id, full_name, avatar_url, position),
          shift:shifts!shift_requests_shift_id_fkey(id, date, start_time, end_time, position, location)
        `)
        .order('created_at', { ascending: false });

      // Workers see their own requests, managers see all
      if (userRole?.role === 'worker') {
        query = query.eq('worker_id', profile.id);
      }

      const { data, error } = await query;
      if (error) throw error;
      setRequests((data || []) as ShiftRequest[]);
    } catch (err) {
      console.error('Error fetching shift requests:', err);
    } finally {
      setLoading(false);
    }
  };

  const requestShift = async (shiftId: string, notes?: string) => {
    if (!profile?.id) {
      toast.error('You must be logged in');
      return null;
    }

    try {
      const { data, error } = await supabase
        .from('shift_requests')
        .insert({
          shift_id: shiftId,
          worker_id: profile.id,
          notes: notes || null,
        })
        .select(`
          *,
          worker:profiles!shift_requests_worker_id_fkey(id, full_name, avatar_url, position),
          shift:shifts!shift_requests_shift_id_fkey(id, date, start_time, end_time, position, location)
        `)
        .single();

      if (error) {
        if (error.code === '23505') {
          toast.error('You have already requested this shift');
        } else {
          throw error;
        }
        return null;
      }

      setRequests(prev => [data as ShiftRequest, ...prev]);
      toast.success('Shift request submitted!');
      return data;
    } catch (err: any) {
      console.error('Error requesting shift:', err);
      toast.error('Failed to request shift');
      return null;
    }
  };

  const approveRequest = async (requestId: string, shiftId: string, workerId: string) => {
    if (!profile?.id) return false;

    try {
      // First approve the request
      const { error: requestError } = await supabase
        .from('shift_requests')
        .update({
          status: 'approved',
          reviewed_by: profile.id,
          reviewed_at: new Date().toISOString(),
        })
        .eq('id', requestId);

      if (requestError) throw requestError;

      // Then assign the worker to the shift
      const { error: shiftError } = await supabase
        .from('shifts')
        .update({
          assigned_worker_id: workerId,
          is_vacant: false,
        })
        .eq('id', shiftId);

      if (shiftError) throw shiftError;

      // Decline all other pending requests for this shift
      await supabase
        .from('shift_requests')
        .update({
          status: 'declined',
          reviewed_by: profile.id,
          reviewed_at: new Date().toISOString(),
        })
        .eq('shift_id', shiftId)
        .eq('status', 'pending')
        .neq('id', requestId);

      setRequests(prev => prev.map(r => 
        r.id === requestId 
          ? { ...r, status: 'approved' as const, reviewed_by: profile.id } 
          : r.shift_id === shiftId && r.status === 'pending'
            ? { ...r, status: 'declined' as const }
            : r
      ));

      toast.success('Request approved! Worker assigned to shift.');
      return true;
    } catch (err) {
      console.error('Error approving request:', err);
      toast.error('Failed to approve request');
      return false;
    }
  };

  const declineRequest = async (requestId: string) => {
    if (!profile?.id) return false;

    try {
      const { error } = await supabase
        .from('shift_requests')
        .update({
          status: 'declined',
          reviewed_by: profile.id,
          reviewed_at: new Date().toISOString(),
        })
        .eq('id', requestId);

      if (error) throw error;

      setRequests(prev => prev.map(r => 
        r.id === requestId ? { ...r, status: 'declined' as const } : r
      ));

      toast.success('Request declined');
      return true;
    } catch (err) {
      console.error('Error declining request:', err);
      toast.error('Failed to decline request');
      return false;
    }
  };

  useEffect(() => {
    fetchRequests();
  }, [profile?.id, userRole?.role]);

  // Realtime subscription
  useEffect(() => {
    if (!profile?.team_id) return;

    const channel = supabase
      .channel('shift-requests-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'shift_requests',
        },
        () => {
          fetchRequests();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [profile?.team_id]);

  return {
    requests,
    loading,
    requestShift,
    approveRequest,
    declineRequest,
    refetch: fetchRequests,
    pendingRequests: requests.filter(r => r.status === 'pending'),
  };
}
