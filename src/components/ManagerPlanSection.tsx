import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Check, Sparkles, Crown, Leaf, Loader2 } from 'lucide-react';
import { usePlan, PLAN_DEFINITIONS, type PlanTier } from '@/hooks/usePlan';
import { PlanBadge } from '@/components/PlanBadge';
import { useState } from 'react';

const featureLabels: Record<keyof typeof PLAN_DEFINITIONS.starter.features, string> = {
  templates_autofill: 'Shift templates & auto-fill',
  gps_verification: 'GPS check-in verification',
  analytics: 'Analytics dashboard',
  call_offs: 'Call-off management',
  swaps: 'Swap management',
  priority_support: 'Priority support',
  report_exports: 'Report exports (CSV/PDF)',
  multi_team: 'Multi-team support',
};

const TIER_ICONS: Record<PlanTier, React.ReactNode> = {
  starter: <Leaf className="w-4 h-4 text-muted-foreground" />,
  pro: <Sparkles className="w-4 h-4 text-primary" />,
  enterprise: <Crown className="w-4 h-4 text-primary-foreground" />,
};

const TIER_PRICE: Record<PlanTier, string> = {
  starter: '$0', pro: '$29', enterprise: '$99',
};

export const ManagerPlanSection = () => {
  const { plan, limits, workerCount, setOrgPlan, loading } = usePlan();
  const [busy, setBusy] = useState<PlanTier | null>(null);
  const navigate = useNavigate();

  const change = async (next: PlanTier) => {
    setBusy(next);
    await setOrgPlan(next);
    setBusy(null);
  };

  if (loading) return null;

  return (
    <Card className="rounded-2xl shadow-elevated border-border/50">
      <CardHeader>
        <div className="flex items-start justify-between gap-3">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-primary" />
              Plan
            </CardTitle>
            <CardDescription>Choose the right tier for your team</CardDescription>
          </div>
          <PlanBadge plan={plan} />
        </div>
      </CardHeader>
      <CardContent className="space-y-5">
        <div className="rounded-xl bg-gradient-accent border border-primary/20 p-3 shadow-elevated">
          <p className="text-xs text-muted-foreground">Workers in use</p>
          <p className="text-lg font-semibold">
            {workerCount}
            <span className="text-sm text-muted-foreground font-normal">
              {' '} / {limits.workerLimit === Infinity ? '∞' : limits.workerLimit}
            </span>
          </p>
        </div>

        <Button variant="outline" size="sm" className="rounded-xl w-full" onClick={() => navigate('/manager/support')}>
          Open support center
        </Button>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {(['starter', 'pro', 'enterprise'] as PlanTier[]).map(tier => {
            const def = PLAN_DEFINITIONS[tier];
            const isCurrent = plan === tier;
            return (
              <div
                key={tier}
                className={`rounded-2xl p-4 border flex flex-col gap-3 ${
                  isCurrent
                    ? 'border-primary bg-gradient-surface shadow-floating'
                    : 'border-border/50 bg-card shadow-elevated'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    {TIER_ICONS[tier]}
                    <p className="font-semibold text-sm">{def.label}</p>
                  </div>
                  {isCurrent && <span className="text-[10px] font-bold uppercase tracking-wider text-primary">Current</span>}
                </div>
                <div>
                  <p className="text-xl font-bold">{TIER_PRICE[tier]}<span className="text-xs text-muted-foreground font-normal"> /mo</span></p>
                  <p className="text-[11px] text-muted-foreground">
                    {def.workerLimit === Infinity ? 'Unlimited workers' : `Up to ${def.workerLimit} workers`}
                  </p>
                </div>
                <ul className="space-y-1 flex-1">
                  {(Object.keys(def.features) as (keyof typeof def.features)[])
                    .filter(k => def.features[k])
                    .map(k => (
                      <li key={k} className="flex items-start gap-1.5 text-[11px] text-foreground">
                        <Check className="w-3 h-3 text-primary shrink-0 mt-0.5" />
                        <span>{featureLabels[k]}</span>
                      </li>
                    ))}
                </ul>
                <Button
                  size="sm"
                  variant={isCurrent ? 'outline' : 'default'}
                  className={`rounded-xl ${!isCurrent ? 'bg-gradient-primary shadow-floating' : ''}`}
                  disabled={isCurrent || busy !== null}
                  onClick={() => change(tier)}
                >
                  {busy === tier ? <Loader2 className="w-4 h-4 animate-spin" /> : isCurrent ? 'Current plan' : `Switch to ${def.label}`}
                </Button>
              </div>
            );
          })}
        </div>
        <p className="text-[10px] text-muted-foreground text-center">
          Billing is coming soon — switching is free for now.
        </p>
      </CardContent>
    </Card>
  );
};
