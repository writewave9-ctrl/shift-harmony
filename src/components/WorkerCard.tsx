import { cn } from '@/lib/utils';
import { Worker } from '@/types/align';
import { User, Clock, TrendingUp, Star } from 'lucide-react';

interface WorkerCardProps {
  worker: Worker;
  onClick?: () => void;
  showReliability?: boolean;
  showHours?: boolean;
  compact?: boolean;
  selected?: boolean;
  className?: string;
}

export const WorkerCard: React.FC<WorkerCardProps> = ({
  worker,
  onClick,
  showReliability = false,
  showHours = true,
  compact = false,
  selected = false,
  className,
}) => {
  const hoursRemaining = worker.weeklyHoursTarget - worker.weeklyHoursWorked;
  const canTakeMore = hoursRemaining > 0;

  const willingnessColors = {
    high: 'bg-success-muted text-success',
    medium: 'bg-warning-muted text-warning-foreground',
    low: 'bg-muted text-muted-foreground',
  };

  if (compact) {
    return (
      <div
        onClick={onClick}
        className={cn(
          'flex items-center justify-between p-3 rounded-lg border bg-card',
          onClick && 'cursor-pointer hover:bg-accent/50 transition-colors',
          selected ? 'border-primary bg-accent' : 'border-border/50',
          className
        )}
      >
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center">
            <User className="w-4 h-4 text-primary" />
          </div>
          <div>
            <p className="font-medium text-sm">{worker.name}</p>
            <p className="text-xs text-muted-foreground">{worker.position}</p>
          </div>
        </div>
        {showHours && canTakeMore && (
          <span className="text-xs font-medium text-success">
            +{hoursRemaining}h available
          </span>
        )}
      </div>
    );
  }

  return (
    <div
      onClick={onClick}
      className={cn(
        'card-interactive rounded-xl p-4',
        onClick && 'cursor-pointer',
        selected && 'ring-2 ring-primary',
        className
      )}
    >
      <div className="flex items-start gap-3">
        <div className="w-11 h-11 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
          <User className="w-5 h-5 text-primary" />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-foreground truncate">{worker.name}</h3>
          <p className="text-sm text-muted-foreground">{worker.position}</p>
        </div>
      </div>

      <div className="mt-4 space-y-2">
        {showHours && (
          <div className="flex items-center justify-between text-sm">
            <span className="flex items-center gap-1.5 text-muted-foreground">
              <Clock className="w-4 h-4" />
              Weekly Hours
            </span>
            <span className="font-medium">
              {worker.weeklyHoursWorked}/{worker.weeklyHoursTarget}h
            </span>
          </div>
        )}

        <div className="flex items-center justify-between text-sm">
          <span className="flex items-center gap-1.5 text-muted-foreground">
            <TrendingUp className="w-4 h-4" />
            Extra Shifts
          </span>
          <span className={cn(
            'px-2 py-0.5 rounded-full text-xs font-medium capitalize',
            willingnessColors[worker.willingnessForExtra]
          )}>
            {worker.willingnessForExtra}
          </span>
        </div>

        {showReliability && (
          <div className="flex items-center justify-between text-sm">
            <span className="flex items-center gap-1.5 text-muted-foreground">
              <Star className="w-4 h-4" />
              Reliability
            </span>
            <div className="flex items-center gap-1">
              <div className="w-16 h-1.5 bg-muted rounded-full overflow-hidden">
                <div 
                  className="h-full bg-primary rounded-full transition-all"
                  style={{ width: `${worker.reliabilityScore}%` }}
                />
              </div>
              <span className="text-xs font-medium">{worker.reliabilityScore}%</span>
            </div>
          </div>
        )}
      </div>

      {canTakeMore && (
        <div className="mt-3 pt-3 border-t border-border/50">
          <p className="text-xs text-success font-medium">
            Can take {hoursRemaining} more hours this week
          </p>
        </div>
      )}
    </div>
  );
};
