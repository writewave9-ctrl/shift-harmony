import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { ArrowRight } from 'lucide-react';

export const CTASection = () => {
  const navigate = useNavigate();

  return (
    <section className="py-12">
      <div className="max-w-3xl mx-auto px-5">
        <motion.div
          initial={{ opacity: 0, scale: 0.96 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true, margin: '-80px' }}
          transition={{ duration: 0.5 }}
          className="rounded-3xl bg-gradient-to-br from-primary/10 via-primary/5 to-accent/50 border border-primary/10 p-10 sm:p-14 text-center"
        >
          <h2 className="text-3xl sm:text-4xl font-bold tracking-tight mb-4">Ready to align your team?</h2>
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
  );
};
