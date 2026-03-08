import { motion } from 'framer-motion';
import { CheckCircle2 } from 'lucide-react';

const benefits = [
  'Reduce no-shows with automated reminders',
  'Cut scheduling time by 80%',
  'Empower workers with self-service swaps',
  'Real-time visibility into staffing levels',
];

const staggerContainer = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.08 } },
};

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.1, duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] as [number, number, number, number] },
  }),
};

export const BenefitsStrip = () => (
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
);
