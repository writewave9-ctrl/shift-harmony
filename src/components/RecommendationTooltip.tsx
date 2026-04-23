import { Info, Calendar, Star, Gauge, Users } from 'lucide-react';
import { HoverCard, HoverCardContent, HoverCardTrigger } from '@/components/ui/hover-card';
import type { RecommendationFactors } from '@/hooks/useShiftAutoFill';

interface Props {
  workerName: string;
  factors: RecommendationFactors;
}

const AVAIL_LABEL: Record<RecommendationFactors['availability'], string> = {
  free: 'Free this day — no blocks',
  blocked: 'No availability data',
  unknown: 'Limited availability info',
};

const REL_LABEL: Record<RecommendationFactors['reliabilityBand'], string> = {
  excellent: 'Excellent on-time history',
  strong: 'Strong reliability',
  building: 'Still building track record',
};

const HEAD_LABEL: Record<RecommendationFactors['hoursHeadroom'], string> = {
  plenty: 'Plenty of room before weekly target',
  some: 'A little headroom left this week',
  none: 'Already near weekly target',
};

/**
 * Hover tooltip explaining why a worker was suggested.
 * Privacy-preserving: shows anonymized buckets and a pool size — never
 * peer reliability scores, peer hours, or other workers' names.
 */
export const RecommendationTooltip = ({ workerName, factors }: Props) => {
  return (
    <HoverCard openDelay={120}>
      <HoverCardTrigger asChild>
        <button
          type="button"
          aria-label={`Why ${workerName} was recommended`}
          className="inline-flex items-center justify-center w-4 h-4 rounded-full text-muted-foreground hover:text-primary transition-colors"
          onClick={(e) => e.preventDefault()}
        >
          <Info className="w-3.5 h-3.5" />
        </button>
      </HoverCardTrigger>
      <HoverCardContent
        side="top"
        align="end"
        className="w-72 rounded-2xl border-border/50 shadow-floating bg-gradient-surface p-4"
      >
        <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
          Why {workerName.split(' ')[0]}?
        </p>
        <ul className="mt-2 space-y-2 text-xs">
          <li className="flex items-start gap-2">
            <Calendar className="w-3.5 h-3.5 mt-0.5 text-primary shrink-0" />
            <span className="text-foreground">{AVAIL_LABEL[factors.availability]}</span>
          </li>
          <li className="flex items-start gap-2">
            <Star className="w-3.5 h-3.5 mt-0.5 text-primary shrink-0" />
            <span className="text-foreground">{REL_LABEL[factors.reliabilityBand]}</span>
          </li>
          <li className="flex items-start gap-2">
            <Gauge className="w-3.5 h-3.5 mt-0.5 text-primary shrink-0" />
            <span className="text-foreground">{HEAD_LABEL[factors.hoursHeadroom]}</span>
          </li>
          <li className="flex items-start gap-2">
            <Users className="w-3.5 h-3.5 mt-0.5 text-muted-foreground shrink-0" />
            <span className="text-muted-foreground">
              Picked from {factors.candidatePoolSize}{' '}
              eligible {factors.candidatePoolSize === 1 ? 'teammate' : 'teammates'}
            </span>
          </li>
        </ul>
        <p className="mt-3 text-[10px] leading-relaxed text-muted-foreground border-t border-border/40 pt-2">
          Other teammates' private scores and hours are never shown.
        </p>
      </HoverCardContent>
    </HoverCard>
  );
};
