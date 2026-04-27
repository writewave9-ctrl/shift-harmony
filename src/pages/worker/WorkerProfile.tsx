import { useState, useEffect } from 'react';
import { User, Clock, TrendingUp, Star, LogOut, Moon, Sun, Calendar, History, Bell, ChevronRight, BellRing, KeyRound, Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { WorkerProfileSkeleton } from '@/components/PageSkeletons';
import { MotionCard, MotionSection } from '@/components/MotionWrapper';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { ThemeToggle } from '@/components/ThemeToggle';
import { useTheme } from '@/components/ThemeProvider';
import { AvailabilitySettings } from '@/components/AvailabilitySettings';
import { useNotifications } from '@/hooks/useNotifications';
import { usePushNotifications } from '@/hooks/usePushNotifications';
import { toast } from '@/hooks/use-toast';
import { haptics } from '@/lib/haptics';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

export const WorkerProfile = () => {
  const navigate = useNavigate();
  const { profile, signOut, user, loading } = useAuth();
  const { theme, resolvedTheme } = useTheme();
  const { unreadCount } = useNotifications();
  const { supported: pushSupported, isSubscribed: pushEnabled, subscribe: enablePush, unsubscribe: disablePush, loading: pushLoading } = usePushNotifications();
  const [hoursWorked, setHoursWorked] = useState(0);
  const [showPasswordChange, setShowPasswordChange] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [changingPassword, setChangingPassword] = useState(false);

  // Calculate hours worked this week from completed shifts
  useEffect(() => {
    const fetchHours = async () => {
      if (!profile?.id) return;
      const now = new Date();
      const startOfWeek = new Date(now);
      startOfWeek.setDate(now.getDate() - now.getDay());
      startOfWeek.setHours(0, 0, 0, 0);

      const { data } = await supabase
        .from('shifts')
        .select('start_time, end_time')
        .eq('assigned_worker_id', profile.id)
        .gte('date', startOfWeek.toISOString().split('T')[0])
        .lte('date', now.toISOString().split('T')[0])
        .in('status', ['completed', 'in_progress']);

      if (data) {
        const total = data.reduce((acc, shift) => {
          const [sH, sM] = shift.start_time.split(':').map(Number);
          const [eH, eM] = shift.end_time.split(':').map(Number);
          let hours = (eH + eM / 60) - (sH + sM / 60);
          if (hours < 0) hours += 24;
          return acc + hours;
        }, 0);
        setHoursWorked(Math.round(total));
      }
    };
    fetchHours();
  }, [profile?.id]);

  if (loading) return <WorkerProfileSkeleton />;
  const weeklyTarget = profile?.weekly_hours_target || 40;
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

  const handleChangePassword = async () => {
    if (!newPassword || newPassword.length < 6) {
      toast({ title: 'Password too short', description: 'Password must be at least 6 characters.', variant: 'destructive' });
      return;
    }
    if (newPassword !== confirmPassword) {
      toast({ title: 'Passwords don\'t match', description: 'Please make sure both passwords match.', variant: 'destructive' });
      return;
    }
    setChangingPassword(true);
    try {
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) throw error;
      toast({ title: 'Password updated', description: 'Your password has been changed successfully.' });
      setNewPassword('');
      setConfirmPassword('');
      setShowPasswordChange(false);
    } catch (err: any) {
      toast({ title: 'Error', description: err.message || 'Failed to update password.', variant: 'destructive' });
    } finally {
      setChangingPassword(false);
    }
  };

  return (
    <div className="min-h-screen bg-background pb-24">
      <header className="px-4 pt-6 pb-3">
        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">Account</p>
        <h1 className="font-display text-2xl font-semibold text-foreground tracking-tight">Profile</h1>
      </header>

      <div className="px-4 space-y-5">
        <MotionSection>
          <div className="relative overflow-hidden rounded-3xl bg-gradient-card-premium shadow-card-premium border border-border/50 p-6">
            <div className="absolute inset-0 bg-gradient-mesh opacity-70 pointer-events-none" />
            <div className="absolute -right-16 -top-16 w-48 h-48 rounded-full bg-primary/10 blur-3xl pointer-events-none" />
            <div className="relative flex items-center gap-4">
              <div className="w-20 h-20 rounded-2xl bg-gradient-primary flex items-center justify-center shadow-elevated ring-1 ring-white/20">
                <User className="w-10 h-10 text-primary-foreground" strokeWidth={1.6} />
              </div>
              <div className="flex-1 min-w-0">
                <h2 className="font-display text-xl font-semibold text-foreground tracking-tight truncate">{profile?.full_name || 'Worker'}</h2>
                <p className="text-sm text-muted-foreground truncate">{profile?.position || 'Team Member'}</p>
                <p className="text-xs text-muted-foreground/80 mt-0.5 truncate">{profile?.email}</p>
              </div>
            </div>
          </div>
        </MotionSection>

        <MotionSection delay={0.1}>
          <div className="grid grid-cols-2 gap-3">
            <MotionCard className="bg-card rounded-2xl p-4 text-center border border-border/50 shadow-card-premium">
              <div className="w-10 h-10 mx-auto rounded-xl bg-primary/10 flex items-center justify-center mb-2">
                <Clock className="w-5 h-5 text-primary" />
              </div>
              <p className="font-display text-2xl font-semibold text-foreground tracking-tight">{hoursWorked}h</p>
              <p className="text-[11px] text-muted-foreground mt-0.5">Hours this week</p>
            </MotionCard>
            <MotionCard className="bg-card rounded-2xl p-4 text-center border border-border/50 shadow-card-premium">
              <div className="w-10 h-10 mx-auto rounded-xl bg-success/10 flex items-center justify-center mb-2">
                <Star className="w-5 h-5 text-success" />
              </div>
              <p className="font-display text-2xl font-semibold text-foreground tracking-tight">{reliabilityScore}%</p>
              <p className="text-[11px] text-muted-foreground mt-0.5">Reliability score</p>
            </MotionCard>
          </div>
        </MotionSection>

        <MotionSection delay={0.15}>
          <div className="bg-card rounded-2xl p-5 border border-border/50 shadow-card-premium">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-foreground">Weekly hours</h3>
              <span className="text-sm tabular-nums text-muted-foreground">{hoursWorked} / {weeklyTarget}h</span>
            </div>
            <div className="w-full h-2.5 bg-muted/70 rounded-full overflow-hidden">
              <div className="h-full bg-gradient-primary rounded-full transition-all duration-700 ease-out" style={{ width: `${Math.min((hoursWorked / weeklyTarget) * 100, 100)}%` }} />
            </div>
            {hoursRemaining > 0 && (
              <p className="text-sm text-success font-medium mt-3 flex items-center gap-1.5">
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
                {resolvedTheme === 'dark' ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
                <span>{resolvedTheme === 'dark' ? 'Dark mode' : 'Light mode'}</span>
              </span>
              <ThemeToggle />
            </div>
          </div>
        </MotionSection>

        <MotionSection delay={0.27}>
          <div className="card-elevated rounded-2xl p-5">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-semibold text-foreground">Security</h3>
            </div>
            {!showPasswordChange ? (
              <button
                onClick={() => { haptics.light(); setShowPasswordChange(true); }}
                className="w-full flex items-center justify-between py-2"
              >
                <span className="flex items-center gap-2 text-muted-foreground">
                  <KeyRound className="w-4 h-4" />Change Password
                </span>
                <ChevronRight className="w-5 h-5 text-muted-foreground" />
              </button>
            ) : (
              <div className="space-y-3 pt-2">
                <Input
                  type="password"
                  placeholder="New password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                />
                <Input
                  type="password"
                  placeholder="Confirm new password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                />
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" className="flex-1" onClick={() => { setShowPasswordChange(false); setNewPassword(''); setConfirmPassword(''); }}>
                    Cancel
                  </Button>
                  <Button size="sm" className="flex-1" disabled={changingPassword || !newPassword} onClick={handleChangePassword}>
                    {changingPassword && <Loader2 className="w-4 h-4 animate-spin mr-1" />}
                    Update
                  </Button>
                </div>
              </div>
            )}
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
              <MotionCard onClick={handleSignOut} className="w-full card-elevated rounded-xl p-4 flex items-center gap-3 border border-destructive/20 cursor-pointer">
                <div className="w-10 h-10 rounded-lg bg-destructive/10 flex items-center justify-center"><LogOut className="w-5 h-5 text-destructive" /></div>
                <span className="font-medium text-destructive">Sign Out</span>
              </MotionCard>
          </div>
        </MotionSection>
      </div>
    </div>
  );
};

export default WorkerProfile;
