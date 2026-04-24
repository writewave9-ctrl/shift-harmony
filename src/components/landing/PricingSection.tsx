import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Check, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';

const staggerContainer = { hidden: {}, visible: { transition: { staggerChildren: 0.08 } } };
const cardVariant = {
  hidden: { opacity: 0, y: 24, scale: 0.97 },
  visible: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.5, ease: 'easeOut' as const } },
};

const plans = [
  {
    name: 'Starter',
    desc: 'For small teams getting started',
    price: '$0',
    features: ['Up to 5 workers', 'Basic scheduling', 'Push notifications', 'Mobile PWA access'],
    cta: 'Get started free',
    variant: 'outline' as const,
    highlight: false,
    plan: 'starter',
  },
  {
    name: 'Pro',
    desc: 'For growing teams that need more',
    price: '$29',
    features: [
      'Up to 50 workers',
      'Shift templates & auto-fill',
      'GPS check-in verification',
      'Analytics dashboard',
      'Swap & call-off management',
    ],
    cta: 'Start free trial',
    variant: 'default' as const,
    highlight: true,
    plan: 'pro',
  },
  {
    name: 'Enterprise',
    desc: 'For large organizations',
    price: '$99',
    features: [
      'Unlimited workers',
      'Multi-team support',
      'Advanced analytics & reports',
      'Priority support',
      'Dedicated onboarding',
    ],
    cta: 'Contact sales',
    variant: 'outline' as const,
    highlight: false,
    plan: 'enterprise',
  },
];

const ctaHref = (planKey?: string) => {
  if (planKey === 'enterprise') return 'mailto:hello@align.app?subject=Align%20Enterprise%20inquiry';
  return planKey ? `/auth?plan=${planKey}` : '/auth';
};

export const PricingSection = () => {
  const navigate = useNavigate();

  return (
    <section id="pricing" className="py-24 relative overflow-hidden">
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-border to-transparent" />
      <div className="max-w-6xl mx-auto px-5">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-80px' }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <span className="inline-flex items-center gap-1.5 text-[11px] uppercase tracking-[0.18em] font-semibold text-primary mb-4">
            <span className="w-6 h-px bg-primary/40" /> Pricing <span className="w-6 h-px bg-primary/40" />
          </span>
          <h2 className="font-display text-4xl sm:text-5xl font-semibold tracking-tight mb-4">
            Honest pricing,
            <span className="italic text-primary"> no surprises.</span>
          </h2>
          <p className="text-muted-foreground text-lg max-w-xl mx-auto">
            Start free, upgrade when you need more. Switch tiers any time.
          </p>
        </motion.div>

        <motion.div
          variants={staggerContainer}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-60px' }}
          className="grid grid-cols-1 md:grid-cols-3 gap-5 max-w-5xl mx-auto"
        >
          {plans.map((plan) => (
            <motion.div
              key={plan.name}
              variants={cardVariant}
              className={cn(
                'rounded-3xl p-7 flex flex-col relative transition-all duration-300',
                plan.highlight
                  ? 'border border-primary/30 bg-gradient-to-b from-card to-accent/30 shadow-luxe md:-mt-3 md:mb-0'
                  : 'border border-border/60 bg-card/60 backdrop-blur-sm hover:border-primary/20 hover:shadow-elevated',
              )}
            >
              {plan.highlight && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 inline-flex items-center gap-1 px-3 py-1 rounded-full bg-gradient-primary text-primary-foreground text-[10px] font-semibold uppercase tracking-wider shadow-elevated">
                  <Sparkles className="w-3 h-3" /> Most popular
                </div>
              )}
              <h3 className="font-display text-2xl font-semibold mb-1.5">{plan.name}</h3>
              <p className="text-sm text-muted-foreground mb-6">{plan.desc}</p>
              <div className="mb-7 flex items-baseline gap-1">
                <span className="font-display text-5xl font-semibold tracking-tight">{plan.price}</span>
                <span className="text-muted-foreground text-sm">/month</span>
              </div>
              <ul className="space-y-3 mb-8 flex-1">
                {plan.features.map((item) => (
                  <li key={item} className="flex items-start gap-2.5 text-[13.5px]">
                    <span
                      className={cn(
                        'mt-0.5 inline-flex items-center justify-center w-4 h-4 rounded-full flex-shrink-0',
                        plan.highlight ? 'bg-primary text-primary-foreground' : 'bg-accent text-primary',
                      )}
                    >
                      <Check className="w-2.5 h-2.5" strokeWidth={3} />
                    </span>
                    <span className="leading-snug">{item}</span>
                  </li>
                ))}
              </ul>
              <Button
                variant={plan.variant}
                onClick={() => {
                  const href = ctaHref(plan.plan);
                  if (href.startsWith('mailto:')) window.location.href = href;
                  else navigate(href);
                }}
                className={cn(
                  'rounded-xl w-full h-11 text-[14px]',
                  plan.highlight && 'bg-gradient-primary shadow-elevated hover:shadow-floating',
                )}
              >
                {plan.cta}
              </Button>
            </motion.div>
          ))}
        </motion.div>

        <p className="text-center text-xs text-muted-foreground mt-10">
          Billing is launching soon — switching tiers is free for early teams.
        </p>
      </div>
    </section>
  );
};
