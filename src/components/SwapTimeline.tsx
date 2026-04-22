import { format, formatDistanceToNow } from 'date-fns';
import { Clock, Check, X, AlertCircle, CircleDot } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Props {
  createdAt: string;
  status: 'pending' | 'approved' | 'declined' | 'expired';
  updatedAt?: string;
  approverName?: string | null;
  className?: string;
}

interface Event {
  label: string;
  detail: string;
  icon: React.ReactNode;
  tone: 'primary' | 'success' | 'destructive' | 'muted';
  time: string;
}

const toneRing: Record<Event['tone'], string> = {
  primary: 'bg-primary/15 text-primary ring-2 ring-primary/20',
  success: 'bg-success-muted text-success ring-2 ring-success/20',
  destructive: 'bg-destructive-muted text-destructive ring-2 ring-destructive/20',
  muted: 'bg-muted text-muted-foreground ring-2 ring-border',
};

export const SwapTimeline = ({ createdAt, status, updatedAt, approverName, className }: Props) => {
  const events: Event[] = [
    {
      label: 'Request created',
      detail: format(new Date(createdAt), "MMM d, h:mm a"),
      time: formatDistanceToNow(new Date(createdAt), { addSuffix: true }),
      icon: <CircleDot className="w-3 h-3" />,
      tone: 'primary',
    },
  ];

  if (status === 'pending') {
    events.push({
      label: 'Awaiting response',
      detail: 'No decision yet',
      time: '',
      icon: <Clock className="w-3 h-3" />,
      tone: 'muted',
    });
  } else if (updatedAt) {
    const dt = new Date(updatedAt);
    events.push({
      label:
        status === 'approved' ? `Approved${approverName ? ` by ${approverName}` : ''}` :
        status === 'declined' ? `Declined${approverName ? ` by ${approverName}` : ''}` :
        'Expired',
      detail: format(dt, "MMM d, h:mm a"),
      time: formatDistanceToNow(dt, { addSuffix: true }),
      icon:
        status === 'approved' ? <Check className="w-3 h-3" /> :
        status === 'declined' ? <X className="w-3 h-3" /> :
        <AlertCircle className="w-3 h-3" />,
      tone:
        status === 'approved' ? 'success' :
        status === 'declined' ? 'destructive' :
        'muted',
    });
  }

  return (
    <div className={cn('space-y-2', className)}>
      <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Activity</p>
      <ol className="relative space-y-3 pl-1">
        {events.map((e, i) => (
          <li key={i} className="relative flex gap-3">
            {i < events.length - 1 && (
              <span
                aria-hidden
                className="absolute left-[11px] top-6 h-[calc(100%+0.25rem)] w-px bg-border"
              />
            )}
            <span
              className={cn(
                'relative z-10 mt-0.5 flex h-[22px] w-[22px] shrink-0 items-center justify-center rounded-full',
                toneRing[e.tone],
              )}
            >
              {e.icon}
            </span>
            <div className="min-w-0 flex-1 pb-1">
              <p className="text-xs font-medium text-foreground leading-tight">{e.label}</p>
              <p className="text-[11px] text-muted-foreground mt-0.5">
                {e.detail}{e.time && <> · <span className="opacity-70">{e.time}</span></>}
              </p>
            </div>
          </li>
        ))}
      </ol>
    </div>
  );
};
