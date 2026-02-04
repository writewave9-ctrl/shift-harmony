import { useState } from 'react';
import { cn } from '@/lib/utils';
import { StatusBadge } from '@/components/StatusBadge';
import { 
  Calendar, 
  Clock, 
  ChevronRight, 
  ChevronDown,
  History,
  CheckCircle,
  XCircle,
  AlertCircle
} from 'lucide-react';
import { shifts, attendanceRecords, currentWorker } from '@/data/mockData';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';

interface ShiftHistoryItem {
  id: string;
  date: string;
  startTime: string;
  endTime: string;
  position: string;
  location: string;
  status: string;
  attendance: {
    status: string;
    checkInTime?: string;
    checkOutTime?: string;
    isProximityBased: boolean;
    notes?: string;
  } | null;
}

export const WorkerShiftHistory = () => {
  const [expandedShift, setExpandedShift] = useState<string | null>(null);

  // Get completed shifts for current worker
  const completedShifts = shifts
    .filter(s => 
      s.assignedWorker?.id === currentWorker.id && 
      s.status === 'completed'
    )
    .map(shift => {
      const attendance = attendanceRecords.find(a => a.shiftId === shift.id);
      return {
        id: shift.id,
        date: shift.date,
        startTime: shift.startTime,
        endTime: shift.endTime,
        position: shift.position,
        location: shift.location,
        status: shift.status,
        attendance: attendance ? {
          status: attendance.status,
          checkInTime: attendance.checkInTime,
          checkOutTime: attendance.checkOutTime,
          isProximityBased: attendance.isProximityBased,
          notes: attendance.notes,
        } : null,
      };
    });

  // Mock some completed shifts for demo
  const mockHistory: ShiftHistoryItem[] = [
    {
      id: 'h1',
      date: new Date(Date.now() - 86400000 * 2).toISOString().split('T')[0],
      startTime: '09:00',
      endTime: '15:00',
      position: 'Server',
      location: 'Main Floor',
      status: 'completed',
      attendance: {
        status: 'present',
        checkInTime: '08:58',
        checkOutTime: '15:02',
        isProximityBased: true,
      },
    },
    {
      id: 'h2',
      date: new Date(Date.now() - 86400000 * 4).toISOString().split('T')[0],
      startTime: '14:00',
      endTime: '22:00',
      position: 'Server',
      location: 'Patio',
      status: 'completed',
      attendance: {
        status: 'late',
        checkInTime: '14:15',
        checkOutTime: '22:05',
        isProximityBased: true,
        notes: 'Traffic delay - 15 min late',
      },
    },
    {
      id: 'h3',
      date: new Date(Date.now() - 86400000 * 6).toISOString().split('T')[0],
      startTime: '10:00',
      endTime: '16:00',
      position: 'Server',
      location: 'Main Floor',
      status: 'completed',
      attendance: {
        status: 'present',
        checkInTime: '09:55',
        checkOutTime: '16:00',
        isProximityBased: true,
      },
    },
    {
      id: 'h4',
      date: new Date(Date.now() - 86400000 * 8).toISOString().split('T')[0],
      startTime: '17:00',
      endTime: '23:00',
      position: 'Server',
      location: 'Main Floor',
      status: 'completed',
      attendance: {
        status: 'manually_approved',
        checkInTime: '17:00',
        checkOutTime: '23:00',
        isProximityBased: false,
        notes: 'Proximity issue - manually verified by manager',
      },
    },
  ];

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { 
      weekday: 'short', 
      month: 'short', 
      day: 'numeric' 
    });
  };

  const calculateHours = (start: string, end: string) => {
    const [startH, startM] = start.split(':').map(Number);
    const [endH, endM] = end.split(':').map(Number);
    let hours = endH - startH;
    let minutes = endM - startM;
    if (minutes < 0) {
      hours -= 1;
      minutes += 60;
    }
    if (hours < 0) hours += 24;
    return `${hours}h ${minutes > 0 ? `${minutes}m` : ''}`;
  };

  const getAttendanceIcon = (status: string) => {
    switch (status) {
      case 'present':
        return <CheckCircle className="w-4 h-4 text-success" />;
      case 'late':
        return <AlertCircle className="w-4 h-4 text-warning" />;
      case 'manually_approved':
        return <CheckCircle className="w-4 h-4 text-info" />;
      default:
        return <XCircle className="w-4 h-4 text-destructive" />;
    }
  };

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Header */}
      <header className="px-4 pt-8 pb-6">
        <div className="flex items-center gap-2 mb-1">
          <History className="w-5 h-5 text-primary" />
          <p className="text-sm text-muted-foreground">Shift History</p>
        </div>
        <h1 className="text-2xl font-bold text-foreground">Completed Shifts</h1>
      </header>

      <div className="px-4 space-y-3 stagger-children">
        {mockHistory.map(shift => (
          <Collapsible
            key={shift.id}
            open={expandedShift === shift.id}
            onOpenChange={(open) => setExpandedShift(open ? shift.id : null)}
          >
            <div className="card-elevated rounded-xl overflow-hidden">
              <CollapsibleTrigger className="w-full p-4 flex items-center justify-between text-left hover:bg-accent/30 transition-colors">
                <div className="flex items-center gap-3">
                  {shift.attendance && getAttendanceIcon(shift.attendance.status)}
                  <div>
                    <p className="font-medium text-foreground">
                      {shift.position} • {shift.location}
                    </p>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Calendar className="w-3 h-3" />
                      <span>{formatDate(shift.date)}</span>
                      <span>•</span>
                      <Clock className="w-3 h-3" />
                      <span>{shift.startTime} - {shift.endTime}</span>
                    </div>
                  </div>
                </div>
                <ChevronDown className={cn(
                  "w-5 h-5 text-muted-foreground transition-transform",
                  expandedShift === shift.id && "rotate-180"
                )} />
              </CollapsibleTrigger>
              
              <CollapsibleContent>
                <div className="px-4 pb-4 pt-2 border-t border-border/50">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Duration</p>
                      <p className="font-medium text-foreground">
                        {calculateHours(shift.startTime, shift.endTime)}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Status</p>
                      {shift.attendance && (
                        <StatusBadge status={shift.attendance.status as any} />
                      )}
                    </div>
                  </div>

                  {shift.attendance && (
                    <div className="mt-4 pt-4 border-t border-border/50 space-y-3">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-xs text-muted-foreground">Check In</p>
                          <p className="font-medium text-foreground">
                            {shift.attendance.checkInTime || '—'}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-xs text-muted-foreground">Check Out</p>
                          <p className="font-medium text-foreground">
                            {shift.attendance.checkOutTime || '—'}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 text-xs">
                        <span className={cn(
                          "px-2 py-1 rounded-full",
                          shift.attendance.isProximityBased 
                            ? "bg-primary/10 text-primary" 
                            : "bg-info-muted text-info"
                        )}>
                          {shift.attendance.isProximityBased ? 'Auto Check-in' : 'Manual Entry'}
                        </span>
                      </div>

                      {shift.attendance.notes && (
                        <div className="p-3 rounded-lg bg-accent/50">
                          <p className="text-xs text-muted-foreground mb-1">Notes</p>
                          <p className="text-sm text-foreground">{shift.attendance.notes}</p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </CollapsibleContent>
            </div>
          </Collapsible>
        ))}

        {mockHistory.length === 0 && (
          <div className="text-center py-12">
            <History className="w-12 h-12 text-muted-foreground/50 mx-auto mb-4" />
            <p className="text-muted-foreground">No completed shifts yet</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default WorkerShiftHistory;
