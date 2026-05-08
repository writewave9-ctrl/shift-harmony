import React from 'react';
import { View, Text, ScrollView, RefreshControl } from 'react-native';
import { Bell } from 'lucide-react-native';
import { useAuth } from '@/contexts/AuthContext';
import { useNotifications } from '@/hooks/useNotifications';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { EmptyState } from '@/components/ui/Feedback';
import { formatDistanceToNow, parseISO } from 'date-fns';

export function WorkerNotifications() {
  const { user } = useAuth();
  const { data = [], refetch, isRefetching } = useNotifications(user?.id);

  return (
    <ScrollView
      className="flex-1"
      contentContainerStyle={{ padding: 16, paddingBottom: 32 }}
      refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={() => refetch()} />}
    >
      <Text className="font-display text-[26px] text-foreground mb-4" style={{ letterSpacing: -0.7 }}>Notifications</Text>
      {data.length === 0 ? (
        <EmptyState icon={<Bell size={28} color="rgb(var(--muted-foreground))" />} title="You're all caught up" />
      ) : (
        <View className="gap-2">
          {data.map(n => (
            <Card key={n.id} className="gap-1">
              <View className="flex-row items-center justify-between">
                <Text className="text-foreground text-[15px] font-sans-semibold flex-1" numberOfLines={1}>{n.title}</Text>
                {!n.read && <Badge variant="info">New</Badge>}
              </View>
              <Text className="text-muted-foreground text-sm">{n.message}</Text>
              <Text className="text-muted-foreground text-xs mt-1">{formatDistanceToNow(parseISO(n.created_at), { addSuffix: true })}</Text>
            </Card>
          ))}
        </View>
      )}
    </ScrollView>
  );
}
