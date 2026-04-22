import { useState, useEffect } from 'react';
import { ManagerSettingsSkeleton } from '@/components/PageSkeletons';
import { useAuth } from '@/contexts/AuthContext';
import { useTeamSettings } from '@/hooks/useTeamSettings';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import {
  Settings,
  Bell,
  MapPin,
  Users,
  Building2,
  Save,
  Loader2,
  ChevronLeft,
  Rocket,
  ArrowRight,
  LifeBuoy,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { ManagerPlanSection } from '@/components/ManagerPlanSection';

export const ManagerSettings = () => {
  const navigate = useNavigate();
  const { profile, refreshProfile } = useAuth();
  const { settings, loading: settingsLoading, updateSettings, createSettings } = useTeamSettings();
  
  const [saving, setSaving] = useState(false);
  const [teamName, setTeamName] = useState('');
  const [teamLocation, setTeamLocation] = useState('');
  const [orgName, setOrgName] = useState('');
  const [isNewSetup, setIsNewSetup] = useState(false);
  
  // Settings state
  const [checkInRadius, setCheckInRadius] = useState(100);
  const [reminderHours, setReminderHours] = useState(2);
  const [swapNotifications, setSwapNotifications] = useState(true);
  const [attendanceAlerts, setAttendanceAlerts] = useState(true);
  const [allowShiftRequests, setAllowShiftRequests] = useState(true);
  const [autoApproveSwaps, setAutoApproveSwaps] = useState(false);

  // Check if this is a new setup (no org/team)
  useEffect(() => {
    if (profile && !profile.organization_id && !profile.team_id) {
      setIsNewSetup(true);
    } else {
      setIsNewSetup(false);
    }
  }, [profile]);

  // Fetch team and org info
  useEffect(() => {
    const fetchTeamInfo = async () => {
      if (!profile?.team_id) return;

      const { data: team } = await supabase
        .from('teams')
        .select('name, location')
        .eq('id', profile.team_id)
        .single();

      if (team) {
        setTeamName(team.name);
        setTeamLocation(team.location || '');
      }

      if (profile?.organization_id) {
        const { data: org } = await supabase
          .from('organizations')
          .select('name')
          .eq('id', profile.organization_id)
          .single();

        if (org) {
          setOrgName(org.name);
        }
      }
    };

    fetchTeamInfo();
  }, [profile?.team_id, profile?.organization_id]);

  // Initialize settings state
  useEffect(() => {
    if (settings) {
      setCheckInRadius(settings.default_check_in_radius_meters);
      setReminderHours(settings.notification_shift_reminder_hours);
      setSwapNotifications(settings.notification_swap_requests);
      setAttendanceAlerts(settings.notification_attendance_alerts);
      setAllowShiftRequests(settings.allow_worker_shift_requests);
      setAutoApproveSwaps(settings.auto_approve_swaps);
    }
  }, [settings]);

  // Create settings if they don't exist
  useEffect(() => {
    if (!settingsLoading && !settings && profile?.team_id) {
      createSettings();
    }
  }, [settingsLoading, settings, profile?.team_id]);

  const handleCreateWorkspace = async () => {
    if (!orgName.trim() || !teamName.trim() || !profile?.id) {
      toast.error('Please enter both organization and team names');
      return;
    }
    
    setSaving(true);
    try {
      // Generate IDs client-side so we don't need SELECT permission on newly created rows
      const orgId = crypto.randomUUID();
      const teamId = crypto.randomUUID();

      // Create organization
      const { error: orgError } = await supabase
        .from('organizations')
        .insert({ id: orgId, name: orgName });

      if (orgError) throw orgError;

      // Create team next (uses permissive INSERT policy for managers)
      const { error: teamError } = await supabase
        .from('teams')
        .insert({
          id: teamId,
          organization_id: orgId,
          name: teamName,
          location: teamLocation || null,
        });

      if (teamError) throw teamError;

      // Now update profile with both org and team
      const { error: profileError } = await supabase
        .from('profiles')
        .update({ 
          organization_id: orgId,
          team_id: teamId,
        })
        .eq('id', profile.id);

      if (profileError) throw profileError;

      // Refresh profile
      await refreshProfile();
      
      toast.success('Workspace created successfully!');
      setIsNewSetup(false);
    } catch (err: any) {
      console.error('Error creating workspace:', err);
      toast.error(err.message || 'Failed to create workspace');
    } finally {
      setSaving(false);
    }
  };

  const handleSaveTeamInfo = async () => {
    if (!profile?.team_id) return;
    setSaving(true);

    try {
      // Update team
      const { error: teamError } = await supabase
        .from('teams')
        .update({ 
          name: teamName,
          location: teamLocation || null,
        })
        .eq('id', profile.team_id);

      if (teamError) throw teamError;

      // Update organization if exists
      if (profile?.organization_id && orgName) {
        const { error: orgError } = await supabase
          .from('organizations')
          .update({ name: orgName })
          .eq('id', profile.organization_id);

        if (orgError) throw orgError;
      }

      toast.success('Team information updated');
    } catch (err) {
      console.error('Error saving team info:', err);
      toast.error('Failed to save changes');
    } finally {
      setSaving(false);
    }
  };

  const handleSaveSettings = async () => {
    setSaving(true);
    try {
      await updateSettings({
        default_check_in_radius_meters: checkInRadius,
        notification_shift_reminder_hours: reminderHours,
        notification_swap_requests: swapNotifications,
        notification_attendance_alerts: attendanceAlerts,
        allow_worker_shift_requests: allowShiftRequests,
        auto_approve_swaps: autoApproveSwaps,
      });
    } finally {
      setSaving(false);
    }
  };

  if (settingsLoading && !isNewSetup) return <ManagerSettingsSkeleton />;

  // New workspace setup view
  if (isNewSetup) {
    return (
      <div className="min-h-screen bg-background pb-8">
        <header className="px-4 pt-8 pb-6 lg:px-8 text-center">
          <div className="w-16 h-16 mx-auto rounded-2xl bg-primary/10 flex items-center justify-center mb-4">
            <Rocket className="w-8 h-8 text-primary" />
          </div>
          <h1 className="text-2xl font-bold text-foreground">Welcome to Align!</h1>
          <p className="text-sm text-muted-foreground mt-2">
            Let's set up your workspace to get started
          </p>
        </header>

        <div className="px-4 lg:px-8 max-w-lg mx-auto space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="w-5 h-5" />
                Create Your Workspace
              </CardTitle>
              <CardDescription>
                Set up your organization and first team
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="orgName">Organization Name *</Label>
                <Input
                  id="orgName"
                  value={orgName}
                  onChange={(e) => setOrgName(e.target.value)}
                  placeholder="e.g., Downtown Bistro"
                />
                <p className="text-xs text-muted-foreground">
                  This is typically your business or company name
                </p>
              </div>
              
              <Separator />
              
              <div className="space-y-2">
                <Label htmlFor="teamName">Team Name *</Label>
                <Input
                  id="teamName"
                  value={teamName}
                  onChange={(e) => setTeamName(e.target.value)}
                  placeholder="e.g., Front of House"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="teamLocation">Team Location (Optional)</Label>
                <Input
                  id="teamLocation"
                  value={teamLocation}
                  onChange={(e) => setTeamLocation(e.target.value)}
                  placeholder="e.g., Main Building"
                />
              </div>

              <Button 
                onClick={handleCreateWorkspace} 
                disabled={saving || !orgName.trim() || !teamName.trim()}
                className="w-full"
                size="lg"
              >
                {saving ? (
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                ) : (
                  <ArrowRight className="w-4 h-4 mr-2" />
                )}
                Create Workspace
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-8">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-background/95 backdrop-blur-sm border-b border-border/50 px-4 py-4 lg:px-8">
        <div className="flex items-center gap-3">
          <button 
            onClick={() => navigate('/manager')}
            className="p-2 -ml-2 rounded-lg hover:bg-accent transition-colors lg:hidden"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-2">
            <Settings className="w-5 h-5 text-primary" />
            <h1 className="text-lg font-semibold text-foreground">Settings</h1>
          </div>
        </div>
      </header>

      <div className="px-4 lg:px-8 py-6 space-y-6 max-w-2xl">
        {/* Plan */}
        <ManagerPlanSection />

        {/* Support shortcut */}
        <Card className="rounded-2xl shadow-elevated border-border/50">
          <CardContent className="p-5 flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-accent flex items-center justify-center">
                <LifeBuoy className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-sm font-semibold">Support center</p>
                <p className="text-xs text-muted-foreground">Open a ticket or browse your conversations</p>
              </div>
            </div>
            <Button variant="outline" size="sm" className="rounded-xl" onClick={() => navigate('/manager/support')}>
              Open
            </Button>
          </CardContent>
        </Card>

        {/* Organization & Team Info */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="w-5 h-5" />
              Organization & Team
            </CardTitle>
            <CardDescription>
              Manage your organization and team details
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="orgName">Organization Name</Label>
              <Input
                id="orgName"
                value={orgName}
                onChange={(e) => setOrgName(e.target.value)}
                placeholder="Enter organization name"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="teamName">Team Name</Label>
              <Input
                id="teamName"
                value={teamName}
                onChange={(e) => setTeamName(e.target.value)}
                placeholder="Enter team name"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="teamLocation">Team Location</Label>
              <Input
                id="teamLocation"
                value={teamLocation}
                onChange={(e) => setTeamLocation(e.target.value)}
                placeholder="e.g., Main Building"
              />
            </div>
            <Button onClick={handleSaveTeamInfo} disabled={saving}>
              {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}
              Save Changes
            </Button>
          </CardContent>
        </Card>

        {/* Check-in Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="w-5 h-5" />
              Check-in Settings
            </CardTitle>
            <CardDescription>
              Configure proximity-based check-in defaults
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label>Default Check-in Radius</Label>
                <span className="text-sm font-medium text-primary">{checkInRadius}m</span>
              </div>
              <Slider
                value={[checkInRadius]}
                onValueChange={([value]) => setCheckInRadius(value)}
                min={25}
                max={500}
                step={25}
                className="w-full"
              />
              <p className="text-xs text-muted-foreground">
                Workers must be within this distance to check in
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Notification Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bell className="w-5 h-5" />
              Notifications
            </CardTitle>
            <CardDescription>
              Configure notification preferences for your team
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label>Shift Reminder (hours before)</Label>
                <span className="text-sm font-medium text-primary">{reminderHours}h</span>
              </div>
              <Slider
                value={[reminderHours]}
                onValueChange={([value]) => setReminderHours(value)}
                min={1}
                max={24}
                step={1}
                className="w-full"
              />
            </div>

            <Separator />

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Swap Request Notifications</Label>
                <p className="text-xs text-muted-foreground">Get notified when workers request swaps</p>
              </div>
              <Switch
                checked={swapNotifications}
                onCheckedChange={setSwapNotifications}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Attendance Alerts</Label>
                <p className="text-xs text-muted-foreground">Get notified about late or missing check-ins</p>
              </div>
              <Switch
                checked={attendanceAlerts}
                onCheckedChange={setAttendanceAlerts}
              />
            </div>
          </CardContent>
        </Card>

        {/* Shift Request Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="w-5 h-5" />
              Shift Requests
            </CardTitle>
            <CardDescription>
              Control how workers can request open shifts
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Allow Shift Requests</Label>
                <p className="text-xs text-muted-foreground">Workers can request to take open shifts</p>
              </div>
              <Switch
                checked={allowShiftRequests}
                onCheckedChange={setAllowShiftRequests}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Auto-approve Swaps</Label>
                <p className="text-xs text-muted-foreground">Automatically approve swap requests</p>
              </div>
              <Switch
                checked={autoApproveSwaps}
                onCheckedChange={setAutoApproveSwaps}
              />
            </div>

            <Button onClick={handleSaveSettings} disabled={saving} className="w-full">
              {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}
              Save Settings
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ManagerSettings;
