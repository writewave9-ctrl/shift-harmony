import { cn } from '@/lib/utils';
import { Bell, ArrowRightLeft, Calendar, CheckCircle, MessageSquare, ChevronRight } from 'lucide-react';

interface NotificationData {
  id: string;
  type: string;
  title: string;
  message: string;
  read: boolean;
  created_at: string;
}

interface NotificationItemProps {
  notification: NotificationData;
  onMarkAsRead?: (id: string) => void;
  onClick?: () => void;
  className?: string;
}

const iconMap: Record<string, React.ReactNode> = {
  swap_request: <ArrowRightLeft className="w-4 h-4" />,
  shift_assigned: <Calendar className="w-4 h-4" />,
  shift_request: <Calendar className="w-4 h-4" />,
  approval: <CheckCircle className="w-4 h-4" />,
  reminder: <Bell className="w-4 h-4" />,
  message: <MessageSquare className="w-4 h-4" />,
};

export const NotificationItem: React.FC<NotificationItemProps> = ({
  notification,
  onMarkAsRead,
  onClick,
  className,
}) => {
  const timeAgo = getTimeAgo(notification.created_at);

  const handleClick = () => {
    if (!notification.read && onMarkAsRead) {
      onMarkAsRead(notification.id);
    }
    onClick?.();
  };

  return (
    <div
      onClick={handleClick}
      className={cn(
        'flex items-start gap-3 p-3 rounded-lg transition-colors cursor-pointer hover:bg-accent/50',
        !notification.read && 'bg-accent/30',
        className
      )}
    >
      <div className={cn(
        'p-2 rounded-lg flex-shrink-0',
        !notification.read ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground'
      )}>
        {iconMap[notification.type] || <Bell className="w-4 h-4" />}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <p className={cn(
            'text-sm',
            !notification.read ? 'font-medium text-foreground' : 'text-muted-foreground'
          )}>
            {notification.title}
          </p>
          {!notification.read && (
            <span className="w-2 h-2 rounded-full bg-primary flex-shrink-0 mt-1.5" />
          )}
        </div>
        <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
          {notification.message}
        </p>
        <p className="text-xs text-muted-foreground/70 mt-1">{timeAgo}</p>
      </div>
    </div>
  );
};

function getTimeAgo(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));

  if (diffInMinutes < 1) return 'Just now';
  if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
  
  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) return `${diffInHours}h ago`;
  
  const diffInDays = Math.floor(diffInHours / 24);
  if (diffInDays === 1) return 'Yesterday';
  if (diffInDays < 7) return `${diffInDays}d ago`;
  
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}
