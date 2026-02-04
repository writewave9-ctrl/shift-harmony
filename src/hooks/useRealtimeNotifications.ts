import { useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';

export const useRealtimeNotifications = () => {
  const { user } = useAuth();

  useEffect(() => {
    if (!user) return;

    // Subscribe to attendance record changes
    const attendanceChannel = supabase
      .channel('attendance_changes')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'attendance_records',
        },
        (payload) => {
          const newRecord = payload.new as any;
          
          // Check if this was a manual override
          if (newRecord.manual_override_by && newRecord.status === 'manually_approved') {
            toast({
              title: 'Attendance Override',
              description: 'Your attendance has been manually approved by a manager.',
            });
          }
        }
      )
      .subscribe();

    // Subscribe to swap request changes
    const swapChannel = supabase
      .channel('swap_changes')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'swap_requests',
        },
        (payload) => {
          const newRequest = payload.new as any;
          
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

    // Subscribe to notification inserts
    const notificationChannel = supabase
      .channel('notification_inserts')
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
  }, [user]);
};
