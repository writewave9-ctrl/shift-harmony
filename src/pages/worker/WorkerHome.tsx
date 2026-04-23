import { useState, useEffect, useCallback } from 'react';
import { CheckInButton } from '@/components/CheckInButton';
import { OpenShiftsSection } from '@/components/OpenShiftsSection';
import { IncomingSwapsCard } from '@/components/IncomingSwapsCard';
import { PullToRefresh } from '@/components/PullToRefresh';
import { WorkerHomeSkeleton } from '@/components/PageSkeletons';
import { MotionCard, MotionSection } from '@/components/MotionWrapper';
import { Calendar, Bell, ChevronRight, MapPin, Clock, AlertCircle, AlertOctagon } from 'lucide-react';
import { CallOffRequestModal } from '@/components/CallOffRequestModal';
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

          if (attendance?.check_in_time) {
            setIsCheckedIn(true);
            setCheckInTime(new Date(attendance.check_in_time).toLocaleTimeString('en-US', { 
              hour: '2-digit', 
              minute: '2-digit' 
            }));
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
    try {
      const { error } = await supabase.from('attendance_records').insert({
        shift_id: todayShift.id, worker_id: profile.id,
        check_in_time: now.toISOString(), status: 'present', is_proximity_based: requiresProximity,
      });
      if (error) throw error;
      setCheckInTime(time);
      setIsCheckedIn(true);
      haptics.success();
      toast.success('Checked in successfully!');
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
      {/* Hero Header */}
      <header className="px-5 pt-6 pb-5">
        <div className="flex items-center justify-between mb-2">
          <p className="text-sm font-medium text-muted-foreground">{getGreeting()}</p>
          <button 
            onClick={() => navigate('/worker/notifications')}
            className="relative p-2.5 rounded-xl hover:bg-accent/80 transition-colors"
          >
            <Bell className="w-5 h-5 text-muted-foreground" />
            {unreadCount > 0 && (
              <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 bg-primary rounded-full ring-2 ring-background" />
            )}
          </button>
        </div>
        <h1 className="text-2xl font-bold text-foreground tracking-tight">{profile?.full_name || 'Worker'}</h1>
        <p className="text-sm text-muted-foreground mt-0.5">{profile?.position || 'Team Member'}</p>
      </header>

      <div className="px-5 space-y-5 pb-6">
        {/* Onboarding Checklist */}
        <MotionSection>
          <OnboardingChecklist />
        </MotionSection>

        {/* Today's Shift Card */}
        <MotionSection>
          {todayShift ? (
            <div className="rounded-2xl overflow-hidden bg-card border border-border/50 shadow-sm">
              <div className="bg-gradient-to-r from-primary/8 via-primary/5 to-transparent px-5 py-3 border-b border-border/30">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                  <span className="text-xs font-semibold text-primary uppercase tracking-wider">Today's Shift</span>
                </div>
              </div>
              <div className="p-5">
                <div className="text-center mb-5">
                  <p className="text-2xl font-bold text-foreground tracking-tight">
                    {formatTimeRange(todayShift.start_time, todayShift.end_time)}
                  </p>
                  <div className="flex items-center justify-center gap-4 mt-3">
                    <span className="flex items-center gap-1.5 text-sm text-muted-foreground">
                      <Clock className="w-3.5 h-3.5" />{todayShift.position}
                    </span>
                    <span className="w-1 h-1 rounded-full bg-border" />
                    <span className="flex items-center gap-1.5 text-sm text-muted-foreground">
                      <MapPin className="w-3.5 h-3.5" />{todayShift.location}
                    </span>
                  </div>
                </div>
                <CheckInButton
                  isCheckedIn={isCheckedIn} checkInTime={checkInTime} onCheckIn={handleCheckIn}
                  requiresProximity={requiresProximity} isWithinProximity={isWithinProximity}
                  distanceMeters={distanceMeters} checkingLocation={checkingLocation}
                  locationError={locationError} onCheckLocation={handleCheckLocation}
                />
                <div className="mt-4 pt-3 border-t border-border/30 flex items-center justify-between gap-2">
                  <button
                    onClick={() => navigate('/worker/shifts')}
                    className="flex items-center gap-1.5 text-sm text-primary font-medium hover:text-primary/80 transition-colors"
                  >
                    Request Change<ChevronRight className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => setCallOffShift(todayShift)}
                    className="flex items-center gap-1.5 text-xs text-warning hover:text-warning/80 font-medium transition-colors"
                  >
                    <AlertOctagon className="w-3.5 h-3.5" />Can't make it?
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="rounded-2xl p-8 text-center bg-card border border-border/50 shadow-sm">
              <div className="w-16 h-16 mx-auto rounded-2xl bg-muted/80 flex items-center justify-center mb-4">
                <Calendar className="w-7 h-7 text-muted-foreground/60" />
              </div>
              <p className="font-semibold text-foreground text-lg">No shift today</p>
              <p className="text-muted-foreground text-sm mt-1">Enjoy your day off!</p>
              {nextShifts.length > 0 && (
                <p className="text-sm text-primary font-medium mt-4">
                  Next shift: {formatDate(nextShifts[0].date)}
                </p>
              )}
            </div>
          )}
        </MotionSection>

        {/* Recent Notifications */}
        {unreadCount > 0 && notifications.filter(n => !n.read).length > 0 && (
          <MotionSection delay={0.1}>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-semibold text-foreground flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-primary" />New Notifications
              </h2>
              <button onClick={() => navigate('/worker/notifications')} className="text-xs text-primary font-medium hover:underline">View All</button>
            </div>
            <div className="space-y-2">
              {notifications.filter(n => !n.read).slice(0, 2).map((notification) => (
                <MotionCard
                  key={notification.id}
                  onClick={() => navigate('/worker/notifications')}
                  className="w-full rounded-xl p-4 text-left cursor-pointer bg-card border border-border/50 shadow-sm hover:shadow-md transition-shadow"
                >
                  <p className="font-medium text-foreground text-sm">{notification.title}</p>
                  <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">{notification.message}</p>
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
              <h2 className="text-sm font-semibold text-foreground">Upcoming Shifts</h2>
              <button onClick={() => navigate('/worker/shifts')} className="text-xs text-primary font-medium hover:underline">View All</button>
            </div>
            <div className="space-y-2.5">
              {nextShifts.map((shift, index) => (
                <MotionCard
                  key={shift.id}
                  className={cn(
                    "rounded-xl p-4 bg-card border border-border/50 shadow-sm",
                    index === 0 && "border-l-[3px] border-l-primary"
                  )}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <span className={cn(
                        "inline-block text-xs font-medium px-2 py-0.5 rounded-md mb-1.5",
                        index === 0 ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"
                      )}>
                        {formatDate(shift.date)}
                      </span>
                      <p className="font-semibold text-foreground text-sm">{formatTimeRange(shift.start_time, shift.end_time)}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">{shift.position} • {shift.location}</p>
                    </div>
                    <ChevronRight className="w-4 h-4 text-muted-foreground/50" />
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
