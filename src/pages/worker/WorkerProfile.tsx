import { User, Clock, TrendingUp, Star, LogOut, Moon, Sun, Calendar, History, Bell, ChevronRight, BellRing } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { WorkerProfileSkeleton } from '@/components/PageSkeletons';
import { MotionCard, MotionSection } from '@/components/MotionWrapper';
import { useApp } from '@/contexts/AppContext';
import { useAuth } from '@/contexts/AuthContext';
import { ThemeToggle } from '@/components/ThemeToggle';
import { useTheme } from '@/components/ThemeProvider';
import { AvailabilitySettings } from '@/components/AvailabilitySettings';
import { useNotifications } from '@/hooks/useNotifications';
import { usePushNotifications } from '@/hooks/usePushNotifications';
import { toast } from '@/hooks/use-toast';
import { haptics } from '@/lib/haptics';
import { Switch } from '@/components/ui/switch';

export const WorkerProfile = () => {
  const navigate = useNavigate();
  const { setUserRole } = useApp();
  const { profile, signOut, user, loading } = useAuth();
  const { theme, resolvedTheme } = useTheme();
  const { unreadCount } = useNotifications();
  const { supported: pushSupported, isSubscribed: pushEnabled, subscribe: enablePush, unsubscribe: disablePush, loading: pushLoading } = usePushNotifications();

  if (loading) return <WorkerProfileSkeleton />;

  const weeklyTarget = profile?.weekly_hours_target || 40;
  const hoursWorked = 0;
  const hoursRemaining = weeklyTarget - hoursWorked;
  const reliabilityScore = profile?.reliability_score || 80;
  const willingness = profile?.willingness_for_extra || 'medium';

  const willingnessLabels: Record<string, string> = { high: 'Always available', medium: 'Sometimes available', low: 'Prefer not' };
  const willingnessColors: Record<string, string> = { high: 'text-success', medium: 'text-warning-foreground', low: 'text-muted-foreground' };

  const handleSignOut = async () => {
    await signOut();
    toast({ title: 'Signed out', description: 'You have been signed out successfully.' });
    navigate('/auth');
  };

  return (
    <div className="min-h-screen bg-background pb-24">
      <header className="px-4 pt-6 pb-4">
        <h1 className="text-lg font-semibold text-foreground">Profile</h1>
      </header>

      <div className="px-4 space-y-6">
        <MotionSection>
          <div className="card-elevated rounded-2xl p-6">
            <div className="flex items-center gap-4">
              <div className="w-20 h-20 rounded-full bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center border-2 border-primary/20">
                <User className="w-10 h-10 text-primary" />
              </div>
              <div className="flex-1">
                <h2 className="text-xl font-bold text-foreground">{profile?.full_name || 'Worker'}</h2>
                <p className="text-muted-foreground">{profile?.position || 'Team Member'}</p>
                <p className="text-sm text-muted-foreground mt-0.5">{profile?.email}</p>
              </div>
            </div>
          </div>
        </MotionSection>

        <MotionSection delay={0.1}>
          <div className="grid grid-cols-2 gap-3">
            <MotionCard className="card-elevated rounded-xl p-4 text-center">
              <div className="w-10 h-10 mx-auto rounded-lg bg-primary/10 flex items-center justify-center mb-2">
                <Clock className="w-5 h-5 text-primary" />
              </div>
              <p className="text-2xl font-bold text-foreground">{hoursWorked}h</p>
              <p className="text-xs text-muted-foreground">Hours this week</p>
            </MotionCard>
            <MotionCard className="card-elevated rounded-xl p-4 text-center">
              <div className="w-10 h-10 mx-auto rounded-lg bg-success/10 flex items-center justify-center mb-2">
                <Star className="w-5 h-5 text-success" />
              </div>
              <p className="text-2xl font-bold text-foreground">{reliabilityScore}%</p>
              <p className="text-xs text-muted-foreground">Reliability score</p>
            </MotionCard>
          </div>
        </MotionSection>

        <MotionSection delay={0.15}>
          <div className="card-elevated rounded-2xl p-5">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-foreground">Weekly Hours</h3>
              <span className="text-sm text-muted-foreground">{hoursWorked} / {weeklyTarget}h</span>
            </div>
            <div className="w-full h-3 bg-muted rounded-full overflow-hidden">
              <div className="h-full bg-gradient-to-r from-primary to-primary/70 rounded-full transition-all duration-500" style={{ width: `${Math.min((hoursWorked / weeklyTarget) * 100, 100)}%` }} />
            </div>
            {hoursRemaining > 0 && (
              <p className="text-sm text-success font-medium mt-3 flex items-center gap-1">
                <TrendingUp className="w-4 h-4" />{hoursRemaining} hours available to pick up
              </p>
            )}
          </div>
        </MotionSection>

        <MotionSection delay={0.2}>
          <div className="card-elevated rounded-2xl p-5">
            <h3 className="text-sm font-semibold text-foreground mb-4">Preferences</h3>
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-2 text-muted-foreground"><TrendingUp className="w-4 h-4" />Extra Shift Availability</span>
              <span className={`font-medium ${willingnessColors[willingness]}`}>{willingnessLabels[willingness]}</span>
            </div>
          </div>
        </MotionSection>

        <MotionSection delay={0.25}>
          <div className="card-elevated rounded-2xl p-5">
            <h3 className="text-sm font-semibold text-foreground mb-4">Appearance</h3>
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-2 text-muted-foreground">
                {resolvedTheme === 'dark' ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}Theme
              </span>
              <div className="flex items-center gap-2">
                <span className="text-sm capitalize text-foreground">{theme}</span>
                <ThemeToggle />
              </div>
            </div>
          </div>
        </MotionSection>

        {pushSupported && (
          <MotionSection delay={0.27}>
            <div className="card-elevated rounded-2xl p-5">
              <h3 className="text-sm font-semibold text-foreground mb-4">Push Notifications</h3>
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-2 text-muted-foreground">
                  <BellRing className="w-4 h-4" />Shift reminders & alerts
                </span>
                <Switch
                  checked={pushEnabled}
                  disabled={pushLoading}
                  onCheckedChange={async (checked) => {
                    haptics.light();
                    if (checked) {
                      const ok = await enablePush();
                      if (ok) toast({ title: 'Push enabled', description: 'You\'ll receive shift reminders.' });
                      else toast({ title: 'Permission denied', description: 'Allow notifications in your browser settings.', variant: 'destructive' });
                    } else {
                      await disablePush();
                      toast({ title: 'Push disabled', description: 'You won\'t receive push notifications.' });
                    }
                  }}
                />
              </div>
            </div>
          </MotionSection>
        )}

        <MotionSection delay={0.3}>
          <div className="space-y-2">
            <MotionCard onClick={() => { haptics.light(); navigate('/worker/notifications'); }} className="w-full card-elevated rounded-xl p-4 flex items-center justify-between cursor-pointer">
              <span className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-info/10 flex items-center justify-center"><Bell className="w-5 h-5 text-info" /></div>
                <span className="font-medium">Notifications</span>
              </span>
              <div className="flex items-center gap-2">
                {unreadCount > 0 && <span className="px-2 py-0.5 text-xs font-medium bg-primary text-primary-foreground rounded-full">{unreadCount}</span>}
                <ChevronRight className="w-5 h-5 text-muted-foreground" />
              </div>
            </MotionCard>

            <AvailabilitySettings
              trigger={
                <MotionCard className="w-full card-elevated rounded-xl p-4 flex items-center justify-between cursor-pointer">
                  <span className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-warning/10 flex items-center justify-center"><Calendar className="w-5 h-5 text-warning" /></div>
                    <span className="font-medium">Availability Settings</span>
                  </span>
                  <ChevronRight className="w-5 h-5 text-muted-foreground" />
                </MotionCard>
              }
            />

            <MotionCard onClick={() => { haptics.light(); navigate('/worker/history'); }} className="w-full card-elevated rounded-xl p-4 flex items-center justify-between cursor-pointer">
              <span className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center"><History className="w-5 h-5 text-muted-foreground" /></div>
                <span className="font-medium">Shift History</span>
              </span>
              <ChevronRight className="w-5 h-5 text-muted-foreground" />
            </MotionCard>
          </div>
        </MotionSection>

        <MotionSection delay={0.35}>
          <div className="pt-4 pb-4">
            {user ? (
              <MotionCard onClick={handleSignOut} className="w-full card-elevated rounded-xl p-4 flex items-center gap-3 border border-destructive/20 cursor-pointer">
                <div className="w-10 h-10 rounded-lg bg-destructive/10 flex items-center justify-center"><LogOut className="w-5 h-5 text-destructive" /></div>
                <span className="font-medium text-destructive">Sign Out</span>
              </MotionCard>
            ) : (
              <MotionCard onClick={() => { setUserRole('manager'); navigate('/manager'); }} className="w-full card-elevated rounded-xl p-4 flex items-center gap-3 cursor-pointer">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center"><LogOut className="w-5 h-5 text-primary" /></div>
                <span className="font-medium">Switch to Manager View (Demo)</span>
              </MotionCard>
            )}
          </div>
        </MotionSection>
      </div>
    </div>
  );
};

export default WorkerProfile;
