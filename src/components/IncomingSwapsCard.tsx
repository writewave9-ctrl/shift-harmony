import { useState } from 'react';
import { ArrowLeftRight, Calendar, Clock, Check, X, Loader2, User } from 'lucide-react';
import { useSwapRequests, type SwapRequest } from '@/hooks/useSwapRequests';
import { Button } from '@/components/ui/button';
import { formatTimeRange } from '@/lib/formatTime';
import { format } from 'date-fns';
import { MotionCard } from '@/components/MotionWrapper';

const formatDate = (dateStr: string) => {
  const date = new Date(dateStr);
  const today = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  if (date.toDateString() === today.toDateString()) return 'Today';
  if (date.toDateString() === tomorrow.toDateString()) return 'Tomorrow';
  return format(date, 'EEE, MMM d');
};

export const IncomingSwapsCard = () => {
  const { incomingForMe, acceptSwap, declineSwap } = useSwapRequests();
  const [busyId, setBusyId] = useState<string | null>(null);

  if (incomingForMe.length === 0) return null;

  const handleAccept = async (req: SwapRequest) => {
    setBusyId(req.id);
    await acceptSwap(req);
    setBusyId(null);
  };

  const handleDecline = async (req: SwapRequest) => {
    setBusyId(req.id);
    await declineSwap(req.id);
    setBusyId(null);
  };

  return (
    <div>
      <div className="flex items-center gap-2 mb-3">
        <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center">
          <ArrowLeftRight className="w-3.5 h-3.5 text-primary" />
        </div>
        <h2 className="text-sm font-semibold text-foreground">Swap Requests</h2>
        <span className="text-[10px] font-semibold text-primary bg-primary/10 px-2 py-0.5 rounded-full">
          {incomingForMe.length}
        </span>
      </div>
      <div className="space-y-2.5">
        {incomingForMe.map((req) => (
          <MotionCard
            key={req.id}
            className="rounded-xl p-4 bg-card border border-primary/20 shadow-elevated relative overflow-hidden"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-transparent pointer-events-none" />
            <div className="relative">
              <div className="flex items-center gap-2.5 mb-3">
                <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                  <User className="w-4 h-4 text-primary" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-foreground truncate">
                    {req.requester?.full_name || 'A teammate'}
                  </p>
                  <p className="text-[11px] text-muted-foreground">wants to swap their shift with you</p>
                </div>
              </div>

              {req.shift && (
                <div className="rounded-lg bg-muted/50 border border-border/40 p-2.5 mb-3">
                  <p className="text-xs font-medium text-foreground mb-1">{req.shift.position}</p>
                  <div className="flex items-center gap-3 text-[11px] text-muted-foreground">
                    <span className="flex items-center gap-1"><Calendar className="w-3 h-3" />{formatDate(req.shift.date)}</span>
                    <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{formatTimeRange(req.shift.start_time, req.shift.end_time)}</span>
                  </div>
                </div>
              )}

              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  className="flex-1 h-9 rounded-lg text-xs"
                  disabled={busyId === req.id}
                  onClick={() => handleDecline(req)}
                >
                  {busyId === req.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <><X className="w-3.5 h-3.5 mr-1" />Decline</>}
                </Button>
                <Button
                  size="sm"
                  className="flex-1 h-9 rounded-lg text-xs"
                  disabled={busyId === req.id}
                  onClick={() => handleAccept(req)}
                >
                  {busyId === req.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <><Check className="w-3.5 h-3.5 mr-1" />Accept</>}
                </Button>
              </div>
            </div>
          </MotionCard>
        ))}
      </div>
    </div>
  );
};
