import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export type PlanTier = 'starter' | 'pro' | 'enterprise';

export type FeatureKey =
  | 'templates_autofill'
  | 'gps_verification'
  | 'analytics'
  | 'call_offs'
  | 'swaps'
  | 'priority_support'
  | 'report_exports'
  | 'multi_team';

export interface PlanLimits {
  workerLimit: number; // Infinity for enterprise
  features: Record<FeatureKey, boolean>;
  label: string;
}

export const PLAN_DEFINITIONS: Record<PlanTier, PlanLimits> = {
  starter: {
    label: 'Starter',
    workerLimit: 5,
    features: {
      templates_autofill: false,
      gps_verification: true,
      analytics: false,
      call_offs: false,
      swaps: false,
      priority_support: false,
      report_exports: false,
      multi_team: false,
    },
  },
  pro: {
    label: 'Pro',
    workerLimit: 50,
    features: {
      templates_autofill: true,
      gps_verification: true,
      analytics: true,
      call_offs: true,
      swaps: true,
      priority_support: false,
      report_exports: false,
      multi_team: false,
    },
  },
  enterprise: {
    label: 'Enterprise',
    workerLimit: Number.POSITIVE_INFINITY,
    features: {
      templates_autofill: true,
      gps_verification: true,
      analytics: true,
      call_offs: true,
      swaps: true,
      priority_support: true,
      report_exports: true,
      multi_team: true,
    },
  },
};

export function usePlan() {
  const { profile } = useAuth();
  const [plan, setPlan] = useState<PlanTier>('starter');
  const [workerCount, setWorkerCount] = useState(0);
  const [loading, setLoading] = useState(true);

  const fetchPlan = useCallback(async () => {
    if (!profile?.organization_id) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const [{ data: org }, { data: count }] = await Promise.all([
        supabase.from('organizations').select('plan').eq('id', profile.organization_id).maybeSingle(),
        supabase.rpc('get_org_worker_count', { _org_id: profile.organization_id }),
      ]);
      if (org?.plan) setPlan(org.plan as PlanTier);
      if (typeof count === 'number') setWorkerCount(count);
    } finally {
      setLoading(false);
    }
  }, [profile?.organization_id]);

  useEffect(() => { fetchPlan(); }, [fetchPlan]);

  const limits = PLAN_DEFINITIONS[plan];
  const canInvite = workerCount < limits.workerLimit;
  const canUseFeature = (key: FeatureKey) => limits.features[key];

  const setOrgPlan = async (next: PlanTier) => {
    if (!profile?.organization_id) return false;
    const { error } = await supabase
      .from('organizations')
      .update({ plan: next, plan_started_at: new Date().toISOString() })
      .eq('id', profile.organization_id);
    if (error) {
      toast.error('Could not update plan');
      return false;
    }
    setPlan(next);
    toast.success(`Billing coming soon — your team is now on ${PLAN_DEFINITIONS[next].label}.`);
    return true;
  };

  return { plan, limits, workerCount, canInvite, canUseFeature, loading, setOrgPlan, refetch: fetchPlan };
}
