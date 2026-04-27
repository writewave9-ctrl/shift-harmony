import { useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { qk } from '@/lib/queryClient';

export interface DatabaseShift {
  id: string;
  team_id: string;
  assigned_worker_id: string | null;
  date: string;
  start_time: string;
  end_time: string;
  position: string;
  location: string;
  status: 'scheduled' | 'in_progress' | 'completed' | 'cancelled';
  is_vacant: boolean;
  notes: string | null;
  latitude: number | null;
  longitude: number | null;
  check_in_radius_meters: number | null;
  created_at: string;
  updated_at: string;
  assigned_worker?: {
    id: string;
    full_name: string;
    avatar_url: string | null;
    position: string | null;
  } | null;
}

export interface CreateShiftData {
  date: string;
  start_time: string;
  end_time: string;
  position: string;
  location: string;
  notes?: string;
  assigned_worker_id?: string;
  latitude?: number;
  longitude?: number;
  check_in_radius_meters?: number;
}

export interface UpdateShiftData extends Partial<CreateShiftData> {
  status?: 'scheduled' | 'in_progress' | 'completed' | 'cancelled';
  is_vacant?: boolean;
}

const SHIFT_SELECT = `
  *,
  assigned_worker:profiles!shifts_assigned_worker_id_fkey(
    id,
    full_name,
    avatar_url,
    position
  )
` as const;

async function fetchShiftsForTeam(teamId: string): Promise<DatabaseShift[]> {
  const { data, error } = await supabase
    .from('shifts')
    .select(SHIFT_SELECT)
    .eq('team_id', teamId)
    .order('date', { ascending: true })
    .order('start_time', { ascending: true });
  if (error) throw error;
  return (data || []) as unknown as DatabaseShift[];
}

export function useShifts() {
  const { profile } = useAuth();
  const teamId = profile?.team_id ?? null;
  const qc = useQueryClient();

  const query = useQuery({
    queryKey: teamId ? qk.shifts.byTeam(teamId) : ['shifts', 'no-team'],
    queryFn: () => fetchShiftsForTeam(teamId as string),
    enabled: !!teamId,
  });

  // Realtime — invalidate on any team-scoped change. Channel is keyed
  // by team so we don't leak cross-tenant subscriptions.
  useEffect(() => {
    if (!teamId) return;
    const channel = supabase
      .channel(`shifts:${teamId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'shifts',
          filter: `team_id=eq.${teamId}`,
        },
        () => {
          qc.invalidateQueries({ queryKey: qk.shifts.byTeam(teamId) });
        },
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [teamId, qc]);

  const createShift = useMutation({
    mutationKey: ['shifts', 'create'],
    mutationFn: async (shiftData: CreateShiftData) => {
      if (!teamId) throw new Error('No team assigned');
      const { data, error } = await supabase
        .from('shifts')
        .insert({
          team_id: teamId,
          ...shiftData,
          is_vacant: !shiftData.assigned_worker_id,
        })
        .select(SHIFT_SELECT)
        .single();
      if (error) throw error;
      return data as unknown as DatabaseShift;
    },
    onSuccess: () => {
      if (teamId) qc.invalidateQueries({ queryKey: qk.shifts.byTeam(teamId) });
      toast.success('Shift created');
    },
    onError: () => toast.error('Failed to create shift'),
  });

  const updateShift = useMutation({
    mutationKey: ['shifts', 'update'],
    mutationFn: async ({ shiftId, updates }: { shiftId: string; updates: UpdateShiftData }) => {
      const updateData: Record<string, unknown> = { ...updates };
      if ('assigned_worker_id' in updates) {
        updateData.is_vacant = !updates.assigned_worker_id;
      }
      const { data, error } = await supabase
        .from('shifts')
        .update(updateData)
        .eq('id', shiftId)
        .select(SHIFT_SELECT)
        .single();
      if (error) throw error;
      return data as unknown as DatabaseShift;
    },
    onSuccess: () => {
      if (teamId) qc.invalidateQueries({ queryKey: qk.shifts.byTeam(teamId) });
      toast.success('Shift updated');
    },
    onError: () => toast.error('Failed to update shift'),
  });

  const deleteShift = useMutation({
    mutationKey: ['shifts', 'delete'],
    mutationFn: async (shiftId: string) => {
      const { error } = await supabase.from('shifts').delete().eq('id', shiftId);
      if (error) throw error;
      return shiftId;
    },
    onSuccess: () => {
      if (teamId) qc.invalidateQueries({ queryKey: qk.shifts.byTeam(teamId) });
      toast.success('Shift deleted');
    },
    onError: () => toast.error('Failed to delete shift'),
  });

  return {
    shifts: query.data ?? [],
    loading: query.isLoading,
    error: query.error ? (query.error as Error).message : null,
    fetchShifts: () => query.refetch(),
    createShift: (data: CreateShiftData) => createShift.mutateAsync(data).catch(() => null),
    updateShift: (shiftId: string, updates: UpdateShiftData) =>
      updateShift.mutateAsync({ shiftId, updates }).catch(() => null),
    deleteShift: (shiftId: string) =>
      deleteShift.mutateAsync(shiftId).then(() => true).catch(() => false),
    assignWorker: (shiftId: string, workerId: string | null) =>
      updateShift
        .mutateAsync({ shiftId, updates: { assigned_worker_id: workerId || undefined } })
        .catch(() => null),
  };
}
