import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Shield, ArrowRight } from 'lucide-react';

const scrollTo = (id: string) => {
  document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
};

export const HeroSection = () => {
  const navigate = useNavigate();

  return (
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
            onClick={() => scrollTo('features')}
            className="rounded-xl px-8 h-12 text-base"
          >
            See how it works
          </Button>
        </motion.div>
      </div>
    </section>
  );
};
