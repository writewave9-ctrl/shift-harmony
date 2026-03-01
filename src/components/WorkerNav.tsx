import { Link, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { Home, Calendar, User, History } from 'lucide-react';

const navItems = [
  { path: '/worker', icon: Home, label: 'Home' },
  { path: '/worker/shifts', icon: Calendar, label: 'Shifts' },
  { path: '/worker/history', icon: History, label: 'History' },
  { path: '/worker/profile', icon: User, label: 'Profile' },
];

export const WorkerNav = () => {
  const location = useLocation();

  return (
    <nav className="sticky bottom-0 z-50 bg-card/95 backdrop-blur-lg border-t border-border/50 px-4 pb-safe">
      <div className="flex items-center justify-around h-14 max-w-md mx-auto">
        {navItems.map(item => {
          const isActive = location.pathname === item.path || 
            (item.path !== '/worker' && location.pathname.startsWith(item.path));
          
          return (
            <Link
              key={item.path}
              to={item.path}
              className={cn(
                'flex flex-col items-center gap-0.5 px-3 py-2 rounded-xl transition-colors',
                isActive 
                  ? 'text-primary' 
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              <item.icon className={cn('w-5 h-5', isActive && 'stroke-[2.5]')} />
              <span className="text-[10px] font-medium">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
};
