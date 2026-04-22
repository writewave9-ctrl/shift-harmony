import { cn } from '@/lib/utils';
import { Sparkles, Crown, Leaf } from 'lucide-react';
import { PLAN_DEFINITIONS, type PlanTier } from '@/hooks/usePlan';

const cfg: Record<PlanTier, { className: string; icon: React.ReactNode }> = {
  starter: { className: 'bg-muted text-muted-foreground border-border', icon: <Leaf className="w-3 h-3" /> },
  pro: { className: 'bg-primary/10 text-primary border-primary/30', icon: <Sparkles className="w-3 h-3" /> },
  enterprise: { className: 'bg-gradient-primary text-primary-foreground border-transparent shadow-glow', icon: <Crown className="w-3 h-3" /> },
};

export const PlanBadge = ({ plan, className }: { plan: PlanTier; className?: string }) => {
  const c = cfg[plan];
  return (
    <span className={cn(
      'inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold border whitespace-nowrap',
      c.className, className,
    )}>
      {c.icon}
      {PLAN_DEFINITIONS[plan].label}
    </span>
  );
};
