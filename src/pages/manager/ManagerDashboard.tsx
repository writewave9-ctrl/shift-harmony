import { useState, useEffect } from 'react';
import { ManagerDashboardSkeleton } from '@/components/PageSkeletons';
import { MotionCard, MotionSection, MotionItem } from '@/components/MotionWrapper';
import { cn } from '@/lib/utils';
import { formatTimeRange } from '@/lib/formatTime';
import { StaffingIndicator } from '@/components/StaffingIndicator';
import { StatusBadge } from '@/components/StatusBadge';
import { useShifts, DatabaseShift } from '@/hooks/useShifts';
import { useTeamMembers } from '@/hooks/useTeamMembers';
import { useNotifications } from '@/hooks/useNotifications';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { haptics } from '@/lib/haptics';
import { 
  Bell, Users, Clock, ChevronRight, AlertCircle, CheckCircle, User,
  ArrowRightLeft, Check, X, Calendar, Plus, TrendingUp, Rocket, Settings,
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

  return (
    <div className="min-h-screen bg-background pb-8">
      {/* Header */}
      <header className="px-4 pt-8 pb-6 lg:px-8">
        <div className="flex items-center justify-between mb-1">
          <p className="text-sm text-muted-foreground">{profile?.position || 'Manager'}</p>
          <button 
            onClick={() => navigate('/manager/notifications')}
            className="relative p-2 rounded-lg hover:bg-accent transition-colors"
          >
            <Bell className="w-5 h-5 text-muted-foreground" />
            {unreadCount > 0 && (
              <span className="absolute top-1 right-1 w-2 h-2 bg-primary rounded-full" />
            )}
          </button>
        </div>
        <h1 className="text-2xl font-bold text-foreground">Today at a Glance</h1>
        <p className="text-sm text-muted-foreground mt-1">
          {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })} • {formatTime()}
        </p>
      </header>

      <div className="px-4 lg:px-8 space-y-6">
        {/* Staffing Health */}
        <StaffingIndicator health={staffingHealth} />

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

        {/* Team Overview */}
        <section className="card-elevated rounded-xl p-4">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-foreground flex items-center gap-2">
              <Users className="w-4 h-4 text-primary" />
              Team Overview
            </h2>
            <button 
              onClick={() => navigate('/manager/team')}
              className="text-xs text-primary font-medium"
            >
              Manage
            </button>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="p-3 rounded-lg bg-accent/50">
              <p className="text-2xl font-bold text-foreground">{workers.length}</p>
              <p className="text-xs text-muted-foreground">Team members</p>
            </div>
            <div className="p-3 rounded-lg bg-accent/50">
              <p className="text-2xl font-bold text-foreground">{shifts.length}</p>
              <p className="text-xs text-muted-foreground">Total shifts</p>
            </div>
          </div>
        </section>

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
            {pendingSwaps.slice(0, 2).map(swap => (
              <button
                key={swap.id}
                onClick={() => {
                  setSelectedSwap(swap);
                  setShowSwapApproval(true);
                }}
                className="w-full flex items-center justify-between p-3 rounded-lg bg-accent/30 hover:bg-accent/50 transition-colors mb-2 last:mb-0"
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center">
                    <User className="w-4 h-4 text-primary" />
                  </div>
                  <div className="text-left">
                    <p className="font-medium text-sm">{swap.requester?.full_name}</p>
                    <p className="text-xs text-muted-foreground">{swap.reason}</p>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-muted-foreground" />
              </button>
            ))}
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
                <div
                  key={shift.id}
                  onClick={() => navigate('/manager/shifts')}
                  className="card-elevated rounded-xl p-4 border-l-4 border-l-warning cursor-pointer hover:bg-accent/30 transition-colors"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="font-semibold text-foreground">{shift.position}</h3>
                      <p className="text-sm text-muted-foreground">
                        {formatTimeRange(shift.start_time, shift.end_time)} • {shift.location}
                      </p>
                    </div>
                    <span className="px-2.5 py-1 text-xs font-medium text-warning bg-warning/10 rounded-full border border-warning/20">
                      Vacant
                    </span>
                  </div>
                </div>
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
          {filledShifts.length > 0 ? (
            <div className="space-y-2">
              {filledShifts.slice(0, 4).map(shift => (
                <div
                  key={shift.id}
                  className="card-elevated rounded-xl p-4 flex items-center justify-between"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                      <User className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <p className="font-medium text-foreground">{shift.assigned_worker?.full_name}</p>
                      <p className="text-xs text-muted-foreground">
                        {shift.position} • {formatTimeRange(shift.start_time, shift.end_time)}
                      </p>
                    </div>
                  </div>
                  <StatusBadge status="not_checked_in" />
                </div>
              ))}
            </div>
          ) : (
            <div className="card-elevated rounded-xl p-8 text-center">
              <Calendar className="w-12 h-12 mx-auto text-muted-foreground/30 mb-3" />
              <p className="text-muted-foreground">No filled shifts today</p>
              <Button 
                variant="outline" 
                size="sm" 
                className="mt-4"
                onClick={() => navigate('/manager/shifts')}
              >
                <Plus className="w-4 h-4 mr-2" />
                Create Shift
              </Button>
            </div>
          )}
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
