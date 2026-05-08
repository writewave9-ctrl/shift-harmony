import React, { useMemo, useState } from 'react';
import { View, Text, ScrollView, RefreshControl, Pressable } from 'react-native';
import { Calendar, MapPin, Clock, CheckCircle2, AlertCircle } from 'lucide-react-native';
import { useAuth } from '@/contexts/AuthContext';
import { useWorkerUpcomingShifts, Shift } from '@/hooks/useShifts';
import { Card, CardTitle, CardDescription } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { EmptyState } from '@/components/ui/Feedback';
import { formatTimeRange } from '@/lib/formatTime';
import { supabase } from '@/integrations/supabase/client';
import { useGeolocation } from '@/hooks/useGeolocation';
import { toast } from 'sonner-native';
import { haptics } from '@/lib/haptics';
import { format, parseISO } from 'date-fns';

export function WorkerHome() {
  const { profile } = useAuth();
  const { data: shifts = [], isLoading, refetch, isRefetching } = useWorkerUpcomingShifts(profile?.id);
  const today = new Date().toISOString().split('T')[0];
  const todayShift = useMemo(() => shifts.find(s => s.date === today), [shifts, today]);
  const upcoming = useMemo(() => shifts.filter(s => s.date !== today).slice(0, 5), [shifts, today]);

  return (
    <ScrollView
      className="flex-1"
      contentContainerStyle={{ padding: 16, paddingBottom: 32 }}
      refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={() => refetch()} />}
    >
      <View className="mb-5">
        <Text className="text-muted-foreground text-sm">{format(new Date(), 'EEEE, MMM d')}</Text>
        <Text className="font-display text-[28px] text-foreground mt-1" style={{ letterSpacing: -0.8 }}>
          Hi, {profile?.full_name?.split(' ')[0] || 'there'}
        </Text>
      </View>

      <Text className="text-foreground text-sm font-sans-semibold mb-2 px-1">Today's shift</Text>
      {todayShift ? (
        <TodayShiftCard shift={todayShift} onCheckedIn={() => refetch()} />
      ) : (
        <Card className="items-center py-8">
          <Calendar size={28} color="rgb(var(--muted-foreground))" />
          <CardTitle className="mt-3">Your shift will appear here</CardTitle>
          <CardDescription className="mt-1 text-center">
            No shift scheduled for today. Pull down to refresh.
          </CardDescription>
        </Card>
      )}

      {upcoming.length > 0 && (
        <>
          <Text className="text-foreground text-sm font-sans-semibold mt-6 mb-2 px-1">Upcoming</Text>
          <View className="gap-2.5">
            {upcoming.map(s => <ShiftRow key={s.id} shift={s} />)}
          </View>
        </>
      )}

      {!isLoading && shifts.length === 0 && (
        <EmptyState
          icon={<Calendar size={28} color="rgb(var(--muted-foreground))" />}
          title="No upcoming shifts"
          description="When your manager schedules you, your shifts will show up here."
        />
      )}
    </ScrollView>
  );
}

function ShiftRow({ shift }: { shift: Shift }) {
  return (
    <Card className="flex-row items-center justify-between">
      <View className="flex-row items-center gap-3 flex-1">
        <View className="bg-accent rounded-xl items-center justify-center w-12 h-12">
          <Text className="text-accent-foreground text-[10px] font-sans-semibold uppercase">{format(parseISO(shift.date), 'MMM')}</Text>
          <Text className="text-accent-foreground text-base font-sans-bold leading-4">{format(parseISO(shift.date), 'd')}</Text>
        </View>
        <View className="flex-1">
          <Text className="text-foreground text-[15px] font-sans-semibold">{shift.position || 'Shift'}</Text>
          <Text className="text-muted-foreground text-xs mt-0.5">
            {formatTimeRange(shift.start_time, shift.end_time)}{shift.location ? ` • ${shift.location}` : ''}
          </Text>
        </View>
      </View>
    </Card>
  );
}

function TodayShiftCard({ shift, onCheckedIn }: { shift: Shift; onCheckedIn: () => void }) {
  const { isWithinRadius, loading } = useGeolocation();
  const [checking, setChecking] = useState(false);
  const [checkedIn, setCheckedIn] = useState(false);

  const checkIn = async () => {
    if (!shift) return;
    setChecking(true);
    try {
      const { within, distance } = await isWithinRadius(
        shift.latitude,
        shift.longitude,
        shift.check_in_radius_meters || 200,
      );
      if (!within) {
        haptics.error();
        toast.error('You\'re not at the shift location yet', {
          description: distance ? `About ${Math.round(distance)}m away.` : undefined,
        });
        return;
      }
      const { error } = await supabase.from('attendance_records').insert({
        shift_id: shift.id,
        worker_id: shift.assigned_worker_id!,
        check_in_time: new Date().toISOString(),
        is_proximity_based: true,
        status: 'present' as any,
      });
      if (error) throw error;
      haptics.success();
      setCheckedIn(true);
      toast.success('Checked in');
      onCheckedIn();
    } catch (e: any) {
      toast.error(e?.message ?? 'Could not check in');
    } finally {
      setChecking(false);
    }
  };

  return (
    <Card className="gap-4 p-5">
      <View className="flex-row items-start justify-between">
        <View className="flex-1">
          <Text className="text-muted-foreground text-xs uppercase tracking-wider font-sans-semibold">Today</Text>
          <Text className="font-display text-[26px] text-foreground mt-1" style={{ letterSpacing: -0.6 }}>
            {formatTimeRange(shift.start_time, shift.end_time)}
          </Text>
          <Text className="text-foreground text-[15px] font-sans-medium mt-1">{shift.position || 'Shift'}</Text>
        </View>
        <Badge variant={checkedIn ? 'success' : 'info'}>{checkedIn ? 'Checked in' : 'Scheduled'}</Badge>
      </View>

      {shift.location ? (
        <View className="flex-row items-center gap-2">
          <MapPin size={14} color="rgb(var(--muted-foreground))" />
          <Text className="text-muted-foreground text-sm">{shift.location}</Text>
        </View>
      ) : null}

      <Button onPress={checkIn} loading={checking || loading} disabled={checkedIn}>
        {checkedIn ? 'Checked in' : 'Check in now'}
      </Button>
    </Card>
  );
}
