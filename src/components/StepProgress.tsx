import { Check, Loader2, AlertCircle, Circle } from 'lucide-react';
import { cn } from '@/lib/utils';

export type StepState = 'pending' | 'running' | 'success' | 'error';

export interface ProgressStep {
  id: string;
  label: string;
  state: StepState;
  detail?: string;
}

interface StepProgressProps {
  steps: ProgressStep[];
  className?: string;
}

/**
 * Inline step-by-step progress indicator for atomic multi-stage flows
 * (e.g. "Approve & Assign"). Each step shows: pending → running → success/error.
 */
export const StepProgress: React.FC<StepProgressProps> = ({ steps, className }) => {
  return (
    <ol
      className={cn(
        'space-y-2.5 rounded-2xl bg-muted/40 ring-1 ring-border/40 p-4',
        className,
      )}
      aria-label="Operation progress"
    >
      {steps.map((step) => (
        <li key={step.id} className="flex items-start gap-3">
          <span
            className={cn(
              'mt-0.5 w-6 h-6 rounded-full flex items-center justify-center shrink-0 ring-1',
              step.state === 'success' && 'bg-success-muted text-success ring-success/30',
              step.state === 'error' && 'bg-destructive/10 text-destructive ring-destructive/30',
              step.state === 'running' && 'bg-primary/10 text-primary ring-primary/30',
              step.state === 'pending' && 'bg-card text-muted-foreground ring-border',
            )}
            aria-hidden
          >
            {step.state === 'success' && <Check className="w-3.5 h-3.5" />}
            {step.state === 'error' && <AlertCircle className="w-3.5 h-3.5" />}
            {step.state === 'running' && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
            {step.state === 'pending' && <Circle className="w-2 h-2 fill-current" />}
          </span>
          <div className="min-w-0 flex-1">
            <p
              className={cn(
                'text-sm font-medium leading-tight',
                step.state === 'pending' ? 'text-muted-foreground' : 'text-foreground',
                step.state === 'error' && 'text-destructive',
              )}
            >
              {step.label}
            </p>
            {step.detail && (
              <p className="text-xs text-muted-foreground mt-0.5 leading-snug">
                {step.detail}
              </p>
            )}
          </div>
        </li>
      ))}
    </ol>
  );
};
