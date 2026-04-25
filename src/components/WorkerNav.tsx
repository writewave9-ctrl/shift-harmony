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
      className="sticky bottom-0 z-50 border-t border-border/40 bg-gradient-nav backdrop-blur-2xl supports-[backdrop-filter]:bg-gradient-nav pb-safe shadow-[0_-8px_32px_-12px_hsl(220_25%_10%_/_0.08)]"
    >
      {/* Top hairline highlight for premium feel */}
      <div aria-hidden className="absolute inset-x-0 -top-px h-px bg-gradient-to-r from-transparent via-primary/30 to-transparent pointer-events-none" />
      <div aria-hidden className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-card to-transparent pointer-events-none" />

      <div className="flex items-stretch justify-around h-[64px] max-w-md mx-auto px-2 sm:px-4">
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
                'group relative flex flex-1 flex-col items-center justify-center gap-0.5 rounded-2xl transition-colors duration-300 select-none',
                isActive ? 'text-primary' : 'text-muted-foreground/75 hover:text-foreground',
              )}
            >
              {/* Active indicator pill above icon */}
              <span
                className={cn(
                  'absolute top-1 h-[3px] rounded-full bg-primary transition-all duration-300 ease-out',
                  isActive ? 'opacity-100 w-6 shadow-[0_0_8px_hsl(var(--primary)/0.5)]' : 'opacity-0 w-2',
                )}
                aria-hidden
              />

              <span
                className={cn(
                  'relative flex h-9 w-9 items-center justify-center rounded-xl transition-all duration-300 ease-out',
                  isActive
                    ? 'bg-primary/12 ring-1 ring-primary/15 scale-100'
                    : 'bg-transparent scale-95 group-hover:bg-accent/60 group-active:scale-90',
                )}
              >
                <item.icon
                  className={cn(
                    'transition-all duration-300 ease-out',
                    isActive ? 'w-[21px] h-[21px] stroke-[2.25]' : 'w-[20px] h-[20px] stroke-[1.75]',
                  )}
                />
              </span>
              <span
                className={cn(
                  'text-[10px] leading-none tracking-[0.02em] transition-all duration-300',
                  isActive ? 'font-bold' : 'font-medium opacity-75',
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
