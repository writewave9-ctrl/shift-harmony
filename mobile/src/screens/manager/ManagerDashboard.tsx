import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, ScrollView, RefreshControl } from 'react-native';
import { Calendar, Users, AlertTriangle, Inbox } from 'lucide-react-native';
import { useAuth } from '@/contexts/AuthContext';
import { useTeamShifts } from '@/hooks/useShifts';
import { Card, CardTitle, CardDescription } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { supabase } from '@/integrations/supabase/client';
import { format, parseISO } from 'date-fns';
import { formatTimeRange } from '@/lib/formatTime';

export function ManagerDashboard() {
  const { profile } = useAuth();
  const teamId = profile?.active_team_id || profile?.team_id || undefined;
  const { data: shifts = [], refetch, isRefetching } = useTeamShifts(teamId);
  const [pendingSwaps, setPendingSwaps] = useState(0);
  const [pendingPickups, setPendingPickups] = useState(0);

  useEffect(() => {
    if (!teamId) return;
    void (async () => {
      const [{ count: swapCount }, { count: reqCount }] = await Promise.all([
        supabase.from('swap_requests').select('id', { count: 'exact', head: true }).eq('status', 'pending'),
        supabase.from('shift_requests').select('id', { count: 'exact', head: true }).eq('status', 'pending'),
      ]);
      setPendingSwaps(swapCount ?? 0);
      setPendingPickups(reqCount ?? 0);
    })();
  }, [teamId, shifts.length]);

  const today = new Date().toISOString().split('T')[0];
  const todayShifts = useMemo(() => shifts.filter(s => s.date === today), [shifts, today]);
  const vacant = useMemo(() => shifts.filter(s => !s.assigned_worker_id), [shifts]);

  return (
    <ScrollView
      className="flex-1"
      contentContainerStyle={{ padding: 16, paddingBottom: 32 }}
      refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={() => refetch()} />}
    >
      <Text className="text-muted-foreground text-sm">{format(new Date(), 'EEEE, MMM d')}</Text>
      <Text className="font-display text-[28px] text-foreground mt-1 mb-5" style={{ letterSpacing: -0.8 }}>
        Today at a glance
      </Text>

      <View className="flex-row gap-2.5 mb-5">
        <Stat icon={<Calendar size={18} color="rgb(var(--primary))" />} label="Today" value={String(todayShifts.length)} />
        <Stat icon={<AlertTriangle size={18} color="rgb(var(--warning))" />} label="Vacant" value={String(vacant.length)} />
        <Stat icon={<Inbox size={18} color="rgb(var(--info))" />} label="Pending" value={String(pendingSwaps + pendingPickups)} />
      </View>

      <Text className="text-foreground text-sm font-sans-semibold mb-2 px-1">Today's coverage</Text>
      {todayShifts.length === 0 ? (
        <Card className="items-center py-8">
          <CardTitle>No shifts today</CardTitle>
          <CardDescription className="mt-1 text-center">Schedule shifts from the Shifts tab.</CardDescription>
        </Card>
      ) : (
        <View className="gap-2">
          {todayShifts.map(s => (
            <Card key={s.id} className="flex-row items-center justify-between">
              <View className="flex-1">
                <Text className="text-foreground text-[15px] font-sans-semibold">{s.position || 'Shift'}</Text>
                <Text className="text-muted-foreground text-xs mt-0.5">{formatTimeRange(s.start_time, s.end_time)}</Text>
              </View>
              <Badge variant={s.assigned_worker_id ? 'success' : 'warning'}>
                {s.assigned_worker_id ? 'Filled' : 'Open'}
              </Badge>
            </Card>
          ))}
        </View>
      )}

      {vacant.length > 0 && (
        <>
          <Text className="text-foreground text-sm font-sans-semibold mt-6 mb-2 px-1">Coverage gaps</Text>
          <Card className="gap-2">
            {vacant.slice(0, 5).map(v => (
              <View key={v.id} className="flex-row items-center justify-between py-1">
                <Text className="text-foreground text-sm">
                  {format(parseISO(v.date), 'MMM d')} • {v.position || 'Shift'}
                </Text>
                <Text className="text-muted-foreground text-xs">{formatTimeRange(v.start_time, v.end_time)}</Text>
              </View>
            ))}
          </Card>
        </>
      )}
    </ScrollView>
  );
}

function Stat({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <Card className="flex-1 gap-1.5 p-3.5">
      {icon}
      <Text className="text-muted-foreground text-xs">{label}</Text>
      <Text className="text-foreground text-2xl font-display" style={{ letterSpacing: -0.4 }}>{value}</Text>
    </Card>
  );
}
