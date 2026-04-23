import { useState } from 'react';
import { AttendanceStatus, Shift, Worker } from '@/types/align';
import { Check, Clock, User, FileText, Tag } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface AttendanceOverrideModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  shift: Shift | null;
  worker: Worker | null;
  currentStatus?: AttendanceStatus;
  /** notes will be `[Reason] notes` so the activity timeline can render it back */
  onOverride: (status: AttendanceStatus, notes: string, timestamp: string) => void;
}

const statusOptions: { value: AttendanceStatus; label: string; description: string }[] = [
  { value: 'present', label: 'Present', description: 'Mark as checked in on time' },
  { value: 'late', label: 'Late', description: 'Mark as arrived late' },
  { value: 'manually_approved', label: 'Manually Approved', description: 'Override with manager approval' },
  { value: 'not_checked_in', label: 'Not Checked In', description: 'Reset to pending status' },
];

const reasonOptions = [
  'Late arrival',
  'Forgot to check in',
  'Device / GPS issue',
  'Approved early leave',
  'Manager exception',
  'Schedule correction',
  'Other',
] as const;

type Reason = typeof reasonOptions[number];

export const AttendanceOverrideModal: React.FC<AttendanceOverrideModalProps> = ({
  open,
  onOpenChange,
  shift,
  worker,
  currentStatus,
  onOverride,
}) => {
  const [selectedStatus, setSelectedStatus] = useState<AttendanceStatus | ''>('');
  const [reason, setReason] = useState<Reason | ''>('');
  const [notes, setNotes] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const reset = () => {
    setSelectedStatus('');
    setReason('');
    setNotes('');
    setSubmitted(false);
  };

  const handleSubmit = () => {
    if (!selectedStatus || !reason) return;

    const timestamp = new Date().toISOString();
    // Encode the reason into the override notes so the activity timeline
    // can surface a structured "reason" alongside the free-text note.
    const composed = notes.trim()
      ? `[${reason}] ${notes.trim()}`
      : `[${reason}]`;
    onOverride(selectedStatus, composed, timestamp);
    setSubmitted(true);

    toast({
      title: 'Attendance Override Applied',
      description: `${worker?.name}'s status updated to ${selectedStatus.replace('_', ' ')} (${reason}).`,
    });

    setTimeout(() => {
      onOpenChange(false);
      reset();
    }, 1500);
  };

  const handleClose = (value: boolean) => {
    if (!value) reset();
    onOpenChange(value);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Override Attendance</DialogTitle>
          <DialogDescription>
            Manually update attendance status — the change will be saved to the shift's activity timeline.
          </DialogDescription>
        </DialogHeader>

        {submitted ? (
          <div className="py-8 text-center">
            <div className="w-16 h-16 mx-auto rounded-full bg-success-muted flex items-center justify-center mb-4">
              <Check className="w-8 h-8 text-success" />
            </div>
            <p className="font-semibold text-foreground">Attendance Updated</p>
            <p className="text-sm text-muted-foreground mt-1">
              Logged at {new Date().toLocaleTimeString()}
            </p>
          </div>
        ) : (
          <div className="space-y-4 pt-4">
            {worker && shift && (
              <div className="p-4 rounded-xl bg-accent/50 border border-border/50">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                    <User className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <p className="font-medium">{worker.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {shift.position} • {shift.startTime} - {shift.endTime}
                    </p>
                  </div>
                </div>
                {currentStatus && (
                  <p className="text-xs text-muted-foreground mt-2">
                    Current status:{' '}
                    <span className="font-medium capitalize">
                      {currentStatus.replace('_', ' ')}
                    </span>
                  </p>
                )}
              </div>
            )}

            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">New Status</label>
              <Select value={selectedStatus} onValueChange={(v) => setSelectedStatus(v as AttendanceStatus)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  {statusOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      <div>
                        <p className="font-medium">{option.label}</p>
                        <p className="text-xs text-muted-foreground">{option.description}</p>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground flex items-center gap-2">
                <Tag className="w-4 h-4" />
                Reason
              </label>
              <Select value={reason} onValueChange={(v) => setReason(v as Reason)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a reason" />
                </SelectTrigger>
                <SelectContent>
                  {reasonOptions.map((r) => (
                    <SelectItem key={r} value={r}>{r}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-[11px] text-muted-foreground">
                The reason is recorded in the shift's activity timeline.
              </p>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground flex items-center gap-2">
                <FileText className="w-4 h-4" />
                Optional notes
              </label>
              <Textarea
                placeholder="Add any extra context (optional)…"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="min-h-[80px]"
                maxLength={300}
              />
              <p className="text-[11px] text-muted-foreground text-right">
                {notes.length}/300
              </p>
            </div>

            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Clock className="w-3 h-3" />
              Will be logged at: {new Date().toLocaleString()}
            </div>

            <div className="flex gap-3">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => handleClose(false)}
              >
                Cancel
              </Button>
              <Button
                className="flex-1"
                disabled={!selectedStatus || !reason}
                onClick={handleSubmit}
              >
                Confirm Override
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};
