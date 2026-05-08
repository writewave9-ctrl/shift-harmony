import React from 'react';
import { View, Text, ScrollView, RefreshControl, SectionList } from 'react-native';
import { Calendar } from 'lucide-react-native';
import { useAuth } from '@/contexts/AuthContext';
import { useTeamShifts } from '@/hooks/useShifts';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { EmptyState } from '@/components/ui/Feedback';
import { format, parseISO } from 'date-fns';
import { formatTimeRange } from '@/lib/formatTime';

export function ManagerShifts() {
  const { profile } = useAuth();
  const teamId = profile?.active_team_id || profile?.team_id || undefined;
  const { data: shifts = [], refetch, isRefetching } = useTeamShifts(teamId);

  const grouped = shifts.reduce<Record<string, typeof shifts>>((acc, s) => {
    (acc[s.date] ||= []).push(s);
    return acc;
  }, {});
  const sections = Object.keys(grouped)
    .sort()
    .map(date => ({ title: date, data: grouped[date] }));

  return (
    <View className="flex-1">
      {sections.length === 0 ? (
        <ScrollView
          contentContainerStyle={{ padding: 16, paddingBottom: 32 }}
          refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={() => refetch()} />}
        >
          <Text className="font-display text-[26px] text-foreground mb-4" style={{ letterSpacing: -0.7 }}>
            Shifts
          </Text>
          <EmptyState
            icon={<Calendar size={28} color="rgb(var(--muted-foreground))" />}
            title="No shifts scheduled yet"
            description="Create your first shift from the web app or your scheduling tool."
          />
        </ScrollView>
      ) : (
        <SectionList
          sections={sections as any}
          keyExtractor={(it: any) => it.id}
          contentContainerStyle={{ padding: 16, paddingBottom: 32 }}
          refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={() => refetch()} />}
          ListHeaderComponent={
            <Text className="font-display text-[26px] text-foreground mb-4" style={{ letterSpacing: -0.7 }}>Shifts</Text>
          }
          renderSectionHeader={({ section: { title } }) => (
            <Text className="text-muted-foreground text-xs font-sans-semibold uppercase tracking-wider mt-4 mb-2">
              {format(parseISO(title), 'EEE, MMM d')}
            </Text>
          )}
          renderItem={({ item }: any) => (
            <Card className="flex-row items-center justify-between mb-2">
              <View className="flex-1">
                <Text className="text-foreground text-[15px] font-sans-semibold">{item.position || 'Shift'}</Text>
                <Text className="text-muted-foreground text-xs mt-0.5">
                  {formatTimeRange(item.start_time, item.end_time)}{item.location ? ` • ${item.location}` : ''}
                </Text>
              </View>
              <Badge variant={item.assigned_worker_id ? 'success' : 'warning'}>
                {item.assigned_worker_id ? 'Filled' : 'Open'}
              </Badge>
            </Card>
          )}
        />
      )}
    </View>
  );
}
