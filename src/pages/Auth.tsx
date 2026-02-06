import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Users, UserCog, Loader2, Mail, Lock, User, Clock, Shield, Zap } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from '@/hooks/use-toast';
import { ThemeToggle } from '@/components/ThemeToggle';

type AuthMode = 'login' | 'signup';
type Role = 'worker' | 'manager';

export const Auth = () => {
  const navigate = useNavigate();
  const { signIn, signUp } = useAuth();
  
  const [mode, setMode] = useState<AuthMode>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [selectedRole, setSelectedRole] = useState<Role>('worker');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (mode === 'login') {
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
        const { error } = await signUp(email, password, fullName, selectedRole);
        if (error) {
          toast({
            title: 'Sign up failed',
            description: error.message,
            variant: 'destructive',
          });
        } else {
          toast({
            title: 'Account created!',
            description: 'Welcome to Align! Let\'s get started.',
          });
          navigate('/');
        }
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-accent/20 flex">
      {/* Left Panel - Branding (Hidden on mobile) */}
      <div className="hidden lg:flex lg:w-1/2 bg-primary/5 flex-col justify-between p-12">
        <div>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-primary flex items-center justify-center">
              <span className="text-xl font-bold text-primary-foreground">A</span>
            </div>
            <span className="text-2xl font-bold text-foreground">Align</span>
          </div>
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
              <div className="w-10 h-10 rounded-lg bg-success/10 flex items-center justify-center flex-shrink-0">
                <Shield className="w-5 h-5 text-success" />
              </div>
              <div>
                <p className="font-medium text-foreground">GPS Check-in</p>
                <p className="text-sm text-muted-foreground">Location-verified attendance</p>
              </div>
            </div>
            <div className="flex items-start gap-3 p-4 rounded-xl bg-card border border-border/50">
              <div className="w-10 h-10 rounded-lg bg-info/10 flex items-center justify-center flex-shrink-0">
                <Users className="w-5 h-5 text-info" />
              </div>
              <div>
                <p className="font-medium text-foreground">Team Sync</p>
                <p className="text-sm text-muted-foreground">Real-time collaboration</p>
              </div>
            </div>
            <div className="flex items-start gap-3 p-4 rounded-xl bg-card border border-border/50">
              <div className="w-10 h-10 rounded-lg bg-warning/10 flex items-center justify-center flex-shrink-0">
                <Zap className="w-5 h-5 text-warning" />
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
            <div className="text-center lg:hidden">
              <div className="w-16 h-16 mx-auto rounded-2xl bg-primary flex items-center justify-center mb-4">
                <span className="text-2xl font-bold text-primary-foreground">A</span>
              </div>
              <h1 className="text-2xl font-bold text-foreground mb-1">Align</h1>
              <p className="text-sm text-muted-foreground">
                Workforce scheduling made simple
              </p>
            </div>
            
            {/* Form Header */}
            <div className="text-center lg:text-left">
              <h2 className="text-2xl font-bold text-foreground">
                {mode === 'login' ? 'Welcome back' : 'Create your account'}
              </h2>
              <p className="text-muted-foreground mt-1">
                {mode === 'login' 
                  ? 'Sign in to continue to your dashboard' 
                  : 'Get started with Align in seconds'
                }
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              {mode === 'signup' && (
                <>
                  {/* Role Selection */}
                  <div className="space-y-3">
                    <Label className="text-sm font-medium">I am a...</Label>
                    <div className="grid grid-cols-2 gap-3">
                      <button
                        type="button"
                        onClick={() => setSelectedRole('worker')}
                        className={cn(
                          'p-4 rounded-xl border-2 transition-all duration-200 text-left group',
                          selectedRole === 'worker'
                            ? 'border-primary bg-primary/5 shadow-sm'
                            : 'border-border hover:border-primary/50 hover:bg-accent/50'
                        )}
                      >
                        <div className={cn(
                          "w-10 h-10 rounded-lg flex items-center justify-center mb-3 transition-colors",
                          selectedRole === 'worker' ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground group-hover:bg-primary/10 group-hover:text-primary'
                        )}>
                          <Users className="w-5 h-5" />
                        </div>
                        <p className="font-semibold text-foreground">Worker</p>
                        <p className="text-xs text-muted-foreground mt-0.5">View & manage my shifts</p>
                      </button>
                      <button
                        type="button"
                        onClick={() => setSelectedRole('manager')}
                        className={cn(
                          'p-4 rounded-xl border-2 transition-all duration-200 text-left group',
                          selectedRole === 'manager'
                            ? 'border-primary bg-primary/5 shadow-sm'
                            : 'border-border hover:border-primary/50 hover:bg-accent/50'
                        )}
                      >
                        <div className={cn(
                          "w-10 h-10 rounded-lg flex items-center justify-center mb-3 transition-colors",
                          selectedRole === 'manager' ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground group-hover:bg-primary/10 group-hover:text-primary'
                        )}>
                          <UserCog className="w-5 h-5" />
                        </div>
                        <p className="font-semibold text-foreground">Manager</p>
                        <p className="text-xs text-muted-foreground mt-0.5">Oversee team & scheduling</p>
                      </button>
                    </div>
                  </div>

                  {/* Full Name */}
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
                </>
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

              {/* Submit Button */}
              <Button type="submit" className="w-full h-12 text-base font-semibold" disabled={loading}>
                {loading ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : mode === 'login' ? (
                  'Sign In'
                ) : (
                  'Create Account'
                )}
              </Button>

              {/* Toggle Mode */}
              <div className="text-center pt-2">
                <button
                  type="button"
                  onClick={() => setMode(mode === 'login' ? 'signup' : 'login')}
                  className="text-sm text-muted-foreground hover:text-primary transition-colors"
                >
                  {mode === 'login'
                    ? "Don't have an account? "
                    : 'Already have an account? '}
                  <span className="text-primary font-medium">
                    {mode === 'login' ? 'Sign up' : 'Sign in'}
                  </span>
                </button>
              </div>
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
