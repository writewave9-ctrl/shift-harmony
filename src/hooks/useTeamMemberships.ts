import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { qk } from '@/lib/queryClient';

export interface TeamMembership {
  team_id: string;
  team_name: string;
  joined_at: string;
  is_active_team: boolean;
}

async function fetchMemberships(userId: string): Promise<TeamMembership[]> {
  const { data, error } = await supabase.rpc('get_user_teams', { _user_id: userId });
  if (error) throw error;
  return (data || []) as TeamMembership[];
}

export function useTeamMemberships() {
  const { user, refreshProfile } = useAuth();
  const userId = user?.id ?? null;
  const qc = useQueryClient();

  const query = useQuery({
    queryKey: userId ? qk.team.memberships(userId) : ['team', 'memberships', 'anon'],
    queryFn: () => fetchMemberships(userId as string),
    enabled: !!userId,
  });

  const switchTeam = useMutation({
    mutationKey: ['memberships', 'switch'],
    mutationFn: async (teamId: string) => {
      if (!userId) throw new Error('Not signed in');
      const { error } = await supabase
        .from('profiles')
        .update({ active_team_id: teamId, team_id: teamId })
        .eq('user_id', userId);
      if (error) throw error;
    },
    onSuccess: async () => {
      await refreshProfile();
      if (userId) qc.invalidateQueries({ queryKey: qk.team.memberships(userId) });
      toast.success('Switched workspace');
    },
    onError: (e: Error) => toast.error(e.message || 'Failed to switch workspace'),
  });

  const leaveTeam = useMutation({
    mutationKey: ['memberships', 'leave'],
    mutationFn: async (teamId: string) => {
      const { data, error } = await supabase.functions.invoke('leave-team', {
        body: { team_id: teamId },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
    },
    onSuccess: async () => {
      await refreshProfile();
      if (userId) qc.invalidateQueries({ queryKey: qk.team.memberships(userId) });
      toast.success('Left workspace');
    },
    onError: (e: Error) => toast.error(e.message || 'Failed to leave workspace'),
  });

  return {
    memberships: query.data ?? [],
    loading: query.isLoading,
    switching: switchTeam.isPending,
    switchTeam: (id: string) => switchTeam.mutateAsync(id).then(() => true).catch(() => false),
    leaveTeam: (id: string) => leaveTeam.mutateAsync(id).then(() => true).catch(() => false),
    refetch: () => query.refetch(),
  };
}
