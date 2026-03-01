import { Outlet } from 'react-router-dom';
import { WorkerNav } from '@/components/WorkerNav';
import { AppHeader } from '@/components/AppHeader';

export const WorkerLayout = () => {
  return (
    <div className="min-h-screen bg-background max-w-md mx-auto relative shadow-xl border-x border-border/30">
      <AppHeader />
      <Outlet />
      <WorkerNav />
    </div>
  );
};
