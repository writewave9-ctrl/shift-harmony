import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { qk } from '@/lib/queryClient';

export interface TeamSettings {
  id: string;
  team_id: string;
  default_check_in_radius_meters: number;
  notification_shift_reminder_hours: number;
  notification_swap_requests: boolean;
  notification_attendance_alerts: boolean;
  allow_worker_shift_requests: boolean;
  auto_approve_swaps: boolean;
}

async function fetchSettings(teamId: string): Promise<TeamSettings | null> {
  const { data, error } = await supabase
    .from('team_settings')
    .select('*')
    .eq('team_id', teamId)
    .maybeSingle();
  if (error) throw error;
  return (data as TeamSettings) ?? null;
}

export function useTeamSettings() {
  const { profile } = useAuth();
  const teamId = profile?.team_id ?? null;
  const qc = useQueryClient();

  const query = useQuery({
    queryKey: teamId ? qk.team.settings(teamId) : ['team', 'no-team', 'settings'],
    queryFn: () => fetchSettings(teamId as string),
    enabled: !!teamId,
  });

  const updateSettings = useMutation({
    mutationKey: ['teamSettings', 'update'],
    mutationFn: async (updates: Partial<Omit<TeamSettings, 'id' | 'team_id'>>) => {
      if (!teamId) throw new Error('No team');
      // Upsert: create if missing
      if (!query.data?.id) {
        const { data, error } = await supabase
          .from('team_settings')
          .insert({ team_id: teamId, ...updates })
          .select()
          .single();
        if (error) throw error;
        return data as TeamSettings;
      }
      const { data, error } = await supabase
        .from('team_settings')
        .update(updates)
        .eq('team_id', teamId)
        .select()
        .single();
      if (error) throw error;
      return data as TeamSettings;
    },
    onSuccess: (data) => {
      if (teamId) qc.setQueryData(qk.team.settings(teamId), data);
      toast.success('Settings updated');
    },
    onError: () => toast.error('Failed to update settings'),
  });

  return {
    settings: query.data ?? null,
    loading: query.isLoading,
    updateSettings: (u: Partial<Omit<TeamSettings, 'id' | 'team_id'>>) =>
      updateSettings.mutateAsync(u).then(() => true).catch(() => false),
    refetch: () => query.refetch(),
  };
}
