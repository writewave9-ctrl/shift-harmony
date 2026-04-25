import { useState, useEffect, useCallback } from 'react';
import { CheckInButton } from '@/components/CheckInButton';
import { OpenShiftsSection } from '@/components/OpenShiftsSection';
import { IncomingSwapsCard } from '@/components/IncomingSwapsCard';
import { PullToRefresh } from '@/components/PullToRefresh';
import { WorkerHomeSkeleton } from '@/components/PageSkeletons';
import { MotionCard, MotionSection } from '@/components/MotionWrapper';
import { Calendar, Bell, ChevronRight, MapPin, Clock, AlertCircle, AlertOctagon } from 'lucide-react';
import { CallOffRequestModal } from '@/components/CallOffRequestModal';
import { CallOffStatusBanner } from '@/components/CallOffStatusBanner';
import { ShiftActivityTimeline } from '@/components/ShiftActivityTimeline';
import { useShiftActivity } from '@/hooks/useShiftActivity';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useGeolocation } from '@/hooks/useGeolocation';
import { useNotifications } from '@/hooks/useNotifications';
import { haptics } from '@/lib/haptics';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { formatTimeRange } from '@/lib/formatTime';
import { OnboardingChecklist } from '@/components/OnboardingChecklist';

interface WorkerShift {
  id: string;
  date: string;
  start_time: string;
  end_time: string;
  position: string;
  location: string;
  latitude: number | null;
  longitude: number | null;
  check_in_radius_meters: number | null;
  status: string;
}

export const WorkerHome = () => {
  const navigate = useNavigate();
  const { user, profile } = useAuth();
  const [isCheckedIn, setIsCheckedIn] = useState(false);
  const [checkInTime, setCheckInTime] = useState<string>();
  const [attendanceStatus, setAttendanceStatus] = useState<'not_checked_in' | 'present' | 'late' | 'manually_approved'>('present');
  const [isManagerOverride, setIsManagerOverride] = useState(false);
  const [overrideReason, setOverrideReason] = useState<string | null>(null);
  const [shifts, setShifts] = useState<WorkerShift[]>([]);
  const [loading, setLoading] = useState(true);
  const [isWithinProximity, setIsWithinProximity] = useState<boolean | null>(null);
  const [distanceMeters, setDistanceMeters] = useState<number | null>(null);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [callOffShift, setCallOffShift] = useState<WorkerShift | null>(null);
  
  const { isWithinRadius, loading: checkingLocation } = useGeolocation();
  const { notifications, unreadCount } = useNotifications();

  const fetchData = useCallback(async () => {
    if (!profile?.id) {
      setShifts([]);
      setLoading(false);
      return;
    }

    try {
      const today = new Date().toISOString().split('T')[0];
      const { data: shiftsData } = await supabase
        .from('shifts')
        .select('*')
        .eq('assigned_worker_id', profile.id)
        .gte('date', today)
        .order('date', { ascending: true })
        .order('start_time', { ascending: true })
        .limit(5);

      setShifts(shiftsData || []);

      if (shiftsData && shiftsData.length > 0) {
        const todayShift = shiftsData.find(s => s.date === today);
        if (todayShift) {
          const { data: attendance } = await supabase
            .from('attendance_records')
            .select('*')
            .eq('shift_id', todayShift.id)
            .eq('worker_id', profile.id)
            .maybeSingle();

          if (attendance) {
            const hasCheckIn = !!attendance.check_in_time;
            const isOverride = !!attendance.manual_override_by;
            // Worker is "checked in" if they tapped check-in OR a manager set a positive status
            const positiveOverride = isOverride && ['present', 'late', 'manually_approved'].includes(attendance.status);
            if (hasCheckIn || positiveOverride) {
              setIsCheckedIn(true);
              const ts = attendance.check_in_time ?? attendance.override_timestamp;
              if (ts) {
                setCheckInTime(new Date(ts).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }));
              }
            }
            setAttendanceStatus((attendance.status as any) ?? 'present');
            setIsManagerOverride(isOverride);
            // Parse "[Reason] notes" — we only show reason chip text
            if (isOverride && attendance.override_notes) {
              const m = attendance.override_notes.match(/^\[([^\]]+)\]\s*(.*)$/);
              setOverrideReason(m ? (m[2] || m[1]) : attendance.override_notes);
            } else {
              setOverrideReason(null);
            }
          }
        }
      }
    } catch (err) {
      console.error('Error fetching data:', err);
    } finally {
      setLoading(false);
    }
  }, [profile?.id]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const todayStr = new Date().toISOString().split('T')[0];
  const todayShift = shifts.find(s => s.date === todayStr);
  const nextShifts = shifts.filter(s => s.date !== todayStr).slice(0, 3);
  const requiresProximity = !!(todayShift?.latitude && todayShift?.longitude);
  const { events: activityEvents } = useShiftActivity(todayShift?.id ?? null);

  // Realtime: refetch attendance when manager overrides happen on today's shift
  useEffect(() => {
    if (!todayShift?.id) return;
    const channel = supabase
      .channel(`worker-attendance-${todayShift.id}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'attendance_records', filter: `shift_id=eq.${todayShift.id}` },
        () => fetchData(),
      )
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [todayShift?.id, fetchData]);

  const handleCheckLocation = async () => {
    if (!todayShift?.latitude || !todayShift?.longitude) return;
    setLocationError(null);
    try {
      const result = await isWithinRadius(todayShift.latitude, todayShift.longitude, todayShift.check_in_radius_meters || 100);
      setIsWithinProximity(result.withinRadius);
      setDistanceMeters(result.distance);
      if (!result.withinRadius) toast.error(`You are ${Math.round(result.distance)}m away. Move closer to check in.`);
    } catch (err: any) {
      setLocationError(err.message);
      toast.error(err.message);
    }
  };

  const handleCheckIn = async () => {
    if (!todayShift || !profile?.id) return;
    const now = new Date();
    const time = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
    // Determine if Late based on shift start time
    const start = new Date(`${todayShift.date}T${todayShift.start_time}`);
    const isLate = now.getTime() > start.getTime() + 5 * 60 * 1000; // 5-min grace
    const newStatus = isLate ? 'late' : 'present';
    try {
      const { error } = await supabase.from('attendance_records').insert({
        shift_id: todayShift.id, worker_id: profile.id,
        check_in_time: now.toISOString(), status: newStatus, is_proximity_based: requiresProximity,
      });
      if (error) throw error;
      setCheckInTime(time);
      setIsCheckedIn(true);
      setAttendanceStatus(newStatus as any);
      setIsManagerOverride(false);
      haptics.success();
      toast.success(isLate ? 'Checked in (marked late)' : 'Checked in successfully!');
    } catch (err: any) {
      console.error('Error checking in:', err);
      toast.error('Failed to check in. Please try again.');
    }
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    if (date.toDateString() === today.toDateString()) return 'Today';
    if (date.toDateString() === tomorrow.toDateString()) return 'Tomorrow';
    return date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  };

  if (loading) return <WorkerHomeSkeleton />;

  return (
    <PullToRefresh onRefresh={async () => { haptics.medium(); await fetchData(); }}>
    <div className="min-h-screen bg-background">
      {/* Hero Header — editorial premium */}
      <header className="relative px-5 pt-7 pb-6 overflow-hidden">
        <div aria-hidden className="absolute inset-0 bg-gradient-mesh opacity-90 pointer-events-none" />
        <div aria-hidden className="absolute inset-x-0 -top-12 h-40 bg-gradient-hero pointer-events-none" />
        <div className="relative">
          <div className="flex items-center justify-between mb-3">
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground/80">{getGreeting()}</p>
            <button
              onClick={() => navigate('/worker/notifications')}
              aria-label={unreadCount > 0 ? `${unreadCount} unread notifications` : 'Notifications'}
              className="relative p-2.5 rounded-xl bg-card/70 backdrop-blur-md border border-border/40 shadow-soft hover:shadow-elevated hover:border-primary/25 transition-all"
            >
              <Bell className="w-[18px] h-[18px] text-foreground/80" />
              {unreadCount > 0 && (
                <span className="absolute top-1 right-1 min-w-[18px] h-[18px] px-1 inline-flex items-center justify-center text-[10px] font-bold text-primary-foreground bg-primary rounded-full ring-2 ring-background">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </button>
          </div>
          <h1 className="font-display text-[28px] leading-[1.05] font-semibold text-foreground tracking-tight">
            {profile?.full_name || 'Worker'}
          </h1>
          <p className="text-sm text-muted-foreground mt-1.5">
            {profile?.position || 'Team Member'}
          </p>
        </div>
      </header>

      <div className="px-5 space-y-5 pb-6">
        {/* Onboarding Checklist */}
        <MotionSection>
          <OnboardingChecklist />
        </MotionSection>

        {/* Today's Shift Card — luxe surface */}
        <MotionSection>
          {todayShift ? (
            <div className="relative rounded-3xl overflow-hidden bg-gradient-card-premium border border-border/50 shadow-card-premium">
              <div aria-hidden className="absolute inset-x-0 top-0 h-32 bg-gradient-shift-hero opacity-80 pointer-events-none" />
              <div aria-hidden className="absolute inset-0 texture-grain opacity-60 pointer-events-none" />
              <div className="relative px-5 pt-4 pb-3 border-b border-border/30 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="relative flex h-2 w-2">
                    <span className="absolute inline-flex h-full w-full rounded-full bg-primary/60 animate-ping" />
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-primary" />
                  </span>
                  <span className="text-[10.5px] font-bold text-primary uppercase tracking-[0.18em]">Today's Shift</span>
                </div>
                <span className="text-[10px] font-medium text-muted-foreground/80 uppercase tracking-wider">
                  {new Date().toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                </span>
              </div>
              <div className="relative p-5">
                <div className="text-center mb-5">
                  <p className="font-display text-[26px] leading-tight font-semibold text-foreground tracking-tight">
                    {formatTimeRange(todayShift.start_time, todayShift.end_time)}
                  </p>
                  <div className="flex items-center justify-center gap-3 mt-2.5 text-[13px] text-muted-foreground">
                    <span className="inline-flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5" />{todayShift.position}
                    </span>
                    <span className="w-1 h-1 rounded-full bg-border" />
                    <span className="inline-flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5" />{todayShift.location}
                    </span>
                  </div>
                </div>
                <CheckInButton
                  isCheckedIn={isCheckedIn} checkInTime={checkInTime} onCheckIn={handleCheckIn}
                  attendanceStatus={attendanceStatus}
                  isManagerOverride={isManagerOverride}
                  overrideReason={overrideReason}
                  requiresProximity={requiresProximity} isWithinProximity={isWithinProximity}
                  distanceMeters={distanceMeters} checkingLocation={checkingLocation}
                  locationError={locationError} onCheckLocation={handleCheckLocation}
                />
                <div className="mt-5 pt-3.5 border-t border-border/40 flex items-center justify-between gap-2">
                  <button
                    onClick={() => navigate('/worker/shifts')}
                    className="group flex items-center gap-1 text-[13px] text-primary font-semibold hover:gap-1.5 transition-all"
                  >
                    Request change<ChevronRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5" />
                  </button>
                  <button
                    onClick={() => setCallOffShift(todayShift)}
                    className="flex items-center gap-1.5 text-[12px] text-warning hover:text-warning/85 font-semibold transition-colors"
                  >
                    <AlertOctagon className="w-3.5 h-3.5" />Can't make it?
                  </button>
                </div>
                {activityEvents.length > 0 && (
                  <div className="mt-4 pt-4 border-t border-border/40">
                    <ShiftActivityTimeline events={activityEvents} />
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="relative rounded-3xl p-8 text-center bg-gradient-card-premium border border-border/50 shadow-card-premium overflow-hidden">
              <div aria-hidden className="absolute inset-0 bg-gradient-mesh opacity-60 pointer-events-none" />
              <div className="relative">
                <div className="w-16 h-16 mx-auto rounded-2xl bg-card/80 ring-1 ring-border flex items-center justify-center mb-4 shadow-soft">
                  <Calendar className="w-7 h-7 text-muted-foreground/70" />
                </div>
                <p className="font-display text-xl font-semibold text-foreground tracking-tight">No shift today</p>
                <p className="text-muted-foreground text-sm mt-1">Enjoy your day off.</p>
                {nextShifts.length > 0 && (
                  <p className="text-sm text-primary font-semibold mt-4">
                    Next shift · {formatDate(nextShifts[0].date)}
                  </p>
                )}
              </div>
            </div>
          )}
        </MotionSection>

        {/* Call-off status banners (auto-hide after shift end) */}
        <MotionSection delay={0.05}>
          <CallOffStatusBanner />
        </MotionSection>
        {unreadCount > 0 && notifications.filter(n => !n.read).length > 0 && (
          <MotionSection delay={0.1}>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-[11px] font-bold uppercase tracking-[0.16em] text-muted-foreground flex items-center gap-2">
                <AlertCircle className="w-3.5 h-3.5 text-primary" />New for you
              </h2>
              <button onClick={() => navigate('/worker/notifications')} className="text-[11px] text-primary font-semibold uppercase tracking-wider hover:underline">View all</button>
            </div>
            <div className="space-y-2">
              {notifications.filter(n => !n.read).slice(0, 2).map((notification) => (
                <MotionCard
                  key={notification.id}
                  onClick={() => navigate('/worker/notifications')}
                  className="w-full rounded-2xl p-4 text-left cursor-pointer bg-card border border-border/50 shadow-soft hover:shadow-elevated hover:border-primary/30 transition-all"
                >
                  <p className="font-semibold text-foreground text-[13.5px] leading-tight">{notification.title}</p>
                  <p className="text-xs text-muted-foreground mt-1 line-clamp-1">{notification.message}</p>
                </MotionCard>
              ))}
            </div>
          </MotionSection>
        )}

        {/* Incoming Swap Requests */}
        <MotionSection delay={0.18}>
          <IncomingSwapsCard />
        </MotionSection>

        {/* Open Shifts */}
        <MotionSection delay={0.2}>
          <OpenShiftsSection />
        </MotionSection>

        {/* Upcoming Shifts */}
        {nextShifts.length > 0 && (
          <MotionSection delay={0.3}>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-[11px] font-bold uppercase tracking-[0.16em] text-muted-foreground">Upcoming</h2>
              <button onClick={() => navigate('/worker/shifts')} className="text-[11px] text-primary font-semibold uppercase tracking-wider hover:underline">View all</button>
            </div>
            <div className="space-y-2.5">
              {nextShifts.map((shift, index) => (
                <MotionCard
                  key={shift.id}
                  className={cn(
                    "group relative rounded-2xl p-4 bg-card border border-border/50 shadow-soft hover:shadow-elevated hover:border-primary/25 transition-all overflow-hidden",
                    index === 0 && "ring-1 ring-primary/20"
                  )}
                >
                  {index === 0 && (
                    <span aria-hidden className="absolute inset-y-0 left-0 w-[3px] bg-gradient-to-b from-primary via-primary/80 to-primary/40" />
                  )}
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <span className={cn(
                        "inline-block text-[10.5px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md mb-1.5",
                        index === 0 ? "bg-primary/10 text-primary ring-1 ring-primary/20" : "bg-muted text-muted-foreground"
                      )}>
                        {formatDate(shift.date)}
                      </span>
                      <p className="font-display font-semibold text-foreground text-[15px] tracking-tight">{formatTimeRange(shift.start_time, shift.end_time)}</p>
                      <p className="text-xs text-muted-foreground mt-0.5 truncate">{shift.position} · {shift.location}</p>
                    </div>
                    <ChevronRight className="w-4 h-4 text-muted-foreground/40 group-hover:text-primary group-hover:translate-x-0.5 transition-all" />
                  </div>
                </MotionCard>
              ))}
            </div>
          </MotionSection>
        )}

        {!todayShift && nextShifts.length === 0 && (
          <MotionSection className="text-center py-8">
            <p className="text-muted-foreground text-sm">No upcoming shifts scheduled</p>
            <button onClick={() => navigate('/worker/shifts')} className="text-sm text-primary font-medium mt-2 hover:underline">
              View available shifts
            </button>
          </MotionSection>
        )}
      </div>
    </div>
    <CallOffRequestModal
      open={!!callOffShift}
      onOpenChange={(o) => !o && setCallOffShift(null)}
      shift={callOffShift}
      onSubmitted={() => fetchData()}
    />
    </PullToRefresh>
  );
};

export default WorkerHome;
