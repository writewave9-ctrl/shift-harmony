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
    <nav className="sticky bottom-0 z-50 bg-card/90 backdrop-blur-xl border-t border-border/40 px-4 pb-safe">
      <div className="flex items-center justify-around h-16 max-w-md mx-auto">
        {navItems.map(item => {
          const isActive = location.pathname === item.path || 
            (item.path !== '/worker' && location.pathname.startsWith(item.path));
          
          return (
            <Link
              key={item.path}
              to={item.path}
              className={cn(
                'flex flex-col items-center gap-1 px-4 py-2 rounded-xl transition-all duration-200',
                isActive 
                  ? 'text-primary' 
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              <div className={cn(
                'relative p-1 rounded-lg transition-colors',
                isActive && 'bg-primary/10'
              )}>
                <item.icon className={cn('w-5 h-5', isActive && 'stroke-[2.5]')} />
              </div>
              <span className="text-[10px] font-medium">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
};
