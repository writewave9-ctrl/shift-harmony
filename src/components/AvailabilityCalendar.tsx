import { useMemo } from 'react';
import { cn } from '@/lib/utils';
import { formatTime } from '@/lib/formatTime';

interface AvailabilityBlock {
  id: string;
  type: 'recurring' | 'specific';
  dayOfWeek?: number;
  specificDate?: string;
  startTime: string;
  endTime: string;
  notes?: string;
}

interface AvailabilityCalendarProps {
  blocks: AvailabilityBlock[];
  className?: string;
}

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const HOURS = Array.from({ length: 13 }, (_, i) => i + 6); // 6 AM to 6 PM

export const AvailabilityCalendar = ({ blocks, className }: AvailabilityCalendarProps) => {
  const recurringByDay = useMemo(() => {
    const map: Record<number, AvailabilityBlock[]> = {};
    for (let i = 0; i < 7; i++) map[i] = [];
    blocks
      .filter(b => b.type === 'recurring' && b.dayOfWeek !== undefined)
      .forEach(b => map[b.dayOfWeek!].push(b));
    return map;
  }, [blocks]);

  const getBlockStyle = (block: AvailabilityBlock) => {
    const [sH, sM] = block.startTime.split(':').map(Number);
    const [eH, eM] = block.endTime.split(':').map(Number);
    const startMin = (sH - 6) * 60 + sM;
    const endMin = (eH - 6) * 60 + eM;
    const totalMin = 12 * 60; // 6 AM to 6 PM
    const top = Math.max(0, (startMin / totalMin) * 100);
    const height = Math.max(4, ((endMin - startMin) / totalMin) * 100);
    return { top: `${top}%`, height: `${height}%` };
  };

  return (
    <div className={cn('rounded-xl border border-border bg-card overflow-hidden', className)}>
      {/* Header */}
      <div className="grid grid-cols-[40px_repeat(7,1fr)] border-b border-border/50">
        <div className="p-2" />
        {DAYS.map((day, i) => {
          const hasBlocks = recurringByDay[i].length > 0;
          return (
            <div
              key={day}
              className={cn(
                'p-2 text-center text-xs font-medium border-l border-border/30',
                hasBlocks ? 'text-destructive' : 'text-muted-foreground'
              )}
            >
              {day}
              {hasBlocks && (
                <div className="w-1.5 h-1.5 rounded-full bg-destructive/60 mx-auto mt-0.5" />
              )}
            </div>
          );
        })}
      </div>

      {/* Body */}
      <div className="grid grid-cols-[40px_repeat(7,1fr)] relative" style={{ height: 300 }}>
        {/* Time labels */}
        <div className="relative">
          {HOURS.map(h => {
            const top = ((h - 6) / 12) * 100;
            return (
              <div
                key={h}
                className="absolute left-0 right-0 text-[10px] text-muted-foreground text-right pr-1.5 -translate-y-1/2"
                style={{ top: `${top}%` }}
              >
                {h <= 12 ? h : h - 12}{h < 12 ? 'a' : 'p'}
              </div>
            );
          })}
        </div>

        {/* Day columns */}
        {DAYS.map((_, dayIndex) => (
          <div key={dayIndex} className="relative border-l border-border/20">
            {/* Hour grid lines */}
            {HOURS.map(h => (
              <div
                key={h}
                className="absolute left-0 right-0 border-t border-border/10"
                style={{ top: `${((h - 6) / 12) * 100}%` }}
              />
            ))}

            {/* Blocked time blocks */}
            {recurringByDay[dayIndex].map(block => (
              <div
                key={block.id}
                className="absolute left-0.5 right-0.5 rounded-sm bg-destructive/15 border border-destructive/25 px-0.5 overflow-hidden cursor-default group"
                style={getBlockStyle(block)}
                title={`Blocked: ${formatTime(block.startTime)} – ${formatTime(block.endTime)}${block.notes ? ` (${block.notes})` : ''}`}
              >
                <span className="text-[8px] leading-tight font-medium text-destructive block truncate">
                  {formatTime(block.startTime)}
                </span>
              </div>
            ))}

            {/* Available indicator if no blocks */}
            {recurringByDay[dayIndex].length === 0 && (
              <div className="absolute inset-0 bg-success/[0.03]" />
            )}
          </div>
        ))}
      </div>

      {/* Legend */}
      <div className="flex items-center gap-4 px-3 py-2 border-t border-border/50 bg-muted/30">
        <div className="flex items-center gap-1.5">
          <div className="w-2.5 h-2.5 rounded-sm bg-success/20 border border-success/30" />
          <span className="text-[10px] text-muted-foreground">Available</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-2.5 h-2.5 rounded-sm bg-destructive/15 border border-destructive/25" />
          <span className="text-[10px] text-muted-foreground">Blocked</span>
        </div>
      </div>
    </div>
  );
};
