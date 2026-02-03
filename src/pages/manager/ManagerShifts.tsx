import { useState } from 'react';
import { cn } from '@/lib/utils';
import { ShiftCard } from '@/components/ShiftCard';
import { StatusBadge } from '@/components/StatusBadge';
import { WorkerCard } from '@/components/WorkerCard';
import { WeeklyCalendar } from '@/components/WeeklyCalendar';
import { AttendanceOverrideModal } from '@/components/AttendanceOverrideModal';
import { ShiftMessaging } from '@/components/ShiftMessaging';
import { 
  shifts, 
  workers,
  attendanceRecords,
  getSuggestedReplacements,
  shiftMessages,
  currentManager,
} from '@/data/mockData';
import { 
  ChevronLeft, 
  Calendar,
  Plus,
  User,
  Check,
  Filter,
  LayoutGrid,
  List,
  MessageCircle,
  UserCheck
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Shift, AttendanceStatus, ShiftMessage } from '@/types/align';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';

type ViewMode = 'list' | 'calendar';

export const ManagerShifts = () => {
  const navigate = useNavigate();
  const [selectedShift, setSelectedShift] = useState<Shift | null>(null);
  const [showAssignDialog, setShowAssignDialog] = useState(false);
  const [showOverrideModal, setShowOverrideModal] = useState(false);
  const [showMessaging, setShowMessaging] = useState(false);
  const [assignmentDone, setAssignmentDone] = useState(false);
  const [filter, setFilter] = useState<'all' | 'vacant'>('all');
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [messages, setMessages] = useState<ShiftMessage[]>(shiftMessages);

  const suggestedWorkers = getSuggestedReplacements('');

  const filteredShifts = filter === 'vacant' 
    ? shifts.filter(s => s.isVacant)
    : shifts;

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    if (date.toDateString() === today.toDateString()) return 'Today';
    if (date.toDateString() === tomorrow.toDateString()) return 'Tomorrow';
    return date.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' });
  };

  // Group shifts by date
  const shiftsByDate = filteredShifts.reduce((acc, shift) => {
    const date = shift.date;
    if (!acc[date]) acc[date] = [];
    acc[date].push(shift);
    return acc;
  }, {} as Record<string, Shift[]>);

  const handleAssign = () => {
    setAssignmentDone(true);
    setTimeout(() => {
      setShowAssignDialog(false);
      setAssignmentDone(false);
      setSelectedShift(null);
    }, 1500);
  };

  const handleAttendanceOverride = (status: AttendanceStatus, notes: string, timestamp: string) => {
    console.log('Attendance override:', { status, notes, timestamp, shift: selectedShift });
    // In real app, this would update the backend
  };

  const handleSendMessage = (message: string) => {
    if (!selectedShift) return;
    const newMessage: ShiftMessage = {
      id: `msg_${Date.now()}`,
      shiftId: selectedShift.id,
      senderId: currentManager.id,
      senderName: currentManager.name,
      message,
      createdAt: new Date().toISOString(),
    };
    setMessages(prev => [...prev, newMessage]);
  };

  const handleShiftClick = (shift: Shift) => {
    setSelectedShift(shift);
    if (shift.isVacant) {
      setShowAssignDialog(true);
    }
  };

  const shiftMessages_filtered = messages.filter(m => m.shiftId === selectedShift?.id);

  return (
    <div className="min-h-screen bg-background pb-8">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-background/95 backdrop-blur-sm border-b border-border/50 px-4 py-4 lg:px-8">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button 
              onClick={() => navigate('/manager')}
              className="p-2 -ml-2 rounded-lg hover:bg-accent transition-colors lg:hidden"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-lg font-semibold text-foreground">Shifts</h1>
              <p className="text-xs text-muted-foreground">{filteredShifts.length} total</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {/* View Mode Toggle */}
            <div className="flex items-center border border-border rounded-lg p-0.5">
              <Button
                variant={viewMode === 'list' ? 'default' : 'ghost'}
                size="icon"
                className="h-8 w-8"
                onClick={() => setViewMode('list')}
              >
                <List className="w-4 h-4" />
              </Button>
              <Button
                variant={viewMode === 'calendar' ? 'default' : 'ghost'}
                size="icon"
                className="h-8 w-8"
                onClick={() => setViewMode('calendar')}
              >
                <LayoutGrid className="w-4 h-4" />
              </Button>
            </div>
            <Button
              variant={filter === 'vacant' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFilter(filter === 'vacant' ? 'all' : 'vacant')}
              className="gap-1.5"
            >
              <Filter className="w-4 h-4" />
              {filter === 'vacant' ? 'Vacant' : 'All'}
            </Button>
          </div>
        </div>
      </header>

      <div className="px-4 py-6 lg:px-8 space-y-6">
        {/* Calendar View */}
        {viewMode === 'calendar' && (
          <WeeklyCalendar 
            shifts={shifts} 
            onShiftClick={handleShiftClick}
          />
        )}

        {/* List View */}
        {viewMode === 'list' && (
          <>
            {Object.entries(shiftsByDate).map(([date, dateShifts]) => (
              <section key={date}>
                <h2 className="text-sm font-medium text-muted-foreground mb-3 flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  {formatDate(date)}
                </h2>
                <div className="space-y-3">
                  {dateShifts.map(shift => {
                    const attendance = attendanceRecords.find(a => a.shiftId === shift.id);
                    return (
                      <div
                        key={shift.id}
                        className={cn(
                          'card-elevated rounded-xl p-4',
                          shift.isVacant && 'border-warning/40 bg-warning-muted/20'
                        )}
                      >
                        <div className="flex items-start justify-between mb-2">
                          <div>
                            <h3 className="font-semibold text-foreground">{shift.position}</h3>
                            <p className="text-sm text-muted-foreground">
                              {shift.startTime} - {shift.endTime} • {shift.location}
                            </p>
                          </div>
                          {shift.isVacant ? (
                            <span className="px-2.5 py-1 text-xs font-medium text-warning bg-warning/10 rounded-full border border-warning/20">
                              Needs Coverage
                            </span>
                          ) : attendance ? (
                            <StatusBadge status={attendance.status} />
                          ) : (
                            <StatusBadge status="not_checked_in" />
                          )}
                        </div>
                        {shift.assignedWorker && (
                          <div className="flex items-center gap-2 mt-3 pt-3 border-t border-border/50">
                            <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center">
                              <User className="w-3.5 h-3.5 text-primary" />
                            </div>
                            <span className="text-sm text-muted-foreground">
                              {shift.assignedWorker.name}
                            </span>
                          </div>
                        )}
                        
                        {/* Action Buttons */}
                        <div className="flex gap-2 mt-3">
                          {shift.isVacant ? (
                            <Button 
                              variant="outline" 
                              size="sm" 
                              className="flex-1 gap-1.5"
                              onClick={() => {
                                setSelectedShift(shift);
                                setShowAssignDialog(true);
                              }}
                            >
                              <Plus className="w-4 h-4" />
                              Assign Worker
                            </Button>
                          ) : (
                            <>
                              <Button 
                                variant="outline" 
                                size="sm" 
                                className="flex-1 gap-1.5"
                                onClick={() => {
                                  setSelectedShift(shift);
                                  setShowOverrideModal(true);
                                }}
                              >
                                <UserCheck className="w-4 h-4" />
                                Attendance
                              </Button>
                              <Button 
                                variant="outline" 
                                size="sm" 
                                className="flex-1 gap-1.5"
                                onClick={() => {
                                  setSelectedShift(shift);
                                  setShowMessaging(true);
                                }}
                              >
                                <MessageCircle className="w-4 h-4" />
                                Message
                              </Button>
                            </>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </section>
            ))}

            {filteredShifts.length === 0 && (
              <div className="text-center py-12">
                <Calendar className="w-12 h-12 mx-auto text-muted-foreground/50 mb-4" />
                <p className="text-muted-foreground">No shifts found</p>
              </div>
            )}
          </>
        )}
      </div>

      {/* Assign Worker Dialog */}
      <Dialog open={showAssignDialog} onOpenChange={(open) => {
        setShowAssignDialog(open);
        if (!open) setSelectedShift(null);
      }}>
        <DialogContent className="sm:max-w-md max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Assign Worker</DialogTitle>
            <DialogDescription>
              {selectedShift && `${selectedShift.position} • ${selectedShift.startTime} - ${selectedShift.endTime}`}
            </DialogDescription>
          </DialogHeader>

          {assignmentDone ? (
            <div className="py-8 text-center">
              <div className="w-16 h-16 mx-auto rounded-full bg-success-muted flex items-center justify-center mb-4">
                <Check className="w-8 h-8 text-success" />
              </div>
              <p className="font-semibold text-foreground">Worker Assigned!</p>
              <p className="text-sm text-muted-foreground mt-1">They've been notified of their shift</p>
            </div>
          ) : (
            <div className="space-y-4 pt-4">
              <div>
                <p className="text-xs font-medium text-muted-foreground mb-2">RECOMMENDED</p>
                <div className="space-y-2">
                  {suggestedWorkers.map(worker => (
                    <WorkerCard
                      key={worker.id}
                      worker={worker}
                      compact
                      onClick={handleAssign}
                    />
                  ))}
                </div>
              </div>

              <div>
                <p className="text-xs font-medium text-muted-foreground mb-2">ALL TEAM</p>
                <div className="space-y-2">
                  {workers.filter(w => !suggestedWorkers.find(s => s.id === w.id)).map(worker => (
                    <WorkerCard
                      key={worker.id}
                      worker={worker}
                      compact
                      onClick={handleAssign}
                    />
                  ))}
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Attendance Override Modal */}
      <AttendanceOverrideModal
        open={showOverrideModal}
        onOpenChange={setShowOverrideModal}
        shift={selectedShift}
        worker={selectedShift?.assignedWorker || null}
        currentStatus={attendanceRecords.find(a => a.shiftId === selectedShift?.id)?.status}
        onOverride={handleAttendanceOverride}
      />

      {/* Shift Messaging */}
      <ShiftMessaging
        open={showMessaging}
        onOpenChange={setShowMessaging}
        shift={selectedShift}
        messages={shiftMessages_filtered}
        currentUserId={currentManager.id}
        currentUserName={currentManager.name}
        onSendMessage={handleSendMessage}
      />
    </div>
  );
};
