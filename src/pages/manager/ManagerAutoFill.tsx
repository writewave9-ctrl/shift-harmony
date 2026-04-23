import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { addWeeks, format, startOfWeek } from 'date-fns';
import { ChevronLeft, Sparkles, Loader2, ArrowRight, CalendarRange } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { useShiftAutoFill, type PreviewShift } from '@/hooks/useShiftAutoFill';
import { AutoFillPreview } from '@/components/AutoFillPreview';
import { usePlan } from '@/hooks/usePlan';
import { UpgradePromptCard } from '@/components/UpgradePromptCard';
import { toast } from 'sonner';

export const ManagerAutoFill = () => {
  const navigate = useNavigate();
  const { canUseFeature, loading: planLoading } = usePlan();
  const { templates, generating, previewWeek, generate } = useShiftAutoFill();

  const [weekOffset, setWeekOffset] = useState(1); // 0 this week, 1 next, etc.
  const [autoAssign, setAutoAssign] = useState(true);
  const [previewItems, setPreviewItems] = useState<PreviewShift[] | null>(null);
  const [enabledTemplates, setEnabledTemplates] = useState<Set<string>>(new Set());

  const weekStart = useMemo(
    () => startOfWeek(addWeeks(new Date(), weekOffset), { weekStartsOn: 1 }),
    [weekOffset],
  );


  const runGenerate = async () => {
    if (!previewItems) return;
    const items = autoAssign ? previewItems.map(i => ({ ...i })) : previewItems;
    const res = await generate(items, {
      templateIds: Array.from(enabledTemplates),
      autoAssign,
    });
    toast.success(`${res.created} created · ${res.assigned} auto-assigned · ${res.skipped} skipped`);
    setPreviewItems(null);
    navigate('/manager/shifts');
  };

  if (planLoading) return null;

  if (!canUseFeature('templates_autofill')) {
    return (
      <div className="min-h-screen bg-background pb-8">
        <header className="sticky top-0 z-10 bg-background/95 backdrop-blur-xl border-b border-border/40 px-4 py-4">
          <div className="flex items-center gap-3">
            <button onClick={() => navigate('/manager/shifts')} className="p-2 -ml-2 rounded-lg hover:bg-accent">
              <ChevronLeft className="w-5 h-5" />
            </button>
            <h1 className="text-lg font-semibold">Auto-fill week</h1>
          </div>
        </header>
        <div className="px-4 py-8 max-w-xl mx-auto">
          <UpgradePromptCard
            requiredPlan="pro"
            title="Auto-fill is a Pro feature"
            description="Generate a full week of shifts from your templates and auto-assign the best worker for each one."
          />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-12">
      <header className="sticky top-0 z-10 bg-background/95 backdrop-blur-xl border-b border-border/40 px-4 py-4 lg:px-8">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate('/manager/shifts')} className="p-2 -ml-2 rounded-lg hover:bg-accent">
            <ChevronLeft className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-gradient-primary flex items-center justify-center shadow-glow">
              <Sparkles className="w-4 h-4 text-primary-foreground" />
            </div>
            <h1 className="text-lg font-semibold tracking-tight">Auto-fill week</h1>
          </div>
        </div>
      </header>

      <div className="px-4 lg:px-8 py-6 max-w-2xl mx-auto space-y-5">
        {/* Step 1: pick week */}
        <section className="rounded-2xl border border-border/50 bg-card shadow-elevated p-5 space-y-4">
          <div className="flex items-center gap-2">
            <CalendarRange className="w-4 h-4 text-primary" />
            <h2 className="text-sm font-semibold">1. Choose a week</h2>
          </div>
          <div className="flex flex-wrap gap-2">
            {[
              { v: 0, label: 'This week' },
              { v: 1, label: 'Next week' },
              { v: 2, label: 'In 2 weeks' },
              { v: 3, label: 'In 3 weeks' },
            ].map(o => (
              <button
                key={o.v}
                onClick={() => { setWeekOffset(o.v); setPreviewItems(null); }}
                className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-all ${
                  weekOffset === o.v
                    ? 'bg-gradient-primary text-primary-foreground border-transparent shadow-glow'
                    : 'bg-muted text-muted-foreground border-border/40'
                }`}
              >
                {o.label}
              </button>
            ))}
          </div>
          <p className="text-xs text-muted-foreground">
            Week of {format(weekStart, 'MMM d, yyyy')}
          </p>
          <div className="flex items-center justify-between rounded-xl bg-muted/40 border border-border/40 p-3">
            <div>
              <Label className="text-sm font-medium">Auto-assign best fit</Label>
              <p className="text-[11px] text-muted-foreground">Pick the most reliable, available worker for each shift.</p>
            </div>
            <Switch checked={autoAssign} onCheckedChange={setAutoAssign} />
          </div>
          <Button onClick={buildPreview} className="w-full rounded-xl bg-gradient-primary shadow-floating" disabled={!templates.length}>
            <ArrowRight className="w-4 h-4 mr-2" />
            Preview shifts
          </Button>
          {!templates.length && (
            <p className="text-xs text-muted-foreground text-center">Create at least one shift template with days of the week first.</p>
          )}
        </section>

        {/* Step 2: preview */}
        {previewItems && (
          <section className="space-y-4">
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-semibold">2. Review what will be created</h2>
              <span className="text-[11px] text-muted-foreground ml-auto">
                Existing shifts on the same date / time / position are skipped automatically.
              </span>
            </div>
            <AutoFillPreview
              items={previewItems}
              selectedTemplateIds={enabledTemplates}
              onToggleTemplate={(id) => {
                setEnabledTemplates(prev => {
                  const next = new Set(prev);
                  if (next.has(id)) next.delete(id); else next.add(id);
                  return next;
                });
              }}
              showAssignments={autoAssign}
            />
            {scoring && (
              <p className="text-xs text-muted-foreground text-center">Scoring suggestions…</p>
            )}
            <Button
              onClick={runGenerate}
              className="w-full rounded-xl bg-gradient-primary shadow-floating h-12"
              disabled={generating || enabledTemplates.size === 0}
            >
              {generating ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Sparkles className="w-4 h-4 mr-2" />Generate {previewItems.filter(i => enabledTemplates.has(i.template.id)).length} shifts</>}
            </Button>
          </section>
        )}
      </div>
    </div>
  );
};

export default ManagerAutoFill;
