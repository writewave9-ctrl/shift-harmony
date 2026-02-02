import { Outlet } from 'react-router-dom';
import { ManagerNav } from '@/components/ManagerNav';

export const ManagerLayout = () => {
  return (
    <div className="min-h-screen bg-background">
      <ManagerNav />
      <div className="lg:pl-64">
        <Outlet />
      </div>
    </div>
  );
};
