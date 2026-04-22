import { cn } from '@/lib/utils';
import { Clock, Check, X, AlertCircle } from 'lucide-react';

type SwapStatus = 'pending' | 'approved' | 'declined' | 'expired';

const config: Record<SwapStatus, { label: string; className: string; icon: React.ReactNode }> = {
  pending: {
    label: 'Pending',
    className: 'bg-warning-muted text-warning-foreground border border-warning/30',
    icon: <Clock className="w-3 h-3" />,
  },
  approved: {
    label: 'Approved',
    className: 'bg-success-muted text-success border border-success/30',
    icon: <Check className="w-3 h-3" />,
  },
  declined: {
    label: 'Declined',
    className: 'bg-destructive-muted text-destructive border border-destructive/30',
    icon: <X className="w-3 h-3" />,
  },
  expired: {
    label: 'Expired',
    className: 'bg-muted text-muted-foreground border border-border',
    icon: <AlertCircle className="w-3 h-3" />,
  },
};

interface SwapStatusPillProps {
  status: SwapStatus;
  className?: string;
  showIcon?: boolean;
}

export const SwapStatusPill = ({ status, className, showIcon = true }: SwapStatusPillProps) => {
  const c = config[status];
  return (
    <span className={cn(
      'inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold whitespace-nowrap',
      c.className,
      className,
    )}>
      {showIcon && c.icon}
      {c.label}
    </span>
  );
};
