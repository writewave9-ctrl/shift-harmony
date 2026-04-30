import { cn } from '@/lib/utils';
import { DatabaseShift } from '@/hooks/useShifts';
import { Briefcase, Clock, MapPin, AlertTriangle, UserPlus, MessageSquare, PlusCircle } from 'lucide-react';
import { formatTimeRange } from '@/lib/formatTime';

interface PositionGapAction {
  position: string;
  vacantShiftIds: string[];
  vacantCount: number;
  vacantHours: number;
}

interface Props {
  shifts: DatabaseShift[];
  className?: string;
  /** Open the assign-replacement flow for a vacant role. */
  onAssignReplacement?: (gap: PositionGapAction) => void;
  /** Open a contextual message thread to workers in this role. */
  onMessageWorkers?: (gap: PositionGapAction) => void;
  /** Create a new open shift for this role. */
  onCreateOpenShift?: (gap: PositionGapAction) => void;
}

interface PositionGap {
  position: string;
  vacantCount: number;
  vacantHours: number;
  vacantShiftIds: string[];
  locations: Set<string>;
  earliest: { start: string; end: string } | null;
}

function hoursBetween(start: string, end: string): number {
  const [sh, sm] = start.split(':').map(Number);
  const [eh, em] = end.split(':').map(Number);
  let mins = (eh * 60 + em) - (sh * 60 + sm);
  if (mins < 0) mins += 24 * 60;
  return mins / 60;
}

/**
 * Detailed staffing breakdown — explains *which* roles are short,
 * how many hours of coverage are missing, and where the gaps are.
 */
export const StaffingBreakdown: React.FC<Props> = ({
  shifts,
  className,
  onAssignReplacement,
  onMessageWorkers,
  onCreateOpenShift,
}) => {
  const vacant = shifts.filter(s => s.is_vacant);
  if (vacant.length === 0) return null;

  const byPosition = new Map<string, PositionGap>();
  vacant.forEach(s => {
    const key = s.position || 'Unassigned role';
    const existing: PositionGap = byPosition.get(key) ?? {
      position: key,
      vacantCount: 0,
      vacantHours: 0,
      vacantShiftIds: [],
      locations: new Set<string>(),
      earliest: null,
    };
    existing.vacantCount += 1;
    existing.vacantHours += hoursBetween(s.start_time, s.end_time);
    existing.vacantShiftIds.push(s.id);
    if (s.location) existing.locations.add(s.location);
    if (!existing.earliest || s.start_time < existing.earliest.start) {
      existing.earliest = { start: s.start_time, end: s.end_time };
    }
    byPosition.set(key, existing);
  });

  const gaps = Array.from(byPosition.values()).sort((a, b) => b.vacantHours - a.vacantHours);
  const totalHours = gaps.reduce((sum, g) => sum + g.vacantHours, 0);
  const hasAnyAction = !!(onAssignReplacement || onMessageWorkers || onCreateOpenShift);

  return (
    <section
      className={cn(
        'rounded-2xl bg-card shadow-card-premium ring-1 ring-warning/20 overflow-hidden',
        className,
      )}
      aria-label="Coverage gap breakdown"
    >
      <div className="px-5 pt-5 pb-3 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-8 h-8 rounded-xl bg-warning-muted flex items-center justify-center shrink-0">
            <AlertTriangle className="w-3.5 h-3.5 text-warning" />
          </div>
          <div className="min-w-0">
            <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
              Coverage gaps
            </p>
            <h2 className="font-display text-base font-semibold text-foreground tracking-tight leading-tight mt-0.5">
              {totalHours.toFixed(totalHours % 1 === 0 ? 0 : 1)} hrs short across {gaps.length} {gaps.length === 1 ? 'role' : 'roles'}
            </h2>
          </div>
        </div>
      </div>

      <ul className="px-5 pb-5 space-y-2">
        {gaps.map((g) => {
          const locations = Array.from(g.locations);
          const locationLabel = locations.length === 0
            ? null
            : locations.length === 1
              ? locations[0]
              : `${locations.length} locations`;
          const action: PositionGapAction = {
            position: g.position,
            vacantShiftIds: g.vacantShiftIds,
            vacantCount: g.vacantCount,
            vacantHours: g.vacantHours,
          };
          return (
            <li
              key={g.position}
              className="rounded-xl bg-warning-muted/40 ring-1 ring-warning/15 px-3.5 py-3"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-foreground flex items-center gap-1.5 truncate">
                    <Briefcase className="w-3.5 h-3.5 text-warning shrink-0" aria-hidden />
                    <span className="truncate">{g.position}</span>
                  </p>
                  <div className="mt-1 flex flex-wrap items-center gap-x-2.5 gap-y-1 text-[11px] text-muted-foreground">
                    <span className="inline-flex items-center gap-1">
                      <Clock className="w-3 h-3" aria-hidden />
                      {g.vacantHours.toFixed(g.vacantHours % 1 === 0 ? 0 : 1)} hrs
                      {g.earliest && (
                        <span className="text-muted-foreground/70">
                          {' '}· starting {formatTimeRange(g.earliest.start, g.earliest.end).split(' – ')[0]}
                        </span>
                      )}
                    </span>
                    {locationLabel && (
                      <span className="inline-flex items-center gap-1">
                        <MapPin className="w-3 h-3" aria-hidden />
                        {locationLabel}
                      </span>
                    )}
                  </div>
                </div>
                <span className="px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-warning bg-card rounded-full ring-1 ring-warning/30 shrink-0">
                  {g.vacantCount} {g.vacantCount === 1 ? 'shift' : 'shifts'}
                </span>
              </div>

              {hasAnyAction && (
                <div className="mt-2.5 flex flex-wrap gap-1.5">
                  {onAssignReplacement && (
                    <button
                      type="button"
                      onClick={() => onAssignReplacement(action)}
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-semibold bg-card text-foreground ring-1 ring-border hover:bg-accent press focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    >
                      <UserPlus className="w-3 h-3 text-primary" />
                      Assign replacement
                    </button>
                  )}
                  {onMessageWorkers && (
                    <button
                      type="button"
                      onClick={() => onMessageWorkers(action)}
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-semibold bg-card text-foreground ring-1 ring-border hover:bg-accent press focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    >
                      <MessageSquare className="w-3 h-3 text-primary" />
                      Message workers
                    </button>
                  )}
                  {onCreateOpenShift && (
                    <button
                      type="button"
                      onClick={() => onCreateOpenShift(action)}
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-semibold bg-warning text-warning-foreground hover:opacity-95 press focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    >
                      <PlusCircle className="w-3 h-3" />
                      Open shift
                    </button>
                  )}
                </div>
              )}
            </li>
          );
        })}
      </ul>
    </section>
  );
};
