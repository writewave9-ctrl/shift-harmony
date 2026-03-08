import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
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
  Check,
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

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.1, duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] as [number, number, number, number] },
  }),
};

const staggerContainer = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.08 } },
};

const cardVariant = {
  hidden: { opacity: 0, y: 20, scale: 0.97 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { duration: 0.4, ease: 'easeOut' as const },
  },
};

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
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, ease: 'easeOut' }}
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 text-primary text-xs font-medium mb-8"
          >
            <Shield className="w-3.5 h-3.5" />
            Built for reliability
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.15, ease: [0.25, 0.46, 0.45, 0.94] }}
            className="text-4xl sm:text-5xl md:text-6xl font-bold tracking-tight leading-[1.1] mb-6"
          >
            Workforce scheduling
            <br />
            <span className="text-primary">made simple</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto mb-10 leading-relaxed"
          >
            Align helps teams coordinate shifts, track attendance, and stay connected — 
            all from a single, beautiful interface.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.45 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-3"
          >
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
          </motion.div>
        </div>
      </section>

      {/* Benefits strip */}
      <motion.section
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true, margin: '-50px' }}
        transition={{ duration: 0.5 }}
        className="border-y border-border/40 bg-card/50"
      >
        <div className="max-w-5xl mx-auto px-5 py-8">
          <motion.div
            variants={staggerContainer}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4"
          >
            {benefits.map((benefit, i) => (
              <motion.div key={benefit} variants={fadeUp} custom={i} className="flex items-start gap-2.5">
                <CheckCircle2 className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                <span className="text-sm text-foreground font-medium">{benefit}</span>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </motion.section>

      {/* Features */}
      <section className="py-20">
        <div className="max-w-6xl mx-auto px-5">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-80px' }}
            transition={{ duration: 0.5 }}
            className="text-center mb-14"
          >
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight mb-4">
              Everything your team needs
            </h2>
            <p className="text-muted-foreground text-lg max-w-xl mx-auto">
              From scheduling to analytics, Align covers the full workforce management lifecycle.
            </p>
          </motion.div>

          <motion.div
            variants={staggerContainer}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-60px' }}
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6"
          >
            {features.map((feature) => (
              <motion.div 
                key={feature.title}
                variants={cardVariant}
                whileHover={{ y: -4, transition: { duration: 0.2 } }}
                className="group p-6 rounded-2xl border border-border/50 bg-card hover:shadow-lg hover:border-primary/20 transition-shadow duration-300"
              >
                <div className="w-11 h-11 rounded-xl bg-primary/10 flex items-center justify-center mb-4 group-hover:bg-primary/15 transition-colors">
                  <feature.icon className="w-5 h-5 text-primary" />
                </div>
                <h3 className="font-semibold text-foreground mb-2">{feature.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{feature.description}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Pricing */}
      <section className="py-20 bg-card/30">
        <div className="max-w-6xl mx-auto px-5">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-80px' }}
            transition={{ duration: 0.5 }}
            className="text-center mb-14"
          >
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight mb-4">
              Simple, transparent pricing
            </h2>
            <p className="text-muted-foreground text-lg max-w-xl mx-auto">
              Start free and scale as your team grows. No hidden fees.
            </p>
          </motion.div>

          <motion.div
            variants={staggerContainer}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-60px' }}
            className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto"
          >
            {/* Free */}
            <motion.div
              variants={cardVariant}
              className="rounded-2xl border border-border/50 bg-card p-8 flex flex-col"
            >
              <h3 className="text-lg font-semibold mb-1">Starter</h3>
              <p className="text-sm text-muted-foreground mb-5">For small teams getting started</p>
              <div className="mb-6">
                <span className="text-4xl font-bold">$0</span>
                <span className="text-muted-foreground text-sm ml-1">/month</span>
              </div>
              <ul className="space-y-3 mb-8 flex-1">
                {['Up to 5 workers', 'Basic scheduling', 'Push notifications', 'Mobile PWA access'].map((item) => (
                  <li key={item} className="flex items-start gap-2.5 text-sm">
                    <Check className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
              <Button
                variant="outline"
                onClick={() => navigate('/auth')}
                className="rounded-xl w-full"
              >
                Get started free
              </Button>
            </motion.div>

            {/* Pro — highlighted */}
            <motion.div
              variants={cardVariant}
              className="rounded-2xl border-2 border-primary bg-card p-8 flex flex-col relative shadow-lg shadow-primary/10"
            >
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 rounded-full bg-primary text-primary-foreground text-xs font-semibold">
                Most popular
              </div>
              <h3 className="text-lg font-semibold mb-1">Pro</h3>
              <p className="text-sm text-muted-foreground mb-5">For growing teams that need more</p>
              <div className="mb-6">
                <span className="text-4xl font-bold">$29</span>
                <span className="text-muted-foreground text-sm ml-1">/month</span>
              </div>
              <ul className="space-y-3 mb-8 flex-1">
                {['Up to 50 workers', 'Shift templates & auto-fill', 'GPS check-in verification', 'Analytics dashboard', 'Swap & call-off management'].map((item) => (
                  <li key={item} className="flex items-start gap-2.5 text-sm">
                    <Check className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
              <Button
                onClick={() => navigate('/auth')}
                className="rounded-xl w-full shadow-lg shadow-primary/20"
              >
                Start free trial
              </Button>
            </motion.div>

            {/* Enterprise */}
            <motion.div
              variants={cardVariant}
              className="rounded-2xl border border-border/50 bg-card p-8 flex flex-col"
            >
              <h3 className="text-lg font-semibold mb-1">Enterprise</h3>
              <p className="text-sm text-muted-foreground mb-5">For large organizations</p>
              <div className="mb-6">
                <span className="text-4xl font-bold">$99</span>
                <span className="text-muted-foreground text-sm ml-1">/month</span>
              </div>
              <ul className="space-y-3 mb-8 flex-1">
                {['Unlimited workers', 'Multi-team support', 'Advanced analytics & reports', 'Priority support', 'Custom integrations'].map((item) => (
                  <li key={item} className="flex items-start gap-2.5 text-sm">
                    <Check className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
              <Button
                variant="outline"
                onClick={() => navigate('/auth')}
                className="rounded-xl w-full"
              >
                Contact sales
              </Button>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-20">
        <div className="max-w-3xl mx-auto px-5">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-80px' }}
            transition={{ duration: 0.5 }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight mb-4">
              Frequently asked questions
            </h2>
            <p className="text-muted-foreground text-lg">
              Everything you need to know about Align.
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-60px' }}
            transition={{ duration: 0.5, delay: 0.1 }}
          >
            <Accordion type="single" collapsible className="space-y-3">
              {[
                {
                  q: 'How does GPS check-in work?',
                  a: "Workers check in from their phone when they arrive at a shift location. Align uses GPS proximity verification to confirm they\u2019re within the configured radius, giving managers real-time attendance visibility.",
                },
                {
                  q: 'Can workers swap shifts with each other?',
                  a: 'Yes! Workers can request shift swaps directly in the app. Depending on your team settings, swaps can be auto-approved or require manager approval before they take effect.',
                },
                {
                  q: 'Is Align available as a mobile app?',
                  a: 'Align is a Progressive Web App (PWA), which means it works in any browser and can be installed on any device — no app store download required. It even works offline.',
                },
                {
                  q: 'How do shift templates work?',
                  a: 'Managers can create reusable shift templates with pre-set times, locations, and positions. Apply a template to quickly generate shifts for the week — cutting scheduling time by up to 80%.',
                },
                {
                  q: 'What happens if a worker calls off?',
                  a: 'Workers can submit call-off requests with a reason. Managers are notified instantly, and the shift is automatically marked as vacant so it can be reassigned or posted as an open shift.',
                },
                {
                  q: 'Can I try Align before committing?',
                  a: 'Absolutely. The Starter plan is free forever for teams of up to 5 workers. No credit card required — just sign up and start scheduling.',
                },
              ].map((faq, i) => (
                <AccordionItem
                  key={i}
                  value={`faq-${i}`}
                  className="rounded-xl border border-border/50 bg-card px-6 data-[state=open]:shadow-sm"
                >
                  <AccordionTrigger className="text-left text-sm font-medium py-5 hover:no-underline">
                    {faq.q}
                  </AccordionTrigger>
                  <AccordionContent className="text-sm text-muted-foreground pb-5 leading-relaxed">
                    {faq.a}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </motion.div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20">
        <div className="max-w-3xl mx-auto px-5">
          <motion.div
            initial={{ opacity: 0, scale: 0.96 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true, margin: '-80px' }}
            transition={{ duration: 0.5 }}
            className="rounded-3xl bg-gradient-to-br from-primary/10 via-primary/5 to-accent/50 border border-primary/10 p-10 sm:p-14 text-center"
          >
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
          </motion.div>
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
