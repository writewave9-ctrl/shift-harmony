import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { FileSpreadsheet, FileText, Loader2, Download } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { format, startOfWeek, endOfWeek, startOfMonth, endOfMonth, startOfQuarter, endOfQuarter, eachDayOfInterval } from 'date-fns';
import { toast } from 'sonner';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

type Period = 'week' | 'month' | 'quarter';

const labels: Record<Period, string> = { week: 'This week', month: 'This month', quarter: 'This quarter' };

const range = (p: Period) => {
  const now = new Date();
  switch (p) {
    case 'week': return { start: startOfWeek(now, { weekStartsOn: 1 }), end: endOfWeek(now, { weekStartsOn: 1 }) };
    case 'month': return { start: startOfMonth(now), end: endOfMonth(now) };
    case 'quarter': return { start: startOfQuarter(now), end: endOfQuarter(now) };
  }
};

const downloadCsv = (filename: string, rows: (string | number)[][]) => {
  const csv = rows.map(r => r.map(c => {
    const s = String(c ?? '');
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  }).join(',')).join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = filename; a.click();
  URL.revokeObjectURL(url);
};

const hoursBetween = (start: string, end: string) => {
  const [sh, sm] = start.split(':').map(Number);
  const [eh, em] = end.split(':').map(Number);
  let h = (eh + em / 60) - (sh + sm / 60);
  if (h < 0) h += 24;
  return h;
};

export const ReportExportPanel = () => {
  const { profile } = useAuth();
  const [period, setPeriod] = useState<Period>('month');
  const [busy, setBusy] = useState<string | null>(null);

  const fetchData = async () => {
    if (!profile?.team_id) throw new Error('No team');
    const { start, end } = range(period);
    const startStr = format(start, 'yyyy-MM-dd'), endStr = format(end, 'yyyy-MM-dd');
    const { data: shifts } = await supabase.from('shifts')
      .select('*, assigned_worker:profiles!shifts_assigned_worker_id_fkey(id, full_name)')
      .eq('team_id', profile.team_id).gte('date', startStr).lte('date', endStr);
    const shiftIds = (shifts || []).map(s => s.id);
    let attendance: any[] = [];
    if (shiftIds.length) {
      const { data: att } = await supabase.from('attendance_records').select('*').in('shift_id', shiftIds);
      attendance = att || [];
    }
    return { shifts: shifts || [], attendance, start, end, startStr, endStr };
  };

  const exportCoverageCsv = async () => {
    setBusy('coverage');
    try {
      const { shifts, start, end } = await fetchData();
      const days = eachDayOfInterval({ start, end });
      const rows: (string | number)[][] = [['Date', 'Total', 'Filled', 'Vacant', 'Coverage %']];
      days.forEach(d => {
        const ds = format(d, 'yyyy-MM-dd');
        const ds_shifts = shifts.filter(s => s.date === ds);
        const total = ds_shifts.length;
        const filled = ds_shifts.filter(s => !s.is_vacant).length;
        rows.push([ds, total, filled, total - filled, total ? Math.round((filled / total) * 100) : 0]);
      });
      downloadCsv(`shift-coverage-${period}.csv`, rows);
      toast.success('Coverage report downloaded');
    } catch (e: any) { toast.error(e.message); }
    finally { setBusy(null); }
  };

  const exportAttendanceCsv = async () => {
    setBusy('attendance');
    try {
      const { shifts, attendance } = await fetchData();
      const byWorker: Record<string, { name: string; present: number; late: number; absent: number; total: number }> = {};
      attendance.forEach(a => {
        const shift = shifts.find(s => s.id === a.shift_id);
        const name = shift?.assigned_worker?.full_name || 'Unknown';
        const key = a.worker_id;
        if (!byWorker[key]) byWorker[key] = { name, present: 0, late: 0, absent: 0, total: 0 };
        byWorker[key].total++;
        if (a.status === 'present' || a.status === 'manually_approved') byWorker[key].present++;
        else if (a.status === 'late') byWorker[key].late++;
        else byWorker[key].absent++;
      });
      const rows: (string | number)[][] = [['Worker', 'Present', 'Late', 'Absent', 'Total', 'On-time %']];
      Object.values(byWorker).forEach(w => {
        rows.push([w.name, w.present, w.late, w.absent, w.total, w.total ? Math.round((w.present / w.total) * 100) : 0]);
      });
      downloadCsv(`attendance-${period}.csv`, rows);
      toast.success('Attendance report downloaded');
    } catch (e: any) { toast.error(e.message); }
    finally { setBusy(null); }
  };

  const exportPayrollCsv = async () => {
    setBusy('payroll');
    try {
      const { shifts, attendance } = await fetchData();
      const byWorker: Record<string, { name: string; scheduled: number; completed: number }> = {};
      shifts.forEach(s => {
        if (!s.assigned_worker_id) return;
        const name = s.assigned_worker?.full_name || 'Unknown';
        const key = s.assigned_worker_id;
        if (!byWorker[key]) byWorker[key] = { name, scheduled: 0, completed: 0 };
        const h = hoursBetween(s.start_time, s.end_time);
        byWorker[key].scheduled += h;
        if (s.status === 'completed') byWorker[key].completed += h;
      });
      const rows: (string | number)[][] = [['Worker', 'Scheduled hours', 'Completed hours']];
      Object.values(byWorker).forEach(w => rows.push([w.name, w.scheduled.toFixed(1), w.completed.toFixed(1)]));
      downloadCsv(`payroll-hours-${period}.csv`, rows);
      toast.success('Payroll report downloaded');
    } catch (e: any) { toast.error(e.message); }
    finally { setBusy(null); }
  };

  const exportPdfSummary = async () => {
    setBusy('pdf');
    try {
      const { shifts, attendance, start, end } = await fetchData();
      const doc = new jsPDF();
      doc.setFontSize(18);
      doc.text('Workforce Report', 14, 18);
      doc.setFontSize(11);
      doc.setTextColor(120);
      doc.text(`${format(start, 'MMM d, yyyy')} – ${format(end, 'MMM d, yyyy')}`, 14, 25);
      doc.setTextColor(0);

      const total = shifts.length;
      const filled = shifts.filter(s => !s.is_vacant).length;
      const onTime = attendance.filter(a => a.status === 'present' || a.status === 'manually_approved').length;
      const late = attendance.filter(a => a.status === 'late').length;
      const absent = attendance.filter(a => a.status === 'absent' || a.status === 'not_checked_in').length;

      autoTable(doc, {
        startY: 32,
        head: [['Metric', 'Value']],
        body: [
          ['Total shifts', String(total)],
          ['Filled shifts', String(filled)],
          ['Coverage rate', `${total ? Math.round((filled / total) * 100) : 0}%`],
          ['On-time check-ins', String(onTime)],
          ['Late check-ins', String(late)],
          ['Absent / no-shows', String(absent)],
        ],
        theme: 'striped',
      });
      doc.save(`workforce-summary-${period}.pdf`);
      toast.success('PDF summary downloaded');
    } catch (e: any) { toast.error(e.message); }
    finally { setBusy(null); }
  };

  return (
    <Card className="rounded-2xl shadow-elevated border-border/50">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <Download className="w-4 h-4 text-primary" />
          Reports & exports
        </CardTitle>
        <CardDescription>Download CSV / PDF reports for payroll and audits.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-wrap gap-2">
          {(['week', 'month', 'quarter'] as Period[]).map(p => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={`px-3 py-1 rounded-full text-[11px] font-semibold transition-all border ${
                period === p ? 'bg-gradient-primary text-primary-foreground border-transparent shadow-glow' : 'bg-muted text-muted-foreground border-border/40'
              }`}
            >
              {labels[p]}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Button variant="outline" className="rounded-xl justify-start gap-2" onClick={exportCoverageCsv} disabled={!!busy}>
            {busy === 'coverage' ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileSpreadsheet className="w-4 h-4 text-primary" />}
            Shift coverage (CSV)
          </Button>
          <Button variant="outline" className="rounded-xl justify-start gap-2" onClick={exportAttendanceCsv} disabled={!!busy}>
            {busy === 'attendance' ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileSpreadsheet className="w-4 h-4 text-primary" />}
            Attendance (CSV)
          </Button>
          <Button variant="outline" className="rounded-xl justify-start gap-2" onClick={exportPayrollCsv} disabled={!!busy}>
            {busy === 'payroll' ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileSpreadsheet className="w-4 h-4 text-primary" />}
            Payroll hours (CSV)
          </Button>
          <Button variant="outline" className="rounded-xl justify-start gap-2" onClick={exportPdfSummary} disabled={!!busy}>
            {busy === 'pdf' ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileText className="w-4 h-4 text-primary" />}
            PDF summary
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};
