import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { startOfWeek, endOfWeek, subWeeks, format, eachDayOfInterval, startOfMonth, endOfMonth, subMonths } from 'date-fns';

export interface ShiftCoverageData {
  date: string;
  total: number;
  filled: number;
  vacant: number;
  coverage: number;
}

export interface AttendanceData {
  date: string;
  present: number;
  late: number;
  absent: number;
  total: number;
}

export interface TeamPerformanceData {
  workerId: string;
  workerName: string;
  shiftsCompleted: number;
  onTimeRate: number;
  reliabilityScore: number;
}

export interface AnalyticsSummary {
  totalShifts: number;
  filledShifts: number;
  coverageRate: number;
  averageAttendance: number;
  onTimeRate: number;
  totalHoursScheduled: number;
}

export function useAnalytics(period: 'week' | 'month' = 'week') {
  const { profile } = useAuth();
  const [shiftCoverage, setShiftCoverage] = useState<ShiftCoverageData[]>([]);
  const [attendance, setAttendance] = useState<AttendanceData[]>([]);
  const [teamPerformance, setTeamPerformance] = useState<TeamPerformanceData[]>([]);
  const [summary, setSummary] = useState<AnalyticsSummary | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchAnalytics = async () => {
    if (!profile?.team_id) {
      setShiftCoverage([]);
      setAttendance([]);
      setTeamPerformance([]);
      setSummary(null);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const now = new Date();
      const startDate = period === 'week' 
        ? startOfWeek(subWeeks(now, 3), { weekStartsOn: 1 })
        : startOfMonth(subMonths(now, 2));
      const endDate = period === 'week'
        ? endOfWeek(now, { weekStartsOn: 1 })
        : endOfMonth(now);

      // Fetch shifts for the period
      const { data: shifts, error: shiftsError } = await supabase
        .from('shifts')
        .select('*')
        .eq('team_id', profile.team_id)
        .gte('date', format(startDate, 'yyyy-MM-dd'))
        .lte('date', format(endDate, 'yyyy-MM-dd'));

      if (shiftsError) throw shiftsError;

      // Fetch attendance records
      const shiftIds = shifts?.map(s => s.id) || [];
      let attendanceRecords: any[] = [];
      
      if (shiftIds.length > 0) {
        const { data: attendance, error: attendanceError } = await supabase
          .from('attendance_records')
          .select('*')
          .in('shift_id', shiftIds);

        if (attendanceError) throw attendanceError;
        attendanceRecords = attendance || [];
      }

      // Fetch team members
      const { data: workers, error: workersError } = await supabase
        .from('profiles')
        .select('id, full_name, reliability_score')
        .eq('team_id', profile.team_id);

      if (workersError) throw workersError;

      // Process shift coverage data
      const days = eachDayOfInterval({ start: startDate, end: endDate });
      const coverageData: ShiftCoverageData[] = days.map(day => {
        const dayStr = format(day, 'yyyy-MM-dd');
        const dayShifts = shifts?.filter(s => s.date === dayStr) || [];
        const filled = dayShifts.filter(s => !s.is_vacant).length;
        const total = dayShifts.length;
        
        return {
          date: format(day, 'MMM dd'),
          total,
          filled,
          vacant: total - filled,
          coverage: total > 0 ? Math.round((filled / total) * 100) : 0,
        };
      });

      // Process attendance data
      const attendanceData: AttendanceData[] = days.map(day => {
        const dayStr = format(day, 'yyyy-MM-dd');
        const dayShifts = shifts?.filter(s => s.date === dayStr) || [];
        const dayShiftIds = dayShifts.map(s => s.id);
        const dayAttendance = attendanceRecords.filter(a => dayShiftIds.includes(a.shift_id));
        
        const present = dayAttendance.filter(a => a.status === 'present' || a.status === 'manually_approved').length;
        const late = dayAttendance.filter(a => a.status === 'late').length;
        const absent = dayAttendance.filter(a => a.status === 'absent' || a.status === 'not_checked_in').length;
        
        return {
          date: format(day, 'MMM dd'),
          present,
          late,
          absent,
          total: dayAttendance.length,
        };
      });

      // Process team performance
      const performanceData: TeamPerformanceData[] = (workers || []).map(worker => {
        const workerShifts = shifts?.filter(s => s.assigned_worker_id === worker.id && s.status === 'completed') || [];
        const workerAttendance = attendanceRecords.filter(a => a.worker_id === worker.id);
        const onTime = workerAttendance.filter(a => a.status === 'present' || a.status === 'manually_approved').length;
        
        return {
          workerId: worker.id,
          workerName: worker.full_name,
          shiftsCompleted: workerShifts.length,
          onTimeRate: workerAttendance.length > 0 ? Math.round((onTime / workerAttendance.length) * 100) : 100,
          reliabilityScore: worker.reliability_score || 80,
        };
      }).sort((a, b) => b.shiftsCompleted - a.shiftsCompleted);

      // Calculate summary
      const totalShifts = shifts?.length || 0;
      const filledShifts = shifts?.filter(s => !s.is_vacant).length || 0;
      const totalAttendance = attendanceRecords.length;
      const onTimeCount = attendanceRecords.filter(a => a.status === 'present' || a.status === 'manually_approved').length;
      
      // Calculate total hours
      const totalHours = shifts?.reduce((acc, shift) => {
        const [startH, startM] = shift.start_time.split(':').map(Number);
        const [endH, endM] = shift.end_time.split(':').map(Number);
        const hours = (endH + endM / 60) - (startH + startM / 60);
        return acc + (hours > 0 ? hours : 24 + hours);
      }, 0) || 0;

      setSummary({
        totalShifts,
        filledShifts,
        coverageRate: totalShifts > 0 ? Math.round((filledShifts / totalShifts) * 100) : 0,
        averageAttendance: totalAttendance > 0 ? Math.round((onTimeCount / totalAttendance) * 100) : 0,
        onTimeRate: totalAttendance > 0 ? Math.round((onTimeCount / totalAttendance) * 100) : 0,
        totalHoursScheduled: Math.round(totalHours),
      });

      setShiftCoverage(coverageData);
      setAttendance(attendanceData);
      setTeamPerformance(performanceData);
    } catch (err) {
      console.error('Error fetching analytics:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, [profile?.team_id, period]);

  return {
    shiftCoverage,
    attendance,
    teamPerformance,
    summary,
    loading,
    refetch: fetchAnalytics,
  };
}
