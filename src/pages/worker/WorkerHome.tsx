import { useState } from 'react';
import { cn } from '@/lib/utils';
import { CheckInButton } from '@/components/CheckInButton';
import { ShiftCard } from '@/components/ShiftCard';
import { NotificationItem } from '@/components/NotificationItem';
import { currentWorker, getUpcomingWorkerShifts, notifications, getAttendanceForShift } from '@/data/mockData';
import { Calendar, Bell, ChevronRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const WorkerHome = () => {
  const navigate = useNavigate();
  const [isCheckedIn, setIsCheckedIn] = useState(false);
  const [checkInTime, setCheckInTime] = useState<string>();

  const upcomingShifts = getUpcomingWorkerShifts(currentWorker.id);
  const todayShift = upcomingShifts[0];
  const nextShifts = upcomingShifts.slice(1, 3);
  const unreadNotifications = notifications.filter(n => !n.read);

  const handleCheckIn = () => {
    const now = new Date();
    const time = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
    setCheckInTime(time);
    setIsCheckedIn(true);
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

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Header */}
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
        <h1 className="text-2xl font-bold text-foreground">{currentWorker.name}</h1>
      </header>

      <div className="px-4 space-y-6 stagger-children">
        {/* Today's Shift & Check-in */}
        {todayShift && (
          <section className="card-elevated rounded-2xl p-5">
            <div className="flex items-center gap-2 mb-4">
              <Calendar className="w-4 h-4 text-primary" />
              <h2 className="text-sm font-medium text-muted-foreground">
                {formatDate(todayShift.date)}'s Shift
              </h2>
            </div>

            <div className="text-center mb-6">
              <p className="text-3xl font-bold text-foreground">
                {todayShift.startTime} - {todayShift.endTime}
              </p>
              <p className="text-muted-foreground mt-1">
                {todayShift.position} • {todayShift.location}
              </p>
            </div>

            <CheckInButton
              isCheckedIn={isCheckedIn}
              checkInTime={checkInTime}
              onCheckIn={handleCheckIn}
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

        {/* Notifications */}
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
                  notification={notification}
                  onClick={() => {}}
                />
              ))}
            </div>
          </section>
        )}

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
              {nextShifts.map(shift => (
                <div key={shift.id} className="card-elevated rounded-xl p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">
                        {formatDate(shift.date)}
                      </p>
                      <p className="font-semibold text-foreground">
                        {shift.startTime} - {shift.endTime}
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
