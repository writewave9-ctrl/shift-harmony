import { motion } from 'framer-motion';
import { Calendar, Clock, Users, Bell, BarChart3, Smartphone } from 'lucide-react';

const features = [
  { icon: Calendar, title: 'Smart scheduling', description: 'Templates, drag-and-drop calendar, and one-click auto-fill for empty shifts.' },
  { icon: Clock, title: 'Real-time attendance', description: 'GPS-verified check-in with proximity guards and live status updates.' },
  { icon: Users, title: 'Team coordination', description: 'Invite, assign, and handle swap or call-off requests in a single thread.' },
  { icon: Bell, title: 'Push notifications', description: 'Native web push for shift changes, reminders, and approvals.' },
  { icon: BarChart3, title: 'Workforce analytics', description: 'Track coverage, attendance patterns, and reliability over time.' },
  { icon: Smartphone, title: 'Installable PWA', description: 'Works offline, installs to the home screen, no app store required.' },
];

const staggerContainer = { hidden: {}, visible: { transition: { staggerChildren: 0.07 } } };
const cardVariant = {
  hidden: { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: 'easeOut' as const } },
};

export const FeaturesGrid = () => (
  <section id="features" className="py-24 relative">
    <div className="max-w-6xl mx-auto px-5">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: '-80px' }}
        transition={{ duration: 0.6 }}
        className="text-center mb-16 max-w-2xl mx-auto"
      >
        <span className="inline-flex items-center gap-1.5 text-[11px] uppercase tracking-[0.18em] font-semibold text-primary mb-4">
          <span className="w-6 h-px bg-primary/40" /> Features <span className="w-6 h-px bg-primary/40" />
        </span>
        <h2 className="font-display text-4xl sm:text-5xl font-semibold tracking-tight mb-4">
          Everything your team
          <span className="italic text-primary"> actually needs.</span>
        </h2>
        <p className="text-muted-foreground text-lg leading-relaxed">
          From the first invite to the last shift of the month — one calm interface
          for every person on your roster.
        </p>
      </motion.div>

      <motion.div
        variants={staggerContainer}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: '-60px' }}
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4"
      >
        {features.map((feature) => (
          <motion.div
            key={feature.title}
            variants={cardVariant}
            whileHover={{ y: -3, transition: { duration: 0.2 } }}
            className="group relative p-7 rounded-2xl border border-border/50 bg-card/70 backdrop-blur-sm hover:bg-card hover:border-primary/25 hover:shadow-elevated transition-all duration-300 overflow-hidden"
          >
            <div className="absolute inset-x-0 -top-px h-px bg-gradient-to-r from-transparent via-primary/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
            <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-primary/15 to-primary/5 ring-1 ring-primary/15 flex items-center justify-center mb-5 group-hover:scale-105 transition-transform">
              <feature.icon className="w-5 h-5 text-primary" strokeWidth={1.75} />
            </div>
            <h3 className="font-display text-lg font-semibold text-foreground mb-1.5 tracking-tight">
              {feature.title}
            </h3>
            <p className="text-[13.5px] text-muted-foreground leading-relaxed">
              {feature.description}
            </p>
          </motion.div>
        ))}
      </motion.div>
    </div>
  </section>
);
