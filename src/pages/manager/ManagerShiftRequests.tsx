import { useState } from 'react';
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
  ChevronLeft, User, Calendar, MapPin, Check, X, Clock, HandHelping, ArrowLeftRight, Loader2,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { formatTimeRange } from '@/lib/formatTime';
import type { ShiftRequest } from '@/hooks/useShiftRequests';

const formatDate = (dateStr: string) => {
  const date = new Date(dateStr);
  const today = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  if (date.toDateString() === today.toDateString()) return 'Today';
  if (date.toDateString() === tomorrow.toDateString()) return 'Tomorrow';
  return format(date, 'EEE, MMM d');
};

export const ManagerShiftRequests = () => {
  const navigate = useNavigate();
  const { requests, loading, approveRequest, declineRequest } = useShiftRequests();
  const {
    pendingForManager, loading: loadingSwaps,
    managerApproveSwap, managerDeclineSwap, requests: allSwaps,
  } = useSwapRequests();
  const [selectedRequest, setSelectedRequest] = useState<ShiftRequest | null>(null);
  const [selectedSwap, setSelectedSwap] = useState<SwapRequest | null>(null);
  const [processing, setProcessing] = useState(false);

  const handleApprove = async () => {
    if (!selectedRequest) return;
    setProcessing(true);
    const success = await approveRequest(selectedRequest.id, selectedRequest.shift_id, selectedRequest.worker_id);
    setProcessing(false);
    if (success) setSelectedRequest(null);
  };

  const handleDecline = async () => {
    if (!selectedRequest) return;
    setProcessing(true);
    const success = await declineRequest(selectedRequest.id);
    setProcessing(false);
    if (success) setSelectedRequest(null);
  };

  const handleSwapApprove = async () => {
    if (!selectedSwap) return;
    const newWorkerId = selectedSwap.requested_worker_id;
    if (!newWorkerId) return;
    setProcessing(true);
    const ok = await managerApproveSwap(selectedSwap, newWorkerId);
    setProcessing(false);
    if (ok) setSelectedSwap(null);
  };

  const handleSwapDecline = async () => {
    if (!selectedSwap) return;
    setProcessing(true);
    const ok = await managerDeclineSwap(selectedSwap.id);
    setProcessing(false);
    if (ok) setSelectedSwap(null);
  };

  if (loading || loadingSwaps) return <ManagerRequestsSkeleton />;

  const pendingList = requests.filter(r => r.status === 'pending');
  const reviewedList = requests.filter(r => r.status !== 'pending');
  const reviewedSwaps = allSwaps.filter(s => s.status !== 'pending');
  const totalPending = pendingList.length + pendingForManager.length;

  return (
    <div className="min-h-screen bg-background pb-8">
      <header className="sticky top-0 z-10 bg-background/95 backdrop-blur-xl border-b border-border/40 px-4 py-4 lg:px-8">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/manager')}
            className="p-2 -ml-2 rounded-lg hover:bg-accent transition-colors lg:hidden"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-2">
            <HandHelping className="w-5 h-5 text-primary" />
            <h1 className="text-lg font-semibold text-foreground">Requests</h1>
          </div>
          {totalPending > 0 && (
            <span className="ml-auto text-xs font-medium text-primary bg-primary/10 px-2 py-1 rounded-full">
              {totalPending} pending
            </span>
          )}
        </div>
      </header>

      <div className="px-4 lg:px-8 py-6">
        <Tabs defaultValue="shifts" className="space-y-6">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="shifts" className="gap-1.5">
              <HandHelping className="w-3.5 h-3.5" />
              Shift Pickups
              {pendingList.length > 0 && <span className="text-[10px] bg-primary/15 text-primary px-1.5 py-0.5 rounded-full">{pendingList.length}</span>}
            </TabsTrigger>
            <TabsTrigger value="swaps" className="gap-1.5">
              <ArrowLeftRight className="w-3.5 h-3.5" />
              Swaps
              {pendingForManager.length > 0 && <span className="text-[10px] bg-primary/15 text-primary px-1.5 py-0.5 rounded-full">{pendingForManager.length}</span>}
            </TabsTrigger>
          </TabsList>

          {/* Shift Pickups */}
          <TabsContent value="shifts" className="space-y-4">
            {pendingList.length > 0 ? (
              pendingList.map(request => (
                <Card key={request.id} className="cursor-pointer hover:bg-accent/30 transition-colors" onClick={() => setSelectedRequest(request)}>
                  <CardContent className="pt-4">
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                        <User className="w-5 h-5 text-primary" />
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
                      <span className="text-xs font-medium text-warning bg-warning/10 px-2 py-1 rounded-full">Pending</span>
                    </div>
                  </CardContent>
                </Card>
              ))
            ) : (
              <div className="text-center py-12">
                <HandHelping className="w-12 h-12 mx-auto text-muted-foreground/50 mb-4" />
                <p className="text-muted-foreground">No pending pickups</p>
              </div>
            )}

            {reviewedList.length > 0 && (
              <div className="pt-4">
                <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Recently Reviewed</h3>
                <div className="space-y-2">
                  {reviewedList.slice(0, 5).map(request => (
                    <Card key={request.id}>
                      <CardContent className="pt-4">
                        <div className="flex items-start gap-3">
                          <div className="w-10 h-10 rounded-full bg-accent flex items-center justify-center shrink-0">
                            <User className="w-5 h-5 text-muted-foreground" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-foreground">{request.worker?.full_name}</p>
                            <div className="mt-1 flex flex-wrap gap-2 text-xs">
                              <span className="flex items-center gap-1 text-muted-foreground"><Calendar className="w-3 h-3" />{request.shift && formatDate(request.shift.date)}</span>
                              <span className="flex items-center gap-1 text-muted-foreground">{request.shift?.position}</span>
                            </div>
                          </div>
                          <span className={cn('text-xs font-medium px-2 py-1 rounded-full',
                            request.status === 'approved' ? 'text-primary bg-primary/10' : 'text-destructive bg-destructive/10'
                          )}>
                            {request.status === 'approved' ? 'Approved' : 'Declined'}
                          </span>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )}
          </TabsContent>

          {/* Swaps */}
          <TabsContent value="swaps" className="space-y-4">
            {pendingForManager.length > 0 ? (
              pendingForManager.map(swap => (
                <Card key={swap.id} className="cursor-pointer hover:bg-accent/30 transition-colors" onClick={() => setSelectedSwap(swap)}>
                  <CardContent className="pt-4">
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                        <ArrowLeftRight className="w-5 h-5 text-primary" />
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
                      <span className="text-xs font-medium text-warning bg-warning/10 px-2 py-1 rounded-full">Pending</span>
                    </div>
                  </CardContent>
                </Card>
              ))
            ) : (
              <div className="text-center py-12">
                <ArrowLeftRight className="w-12 h-12 mx-auto text-muted-foreground/50 mb-4" />
                <p className="text-muted-foreground">No pending swap requests</p>
              </div>
            )}

            {reviewedSwaps.length > 0 && (
              <div className="pt-4">
                <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Recently Reviewed</h3>
                <div className="space-y-2">
                  {reviewedSwaps.slice(0, 5).map(s => (
                    <Card key={s.id}>
                      <CardContent className="pt-4">
                        <div className="flex items-start gap-3">
                          <div className="w-10 h-10 rounded-full bg-accent flex items-center justify-center shrink-0">
                            <ArrowLeftRight className="w-5 h-5 text-muted-foreground" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-foreground text-sm">{s.requester?.full_name} → {s.requested_worker?.full_name || 'Open'}</p>
                            <p className="text-xs text-muted-foreground mt-0.5">{s.shift && formatDate(s.shift.date)} • {s.shift?.position}</p>
                          </div>
                          <span className={cn('text-xs font-medium px-2 py-1 rounded-full',
                            s.status === 'approved' ? 'text-primary bg-primary/10' : 'text-destructive bg-destructive/10'
                          )}>
                            {s.status === 'approved' ? 'Approved' : 'Declined'}
                          </span>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>

      {/* Shift Request Drawer */}
      <Drawer open={!!selectedRequest} onOpenChange={() => setSelectedRequest(null)}>
        <DrawerContent>
          <DrawerHeader>
            <DrawerTitle>Shift Pickup Request</DrawerTitle>
            <DrawerDescription>Review and respond</DrawerDescription>
          </DrawerHeader>
          {selectedRequest && (
            <div className="px-4 pb-8 space-y-4">
              <div className="flex items-center gap-3 p-4 rounded-xl bg-accent/50">
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                  <User className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <p className="font-semibold">{selectedRequest.worker?.full_name}</p>
                  <p className="text-sm text-muted-foreground">{selectedRequest.worker?.position || 'Team Member'}</p>
                </div>
              </div>
              <div className="space-y-2">
                <p className="text-sm font-medium text-muted-foreground">REQUESTED SHIFT</p>
                <div className="p-4 rounded-xl border border-border/50">
                  <p className="font-medium">{selectedRequest.shift?.position}</p>
                  <div className="mt-2 space-y-1 text-sm text-muted-foreground">
                    <p className="flex items-center gap-2"><Calendar className="w-4 h-4" />{selectedRequest.shift && formatDate(selectedRequest.shift.date)}</p>
                    <p className="flex items-center gap-2"><Clock className="w-4 h-4" />{selectedRequest.shift ? formatTimeRange(selectedRequest.shift.start_time, selectedRequest.shift.end_time) : ''}</p>
                    <p className="flex items-center gap-2"><MapPin className="w-4 h-4" />{selectedRequest.shift?.location}</p>
                  </div>
                </div>
              </div>
              {selectedRequest.notes && (
                <div className="p-3 rounded-lg bg-muted/50">
                  <p className="text-xs font-medium text-muted-foreground mb-1">Note from worker:</p>
                  <p className="text-sm">"{selectedRequest.notes}"</p>
                </div>
              )}
              <div className="flex gap-3 pt-2">
                <Button variant="outline" className="flex-1" onClick={handleDecline} disabled={processing}>
                  {processing ? <Loader2 className="w-4 h-4 animate-spin" /> : <><X className="w-4 h-4 mr-2" />Decline</>}
                </Button>
                <Button className="flex-1" onClick={handleApprove} disabled={processing}>
                  {processing ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Check className="w-4 h-4 mr-2" />Approve</>}
                </Button>
              </div>
            </div>
          )}
        </DrawerContent>
      </Drawer>

      {/* Swap Drawer */}
      <Drawer open={!!selectedSwap} onOpenChange={() => setSelectedSwap(null)}>
        <DrawerContent>
          <DrawerHeader>
            <DrawerTitle>Swap Request</DrawerTitle>
            <DrawerDescription>Review the proposed shift swap</DrawerDescription>
          </DrawerHeader>
          {selectedSwap && (
            <div className="px-4 pb-8 space-y-4">
              <div className="flex items-center gap-3">
                <div className="flex-1 p-3 rounded-xl bg-accent/50 border border-border/50">
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">From</p>
                  <p className="text-sm font-semibold mt-1">{selectedSwap.requester?.full_name}</p>
                </div>
                <ArrowLeftRight className="w-5 h-5 text-primary shrink-0" />
                <div className="flex-1 p-3 rounded-xl bg-primary/5 border border-primary/20">
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">To</p>
                  <p className="text-sm font-semibold mt-1">
                    {selectedSwap.is_open_to_all ? 'Open to all' : selectedSwap.requested_worker?.full_name || '—'}
                  </p>
                </div>
              </div>
              <div className="space-y-2">
                <p className="text-sm font-medium text-muted-foreground">SHIFT BEING SWAPPED</p>
                <div className="p-4 rounded-xl border border-border/50">
                  <p className="font-medium">{selectedSwap.shift?.position}</p>
                  <div className="mt-2 space-y-1 text-sm text-muted-foreground">
                    <p className="flex items-center gap-2"><Calendar className="w-4 h-4" />{selectedSwap.shift && formatDate(selectedSwap.shift.date)}</p>
                    <p className="flex items-center gap-2"><Clock className="w-4 h-4" />{selectedSwap.shift ? formatTimeRange(selectedSwap.shift.start_time, selectedSwap.shift.end_time) : ''}</p>
                    <p className="flex items-center gap-2"><MapPin className="w-4 h-4" />{selectedSwap.shift?.location}</p>
                  </div>
                </div>
              </div>
              {selectedSwap.is_open_to_all && (
                <div className="p-3 rounded-lg bg-warning/10 border border-warning/20">
                  <p className="text-xs text-warning-foreground">
                    This is an open swap. Approving without a target worker requires picking one — for now please decline and ask a specific worker to claim it.
                  </p>
                </div>
              )}
              <div className="flex gap-3 pt-2">
                <Button variant="outline" className="flex-1" onClick={handleSwapDecline} disabled={processing}>
                  {processing ? <Loader2 className="w-4 h-4 animate-spin" /> : <><X className="w-4 h-4 mr-2" />Decline</>}
                </Button>
                <Button
                  className="flex-1"
                  onClick={handleSwapApprove}
                  disabled={processing || !selectedSwap.requested_worker_id}
                >
                  {processing ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Check className="w-4 h-4 mr-2" />Approve</>}
                </Button>
              </div>
            </div>
          )}
        </DrawerContent>
      </Drawer>
    </div>
  );
};

export default ManagerShiftRequests;
