import { useState, useEffect, useCallback } from 'react';
import { PullToRefresh } from '@/components/PullToRefresh';
import { WorkerShiftsSkeleton } from '@/components/PageSkeletons';
import { MotionCard, MotionSection } from '@/components/MotionWrapper';
import { haptics } from '@/lib/haptics';
import { cn } from '@/lib/utils';
import { formatTimeRange } from '@/lib/formatTime';
import { 
  Calendar, 
  ChevronLeft, 
  ArrowRightLeft, 
  XCircle,
  ChevronRight,
  User,
  Users,
  Check,
  Clock,
  MapPin,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { CallOffReason } from '@/types/align';
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerDescription,
} from '@/components/ui/drawer';

interface WorkerShift {
  id: string;
  date: string;
  start_time: string;
  end_time: string;
  position: string;
  location: string;
  status: string;
  is_vacant: boolean;
}

const callOffReasons: { value: CallOffReason; label: string }[] = [
  { value: 'sick', label: 'Feeling unwell' },
  { value: 'family_emergency', label: 'Family emergency' },
  { value: 'transportation', label: 'Transportation issue' },
  { value: 'personal', label: 'Personal matter' },
  { value: 'other', label: 'Other reason' },
];

export const WorkerShifts = () => {
  const navigate = useNavigate();
  const { profile } = useAuth();
  const [shifts, setShifts] = useState<WorkerShift[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedShift, setSelectedShift] = useState<WorkerShift | null>(null);
  const [showSwapDrawer, setShowSwapDrawer] = useState(false);
  const [showCallOffDrawer, setShowCallOffDrawer] = useState(false);
  const [swapType, setSwapType] = useState<'specific' | 'open' | null>(null);
  const [selectedReason, setSelectedReason] = useState<CallOffReason | null>(null);
  const [requestSent, setRequestSent] = useState(false);
  const [teammates, setTeammates] = useState<any[]>([]);

  const fetchShifts = useCallback(async () => {
    if (!profile?.id) {
      setShifts([]);
      setLoading(false);
      return;
    }
    try {
      const today = new Date().toISOString().split('T')[0];
      const { data, error } = await supabase
        .from('shifts')
        .select('*')
        .eq('assigned_worker_id', profile.id)
        .gte('date', today)
        .order('date', { ascending: true })
        .order('start_time', { ascending: true });

      if (error) throw error;
      setShifts(data || []);
    } catch (err) {
      console.error('Error fetching shifts:', err);
    } finally {
      setLoading(false);
    }
  }, [profile?.id]);

  const fetchTeammates = useCallback(async () => {
    if (!profile?.id) { setTeammates([]); return; }
    const { data, error } = await supabase.rpc('get_team_member_directory');
    if (error) { console.error('Error fetching teammates:', error); setTeammates([]); return; }
    setTeammates((data || []).filter((m: any) => m.id !== profile.id).map((m: any) => ({
      id: m.id, full_name: m.full_name, position: m.role_position, avatar_url: m.avatar_url,
    })));
  }, [profile?.id]);

  useEffect(() => { fetchShifts(); fetchTeammates(); }, [fetchShifts, fetchTeammates]);

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    if (date.toDateString() === today.toDateString()) return 'Today';
    if (date.toDateString() === tomorrow.toDateString()) return 'Tomorrow';
    return date.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' });
  };

  const handleSwapRequest = async (targetWorkerId?: string) => {
    if (!selectedShift || !profile?.id) return;
    try {
      const { error } = await supabase.from('swap_requests').insert({
        shift_id: selectedShift.id, requester_id: profile.id,
        requested_worker_id: targetWorkerId || null, reason: 'Shift swap request',
        is_open_to_all: !targetWorkerId,
      });
      if (error) throw error;
      setRequestSent(true); haptics.success(); toast.success('Swap request sent!');
      setTimeout(() => { setShowSwapDrawer(false); setSwapType(null); setRequestSent(false); setSelectedShift(null); }, 1500);
    } catch (err) { console.error('Error:', err); haptics.error(); toast.error('Failed to send swap request'); }
  };

  const handleCallOff = async () => {
    if (!selectedShift || !profile?.id || !selectedReason) return;
    try {
      const { error } = await supabase.from('call_off_requests').insert({
        shift_id: selectedShift.id, worker_id: profile.id, reason: selectedReason,
      });
      if (error) throw error;
      setRequestSent(true); haptics.success(); toast.success('Call-off submitted');
      setTimeout(() => { setShowCallOffDrawer(false); setSelectedReason(null); setRequestSent(false); setSelectedShift(null); }, 1500);
    } catch (err) { console.error('Error:', err); haptics.error(); toast.error('Failed to submit call-off'); }
  };

  const shiftsByDate = shifts.reduce((acc, shift) => {
    if (!acc[shift.date]) acc[shift.date] = [];
    acc[shift.date].push(shift);
    return acc;
  }, {} as Record<string, WorkerShift[]>);

  if (loading) return <WorkerShiftsSkeleton />;

  return (
    <PullToRefresh onRefresh={async () => { haptics.medium(); await fetchShifts(); }}>
    <div className="min-h-screen bg-background">
      {/* Clean header - no extra whitespace */}
      <header className="sticky top-0 z-10 bg-background/90 backdrop-blur-xl border-b border-border/40 px-5 py-3">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate('/worker')} className="p-2 -ml-2 rounded-xl hover:bg-accent/80 transition-colors">
            <ChevronLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-lg font-semibold text-foreground tracking-tight">My Shifts</h1>
            <p className="text-xs text-muted-foreground">{shifts.length} upcoming</p>
          </div>
        </div>
      </header>

      <div className="px-5 py-5 space-y-5">
        {Object.entries(shiftsByDate).map(([date, dateShifts], groupIdx) => (
          <MotionSection key={date} delay={groupIdx * 0.08}>
            <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2.5 flex items-center gap-2">
              <Calendar className="w-3.5 h-3.5" />
              {formatDate(date)}
            </h2>
            <div className="space-y-2.5">
              {dateShifts.map((shift) => (
                <MotionCard
                  key={shift.id}
                  onClick={() => { haptics.light(); setSelectedShift(shift); }}
                  className="w-full rounded-xl p-4 text-left cursor-pointer bg-card border border-border/50 shadow-sm hover:shadow-md transition-all"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="font-semibold text-foreground text-sm">{shift.position}</h3>
                      <div className="flex items-center gap-3 mt-1.5 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{formatTimeRange(shift.start_time, shift.end_time)}</span>
                        <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{shift.location}</span>
                      </div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-muted-foreground/40 mt-0.5" />
                  </div>
                </MotionCard>
              ))}
            </div>
          </MotionSection>
        ))}

        {shifts.length === 0 && (
          <MotionSection className="text-center py-16">
            <div className="w-16 h-16 mx-auto rounded-2xl bg-muted/80 flex items-center justify-center mb-4">
              <Calendar className="w-7 h-7 text-muted-foreground/50" />
            </div>
            <p className="text-muted-foreground font-medium">No upcoming shifts</p>
            <p className="text-sm text-muted-foreground/70 mt-1">Check back later for new assignments</p>
          </MotionSection>
        )}
      </div>

      {/* Shift Actions Bottom Sheet */}
      <Drawer open={!!selectedShift && !showSwapDrawer && !showCallOffDrawer} onOpenChange={(open) => { if (!open) setSelectedShift(null); }}>
        <DrawerContent>
          <DrawerHeader>
            <DrawerTitle>Shift Options</DrawerTitle>
            <DrawerDescription>
              {selectedShift && `${formatDate(selectedShift.date)} • ${formatTimeRange(selectedShift.start_time, selectedShift.end_time)}`}
            </DrawerDescription>
          </DrawerHeader>
          <div className="px-4 pb-8 space-y-3">
            <Button variant="outline" className="w-full justify-start gap-3 h-14 rounded-xl" onClick={() => { haptics.light(); setShowSwapDrawer(true); }}>
              <ArrowRightLeft className="w-5 h-5 text-primary" />
              <div className="text-left">
                <p className="font-medium text-sm">Request Swap</p>
                <p className="text-xs text-muted-foreground">Find someone to cover</p>
              </div>
            </Button>
            <Button variant="outline" className="w-full justify-start gap-3 h-14 rounded-xl border-destructive/30 hover:bg-destructive/5" onClick={() => { haptics.light(); setShowCallOffDrawer(true); }}>
              <XCircle className="w-5 h-5 text-destructive" />
              <div className="text-left">
                <p className="font-medium text-sm text-destructive">Call Off</p>
                <p className="text-xs text-muted-foreground">I can't make this shift</p>
              </div>
            </Button>
          </div>
        </DrawerContent>
      </Drawer>

      {/* Swap Bottom Sheet */}
      <Drawer open={showSwapDrawer} onOpenChange={(open) => { setShowSwapDrawer(open); if (!open) setSwapType(null); }}>
        <DrawerContent>
          <DrawerHeader>
            <DrawerTitle>{swapType === null ? 'Request Swap' : swapType === 'specific' ? 'Choose Coworker' : 'Open Request'}</DrawerTitle>
            <DrawerDescription>
              {swapType === null && 'How would you like to find coverage?'}
              {swapType === 'specific' && 'Select who you\'d like to swap with'}
              {swapType === 'open' && 'Your shift will be offered to all eligible workers'}
            </DrawerDescription>
          </DrawerHeader>
          <div className="px-4 pb-8">
            {requestSent ? (
              <div className="py-8 text-center">
                <div className="w-16 h-16 mx-auto rounded-full bg-success-muted flex items-center justify-center mb-4">
                  <Check className="w-8 h-8 text-success" />
                </div>
                <p className="font-semibold text-foreground">Request Sent!</p>
                <p className="text-sm text-muted-foreground mt-1">You'll be notified when there's a response</p>
              </div>
            ) : swapType === null ? (
              <div className="space-y-3">
                <Button variant="outline" className="w-full justify-start gap-3 h-14 rounded-xl" onClick={() => setSwapType('specific')}>
                  <User className="w-5 h-5 text-primary" />
                  <div className="text-left"><p className="font-medium text-sm">Ask Specific Person</p><p className="text-xs text-muted-foreground">Choose a coworker</p></div>
                  <ChevronRight className="w-4 h-4 ml-auto text-muted-foreground" />
                </Button>
                <Button variant="outline" className="w-full justify-start gap-3 h-14 rounded-xl" onClick={() => setSwapType('open')}>
                  <Users className="w-5 h-5 text-primary" />
                  <div className="text-left"><p className="font-medium text-sm">Open to All</p><p className="text-xs text-muted-foreground">Let anyone eligible take it</p></div>
                  <ChevronRight className="w-4 h-4 ml-auto text-muted-foreground" />
                </Button>
              </div>
            ) : swapType === 'specific' ? (
              <div className="space-y-3 max-h-[50vh] overflow-y-auto">
                <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-2">Available Teammates</p>
                {teammates.map((worker) => (
                  <MotionCard key={worker.id} onClick={() => handleSwapRequest(worker.id)}
                    className="w-full flex items-center gap-3 p-3 rounded-xl border border-border/50 hover:bg-accent/50 transition-colors cursor-pointer">
                    <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center"><User className="w-4 h-4 text-primary" /></div>
                    <div className="text-left"><p className="font-medium text-sm text-foreground">{worker.full_name}</p><p className="text-xs text-muted-foreground">{worker.position || 'Team Member'}</p></div>
                  </MotionCard>
                ))}
                {teammates.length === 0 && <p className="text-sm text-muted-foreground text-center py-4">No teammates found</p>}
              </div>
            ) : (
              <div className="space-y-4">
                <div className="p-4 rounded-xl bg-accent/50 border border-border/50"><p className="text-sm text-foreground">This shift will be offered to all eligible workers.</p></div>
                <Button className="w-full rounded-xl" onClick={() => handleSwapRequest()}>Post Open Request</Button>
              </div>
            )}
          </div>
        </DrawerContent>
      </Drawer>

      {/* Call Off Bottom Sheet */}
      <Drawer open={showCallOffDrawer} onOpenChange={(open) => { setShowCallOffDrawer(open); if (!open) setSelectedReason(null); }}>
        <DrawerContent>
          <DrawerHeader>
            <DrawerTitle>Call Off Shift</DrawerTitle>
            <DrawerDescription>Select a reason. Your manager will be notified.</DrawerDescription>
          </DrawerHeader>
          <div className="px-4 pb-8">
            {requestSent ? (
              <div className="py-8 text-center">
                <div className="w-16 h-16 mx-auto rounded-full bg-success-muted flex items-center justify-center mb-4"><Check className="w-8 h-8 text-success" /></div>
                <p className="font-semibold text-foreground">Call-Off Submitted</p>
                <p className="text-sm text-muted-foreground mt-1">Your manager has been notified</p>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="space-y-2">
                  {callOffReasons.map((reason) => (
                    <MotionCard key={reason.value} onClick={() => { haptics.light(); setSelectedReason(reason.value); }}
                      className={cn('w-full p-3.5 rounded-xl border text-left transition-all cursor-pointer',
                        selectedReason === reason.value ? 'border-primary bg-primary/5 shadow-sm' : 'border-border/50 hover:bg-accent/50')}>
                      <p className="font-medium text-sm">{reason.label}</p>
                    </MotionCard>
                  ))}
                </div>
                <Button className="w-full rounded-xl" variant="destructive" disabled={!selectedReason} onClick={handleCallOff}>Submit Call-Off</Button>
              </div>
            )}
          </div>
        </DrawerContent>
      </Drawer>
    </div>
    </PullToRefresh>
  );
};
