import React from 'react';
import { View, Text, ScrollView, RefreshControl } from 'react-native';
import { Calendar } from 'lucide-react-native';
import { useAuth } from '@/contexts/AuthContext';
import { useWorkerUpcomingShifts } from '@/hooks/useShifts';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { EmptyState } from '@/components/ui/Feedback';
import { formatTimeRange } from '@/lib/formatTime';
import { format, parseISO } from 'date-fns';

export function WorkerShifts() {
  const { profile } = useAuth();
  const { data: shifts = [], refetch, isRefetching } = useWorkerUpcomingShifts(profile?.id);

  return (
    <ScrollView
      className="flex-1"
      contentContainerStyle={{ padding: 16, paddingBottom: 32 }}
      refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={() => refetch()} />}
    >
      <Text className="font-display text-[26px] text-foreground mb-4" style={{ letterSpacing: -0.7 }}>
        My shifts
      </Text>

      {shifts.length === 0 ? (
        <EmptyState
          icon={<Calendar size={28} color="rgb(var(--muted-foreground))" />}
          title="No upcoming shifts"
          description="Once your manager schedules you, shifts will appear here."
        />
      ) : (
        <View className="gap-2.5">
          {shifts.map(s => (
            <Card key={s.id} className="gap-2">
              <View className="flex-row items-center justify-between">
                <Text className="text-foreground text-[15px] font-sans-semibold">
                  {format(parseISO(s.date), 'EEE, MMM d')}
                </Text>
                <Badge variant="info">{s.status}</Badge>
              </View>
              <Text className="text-muted-foreground text-sm">
                {formatTimeRange(s.start_time, s.end_time)}
              </Text>
              {s.position ? (
                <Text className="text-muted-foreground text-xs">{s.position}{s.location ? ` • ${s.location}` : ''}</Text>
              ) : null}
            </Card>
          ))}
        </View>
      )}
    </ScrollView>
  );
}
