import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useShiftTemplates, type ShiftTemplate } from '@/hooks/useShiftTemplates';
import { useTeamMembers, type TeamMember } from '@/hooks/useTeamMembers';
import { addDays, format, startOfWeek } from 'date-fns';
import { toast } from 'sonner';

export interface PreviewShift {
  template: ShiftTemplate;
  date: string; // yyyy-MM-dd
  dayLabel: string;
  // After auto-assign, may include suggested worker
  suggestedWorker?: TeamMember | null;
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

  const generate = useCallback(
    async (items: PreviewShift[], opts: GenerateOptions): Promise<GenerateResult> => {
      if (!profile?.team_id) {
        toast.error('No team configured');
        return { created: 0, skipped: 0, assigned: 0 };
      }
      setGenerating(true);
      const enabled = items.filter(i => opts.templateIds.includes(i.template.id));

      // Optional: auto-assign best fit
      const assignmentMap = new Map<string, string>(); // key=date|start|position -> workerId
      if (opts.autoAssign && workers.length) {
        // Track tentative weekly hours per worker
        const hours: Record<string, number> = {};
        // Pre-fetch existing scheduled hours this week
        const allDates = Array.from(new Set(enabled.map(e => e.date)));
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

        // Fetch availability blocks
        const workerIds = workers.map(w => w.id);
        const { data: avail } = await supabase
          .from('availability_settings')
          .select('worker_id, day_of_week, specific_date, availability_type')
          .in('worker_id', workerIds);
        const blocked = new Set<string>(); // `${workerId}|${date}`
        (avail || []).forEach(a => {
          if (a.availability_type !== 'blocked') return;
          if (a.specific_date) blocked.add(`${a.worker_id}|${a.specific_date}`);
          if (a.day_of_week !== null && a.day_of_week !== undefined) {
            // Mark every date in this generation matching that day of week
            allDates.forEach(d => {
              if (new Date(d + 'T00:00:00').getDay() === a.day_of_week) {
                blocked.add(`${a.worker_id}|${d}`);
              }
            });
          }
        });

        for (const item of enabled) {
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
                w,
                wouldOver,
                current,
                score: (w.reliability_score || 80) - (wouldOver ? 1000 : 0) - current * 2,
              };
            })
            .sort((a, b) => b.score - a.score);

          const pick = candidates[0];
          if (pick && !pick.wouldOver) {
            assignmentMap.set(`${item.date}|${item.template.start_time}|${item.template.position}`, pick.w.id);
            hours[pick.w.id] = pick.current + dur;
            item.suggestedWorker = pick.w;
          } else {
            item.suggestedWorker = null;
          }
        }
      }

      // Insert shifts (idempotent thanks to unique index)
      let created = 0, skipped = 0, assigned = 0;
      for (const item of enabled) {
        const assignedWorkerId = opts.autoAssign
          ? assignmentMap.get(`${item.date}|${item.template.start_time}|${item.template.position}`) ?? null
          : null;
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
    [profile?.team_id, workers],
  );

  return { templates, workers, generating, previewWeek, generate };
}
