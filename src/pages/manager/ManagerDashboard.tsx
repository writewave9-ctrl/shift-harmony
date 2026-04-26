import { useState, useEffect } from 'react';
import { ManagerDashboardSkeleton } from '@/components/PageSkeletons';
import { cn } from '@/lib/utils';
import { formatTimeRange } from '@/lib/formatTime';
import { StaffingIndicator } from '@/components/StaffingIndicator';
import { StatusBadge } from '@/components/StatusBadge';
import { useShifts, DatabaseShift } from '@/hooks/useShifts';
import { useTeamMembers } from '@/hooks/useTeamMembers';
import { useNotifications } from '@/hooks/useNotifications';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import {
  Bell, Users, Clock, ChevronRight, AlertCircle, CheckCircle, User,
  ArrowRightLeft, Check, X, Calendar, Plus, Rocket, Settings,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerDescription,
} from '@/components/ui/drawer';
import { StaffingHealth } from '@/types/align';

interface SwapRequest {
  id: string;
  shift_id: string;
  requester_id: string;
  reason: string;
  status: string;
  requester?: {
    full_name: string;
    avatar_url: string | null;
  };
  shift?: {
    date: string;
    start_time: string;
    end_time: string;
    position: string;
  };
}

export const ManagerDashboard = () => {
  const navigate = useNavigate();
  const { profile } = useAuth();
  const { shifts, loading: shiftsLoading } = useShifts();
  const { workers } = useTeamMembers();
  const { unreadCount } = useNotifications();
  
  const [swapRequests, setSwapRequests] = useState<SwapRequest[]>([]);
  const [showSwapApproval, setShowSwapApproval] = useState(false);
  const [selectedSwap, setSelectedSwap] = useState<SwapRequest | null>(null);
  const [approvalDone, setApprovalDone] = useState(false);
  const [loading, setLoading] = useState(true);
  const [attendanceSummary, setAttendanceSummary] = useState({ present: 0, late: 0, notCheckedIn: 0 });

  const today = new Date().toISOString().split('T')[0];
  const todayShifts = shifts.filter(s => s.date === today);
  const vacantShifts = todayShifts.filter(s => s.is_vacant);
  const filledShifts = todayShifts.filter(s => !s.is_vacant);
  const pendingSwaps = swapRequests.filter(s => s.status === 'pending');

  // Fetch swap requests and attendance
  useEffect(() => {
    const fetchData = async () => {
      if (!profile?.team_id) {
        setSwapRequests([]);
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        
        // Fetch swap requests
        const { data: swapData, error: swapError } = await supabase
          .from('swap_requests')
          .select(`
            *,
            requester:profiles!swap_requests_requester_id_fkey(full_name, avatar_url),
            shift:shifts!swap_requests_shift_id_fkey(date, start_time, end_time, position)
          `)
          .eq('status', 'pending')
          .order('created_at', { ascending: false });

        if (swapError) throw swapError;
        setSwapRequests(swapData || []);

        // Fetch today's attendance records
        const todayShiftIds = shifts.filter(s => s.date === today).map(s => s.id);
        if (todayShiftIds.length > 0) {
          const { data: attendanceData } = await supabase
            .from('attendance_records')
            .select('status')
            .in('shift_id', todayShiftIds);

          const records = attendanceData || [];
          setAttendanceSummary({
            present: records.filter(a => a.status === 'present' || a.status === 'manually_approved').length,
            late: records.filter(a => a.status === 'late').length,
            notCheckedIn: filledShifts.length - records.filter(a => a.status === 'present' || a.status === 'manually_approved' || a.status === 'late').length,
          });
        }
      } catch (err) {
        console.error('Error fetching dashboard data:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [profile?.team_id, shifts]);

  // Calculate staffing health
  const staffingHealth: StaffingHealth = {
    totalShifts: todayShifts.length,
    filledShifts: filledShifts.length,
    vacantShifts: vacantShifts.length,
    status: vacantShifts.length === 0 
      ? 'fully_staffed' 
      : vacantShifts.length <= 1 
        ? 'near_capacity'
        : vacantShifts.length <= 3 
          ? 'understaffed' 
          : 'critical',
    shortBy: vacantShifts.length,
  };

  const formatTime = () => {
    const now = new Date();
    return now.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
  };

  const handleApproveSwap = async () => {
    if (!selectedSwap || !profile?.id) return;

    try {
      const { error } = await supabase
        .from('swap_requests')
        .update({ 
          status: 'approved',
          approved_by: profile.id,
        })
        .eq('id', selectedSwap.id);

      if (error) throw error;

      setApprovalDone(true);
      toast.success('Swap Approved! Both workers have been notified.');
      
      setSwapRequests(prev => prev.filter(s => s.id !== selectedSwap.id));
      
      setTimeout(() => {
        setShowSwapApproval(false);
        setApprovalDone(false);
        setSelectedSwap(null);
      }, 1500);
    } catch (err) {
      console.error('Error approving swap:', err);
      toast.error('Failed to approve swap');
    }
  };

  const handleDeclineSwap = async () => {
    if (!selectedSwap) return;

    try {
      const { error } = await supabase
        .from('swap_requests')
        .update({ status: 'declined' })
        .eq('id', selectedSwap.id);

      if (error) throw error;

      toast.error('Swap declined. The worker has been notified.');
      setSwapRequests(prev => prev.filter(s => s.id !== selectedSwap.id));
      setShowSwapApproval(false);
      setSelectedSwap(null);
    } catch (err) {
      console.error('Error declining swap:', err);
      toast.error('Failed to decline swap');
    }
  };

  if (shiftsLoading || loading) return <ManagerDashboardSkeleton />;

  // Show setup prompt if manager doesn't have a team yet
  if (!profile?.team_id) {
    return (
      <div className="min-h-screen bg-background pb-8">
        <header className="px-4 pt-8 pb-6 lg:px-8 text-center">
          <div className="w-16 h-16 mx-auto rounded-2xl bg-primary/10 flex items-center justify-center mb-4">
            <Rocket className="w-8 h-8 text-primary" />
          </div>
          <h1 className="text-2xl font-bold text-foreground">Welcome to Align!</h1>
          <p className="text-muted-foreground mt-2">
            Complete your workspace setup to start managing your team.
          </p>
        </header>
        
        <div className="px-4 lg:px-8 max-w-md mx-auto">
          <div className="card-elevated rounded-2xl p-6 text-center">
            <Settings className="w-12 h-12 mx-auto text-primary/50 mb-4" />
            <h2 className="text-lg font-semibold mb-2">Set Up Your Workspace</h2>
            <p className="text-sm text-muted-foreground mb-6">
              Create your organization and team to start scheduling shifts and managing your workers.
            </p>
            <Button onClick={() => navigate('/manager/settings')} className="w-full" size="lg">
              <Settings className="w-4 h-4 mr-2" />
              Complete Setup
            </Button>
          </div>
        </div>
      </div>
    );
  }

  const presentPct = filledShifts.length === 0
    ? 0
    : Math.round(((attendanceSummary.present + attendanceSummary.late) / filledShifts.length) * 100);

  return (
    <div className="min-h-screen bg-muted/30 pb-10">
      {/* Hero header — editorial typography with mesh gradient backdrop */}
      <header className="relative px-5 pt-8 pb-7 lg:px-8 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-mesh opacity-90 pointer-events-none" aria-hidden />
        <div className="absolute inset-0 texture-grain opacity-40 pointer-events-none" aria-hidden />
        <div className="relative">
          <div className="flex items-center justify-between mb-2">
            <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
              {profile?.position || 'Manager'}
            </p>
            <button
              onClick={() => navigate('/manager/notifications')}
              className="relative p-2.5 rounded-xl bg-card/70 backdrop-blur-sm ring-1 ring-border/50 hover:bg-card transition-colors"
              aria-label={`Notifications${unreadCount > 0 ? `, ${unreadCount} unread` : ''}`}
            >
              <Bell className="w-4 h-4 text-foreground" />
              {unreadCount > 0 && (
                <span className="absolute top-1.5 right-1.5 min-w-[14px] h-3.5 px-1 rounded-full bg-destructive text-[9px] font-semibold text-destructive-foreground flex items-center justify-center ring-2 ring-card">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </button>
          </div>
          <h1 className="font-display text-[32px] sm:text-[36px] font-semibold tracking-tight text-foreground leading-[1.05]">
            Today at a glance
          </h1>
          <p className="text-sm text-muted-foreground mt-2">
            {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
            <span className="text-muted-foreground/50 mx-2">·</span>
            <span className="text-foreground/80 font-medium">{formatTime()}</span>
          </p>
        </div>
      </header>

      <div className="px-5 lg:px-8 space-y-7">
        {/* Staffing Health */}
        <StaffingIndicator health={staffingHealth} />

        {/* Live attendance — prominent, airy, clearly separated */}
        <section
          className="rounded-2xl bg-gradient-card-premium shadow-card-premium ring-1 ring-border/40 overflow-hidden"
          aria-label="Live attendance"
        >
          <div className="px-5 pt-5 pb-3 flex items-center justify-between">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                Live attendance
              </p>
              <h2 className="font-display text-lg font-semibold text-foreground tracking-tight mt-0.5">
                {filledShifts.length === 0
                  ? 'No filled shifts today'
                  : `${attendanceSummary.present + attendanceSummary.late} of ${filledShifts.length} on-site`}
              </h2>
            </div>
            {filledShifts.length > 0 && (
              <span className="text-[11px] font-semibold text-primary bg-primary/10 px-2.5 py-1 rounded-full ring-1 ring-primary/20">
                {presentPct}%
              </span>
            )}
          </div>

          <div className="px-5 pb-5">
            <div className="grid grid-cols-3 gap-2.5">
              <div className="rounded-xl bg-success-muted/60 ring-1 ring-success/15 p-3.5 text-center">
                <div className="flex items-center justify-center gap-1.5 text-success mb-1">
                  <CheckCircle className="w-3.5 h-3.5" />
                  <span className="font-display text-2xl font-semibold leading-none">{attendanceSummary.present}</span>
                </div>
                <p className="text-[10px] uppercase tracking-wider text-muted-foreground mt-1.5">Present</p>
              </div>
              <div className="rounded-xl bg-warning-muted/60 ring-1 ring-warning/20 p-3.5 text-center">
                <div className="flex items-center justify-center gap-1.5 text-warning mb-1">
                  <Clock className="w-3.5 h-3.5" />
                  <span className="font-display text-2xl font-semibold leading-none">{attendanceSummary.late}</span>
                </div>
                <p className="text-[10px] uppercase tracking-wider text-muted-foreground mt-1.5">Late</p>
              </div>
              <div className="rounded-xl bg-muted/70 ring-1 ring-border/50 p-3.5 text-center">
                <div className="flex items-center justify-center gap-1.5 text-muted-foreground mb-1">
                  <AlertCircle className="w-3.5 h-3.5" />
                  <span className="font-display text-2xl font-semibold leading-none">{attendanceSummary.notCheckedIn}</span>
                </div>
                <p className="text-[10px] uppercase tracking-wider text-muted-foreground mt-1.5">Pending</p>
              </div>
            </div>
          </div>
        </section>

        {/* Pending Actions — prominent when present */}
        {pendingSwaps.length > 0 && (
          <section className="rounded-2xl bg-card shadow-card-premium ring-1 ring-primary/15 overflow-hidden">
            <div className="px-5 pt-5 pb-2 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-primary/10 flex items-center justify-center">
                  <ArrowRightLeft className="w-3.5 h-3.5 text-primary" />
                </div>
                <h2 className="font-display text-base font-semibold text-foreground tracking-tight">
                  Pending approval
                </h2>
              </div>
              <span className="text-[11px] font-semibold text-primary bg-primary/10 px-2.5 py-1 rounded-full ring-1 ring-primary/20">
                {pendingSwaps.length} request{pendingSwaps.length > 1 ? 's' : ''}
              </span>
            </div>
            <div className="px-5 pb-4 space-y-2 mt-2">
              {pendingSwaps.slice(0, 2).map(swap => (
                <button
                  key={swap.id}
                  onClick={() => {
                    setSelectedSwap(swap);
                    setShowSwapApproval(true);
                  }}
                  className="w-full flex items-center justify-between p-3 rounded-xl bg-accent/40 hover:bg-accent/70 transition-colors text-left"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-9 h-9 rounded-full bg-gradient-primary flex items-center justify-center shrink-0 shadow-glow">
                      <User className="w-4 h-4 text-primary-foreground" />
                    </div>
                    <div className="min-w-0">
                      <p className="font-medium text-sm text-foreground truncate">{swap.requester?.full_name}</p>
                      <p className="text-xs text-muted-foreground truncate">{swap.reason}</p>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0" />
                </button>
              ))}
            </div>
          </section>
        )}

        {/* Vacant Shifts — separated section with breathing room */}
        {vacantShifts.length > 0 && (
          <section aria-label="Shifts needing coverage">
            <div className="flex items-end justify-between mb-3 px-1">
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                  Needs coverage
                </p>
                <h2 className="font-display text-lg font-semibold text-foreground tracking-tight mt-0.5">
                  {vacantShifts.length} vacant {vacantShifts.length === 1 ? 'shift' : 'shifts'}
                </h2>
              </div>
              <button
                onClick={() => navigate('/manager/auto-fill')}
                className="text-xs font-semibold text-primary hover:underline"
              >
                Auto-fill →
              </button>
            </div>
            <div className="space-y-2.5">
              {vacantShifts.map(shift => (
                <div
                  key={shift.id}
                  onClick={() => navigate('/manager/shifts')}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') navigate('/manager/shifts'); }}
                  className="rounded-2xl bg-card ring-1 ring-warning/25 shadow-card-premium p-4 cursor-pointer hover:ring-warning/50 hover:shadow-floating transition-all"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <h3 className="font-semibold text-foreground truncate">{shift.position}</h3>
                      <p className="text-sm text-muted-foreground mt-0.5">
                        {formatTimeRange(shift.start_time, shift.end_time)}
                        {shift.location && <span className="text-muted-foreground/60"> · {shift.location}</span>}
                      </p>
                    </div>
                    <span className="px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-warning bg-warning-muted rounded-full ring-1 ring-warning/30 shrink-0">
                      Vacant
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Today's Schedule — assigned shifts list */}
        <section aria-label="Today's schedule">
          <div className="flex items-end justify-between mb-3 px-1">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                Today's schedule
              </p>
              <h2 className="font-display text-lg font-semibold text-foreground tracking-tight mt-0.5">
                {filledShifts.length} assigned
              </h2>
            </div>
            <button
              onClick={() => navigate('/manager/shifts')}
              className="text-xs font-semibold text-primary hover:underline"
            >
              View all →
            </button>
          </div>
          {filledShifts.length > 0 ? (
            <div className="space-y-2">
              {filledShifts.slice(0, 4).map(shift => (
                <div
                  key={shift.id}
                  className="rounded-2xl bg-card ring-1 ring-border/50 shadow-card-premium p-4 flex items-center justify-between gap-3"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-10 h-10 rounded-full bg-accent flex items-center justify-center shrink-0 ring-1 ring-border/40">
                      <User className="w-4 h-4 text-accent-foreground" />
                    </div>
                    <div className="min-w-0">
                      <p className="font-medium text-foreground truncate">{shift.assigned_worker?.full_name}</p>
                      <p className="text-xs text-muted-foreground truncate">
                        {shift.position} · {formatTimeRange(shift.start_time, shift.end_time)}
                      </p>
                    </div>
                  </div>
                  <StatusBadge status="not_checked_in" />
                </div>
              ))}
            </div>
          ) : (
            <div className="empty-state">
              <div className="empty-state-icon">
                <Calendar className="w-5 h-5" />
              </div>
              <p className="empty-state-title">No filled shifts today</p>
              <p className="empty-state-body">Create a shift or assign workers to get the day moving.</p>
              <Button
                variant="outline"
                size="sm"
                className="mt-4 rounded-xl"
                onClick={() => navigate('/manager/shifts')}
              >
                <Plus className="w-4 h-4 mr-2" />
                Create shift
              </Button>
            </div>
          )}
        </section>

        {/* Team Overview — moved lower as supporting info */}
        <section
          className="rounded-2xl bg-card ring-1 ring-border/50 shadow-card-premium p-5"
          aria-label="Team overview"
        >
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-display text-base font-semibold text-foreground tracking-tight flex items-center gap-2">
              <Users className="w-4 h-4 text-primary" />
              Team overview
            </h2>
            <button
              onClick={() => navigate('/manager/team')}
              className="text-xs font-semibold text-primary hover:underline"
            >
              Manage →
            </button>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="p-4 rounded-xl bg-accent/40 ring-1 ring-border/40">
              <p className="font-display text-2xl font-semibold text-foreground leading-none">{workers.length}</p>
              <p className="text-xs text-muted-foreground mt-2">Team members</p>
            </div>
            <div className="p-4 rounded-xl bg-accent/40 ring-1 ring-border/40">
              <p className="font-display text-2xl font-semibold text-foreground leading-none">{shifts.length}</p>
              <p className="text-xs text-muted-foreground mt-2">Total shifts</p>
            </div>
          </div>
        </section>

        {/* Quick Actions */}
        <section className="grid grid-cols-2 gap-3 pt-1">
          <Button
            variant="outline"
            className="h-14 flex-col gap-1 rounded-xl ring-1 ring-border/50"
            onClick={() => navigate('/manager/team')}
          >
            <Users className="w-5 h-5" />
            <span className="text-xs">View team</span>
          </Button>
          <Button
            variant="outline"
            className="h-14 flex-col gap-1 rounded-xl ring-1 ring-border/50"
            onClick={() => navigate('/manager/shifts')}
          >
            <Clock className="w-5 h-5" />
            <span className="text-xs">All shifts</span>
          </Button>
        </section>
      </div>

      {/* Swap Approval Drawer */}
      <Drawer open={showSwapApproval} onOpenChange={setShowSwapApproval}>
        <DrawerContent>
          <DrawerHeader>
            <DrawerTitle>Swap Request</DrawerTitle>
            <DrawerDescription>Review and approve this shift swap request</DrawerDescription>
          </DrawerHeader>

          <div className="px-4 pb-8">
            {approvalDone ? (
              <div className="py-8 text-center">
                <div className="w-16 h-16 mx-auto rounded-full bg-success-muted flex items-center justify-center mb-4">
                  <Check className="w-8 h-8 text-success" />
                </div>
                <p className="font-semibold text-foreground">Swap Approved!</p>
                <p className="text-sm text-muted-foreground mt-1">Both workers have been notified</p>
              </div>
            ) : selectedSwap && (
              <div className="space-y-4">
                <div className="p-4 rounded-xl bg-accent/50 border border-border/50">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                      <User className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <p className="font-medium">{selectedSwap.requester?.full_name}</p>
                      <p className="text-xs text-muted-foreground">
                        {selectedSwap.shift?.position} • {selectedSwap.shift ? formatTimeRange(selectedSwap.shift.start_time, selectedSwap.shift.end_time) : ''}
                      </p>
                    </div>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    <span className="font-medium text-foreground">Reason:</span> {selectedSwap.reason}
                  </p>
                </div>
                <div className="flex gap-3">
                  <Button variant="outline" className="flex-1" onClick={handleDeclineSwap}>
                    <X className="w-4 h-4 mr-2" />Decline
                  </Button>
                  <Button className="flex-1" onClick={handleApproveSwap}>
                    <Check className="w-4 h-4 mr-2" />Approve
                  </Button>
                </div>
              </div>
            )}
          </div>
        </DrawerContent>
      </Drawer>
    </div>
  );
};

export default ManagerDashboard;
