import { motion } from 'framer-motion';

export const SocialProof = () => (
  <motion.section
    initial={{ opacity: 0 }}
    whileInView={{ opacity: 1 }}
    viewport={{ once: true, margin: '-50px' }}
    transition={{ duration: 0.6 }}
    className="py-12"
  >
    <div className="max-w-4xl mx-auto px-5 text-center">
      <p className="text-sm text-muted-foreground mb-6">
        Trusted by <span className="font-semibold text-foreground">500+</span> teams worldwide
      </p>
      <div className="flex items-center justify-center gap-8 sm:gap-12 flex-wrap opacity-40">
        {['Acme Co', 'Globex', 'Initech', 'Hooli', 'Piedmont'].map((name) => (
          <div key={name} className="text-base sm:text-lg font-bold tracking-tight text-foreground select-none">
            {name}
          </div>
        ))}
      </div>
    </div>
  </motion.section>
);
