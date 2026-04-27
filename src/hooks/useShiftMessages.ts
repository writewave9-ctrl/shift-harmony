import { useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export interface ShiftMessageRow {
  id: string;
  shift_id: string;
  sender_id: string;
  sender_name: string;
  message: string;
  created_at: string;
}

const messagesKey = (shiftId: string) => ['shiftMessages', shiftId] as const;

async function fetchMessages(shiftId: string): Promise<ShiftMessageRow[]> {
  const { data, error } = await supabase
    .from('shift_messages')
    .select('*, sender:profiles!shift_messages_sender_id_fkey(full_name)')
    .eq('shift_id', shiftId)
    .order('created_at', { ascending: true });
  if (error) throw error;
  return (data || []).map((m: any) => ({
    id: m.id,
    shift_id: m.shift_id,
    sender_id: m.sender_id,
    sender_name: m.sender?.full_name || 'Unknown',
    message: m.message,
    created_at: m.created_at,
  }));
}

/**
 * Shift-scoped messaging. RLS enforces team membership for both reads
 * and writes — workers cannot see messages from other teams' shifts.
 */
export function useShiftMessages(shiftId: string | null | undefined, opts?: { enabled?: boolean }) {
  const { profile } = useAuth();
  const qc = useQueryClient();
  const enabled = opts?.enabled !== false && !!shiftId;

  const query = useQuery({
    queryKey: shiftId ? messagesKey(shiftId) : ['shiftMessages', 'none'],
    queryFn: () => fetchMessages(shiftId as string),
    enabled,
  });

  useEffect(() => {
    if (!shiftId || !enabled) return;
    const channel = supabase
      .channel(`shift-messages-${shiftId}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'shift_messages', filter: `shift_id=eq.${shiftId}` },
        () => qc.invalidateQueries({ queryKey: messagesKey(shiftId) }),
      )
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [shiftId, enabled, qc]);

  const sendMessage = useMutation({
    mutationKey: ['shiftMessages', 'send'],
    mutationFn: async (message: string) => {
      if (!shiftId || !profile?.id) throw new Error('Not ready');
      const trimmed = message.trim();
      if (!trimmed) throw new Error('Empty message');
      const { error } = await supabase.from('shift_messages').insert({
        shift_id: shiftId,
        sender_id: profile.id,
        message: trimmed,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      if (shiftId) qc.invalidateQueries({ queryKey: messagesKey(shiftId) });
    },
    onError: () => toast.error('Failed to send message'),
  });

  return {
    messages: query.data ?? [],
    loading: query.isLoading,
    error: query.error ? (query.error as Error).message : null,
    sendMessage: (text: string) => sendMessage.mutateAsync(text).then(() => true).catch(() => false),
    refetch: () => query.refetch(),
  };
}
