import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { parseOverrideNotes, type ShiftActivityEvent } from '@/components/ShiftActivityTimeline';
import { callOffReasonLabel } from './useCallOffRequests';

/**
 * Aggregates the activity timeline for a single shift:
 *   • Shift created/scheduled
 *   • Worker check-in / check-out
 *   • Manager attendance overrides
 *   • Call-off requests (pending / approved / declined)
 *   • Swap requests (pending / approved / declined)
 *
 * Subscribes to realtime changes for any of the above and re-fetches.
 */
export function useShiftActivity(shiftId: string | null | undefined) {
  const [events, setEvents] = useState<ShiftActivityEvent[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchActivity = useCallback(async () => {
    if (!shiftId) {
      setEvents([]);
      return;
    }
    setLoading(true);
    try {
      const [shiftRes, attRes, callOffRes, swapRes] = await Promise.all([
        supabase
          .from('shifts')
          .select('id, created_at, status, date, start_time, end_time')
          .eq('id', shiftId)
          .maybeSingle(),
        supabase
          .from('attendance_records')
          .select('check_in_time, check_out_time, is_proximity_based, override_notes, override_timestamp, manual_override_by, status')
          .eq('shift_id', shiftId)
          .maybeSingle(),
        supabase
          .from('call_off_requests')
          .select('id, status, reason, custom_reason, created_at, updated_at, worker:profiles!call_off_requests_worker_id_fkey(full_name)')
          .eq('shift_id', shiftId)
          .order('created_at', { ascending: true }),
        supabase
          .from('swap_requests')
          .select('id, status, reason, created_at, updated_at, requester:profiles!swap_requests_requester_id_fkey(full_name), requested_worker:profiles!swap_requests_requested_worker_id_fkey(full_name)')
          .eq('shift_id', shiftId)
          .order('created_at', { ascending: true }),
      ]);

      const collected: ShiftActivityEvent[] = [];

      if (shiftRes.data?.created_at) {
        collected.push({
          label: 'Shift scheduled',
          at: shiftRes.data.created_at,
          tone: 'muted',
        });
      }

      const att = attRes.data;
      if (att?.check_in_time) {
        collected.push({
          label: 'Checked in',
          detail: att.is_proximity_based ? 'Auto via location' : 'Manual',
          at: att.check_in_time,
          tone: 'primary',
        });
      }
      if (att?.override_timestamp) {
        const parsed = parseOverrideNotes(att.override_notes);
        collected.push({
          label: 'Manager updated attendance',
          at: att.override_timestamp,
          reason: parsed.reason ?? undefined,
          notes: parsed.notes ?? undefined,
          tone: 'warning',
        });
      }
      if (att?.check_out_time) {
        collected.push({
          label: 'Checked out',
          at: att.check_out_time,
          tone: 'success',
        });
      }

      (callOffRes.data || []).forEach((c: any) => {
        const actor = c.worker?.full_name ?? null;
        const reason = callOffReasonLabel(c.reason);
        collected.push({
          label: 'Call-off requested',
          at: c.created_at,
          reason,
          notes: c.custom_reason || undefined,
          actor,
          tone: 'warning',
        });
        if (c.status !== 'pending' && c.updated_at && c.updated_at !== c.created_at) {
          collected.push({
            label: c.status === 'approved' ? 'Call-off approved · shift opened' : 'Call-off declined',
            at: c.updated_at,
            tone: c.status === 'approved' ? 'success' : 'muted',
          });
        }
      });

      (swapRes.data || []).forEach((s: any) => {
        const requester = s.requester?.full_name ?? 'Teammate';
        const target = s.requested_worker?.full_name;
        collected.push({
          label: target ? `Swap requested with ${target}` : 'Swap opened to team',
          at: s.created_at,
          actor: requester,
          notes: s.reason || undefined,
          tone: 'primary',
        });
        if (s.status !== 'pending' && s.updated_at && s.updated_at !== s.created_at) {
          collected.push({
            label: s.status === 'approved' ? 'Swap approved' : 'Swap declined',
            at: s.updated_at,
            tone: s.status === 'approved' ? 'success' : 'muted',
          });
        }
      });

      collected.sort((a, b) => new Date(a.at).getTime() - new Date(b.at).getTime());
      setEvents(collected);
    } catch (err) {
      console.error('Failed to load shift activity', err);
      setEvents([]);
    } finally {
      setLoading(false);
    }
  }, [shiftId]);

  useEffect(() => {
    fetchActivity();
  }, [fetchActivity]);

  // Realtime: refetch on any related table change for this shift
  useEffect(() => {
    if (!shiftId) return;
    const channel = supabase
      .channel(`shift-activity-${shiftId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'attendance_records', filter: `shift_id=eq.${shiftId}` }, fetchActivity)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'call_off_requests', filter: `shift_id=eq.${shiftId}` }, fetchActivity)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'swap_requests', filter: `shift_id=eq.${shiftId}` }, fetchActivity)
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [shiftId, fetchActivity]);

  return { events, loading, refetch: fetchActivity };
}
