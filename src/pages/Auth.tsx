import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { AlignLogo } from '@/components/AlignLogo';
import { supabase } from '@/integrations/supabase/client';
import { lovable } from '@/integrations/lovable/index';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, Mail, Lock, User, Clock, Shield, Users, Zap, ArrowLeft } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { ThemeToggle } from '@/components/ThemeToggle';
import { Separator } from '@/components/ui/separator';

type AuthMode = 'login' | 'signup' | 'forgot';

export const Auth = () => {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const inviteToken = params.get('invite') || undefined;
  const { signIn, signUp } = useAuth();
  
  const [mode, setMode] = useState<AuthMode>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  const handleGoogleSignIn = async () => {
    setGoogleLoading(true);
    try {
      const result = await lovable.auth.signInWithOAuth("google", {
        redirect_uri: window.location.origin,
      });
      if (result.error) {
        toast({ title: 'Google sign in failed', description: String(result.error), variant: 'destructive' });
      }
      if (result.redirected) return;
      navigate('/');
    } catch (err: any) {
      toast({ title: 'Google sign in failed', description: err.message, variant: 'destructive' });
    } finally {
      setGoogleLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (mode === 'forgot') {
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: `${window.location.origin}/reset-password`,
        });
        if (error) {
          toast({ title: 'Reset failed', description: error.message, variant: 'destructive' });
        } else {
          toast({
            title: 'Check your email',
            description: 'We sent you a password reset link.',
          });
          setMode('login');
        }
      } else if (mode === 'login') {
        const { error } = await signIn(email, password);
        if (error) {
          toast({
            title: 'Sign in failed',
            description: error.message,
            variant: 'destructive',
          });
        } else {
          toast({
            title: 'Welcome back!',
            description: 'You have successfully signed in.',
          });
          navigate('/');
        }
      } else {
        // First signup → manager. With invite → worker (handled in signUp).
        const role: 'manager' | 'worker' = inviteToken ? 'worker' : 'manager';
        const { error } = await signUp(email, password, fullName, role, inviteToken);
        if (error) {
          toast({ title: 'Sign up failed', description: error.message, variant: 'destructive' });
        } else {
          toast({
            title: 'Account created!',
            description: inviteToken
              ? 'Welcome to Align! Joining your workspace…'
              : 'Welcome to Align! Set up your workspace to get started.',
          });
          navigate(inviteToken ? `/accept-invite?token=${inviteToken}` : '/');
        }
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex">
      {/* Left Panel - Branding (Hidden on mobile) */}
      <div className="hidden lg:flex lg:w-1/2 bg-primary/5 flex-col justify-between p-12">
        <div>
          <AlignLogo size={44} withWordmark wordmarkClassName="text-2xl" />
        </div>
        
        <div className="space-y-8">
          <h1 className="text-4xl font-bold text-foreground leading-tight">
            Workforce scheduling<br />
            <span className="text-primary">made simple.</span>
          </h1>
          <p className="text-lg text-muted-foreground max-w-md">
            Streamline shift management, reduce no-shows, and keep your team aligned with real-time updates.
          </p>
          
          <div className="grid grid-cols-2 gap-4 max-w-md">
            <div className="flex items-start gap-3 p-4 rounded-xl bg-card border border-border/50">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                <Clock className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="font-medium text-foreground">Smart Scheduling</p>
                <p className="text-sm text-muted-foreground">AI-powered shift optimization</p>
              </div>
            </div>
            <div className="flex items-start gap-3 p-4 rounded-xl bg-card border border-border/50">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                <Shield className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="font-medium text-foreground">GPS Check-in</p>
                <p className="text-sm text-muted-foreground">Location-verified attendance</p>
              </div>
            </div>
            <div className="flex items-start gap-3 p-4 rounded-xl bg-card border border-border/50">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                <Users className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="font-medium text-foreground">Team Sync</p>
                <p className="text-sm text-muted-foreground">Real-time collaboration</p>
              </div>
            </div>
            <div className="flex items-start gap-3 p-4 rounded-xl bg-card border border-border/50">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                <Zap className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="font-medium text-foreground">Instant Swaps</p>
                <p className="text-sm text-muted-foreground">One-tap shift trades</p>
              </div>
            </div>
          </div>
        </div>
        
        <p className="text-sm text-muted-foreground">
          © 2024 Align. All rights reserved.
        </p>
      </div>
      
      {/* Right Panel - Auth Form */}
      <div className="flex-1 flex flex-col">
        <header className="p-4 flex justify-end">
          <ThemeToggle />
        </header>
        
        <main className="flex-1 flex items-center justify-center px-6 py-8">
          <div className="w-full max-w-md space-y-8">
            {/* Mobile Logo */}
            <div className="text-center lg:hidden flex flex-col items-center">
              <AlignLogo size={56} />
              <h1 className="text-2xl font-bold text-foreground mt-3 mb-1 tracking-tight">Align</h1>
              <p className="text-sm text-muted-foreground">
                Workforce scheduling made simple
              </p>
            </div>
            
            {/* Form Header */}
            <div className="text-center lg:text-left">
              <h2 className="text-2xl font-bold text-foreground">
                {mode === 'login' ? 'Welcome back' : mode === 'signup' ? 'Create a manager account' : 'Reset your password'}
              </h2>
              <p className="text-muted-foreground mt-1">
                {mode === 'login' 
                  ? 'Sign in to continue to your dashboard' 
                  : mode === 'signup'
                  ? 'Set up your workspace and add your team'
                  : 'Enter your email and we\'ll send a reset link'
                }
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              {mode === 'signup' && (
                <div className="space-y-2">
                  <Label htmlFor="fullName">Full Name</Label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      id="fullName"
                      type="text"
                      placeholder="Your full name"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      className="pl-10 h-12"
                      required
                    />
                  </div>
                </div>
              )}

              {/* Email */}
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-10 h-12"
                    required
                  />
                </div>
              </div>

              {/* Password */}
              {mode !== 'forgot' && (
                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      id="password"
                      type="password"
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="pl-10 h-12"
                      minLength={6}
                      required
                    />
                  </div>
                </div>
              )}

              {/* Forgot password link */}
              {mode === 'login' && (
                <div className="flex justify-end">
                  <button
                    type="button"
                    onClick={() => setMode('forgot')}
                    className="text-sm text-primary hover:text-primary/80 transition-colors font-medium"
                  >
                    Forgot password?
                  </button>
                </div>
              )}

              {/* Submit Button */}
              <Button type="submit" className="w-full h-12 text-base font-semibold" disabled={loading}>
                {loading ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : mode === 'login' ? (
                  'Sign In'
                ) : mode === 'forgot' ? (
                  'Send Reset Link'
                ) : (
                  'Create Manager Account'
                )}
              </Button>

              {/* Google Sign In */}
              {mode !== 'forgot' && (
                <>
                  <div className="flex items-center gap-3">
                    <Separator className="flex-1" />
                    <span className="text-xs text-muted-foreground">or</span>
                    <Separator className="flex-1" />
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full h-12 text-base font-medium gap-3"
                    onClick={handleGoogleSignIn}
                    disabled={googleLoading}
                  >
                    {googleLoading ? (
                      <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                      <svg className="w-5 h-5" viewBox="0 0 24 24">
                        <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4" />
                        <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                        <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                        <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                      </svg>
                    )}
                    Continue with Google
                  </Button>
                </>
              )}

              {/* Toggle Mode */}
              <div className="text-center pt-2 space-y-2">
                {mode === 'forgot' ? (
                  <button
                    type="button"
                    onClick={() => setMode('login')}
                    className="text-sm text-muted-foreground hover:text-primary transition-colors inline-flex items-center gap-1"
                  >
                    <ArrowLeft className="w-3 h-3" />
                    Back to sign in
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => setMode(mode === 'login' ? 'signup' : 'login')}
                    className="text-sm text-muted-foreground hover:text-primary transition-colors"
                  >
                    {mode === 'login'
                      ? "Don't have an account? "
                      : 'Already have an account? '}
                    <span className="text-primary font-medium">
                      {mode === 'login' ? 'Sign up as Manager' : 'Sign in'}
                    </span>
                  </button>
                )}
              </div>

              {mode === 'signup' && (
                <p className="text-xs text-center text-muted-foreground">
                  Workers are added by managers from the Team page. Only managers can create accounts here.
                </p>
              )}
            </form>
          </div>
        </main>

        {/* Footer */}
        <footer className="p-6 text-center lg:hidden">
          <p className="text-xs text-muted-foreground">
            "Everything is under control — even when it isn't."
          </p>
        </footer>
      </div>
    </div>
  );
};

export default Auth;
