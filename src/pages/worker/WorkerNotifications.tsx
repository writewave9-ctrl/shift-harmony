import { ChevronLeft, Bell, CheckCheck, Loader2 } from 'lucide-react';
import { WorkerNotificationsSkeleton } from '@/components/PageSkeletons';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useNotifications } from '@/hooks/useNotifications';
import { cn } from '@/lib/utils';

const getNotificationIcon = (type: string) => {
  switch (type) {
    case 'swap_request':
      return '🔄';
    case 'shift_assigned':
      return '📅';
    case 'approval':
      return '✅';
    case 'reminder':
      return '⏰';
    case 'message':
      return '💬';
    default:
      return '📢';
  }
};

const formatTimeAgo = (dateStr: string) => {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
};

export const WorkerNotifications = () => {
  const navigate = useNavigate();
  const { notifications, loading, unreadCount, markAsRead, markAllAsRead } = useNotifications();

  if (loading) return <WorkerNotificationsSkeleton />;

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-background/95 backdrop-blur-sm border-b border-border/50 px-4 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button 
              onClick={() => navigate(-1)}
              className="p-2 -ml-2 rounded-lg hover:bg-accent transition-colors"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-lg font-semibold text-foreground">Notifications</h1>
              <p className="text-xs text-muted-foreground">{unreadCount} unread</p>
            </div>
          </div>
          {unreadCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              className="gap-1.5 text-primary"
              onClick={markAllAsRead}
            >
              <CheckCheck className="w-4 h-4" />
              Mark all read
            </Button>
          )}
        </div>
      </header>

      <div className="px-4 py-4">
        {notifications.length === 0 ? (
          <div className="text-center py-16">
            <div className="w-16 h-16 mx-auto rounded-full bg-muted flex items-center justify-center mb-4">
              <Bell className="w-8 h-8 text-muted-foreground" />
            </div>
            <p className="font-medium text-foreground">No notifications yet</p>
            <p className="text-sm text-muted-foreground mt-1">
              We'll let you know when something happens
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {notifications.map(notification => (
              <button
                key={notification.id}
                onClick={() => {
                  if (!notification.read) {
                    markAsRead(notification.id);
                  }
                  if (notification.action_url) {
                    navigate(notification.action_url);
                  }
                }}
                className={cn(
                  'w-full text-left p-4 rounded-xl transition-all',
                  notification.read 
                    ? 'bg-card hover:bg-accent/50' 
                    : 'bg-primary/5 border border-primary/20 hover:bg-primary/10'
                )}
              >
                <div className="flex gap-3">
                  <div className="text-2xl flex-shrink-0">
                    {getNotificationIcon(notification.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <p className={cn(
                        'font-medium text-foreground',
                        !notification.read && 'font-semibold'
                      )}>
                        {notification.title}
                      </p>
                      {!notification.read && (
                        <span className="w-2 h-2 rounded-full bg-primary flex-shrink-0 mt-2" />
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground mt-0.5 line-clamp-2">
                      {notification.message}
                    </p>
                    <p className="text-xs text-muted-foreground mt-2">
                      {formatTimeAgo(notification.created_at)}
                    </p>
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default WorkerNotifications;
