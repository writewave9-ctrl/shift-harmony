import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { CheckCircle2, Circle, ChevronRight, Sparkles, X } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';

interface ChecklistItem {
  id: string;
  label: string;
  description: string;
  completed: boolean;
  action?: () => void;
}

export const OnboardingChecklist = () => {
  const navigate = useNavigate();
  const { profile, user } = useAuth();
  const [dismissed, setDismissed] = useState(false);
  const [hasAvailability, setHasAvailability] = useState(false);
  const [hasChangedPassword, setHasChangedPassword] = useState(false);

  useEffect(() => {
    const checkDismissed = localStorage.getItem(`onboarding-dismissed-${user?.id}`);
    if (checkDismissed) setDismissed(true);
  }, [user?.id]);

  useEffect(() => {
    const checkAvailability = async () => {
      if (!profile?.id) return;
      const { data } = await supabase
        .from('availability_settings')
        .select('id')
        .eq('worker_id', profile.id)
        .limit(1);
      setHasAvailability((data?.length ?? 0) > 0);
    };
    checkAvailability();
  }, [profile?.id]);

  useEffect(() => {
    // Check if user updated their password after account creation
    if (user) {
      const created = new Date(user.created_at).getTime();
      const updated = new Date(user.updated_at || user.created_at).getTime();
      // If updated_at is >60s after created_at, assume password was changed
      setHasChangedPassword(updated - created > 60000);
    }
  }, [user]);

  const items: ChecklistItem[] = [
    {
      id: 'password',
      label: 'Set your password',
      description: 'Change your temporary password to something secure',
      completed: hasChangedPassword,
      action: () => navigate('/worker/profile'),
    },
    {
      id: 'name',
      label: 'Complete your profile',
      description: 'Add your phone number and position',
      completed: !!(profile?.phone && profile?.position),
      action: () => navigate('/worker/profile'),
    },
    {
      id: 'availability',
      label: 'Set your availability',
      description: 'Let your manager know when you can work',
      completed: hasAvailability,
      action: () => navigate('/worker/profile'),
    },
  ];

  const completedCount = items.filter(i => i.completed).length;
  const progress = Math.round((completedCount / items.length) * 100);
  const allComplete = completedCount === items.length;

  if (dismissed || allComplete) return null;

  const handleDismiss = () => {
    localStorage.setItem(`onboarding-dismissed-${user?.id}`, 'true');
    setDismissed(true);
  };

  return (
    <div className="rounded-2xl bg-card border border-border/50 shadow-sm overflow-hidden">
      <div className="bg-gradient-to-r from-primary/10 via-primary/5 to-transparent px-5 py-3 border-b border-border/30 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-primary" />
          <span className="text-xs font-semibold text-primary uppercase tracking-wider">Getting Started</span>
        </div>
        <button onClick={handleDismiss} className="p-1 rounded-md hover:bg-accent/80 transition-colors">
          <X className="w-3.5 h-3.5 text-muted-foreground" />
        </button>
      </div>

      <div className="p-5 space-y-4">
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-sm">
            <span className="font-medium text-foreground">{completedCount} of {items.length} complete</span>
            <span className="text-muted-foreground">{progress}%</span>
          </div>
          <Progress value={progress} className="h-2" />
        </div>

        <div className="space-y-1">
          {items.map((item) => (
            <button
              key={item.id}
              onClick={item.action}
              className={cn(
                "w-full flex items-center gap-3 p-3 rounded-xl text-left transition-colors",
                item.completed
                  ? "opacity-60"
                  : "hover:bg-accent/50"
              )}
            >
              {item.completed ? (
                <CheckCircle2 className="w-5 h-5 text-primary flex-shrink-0" />
              ) : (
                <Circle className="w-5 h-5 text-muted-foreground/50 flex-shrink-0" />
              )}
              <div className="flex-1 min-w-0">
                <p className={cn(
                  "text-sm font-medium",
                  item.completed ? "text-muted-foreground line-through" : "text-foreground"
                )}>
                  {item.label}
                </p>
                <p className="text-xs text-muted-foreground truncate">{item.description}</p>
              </div>
              {!item.completed && <ChevronRight className="w-4 h-4 text-muted-foreground/50 flex-shrink-0" />}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
