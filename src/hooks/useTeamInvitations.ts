 import { useState, useEffect } from 'react';
 import { supabase } from '@/integrations/supabase/client';
 import { useAuth } from '@/contexts/AuthContext';
 import { toast } from 'sonner';
 
 export interface TeamInvitation {
   id: string;
   team_id: string;
   email: string;
   invited_by: string;
   token: string;
   status: 'pending' | 'accepted' | 'expired';
   expires_at: string;
   created_at: string;
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
         .select('*')
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
 
   const sendInvitation = async (email: string): Promise<boolean> => {
     if (!profile?.team_id || !profile?.id) {
       toast.error('No team assigned');
       return false;
     }
 
     try {
       // Check if invitation already exists
       const existing = invitations.find(
         i => i.email.toLowerCase() === email.toLowerCase() && i.status === 'pending'
       );
       if (existing) {
         toast.error('An invitation has already been sent to this email');
         return false;
       }
 
       const { data, error } = await supabase
         .from('team_invitations')
         .insert({
           team_id: profile.team_id,
           email: email.toLowerCase(),
           invited_by: profile.id,
         })
         .select()
         .single();
 
       if (error) {
         if (error.code === '23505') {
           toast.error('This email has already been invited');
           return false;
         }
         throw error;
       }
 
       setInvitations(prev => [data as TeamInvitation, ...prev]);
       toast.success(`Invitation sent to ${email}`);
       return true;
     } catch (err: any) {
       console.error('Error sending invitation:', err);
       toast.error('Failed to send invitation');
       return false;
     }
   };
 
   const cancelInvitation = async (invitationId: string): Promise<boolean> => {
     try {
       const { error } = await supabase
         .from('team_invitations')
         .delete()
         .eq('id', invitationId);
 
       if (error) throw error;
 
       setInvitations(prev => prev.filter(i => i.id !== invitationId));
       toast.success('Invitation cancelled');
       return true;
     } catch (err: any) {
       console.error('Error cancelling invitation:', err);
       toast.error('Failed to cancel invitation');
       return false;
     }
   };
 
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
       toast.success('Invitation resent');
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
     pendingInvitations: invitations.filter(i => i.status === 'pending'),
     loading,
     error,
     fetchInvitations,
     sendInvitation,
     cancelInvitation,
     resendInvitation,
   };
 }