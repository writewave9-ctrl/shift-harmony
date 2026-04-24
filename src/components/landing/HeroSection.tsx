import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Sparkles, ArrowRight } from 'lucide-react';

const scrollTo = (id: string) => {
  document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
};

export const HeroSection = () => {
  const navigate = useNavigate();

  return (
    <section className="relative overflow-hidden">
      {/* Layered ambient mesh */}
      <div className="absolute inset-0 bg-gradient-mesh pointer-events-none" />
      <div className="absolute inset-0 bg-gradient-hero pointer-events-none" />
      {/* Subtle grain via radial dots */}
      <div
        className="absolute inset-0 opacity-[0.025] pointer-events-none"
        style={{
          backgroundImage:
            'radial-gradient(hsl(var(--foreground)) 1px, transparent 1px)',
          backgroundSize: '24px 24px',
        }}
      />

      <div className="max-w-5xl mx-auto px-5 pt-24 pb-20 text-center relative">
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
          className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-primary/20 bg-card/60 backdrop-blur-md text-primary text-xs font-medium mb-9 shadow-soft"
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span>Built for frontline reliability</span>
          <span className="w-1 h-1 rounded-full bg-primary/40" />
          <span className="text-foreground/70">v2.0 — call-offs &amp; auto-fill</span>
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
          className="font-display text-[2.75rem] sm:text-6xl md:text-7xl font-semibold tracking-[-0.025em] leading-[1.02] mb-7"
        >
          Every shift,
          <br />
          <span className="italic text-primary">in alignment.</span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto mb-11 leading-relaxed"
        >
          Align orchestrates schedules, attendance, and last-minute coverage so
          your team always knows who&rsquo;s on and what&rsquo;s next.
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
            className="group rounded-xl px-7 h-12 text-[15px] gap-2 bg-gradient-primary shadow-luxe hover:shadow-floating transition-all duration-300"
          >
            Start free
            <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5" />
          </Button>
          <Button
            variant="ghost"
            size="lg"
            onClick={() => scrollTo('features')}
            className="rounded-xl px-7 h-12 text-[15px] hover:bg-card/80"
          >
            See how it works
          </Button>
        </motion.div>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.7 }}
          className="mt-8 text-xs text-muted-foreground"
        >
          No credit card · Free for teams up to 5 · Live in under a minute
        </motion.p>
      </div>
    </section>
  );
};
