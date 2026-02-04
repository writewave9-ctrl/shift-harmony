import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, Building2, Users, ArrowRight, Check } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

type Step = 'organization' | 'team' | 'complete';

export const Onboarding = () => {
  const navigate = useNavigate();
  const { profile, userRole, refreshProfile } = useAuth();
  
  const [step, setStep] = useState<Step>('organization');
  const [loading, setLoading] = useState(false);
  
  const [orgName, setOrgName] = useState('');
  const [teamName, setTeamName] = useState('');
  const [teamLocation, setTeamLocation] = useState('');
  
  const [createdOrgId, setCreatedOrgId] = useState<string | null>(null);

  const handleCreateOrganization = async () => {
    if (!orgName.trim()) return;
    
    setLoading(true);
    try {
      // Create organization
      const { data: org, error: orgError } = await supabase
        .from('organizations')
        .insert({ name: orgName })
        .select()
        .single();

      if (orgError) throw orgError;

      setCreatedOrgId(org.id);

      // Update profile with organization
      const { error: profileError } = await supabase
        .from('profiles')
        .update({ organization_id: org.id })
        .eq('id', profile?.id);

      if (profileError) throw profileError;

      toast({
        title: 'Organization created!',
        description: `${orgName} has been set up.`,
      });

      setStep('team');
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTeam = async () => {
    if (!teamName.trim() || !createdOrgId) return;
    
    setLoading(true);
    try {
      // Create team
      const { data: team, error: teamError } = await supabase
        .from('teams')
        .insert({
          organization_id: createdOrgId,
          name: teamName,
          location: teamLocation || null,
        })
        .select()
        .single();

      if (teamError) throw teamError;

      // Update profile with team
      const { error: profileError } = await supabase
        .from('profiles')
        .update({ team_id: team.id })
        .eq('id', profile?.id);

      if (profileError) throw profileError;

      await refreshProfile();

      toast({
        title: 'Team created!',
        description: `${teamName} is ready to go.`,
      });

      setStep('complete');
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleComplete = () => {
    if (userRole?.role === 'manager') {
      navigate('/manager');
    } else {
      navigate('/worker');
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="px-6 pt-12 pb-6 text-center">
        <div className="w-14 h-14 mx-auto rounded-2xl bg-primary/10 flex items-center justify-center mb-4">
          <span className="text-2xl font-bold text-primary">A</span>
        </div>
        <h1 className="text-2xl font-bold text-foreground mb-1">
          {step === 'complete' ? 'All Set!' : 'Set Up Your Workspace'}
        </h1>
        <p className="text-sm text-muted-foreground">
          {step === 'organization' && 'Create your organization'}
          {step === 'team' && 'Add your first team'}
          {step === 'complete' && 'Your workspace is ready'}
        </p>
      </header>

      {/* Progress */}
      <div className="px-6 mb-8">
        <div className="max-w-sm mx-auto flex items-center gap-2">
          <div className={cn(
            'flex-1 h-1 rounded-full transition-colors',
            step !== 'organization' ? 'bg-primary' : 'bg-primary/30'
          )} />
          <div className={cn(
            'flex-1 h-1 rounded-full transition-colors',
            step === 'complete' ? 'bg-primary' : 'bg-primary/30'
          )} />
        </div>
      </div>

      {/* Content */}
      <main className="flex-1 px-6 pb-12">
        <div className="max-w-sm mx-auto">
          {step === 'organization' && (
            <div className="space-y-6 animate-fade-in">
              <div className="w-16 h-16 mx-auto rounded-2xl bg-primary/10 flex items-center justify-center">
                <Building2 className="w-8 h-8 text-primary" />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="orgName">Organization Name</Label>
                <Input
                  id="orgName"
                  type="text"
                  placeholder="e.g., Downtown Bistro"
                  value={orgName}
                  onChange={(e) => setOrgName(e.target.value)}
                  className="h-12"
                />
                <p className="text-xs text-muted-foreground">
                  This is typically your business or company name
                </p>
              </div>

              <Button
                onClick={handleCreateOrganization}
                className="w-full h-12"
                disabled={loading || !orgName.trim()}
              >
                {loading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    Continue
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </>
                )}
              </Button>
            </div>
          )}

          {step === 'team' && (
            <div className="space-y-6 animate-fade-in">
              <div className="w-16 h-16 mx-auto rounded-2xl bg-primary/10 flex items-center justify-center">
                <Users className="w-8 h-8 text-primary" />
              </div>
              
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="teamName">Team Name</Label>
                  <Input
                    id="teamName"
                    type="text"
                    placeholder="e.g., Front of House"
                    value={teamName}
                    onChange={(e) => setTeamName(e.target.value)}
                    className="h-12"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="teamLocation">Location (Optional)</Label>
                  <Input
                    id="teamLocation"
                    type="text"
                    placeholder="e.g., Main Building"
                    value={teamLocation}
                    onChange={(e) => setTeamLocation(e.target.value)}
                    className="h-12"
                  />
                </div>
              </div>

              <Button
                onClick={handleCreateTeam}
                className="w-full h-12"
                disabled={loading || !teamName.trim()}
              >
                {loading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    Create Team
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </>
                )}
              </Button>
            </div>
          )}

          {step === 'complete' && (
            <div className="space-y-6 animate-fade-in text-center">
              <div className="w-20 h-20 mx-auto rounded-full bg-success/10 flex items-center justify-center">
                <Check className="w-10 h-10 text-success checkmark-animate" />
              </div>
              
              <div>
                <h2 className="text-xl font-semibold text-foreground mb-2">
                  Welcome to {orgName}!
                </h2>
                <p className="text-muted-foreground">
                  Your workspace is ready. You can now start managing your team and shifts.
                </p>
              </div>

              <Button onClick={handleComplete} className="w-full h-12">
                Go to Dashboard
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default Onboarding;
