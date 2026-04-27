import { useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { qk } from '@/lib/queryClient';

/**
 * Attendance state for a single shift, scoped to the current user's profile.
 * RLS guarantees workers only see their own attendance and managers only
 * see attendance for their team's shifts.
 */
export interface AttendanceRecord {
  id: string;
  shift_id: string;
  worker_id: string;
  status: 'not_checked_in' | 'present' | 'late' | 'manually_approved';
  check_in_time: string | null;
  check_out_time: string | null;
  is_proximity_based: boolean | null;
  manual_override_by: string | null;
  override_notes: string | null;
  override_timestamp: string | null;
}

const attendanceKey = (shiftId: string) => ['attendance', 'shift', shiftId] as const;

async function fetchAttendance(shiftId: string, workerId: string): Promise<AttendanceRecord | null> {
  const { data, error } = await supabase
    .from('attendance_records')
    .select('*')
    .eq('shift_id', shiftId)
    .eq('worker_id', workerId)
    .maybeSingle();
  if (error) throw error;
  return (data as AttendanceRecord) ?? null;
}

/**
 * Worker-side attendance hook.
 * - Fetches the caller's own attendance record for the given shift.
 * - Subscribes to manager overrides in realtime.
 * - Provides a checkIn mutation that respects RLS (sets worker_id = own profile).
 */
export function useAttendance(shiftId: string | null | undefined) {
  const { profile } = useAuth();
  const workerId = profile?.id ?? null;
  const qc = useQueryClient();

  const query = useQuery({
    queryKey: shiftId ? attendanceKey(shiftId) : ['attendance', 'no-shift'],
    queryFn: () => fetchAttendance(shiftId as string, workerId as string),
    enabled: !!shiftId && !!workerId,
  });

  // Realtime — refetch on any change for this shift; RLS scopes results.
  useEffect(() => {
    if (!shiftId) return;
    const channel = supabase
      .channel(`attendance:${shiftId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'attendance_records', filter: `shift_id=eq.${shiftId}` },
        () => qc.invalidateQueries({ queryKey: attendanceKey(shiftId) }),
      )
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [shiftId, qc]);

  const checkIn = useMutation({
    mutationKey: ['attendance', 'checkIn'],
    mutationFn: async ({ isProximityBased, late }: { isProximityBased: boolean; late: boolean }) => {
      if (!shiftId || !workerId) throw new Error('Not ready');
      const status = late ? 'late' : 'present';
      const { error } = await supabase.from('attendance_records').insert({
        shift_id: shiftId,
        worker_id: workerId,
        check_in_time: new Date().toISOString(),
        status,
        is_proximity_based: isProximityBased,
      });
      if (error) throw error;
      return { status, late };
    },
    onSuccess: ({ late }) => {
      if (shiftId) qc.invalidateQueries({ queryKey: attendanceKey(shiftId) });
      toast.success(late ? 'Checked in (marked late)' : 'Checked in successfully!');
    },
    onError: () => toast.error('Failed to check in. Please try again.'),
  });

  return {
    record: query.data ?? null,
    loading: query.isLoading,
    error: query.error ? (query.error as Error).message : null,
    checkIn: (isProximityBased: boolean, late: boolean) =>
      checkIn.mutateAsync({ isProximityBased, late }).then(() => true).catch(() => false),
    refetch: () => query.refetch(),
  };
}

/**
 * Manager-side attendance override.
 * Uses upsert to create-or-replace the record for the worker on a shift.
 */
export function useAttendanceOverride() {
  const { profile } = useAuth();
  const qc = useQueryClient();

  return useMutation({
    mutationKey: ['attendance', 'override'],
    mutationFn: async ({
      shiftId,
      workerId,
      status,
      notes,
    }: {
      shiftId: string;
      workerId: string;
      status: 'present' | 'late' | 'manually_approved' | 'not_checked_in';
      notes: string;
    }) => {
      if (!profile?.id) throw new Error('Not signed in');
      const { error } = await supabase
        .from('attendance_records')
        .upsert(
          {
            shift_id: shiftId,
            worker_id: workerId,
            status,
            override_notes: notes,
            override_timestamp: new Date().toISOString(),
            manual_override_by: profile.id,
          },
          { onConflict: 'shift_id,worker_id' },
        );
      if (error) throw error;
      return shiftId;
    },
    onSuccess: (shiftId) => {
      qc.invalidateQueries({ queryKey: attendanceKey(shiftId) });
      toast.success('Attendance updated');
    },
    onError: () => toast.error('Failed to update attendance'),
  });
}
