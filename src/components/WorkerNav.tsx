import { Link, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { Home, Calendar, Users, History, User } from 'lucide-react';

const navItems = [
  { path: '/worker', icon: Home, label: 'Home' },
  { path: '/worker/shifts', icon: Calendar, label: 'Shifts' },
  { path: '/worker/team', icon: Users, label: 'Team' },
  { path: '/worker/history', icon: History, label: 'History' },
  { path: '/worker/profile', icon: User, label: 'Profile' },
];

export const WorkerNav = () => {
  const location = useLocation();

  return (
    <nav
      aria-label="Primary"
      className="sticky bottom-0 z-50 border-t border-border/30 bg-card/85 backdrop-blur-2xl supports-[backdrop-filter]:bg-card/70 pb-safe"
    >
      {/* Top hairline highlight for premium feel */}
      <div className="absolute inset-x-0 -top-px h-px bg-gradient-to-r from-transparent via-border/60 to-transparent pointer-events-none" />

      <div className="flex items-stretch justify-around h-[68px] max-w-md mx-auto px-3">
        {navItems.map((item) => {
          const isActive =
            location.pathname === item.path ||
            (item.path !== '/worker' && location.pathname.startsWith(item.path));

          return (
            <Link
              key={item.path}
              to={item.path}
              aria-current={isActive ? 'page' : undefined}
              className={cn(
                'group relative flex flex-1 flex-col items-center justify-center gap-1 rounded-2xl transition-colors duration-300',
                isActive ? 'text-primary' : 'text-muted-foreground/80 hover:text-foreground',
              )}
            >
              {/* Active indicator pill above icon */}
              <span
                className={cn(
                  'absolute top-1.5 h-[3px] w-7 rounded-full bg-primary transition-all duration-300 ease-out',
                  isActive ? 'opacity-100 scale-100' : 'opacity-0 scale-50',
                )}
                aria-hidden
              />

              <span
                className={cn(
                  'relative flex h-9 w-9 items-center justify-center rounded-xl transition-all duration-300 ease-out',
                  isActive
                    ? 'bg-primary/10 scale-100'
                    : 'bg-transparent scale-95 group-hover:bg-accent/40 group-active:scale-90',
                )}
              >
                <item.icon
                  className={cn(
                    'transition-all duration-300 ease-out',
                    isActive ? 'w-[22px] h-[22px] stroke-[2.25]' : 'w-[20px] h-[20px] stroke-[1.75]',
                  )}
                />
              </span>
              <span
                className={cn(
                  'text-[10.5px] leading-none tracking-wide transition-all duration-300',
                  isActive ? 'font-semibold' : 'font-medium opacity-80',
                )}
              >
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
};
