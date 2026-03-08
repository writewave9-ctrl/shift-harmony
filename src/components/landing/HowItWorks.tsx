import { motion } from 'framer-motion';
import { CalendarPlus, BellRing, Activity } from 'lucide-react';

const steps = [
  { icon: CalendarPlus, step: '01', title: 'Create shifts', description: 'Build your schedule in minutes using templates or from scratch.' },
  { icon: BellRing, step: '02', title: 'Workers get notified', description: 'Your team receives instant push notifications with shift details.' },
  { icon: Activity, step: '03', title: 'Track in real-time', description: 'Monitor check-ins, swaps, and attendance as it happens.' },
];

const staggerContainer = { hidden: {}, visible: { transition: { staggerChildren: 0.08 } } };
const cardVariant = {
  hidden: { opacity: 0, y: 20, scale: 0.97 },
  visible: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.4, ease: 'easeOut' as const } },
};

export const HowItWorks = () => (
  <section className="py-20 bg-card/30">
    <div className="max-w-5xl mx-auto px-5">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: '-80px' }}
        transition={{ duration: 0.5 }}
        className="text-center mb-14"
      >
        <h2 className="text-3xl sm:text-4xl font-bold tracking-tight mb-4">How it works</h2>
        <p className="text-muted-foreground text-lg max-w-xl mx-auto">Get your team aligned in three simple steps.</p>
      </motion.div>

      <motion.div
        variants={staggerContainer}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: '-60px' }}
        className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-6 relative"
      >
        <div className="hidden md:block absolute top-16 left-[calc(33.33%+12px)] right-[calc(33.33%+12px)] h-px bg-border" />
        {steps.map((step) => (
          <motion.div key={step.step} variants={cardVariant} className="flex flex-col items-center text-center">
            <div className="relative mb-5">
              <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center">
                <step.icon className="w-6 h-6 text-primary" />
              </div>
              <span className="absolute -top-2 -right-2 w-7 h-7 rounded-full bg-primary text-primary-foreground text-xs font-bold flex items-center justify-center shadow-sm">
                {step.step}
              </span>
            </div>
            <h3 className="font-semibold text-foreground mb-2 text-lg">{step.title}</h3>
            <p className="text-sm text-muted-foreground leading-relaxed max-w-xs">{step.description}</p>
          </motion.div>
        ))}
      </motion.div>
    </div>
  </section>
);
