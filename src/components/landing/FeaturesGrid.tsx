import { motion } from 'framer-motion';
import { Calendar, Clock, Users, Bell, BarChart3, Smartphone } from 'lucide-react';

const features = [
  { icon: Calendar, title: 'Smart Scheduling', description: 'Create and manage shifts with templates, drag-and-drop, and auto-fill.' },
  { icon: Clock, title: 'Real-Time Attendance', description: 'GPS-based check-in with proximity verification and live tracking.' },
  { icon: Users, title: 'Team Management', description: 'Invite workers, manage roles, and handle swap requests seamlessly.' },
  { icon: Bell, title: 'Push Notifications', description: 'Instant alerts for shift changes, reminders, and approvals.' },
  { icon: BarChart3, title: 'Analytics Dashboard', description: 'Track hours, attendance patterns, and workforce utilization.' },
  { icon: Smartphone, title: 'Mobile-First PWA', description: 'Works offline. Install on any device — no app store needed.' },
];

const staggerContainer = { hidden: {}, visible: { transition: { staggerChildren: 0.08 } } };
const cardVariant = {
  hidden: { opacity: 0, y: 20, scale: 0.97 },
  visible: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.4, ease: 'easeOut' as const } },
};

export const FeaturesGrid = () => (
  <section id="features" className="py-20">
    <div className="max-w-6xl mx-auto px-5">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: '-80px' }}
        transition={{ duration: 0.5 }}
        className="text-center mb-14"
      >
        <h2 className="text-3xl sm:text-4xl font-bold tracking-tight mb-4">Everything your team needs</h2>
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
);
