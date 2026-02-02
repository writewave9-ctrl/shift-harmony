import { useState } from 'react';
import { cn } from '@/lib/utils';
import { ShiftCard } from '@/components/ShiftCard';
import { StaffingIndicator } from '@/components/StaffingIndicator';
import { StatusBadge } from '@/components/StatusBadge';
import { NotificationItem } from '@/components/NotificationItem';
import { 
  currentManager, 
  getTodayShifts, 
  todayStaffingHealth, 
  managerNotifications,
  attendanceRecords,
  workers,
  swapRequests
} from '@/data/mockData';
import { 
  Bell, 
  Users, 
  Clock, 
  ChevronRight,
  AlertCircle,
  CheckCircle,
  User,
  ArrowRightLeft,
  Check,
  X
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';

export const ManagerDashboard = () => {
  const navigate = useNavigate();
  const [showSwapApproval, setShowSwapApproval] = useState(false);
  const [approvalDone, setApprovalDone] = useState(false);

  const todayShifts = getTodayShifts();
  const vacantShifts = todayShifts.filter(s => s.isVacant);
  const filledShifts = todayShifts.filter(s => !s.isVacant);
  const unreadNotifications = managerNotifications.filter(n => !n.read);

  const pendingSwaps = swapRequests.filter(s => s.status === 'pending');

  // Build attendance summary
  const attendanceSummary = {
    present: attendanceRecords.filter(a => a.status === 'present').length,
    late: attendanceRecords.filter(a => a.status === 'late').length,
    notCheckedIn: filledShifts.length - attendanceRecords.filter(a => a.status === 'present' || a.status === 'late').length,
  };

  const formatTime = () => {
    const now = new Date();
    return now.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
  };

  const handleApproveSwap = () => {
    setApprovalDone(true);
    setTimeout(() => {
      setShowSwapApproval(false);
      setApprovalDone(false);
    }, 1500);
  };

  return (
    <div className="min-h-screen bg-background pb-8">
      {/* Header */}
      <header className="px-4 pt-8 pb-6 lg:px-8">
        <div className="flex items-center justify-between mb-1">
          <p className="text-sm text-muted-foreground">{currentManager.location}</p>
          <button 
            onClick={() => navigate('/manager/notifications')}
            className="relative p-2 rounded-lg hover:bg-accent transition-colors"
          >
            <Bell className="w-5 h-5 text-muted-foreground" />
            {unreadNotifications.length > 0 && (
              <span className="absolute top-1 right-1 w-2 h-2 bg-primary rounded-full" />
            )}
          </button>
        </div>
        <h1 className="text-2xl font-bold text-foreground">Today at a Glance</h1>
        <p className="text-sm text-muted-foreground mt-1">
          {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })} • {formatTime()}
        </p>
      </header>

      <div className="px-4 lg:px-8 space-y-6 stagger-children">
        {/* Staffing Health */}
        <StaffingIndicator health={todayStaffingHealth} />

        {/* Quick Stats Row */}
        <div className="grid grid-cols-3 gap-3">
          <div className="card-elevated rounded-xl p-4 text-center">
            <div className="flex items-center justify-center gap-1.5 text-success mb-1">
              <CheckCircle className="w-4 h-4" />
              <span className="text-2xl font-bold">{attendanceSummary.present}</span>
            </div>
            <p className="text-xs text-muted-foreground">Present</p>
          </div>
          <div className="card-elevated rounded-xl p-4 text-center">
            <div className="flex items-center justify-center gap-1.5 text-warning mb-1">
              <Clock className="w-4 h-4" />
              <span className="text-2xl font-bold">{attendanceSummary.late}</span>
            </div>
            <p className="text-xs text-muted-foreground">Late</p>
          </div>
          <div className="card-elevated rounded-xl p-4 text-center">
            <div className="flex items-center justify-center gap-1.5 text-muted-foreground mb-1">
              <AlertCircle className="w-4 h-4" />
              <span className="text-2xl font-bold">{attendanceSummary.notCheckedIn}</span>
            </div>
            <p className="text-xs text-muted-foreground">Pending</p>
          </div>
        </div>

        {/* Pending Actions */}
        {pendingSwaps.length > 0 && (
          <section className="card-elevated rounded-xl p-4 border-l-4 border-l-primary">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <ArrowRightLeft className="w-4 h-4 text-primary" />
                <h2 className="font-semibold text-foreground">Pending Approval</h2>
              </div>
              <span className="text-xs font-medium text-primary bg-primary/10 px-2 py-1 rounded-full">
                {pendingSwaps.length} request{pendingSwaps.length > 1 ? 's' : ''}
              </span>
            </div>
            {pendingSwaps.slice(0, 1).map(swap => {
              const requester = workers.find(w => w.id === swap.requesterId);
              return (
                <button
                  key={swap.id}
                  onClick={() => setShowSwapApproval(true)}
                  className="w-full flex items-center justify-between p-3 rounded-lg bg-accent/30 hover:bg-accent/50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center">
                      <User className="w-4 h-4 text-primary" />
                    </div>
                    <div className="text-left">
                      <p className="font-medium text-sm">{requester?.name}</p>
                      <p className="text-xs text-muted-foreground">{swap.reason}</p>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-muted-foreground" />
                </button>
              );
            })}
          </section>
        )}

        {/* Vacant Shifts */}
        {vacantShifts.length > 0 && (
          <section>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-semibold text-foreground flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-warning" />
                Needs Coverage
              </h2>
              <span className="text-xs text-warning font-medium">
                {vacantShifts.length} shift{vacantShifts.length > 1 ? 's' : ''}
              </span>
            </div>
            <div className="space-y-3">
              {vacantShifts.map(shift => (
                <ShiftCard
                  key={shift.id}
                  shift={shift}
                  onClick={() => navigate('/manager/shifts')}
                />
              ))}
            </div>
          </section>
        )}

        {/* Today's Schedule */}
        <section>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold text-foreground">Today's Schedule</h2>
            <button 
              onClick={() => navigate('/manager/shifts')}
              className="text-xs text-primary font-medium"
            >
              View All
            </button>
          </div>
          <div className="space-y-2">
            {filledShifts.slice(0, 4).map(shift => {
              const attendance = attendanceRecords.find(a => a.shiftId === shift.id);
              return (
                <div
                  key={shift.id}
                  className="card-elevated rounded-xl p-4 flex items-center justify-between"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                      <User className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <p className="font-medium text-foreground">{shift.assignedWorker?.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {shift.position} • {shift.startTime} - {shift.endTime}
                      </p>
                    </div>
                  </div>
                  {attendance ? (
                    <StatusBadge status={attendance.status} />
                  ) : (
                    <StatusBadge status="not_checked_in" />
                  )}
                </div>
              );
            })}
          </div>
        </section>

        {/* Quick Actions */}
        <section className="grid grid-cols-2 gap-3">
          <Button 
            variant="outline" 
            className="h-14 flex-col gap-1"
            onClick={() => navigate('/manager/team')}
          >
            <Users className="w-5 h-5" />
            <span className="text-xs">View Team</span>
          </Button>
          <Button 
            variant="outline" 
            className="h-14 flex-col gap-1"
            onClick={() => navigate('/manager/shifts')}
          >
            <Clock className="w-5 h-5" />
            <span className="text-xs">All Shifts</span>
          </Button>
        </section>
      </div>

      {/* Swap Approval Dialog */}
      <Dialog open={showSwapApproval} onOpenChange={setShowSwapApproval}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Swap Request</DialogTitle>
            <DialogDescription>
              Review and approve this shift swap request
            </DialogDescription>
          </DialogHeader>

          {approvalDone ? (
            <div className="py-8 text-center">
              <div className="w-16 h-16 mx-auto rounded-full bg-success-muted flex items-center justify-center mb-4">
                <Check className="w-8 h-8 text-success" />
              </div>
              <p className="font-semibold text-foreground">Swap Approved!</p>
              <p className="text-sm text-muted-foreground mt-1">Both workers have been notified</p>
            </div>
          ) : (
            <div className="space-y-4 pt-4">
              <div className="p-4 rounded-xl bg-accent/50 border border-border/50">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                    <User className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <p className="font-medium">Sarah Chen</p>
                    <p className="text-xs text-muted-foreground">Wants to swap tomorrow's shift</p>
                  </div>
                </div>
                <p className="text-sm text-muted-foreground">
                  <span className="font-medium text-foreground">Reason:</span> Doctor appointment
                </p>
              </div>

              <div className="p-4 rounded-xl border border-border/50">
                <p className="text-xs font-medium text-muted-foreground mb-2">SUGGESTED REPLACEMENT</p>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-success/10 flex items-center justify-center">
                    <User className="w-5 h-5 text-success" />
                  </div>
                  <div>
                    <p className="font-medium">Emily Rodriguez</p>
                    <p className="text-xs text-muted-foreground">High availability • 96% reliability</p>
                  </div>
                </div>
              </div>

              <div className="flex gap-3">
                <Button 
                  variant="outline" 
                  className="flex-1"
                  onClick={() => setShowSwapApproval(false)}
                >
                  <X className="w-4 h-4 mr-2" />
                  Decline
                </Button>
                <Button 
                  className="flex-1"
                  onClick={handleApproveSwap}
                >
                  <Check className="w-4 h-4 mr-2" />
                  Approve
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};
