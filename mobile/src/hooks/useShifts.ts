import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { qk } from '@/lib/queryClient';

export interface Shift {
  id: string;
  date: string;
  start_time: string;
  end_time: string;
  position: string | null;
  location: string | null;
  latitude: number | null;
  longitude: number | null;
  check_in_radius_meters: number | null;
  status: string;
  team_id: string;
  assigned_worker_id: string | null;
}

export function useWorkerUpcomingShifts(workerId: string | undefined) {
  return useQuery({
    queryKey: workerId ? qk.shifts.byWorker(workerId) : ['shifts', 'worker', 'none'],
    enabled: !!workerId,
    queryFn: async () => {
      const today = new Date().toISOString().split('T')[0];
      const { data, error } = await supabase
        .from('shifts')
        .select('*')
        .eq('assigned_worker_id', workerId!)
        .gte('date', today)
        .order('date', { ascending: true })
        .order('start_time', { ascending: true })
        .limit(20);
      if (error) throw error;
      return (data ?? []) as Shift[];
    },
  });
}

export function useTeamShifts(teamId: string | undefined) {
  return useQuery({
    queryKey: teamId ? qk.shifts.byTeam(teamId) : ['shifts', 'team', 'none'],
    enabled: !!teamId,
    queryFn: async () => {
      const today = new Date().toISOString().split('T')[0];
      const { data, error } = await supabase
        .from('shifts')
        .select('*')
        .eq('team_id', teamId!)
        .gte('date', today)
        .order('date', { ascending: true })
        .order('start_time', { ascending: true })
        .limit(100);
      if (error) throw error;
      return (data ?? []) as Shift[];
    },
  });
}
