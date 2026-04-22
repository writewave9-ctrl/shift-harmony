import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export interface TeamMembership {
  team_id: string;
  team_name: string;
  joined_at: string;
  is_active_team: boolean;
}

export function useTeamMemberships() {
  const { user, refreshProfile } = useAuth();
  const [memberships, setMemberships] = useState<TeamMembership[]>([]);
  const [loading, setLoading] = useState(true);
  const [switching, setSwitching] = useState(false);

  const fetchMemberships = useCallback(async () => {
    if (!user) {
      setMemberships([]);
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      const { data, error } = await supabase.rpc('get_user_teams', { _user_id: user.id });
      if (error) throw error;
      setMemberships((data || []) as TeamMembership[]);
    } catch (err) {
      console.error('Error fetching memberships:', err);
    } finally {
      setLoading(false);
    }
  }, [user]);

  const switchTeam = async (teamId: string) => {
    if (!user) return false;
    setSwitching(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ active_team_id: teamId, team_id: teamId })
        .eq('user_id', user.id);
      if (error) throw error;
      await refreshProfile();
      await fetchMemberships();
      toast.success('Switched workspace');
      return true;
    } catch (err: any) {
      toast.error(err.message || 'Failed to switch workspace');
      return false;
    } finally {
      setSwitching(false);
    }
  };

  const leaveTeam = async (teamId: string) => {
    try {
      const { data, error } = await supabase.functions.invoke('leave-team', {
        body: { team_id: teamId },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      await refreshProfile();
      await fetchMemberships();
      toast.success('Left workspace');
      return true;
    } catch (err: any) {
      toast.error(err.message || 'Failed to leave workspace');
      return false;
    }
  };

  useEffect(() => { fetchMemberships(); }, [fetchMemberships]);

  return { memberships, loading, switching, switchTeam, leaveTeam, refetch: fetchMemberships };
}
