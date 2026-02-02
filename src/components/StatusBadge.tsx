import { cn } from '@/lib/utils';
import { AttendanceStatus } from '@/types/align';
import { Check, Clock, X, UserCheck } from 'lucide-react';

interface StatusBadgeProps {
  status: AttendanceStatus;
  className?: string;
  showIcon?: boolean;
}

const statusConfig: Record<AttendanceStatus, { 
  label: string; 
  className: string; 
  icon: React.ReactNode;
}> = {
  present: {
    label: 'Present',
    className: 'status-present',
    icon: <Check className="w-3 h-3" />,
  },
  late: {
    label: 'Late',
    className: 'status-late',
    icon: <Clock className="w-3 h-3" />,
  },
  not_checked_in: {
    label: 'Not Checked In',
    className: 'status-pending',
    icon: <X className="w-3 h-3" />,
  },
  manually_approved: {
    label: 'Approved',
    className: 'status-present',
    icon: <UserCheck className="w-3 h-3" />,
  },
};

export const StatusBadge: React.FC<StatusBadgeProps> = ({ 
  status, 
  className,
  showIcon = true,
}) => {
  const config = statusConfig[status];

  return (
    <span 
      className={cn(
        'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium',
        config.className,
        className
      )}
    >
      {showIcon && config.icon}
      {config.label}
    </span>
  );
};
