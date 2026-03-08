import { useState } from 'react';
import { useShifts, DatabaseShift } from '@/hooks/useShifts';
import { useShiftRequests } from '@/hooks/useShiftRequests';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { format } from 'date-fns';
import {
  Calendar,
  Clock,
  MapPin,
  Briefcase,
  Check,
  HandHelping,
  Loader2,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatTimeRange } from '@/lib/formatTime';

export const OpenShiftsSection = () => {
  const { profile } = useAuth();
  const { shifts } = useShifts();
  const { requestShift, requests, loading: requestsLoading } = useShiftRequests();
  
  const [selectedShift, setSelectedShift] = useState<DatabaseShift | null>(null);
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  // Filter to only show vacant shifts in the future
  const today = new Date().toISOString().split('T')[0];
  const openShifts = shifts.filter(s => 
    s.is_vacant && 
    s.date >= today &&
    s.status === 'scheduled'
  );

  // Check if user has already requested a shift
  const hasRequested = (shiftId: string) => {
    return requests.some(r => r.shift_id === shiftId && r.worker_id === profile?.id);
  };

  const handleRequestShift = async () => {
    if (!selectedShift) return;
    
    setSubmitting(true);
    const result = await requestShift(selectedShift.id, notes);
    setSubmitting(false);
    
    if (result) {
      setSuccess(true);
      setTimeout(() => {
        setSelectedShift(null);
        setNotes('');
        setSuccess(false);
      }, 1500);
    }
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    if (date.toDateString() === today.toDateString()) return 'Today';
    if (date.toDateString() === tomorrow.toDateString()) return 'Tomorrow';
    return format(date, 'EEE, MMM d');
  };

  if (openShifts.length === 0) {
    return null;
  }

  return (
    <section className="space-y-3">
      <div className="flex items-center gap-2">
        <HandHelping className="w-4 h-4 text-primary" />
        <h2 className="text-sm font-semibold text-foreground">Open Shifts</h2>
        <span className="text-xs text-muted-foreground">
          ({openShifts.length} available)
        </span>
      </div>

      <div className="space-y-3">
        {openShifts.slice(0, 5).map(shift => {
          const requested = hasRequested(shift.id);
          
          return (
            <div
              key={shift.id}
              className={cn(
                'card-elevated rounded-xl p-4 border-l-4',
                requested ? 'border-l-primary/50 opacity-75' : 'border-l-warning'
              )}
            >
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <Briefcase className="w-4 h-4 text-primary" />
                    <h3 className="font-semibold text-foreground">{shift.position}</h3>
                  </div>
                  <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      {formatDate(shift.date)}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {formatTimeRange(shift.start_time, shift.end_time)}
                    </span>
                    <span className="flex items-center gap-1">
                      <MapPin className="w-3 h-3" />
                      {shift.location}
                    </span>
                  </div>
                </div>
                
                {requested ? (
                  <span className="flex items-center gap-1 text-xs font-medium text-primary bg-primary/10 px-2 py-1 rounded-full">
                    <Check className="w-3 h-3" />
                    Requested
                  </span>
                ) : (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setSelectedShift(shift)}
                  >
                    Request
                  </Button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Request Dialog */}
      <Dialog open={!!selectedShift} onOpenChange={() => {
        setSelectedShift(null);
        setNotes('');
      }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Request Shift</DialogTitle>
            <DialogDescription>
              Submit a request to take this shift. Your manager will review it.
            </DialogDescription>
          </DialogHeader>

          {success ? (
            <div className="py-8 text-center">
              <div className="w-16 h-16 mx-auto rounded-full bg-primary/10 flex items-center justify-center mb-4">
                <Check className="w-8 h-8 text-primary" />
              </div>
              <p className="font-semibold text-foreground">Request Submitted!</p>
              <p className="text-sm text-muted-foreground mt-1">
                You'll be notified when your manager responds
              </p>
            </div>
          ) : selectedShift && (
            <div className="space-y-4 pt-4">
              {/* Shift Info */}
              <div className="p-4 rounded-xl bg-accent/50 border border-border/50">
                <p className="font-semibold text-foreground">{selectedShift.position}</p>
                <div className="mt-2 space-y-1 text-sm text-muted-foreground">
                  <p className="flex items-center gap-2">
                    <Calendar className="w-4 h-4" />
                    {formatDate(selectedShift.date)}
                  </p>
                  <p className="flex items-center gap-2">
                    <Clock className="w-4 h-4" />
                    {formatTimeRange(selectedShift.start_time, selectedShift.end_time)}
                  </p>
                  <p className="flex items-center gap-2">
                    <MapPin className="w-4 h-4" />
                    {selectedShift.location}
                  </p>
                </div>
              </div>

              {/* Notes */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">
                  Add a note (optional)
                </label>
                <Textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Let your manager know why you'd like this shift..."
                  rows={3}
                />
              </div>

              <Button 
                className="w-full"
                onClick={handleRequestShift}
                disabled={submitting}
              >
                {submitting ? (
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                ) : (
                  <HandHelping className="w-4 h-4 mr-2" />
                )}
                Submit Request
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </section>
  );
};
