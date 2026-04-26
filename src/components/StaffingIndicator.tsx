import { cn } from '@/lib/utils';
import { StaffingHealth } from '@/types/align';
import { Users, AlertTriangle, CheckCircle2, AlertCircle } from 'lucide-react';

interface StaffingIndicatorProps {
  health: StaffingHealth;
  className?: string;
  compact?: boolean;
}

const healthConfig: Record<StaffingHealth['status'], {
  label: string;
  description: (h: StaffingHealth) => string;
  ringClass: string;
  iconWrapClass: string;
  iconColor: string;
  textClass: string;
  trackClass: string;
  progressClass: string;
  icon: React.ElementType;
}> = {
  fully_staffed: {
    label: 'Fully Staffed',
    description: () => 'Every shift today has someone assigned.',
    ringClass: 'ring-1 ring-success/25',
    iconWrapClass: 'bg-success-muted',
    iconColor: 'text-success',
    textClass: 'text-success',
    trackClass: 'bg-success-muted',
    progressClass: 'bg-success',
    icon: CheckCircle2,
  },
  near_capacity: {
    label: 'Near Capacity',
    description: (h) => `${h.shortBy} shift${h.shortBy === 1 ? '' : 's'} still open.`,
    ringClass: 'ring-1 ring-warning/30',
    iconWrapClass: 'bg-warning-muted',
    iconColor: 'text-warning',
    textClass: 'text-warning',
    trackClass: 'bg-warning-muted',
    progressClass: 'bg-warning',
    icon: AlertCircle,
  },
  understaffed: {
    label: 'Understaffed',
    description: (h) => `${h.shortBy} shift${h.shortBy === 1 ? '' : 's'} need coverage soon.`,
    ringClass: 'ring-1 ring-warning/40',
    iconWrapClass: 'bg-warning-muted',
    iconColor: 'text-warning',
    textClass: 'text-warning',
    trackClass: 'bg-warning-muted',
    progressClass: 'bg-warning',
    icon: AlertTriangle,
  },
  critical: {
    label: 'Critical',
    description: (h) => `${h.shortBy} vacant shifts — immediate action recommended.`,
    ringClass: 'ring-1 ring-destructive/40',
    iconWrapClass: 'bg-destructive-muted',
    iconColor: 'text-destructive',
    textClass: 'text-destructive',
    trackClass: 'bg-destructive-muted',
    progressClass: 'bg-destructive',
    icon: AlertTriangle,
  },
};

export const StaffingIndicator: React.FC<StaffingIndicatorProps> = ({
  health,
  className,
  compact = false,
}) => {
  const config = healthConfig[health.status];
  const Icon = config.icon;
  const filledPct = health.totalShifts === 0
    ? 100
    : Math.round((health.filledShifts / health.totalShifts) * 100);

  if (compact) {
    return (
      <div className={cn('flex items-center gap-2', className)}>
        <span className={cn('flex items-center gap-1.5', config.textClass)}>
          <Icon className="w-4 h-4" aria-hidden />
          <span className="text-sm font-medium">
            {health.shortBy > 0 ? `${health.shortBy} short` : config.label}
          </span>
        </span>
      </div>
    );
  }

  return (
    <section
      className={cn(
        'relative rounded-2xl bg-gradient-card-premium shadow-card-premium overflow-hidden',
        config.ringClass,
        className,
      )}
      aria-label={`Staffing health: ${config.label}`}
    >
      <div className="p-5">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-3 min-w-0">
            <div
              className={cn(
                'w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 shadow-inset-hairline',
                config.iconWrapClass,
              )}
              aria-hidden
            >
              <Icon className={cn('w-5 h-5', config.iconColor)} strokeWidth={2.2} />
            </div>
            <div className="min-w-0 pt-0.5">
              <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                Today's coverage
              </p>
              <h3 className="font-display text-[22px] font-semibold text-foreground tracking-tight leading-tight mt-0.5">
                {config.label}
              </h3>
              <p className="text-xs text-muted-foreground mt-1">
                {config.description(health)}
              </p>
            </div>
          </div>
          <div className="text-right shrink-0">
            <p className={cn('font-display text-3xl font-semibold leading-none', config.textClass)}>
              {health.filledShifts}
              <span className="text-muted-foreground/70 text-base font-medium">/{health.totalShifts}</span>
            </p>
            <p className="text-[10px] text-muted-foreground mt-1 uppercase tracking-wider">filled</p>
          </div>
        </div>

        {/* Progress track */}
        <div className="mt-4">
          <div
            className={cn('h-1.5 rounded-full overflow-hidden', config.trackClass)}
            role="progressbar"
            aria-valuenow={filledPct}
            aria-valuemin={0}
            aria-valuemax={100}
          >
            <div
              className={cn('h-full rounded-full transition-all duration-500', config.progressClass)}
              style={{ width: `${filledPct}%` }}
            />
          </div>
          <div className="flex items-center justify-between mt-2 text-[11px] text-muted-foreground">
            <span className="flex items-center gap-1">
              <Users className="w-3 h-3" aria-hidden />
              {filledPct}% covered
            </span>
            {health.shortBy > 0 && (
              <span className={cn('font-semibold', config.textClass)}>
                {health.shortBy} open
              </span>
            )}
          </div>
        </div>
      </div>
    </section>
  );
};
