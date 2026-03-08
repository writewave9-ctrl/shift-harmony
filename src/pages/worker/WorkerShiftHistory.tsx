import { useState, useEffect, useCallback } from 'react';
import { PullToRefresh } from '@/components/PullToRefresh';
import { WorkerHistorySkeleton } from '@/components/PageSkeletons';
import { MotionItem } from '@/components/MotionWrapper';
import { haptics } from '@/lib/haptics';
import { cn } from '@/lib/utils';
import { StatusBadge } from '@/components/StatusBadge';
import { Calendar, Clock, ChevronDown, History, CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';

interface ShiftHistoryItem {
  id: string;
  date: string;
  start_time: string;
  end_time: string;
  position: string;
  location: string;
  status: string;
  attendance: {
    status: string;
    check_in_time: string | null;
    check_out_time: string | null;
    is_proximity_based: boolean;
    override_notes: string | null;
  } | null;
}

export const WorkerShiftHistory = () => {
  const { profile } = useAuth();
  const [expandedShift, setExpandedShift] = useState<string | null>(null);
  const [shifts, setShifts] = useState<ShiftHistoryItem[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchHistory = useCallback(async () => {
    if (!profile?.id) {
      setShifts([]);
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('shifts')
        .select(`id, date, start_time, end_time, position, location, status, attendance_records!inner(status, check_in_time, check_out_time, is_proximity_based, override_notes)`)
        .eq('assigned_worker_id', profile.id)
        .eq('status', 'completed')
        .order('date', { ascending: false })
        .limit(20);

      if (error) {
        const { data: shiftsOnly } = await supabase
          .from('shifts').select('*').eq('assigned_worker_id', profile.id).eq('status', 'completed').order('date', { ascending: false }).limit(20);
        setShifts((shiftsOnly || []).map(s => ({ ...s, attendance: null })));
      } else {
        setShifts((data || []).map((s: any) => ({
          id: s.id, date: s.date, start_time: s.start_time, end_time: s.end_time,
          position: s.position, location: s.location, status: s.status,
          attendance: s.attendance_records?.[0] || null,
        })));
      }
    } catch (err) {
      console.error('Error fetching history:', err);
    } finally {
      setLoading(false);
    }
  }, [profile?.id]);

  useEffect(() => { fetchHistory(); }, [fetchHistory]);

  const formatDate = (dateStr: string) => new Date(dateStr).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });

  const calcMinutes = (start: string, end: string) => {
    const [sH, sM] = start.split(':').map(Number);
    const [eH, eM] = end.split(':').map(Number);
    let mins = (eH * 60 + eM) - (sH * 60 + sM);
    if (mins < 0) mins += 24 * 60;
    return mins;
  };

  const now = new Date();
  const startOfWeek = new Date(now);
  startOfWeek.setDate(now.getDate() - now.getDay());
  startOfWeek.setHours(0, 0, 0, 0);
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  const weeklyMinutes = shifts
    .filter(s => new Date(s.date) >= startOfWeek)
    .reduce((sum, s) => sum + calcMinutes(s.start_time, s.end_time), 0);
  const monthlyMinutes = shifts
    .filter(s => new Date(s.date) >= startOfMonth)
    .reduce((sum, s) => sum + calcMinutes(s.start_time, s.end_time), 0);
  const totalMinutes = shifts.reduce((sum, s) => sum + calcMinutes(s.start_time, s.end_time), 0);

  const fmtHours = (mins: number) => {
    const h = Math.floor(mins / 60);
    const m = mins % 60;
    return m > 0 ? `${h}h ${m}m` : `${h}h`;
  };

  const calculateHours = (start: string, end: string) => {
    const [startH, startM] = start.split(':').map(Number);
    const [endH, endM] = end.split(':').map(Number);
    let hours = endH - startH, minutes = endM - startM;
    if (minutes < 0) { hours -= 1; minutes += 60; }
    if (hours < 0) hours += 24;
    return `${hours}h ${minutes > 0 ? `${minutes}m` : ''}`;
  };

  const getAttendanceIcon = (status: string) => {
    switch (status) {
      case 'present': return <CheckCircle className="w-4 h-4 text-success" />;
      case 'late': return <AlertCircle className="w-4 h-4 text-warning" />;
      case 'manually_approved': return <CheckCircle className="w-4 h-4 text-info" />;
      default: return <XCircle className="w-4 h-4 text-destructive" />;
    }
  };

  const formatTime = (isoTime: string | null) => {
    if (!isoTime) return '—';
    return new Date(isoTime).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
  };

  if (loading) return <WorkerHistorySkeleton />;

  return (
    <PullToRefresh onRefresh={async () => { haptics.medium(); await fetchHistory(); }}>
    <div className="min-h-screen bg-background pb-24">
      <header className="px-4 pt-6 pb-4">
        <div className="flex items-center gap-2 mb-1">
          <History className="w-5 h-5 text-primary" />
          <p className="text-sm text-muted-foreground">Shift History</p>
        </div>
        <h1 className="text-2xl font-bold text-foreground">Completed Shifts</h1>
      </header>

      {shifts.length > 0 && (
        <div className="px-4 mb-4 grid grid-cols-3 gap-3">
          <div className="card-elevated rounded-xl p-3 text-center">
            <p className="text-xs text-muted-foreground mb-1">This Week</p>
            <p className="text-lg font-bold text-foreground">{fmtHours(weeklyMinutes)}</p>
          </div>
          <div className="card-elevated rounded-xl p-3 text-center">
            <p className="text-xs text-muted-foreground mb-1">This Month</p>
            <p className="text-lg font-bold text-foreground">{fmtHours(monthlyMinutes)}</p>
          </div>
          <div className="card-elevated rounded-xl p-3 text-center">
            <p className="text-xs text-muted-foreground mb-1">All Time</p>
            <p className="text-lg font-bold text-primary">{fmtHours(totalMinutes)}</p>
          </div>
        </div>
      )}

      <div className="px-4 space-y-3">
        {shifts.map((shift, index) => (
          <MotionItem key={shift.id} index={index}>
            <Collapsible open={expandedShift === shift.id} onOpenChange={(open) => setExpandedShift(open ? shift.id : null)}>
              <div className="card-elevated rounded-xl overflow-hidden">
                <CollapsibleTrigger className="w-full p-4 flex items-center justify-between text-left hover:bg-accent/30 transition-colors">
                  <div className="flex items-center gap-3">
                    {shift.attendance && getAttendanceIcon(shift.attendance.status)}
                    <div>
                      <p className="font-medium text-foreground">{shift.position} • {shift.location}</p>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Calendar className="w-3 h-3" /><span>{formatDate(shift.date)}</span><span>•</span>
                        <Clock className="w-3 h-3" /><span>{shift.start_time} - {shift.end_time}</span>
                      </div>
                    </div>
                  </div>
                  <ChevronDown className={cn("w-5 h-5 text-muted-foreground transition-transform", expandedShift === shift.id && "rotate-180")} />
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <div className="px-4 pb-4 pt-2 border-t border-border/50">
                    <div className="grid grid-cols-2 gap-4">
                      <div><p className="text-xs text-muted-foreground mb-1">Duration</p><p className="font-medium text-foreground">{calculateHours(shift.start_time, shift.end_time)}</p></div>
                      <div><p className="text-xs text-muted-foreground mb-1">Status</p>{shift.attendance && <StatusBadge status={shift.attendance.status as any} />}</div>
                    </div>
                    {shift.attendance && (
                      <div className="mt-4 pt-4 border-t border-border/50 space-y-3">
                        <div className="flex items-center justify-between">
                          <div><p className="text-xs text-muted-foreground">Check In</p><p className="font-medium text-foreground">{formatTime(shift.attendance.check_in_time)}</p></div>
                          <div className="text-right"><p className="text-xs text-muted-foreground">Check Out</p><p className="font-medium text-foreground">{formatTime(shift.attendance.check_out_time)}</p></div>
                        </div>
                        <div className="flex items-center gap-2 text-xs">
                          <span className={cn("px-2 py-1 rounded-full", shift.attendance.is_proximity_based ? "bg-primary/10 text-primary" : "bg-info-muted text-info")}>
                            {shift.attendance.is_proximity_based ? 'Auto Check-in' : 'Manual Entry'}
                          </span>
                        </div>
                        {shift.attendance.override_notes && (
                          <div className="p-3 rounded-lg bg-accent/50"><p className="text-xs text-muted-foreground mb-1">Notes</p><p className="text-sm text-foreground">{shift.attendance.override_notes}</p></div>
                        )}
                      </div>
                    )}
                  </div>
                </CollapsibleContent>
              </div>
            </Collapsible>
          </MotionItem>
        ))}
        {shifts.length === 0 && (
          <div className="text-center py-12">
            <History className="w-12 h-12 text-muted-foreground/50 mx-auto mb-4" />
            <p className="text-muted-foreground">No completed shifts yet</p>
          </div>
        )}
      </div>
    </div>
    </PullToRefresh>
  );
};

export default WorkerShiftHistory;
