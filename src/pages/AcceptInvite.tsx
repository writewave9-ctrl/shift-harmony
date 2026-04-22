import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Loader2, CheckCircle2, AlertCircle } from 'lucide-react';
import { AlignLogo } from '@/components/AlignLogo';
import { ThemeToggle } from '@/components/ThemeToggle';

export const AcceptInvite = () => {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const { user, loading: authLoading, refreshProfile } = useAuth();
  const token = params.get('token') || '';
  const [state, setState] = useState<'idle' | 'accepting' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      // Redirect to auth and remember invite
      navigate(`/auth?invite=${token}`, { replace: true });
    }
  }, [user, authLoading, token, navigate]);

  const handleAccept = async () => {
    if (!token) return;
    setState('accepting');
    try {
      const { data, error } = await supabase.functions.invoke('accept-invite', { body: { token } });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      await refreshProfile();
      setState('success');
      setTimeout(() => navigate('/', { replace: true }), 1200);
    } catch (err: any) {
      setMessage(err.message || 'Failed to accept invite');
      setState('error');
    }
  };

  if (authLoading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="px-6 py-4 flex items-center justify-between">
        <AlignLogo size={32} withWordmark />
        <ThemeToggle />
      </header>
      <main className="flex-1 flex items-center justify-center px-6">
        <div className="w-full max-w-sm bg-card border border-border/60 rounded-2xl p-8 shadow-card text-center space-y-5">
          <div className="w-14 h-14 mx-auto rounded-2xl bg-primary/10 flex items-center justify-center">
            <AlignLogo size={32} />
          </div>
          {state === 'success' ? (
            <>
              <CheckCircle2 className="w-10 h-10 text-success mx-auto" />
              <h1 className="text-xl font-semibold tracking-tight">You're in!</h1>
              <p className="text-sm text-muted-foreground">Redirecting to your dashboard…</p>
            </>
          ) : state === 'error' ? (
            <>
              <AlertCircle className="w-10 h-10 text-destructive mx-auto" />
              <h1 className="text-xl font-semibold tracking-tight">Couldn't accept invite</h1>
              <p className="text-sm text-muted-foreground">{message}</p>
              <Button variant="outline" className="w-full" onClick={() => navigate('/')}>Go home</Button>
            </>
          ) : (
            <>
              <h1 className="text-xl font-semibold tracking-tight">Join this workspace</h1>
              <p className="text-sm text-muted-foreground">
                Signed in as <span className="font-medium text-foreground">{user.email}</span>. Accept to add this workspace to your account — you can switch between workspaces anytime.
              </p>
              <div className="flex gap-2 pt-1">
                <Button variant="outline" className="flex-1" onClick={() => navigate('/')}>Cancel</Button>
                <Button className="flex-1" onClick={handleAccept} disabled={state === 'accepting'}>
                  {state === 'accepting' && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
                  Accept invite
                </Button>
              </div>
            </>
          )}
        </div>
      </main>
    </div>
  );
};

export default AcceptInvite;
