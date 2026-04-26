import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export interface TeamInvitation {
  id: string;
  team_id: string;
  email: string;
  invited_by: string;
  status: 'pending' | 'accepted' | 'expired';
  expires_at: string;
  created_at: string;
}

/**
 * Generate a fresh invitation token client-side and return both the raw
 * token (for the accept link the manager hands to the invitee) and its
 * SHA-256 hex digest (which is the only form that ever touches the DB).
 */
async function generateTokenAndHash(): Promise<{ raw: string; hash: string }> {
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);
  const raw = Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('');
  const hashBuf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(raw));
  const hash = Array.from(new Uint8Array(hashBuf), (b) => b.toString(16).padStart(2, '0')).join('');
  return { raw, hash };
}

export function useTeamInvitations() {
  const { profile } = useAuth();
  const [invitations, setInvitations] = useState<TeamInvitation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchInvitations = async () => {
    if (!profile?.team_id) {
      setInvitations([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('team_invitations')
        .select('id, team_id, email, invited_by, status, expires_at, created_at')
        .eq('team_id', profile.team_id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setInvitations((data as TeamInvitation[]) || []);
    } catch (err: any) {
      console.error('Error fetching invitations:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Create an invitation. Returns the raw token (caller is responsible for
   * embedding it in the accept-invite URL and delivering it to the invitee
   * out-of-band) — it is NEVER read back from the database afterwards.
   */
  const sendInvitation = async (
    email: string
  ): Promise<{ ok: true; rawToken: string } | { ok: false }> => {
    if (!profile?.team_id || !profile?.id) {
      toast.error('No team assigned');
      return { ok: false };
    }

    try {
      const existing = invitations.find(
        (i) => i.email.toLowerCase() === email.toLowerCase() && i.status === 'pending'
      );
      if (existing) {
        toast.error('An invitation has already been sent to this email');
        return { ok: false };
      }

      const { raw, hash } = await generateTokenAndHash();

      const { data, error } = await supabase
        .from('team_invitations')
        .insert({
          team_id: profile.team_id,
          email: email.toLowerCase(),
          invited_by: profile.id,
          token_hash: hash,
        })
        .select('id, team_id, email, invited_by, status, expires_at, created_at')
        .single();

      if (error) {
        if (error.code === '23505') {
          toast.error('This email has already been invited');
          return { ok: false };
        }
        throw error;
      }

      setInvitations((prev) => [data as TeamInvitation, ...prev]);
      toast.success(`Invitation sent to ${email}`);
      return { ok: true, rawToken: raw };
    } catch (err: any) {
      console.error('Error sending invitation:', err);
      toast.error('Failed to send invitation');
      return { ok: false };
    }
  };

  const cancelInvitation = async (invitationId: string): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('team_invitations')
        .delete()
        .eq('id', invitationId);

      if (error) throw error;

      setInvitations((prev) => prev.filter((i) => i.id !== invitationId));
      toast.success('Invitation cancelled');
      return true;
    } catch (err: any) {
      console.error('Error cancelling invitation:', err);
      toast.error('Failed to cancel invitation');
      return false;
    }
  };

  /**
   * Resending only extends expiry — it does NOT rotate the token, because
   * we no longer have access to the raw token after the original insert.
   * If you need a brand-new token, cancel and re-create the invitation.
   */
  const resendInvitation = async (invitationId: string): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('team_invitations')
        .update({
          expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        })
        .eq('id', invitationId);

      if (error) throw error;

      await fetchInvitations();
      toast.success('Invitation extended');
      return true;
    } catch (err: any) {
      console.error('Error resending invitation:', err);
      toast.error('Failed to resend invitation');
      return false;
    }
  };

  useEffect(() => {
    fetchInvitations();
  }, [profile?.team_id]);

  return {
    invitations,
    pendingInvitations: invitations.filter((i) => i.status === 'pending'),
    loading,
    error,
    fetchInvitations,
    sendInvitation,
    cancelInvitation,
    resendInvitation,
  };
}
