import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Check } from 'lucide-react';

const staggerContainer = { hidden: {}, visible: { transition: { staggerChildren: 0.08 } } };
const cardVariant = {
  hidden: { opacity: 0, y: 20, scale: 0.97 },
  visible: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.4, ease: 'easeOut' as const } },
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
  },
  {
    name: 'Pro',
    desc: 'For growing teams that need more',
    price: '$29',
    features: ['Up to 50 workers', 'Shift templates & auto-fill', 'GPS check-in verification', 'Analytics dashboard', 'Swap & call-off management'],
    cta: 'Start free trial',
    variant: 'default' as const,
    highlight: true,
  },
  {
    name: 'Enterprise',
    desc: 'For large organizations',
    price: '$99',
    features: ['Unlimited workers', 'Multi-team support', 'Advanced analytics & reports', 'Priority support', 'Custom integrations'],
    cta: 'Contact sales',
    variant: 'outline' as const,
    highlight: false,
  },
];

export const PricingSection = () => {
  const navigate = useNavigate();

  return (
    <section id="pricing" className="py-20">
      <div className="max-w-6xl mx-auto px-5">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-80px' }}
          transition={{ duration: 0.5 }}
          className="text-center mb-14"
        >
          <h2 className="text-3xl sm:text-4xl font-bold tracking-tight mb-4">Simple, transparent pricing</h2>
          <p className="text-muted-foreground text-lg max-w-xl mx-auto">Start free and scale as your team grows. No hidden fees.</p>
        </motion.div>

        <motion.div
          variants={staggerContainer}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-60px' }}
          className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto"
        >
          {plans.map((plan) => (
            <motion.div
              key={plan.name}
              variants={cardVariant}
              className={`rounded-2xl p-8 flex flex-col relative ${
                plan.highlight
                  ? 'border-2 border-primary bg-card shadow-lg shadow-primary/10'
                  : 'border border-border/50 bg-card'
              }`}
            >
              {plan.highlight && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 rounded-full bg-primary text-primary-foreground text-xs font-semibold">
                  Most popular
                </div>
              )}
              <h3 className="text-lg font-semibold mb-1">{plan.name}</h3>
              <p className="text-sm text-muted-foreground mb-5">{plan.desc}</p>
              <div className="mb-6">
                <span className="text-4xl font-bold">{plan.price}</span>
                <span className="text-muted-foreground text-sm ml-1">/month</span>
              </div>
              <ul className="space-y-3 mb-8 flex-1">
                {plan.features.map((item) => (
                  <li key={item} className="flex items-start gap-2.5 text-sm">
                    <Check className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
              <Button
                variant={plan.variant}
                onClick={() => navigate('/auth')}
                className={`rounded-xl w-full ${plan.highlight ? 'shadow-lg shadow-primary/20' : ''}`}
              >
                {plan.cta}
              </Button>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
};
