import { cn } from '@/lib/utils';
import { Shift, AttendanceRecord } from '@/types/align';
import { StatusBadge } from './StatusBadge';
import { Clock, MapPin, User, ChevronRight } from 'lucide-react';

interface ShiftCardProps {
  shift: Shift;
  attendance?: AttendanceRecord;
  onClick?: () => void;
  showWorker?: boolean;
  compact?: boolean;
  className?: string;
}

export const ShiftCard: React.FC<ShiftCardProps> = ({
  shift,
  attendance,
  onClick,
  showWorker = false,
  compact = false,
  className,
}) => {
  const isVacant = shift.isVacant;
  const timeRange = `${shift.startTime} - ${shift.endTime}`;

  if (compact) {
    return (
      <div
        onClick={onClick}
        className={cn(
          'flex items-center justify-between p-3 rounded-lg border border-border/50 bg-card',
          onClick && 'cursor-pointer hover:bg-accent/50 transition-colors',
          isVacant && 'border-warning/30 bg-warning-muted/30',
          className
        )}
      >
        <div className="flex items-center gap-3">
          <div className={cn(
            'w-1 h-10 rounded-full',
            isVacant ? 'bg-warning' : 'bg-primary'
          )} />
          <div>
            <p className="font-medium text-sm">{shift.position}</p>
            <p className="text-xs text-muted-foreground">{timeRange}</p>
          </div>
        </div>
        {attendance && <StatusBadge status={attendance.status} showIcon={false} />}
        {isVacant && (
          <span className="text-xs font-medium text-warning px-2 py-1 rounded-md bg-warning/10">
            Vacant
          </span>
        )}
        {onClick && <ChevronRight className="w-4 h-4 text-muted-foreground" />}
      </div>
    );
  }

  return (
    <div
      onClick={onClick}
      className={cn(
        'card-interactive rounded-xl p-4',
        onClick && 'cursor-pointer',
        isVacant && 'border-warning/40 bg-warning-muted/20',
        className
      )}
    >
      <div className="flex items-start justify-between mb-3">
        <div>
          <h3 className="font-semibold text-foreground">{shift.position}</h3>
          {showWorker && shift.assignedWorker && (
            <p className="text-sm text-muted-foreground flex items-center gap-1 mt-0.5">
              <User className="w-3 h-3" />
              {shift.assignedWorker.name}
            </p>
          )}
        </div>
        {attendance && <StatusBadge status={attendance.status} />}
        {isVacant && (
          <span className="px-2.5 py-1 text-xs font-medium text-warning bg-warning/10 rounded-full border border-warning/20">
            Needs Coverage
          </span>
        )}
      </div>

      <div className="flex items-center gap-4 text-sm text-muted-foreground">
        <span className="flex items-center gap-1.5">
          <Clock className="w-4 h-4" />
          {timeRange}
        </span>
        <span className="flex items-center gap-1.5">
          <MapPin className="w-4 h-4" />
          {shift.location}
        </span>
      </div>

      {onClick && (
        <div className="mt-3 pt-3 border-t border-border/50 flex justify-end">
          <span className="text-xs text-primary font-medium flex items-center gap-1">
            View Details
            <ChevronRight className="w-3 h-3" />
          </span>
        </div>
      )}
    </div>
  );
};
