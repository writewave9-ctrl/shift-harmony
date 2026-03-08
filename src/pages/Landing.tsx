import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ThemeToggle } from '@/components/ThemeToggle';
import { 
  Calendar, 
  Clock, 
  Users, 
  Shield, 
  ArrowRight, 
  CheckCircle2,
  Smartphone,
  BarChart3,
  Bell,
} from 'lucide-react';

const features = [
  {
    icon: Calendar,
    title: 'Smart Scheduling',
    description: 'Create and manage shifts with templates, drag-and-drop, and auto-fill.',
  },
  {
    icon: Clock,
    title: 'Real-Time Attendance',
    description: 'GPS-based check-in with proximity verification and live tracking.',
  },
  {
    icon: Users,
    title: 'Team Management',
    description: 'Invite workers, manage roles, and handle swap requests seamlessly.',
  },
  {
    icon: Bell,
    title: 'Push Notifications',
    description: 'Instant alerts for shift changes, reminders, and approvals.',
  },
  {
    icon: BarChart3,
    title: 'Analytics Dashboard',
    description: 'Track hours, attendance patterns, and workforce utilization.',
  },
  {
    icon: Smartphone,
    title: 'Mobile-First PWA',
    description: 'Works offline. Install on any device — no app store needed.',
  },
];

const benefits = [
  'Reduce no-shows with automated reminders',
  'Cut scheduling time by 80%',
  'Empower workers with self-service swaps',
  'Real-time visibility into staffing levels',
];

export const Landing = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Nav */}
      <nav className="sticky top-0 z-50 bg-background/80 backdrop-blur-xl border-b border-border/40">
        <div className="max-w-6xl mx-auto px-5 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center shadow-sm">
              <span className="text-sm font-bold text-primary-foreground">A</span>
            </div>
            <span className="text-lg font-semibold tracking-tight">Align</span>
          </div>
          <div className="flex items-center gap-3">
            <ThemeToggle />
            <Button 
              variant="ghost" 
              size="sm"
              onClick={() => navigate('/auth')}
              className="text-sm"
            >
              Sign in
            </Button>
            <Button 
              size="sm"
              onClick={() => navigate('/auth')}
              className="rounded-xl text-sm"
            >
              Get Started
            </Button>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-primary/5 via-transparent to-transparent" />
        <div className="max-w-4xl mx-auto px-5 pt-20 pb-16 text-center relative">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 text-primary text-xs font-medium mb-8">
            <Shield className="w-3.5 h-3.5" />
            Built for reliability
          </div>
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold tracking-tight leading-[1.1] mb-6">
            Workforce scheduling
            <br />
            <span className="text-primary">made simple</span>
          </h1>
          <p className="text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto mb-10 leading-relaxed">
            Align helps teams coordinate shifts, track attendance, and stay connected — 
            all from a single, beautiful interface.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <Button 
              size="lg" 
              onClick={() => navigate('/auth')}
              className="rounded-xl px-8 h-12 text-base gap-2 shadow-lg shadow-primary/20"
            >
              Start for free
              <ArrowRight className="w-4 h-4" />
            </Button>
            <Button 
              variant="outline" 
              size="lg"
              onClick={() => navigate('/demo')}
              className="rounded-xl px-8 h-12 text-base"
            >
              View demo
            </Button>
          </div>
        </div>
      </section>

      {/* Benefits strip */}
      <section className="border-y border-border/40 bg-card/50">
        <div className="max-w-5xl mx-auto px-5 py-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {benefits.map((benefit) => (
              <div key={benefit} className="flex items-start gap-2.5">
                <CheckCircle2 className="w-5 h-5 text-success flex-shrink-0 mt-0.5" />
                <span className="text-sm text-foreground font-medium">{benefit}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-20">
        <div className="max-w-6xl mx-auto px-5">
          <div className="text-center mb-14">
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight mb-4">
              Everything your team needs
            </h2>
            <p className="text-muted-foreground text-lg max-w-xl mx-auto">
              From scheduling to analytics, Align covers the full workforce management lifecycle.
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature) => (
              <div 
                key={feature.title}
                className="group p-6 rounded-2xl border border-border/50 bg-card hover:shadow-lg hover:border-primary/20 transition-all duration-300"
              >
                <div className="w-11 h-11 rounded-xl bg-primary/10 flex items-center justify-center mb-4 group-hover:bg-primary/15 transition-colors">
                  <feature.icon className="w-5 h-5 text-primary" />
                </div>
                <h3 className="font-semibold text-foreground mb-2">{feature.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20">
        <div className="max-w-3xl mx-auto px-5">
          <div className="rounded-3xl bg-gradient-to-br from-primary/10 via-primary/5 to-accent/50 border border-primary/10 p-10 sm:p-14 text-center">
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight mb-4">
              Ready to align your team?
            </h2>
            <p className="text-muted-foreground text-lg mb-8 max-w-lg mx-auto">
              Join teams who trust Align to keep their workforce organized and connected.
            </p>
            <Button 
              size="lg"
              onClick={() => navigate('/auth')}
              className="rounded-xl px-10 h-12 text-base gap-2 shadow-lg shadow-primary/20"
            >
              Get started now
              <ArrowRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border/40 py-8">
        <div className="max-w-6xl mx-auto px-5 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center">
              <span className="text-xs font-bold text-primary">A</span>
            </div>
            <span className="text-sm text-muted-foreground">© 2026 Align. All rights reserved.</span>
          </div>
          <div className="flex items-center gap-6 text-sm text-muted-foreground">
            <button className="hover:text-foreground transition-colors">Privacy</button>
            <button className="hover:text-foreground transition-colors">Terms</button>
            <button className="hover:text-foreground transition-colors">Support</button>
          </div>
        </div>
      </footer>
    </div>
  );
};
