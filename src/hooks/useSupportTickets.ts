import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export interface SupportTicket {
  id: string;
  organization_id: string;
  opened_by: string;
  subject: string;
  body: string;
  status: 'open' | 'pending' | 'resolved' | 'closed' | string;
  priority: 'normal' | 'priority' | string;
  created_at: string;
  updated_at: string;
  opener?: { full_name: string };
}

export interface SupportMessage {
  id: string;
  ticket_id: string;
  sender_id: string;
  body: string;
  created_at: string;
  sender?: { full_name: string };
}

export function useSupportTickets() {
  const { profile, userRole } = useAuth();
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchTickets = useCallback(async () => {
    if (!profile?.organization_id) { setTickets([]); setLoading(false); return; }
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('support_tickets')
        .select('*, opener:profiles!support_tickets_opened_by_fkey(full_name)' as any)
        .order('created_at', { ascending: false });
      if (error) throw error;
      setTickets((data || []) as any);
    } catch (err) {
      console.error('Error fetching tickets:', err);
    } finally {
      setLoading(false);
    }
  }, [profile?.organization_id]);

  const openTicket = async (subject: string, body: string): Promise<boolean> => {
    if (!profile?.organization_id || !profile?.id) { toast.error('Not in an organization'); return false; }
    const { error } = await supabase.from('support_tickets').insert({
      organization_id: profile.organization_id,
      opened_by: profile.id,
      subject,
      body,
    });
    if (error) { toast.error(error.message); return false; }
    toast.success('Support request sent');
    fetchTickets();
    return true;
  };

  const fetchMessages = async (ticketId: string): Promise<SupportMessage[]> => {
    const { data, error } = await supabase
      .from('support_messages')
      .select('*, sender:profiles!support_messages_sender_id_fkey(full_name)' as any)
      .eq('ticket_id', ticketId)
      .order('created_at', { ascending: true });
    if (error) { console.error(error); return []; }
    return (data || []) as any;
  };

  const replyToTicket = async (ticketId: string, body: string): Promise<boolean> => {
    if (!profile?.id) return false;
    const { error } = await supabase.from('support_messages').insert({
      ticket_id: ticketId, sender_id: profile.id, body,
    });
    if (error) { toast.error(error.message); return false; }
    return true;
  };

  const isManager = userRole?.role === 'manager' || userRole?.role === 'admin';

  const updateTicketStatus = async (ticketId: string, status: string): Promise<boolean> => {
    if (!isManager) return false;
    const { error } = await supabase.from('support_tickets').update({ status }).eq('id', ticketId);
    if (error) { toast.error(error.message); return false; }
    fetchTickets();
    return true;
  };

  useEffect(() => { fetchTickets(); }, [fetchTickets]);

  return { tickets, loading, openTicket, fetchMessages, replyToTicket, updateTicketStatus, refetch: fetchTickets };
}
