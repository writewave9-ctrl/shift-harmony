import { useNavigate } from 'react-router-dom';
import { Users, UserCog, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';

export const RoleSelect = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6">
      <div className="w-full max-w-sm space-y-6 text-center">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Align</h1>
          <p className="text-muted-foreground mt-1">Sign in to continue</p>
        </div>
        <button
          onClick={() => navigate('/auth')}
          className="w-full p-4 rounded-xl bg-primary text-primary-foreground font-medium hover:bg-primary/90 transition-colors"
        >
          Go to Sign In
        </button>
      </div>
    </div>
  );
};

export default RoleSelect;
