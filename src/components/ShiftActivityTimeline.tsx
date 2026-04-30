import { useMemo, useState } from 'react';
import { format } from 'date-fns';
import { CheckCircle2, Clock, History, Pencil, Tag, RefreshCcw, Repeat, UserCog, Filter } from 'lucide-react';
import { cn } from '@/lib/utils';

export type ShiftActivityCategory =
  | 'attendance'
  | 'swap'
  | 'call_off'
  | 'override'
  | 'other';

export interface ShiftActivityEvent {
  label: string;
  detail?: string;
  reason?: string;
  notes?: string;
  at: string; // ISO timestamp
  tone?: 'primary' | 'success' | 'warning' | 'muted';
  actor?: string | null;
  category?: ShiftActivityCategory;
}

interface Props {
  events: ShiftActivityEvent[];
  className?: string;
  /** When true, renders filter chips above the timeline. */
  filterable?: boolean;
}

type FilterKey = 'all' | ShiftActivityCategory;

const FILTER_OPTIONS: { key: FilterKey; label: string; icon: React.ElementType }[] = [
  { key: 'all', label: 'All', icon: Filter },
  { key: 'call_off', label: 'Call-offs', icon: RefreshCcw },
  { key: 'swap', label: 'Swaps', icon: Repeat },
  { key: 'attendance', label: 'Attendance', icon: CheckCircle2 },
  { key: 'override', label: 'Overrides', icon: UserCog },
];

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
export const ShiftActivityTimeline = ({ events, className, filterable = false }: Props) => {
  const [filter, setFilter] = useState<FilterKey>('all');

  const visibleCounts = useMemo(() => {
    const counts: Record<FilterKey, number> = {
      all: events.length, attendance: 0, swap: 0, call_off: 0, override: 0, other: 0,
    };
    events.forEach((e) => {
      const c = e.category ?? 'other';
      counts[c] = (counts[c] ?? 0) + 1;
    });
    return counts;
  }, [events]);

  const filtered = useMemo(() => {
    if (!filterable || filter === 'all') return events;
    return events.filter((e) => (e.category ?? 'other') === filter);
  }, [events, filter, filterable]);

  if (!events.length) return null;

  return (
    <div className={cn('space-y-2', className)}>
      <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
        <History className="w-3 h-3" /> Activity
      </p>

      {filterable && (
        <div
          role="tablist"
          aria-label="Filter activity"
          className="-mx-1 flex flex-wrap gap-1.5 pb-0.5"
        >
          {FILTER_OPTIONS.map(({ key, label, icon: Icon }) => {
            const count = visibleCounts[key] ?? 0;
            const disabled = key !== 'all' && count === 0;
            const active = filter === key;
            return (
              <button
                key={key}
                type="button"
                role="tab"
                aria-selected={active}
                disabled={disabled}
                onClick={() => setFilter(key)}
                className={cn(
                  'inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-medium transition-all press',
                  'ring-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                  active
                    ? 'bg-primary text-primary-foreground ring-primary shadow-sm'
                    : disabled
                      ? 'bg-muted/40 text-muted-foreground/50 ring-border/40 cursor-not-allowed'
                      : 'bg-card text-foreground ring-border hover:bg-accent',
                )}
              >
                <Icon className="w-3 h-3" aria-hidden />
                <span>{label}</span>
                <span className={cn(
                  'tabular-nums text-[10px] font-semibold px-1 rounded',
                  active ? 'text-primary-foreground/80' : 'text-muted-foreground',
                )}>
                  {count}
                </span>
              </button>
            );
          })}
        </div>
      )}

      {filtered.length === 0 ? (
        <p className="text-[11px] text-muted-foreground italic px-1 py-2">
          No matching activity in this category yet.
        </p>
      ) : (
      <ol className="relative space-y-3 pl-1">
        {filtered.map((e, i) => (
          <li key={i} className="relative flex gap-3">
            {i < filtered.length - 1 && (
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
