import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useShiftTemplates, type ShiftTemplate } from '@/hooks/useShiftTemplates';
import { useTeamMembers, type TeamMember } from '@/hooks/useTeamMembers';
import { addDays, format, startOfWeek } from 'date-fns';
import { toast } from 'sonner';

export interface RecommendationFactors {
  availability: 'free' | 'blocked' | 'unknown';
  reliabilityBand: 'excellent' | 'strong' | 'building'; // anonymized buckets
  hoursHeadroom: 'plenty' | 'some' | 'none'; // remaining hours vs target this week
  candidatePoolSize: number; // how many workers were eligible (no names)
}

export interface PreviewShift {
  template: ShiftTemplate;
  date: string; // yyyy-MM-dd
  dayLabel: string;
  // After auto-assign, may include suggested worker
  suggestedWorker?: TeamMember | null;
  factors?: RecommendationFactors;
}

export interface GenerateOptions {
  templateIds: string[];
  autoAssign: boolean;
}

export interface GenerateResult {
  created: number;
  skipped: number;
  assigned: number;
}

const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export function useShiftAutoFill() {
  const { profile } = useAuth();
  const { templates } = useShiftTemplates();
  const { workers } = useTeamMembers();
  const [generating, setGenerating] = useState(false);

  const previewWeek = useCallback(
    (weekStart: Date): PreviewShift[] => {
      const monday = startOfWeek(weekStart, { weekStartsOn: 1 });
      const items: PreviewShift[] = [];
      for (const tpl of templates) {
        if (!tpl.is_active) continue;
        const days = (tpl.days_of_week || []).filter(d => d >= 0 && d <= 6);
        for (const dow of days) {
          // dow: 0=Sun..6=Sat. Map to days from monday (Mon=0).
          const offset = dow === 0 ? 6 : dow - 1;
          const date = addDays(monday, offset);
          items.push({
            template: tpl,
            date: format(date, 'yyyy-MM-dd'),
            dayLabel: DAY_NAMES[dow],
          });
        }
      }
      // Sort by date then start_time
      items.sort((a, b) =>
        a.date.localeCompare(b.date) || a.template.start_time.localeCompare(b.template.start_time),
      );
      return items;
    },
    [templates],
  );

  const scoreAssignments = useCallback(
    async (items: PreviewShift[]): Promise<void> => {
      if (!profile?.team_id || !workers.length) {
        items.forEach(i => { i.suggestedWorker = null; i.factors = undefined; });
        return;
      }
      const hours: Record<string, number> = {};
      const allDates = Array.from(new Set(items.map(e => e.date)));
      if (allDates.length) {
        const { data: existing } = await supabase
          .from('shifts')
          .select('assigned_worker_id, start_time, end_time, date')
          .eq('team_id', profile.team_id)
          .in('date', allDates);
        (existing || []).forEach(s => {
          if (!s.assigned_worker_id) return;
          const [sh, sm] = s.start_time.split(':').map(Number);
          const [eh, em] = s.end_time.split(':').map(Number);
          let h = (eh + em / 60) - (sh + sm / 60); if (h < 0) h += 24;
          hours[s.assigned_worker_id] = (hours[s.assigned_worker_id] || 0) + h;
        });
      }

      const workerIds = workers.map(w => w.id);
      const { data: avail } = await supabase
        .from('availability_settings')
        .select('worker_id, day_of_week, specific_date, availability_type')
        .in('worker_id', workerIds);
      const blocked = new Set<string>();
      (avail || []).forEach(a => {
        if (a.availability_type !== 'blocked') return;
        if (a.specific_date) blocked.add(`${a.worker_id}|${a.specific_date}`);
        if (a.day_of_week !== null && a.day_of_week !== undefined) {
          allDates.forEach(d => {
            if (new Date(d + 'T00:00:00').getDay() === a.day_of_week) {
              blocked.add(`${a.worker_id}|${d}`);
            }
          });
        }
      });

      for (const item of items) {
        const [sh, sm] = item.template.start_time.split(':').map(Number);
        const [eh, em] = item.template.end_time.split(':').map(Number);
        let dur = (eh + em / 60) - (sh + sm / 60); if (dur < 0) dur += 24;

        const candidates = workers
          .filter(w => !blocked.has(`${w.id}|${item.date}`))
          .map(w => {
            const target = w.weekly_hours_target || 40;
            const current = hours[w.id] || 0;
            const wouldOver = current + dur > target;
            return {
              w, wouldOver, current,
              score: (w.reliability_score || 80) - (wouldOver ? 1000 : 0) - current * 2,
            };
          })
          .sort((a, b) => b.score - a.score);

        const pick = candidates[0];
        const eligibleCount = candidates.filter(c => !c.wouldOver).length;
        if (pick && !pick.wouldOver) {
          hours[pick.w.id] = pick.current + dur;
          item.suggestedWorker = pick.w;
          const target = pick.w.weekly_hours_target || 40;
          const remaining = target - pick.current - dur;
          const reliability = pick.w.reliability_score || 80;
          item.factors = {
            availability: 'free',
            reliabilityBand: reliability >= 90 ? 'excellent' : reliability >= 75 ? 'strong' : 'building',
            hoursHeadroom: remaining >= 8 ? 'plenty' : remaining > 0 ? 'some' : 'none',
            candidatePoolSize: eligibleCount,
          };
        } else {
          item.suggestedWorker = null;
          item.factors = {
            availability: candidates.length === 0 ? 'blocked' : 'unknown',
            reliabilityBand: 'building',
            hoursHeadroom: 'none',
            candidatePoolSize: eligibleCount,
          };
        }
      }
    },
    [profile?.team_id, workers],
  );

  const generate = useCallback(
    async (items: PreviewShift[], opts: GenerateOptions): Promise<GenerateResult> => {
      if (!profile?.team_id) {
        toast.error('No team configured');
        return { created: 0, skipped: 0, assigned: 0 };
      }
      setGenerating(true);
      const enabled = items.filter(i => opts.templateIds.includes(i.template.id));

      // If autoAssign requested but factors not pre-computed, score now.
      if (opts.autoAssign && enabled.some(i => !i.factors)) {
        await scoreAssignments(enabled);
      }

      let created = 0, skipped = 0, assigned = 0;
      for (const item of enabled) {
        const assignedWorkerId = opts.autoAssign ? item.suggestedWorker?.id ?? null : null;
        const { error } = await supabase.from('shifts').insert({
          team_id: profile.team_id,
          date: item.date,
          start_time: item.template.start_time,
          end_time: item.template.end_time,
          position: item.template.position,
          location: item.template.location,
          latitude: item.template.latitude,
          longitude: item.template.longitude,
          check_in_radius_meters: item.template.check_in_radius_meters || 100,
          notes: item.template.notes,
          assigned_worker_id: assignedWorkerId,
          is_vacant: !assignedWorkerId,
        });
        if (error) {
          if (error.code === '23505') skipped++;
          else { console.error(error); skipped++; }
        } else {
          created++;
          if (assignedWorkerId) assigned++;
        }
      }
      setGenerating(false);
      return { created, skipped, assigned };
    },
    [profile?.team_id, scoreAssignments],
  );

  return { templates, workers, generating, previewWeek, scoreAssignments, generate };
}
