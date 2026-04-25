import { useMemo } from 'react';
import { ChevronLeft, Bell, CheckCheck, ArrowRightLeft, Calendar, CheckCircle2, AlertOctagon, MessageSquare, Clock, Loader2, Check, Eye } from 'lucide-react';
import { WorkerNotificationsSkeleton } from '@/components/PageSkeletons';
import { MotionCard, MotionItem } from '@/components/MotionWrapper';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useNotifications } from '@/hooks/useNotifications';
import { useSwapRequests } from '@/hooks/useSwapRequests';
import { cn } from '@/lib/utils';
import { haptics } from '@/lib/haptics';
import { useState } from 'react';
import { toast } from 'sonner';

const ICON_MAP: Record<string, { icon: React.ComponentType<any>; tone: string }> = {
  swap_request: { icon: ArrowRightLeft, tone: 'bg-primary/10 text-primary ring-1 ring-primary/15' },
  shift_assigned: { icon: Calendar, tone: 'bg-info-muted text-info ring-1 ring-info/15' },
  shift_request: { icon: Calendar, tone: 'bg-info-muted text-info ring-1 ring-info/15' },
  approval: { icon: CheckCircle2, tone: 'bg-success-muted text-success ring-1 ring-success/15' },
  call_off: { icon: AlertOctagon, tone: 'bg-warning-muted text-warning ring-1 ring-warning/15' },
  reminder: { icon: Clock, tone: 'bg-accent text-accent-foreground ring-1 ring-border' },
  message: { icon: MessageSquare, tone: 'bg-muted text-muted-foreground ring-1 ring-border' },
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
  const { incomingForMe, acceptSwap, refetch: refetchSwaps } = useSwapRequests();
  const [busyId, setBusyId] = useState<string | null>(null);

  // Map related_shift_id → matching swap request that's actionable for the current worker
  const swapByShift = useMemo(() => {
    const map = new Map<string, typeof incomingForMe[number]>();
    incomingForMe.forEach((s) => {
      if (s.shift_id) map.set(s.shift_id, s);
    });
    return map;
  }, [incomingForMe]);

  const handleAccept = async (notifId: string, swapId: string) => {
    setBusyId(notifId);
    const swap = incomingForMe.find((s) => s.id === swapId);
    if (!swap) {
      toast.error('Swap request no longer available');
      setBusyId(null);
      return;
    }
    haptics.success();
    const ok = await acceptSwap(swap);
    if (ok) {
      markAsRead(notifId);
      refetchSwaps();
    }
    setBusyId(null);
  };

  if (loading) return <WorkerNotificationsSkeleton />;

  return (
    <div className="min-h-screen bg-background pb-24">
      <header className="sticky top-0 z-10 bg-background/85 backdrop-blur-xl border-b border-border/40 px-4 py-4">
        <div aria-hidden className="absolute inset-x-0 -bottom-px h-px bg-gradient-to-r from-transparent via-border/60 to-transparent pointer-events-none" />
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button onClick={() => navigate(-1)} className="p-2 -ml-2 rounded-xl hover:bg-accent/60 transition-colors" aria-label="Back">
              <ChevronLeft className="w-5 h-5" />
            </button>
            <div>
              <h1 className="font-display text-[20px] leading-none font-semibold text-foreground tracking-tight">Notifications</h1>
              <p className="text-[11px] text-muted-foreground mt-1 font-medium uppercase tracking-wider">
                {unreadCount > 0 ? `${unreadCount} unread` : 'All caught up'}
              </p>
            </div>
          </div>
          {unreadCount > 0 && (
            <Button variant="ghost" size="sm" className="gap-1.5 text-primary text-[12px] font-semibold" onClick={markAllAsRead}>
              <CheckCheck className="w-4 h-4" />Mark all read
            </Button>
          )}
        </div>
      </header>

      <div className="px-4 py-4">
        {notifications.length === 0 ? (
          <div className="text-center py-16">
            <div className="w-16 h-16 mx-auto rounded-2xl bg-muted flex items-center justify-center mb-4">
              <Bell className="w-7 h-7 text-muted-foreground" />
            </div>
            <p className="font-semibold text-foreground">No notifications yet</p>
            <p className="text-sm text-muted-foreground mt-1">We'll let you know when something happens</p>
          </div>
        ) : (
          <div className="space-y-2">
            {notifications.map((notification, index) => {
              const meta = ICON_MAP[notification.type] || ICON_MAP.message;
              const Icon = meta.icon;
              // Direct-action shift-scoped swap if applicable
              const linkedSwap =
                notification.type === 'swap_request' && notification.related_shift_id
                  ? swapByShift.get(notification.related_shift_id)
                  : undefined;

              const handleCardClick = () => {
                haptics.light();
                if (!notification.read) markAsRead(notification.id);
                if (linkedSwap) {
                  navigate('/worker'); // Home shows IncomingSwapsCard with details
                } else if (notification.action_url) {
                  navigate(notification.action_url);
                } else if (notification.related_shift_id) {
                  navigate('/worker/shifts');
                }
              };

              return (
                <MotionItem key={notification.id} index={index}>
                  <MotionCard
                    onClick={handleCardClick}
                    className={cn(
                      'w-full text-left p-4 rounded-2xl transition-all cursor-pointer',
                      notification.read
                        ? 'bg-card border border-border/50 hover:bg-accent/30'
                        : 'bg-card border border-primary/25 shadow-elevated hover:border-primary/40',
                    )}
                  >
                    <div className="flex gap-3">
                      <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0', meta.tone)}>
                        <Icon className="w-[18px] h-[18px]" strokeWidth={2} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <p
                            className={cn(
                              'text-sm leading-tight text-foreground',
                              !notification.read ? 'font-semibold' : 'font-medium',
                            )}
                          >
                            {notification.title}
                          </p>
                          {!notification.read && (
                            <span className="w-2 h-2 rounded-full bg-primary flex-shrink-0 mt-1.5" />
                          )}
                        </div>
                        <p className="text-[13px] text-muted-foreground mt-0.5 line-clamp-2">
                          {notification.message}
                        </p>
                        <p className="text-[11px] text-muted-foreground/70 mt-1.5">
                          {formatTimeAgo(notification.created_at)}
                        </p>

                        {/* Shift-scoped quick actions */}
                        {linkedSwap && (
                          <div className="mt-3 flex gap-2" onClick={(e) => e.stopPropagation()}>
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-8 px-3 rounded-lg text-xs"
                              onClick={() => {
                                if (!notification.read) markAsRead(notification.id);
                                navigate('/worker');
                              }}
                            >
                              <Eye className="w-3.5 h-3.5 mr-1" />Review
                            </Button>
                            <Button
                              size="sm"
                              className="h-8 px-3 rounded-lg text-xs bg-gradient-primary shadow-floating"
                              disabled={busyId === notification.id}
                              onClick={() => handleAccept(notification.id, linkedSwap.id)}
                            >
                              {busyId === notification.id ? (
                                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                              ) : (
                                <>
                                  <Check className="w-3.5 h-3.5 mr-1" />Accept
                                </>
                              )}
                            </Button>
                          </div>
                        )}

                        {/* Approval confirmation chip */}
                        {notification.type === 'swap_request' &&
                          /approved/i.test(notification.title) && (
                            <span className="mt-2 inline-flex items-center gap-1 rounded-full bg-success-muted text-success text-[10.5px] font-semibold px-2 py-0.5 ring-1 ring-success/20">
                              <CheckCircle2 className="w-3 h-3" /> Approved
                            </span>
                          )}
                      </div>
                    </div>
                  </MotionCard>
                </MotionItem>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default WorkerNotifications;
