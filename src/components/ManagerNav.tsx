import { Link, useLocation, useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { 
  LayoutDashboard, 
  Calendar, 
  Users, 
  LogOut, 
  Settings,
  BarChart3,
  HandHelping,
} from 'lucide-react';
import { useApp } from '@/contexts/AppContext';
import { useAuth } from '@/contexts/AuthContext';
import { ThemeToggle } from '@/components/ThemeToggle';
import { useShiftRequests } from '@/hooks/useShiftRequests';

const navItems = [
  { path: '/manager', icon: LayoutDashboard, label: 'Dashboard', exact: true },
  { path: '/manager/shifts', icon: Calendar, label: 'Shifts' },
  { path: '/manager/team', icon: Users, label: 'Team' },
  { path: '/manager/analytics', icon: BarChart3, label: 'Analytics' },
  { path: '/manager/requests', icon: HandHelping, label: 'Requests', badge: true },
  { path: '/manager/settings', icon: Settings, label: 'Settings' },
];

export const ManagerNav = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { setUserRole } = useApp();
  const { signOut } = useAuth();
  const { pendingRequests } = useShiftRequests();

  const handleSwitchRole = () => {
    setUserRole('worker');
    navigate('/worker');
  };

  const handleSignOut = async () => {
    await signOut();
    navigate('/auth');
  };

  return (
    <>
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex lg:flex-col lg:w-64 lg:fixed lg:inset-y-0 lg:left-0 bg-sidebar border-r border-sidebar-border">
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="h-16 flex items-center px-6 border-b border-sidebar-border">
            <div className="flex items-center justify-between w-full">
              <h1 className="text-xl font-bold text-sidebar-foreground">
                <span className="text-sidebar-primary">Align</span>
              </h1>
              <ThemeToggle />
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-3 py-4 space-y-1">
            {navItems.map(item => {
              const isActive = item.exact 
                ? location.pathname === item.path
                : location.pathname === item.path || location.pathname.startsWith(item.path + '/');
              
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={cn(
                    'flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors',
                    isActive 
                      ? 'bg-sidebar-accent text-sidebar-accent-foreground font-medium' 
                      : 'text-sidebar-foreground hover:bg-sidebar-accent/50'
                  )}
                >
                  <item.icon className="w-5 h-5" />
                  <span className="flex-1">{item.label}</span>
                  {item.badge && pendingRequests.length > 0 && (
                    <span className="text-xs font-medium bg-primary text-primary-foreground px-2 py-0.5 rounded-full">
                      {pendingRequests.length}
                    </span>
                  )}
                </Link>
              );
            })}
          </nav>

          {/* Footer */}
          <div className="p-3 border-t border-sidebar-border">
            <button
              onClick={handleSignOut}
              className="flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-sidebar-foreground hover:bg-sidebar-accent/50 transition-colors"
            >
              <LogOut className="w-5 h-5" />
              <span>Sign Out</span>
            </button>
          </div>
        </div>
      </aside>

      {/* Mobile Bottom Nav */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-50 bg-card/95 backdrop-blur-lg border-t border-border/50 px-2 pb-safe">
        <div className="flex items-center justify-around h-16 max-w-md mx-auto">
          {navItems.slice(0, 5).map(item => {
            const isActive = item.exact 
              ? location.pathname === item.path
              : location.pathname === item.path || location.pathname.startsWith(item.path + '/');
            
            return (
              <Link
                key={item.path}
                to={item.path}
                className={cn(
                  'relative flex flex-col items-center gap-0.5 px-3 py-2 rounded-xl transition-colors',
                  isActive 
                    ? 'text-primary' 
                    : 'text-muted-foreground hover:text-foreground'
                )}
              >
                <item.icon className={cn('w-5 h-5', isActive && 'stroke-[2.5]')} />
                <span className="text-[10px] font-medium">{item.label}</span>
                {item.badge && pendingRequests.length > 0 && (
                  <span className="absolute -top-1 -right-1 w-4 h-4 text-[10px] font-bold bg-primary text-primary-foreground rounded-full flex items-center justify-center">
                    {pendingRequests.length}
                  </span>
                )}
              </Link>
            );
          })}
        </div>
      </nav>
    </>
  );
};
