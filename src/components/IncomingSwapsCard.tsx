import { useState, useMemo } from 'react';
import {
  ArrowLeftRight, Calendar, Clock, Check, X, Loader2, User, MapPin, Inbox,
} from 'lucide-react';
import { useSwapRequests, type SwapRequest } from '@/hooks/useSwapRequests';
import { Button } from '@/components/ui/button';
import { formatTimeRange } from '@/lib/formatTime';
import { format } from 'date-fns';
import { MotionCard } from '@/components/MotionWrapper';
import { SwapStatusPill } from '@/components/SwapStatusPill';
import { SwapCountdownBadge } from '@/components/SwapCountdownBadge';
import { SwapTimeline } from '@/components/SwapTimeline';
import {
  Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerDescription,
} from '@/components/ui/drawer';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { cn } from '@/lib/utils';

const formatDate = (dateStr: string) => {
  const date = new Date(dateStr);
  const today = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  if (date.toDateString() === today.toDateString()) return 'Today';
  if (date.toDateString() === tomorrow.toDateString()) return 'Tomorrow';
  return format(date, 'EEE, MMM d');
};

type Filter = 'pending' | 'history';
type Confirm = null | 'accept' | 'decline';

export const IncomingSwapsCard = () => {
  const navigate = useNavigate();
  const { requests, incomingForMe, acceptSwap, declineSwap, refetch } = useSwapRequests();
  const [busyId, setBusyId] = useState<string | null>(null);
  const [selected, setSelected] = useState<SwapRequest | null>(null);
  const [drawerBusy, setDrawerBusy] = useState(false);
  const [filter, setFilter] = useState<Filter>('pending');
  const [confirm, setConfirm] = useState<Confirm>(null);

  // History: any non-pending swap that was targeted at me (need profile id; derive from incoming list)
  const myProfileId = incomingForMe[0]?.requested_worker_id ?? null;
  const myIncomingHistory = useMemo(() => {
    if (!myProfileId) {
      // Fallback: show non-pending where I'm the requested worker, regardless of profile id source
      return requests.filter(r => r.status !== 'pending' && r.requested_worker_id && r.requested_worker_id === r.requested_worker?.id);
    }
    return requests.filter(r => r.status !== 'pending' && r.requested_worker_id === myProfileId);
  }, [requests, myProfileId]);

  const visible = filter === 'pending' ? incomingForMe : myIncomingHistory;

  // Race-condition aware action runner
  const runAction = async (
    req: SwapRequest,
    action: 'accept' | 'decline',
  ): Promise<boolean> => {
    const { data: fresh, error } = await supabase
      .from('swap_requests')
      .select('status')
      .eq('id', req.id)
      .maybeSingle();

    if (error || !fresh) {
      toast.error('Could not verify request — try again');
      refetch();
      return false;
    }

    if (fresh.status !== 'pending') {
      toast.error(
        fresh.status === 'approved' ? 'This swap was already approved by someone else' :
        fresh.status === 'declined' ? 'This swap was already declined' :
        'This request is no longer available',
      );
      refetch();
      return false;
    }

    return action === 'accept' ? await acceptSwap(req) : await declineSwap(req.id);
  };

  const handleAccept = async (req: SwapRequest) => {
    setBusyId(req.id);
    await runAction(req, 'accept');
    setBusyId(null);
  };

  const handleDecline = async (req: SwapRequest) => {
    setBusyId(req.id);
    await runAction(req, 'decline');
    setBusyId(null);
  };

  const handleDrawerConfirm = async () => {
    if (!selected || !confirm) return;
    setDrawerBusy(true);
    const ok = await runAction(selected, confirm);
    setDrawerBusy(false);
    if (ok) {
      setConfirm(null);
      setSelected(null);
    } else {
      setConfirm(null);
    }
  };

  const closeDrawer = () => {
    setSelected(null);
    setConfirm(null);
  };

  const FilterPills = (
    <div className="inline-flex items-center gap-1 p-1 rounded-full bg-muted/60 border border-border/40">
      {(['pending', 'history'] as Filter[]).map(f => (
        <button
          key={f}
          onClick={() => setFilter(f)}
          className={cn(
            'px-3 py-1 rounded-full text-[11px] font-semibold transition-all',
            filter === f
              ? 'bg-background text-foreground shadow-elevated'
              : 'text-muted-foreground hover:text-foreground',
          )}
        >
          {f === 'pending' ? `Pending${incomingForMe.length ? ` · ${incomingForMe.length}` : ''}` : 'History'}
        </button>
      ))}
    </div>
  );

  return (
    <>
      <div>
        <div className="flex items-center gap-2 mb-3">
          <div className="w-7 h-7 rounded-lg bg-gradient-accent flex items-center justify-center">
            <ArrowLeftRight className="w-3.5 h-3.5 text-primary" />
          </div>
          <h2 className="text-sm font-semibold text-foreground">Swap Requests</h2>
          <div className="ml-auto">{FilterPills}</div>
        </div>

        {visible.length === 0 ? (
          <MotionCard className="rounded-2xl bg-gradient-surface border border-border/50 shadow-elevated p-6 text-center">
            <div className="w-12 h-12 mx-auto rounded-2xl bg-muted/60 flex items-center justify-center mb-3">
              <Inbox className="w-5 h-5 text-muted-foreground/60" />
            </div>
            <p className="text-sm font-medium text-foreground">
              {filter === 'pending' ? 'No swap requests right now' : 'No past swap activity'}
            </p>
            <p className="text-xs text-muted-foreground mt-1 mb-4">
              {filter === 'pending'
                ? "When a teammate asks you to cover, it'll show up here."
                : 'Resolved swaps you were part of will appear here.'}
            </p>
            <button
              onClick={() => navigate('/worker/shifts')}
              className="text-xs font-semibold text-primary hover:underline"
            >
              View my shifts →
            </button>
          </MotionCard>
        ) : (
          <div className="space-y-2.5">
            {visible.map((req) => (
              <MotionCard
                key={req.id}
                className={cn(
                  'rounded-2xl p-4 bg-gradient-surface border shadow-floating relative overflow-hidden cursor-pointer transition-colors',
                  req.status === 'pending'
                    ? 'border-primary/20 hover:border-primary/40'
                    : 'border-border/40 hover:border-border/70',
                )}
                onClick={() => setSelected(req)}
              >
                {req.status === 'pending' && (
                  <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-transparent pointer-events-none" />
                )}
                <div className="relative">
                  <div className="flex items-start gap-2.5 mb-3">
                    <div className="w-9 h-9 rounded-full bg-gradient-primary flex items-center justify-center shrink-0 shadow-glow">
                      <User className="w-4 h-4 text-primary-foreground" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold text-foreground truncate">
                        {req.requester?.full_name || 'A teammate'}
                      </p>
                      <p className="text-[11px] text-muted-foreground">
                        {req.status === 'pending'
                          ? 'wants to swap their shift with you'
                          : `swap ${req.status}`}
                      </p>
                    </div>
                    <div className="flex flex-col items-end gap-1 shrink-0">
                      <SwapStatusPill status={req.status} />
                      {req.status === 'pending' && <SwapCountdownBadge shift={req.shift} />}
                    </div>
                  </div>

                  {req.shift && (
                    <div className="rounded-xl bg-muted/40 border border-border/40 p-2.5 mb-3">
                      <p className="text-xs font-medium text-foreground mb-1">{req.shift.position}</p>
                      <div className="flex items-center gap-3 text-[11px] text-muted-foreground">
                        <span className="flex items-center gap-1"><Calendar className="w-3 h-3" />{formatDate(req.shift.date)}</span>
                        <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{formatTimeRange(req.shift.start_time, req.shift.end_time)}</span>
                      </div>
                    </div>
                  )}

                  {req.status === 'pending' && (
                    <div className="flex gap-2" onClick={(e) => e.stopPropagation()}>
                      <Button
                        size="sm"
                        variant="outline"
                        className="flex-1 h-9 rounded-xl text-xs shadow-elevated"
                        disabled={busyId === req.id}
                        onClick={() => handleDecline(req)}
                      >
                        {busyId === req.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <><X className="w-3.5 h-3.5 mr-1" />Decline</>}
                      </Button>
                      <Button
                        size="sm"
                        className="flex-1 h-9 rounded-xl text-xs bg-gradient-primary shadow-floating hover:opacity-95"
                        disabled={busyId === req.id}
                        onClick={() => handleAccept(req)}
                      >
                        {busyId === req.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <><Check className="w-3.5 h-3.5 mr-1" />Accept</>}
                      </Button>
                    </div>
                  )}
                </div>
              </MotionCard>
            ))}
          </div>
        )}
      </div>

      {/* Detail Drawer */}
      <Drawer open={!!selected} onOpenChange={(o) => !o && closeDrawer()}>
        <DrawerContent className="bg-gradient-surface">
          <DrawerHeader>
            <DrawerTitle className="flex items-center gap-2">
              <ArrowLeftRight className="w-4 h-4 text-primary" />
              Swap Request
            </DrawerTitle>
            <DrawerDescription>Review the shift before responding</DrawerDescription>
          </DrawerHeader>
          {selected && (
            <div className="px-4 pb-8 space-y-4">
              {/* Requester */}
              <div className="flex items-center gap-3 p-4 rounded-2xl bg-gradient-accent border border-border/40 shadow-elevated">
                <div className="w-12 h-12 rounded-full bg-gradient-primary flex items-center justify-center shadow-glow">
                  <User className="w-5 h-5 text-primary-foreground" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-semibold text-sm">{selected.requester?.full_name}</p>
                  <p className="text-xs text-muted-foreground">{selected.requester?.position || 'Team Member'}</p>
                </div>
                <div className="flex flex-col items-end gap-1 shrink-0">
                  <SwapStatusPill status={selected.status} />
                  {selected.status === 'pending' && <SwapCountdownBadge shift={selected.shift} />}
                </div>
              </div>

              {/* Shift details */}
              {selected.shift && (
                <div className="space-y-2">
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Shift Details</p>
                  <div className="rounded-2xl border border-border/50 bg-card shadow-elevated p-4 space-y-2">
                    <p className="font-semibold text-sm text-foreground">{selected.shift.position}</p>
                    <div className="space-y-1.5 text-sm text-muted-foreground">
                      <p className="flex items-center gap-2"><Calendar className="w-4 h-4 text-primary/70" />{formatDate(selected.shift.date)}</p>
                      <p className="flex items-center gap-2"><Clock className="w-4 h-4 text-primary/70" />{formatTimeRange(selected.shift.start_time, selected.shift.end_time)}</p>
                      <p className="flex items-center gap-2"><MapPin className="w-4 h-4 text-primary/70" />{selected.shift.location}</p>
                    </div>
                  </div>
                </div>
              )}

              {selected.reason && selected.reason !== 'Shift swap request' && (
                <div className="p-3 rounded-xl bg-muted/40 border border-border/40">
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-1">Reason</p>
                  <p className="text-sm">"{selected.reason}"</p>
                </div>
              )}

              {/* Activity timeline */}
              <SwapTimeline
                createdAt={selected.created_at}
                updatedAt={(selected as any).updated_at}
                status={selected.status}
              />

              {selected.status === 'pending' && (
                confirm ? (
                  <div className="rounded-2xl border border-primary/30 bg-primary/5 p-4 space-y-3 shadow-elevated">
                    <div>
                      <p className="text-sm font-semibold text-foreground">
                        {confirm === 'accept' ? 'Accept this swap?' : 'Decline this swap?'}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {confirm === 'accept'
                          ? "You'll be assigned to this shift and the requester will be released."
                          : 'The requester will be notified that you declined.'}
                      </p>
                    </div>
                    <div className="flex gap-3">
                      <Button
                        variant="outline"
                        className="flex-1 h-11 rounded-xl shadow-elevated"
                        onClick={() => setConfirm(null)}
                        disabled={drawerBusy}
                      >
                        Cancel
                      </Button>
                      <Button
                        className={cn(
                          'flex-1 h-11 rounded-xl shadow-floating hover:opacity-95',
                          confirm === 'accept'
                            ? 'bg-gradient-primary text-primary-foreground'
                            : 'bg-destructive text-destructive-foreground hover:bg-destructive/90',
                        )}
                        onClick={handleDrawerConfirm}
                        disabled={drawerBusy}
                      >
                        {drawerBusy
                          ? <Loader2 className="w-4 h-4 animate-spin" />
                          : confirm === 'accept'
                            ? <><Check className="w-4 h-4 mr-2" />Yes, accept</>
                            : <><X className="w-4 h-4 mr-2" />Yes, decline</>}
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="flex gap-3 pt-2">
                    <Button
                      variant="outline"
                      className="flex-1 h-11 rounded-xl shadow-elevated"
                      onClick={() => setConfirm('decline')}
                      disabled={drawerBusy}
                    >
                      <X className="w-4 h-4 mr-2" />Decline
                    </Button>
                    <Button
                      className="flex-1 h-11 rounded-xl bg-gradient-primary shadow-floating hover:opacity-95"
                      onClick={() => setConfirm('accept')}
                      disabled={drawerBusy}
                    >
                      <Check className="w-4 h-4 mr-2" />Accept Swap
                    </Button>
                  </div>
                )
              )}

              {selected.status !== 'pending' && (
                <div className="text-center text-xs text-muted-foreground py-2">
                  This request is no longer pending.
                </div>
              )}
            </div>
          )}
        </DrawerContent>
      </Drawer>
    </>
  );
};
