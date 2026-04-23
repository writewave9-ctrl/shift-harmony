import { format } from 'date-fns';
import { CheckCircle2, Clock, History, Pencil, Tag } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface ShiftActivityEvent {
  label: string;
  detail?: string;
  reason?: string;
  notes?: string;
  at: string; // ISO timestamp
  tone?: 'primary' | 'success' | 'warning' | 'muted';
  actor?: string | null;
}

interface Props {
  events: ShiftActivityEvent[];
  className?: string;
}

const toneStyles: Record<NonNullable<ShiftActivityEvent['tone']>, string> = {
  primary: 'bg-primary/15 text-primary ring-2 ring-primary/20',
  success: 'bg-success-muted text-success ring-2 ring-success/20',
  warning: 'bg-warning/15 text-warning ring-2 ring-warning/20',
  muted: 'bg-muted text-muted-foreground ring-2 ring-border',
};

/**
 * Vertical timeline for a single shift's lifecycle:
 * created → checked-in → manual override → completed.
 * Used in the manager shift drawer and worker history detail.
 */
export const ShiftActivityTimeline = ({ events, className }: Props) => {
  if (!events.length) return null;

  return (
    <div className={cn('space-y-2', className)}>
      <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
        <History className="w-3 h-3" /> Activity
      </p>
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
                toneStyles[e.tone ?? 'muted'],
              )}
            >
              {e.tone === 'success' ? (
                <CheckCircle2 className="w-3 h-3" />
              ) : e.tone === 'warning' ? (
                <Pencil className="w-3 h-3" />
              ) : (
                <Clock className="w-3 h-3" />
              )}
            </span>
            <div className="min-w-0 flex-1 pb-1">
              <p className="text-xs font-medium text-foreground leading-tight">
                {e.label}
                {e.actor && (
                  <span className="font-normal text-muted-foreground"> · {e.actor}</span>
                )}
              </p>
              <p className="text-[11px] text-muted-foreground mt-0.5">
                {format(new Date(e.at), 'MMM d, h:mm a')}
                {e.detail && <> · {e.detail}</>}
              </p>
              {e.reason && (
                <p className="mt-1 inline-flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded-full bg-accent text-foreground">
                  <Tag className="w-2.5 h-2.5" /> {e.reason}
                </p>
              )}
              {e.notes && (
                <p className="mt-1 text-[11px] text-foreground italic">"{e.notes}"</p>
              )}
            </div>
          </li>
        ))}
      </ol>
    </div>
  );
};

/**
 * Parse override notes saved by AttendanceOverrideModal:
 * format is `[Reason] free-text notes`.
 */
export function parseOverrideNotes(raw: string | null | undefined): {
  reason: string | null;
  notes: string | null;
} {
  if (!raw) return { reason: null, notes: null };
  const m = raw.match(/^\[([^\]]+)\]\s*(.*)$/);
  if (!m) return { reason: null, notes: raw };
  return { reason: m[1], notes: m[2].trim() || null };
}
