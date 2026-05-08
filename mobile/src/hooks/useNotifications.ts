import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { qk } from '@/lib/queryClient';

export interface Notification {
  id: string;
  user_id: string;
  type: string;
  title: string;
  message: string;
  priority: string;
  read: boolean;
  created_at: string;
  related_shift_id: string | null;
}

export function useNotifications(userId: string | undefined) {
  return useQuery({
    queryKey: userId ? qk.notifications.byUser(userId) : ['notifications', 'none'],
    enabled: !!userId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', userId!)
        .order('created_at', { ascending: false })
        .limit(50);
      if (error) throw error;
      return (data ?? []) as Notification[];
    },
  });
}
