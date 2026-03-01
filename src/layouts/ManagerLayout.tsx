import { Outlet } from 'react-router-dom';
import { ManagerNav } from '@/components/ManagerNav';
import { AppHeader } from '@/components/AppHeader';
import { useIsMobile } from '@/hooks/use-mobile';

export const ManagerLayout = () => {
  const isMobile = useIsMobile();

  if (isMobile) {
    return (
      <div className="min-h-screen bg-background max-w-md mx-auto relative shadow-xl border-x border-border/30">
        <AppHeader />
        <Outlet />
        <ManagerNav />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <ManagerNav />
      <div className="lg:pl-64">
        <Outlet />
      </div>
    </div>
  );
};
