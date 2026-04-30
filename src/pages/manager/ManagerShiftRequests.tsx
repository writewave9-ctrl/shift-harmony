import { useState, useMemo } from 'react';
import { ManagerRequestsSkeleton } from '@/components/PageSkeletons';
import { useShiftRequests } from '@/hooks/useShiftRequests';
import { useSwapRequests, type SwapRequest } from '@/hooks/useSwapRequests';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerDescription,
} from '@/components/ui/drawer';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { format } from 'date-fns';
import {
  ChevronLeft, User, Calendar, MapPin, Check, X, Clock, HandHelping, ArrowLeftRight, Loader2, Inbox, RefreshCw, Sparkles,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { formatTimeRange } from '@/lib/formatTime';
import { toast } from 'sonner';
import type { ShiftRequest } from '@/hooks/useShiftRequests';
import { SwapStatusPill } from '@/components/SwapStatusPill';
import { SwapCountdownBadge } from '@/components/SwapCountdownBadge';
import { SwapTimeline } from '@/components/SwapTimeline';
import { ShiftActivityTimeline } from '@/components/ShiftActivityTimeline';
import { useShiftActivity } from '@/hooks/useShiftActivity';
import { supabase } from '@/integrations/supabase/client';
import { useCallOffRequests } from '@/hooks/useCallOffRequests';
import { CallOffRequestCard } from '@/components/CallOffRequestCard';
import { usePlan } from '@/hooks/usePlan';
import { UpgradePromptCard } from '@/components/UpgradePromptCard';
import { AlertOctagon } from 'lucide-react';
import { ConfirmDestructiveDialog } from '@/components/ConfirmDestructiveDialog';
import { StepProgress, type ProgressStep } from '@/components/StepProgress';

const formatDate = (dateStr: string) => {
  const date = new Date(dateStr);
  const today = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  if (date.toDateString() === today.toDateString()) return 'Today';
  if (date.toDateString() === tomorrow.toDateString()) return 'Tomorrow';
  return format(date, 'EEE, MMM d');
};

type SwapFilter = 'pending' | 'history';
type ShiftFilter = 'pending' | 'history';
type Confirm = null | 'approve';

export const ManagerShiftRequests = () => {
  const navigate = useNavigate();
  const { requests, loading, approveRequest, declineRequest, refetch: refetchRequests } = useShiftRequests();
  const {
    pendingForManager, loading: loadingSwaps,
    managerApproveSwap, managerDeclineSwap, requests: allSwaps, refetch: refetchSwaps,
  } = useSwapRequests();
  const { canUseFeature } = usePlan();
  const callOffsEnabled = canUseFeature('call_offs');
  const {
    requests: allCallOffs, pendingForManager: pendingCallOffs,
    loading: loadingCallOffs, approveCallOff, declineCallOff,
    refetch: refetchCallOffs,
  } = useCallOffRequests();
  const [selectedRequest, setSelectedRequest] = useState<ShiftRequest | null>(null);
  const [selectedSwap, setSelectedSwap] = useState<SwapRequest | null>(null);
  const [processing, setProcessing] = useState(false);
  const [shiftFilter, setShiftFilter] = useState<ShiftFilter>('pending');
  const [swapFilter, setSwapFilter] = useState<SwapFilter>('pending');
  const [callOffFilter, setCallOffFilter] = useState<SwapFilter>('pending');
  const [confirm, setConfirm] = useState<Confirm>(null);
  const [showDeclinePickup, setShowDeclinePickup] = useState(false);
  const [showDeclineSwap, setShowDeclineSwap] = useState(false);
  const [approveSteps, setApproveSteps] = useState<ProgressStep[] | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const handleRefreshAll = async () => {
    setRefreshing(true);
    try {
      await Promise.all([
        refetchRequests(),
        refetchSwaps(),
        callOffsEnabled ? refetchCallOffs() : Promise.resolve(),
      ]);
      toast.success('Up to date');
    } finally {
      setRefreshing(false);
    }
  };

  const initialApproveSteps = (workerName: string): ProgressStep[] => [
    { id: 'updateRequest', label: 'Approve request', state: 'pending' },
    { id: 'assignWorker', label: `Assign ${workerName} to shift`, state: 'pending' },
    { id: 'declineOthers', label: 'Decline competing requests', state: 'pending' },
  ];

  const handleApprove = async () => {
    if (!selectedRequest) return;
    const steps = initialApproveSteps(selectedRequest.worker?.full_name || 'worker');
    setApproveSteps(steps);
    setProcessing(true);
    const success = await approveRequest(
      selectedRequest.id,
      selectedRequest.shift_id,
      selectedRequest.worker_id,
      (stepId, status, detail) => {
        setApproveSteps((prev) =>
          (prev ?? steps).map((s) =>
            s.id === stepId ? { ...s, state: status, detail: detail ?? s.detail } : s,
          ),
        );
      },
    );
    setProcessing(false);
    if (success) {
      // Brief delay so user can see the green ✓✓✓ chain before drawer closes
      setTimeout(() => {
        setSelectedRequest(null);
        setApproveSteps(null);
      }, 900);
    }
  };

  const handleDecline = async (reason: string): Promise<boolean> => {
    if (!selectedRequest) return false;
    setProcessing(true);
    const success = await declineRequest(selectedRequest.id, reason);
    setProcessing(false);
    if (success) {
      setShowDeclinePickup(false);
      setSelectedRequest(null);
    }
    return success;
  };

  // Race-condition aware swap action
  const runSwapAction = async (
    swap: SwapRequest,
    action: 'approve' | 'decline',
    reason?: string,
  ): Promise<boolean> => {
    const { data: fresh, error } = await supabase
      .from('swap_requests')
      .select('status')
      .eq('id', swap.id)
      .maybeSingle();

    if (error || !fresh) {
      toast.error('Could not verify request — try again');
      refetchSwaps();
      return false;
    }
    if (fresh.status !== 'pending') {
      toast.error(
        fresh.status === 'approved' ? 'Already approved by another manager' :
        fresh.status === 'declined' ? 'Already declined' :
        'This request is no longer available',
      );
      refetchSwaps();
      return false;
    }

    if (action === 'approve') {
      if (!swap.requested_worker_id) return false;
      return await managerApproveSwap(swap, swap.requested_worker_id);
    }
    return await managerDeclineSwap(swap.id, reason, swap.reason);
  };

  const handleSwapApproveConfirm = async () => {
    if (!selectedSwap || confirm !== 'approve') return;
    setProcessing(true);
    const ok = await runSwapAction(selectedSwap, 'approve');
    setProcessing(false);
    if (ok) {
      setConfirm(null);
      setSelectedSwap(null);
    } else {
      setConfirm(null);
    }
  };

  const handleSwapDecline = async (reason: string): Promise<boolean> => {
    if (!selectedSwap) return false;
    setProcessing(true);
    const ok = await runSwapAction(selectedSwap, 'decline', reason);
    setProcessing(false);
    if (ok) {
      setShowDeclineSwap(false);
      setSelectedSwap(null);
    }
    return ok;
  };

  const closeSwapDrawer = () => {
    setSelectedSwap(null);
    setConfirm(null);
  };

  const reviewedSwaps = useMemo(() => allSwaps.filter(s => s.status !== 'pending'), [allSwaps]);
  const reviewedCallOffs = useMemo(() => allCallOffs.filter(c => c.status !== 'pending'), [allCallOffs]);

  if (loading || loadingSwaps || (callOffsEnabled && loadingCallOffs)) return <ManagerRequestsSkeleton />;

  const pendingList = requests.filter(r => r.status === 'pending');
  const reviewedList = requests.filter(r => r.status !== 'pending');
  const totalPending = pendingList.length + pendingForManager.length + (callOffsEnabled ? pendingCallOffs.length : 0);

  const visibleShifts = shiftFilter === 'pending' ? pendingList : reviewedList;
  const visibleSwaps = swapFilter === 'pending' ? pendingForManager : reviewedSwaps;
  const visibleCallOffs = callOffFilter === 'pending' ? pendingCallOffs : reviewedCallOffs;

  const renderFilterPills = (
    value: string,
    onChange: (v: string) => void,
    options: { value: string; label: string }[],
  ) => (
    <div className="inline-flex items-center gap-1 p-1 rounded-full bg-muted/60 border border-border/40">
      {options.map(o => (
        <button
          key={o.value}
          onClick={() => onChange(o.value)}
          className={cn(
            'px-3 py-1 rounded-full text-[11px] font-semibold transition-all',
            value === o.value
              ? 'bg-background text-foreground shadow-elevated'
              : 'text-muted-foreground hover:text-foreground',
          )}
        >
          {o.label}
        </button>
      ))}
    </div>
  );

  return (
    <div className="min-h-screen bg-background pb-8">
      <header className="sticky top-0 z-10 bg-background/95 backdrop-blur-xl border-b border-border/40 shadow-elevated px-4 py-4 lg:px-8">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/manager')}
            className="p-2 -ml-2 rounded-lg hover:bg-accent transition-colors lg:hidden"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-gradient-accent flex items-center justify-center">
              <HandHelping className="w-4 h-4 text-primary" />
            </div>
            <h1 className="text-lg font-semibold text-foreground tracking-tight">Requests</h1>
          </div>
          {totalPending > 0 ? (
            <span className="ml-auto text-xs font-semibold text-primary bg-primary/10 border border-primary/20 px-2 py-1 rounded-full">
              {totalPending} pending
            </span>
          ) : (
            <span className="ml-auto text-[11px] font-semibold text-success bg-success-muted border border-success/20 px-2 py-1 rounded-full inline-flex items-center gap-1">
              <Sparkles className="w-3 h-3" />All clear
            </span>
          )}
          <button
            type="button"
            onClick={handleRefreshAll}
            disabled={refreshing}
            aria-label="Refresh all requests"
            className="p-2 rounded-lg hover:bg-accent transition-colors disabled:opacity-60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <RefreshCw className={cn('w-4 h-4 text-muted-foreground', refreshing && 'animate-spin text-primary')} />
          </button>
        </div>
      </header>

      <div className="px-4 lg:px-8 py-6">
        <Tabs defaultValue="shifts" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="shifts" className="gap-1.5">
              <HandHelping className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Pickups</span>
              {pendingList.length > 0 && <span className="text-[10px] bg-primary/15 text-primary px-1.5 py-0.5 rounded-full">{pendingList.length}</span>}
            </TabsTrigger>
            <TabsTrigger value="swaps" className="gap-1.5">
              <ArrowLeftRight className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Swaps</span>
              {pendingForManager.length > 0 && <span className="text-[10px] bg-primary/15 text-primary px-1.5 py-0.5 rounded-full">{pendingForManager.length}</span>}
            </TabsTrigger>
            <TabsTrigger value="call-offs" className="gap-1.5">
              <AlertOctagon className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Call-offs</span>
              {callOffsEnabled && pendingCallOffs.length > 0 && (
                <span className="text-[10px] bg-warning/20 text-warning px-1.5 py-0.5 rounded-full">{pendingCallOffs.length}</span>
              )}
            </TabsTrigger>
          </TabsList>

          {/* ============ Shift Pickups ============ */}
          <TabsContent value="shifts" className="space-y-4">
            <div className="flex justify-end">
              {renderFilterPills(shiftFilter, (v) => setShiftFilter(v as ShiftFilter), [
                { value: 'pending', label: `Pending${pendingList.length ? ` · ${pendingList.length}` : ''}` },
                { value: 'history', label: 'History' },
              ])}
            </div>

            {visibleShifts.length > 0 ? (
              visibleShifts.map(request => (
                <Card
                  key={request.id}
                  className={cn(
                    'cursor-pointer hover:bg-accent/30 transition-colors rounded-2xl lift',
                    request.status === 'pending'
                      ? 'shadow-floating border-primary/20 bg-gradient-surface'
                      : 'shadow-elevated border-border/50',
                  )}
                  onClick={() => setSelectedRequest(request)}
                >
                  <CardContent className="pt-4">
                    <div className="flex items-start gap-3">
                      <div className={cn(
                        'w-10 h-10 rounded-full flex items-center justify-center shrink-0',
                        request.status === 'pending' ? 'bg-gradient-accent' : 'bg-accent',
                      )}>
                        <User className={cn('w-5 h-5', request.status === 'pending' ? 'text-primary' : 'text-muted-foreground')} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-foreground">{request.worker?.full_name}</p>
                        <p className="text-sm text-muted-foreground">{request.worker?.position || 'Team Member'}</p>
                        <div className="mt-2 flex flex-wrap gap-2 text-xs">
                          <span className="flex items-center gap-1 text-muted-foreground"><Calendar className="w-3 h-3" />{request.shift && formatDate(request.shift.date)}</span>
                          <span className="flex items-center gap-1 text-muted-foreground"><Clock className="w-3 h-3" />{request.shift ? formatTimeRange(request.shift.start_time, request.shift.end_time) : ''}</span>
                        </div>
                        {request.notes && <p className="mt-2 text-xs text-muted-foreground italic">"{request.notes}"</p>}
                      </div>
                      <SwapStatusPill status={(request.status === 'approved' ? 'approved' : request.status === 'declined' ? 'declined' : 'pending') as any} />
                    </div>
                  </CardContent>
                </Card>
              ))
            ) : (
              <Card className="rounded-2xl bg-gradient-surface shadow-elevated border-border/40">
                <CardContent className="py-10 text-center">
                  <div className="w-14 h-14 mx-auto rounded-2xl bg-muted/60 flex items-center justify-center mb-3">
                    <Inbox className="w-6 h-6 text-muted-foreground/60" />
                  </div>
                  <p className="text-sm font-medium text-foreground">
                    {shiftFilter === 'pending' ? 'No pending pickups' : 'No reviewed pickups yet'}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1 mb-4">
                    {shiftFilter === 'pending'
                      ? "When workers request open shifts, they'll appear here for review."
                      : 'Approved and declined pickups will be listed here for reference.'}
                  </p>
                  <button
                    onClick={() => navigate('/manager/shifts')}
                    className="text-xs font-semibold text-primary hover:underline"
                  >
                    Manage open shifts →
                  </button>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* ============ Swaps ============ */}
          <TabsContent value="swaps" className="space-y-4">
            <div className="flex justify-end">
              {renderFilterPills(swapFilter, (v) => setSwapFilter(v as SwapFilter), [
                { value: 'pending', label: `Pending${pendingForManager.length ? ` · ${pendingForManager.length}` : ''}` },
                { value: 'history', label: 'History' },
              ])}
            </div>

            {visibleSwaps.length > 0 ? (
              visibleSwaps.map(swap => (
                <Card
                  key={swap.id}
                  className={cn(
                    'cursor-pointer hover:bg-accent/30 transition-colors rounded-2xl lift',
                    swap.status === 'pending'
                      ? 'shadow-floating border-primary/20 bg-gradient-surface'
                      : 'shadow-elevated border-border/40',
                  )}
                  onClick={() => setSelectedSwap(swap)}
                >
                  <CardContent className="pt-4">
                    <div className="flex items-start gap-3">
                      <div className={cn(
                        'w-10 h-10 rounded-full flex items-center justify-center shrink-0',
                        swap.status === 'pending' ? 'bg-gradient-primary shadow-glow' : 'bg-accent',
                      )}>
                        <ArrowLeftRight className={cn('w-5 h-5', swap.status === 'pending' ? 'text-primary-foreground' : 'text-muted-foreground')} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-foreground text-sm">
                          {swap.requester?.full_name}
                          <span className="text-muted-foreground font-normal"> wants to swap with </span>
                          {swap.is_open_to_all ? 'anyone' : swap.requested_worker?.full_name || 'a teammate'}
                        </p>
                        <div className="mt-2 flex flex-wrap gap-2 text-xs">
                          <span className="flex items-center gap-1 text-muted-foreground"><Calendar className="w-3 h-3" />{swap.shift && formatDate(swap.shift.date)}</span>
                          <span className="flex items-center gap-1 text-muted-foreground"><Clock className="w-3 h-3" />{swap.shift ? formatTimeRange(swap.shift.start_time, swap.shift.end_time) : ''}</span>
                          <span className="text-muted-foreground">{swap.shift?.position}</span>
                        </div>
                        {swap.reason && swap.reason !== 'Shift swap request' && (
                          <p className="mt-2 text-xs text-muted-foreground italic">"{swap.reason}"</p>
                        )}
                      </div>
                      <div className="flex flex-col items-end gap-1 shrink-0">
                        <SwapStatusPill status={swap.status} />
                        {swap.status === 'pending' && <SwapCountdownBadge shift={swap.shift} />}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            ) : (
              <Card className="rounded-2xl bg-gradient-surface shadow-elevated border-border/40">
                <CardContent className="py-10 text-center">
                  <div className="w-14 h-14 mx-auto rounded-2xl bg-gradient-accent flex items-center justify-center mb-3">
                    <ArrowLeftRight className="w-6 h-6 text-primary/70" />
                  </div>
                  <p className="text-sm font-medium text-foreground">
                    {swapFilter === 'pending' ? 'All caught up — no pending swaps' : 'No past swap activity'}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1 mb-4">
                    {swapFilter === 'pending'
                      ? 'Worker-to-worker swaps awaiting your approval will show up here.'
                      : 'Approved, declined, and expired swaps will be archived here.'}
                  </p>
                  <button
                    onClick={() => navigate('/manager/team')}
                    className="text-xs font-semibold text-primary hover:underline"
                  >
                    View your team →
                  </button>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* ============ Call-offs ============ */}
          <TabsContent value="call-offs" className="space-y-4">
            {!callOffsEnabled ? (
              <UpgradePromptCard
                requiredPlan="pro"
                title="Call-off management is a Pro feature"
                description="Let workers report when they can't make a shift. Approve to instantly post the shift as open coverage."
              />
            ) : (
              <>
                <div className="flex justify-end">
                  {renderFilterPills(callOffFilter, (v) => setCallOffFilter(v as SwapFilter), [
                    { value: 'pending', label: `Pending${pendingCallOffs.length ? ` · ${pendingCallOffs.length}` : ''}` },
                    { value: 'history', label: 'History' },
                  ])}
                </div>
                {visibleCallOffs.length > 0 ? (
                  visibleCallOffs.map(req => (
                    <CallOffRequestCard
                      key={req.id}
                      request={req}
                      onApprove={approveCallOff}
                      onDecline={declineCallOff}
                    />
                  ))
                ) : (
                  <Card className="rounded-2xl bg-gradient-surface shadow-elevated border-border/40">
                    <CardContent className="py-10 text-center">
                      <div className="w-14 h-14 mx-auto rounded-2xl bg-warning/10 flex items-center justify-center mb-3">
                        <AlertOctagon className="w-6 h-6 text-warning/80" />
                      </div>
                      <p className="text-sm font-medium text-foreground">
                        {callOffFilter === 'pending' ? 'No pending call-offs' : 'No past call-offs'}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1 mb-4">
                        {callOffFilter === 'pending'
                          ? "When workers report they can't make a shift, requests appear here."
                          : 'Approved and declined call-offs will be archived here for reference.'}
                      </p>
                    </CardContent>
                  </Card>
                )}
              </>
            )}
          </TabsContent>
        </Tabs>
      </div>

      {/* ============ Shift Pickup Drawer ============ */}
      <Drawer open={!!selectedRequest} onOpenChange={() => setSelectedRequest(null)}>
        <DrawerContent className="bg-gradient-surface">
          <DrawerHeader>
            <DrawerTitle>Shift Pickup Request</DrawerTitle>
            <DrawerDescription>Review and respond</DrawerDescription>
          </DrawerHeader>
          {selectedRequest && (
            <div className="px-4 pb-8 space-y-4">
              <div className="flex items-center gap-3 p-4 rounded-2xl bg-gradient-accent border border-border/40 shadow-elevated">
                <div className="w-12 h-12 rounded-full bg-gradient-primary flex items-center justify-center shadow-glow">
                  <User className="w-6 h-6 text-primary-foreground" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-semibold">{selectedRequest.worker?.full_name}</p>
                  <p className="text-sm text-muted-foreground">{selectedRequest.worker?.position || 'Team Member'}</p>
                </div>
                <SwapStatusPill status={(selectedRequest.status === 'approved' ? 'approved' : selectedRequest.status === 'declined' ? 'declined' : 'pending') as any} />
              </div>
              <div className="space-y-2">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Requested Shift</p>
                <div className="p-4 rounded-2xl border border-border/50 bg-card shadow-elevated">
                  <p className="font-semibold">{selectedRequest.shift?.position}</p>
                  <div className="mt-2 space-y-1 text-sm text-muted-foreground">
                    <p className="flex items-center gap-2"><Calendar className="w-4 h-4 text-primary/70" />{selectedRequest.shift && formatDate(selectedRequest.shift.date)}</p>
                    <p className="flex items-center gap-2"><Clock className="w-4 h-4 text-primary/70" />{selectedRequest.shift ? formatTimeRange(selectedRequest.shift.start_time, selectedRequest.shift.end_time) : ''}</p>
                    <p className="flex items-center gap-2"><MapPin className="w-4 h-4 text-primary/70" />{selectedRequest.shift?.location}</p>
                  </div>
                </div>
              </div>
              {selectedRequest.notes && (
                <div className="p-3 rounded-xl bg-muted/40 border border-border/40">
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-1">Note from worker</p>
                  <p className="text-sm">"{selectedRequest.notes}"</p>
                </div>
              )}
              {approveSteps && (
                <StepProgress steps={approveSteps} />
              )}
              {selectedRequest.status === 'pending' && !approveSteps && (
                <div className="flex gap-3 pt-2">
                  <Button
                    variant="outline"
                    className="flex-1 h-11 rounded-xl shadow-elevated"
                    onClick={() => setShowDeclinePickup(true)}
                    disabled={processing}
                  >
                    <X className="w-4 h-4 mr-2" />Decline
                  </Button>
                  <Button
                    className="flex-1 h-11 rounded-xl bg-gradient-primary shadow-floating hover:opacity-95"
                    onClick={handleApprove}
                    disabled={processing}
                  >
                    {processing ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Check className="w-4 h-4 mr-2" />Approve & Assign</>}
                  </Button>
                </div>
              )}
            </div>
          )}
        </DrawerContent>
      </Drawer>

      {/* Decline pickup confirmation with reason capture */}
      <ConfirmDestructiveDialog
        open={showDeclinePickup}
        onOpenChange={setShowDeclinePickup}
        title="Decline this pickup request?"
        description={
          selectedRequest?.worker?.full_name
            ? `${selectedRequest.worker.full_name} will be notified. Share a brief reason so they understand.`
            : 'The worker will be notified. Share a brief reason so they understand.'
        }
        requireReason
        reasonLabel="Reason for declining"
        reasonPlaceholder="e.g. Already filled by someone else, scheduling conflict…"
        confirmLabel="Decline request"
        tone="destructive"
        onConfirm={handleDecline}
      />

      {/* ============ Swap Drawer (with timeline + confirm step) ============ */}
      <Drawer open={!!selectedSwap} onOpenChange={(o) => !o && closeSwapDrawer()}>
        <DrawerContent className="bg-gradient-surface">
          <DrawerHeader>
            <DrawerTitle className="flex items-center gap-2">
              <ArrowLeftRight className="w-4 h-4 text-primary" />
              Swap Request
            </DrawerTitle>
            <DrawerDescription>Review the proposed shift swap</DrawerDescription>
          </DrawerHeader>
          {selectedSwap && (
            <div className="px-4 pb-8 space-y-4">
              {/* Requester ↔ Target */}
              <div className="flex items-center gap-3">
                <div className="flex-1 p-3 rounded-2xl bg-card border border-border/50 shadow-elevated">
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">From</p>
                  <p className="text-sm font-semibold mt-1 truncate">{selectedSwap.requester?.full_name}</p>
                  {selectedSwap.requester?.position && (
                    <p className="text-[11px] text-muted-foreground truncate">{selectedSwap.requester.position}</p>
                  )}
                </div>
                <div className="w-8 h-8 rounded-full bg-gradient-primary flex items-center justify-center shadow-glow shrink-0">
                  <ArrowLeftRight className="w-4 h-4 text-primary-foreground" />
                </div>
                <div className="flex-1 p-3 rounded-2xl bg-gradient-accent border border-primary/20 shadow-elevated">
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">To</p>
                  <p className="text-sm font-semibold mt-1 truncate">
                    {selectedSwap.is_open_to_all ? 'Open to all' : selectedSwap.requested_worker?.full_name || '—'}
                  </p>
                  {!selectedSwap.is_open_to_all && selectedSwap.requested_worker?.position && (
                    <p className="text-[11px] text-muted-foreground truncate">{selectedSwap.requested_worker.position}</p>
                  )}
                </div>
              </div>

              {/* Shift */}
              <div className="space-y-2">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Shift Being Swapped</p>
                <div className="p-4 rounded-2xl border border-border/50 bg-card shadow-elevated">
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <p className="font-semibold">{selectedSwap.shift?.position}</p>
                    <div className="flex flex-col items-end gap-1">
                      <SwapStatusPill status={selectedSwap.status} />
                      {selectedSwap.status === 'pending' && <SwapCountdownBadge shift={selectedSwap.shift} />}
                    </div>
                  </div>
                  <div className="space-y-1.5 text-sm text-muted-foreground">
                    <p className="flex items-center gap-2"><Calendar className="w-4 h-4 text-primary/70" />{selectedSwap.shift && formatDate(selectedSwap.shift.date)}</p>
                    <p className="flex items-center gap-2"><Clock className="w-4 h-4 text-primary/70" />{selectedSwap.shift ? formatTimeRange(selectedSwap.shift.start_time, selectedSwap.shift.end_time) : ''}</p>
                    <p className="flex items-center gap-2"><MapPin className="w-4 h-4 text-primary/70" />{selectedSwap.shift?.location}</p>
                  </div>
                </div>
              </div>

              {selectedSwap.reason && selectedSwap.reason !== 'Shift swap request' && (
                <div className="p-3 rounded-xl bg-muted/40 border border-border/40">
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-1">Reason</p>
                  <p className="text-sm">"{selectedSwap.reason}"</p>
                </div>
              )}

              {selectedSwap.is_open_to_all && (
                <div className="p-3 rounded-xl bg-warning-muted border border-warning/30">
                  <p className="text-xs text-warning-foreground">
                    Open swap — pick a specific worker before approving, or decline so the requester can ask someone directly.
                  </p>
                </div>
              )}

              {/* Activity timeline */}
              <SwapTimeline
                createdAt={selectedSwap.created_at}
                updatedAt={(selectedSwap as any).updated_at}
                status={selectedSwap.status}
              />

              {selectedSwap.status === 'pending' ? (
                confirm === 'approve' ? (
                  <div className="rounded-2xl border border-primary/30 bg-primary/5 p-4 space-y-3 shadow-elevated">
                    <div>
                      <p className="text-sm font-semibold text-foreground">Approve this swap?</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {`${selectedSwap.requested_worker?.full_name || 'The new worker'} will be assigned to this shift, replacing ${selectedSwap.requester?.full_name || 'the requester'}.`}
                      </p>
                    </div>
                    <div className="flex gap-3">
                      <Button
                        variant="outline"
                        className="flex-1 h-11 rounded-xl shadow-elevated"
                        onClick={() => setConfirm(null)}
                        disabled={processing}
                      >
                        Cancel
                      </Button>
                      <Button
                        className="flex-1 h-11 rounded-xl shadow-floating hover:opacity-95 bg-gradient-primary text-primary-foreground"
                        onClick={handleSwapApproveConfirm}
                        disabled={processing}
                      >
                        {processing
                          ? <Loader2 className="w-4 h-4 animate-spin" />
                          : <><Check className="w-4 h-4 mr-2" />Yes, approve</>}
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="flex gap-3 pt-2">
                    <Button
                      variant="outline"
                      className="flex-1 h-11 rounded-xl shadow-elevated"
                      onClick={() => setShowDeclineSwap(true)}
                      disabled={processing}
                    >
                      <X className="w-4 h-4 mr-2" />Decline
                    </Button>
                    <Button
                      className="flex-1 h-11 rounded-xl bg-gradient-primary shadow-floating hover:opacity-95"
                      onClick={() => setConfirm('approve')}
                      disabled={processing || !selectedSwap.requested_worker_id}
                    >
                      <Check className="w-4 h-4 mr-2" />Approve
                    </Button>
                  </div>
                )
              ) : (
                <div className="text-center text-xs text-muted-foreground py-2">
                  This swap is no longer pending.
                </div>
              )}
            </div>
          )}
        </DrawerContent>
      </Drawer>

      {/* Decline swap confirmation with reason capture — recorded in shift activity timeline */}
      <ConfirmDestructiveDialog
        open={showDeclineSwap}
        onOpenChange={setShowDeclineSwap}
        title="Decline this swap request?"
        description={
          selectedSwap?.requester?.full_name
            ? `${selectedSwap.requester.full_name} and the proposed teammate will be notified. Your reason will be recorded in the shift activity timeline.`
            : 'Both workers will be notified. Your reason will be recorded in the shift activity timeline.'
        }
        requireReason
        reasonLabel="Reason for declining"
        reasonPlaceholder="e.g. Coverage conflict, unequal experience for this role…"
        confirmLabel="Decline swap"
        tone="destructive"
        onConfirm={handleSwapDecline}
      />
    </div>
  );
};

export default ManagerShiftRequests;
