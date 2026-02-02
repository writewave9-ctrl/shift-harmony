import { notifications } from '@/data/mockData';
import { NotificationItem } from '@/components/NotificationItem';
import { ChevronLeft, Bell } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const WorkerNotifications = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-background/95 backdrop-blur-sm border-b border-border/50 px-4 py-4">
        <div className="flex items-center gap-3">
          <button 
            onClick={() => navigate('/worker')}
            className="p-2 -ml-2 rounded-lg hover:bg-accent transition-colors"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-lg font-semibold text-foreground">Notifications</h1>
            <p className="text-xs text-muted-foreground">
              {notifications.filter(n => !n.read).length} unread
            </p>
          </div>
        </div>
      </header>

      <div className="px-4 py-4">
        {notifications.length > 0 ? (
          <div className="card-elevated rounded-xl divide-y divide-border/50">
            {notifications.map(notification => (
              <NotificationItem
                key={notification.id}
                notification={notification}
                onClick={() => {}}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <Bell className="w-12 h-12 mx-auto text-muted-foreground/50 mb-4" />
            <p className="text-muted-foreground">No notifications yet</p>
          </div>
        )}
      </div>
    </div>
  );
};
