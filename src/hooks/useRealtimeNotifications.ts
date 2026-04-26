import { useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';

/**
 * Subscribes to user-scoped realtime side-channels. All filtering is
 * primarily enforced by RLS (no row the user cannot SELECT will be
 * delivered) — we additionally use unique, user-scoped channel names so
 * Realtime fan-out across tabs/users stays cleanly partitioned, and we
 * defensively re-check identifiers on the client before showing toasts.
 */
export const useRealtimeNotifications = () => {
  const { user, profile } = useAuth();

  useEffect(() => {
    if (!user || !profile?.id) return;

    const profileId = profile.id;

    // Attendance overrides — RLS already restricts SELECT to the worker
    // (or their managers). We additionally check worker_id matches the
    // current profile before surfacing the toast, so a manager viewing
    // their own team's overrides doesn't get spurious "your attendance
    // was approved" notifications about other workers.
    const attendanceChannel = supabase
      .channel(`attendance:${user.id}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'attendance_records',
        },
        (payload) => {
          const newRecord = payload.new as any;
          if (newRecord.worker_id !== profileId) return;
          if (newRecord.manual_override_by && newRecord.status === 'manually_approved') {
            toast({
              title: 'Attendance Override',
              description: 'Your attendance has been manually approved by a manager.',
            });
          }
        }
      )
      .subscribe();

    // Swap requests — only show the toast if the requester is *me*. RLS
    // grants visibility to the whole team, so without this check a
    // manager would also see "your swap request was approved" toasts.
    const swapChannel = supabase
      .channel(`swaps:${user.id}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'swap_requests',
        },
        (payload) => {
          const newRequest = payload.new as any;
          if (newRequest.requester_id !== profileId) return;
          if (newRequest.status === 'approved') {
            toast({
              title: 'Swap Request Approved! ✓',
              description: 'Your shift swap request has been approved.',
            });
          } else if (newRequest.status === 'declined') {
            toast({
              title: 'Swap Request Declined',
              description: 'Your shift swap request was not approved.',
              variant: 'destructive',
            });
          }
        }
      )
      .subscribe();

    // Personal notification feed — already filtered server-side by user_id.
    const notificationChannel = supabase
      .channel(`notifications:${user.id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          const notification = payload.new as any;
          toast({
            title: notification.title,
            description: notification.message,
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(attendanceChannel);
      supabase.removeChannel(swapChannel);
      supabase.removeChannel(notificationChannel);
    };
  }, [user, profile?.id]);
};
