import { useState, useEffect } from 'react';
import { CheckInButton } from '@/components/CheckInButton';
import { OpenShiftsSection } from '@/components/OpenShiftsSection';
import { Calendar, Bell, ChevronRight, Loader2, MapPin, Clock, AlertCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useGeolocation } from '@/hooks/useGeolocation';
import { useNotifications } from '@/hooks/useNotifications';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

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
  
  const { isWithinRadius, loading: checkingLocation } = useGeolocation();
  const { notifications, unreadCount } = useNotifications();

  useEffect(() => {
    const fetchData = async () => {
      if (!profile?.id) return;

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
    };

    fetchData();
  }, [profile?.id, user?.id]);

  const todayStr = new Date().toISOString().split('T')[0];
  const todayShift = shifts.find(s => s.date === todayStr);
  const nextShifts = shifts.filter(s => s.date !== todayStr).slice(0, 3);
  const requiresProximity = !!(todayShift?.latitude && todayShift?.longitude);

  const handleCheckLocation = async () => {
    if (!todayShift?.latitude || !todayShift?.longitude) return;
    
    setLocationError(null);
    try {
      const result = await isWithinRadius(
        todayShift.latitude,
        todayShift.longitude,
        todayShift.check_in_radius_meters || 100
      );
      setIsWithinProximity(result.withinRadius);
      setDistanceMeters(result.distance);
      
      if (!result.withinRadius) {
        toast.error(`You are ${Math.round(result.distance)}m away. Move closer to check in.`);
      }
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
      const { error } = await supabase
        .from('attendance_records')
        .insert({
          shift_id: todayShift.id,
          worker_id: profile.id,
          check_in_time: now.toISOString(),
          status: 'present',
          is_proximity_based: requiresProximity,
        });

      if (error) throw error;

      setCheckInTime(time);
      setIsCheckedIn(true);
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

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Header */}
      <header className="px-4 pt-8 pb-6 bg-gradient-to-b from-primary/5 to-transparent">
        <div className="flex items-center justify-between mb-1">
          <p className="text-sm text-muted-foreground">{getGreeting()}</p>
          <button 
            onClick={() => navigate('/worker/notifications')}
            className="relative p-2 rounded-lg hover:bg-accent transition-colors"
          >
            <Bell className="w-5 h-5 text-muted-foreground" />
            {unreadCount > 0 && (
              <span className="absolute top-1 right-1 w-2 h-2 bg-primary rounded-full" />
            )}
          </button>
        </div>
        <h1 className="text-2xl font-bold text-foreground">{profile?.full_name || 'Worker'}</h1>
        <p className="text-sm text-muted-foreground mt-0.5">{profile?.position || 'Team Member'}</p>
      </header>

      <div className="px-4 space-y-6">
        {/* Today's Shift Card */}
        {todayShift ? (
          <section className="card-elevated rounded-2xl overflow-hidden">
            <div className="bg-gradient-to-r from-primary/10 to-primary/5 px-5 py-3 border-b border-border/50">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-primary" />
                <span className="text-sm font-medium text-foreground">Today's Shift</span>
              </div>
            </div>

            <div className="p-5">
              <div className="text-center mb-6">
                <p className="text-4xl font-bold text-foreground tracking-tight">
                  {todayShift.start_time}
                  <span className="text-muted-foreground mx-2">—</span>
                  {todayShift.end_time}
                </p>
                <div className="flex items-center justify-center gap-4 mt-3 text-muted-foreground">
                  <span className="flex items-center gap-1.5">
                    <Clock className="w-4 h-4" />
                    {todayShift.position}
                  </span>
                  <span className="flex items-center gap-1.5">
                    <MapPin className="w-4 h-4" />
                    {todayShift.location}
                  </span>
                </div>
              </div>

              <CheckInButton
                isCheckedIn={isCheckedIn}
                checkInTime={checkInTime}
                onCheckIn={handleCheckIn}
                requiresProximity={requiresProximity}
                isWithinProximity={isWithinProximity}
                distanceMeters={distanceMeters}
                checkingLocation={checkingLocation}
                locationError={locationError}
                onCheckLocation={handleCheckLocation}
              />

              <button 
                onClick={() => navigate('/worker/shifts')}
                className="w-full mt-5 pt-4 border-t border-border/50 flex items-center justify-center gap-2 text-sm text-primary font-medium hover:underline"
              >
                Request Shift Change
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </section>
        ) : (
          <section className="card-elevated rounded-2xl p-6 text-center">
            <div className="w-16 h-16 mx-auto rounded-full bg-muted flex items-center justify-center mb-4">
              <Calendar className="w-8 h-8 text-muted-foreground" />
            </div>
            <p className="font-semibold text-foreground text-lg">No shift today</p>
            <p className="text-muted-foreground mt-1">Enjoy your day off!</p>
            {nextShifts.length > 0 && (
              <p className="text-sm text-primary mt-3">
                Next shift: {formatDate(nextShifts[0].date)}
              </p>
            )}
          </section>
        )}

        {/* Recent Notifications */}
        {unreadCount > 0 && notifications.filter(n => !n.read).length > 0 && (
          <section>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-semibold text-foreground flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-primary" />
                New Notifications
              </h2>
              <button 
                onClick={() => navigate('/worker/notifications')}
                className="text-xs text-primary font-medium"
              >
                View All
              </button>
            </div>
            <div className="space-y-2">
              {notifications.filter(n => !n.read).slice(0, 2).map(notification => (
                <button
                  key={notification.id}
                  onClick={() => navigate('/worker/notifications')}
                  className="w-full card-elevated rounded-xl p-4 text-left hover:bg-accent/30 transition-colors"
                >
                  <p className="font-medium text-foreground text-sm">{notification.title}</p>
                  <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">{notification.message}</p>
                </button>
              ))}
            </div>
          </section>
        )}

        {/* Open Shifts */}
        <OpenShiftsSection />

        {/* Upcoming Shifts */}
        {nextShifts.length > 0 && (
          <section>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-semibold text-foreground">Upcoming Shifts</h2>
              <button 
                onClick={() => navigate('/worker/shifts')}
                className="text-xs text-primary font-medium"
              >
                View All
              </button>
            </div>
            <div className="space-y-2">
              {nextShifts.map((shift, index) => (
                <div 
                  key={shift.id} 
                  className={cn(
                    "card-elevated rounded-xl p-4 transition-all",
                    index === 0 && "border-l-4 border-l-primary"
                  )}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className={cn(
                          "text-xs font-medium px-2 py-0.5 rounded-full",
                          index === 0 ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"
                        )}>
                          {formatDate(shift.date)}
                        </span>
                      </div>
                      <p className="font-semibold text-foreground">
                        {shift.start_time} - {shift.end_time}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {shift.position} • {shift.location}
                      </p>
                    </div>
                    <ChevronRight className="w-5 h-5 text-muted-foreground" />
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Empty State */}
        {!todayShift && nextShifts.length === 0 && (
          <section className="text-center py-8">
            <p className="text-muted-foreground">No upcoming shifts scheduled</p>
            <button 
              onClick={() => navigate('/worker/shifts')}
              className="text-sm text-primary font-medium mt-2 hover:underline"
            >
              View available shifts
            </button>
          </section>
        )}
      </div>
    </div>
  );
};

export default WorkerHome;
