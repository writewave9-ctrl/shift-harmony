import { Outlet, useLocation } from 'react-router-dom';
import { WorkerNav } from '@/components/WorkerNav';
import { AppHeader } from '@/components/AppHeader';
import { AnimatePresence } from 'framer-motion';
import { PageTransition } from '@/components/PageTransition';

export const WorkerLayout = () => {
  const location = useLocation();

  return (
    <div className="min-h-screen bg-background max-w-md mx-auto relative shadow-xl border-x border-border/30 pt-safe">
      <AppHeader />
      <AnimatePresence mode="wait">
        <PageTransition key={location.pathname} className="pb-20">
          <Outlet />
        </PageTransition>
      </AnimatePresence>
      <WorkerNav />
    </div>
  );
};
