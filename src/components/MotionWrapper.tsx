import { motion, HTMLMotionProps } from 'framer-motion';
import { forwardRef } from 'react';

// Animated card with tap/hover micro-interactions
export const MotionCard = forwardRef<HTMLDivElement, HTMLMotionProps<'div'> & { children: React.ReactNode }>(
  ({ children, className, ...props }, ref) => (
    <motion.div
      ref={ref}
      whileTap={{ scale: 0.98 }}
      whileHover={{ y: -2 }}
      transition={{ type: 'spring', stiffness: 400, damping: 25 }}
      className={className}
      {...props}
    >
      {children}
    </motion.div>
  )
);
MotionCard.displayName = 'MotionCard';

// Animated list item with stagger support
export const MotionItem = forwardRef<HTMLDivElement, HTMLMotionProps<'div'> & { children: React.ReactNode; index?: number }>(
  ({ children, className, index = 0, ...props }, ref) => (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05, duration: 0.3, ease: 'easeOut' }}
      className={className}
      {...props}
    >
      {children}
    </motion.div>
  )
);
MotionItem.displayName = 'MotionItem';

// Animated button with spring tap
export const MotionButton = forwardRef<HTMLButtonElement, HTMLMotionProps<'button'> & { children: React.ReactNode }>(
  ({ children, className, ...props }, ref) => (
    <motion.button
      ref={ref}
      whileTap={{ scale: 0.95 }}
      whileHover={{ scale: 1.02 }}
      transition={{ type: 'spring', stiffness: 500, damping: 30 }}
      className={className}
      {...props}
    >
      {children}
    </motion.button>
  )
);
MotionButton.displayName = 'MotionButton';

// Fade-in section
export const MotionSection = ({ children, className, delay = 0 }: { children: React.ReactNode; className?: string; delay?: number }) => (
  <motion.section
    initial={{ opacity: 0, y: 16 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay, duration: 0.4, ease: 'easeOut' }}
    className={className}
  >
    {children}
  </motion.section>
);
