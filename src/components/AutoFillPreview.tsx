import { format, parseISO } from 'date-fns';
import { Checkbox } from '@/components/ui/checkbox';
import { formatTimeRange } from '@/lib/formatTime';
import { MapPin, Clock, User, AlertTriangle } from 'lucide-react';
import type { PreviewShift } from '@/hooks/useShiftAutoFill';

interface Props {
  items: PreviewShift[];
  selectedTemplateIds: Set<string>;
  onToggleTemplate: (templateId: string) => void;
  showAssignments?: boolean;
}

export const AutoFillPreview = ({ items, selectedTemplateIds, onToggleTemplate, showAssignments }: Props) => {
  // Group by template for the toggle row
  const byTemplate = items.reduce((acc, it) => {
    const key = it.template.id;
    if (!acc[key]) acc[key] = { tpl: it.template, items: [] };
    acc[key].items.push(it);
    return acc;
  }, {} as Record<string, { tpl: PreviewShift['template']; items: PreviewShift[] }>);

  const groups = Object.values(byTemplate);

  if (!groups.length) {
    return (
      <div className="rounded-2xl border border-border/40 bg-muted/30 p-6 text-center">
        <p className="text-sm font-medium">No active templates with weekly schedules.</p>
        <p className="text-xs text-muted-foreground mt-1">Create a shift template with days of the week to use auto-fill.</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {groups.map(({ tpl, items }) => {
        const enabled = selectedTemplateIds.has(tpl.id);
        return (
          <div key={tpl.id} className="rounded-2xl border border-border/50 bg-card shadow-elevated overflow-hidden">
            <label className="flex items-start gap-3 p-4 cursor-pointer">
              <Checkbox
                checked={enabled}
                onCheckedChange={() => onToggleTemplate(tpl.id)}
                className="mt-0.5"
              />
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="font-semibold text-sm text-foreground">{tpl.name}</p>
                    <p className="text-xs text-muted-foreground">{tpl.position}</p>
                  </div>
                  <span className="text-[11px] font-medium text-primary bg-primary/10 px-2 py-0.5 rounded-full whitespace-nowrap">
                    {items.length} shift{items.length === 1 ? '' : 's'}
                  </span>
                </div>
                <div className="flex flex-wrap gap-3 mt-1.5 text-[11px] text-muted-foreground">
                  <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{formatTimeRange(tpl.start_time, tpl.end_time)}</span>
                  <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{tpl.location}</span>
                </div>
              </div>
            </label>

            {enabled && (
              <ul className="border-t border-border/40 divide-y divide-border/40">
                {items.map((it, i) => (
                  <li key={i} className="px-4 py-2.5 text-xs flex items-center justify-between gap-3">
                    <span className="text-muted-foreground">
                      {it.dayLabel}, {format(parseISO(it.date), 'MMM d')}
                    </span>
                    {showAssignments && (
                      it.suggestedWorker ? (
                        <span className="flex items-center gap-1 text-foreground">
                          <User className="w-3 h-3 text-primary" />
                          {it.suggestedWorker.full_name}
                        </span>
                      ) : (
                        <span className="flex items-center gap-1 text-warning-foreground">
                          <AlertTriangle className="w-3 h-3" />
                          No fit — leave open
                        </span>
                      )
                    )}
                  </li>
                ))}
              </ul>
            )}
          </div>
        );
      })}
    </div>
  );
};
