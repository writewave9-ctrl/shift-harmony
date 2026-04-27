import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { qk } from '@/lib/queryClient';

export interface TeamMember {
  id: string;
  user_id: string;
  full_name: string;
  email: string;
  phone: string | null;
  avatar_url: string | null;
  position: string | null;
  weekly_hours_target: number | null;
  willingness_for_extra: 'low' | 'medium' | 'high' | null;
  reliability_score: number | null;
  role: 'worker' | 'manager' | 'admin';
}

async function fetchTeamMembers(teamId: string): Promise<TeamMember[]> {
  const { data: profiles, error: profilesError } = await supabase
    .from('profiles')
    .select('*')
    .eq('team_id', teamId);
  if (profilesError) throw profilesError;

  const userIds = profiles?.map((p) => p.user_id) ?? [];
  if (userIds.length === 0) return [];

  const { data: roles, error: rolesError } = await supabase
    .from('user_roles')
    .select('*')
    .in('user_id', userIds);
  if (rolesError) throw rolesError;

  return (profiles ?? []).map((p) => {
    const userRole = roles?.find((r) => r.user_id === p.user_id);
    return {
      ...p,
      role: (userRole?.role as TeamMember['role']) || 'worker',
    } as TeamMember;
  });
}

export function useTeamMembers() {
  const { profile } = useAuth();
  const teamId = profile?.team_id ?? null;

  const query = useQuery({
    queryKey: teamId ? qk.team.members(teamId) : ['team', 'no-team', 'members'],
    queryFn: () => fetchTeamMembers(teamId as string),
    enabled: !!teamId,
  });

  const members = query.data ?? [];
  const workers = members.filter((m) => m.role === 'worker');
  const managers = members.filter((m) => m.role === 'manager' || m.role === 'admin');

  return {
    members,
    workers,
    managers,
    loading: query.isLoading,
    error: query.error ? (query.error as Error).message : null,
    fetchMembers: () => query.refetch(),
  };
}
