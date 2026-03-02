import { useState, useRef, useCallback, ReactNode } from 'react';
import { motion, useMotionValue, useTransform, animate } from 'framer-motion';
import { Loader2 } from 'lucide-react';

interface PullToRefreshProps {
  onRefresh: () => Promise<void>;
  children: ReactNode;
}

export const PullToRefresh = ({ onRefresh, children }: PullToRefreshProps) => {
  const [refreshing, setRefreshing] = useState(false);
  const y = useMotionValue(0);
  const opacity = useTransform(y, [0, 60], [0, 1]);
  const scale = useTransform(y, [0, 60], [0.5, 1]);
  const containerRef = useRef<HTMLDivElement>(null);
  const startY = useRef(0);
  const pulling = useRef(false);

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    const el = containerRef.current;
    if (!el || el.scrollTop > 0 || refreshing) return;
    startY.current = e.touches[0].clientY;
    pulling.current = true;
  }, [refreshing]);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (!pulling.current || refreshing) return;
    const delta = Math.max(0, (e.touches[0].clientY - startY.current) * 0.4);
    if (delta > 0) {
      y.set(Math.min(delta, 80));
    }
  }, [refreshing, y]);

  const handleTouchEnd = useCallback(async () => {
    if (!pulling.current) return;
    pulling.current = false;

    if (y.get() >= 60) {
      setRefreshing(true);
      // Trigger haptic feedback
      if (navigator.vibrate) navigator.vibrate(10);
      try {
        await onRefresh();
      } finally {
        setRefreshing(false);
      }
    }
    animate(y, 0, { duration: 0.25 });
  }, [onRefresh, y]);

  return (
    <div
      ref={containerRef}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      className="relative overflow-auto"
    >
      {/* Pull indicator */}
      <motion.div
        style={{ opacity, scale, height: y }}
        className="flex items-center justify-center overflow-hidden"
      >
        <Loader2 className={`w-5 h-5 text-primary ${refreshing ? 'animate-spin' : ''}`} />
      </motion.div>

      {children}
    </div>
  );
};
