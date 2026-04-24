import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { ArrowRight, Sparkles } from 'lucide-react';

export const CTASection = () => {
  const navigate = useNavigate();

  return (
    <section className="py-20">
      <div className="max-w-4xl mx-auto px-5">
        <motion.div
          initial={{ opacity: 0, scale: 0.97 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true, margin: '-80px' }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
          className="relative rounded-[28px] overflow-hidden border border-primary/15 shadow-luxe"
        >
          {/* Layered gradient backdrop */}
          <div className="absolute inset-0 bg-gradient-to-br from-primary/12 via-card to-accent/40" />
          <div className="absolute inset-0 bg-gradient-mesh opacity-60" />
          <div
            className="absolute inset-0 opacity-[0.04]"
            style={{
              backgroundImage:
                'radial-gradient(hsl(var(--foreground)) 1px, transparent 1px)',
              backgroundSize: '20px 20px',
            }}
          />

          <div className="relative p-10 sm:p-16 text-center">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-card/70 backdrop-blur-sm border border-primary/15 text-[11px] font-medium text-primary uppercase tracking-wider mb-6">
              <Sparkles className="w-3 h-3" /> Free for early teams
            </div>
            <h2 className="font-display text-4xl sm:text-5xl font-semibold tracking-tight mb-5 leading-[1.05]">
              Bring your team
              <br />
              <span className="italic text-primary">into alignment.</span>
            </h2>
            <p className="text-muted-foreground text-base sm:text-lg mb-9 max-w-xl mx-auto leading-relaxed">
              Set up your first schedule in under a minute. Invite your team. Watch
              coverage gaps disappear.
            </p>
            <Button
              size="lg"
              onClick={() => navigate('/auth')}
              className="group rounded-xl px-8 h-12 text-[15px] gap-2 bg-gradient-primary shadow-elevated hover:shadow-floating transition-all duration-300"
            >
              Create your workspace
              <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5" />
            </Button>
          </div>
        </motion.div>
      </div>
    </section>
  );
};
