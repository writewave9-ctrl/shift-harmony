 import { useState, useEffect } from 'react';
 import { CheckInButton } from '@/components/CheckInButton';
 import { NotificationItem } from '@/components/NotificationItem';
 import { Calendar, Bell, ChevronRight, Loader2 } from 'lucide-react';
 import { useNavigate } from 'react-router-dom';
 import { supabase } from '@/integrations/supabase/client';
 import { useAuth } from '@/contexts/AuthContext';
 import { useGeolocation } from '@/hooks/useGeolocation';
 import { toast } from 'sonner';
 
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
 
 interface NotificationData {
   id: string;
   type: string;
   title: string;
   message: string;
   read: boolean;
   created_at: string;
 }
 
 export const WorkerHome = () => {
   const navigate = useNavigate();
   const { user, profile } = useAuth();
   const [isCheckedIn, setIsCheckedIn] = useState(false);
   const [checkInTime, setCheckInTime] = useState<string>();
   const [shifts, setShifts] = useState<WorkerShift[]>([]);
   const [notifications, setNotifications] = useState<NotificationData[]>([]);
   const [loading, setLoading] = useState(true);
   const [isWithinProximity, setIsWithinProximity] = useState<boolean | null>(null);
   const [distanceMeters, setDistanceMeters] = useState<number | null>(null);
   const [locationError, setLocationError] = useState<string | null>(null);
   
   const { isWithinRadius, loading: checkingLocation } = useGeolocation();
 
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
 
         if (user?.id) {
           const { data: notificationsData } = await supabase
             .from('notifications')
             .select('*')
             .eq('user_id', user.id)
             .order('created_at', { ascending: false })
             .limit(5);
 
           setNotifications(notificationsData || []);
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
   const nextShifts = shifts.filter(s => s.date !== todayStr).slice(0, 2);
   const unreadNotifications = notifications.filter(n => !n.read);
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
 
   if (loading) {
     return (
       <div className="min-h-screen bg-background flex items-center justify-center">
         <Loader2 className="w-8 h-8 animate-spin text-primary" />
       </div>
     );
   }
 
   return (
     <div className="min-h-screen bg-background pb-24">
       <header className="px-4 pt-8 pb-6">
         <div className="flex items-center justify-between mb-1">
           <p className="text-sm text-muted-foreground">Welcome back,</p>
           <button 
             onClick={() => navigate('/worker/notifications')}
             className="relative p-2 rounded-lg hover:bg-accent transition-colors"
           >
             <Bell className="w-5 h-5 text-muted-foreground" />
             {unreadNotifications.length > 0 && (
               <span className="absolute top-1 right-1 w-2 h-2 bg-primary rounded-full" />
             )}
           </button>
         </div>
         <h1 className="text-2xl font-bold text-foreground">{profile?.full_name || 'Worker'}</h1>
       </header>
 
       <div className="px-4 space-y-6 stagger-children">
         {todayShift && (
           <section className="card-elevated rounded-2xl p-5">
             <div className="flex items-center gap-2 mb-4">
               <Calendar className="w-4 h-4 text-primary" />
               <h2 className="text-sm font-medium text-muted-foreground">Today's Shift</h2>
             </div>
 
             <div className="text-center mb-6">
               <p className="text-3xl font-bold text-foreground">
                 {todayShift.start_time} - {todayShift.end_time}
               </p>
               <p className="text-muted-foreground mt-1">
                 {todayShift.position} • {todayShift.location}
               </p>
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
           </section>
         )}
 
         {!todayShift && (
           <section className="card-elevated rounded-2xl p-5 text-center">
             <Calendar className="w-12 h-12 mx-auto text-muted-foreground/50 mb-3" />
             <p className="font-semibold text-foreground">No shift today</p>
             <p className="text-sm text-muted-foreground mt-1">Enjoy your day off!</p>
           </section>
         )}
 
         {unreadNotifications.length > 0 && (
           <section>
             <div className="flex items-center justify-between mb-3">
               <h2 className="text-sm font-semibold text-foreground">Notifications</h2>
               <button 
                 onClick={() => navigate('/worker/notifications')}
                 className="text-xs text-primary font-medium"
               >
                 View All
               </button>
             </div>
             <div className="card-elevated rounded-xl divide-y divide-border/50">
               {unreadNotifications.slice(0, 2).map(notification => (
                 <NotificationItem
                   key={notification.id}
                   notification={{
                     id: notification.id,
                     type: notification.type as any,
                     title: notification.title,
                     message: notification.message,
                     read: notification.read,
                     createdAt: notification.created_at,
                   }}
                   onClick={() => {}}
                 />
               ))}
             </div>
           </section>
         )}
 
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
               {nextShifts.map(shift => (
                 <div key={shift.id} className="card-elevated rounded-xl p-4">
                   <div className="flex items-center justify-between">
                     <div>
                       <p className="text-xs text-muted-foreground mb-1">
                         {formatDate(shift.date)}
                       </p>
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
       </div>
     </div>
   );
 };
