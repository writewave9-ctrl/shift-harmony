import { cn } from '@/lib/utils';
import { StaffingHealth } from '@/types/align';
import { Users, AlertTriangle, CheckCircle, AlertCircle } from 'lucide-react';

interface StaffingIndicatorProps {
  health: StaffingHealth;
  className?: string;
  compact?: boolean;
}

const healthConfig: Record<StaffingHealth['status'], {
  label: string;
  bgClass: string;
  textClass: string;
  icon: React.ReactNode;
}> = {
  fully_staffed: {
    label: 'Fully Staffed',
    bgClass: 'bg-success-muted',
    textClass: 'text-success',
    icon: <CheckCircle className="w-4 h-4" />,
  },
  near_capacity: {
    label: 'Near Capacity',
    bgClass: 'bg-warning-muted',
    textClass: 'text-warning-foreground',
    icon: <AlertCircle className="w-4 h-4" />,
  },
  understaffed: {
    label: 'Understaffed',
    bgClass: 'bg-warning-muted',
    textClass: 'text-warning-foreground',
    icon: <AlertTriangle className="w-4 h-4" />,
  },
  critical: {
    label: 'Critical',
    bgClass: 'bg-destructive-muted',
    textClass: 'text-destructive',
    icon: <AlertTriangle className="w-4 h-4" />,
  },
};

export const StaffingIndicator: React.FC<StaffingIndicatorProps> = ({
  health,
  className,
  compact = false,
}) => {
  const config = healthConfig[health.status];

  if (compact) {
    return (
      <div className={cn('flex items-center gap-2', className)}>
        <span className={cn('flex items-center gap-1.5', config.textClass)}>
          {config.icon}
          <span className="text-sm font-medium">
            {health.shortBy > 0 ? `${health.shortBy} short` : config.label}
          </span>
        </span>
      </div>
    );
  }

  return (
    <div className={cn('rounded-xl p-4', config.bgClass, className)}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className={cn('p-2 rounded-lg bg-background/60', config.textClass)}>
            <Users className="w-5 h-5" />
          </div>
          <div>
            <p className="text-sm font-medium text-foreground">{config.label}</p>
            <p className="text-xs text-muted-foreground">
              {health.filledShifts}/{health.totalShifts} shifts filled
            </p>
          </div>
        </div>
        {health.shortBy > 0 && (
          <div className={cn('text-right', config.textClass)}>
            <p className="text-2xl font-semibold">{health.shortBy}</p>
            <p className="text-xs">short</p>
          </div>
        )}
      </div>
    </div>
  );
};
