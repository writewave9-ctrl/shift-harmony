import { useState, useMemo } from 'react';
import { cn } from '@/lib/utils';
import { Shift } from '@/types/align';
import { ChevronLeft, ChevronRight, User } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface WeeklyCalendarProps {
  shifts: Shift[];
  onShiftClick?: (shift: Shift) => void;
  className?: string;
}

export const WeeklyCalendar: React.FC<WeeklyCalendarProps> = ({
  shifts,
  onShiftClick,
  className,
}) => {
  const [weekOffset, setWeekOffset] = useState(0);

  const { weekDays, weekLabel } = useMemo(() => {
    const today = new Date();
    const startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() - today.getDay() + (weekOffset * 7));
    
    const days = [];
    for (let i = 0; i < 7; i++) {
      const day = new Date(startOfWeek);
      day.setDate(startOfWeek.getDate() + i);
      days.push(day);
    }

    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 6);

    const weekLabel = `${startOfWeek.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${endOfWeek.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`;

    return { weekDays: days, weekLabel };
  }, [weekOffset]);

  const getShiftsForDate = (date: Date) => {
    const dateStr = date.toISOString().split('T')[0];
    return shifts.filter(s => s.date === dateStr);
  };

  const isToday = (date: Date) => {
    const today = new Date();
    return date.toDateString() === today.toDateString();
  };

  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  return (
    <div className={cn('card-elevated rounded-xl p-4', className)}>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-foreground">{weekLabel}</h3>
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={() => setWeekOffset(prev => prev - 1)}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="h-8 px-3 text-xs"
            onClick={() => setWeekOffset(0)}
          >
            Today
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={() => setWeekOffset(prev => prev + 1)}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Calendar Grid */}
      <div className="grid grid-cols-7 gap-1">
        {/* Day Headers */}
        {dayNames.map((day, i) => (
          <div
            key={day}
            className="text-center text-xs font-medium text-muted-foreground py-2"
          >
            {day}
          </div>
        ))}

        {/* Day Cells */}
        {weekDays.map((date, i) => {
          const dayShifts = getShiftsForDate(date);
          const hasVacant = dayShifts.some(s => s.isVacant);

          return (
            <div
              key={i}
              className={cn(
                'min-h-[80px] p-1 rounded-lg border border-transparent',
                isToday(date) && 'bg-accent/50 border-primary/30',
                'hover:bg-accent/30 transition-colors'
              )}
            >
              <div className={cn(
                'text-center text-sm mb-1',
                isToday(date) ? 'font-bold text-primary' : 'text-foreground'
              )}>
                {date.getDate()}
              </div>
              <div className="space-y-0.5">
                {dayShifts.slice(0, 3).map(shift => (
                  <button
                    key={shift.id}
                    onClick={() => onShiftClick?.(shift)}
                    className={cn(
                      'w-full text-left px-1 py-0.5 rounded text-[10px] truncate transition-colors',
                      shift.isVacant
                        ? 'bg-warning/20 text-warning-foreground hover:bg-warning/30'
                        : 'bg-primary/10 text-primary hover:bg-primary/20'
                    )}
                  >
                    {shift.startTime.slice(0, 5)}
                  </button>
                ))}
                {dayShifts.length > 3 && (
                  <div className="text-[10px] text-muted-foreground text-center">
                    +{dayShifts.length - 3} more
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Legend */}
      <div className="flex items-center gap-4 mt-4 pt-3 border-t border-border/50 text-xs">
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded bg-primary/20" />
          <span className="text-muted-foreground">Filled</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded bg-warning/20" />
          <span className="text-muted-foreground">Vacant</span>
        </div>
      </div>
    </div>
  );
};
