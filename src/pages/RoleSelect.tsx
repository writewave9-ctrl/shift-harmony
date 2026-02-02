import { useNavigate } from 'react-router-dom';
import { useApp } from '@/contexts/AppContext';
import { Users, UserCog, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';

export const RoleSelect = () => {
  const navigate = useNavigate();
  const { setUserRole } = useApp();

  const handleSelectRole = (role: 'worker' | 'manager') => {
    setUserRole(role);
    navigate(role === 'worker' ? '/worker' : '/manager');
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="px-6 pt-16 pb-8 text-center">
        <div className="w-16 h-16 mx-auto rounded-2xl bg-primary/10 flex items-center justify-center mb-6">
          <span className="text-3xl font-bold text-primary">A</span>
        </div>
        <h1 className="text-3xl font-bold text-foreground mb-2">Align</h1>
        <p className="text-muted-foreground">
          Operational clarity for your team
        </p>
      </header>

      {/* Role Selection */}
      <main className="flex-1 px-6 pb-12">
        <p className="text-sm text-muted-foreground text-center mb-6">
          Select your role to continue
        </p>

        <div className="space-y-4 max-w-sm mx-auto">
          {/* Worker Option */}
          <button
            onClick={() => handleSelectRole('worker')}
            className="w-full card-interactive rounded-2xl p-5 text-left group"
          >
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-xl bg-primary/10 flex items-center justify-center group-hover:bg-primary/15 transition-colors">
                <Users className="w-7 h-7 text-primary" />
              </div>
              <div className="flex-1">
                <h2 className="text-lg font-semibold text-foreground mb-1">
                  I'm a Worker
                </h2>
                <p className="text-sm text-muted-foreground">
                  View shifts, check in, request swaps
                </p>
              </div>
              <ChevronRight className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors" />
            </div>
          </button>

          {/* Manager Option */}
          <button
            onClick={() => handleSelectRole('manager')}
            className="w-full card-interactive rounded-2xl p-5 text-left group"
          >
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-xl bg-primary/10 flex items-center justify-center group-hover:bg-primary/15 transition-colors">
                <UserCog className="w-7 h-7 text-primary" />
              </div>
              <div className="flex-1">
                <h2 className="text-lg font-semibold text-foreground mb-1">
                  I'm a Manager
                </h2>
                <p className="text-sm text-muted-foreground">
                  Oversee shifts, approvals, team health
                </p>
              </div>
              <ChevronRight className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors" />
            </div>
          </button>
        </div>
      </main>

      {/* Footer */}
      <footer className="px-6 py-8 text-center">
        <p className="text-xs text-muted-foreground">
          "Everything is under control — even when it isn't."
        </p>
      </footer>
    </div>
  );
};

export default RoleSelect;
