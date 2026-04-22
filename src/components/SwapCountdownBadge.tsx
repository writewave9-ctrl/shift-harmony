import { Clock, AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { getSwapCountdown, type ShiftLite } from '@/lib/swapTime';

interface Props {
  shift?: ShiftLite | null;
  className?: string;
}

const toneClasses: Record<string, string> = {
  urgent:   'bg-destructive-muted text-destructive border border-destructive/30',
  soon:     'bg-warning-muted text-warning-foreground border border-warning/30',
  normal:   'bg-primary/10 text-primary border border-primary/20',
  overdue:  'bg-muted text-muted-foreground border border-border',
};

export const SwapCountdownBadge = ({ shift, className }: Props) => {
  const info = getSwapCountdown(shift);
  if (!info) return null;
  const Icon = info.tone === 'overdue' ? AlertTriangle : Clock;
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold whitespace-nowrap',
        toneClasses[info.tone],
        className,
      )}
      title="Time remaining until the shift starts"
    >
      <Icon className="w-3 h-3" />
      {info.label}
    </span>
  );
};
