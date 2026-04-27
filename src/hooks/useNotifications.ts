import { useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { qk } from '@/lib/queryClient';

export interface Notification {
  id: string;
  user_id: string;
  type: string;
  title: string;
  message: string;
  read: boolean;
  priority: string | null;
  action_url: string | null;
  related_shift_id: string | null;
  created_at: string;
}

async function fetchNotifications(userId: string): Promise<Notification[]> {
  const { data, error } = await supabase
    .from('notifications')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(50);
  if (error) throw error;
  return (data || []) as Notification[];
}

export const useNotifications = () => {
  const { user } = useAuth();
  const userId = user?.id ?? null;
  const qc = useQueryClient();

  const query = useQuery({
    queryKey: userId ? qk.notifications.byUser(userId) : ['notifications', 'anon'],
    queryFn: () => fetchNotifications(userId as string),
    enabled: !!userId,
  });

  // Realtime — INSERT only, scoped to this user.
  useEffect(() => {
    if (!userId) return;
    const channel = supabase
      .channel(`notifications:${userId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          const next = payload.new as Notification;
          // Optimistically add to the cache so the bell badge updates instantly.
          qc.setQueryData<Notification[]>(qk.notifications.byUser(userId), (prev) =>
            prev ? [next, ...prev] : [next],
          );
          toast(next.title, { description: next.message });
        },
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId, qc]);

  const markAsRead = useMutation({
    mutationKey: ['notifications', 'markRead'],
    mutationFn: async (notificationId: string) => {
      const { error } = await supabase
        .from('notifications')
        .update({ read: true })
        .eq('id', notificationId);
      if (error) throw error;
      return notificationId;
    },
    onMutate: async (notificationId) => {
      if (!userId) return;
      await qc.cancelQueries({ queryKey: qk.notifications.byUser(userId) });
      const previous = qc.getQueryData<Notification[]>(qk.notifications.byUser(userId));
      qc.setQueryData<Notification[]>(qk.notifications.byUser(userId), (prev) =>
        prev?.map((n) => (n.id === notificationId ? { ...n, read: true } : n)) ?? prev,
      );
      return { previous };
    },
    onError: (_e, _v, ctx) => {
      if (userId && ctx?.previous) {
        qc.setQueryData(qk.notifications.byUser(userId), ctx.previous);
      }
    },
  });

  const markAllAsRead = useMutation({
    mutationKey: ['notifications', 'markAllRead'],
    mutationFn: async () => {
      if (!userId) throw new Error('Not signed in');
      const { error } = await supabase
        .from('notifications')
        .update({ read: true })
        .eq('user_id', userId)
        .eq('read', false);
      if (error) throw error;
    },
    onSuccess: () => {
      if (!userId) return;
      qc.setQueryData<Notification[]>(qk.notifications.byUser(userId), (prev) =>
        prev?.map((n) => ({ ...n, read: true })) ?? prev,
      );
      toast.success('All notifications marked as read');
    },
  });

  const createNotification = async (
    targetUserId: string,
    type: string,
    title: string,
    message: string,
    options?: {
      priority?: 'high' | 'normal' | 'low';
      actionUrl?: string;
      relatedShiftId?: string;
    },
  ) => {
    const { error } = await supabase.from('notifications').insert({
      user_id: targetUserId,
      type,
      title,
      message,
      priority: options?.priority || 'normal',
      action_url: options?.actionUrl,
      related_shift_id: options?.relatedShiftId,
    });
    if (error) throw error;
  };

  const notifications = query.data ?? [];
  const unreadCount = notifications.filter((n) => !n.read).length;

  return {
    notifications,
    loading: query.isLoading,
    unreadCount,
    markAsRead: (id: string) => markAsRead.mutateAsync(id).catch(() => undefined),
    markAllAsRead: () => markAllAsRead.mutateAsync().catch(() => undefined),
    createNotification,
    refetch: () => query.refetch(),
  };
};
