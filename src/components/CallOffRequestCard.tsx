import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Calendar, Clock, User, AlertOctagon, Check, X, Loader2 } from 'lucide-react';
import { format } from 'date-fns';
import { formatTimeRange } from '@/lib/formatTime';
import { cn } from '@/lib/utils';
import { useState } from 'react';
import type { CallOffRequest } from '@/hooks/useCallOffRequests';
import { callOffReasonLabel } from '@/hooks/useCallOffRequests';
import { SwapStatusPill } from '@/components/SwapStatusPill';

interface Props {
  request: CallOffRequest;
  onApprove: (req: CallOffRequest) => Promise<boolean>;
  onDecline: (id: string) => Promise<boolean>;
}

const formatDate = (dateStr: string) => {
  const date = new Date(dateStr);
  const today = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  if (date.toDateString() === today.toDateString()) return 'Today';
  if (date.toDateString() === tomorrow.toDateString()) return 'Tomorrow';
  return format(date, 'EEE, MMM d');
};

export const CallOffRequestCard = ({ request, onApprove, onDecline }: Props) => {
  const [busy, setBusy] = useState<'approve' | 'decline' | null>(null);

  const handle = async (kind: 'approve' | 'decline') => {
    setBusy(kind);
    if (kind === 'approve') await onApprove(request); else await onDecline(request.id);
    setBusy(null);
  };

  const pending = request.status === 'pending';

  return (
    <Card
      className={cn(
        'rounded-2xl transition-colors',
        pending
          ? 'shadow-floating border-warning/30 bg-gradient-surface'
          : 'shadow-elevated border-border/40',
      )}
    >
      <CardContent className="pt-4">
        <div className="flex items-start gap-3">
          <div className={cn(
            'w-10 h-10 rounded-full flex items-center justify-center shrink-0',
            pending ? 'bg-warning/15' : 'bg-accent',
          )}>
            <AlertOctagon className={cn('w-5 h-5', pending ? 'text-warning' : 'text-muted-foreground')} />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-0.5">
              <User className="w-3.5 h-3.5 text-muted-foreground" />
              <p className="font-medium text-sm truncate">{request.worker?.full_name || 'Worker'}</p>
            </div>
            <p className="text-xs text-muted-foreground">
              Calling off — {callOffReasonLabel(request.reason)}
            </p>
            <div className="mt-2 flex flex-wrap gap-2 text-xs">
              <span className="flex items-center gap-1 text-muted-foreground">
                <Calendar className="w-3 h-3" />{request.shift && formatDate(request.shift.date)}
              </span>
              <span className="flex items-center gap-1 text-muted-foreground">
                <Clock className="w-3 h-3" />
                {request.shift ? formatTimeRange(request.shift.start_time, request.shift.end_time) : ''}
              </span>
              <span className="text-muted-foreground">{request.shift?.position}</span>
            </div>
            {request.custom_reason && (
              <p className="mt-2 text-xs text-muted-foreground italic">"{request.custom_reason}"</p>
            )}
          </div>
          <SwapStatusPill status={request.status as any} />
        </div>

        {pending && (
          <div className="flex gap-2 mt-3 pt-3 border-t border-border/40">
            <Button
              variant="outline" size="sm"
              className="flex-1 rounded-xl"
              disabled={!!busy}
              onClick={() => handle('decline')}
            >
              {busy === 'decline' ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <><X className="w-3.5 h-3.5 mr-1" />Decline</>}
            </Button>
            <Button
              size="sm"
              className="flex-1 rounded-xl bg-gradient-primary shadow-floating"
              disabled={!!busy}
              onClick={() => handle('approve')}
            >
              {busy === 'approve' ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <><Check className="w-3.5 h-3.5 mr-1" />Approve & post open</>}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
