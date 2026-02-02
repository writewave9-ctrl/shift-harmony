import { useState } from 'react';
import { cn } from '@/lib/utils';
import { ShiftCard } from '@/components/ShiftCard';
import { 
  currentWorker, 
  getUpcomingWorkerShifts, 
  getSuggestedReplacements 
} from '@/data/mockData';
import { 
  Calendar, 
  ChevronLeft, 
  ArrowRightLeft, 
  XCircle,
  ChevronRight,
  User,
  Users,
  Check
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { WorkerCard } from '@/components/WorkerCard';
import { Shift, CallOffReason } from '@/types/align';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';

const callOffReasons: { value: CallOffReason; label: string }[] = [
  { value: 'sick', label: 'Feeling unwell' },
  { value: 'family_emergency', label: 'Family emergency' },
  { value: 'transportation', label: 'Transportation issue' },
  { value: 'personal', label: 'Personal matter' },
  { value: 'other', label: 'Other reason' },
];

export const WorkerShifts = () => {
  const navigate = useNavigate();
  const [selectedShift, setSelectedShift] = useState<Shift | null>(null);
  const [showSwapDialog, setShowSwapDialog] = useState(false);
  const [showCallOffDialog, setShowCallOffDialog] = useState(false);
  const [swapType, setSwapType] = useState<'specific' | 'open' | null>(null);
  const [selectedReason, setSelectedReason] = useState<CallOffReason | null>(null);
  const [requestSent, setRequestSent] = useState(false);

  const upcomingShifts = getUpcomingWorkerShifts(currentWorker.id);
  const suggestedWorkers = getSuggestedReplacements(currentWorker.id);

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    if (date.toDateString() === today.toDateString()) return 'Today';
    if (date.toDateString() === tomorrow.toDateString()) return 'Tomorrow';
    return date.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' });
  };

  const handleSwapRequest = () => {
    setRequestSent(true);
    setTimeout(() => {
      setShowSwapDialog(false);
      setSwapType(null);
      setRequestSent(false);
      setSelectedShift(null);
    }, 1500);
  };

  const handleCallOff = () => {
    setRequestSent(true);
    setTimeout(() => {
      setShowCallOffDialog(false);
      setSelectedReason(null);
      setRequestSent(false);
      setSelectedShift(null);
    }, 1500);
  };

  // Group shifts by date
  const shiftsByDate = upcomingShifts.reduce((acc, shift) => {
    const date = shift.date;
    if (!acc[date]) acc[date] = [];
    acc[date].push(shift);
    return acc;
  }, {} as Record<string, Shift[]>);

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-background/95 backdrop-blur-sm border-b border-border/50 px-4 py-4">
        <div className="flex items-center gap-3">
          <button 
            onClick={() => navigate('/worker')}
            className="p-2 -ml-2 rounded-lg hover:bg-accent transition-colors"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-lg font-semibold text-foreground">My Shifts</h1>
            <p className="text-xs text-muted-foreground">{upcomingShifts.length} upcoming</p>
          </div>
        </div>
      </header>

      <div className="px-4 py-6 space-y-6">
        {Object.entries(shiftsByDate).map(([date, shifts]) => (
          <section key={date}>
            <h2 className="text-sm font-medium text-muted-foreground mb-3 flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              {formatDate(date)}
            </h2>
            <div className="space-y-3">
              {shifts.map(shift => (
                <ShiftCard
                  key={shift.id}
                  shift={shift}
                  onClick={() => setSelectedShift(shift)}
                />
              ))}
            </div>
          </section>
        ))}

        {upcomingShifts.length === 0 && (
          <div className="text-center py-12">
            <Calendar className="w-12 h-12 mx-auto text-muted-foreground/50 mb-4" />
            <p className="text-muted-foreground">No upcoming shifts</p>
          </div>
        )}
      </div>

      {/* Shift Actions Sheet */}
      <Dialog open={!!selectedShift && !showSwapDialog && !showCallOffDialog} onOpenChange={() => setSelectedShift(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Shift Options</DialogTitle>
            <DialogDescription>
              {selectedShift && `${formatDate(selectedShift.date)} • ${selectedShift.startTime} - ${selectedShift.endTime}`}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 pt-4">
            <Button
              variant="outline"
              className="w-full justify-start gap-3 h-14"
              onClick={() => {
                setShowSwapDialog(true);
              }}
            >
              <ArrowRightLeft className="w-5 h-5 text-primary" />
              <div className="text-left">
                <p className="font-medium">Request Swap</p>
                <p className="text-xs text-muted-foreground">Find someone to cover</p>
              </div>
            </Button>
            <Button
              variant="outline"
              className="w-full justify-start gap-3 h-14 border-destructive/30 hover:bg-destructive/5"
              onClick={() => {
                setShowCallOffDialog(true);
              }}
            >
              <XCircle className="w-5 h-5 text-destructive" />
              <div className="text-left">
                <p className="font-medium text-destructive">Call Off</p>
                <p className="text-xs text-muted-foreground">I can't make this shift</p>
              </div>
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Swap Dialog */}
      <Dialog open={showSwapDialog} onOpenChange={(open) => {
        setShowSwapDialog(open);
        if (!open) setSwapType(null);
      }}>
        <DialogContent className="sm:max-w-md max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {swapType === null ? 'Request Swap' : swapType === 'specific' ? 'Choose Coworker' : 'Open Request'}
            </DialogTitle>
            <DialogDescription>
              {swapType === null && 'How would you like to find coverage?'}
              {swapType === 'specific' && 'Select who you\'d like to swap with'}
              {swapType === 'open' && 'Your shift will be offered to all eligible workers'}
            </DialogDescription>
          </DialogHeader>

          {requestSent ? (
            <div className="py-8 text-center">
              <div className="w-16 h-16 mx-auto rounded-full bg-success-muted flex items-center justify-center mb-4">
                <Check className="w-8 h-8 text-success" />
              </div>
              <p className="font-semibold text-foreground">Request Sent!</p>
              <p className="text-sm text-muted-foreground mt-1">You'll be notified when there's a response</p>
            </div>
          ) : swapType === null ? (
            <div className="space-y-3 pt-4">
              <Button
                variant="outline"
                className="w-full justify-start gap-3 h-14"
                onClick={() => setSwapType('specific')}
              >
                <User className="w-5 h-5 text-primary" />
                <div className="text-left">
                  <p className="font-medium">Ask Specific Person</p>
                  <p className="text-xs text-muted-foreground">Choose a coworker to swap with</p>
                </div>
                <ChevronRight className="w-4 h-4 ml-auto text-muted-foreground" />
              </Button>
              <Button
                variant="outline"
                className="w-full justify-start gap-3 h-14"
                onClick={() => setSwapType('open')}
              >
                <Users className="w-5 h-5 text-primary" />
                <div className="text-left">
                  <p className="font-medium">Open to All</p>
                  <p className="text-xs text-muted-foreground">Let anyone eligible take it</p>
                </div>
                <ChevronRight className="w-4 h-4 ml-auto text-muted-foreground" />
              </Button>
            </div>
          ) : swapType === 'specific' ? (
            <div className="space-y-4 pt-4">
              <div>
                <p className="text-xs font-medium text-muted-foreground mb-2">SUGGESTED BASED ON AVAILABILITY</p>
                <div className="space-y-2">
                  {suggestedWorkers.map(worker => (
                    <WorkerCard
                      key={worker.id}
                      worker={worker}
                      compact
                      onClick={handleSwapRequest}
                    />
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-4 pt-4">
              <div className="p-4 rounded-xl bg-accent/50 border border-border/50">
                <p className="text-sm text-foreground">
                  This shift will be offered to {suggestedWorkers.length} eligible workers based on:
                </p>
                <ul className="mt-2 space-y-1 text-xs text-muted-foreground">
                  <li>• Available hours remaining this week</li>
                  <li>• Willingness for extra shifts</li>
                  <li>• Position compatibility</li>
                </ul>
              </div>
              <Button className="w-full" onClick={handleSwapRequest}>
                Post Open Request
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Call Off Dialog */}
      <Dialog open={showCallOffDialog} onOpenChange={(open) => {
        setShowCallOffDialog(open);
        if (!open) setSelectedReason(null);
      }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Call Off Shift</DialogTitle>
            <DialogDescription>
              Please select a reason. Your manager will be notified.
            </DialogDescription>
          </DialogHeader>

          {requestSent ? (
            <div className="py-8 text-center">
              <div className="w-16 h-16 mx-auto rounded-full bg-success-muted flex items-center justify-center mb-4">
                <Check className="w-8 h-8 text-success" />
              </div>
              <p className="font-semibold text-foreground">Call-Off Submitted</p>
              <p className="text-sm text-muted-foreground mt-1">Your manager has been notified</p>
            </div>
          ) : (
            <div className="space-y-4 pt-4">
              <div className="space-y-2">
                {callOffReasons.map(reason => (
                  <button
                    key={reason.value}
                    onClick={() => setSelectedReason(reason.value)}
                    className={cn(
                      'w-full p-3 rounded-lg border text-left transition-colors',
                      selectedReason === reason.value
                        ? 'border-primary bg-accent'
                        : 'border-border/50 hover:bg-accent/50'
                    )}
                  >
                    <p className="font-medium text-sm">{reason.label}</p>
                  </button>
                ))}
              </div>
              <Button 
                className="w-full" 
                variant="destructive"
                disabled={!selectedReason}
                onClick={handleCallOff}
              >
                Submit Call-Off
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};
