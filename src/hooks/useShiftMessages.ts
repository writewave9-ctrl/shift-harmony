import { useEffect, useMemo } from 'react';
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
  read_by: string[];
  read_by_me: boolean;
}

const messagesKey = (shiftId: string) => ['shiftMessages', shiftId] as const;
const readsKey = (shiftId: string) => ['shiftMessageReads', shiftId] as const;

async function fetchMessages(shiftId: string): Promise<Omit<ShiftMessageRow, 'read_by' | 'read_by_me'>[]> {
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

interface ReadRow {
  message_id: string;
  user_id: string;
  read_at: string;
}

async function fetchReads(shiftId: string): Promise<ReadRow[]> {
  const { data, error } = await supabase
    .from('shift_message_reads')
    .select('message_id, user_id, read_at')
    .eq('shift_id', shiftId);
  if (error) throw error;
  return (data || []) as ReadRow[];
}

/**
 * Shift-scoped messaging with persistent per-user read receipts.
 *
 * RLS enforces team membership for both reads and writes — workers cannot
 * see messages from other teams' shifts. Read receipts are stored in
 * `shift_message_reads` and survive refreshes/sessions.
 */
export function useShiftMessages(shiftId: string | null | undefined, opts?: { enabled?: boolean }) {
  const { profile, user } = useAuth();
  const qc = useQueryClient();
  const enabled = opts?.enabled !== false && !!shiftId;
  const myAuthId = user?.id ?? null;
  const myProfileId = profile?.id ?? null;

  const messagesQuery = useQuery({
    queryKey: shiftId ? messagesKey(shiftId) : ['shiftMessages', 'none'],
    queryFn: () => fetchMessages(shiftId as string),
    enabled,
  });

  const readsQuery = useQuery({
    queryKey: shiftId ? readsKey(shiftId) : ['shiftMessageReads', 'none'],
    queryFn: () => fetchReads(shiftId as string),
    enabled,
  });

  // Realtime — refresh on new messages OR new reads.
  useEffect(() => {
    if (!shiftId || !enabled) return;
    const channel = supabase
      .channel(`shift-msg:${shiftId}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'shift_messages', filter: `shift_id=eq.${shiftId}` },
        () => qc.invalidateQueries({ queryKey: messagesKey(shiftId) }),
      )
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'shift_message_reads', filter: `shift_id=eq.${shiftId}` },
        () => qc.invalidateQueries({ queryKey: readsKey(shiftId) }),
      )
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [shiftId, enabled, qc]);

  const sendMessage = useMutation({
    mutationKey: ['shiftMessages', 'send'],
    mutationFn: async (message: string) => {
      if (!shiftId || !myProfileId) throw new Error('Not ready');
      const trimmed = message.trim();
      if (!trimmed) throw new Error('Empty message');
      const { error } = await supabase.from('shift_messages').insert({
        shift_id: shiftId,
        sender_id: myProfileId,
        message: trimmed,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      if (shiftId) qc.invalidateQueries({ queryKey: messagesKey(shiftId) });
    },
    onError: () => toast.error('Failed to send message'),
  });

  const markRead = useMutation({
    mutationKey: ['shiftMessageReads', 'mark'],
    mutationFn: async (messageIds: string[]) => {
      if (!shiftId || !myAuthId || messageIds.length === 0) return;
      const rows = messageIds.map((messageId) => ({
        message_id: messageId,
        shift_id: shiftId,
        user_id: myAuthId,
      }));
      // ignore conflicts — unique(message_id, user_id) prevents duplicates
      const { error } = await supabase
        .from('shift_message_reads')
        .upsert(rows, { onConflict: 'message_id,user_id', ignoreDuplicates: true });
      if (error) throw error;
    },
    onSuccess: () => {
      if (shiftId) qc.invalidateQueries({ queryKey: readsKey(shiftId) });
    },
    // Silent — these are background "I saw it" pings; never toast on failure.
    onError: () => { /* no-op */ },
  });

  // Combine messages + reads → shape consumers can render with.
  const messages: ShiftMessageRow[] = useMemo(() => {
    const msgs = messagesQuery.data ?? [];
    const reads = readsQuery.data ?? [];
    const byMessage = new Map<string, string[]>();
    for (const r of reads) {
      const arr = byMessage.get(r.message_id) ?? [];
      arr.push(r.user_id);
      byMessage.set(r.message_id, arr);
    }
    return msgs.map((m) => {
      const readers = byMessage.get(m.id) ?? [];
      return {
        ...m,
        read_by: readers,
        read_by_me: !!myAuthId && readers.includes(myAuthId),
      };
    });
  }, [messagesQuery.data, readsQuery.data, myAuthId]);

  return {
    messages,
    loading: messagesQuery.isLoading || readsQuery.isLoading,
    error: (messagesQuery.error || readsQuery.error)
      ? ((messagesQuery.error || readsQuery.error) as Error).message
      : null,
    sendMessage: (text: string) => sendMessage.mutateAsync(text).then(() => true).catch(() => false),
    markRead: (messageIds: string[]) => markRead.mutateAsync(messageIds).catch(() => null),
    refetch: () => Promise.all([messagesQuery.refetch(), readsQuery.refetch()]),
  };
}
