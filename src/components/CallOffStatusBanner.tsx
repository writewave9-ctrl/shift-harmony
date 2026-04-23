import { useMemo } from 'react';
import { format } from 'date-fns';
import { CheckCircle2, Clock, MegaphoneIcon, AlertOctagon } from 'lucide-react';
import { useCallOffRequests, callOffReasonLabel, type CallOffRequest } from '@/hooks/useCallOffRequests';
import { formatTimeRange } from '@/lib/formatTime';

/**
 * Visible to the worker who submitted call-offs. Each banner auto-disappears
 * once the shift end time has passed (no manual dismiss needed).
 */
export const CallOffStatusBanner = () => {
  const { myCallOffs } = useCallOffRequests();

  // Only surface call-offs whose underlying shift hasn't ended yet.
  const active = useMemo(() => {
    const now = Date.now();
    return (myCallOffs || []).filter((c) => {
      if (!c.shift) return false;
      const end = new Date(`${c.shift.date}T${c.shift.end_time}`).getTime();
      return end > now && c.status !== 'expired';
    }).sort((a, b) => (a.shift!.date + a.shift!.start_time).localeCompare(b.shift!.date + b.shift!.start_time));
  }, [myCallOffs]);

  if (!active.length) return null;

  return (
    <div className="space-y-2">
      {active.map((c) => (
        <BannerRow key={c.id} request={c} />
      ))}
    </div>
  );
};

const BannerRow = ({ request }: { request: CallOffRequest }) => {
  const status = request.status;
  const shift = request.shift!;

  const config = (() => {
    if (status === 'approved') return {
      tone: 'success',
      icon: <MegaphoneIcon className="w-4 h-4" />,
      title: 'Posted as open coverage',
      body: 'Your call-off was approved — your manager has opened this shift to the team.',
    } as const;
    if (status === 'declined') return {
      tone: 'destructive',
      icon: <AlertOctagon className="w-4 h-4" />,
      title: 'Call-off not approved',
      body: 'Please reach out to your manager — you are still on the schedule.',
    } as const;
    return {
      tone: 'warning',
      icon: <Clock className="w-4 h-4" />,
      title: 'Call-off pending',
      body: 'Your manager has been notified and will respond shortly.',
    } as const;
  })();

  const toneClasses =
    config.tone === 'success'
      ? 'bg-success-muted/50 border-success/30 text-foreground'
      : config.tone === 'destructive'
      ? 'bg-destructive-muted/40 border-destructive/30 text-foreground'
      : 'bg-warning/10 border-warning/30 text-foreground';

  const iconClasses =
    config.tone === 'success'
      ? 'bg-success/15 text-success'
      : config.tone === 'destructive'
      ? 'bg-destructive/15 text-destructive'
      : 'bg-warning/15 text-warning';

  return (
    <div className={`rounded-2xl border ${toneClasses} p-3 shadow-elevated`}>
      <div className="flex items-start gap-3">
        <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${iconClasses}`}>
          {config.icon}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="font-semibold text-sm">{config.title}</p>
            {status === 'approved' && (
              <span className="inline-flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full bg-success/15 text-success">
                <CheckCircle2 className="w-2.5 h-2.5" /> Open
              </span>
            )}
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">{config.body}</p>
          <p className="text-[11px] text-muted-foreground mt-1.5">
            {shift.position} · {format(new Date(shift.date), 'EEE, MMM d')} ·{' '}
            {formatTimeRange(shift.start_time, shift.end_time)}
            <span className="opacity-70"> · {callOffReasonLabel(request.reason)}</span>
          </p>
        </div>
      </div>
    </div>
  );
};
