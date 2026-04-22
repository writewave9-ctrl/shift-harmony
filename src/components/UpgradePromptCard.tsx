import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Sparkles } from 'lucide-react';
import { PLAN_DEFINITIONS, type PlanTier } from '@/hooks/usePlan';

interface Props {
  requiredPlan: PlanTier;
  title?: string;
  description?: string;
  className?: string;
  compact?: boolean;
}

export const UpgradePromptCard = ({ requiredPlan, title, description, className, compact }: Props) => {
  const navigate = useNavigate();
  const planLabel = PLAN_DEFINITIONS[requiredPlan].label;

  if (compact) {
    return (
      <div className={`flex items-center justify-between gap-3 rounded-2xl border border-primary/20 bg-gradient-accent shadow-elevated px-4 py-3 ${className ?? ''}`}>
        <div className="flex items-center gap-2 min-w-0">
          <div className="w-8 h-8 rounded-full bg-gradient-primary flex items-center justify-center shadow-glow shrink-0">
            <Sparkles className="w-4 h-4 text-primary-foreground" />
          </div>
          <p className="text-xs font-medium text-foreground truncate">
            {title || `Available on ${planLabel}`}
          </p>
        </div>
        <Button size="sm" className="rounded-xl bg-gradient-primary shadow-floating shrink-0" onClick={() => navigate('/manager/settings')}>
          Upgrade
        </Button>
      </div>
    );
  }

  return (
    <div className={`rounded-2xl border border-primary/20 bg-gradient-surface shadow-floating p-6 text-center ${className ?? ''}`}>
      <div className="w-14 h-14 mx-auto rounded-2xl bg-gradient-primary flex items-center justify-center shadow-glow mb-3">
        <Sparkles className="w-6 h-6 text-primary-foreground" />
      </div>
      <h3 className="text-base font-semibold text-foreground">
        {title || `${planLabel} feature`}
      </h3>
      <p className="text-sm text-muted-foreground mt-1 max-w-sm mx-auto">
        {description || `Upgrade to ${planLabel} to unlock this feature for your team.`}
      </p>
      <Button className="mt-5 rounded-xl bg-gradient-primary shadow-floating" onClick={() => navigate('/manager/settings')}>
        See plans
      </Button>
    </div>
  );
};
