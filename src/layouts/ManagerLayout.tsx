import { Outlet, useLocation } from 'react-router-dom';
import { ManagerNav } from '@/components/ManagerNav';
import { AppHeader } from '@/components/AppHeader';
import { useIsMobile } from '@/hooks/use-mobile';
import { AnimatePresence } from 'framer-motion';
import { PageTransition } from '@/components/PageTransition';

export const ManagerLayout = () => {
  const isMobile = useIsMobile();
  const location = useLocation();

  if (isMobile) {
    return (
      <div className="min-h-screen bg-background max-w-md mx-auto relative shadow-2xl border-x border-border/20 pt-safe">
        <AppHeader />
        <AnimatePresence mode="wait">
          <PageTransition key={location.pathname} className="pb-20">
            <Outlet />
          </PageTransition>
        </AnimatePresence>
        <ManagerNav />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pt-safe">
      <ManagerNav />
      <div className="lg:pl-64">
        <AnimatePresence mode="wait">
          <PageTransition key={location.pathname}>
            <Outlet />
          </PageTransition>
        </AnimatePresence>
      </div>
    </div>
  );
};
