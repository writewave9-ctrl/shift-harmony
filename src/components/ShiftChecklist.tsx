import { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';
import { CheckCircle2, Circle, ListChecks } from 'lucide-react';
import { haptics } from '@/lib/haptics';

interface ChecklistItem {
  id: string;
  label: string;
  hint?: string;
}

interface Props {
  shiftId: string;
  position?: string;
  location?: string | null;
  requiresProximity?: boolean;
  className?: string;
}

const STORAGE_PREFIX = 'align:shift-checklist:';

const buildItems = (p: Pick<Props, 'position' | 'location' | 'requiresProximity'>): ChecklistItem[] => {
  const items: ChecklistItem[] = [
    { id: 'arrived', label: 'I know where to go', hint: p.location ? `Heading to ${p.location}` : 'Confirm the location with your manager if unsure' },
    { id: 'uniform', label: 'Uniform & gear ready', hint: p.position ? `Dressed for ${p.position}` : 'Bring anything required for your role' },
    { id: 'phone', label: 'Phone charged & on me', hint: 'Needed for check-in and shift updates' },
  ];
  if (p.requiresProximity) {
    items.push({ id: 'location', label: 'Location services enabled', hint: 'Check-in uses your location to verify proximity' });
  }
  return items;
};

/**
 * Lightweight pre-shift checklist persisted per-shift in localStorage.
 * No backend writes — these are personal reminders, not a manager-visible record.
 */
export const ShiftChecklist: React.FC<Props> = ({
  shiftId, position, location, requiresProximity, className,
}) => {
  const items = buildItems({ position, location, requiresProximity });
  const storageKey = `${STORAGE_PREFIX}${shiftId}`;
  const [checked, setChecked] = useState<Record<string, boolean>>({});

  useEffect(() => {
    try {
      const raw = localStorage.getItem(storageKey);
      setChecked(raw ? JSON.parse(raw) : {});
    } catch {
      setChecked({});
    }
  }, [storageKey]);

  const toggle = (id: string) => {
    haptics.light();
    setChecked(prev => {
      const next = { ...prev, [id]: !prev[id] };
      try { localStorage.setItem(storageKey, JSON.stringify(next)); } catch { /* noop */ }
      return next;
    });
  };

  const completed = items.filter(i => checked[i.id]).length;
  const allDone = completed === items.length;

  return (
    <section
      className={cn(
        'rounded-2xl bg-card/70 backdrop-blur-sm ring-1 ring-border/50 overflow-hidden',
        className,
      )}
      aria-label="Pre-shift checklist"
    >
      <div className="px-4 pt-3.5 pb-2 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <div className={cn(
            'w-7 h-7 rounded-lg flex items-center justify-center shrink-0 transition-colors',
            allDone ? 'bg-success-muted text-success' : 'bg-primary/10 text-primary',
          )}>
            <ListChecks className="w-3.5 h-3.5" />
          </div>
          <div className="min-w-0">
            <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
              Pre-shift check
            </p>
            <p className="text-[13px] font-semibold text-foreground tracking-tight truncate">
              {allDone ? "You're ready" : `${completed} of ${items.length} ready`}
            </p>
          </div>
        </div>
        <span className={cn(
          'text-[10px] font-semibold px-2 py-0.5 rounded-full ring-1 tabular-nums',
          allDone
            ? 'bg-success-muted text-success ring-success/25'
            : 'bg-muted text-muted-foreground ring-border',
        )}>
          {Math.round((completed / items.length) * 100)}%
        </span>
      </div>

      <ul className="px-2 pb-2.5 space-y-0.5">
        {items.map(item => {
          const isDone = !!checked[item.id];
          return (
            <li key={item.id}>
              <button
                type="button"
                onClick={() => toggle(item.id)}
                aria-pressed={isDone}
                className={cn(
                  'w-full flex items-start gap-2.5 text-left px-2.5 py-2 rounded-xl transition-colors press',
                  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                  isDone ? 'bg-success-muted/40 hover:bg-success-muted/60' : 'hover:bg-muted/60',
                )}
              >
                {isDone ? (
                  <CheckCircle2 className="w-[18px] h-[18px] text-success shrink-0 mt-0.5" />
                ) : (
                  <Circle className="w-[18px] h-[18px] text-muted-foreground/60 shrink-0 mt-0.5" />
                )}
                <div className="min-w-0 flex-1">
                  <p className={cn(
                    'text-[13px] font-medium leading-tight transition-colors',
                    isDone ? 'text-muted-foreground line-through' : 'text-foreground',
                  )}>
                    {item.label}
                  </p>
                  {item.hint && (
                    <p className="text-[11px] text-muted-foreground mt-0.5 leading-snug">
                      {item.hint}
                    </p>
                  )}
                </div>
              </button>
            </li>
          );
        })}
      </ul>
    </section>
  );
};
