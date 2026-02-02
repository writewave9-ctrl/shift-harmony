import { Outlet } from 'react-router-dom';
import { WorkerNav } from '@/components/WorkerNav';

export const WorkerLayout = () => {
  return (
    <div className="min-h-screen bg-background">
      <Outlet />
      <WorkerNav />
    </div>
  );
};
