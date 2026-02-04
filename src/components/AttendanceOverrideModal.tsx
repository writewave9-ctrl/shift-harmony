import { useState } from 'react';
import { cn } from '@/lib/utils';
import { AttendanceStatus, Shift, Worker } from '@/types/align';
import { Check, Clock, User, FileText } from 'lucide-react';
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
  onOverride: (status: AttendanceStatus, notes: string, timestamp: string) => void;
}

const statusOptions: { value: AttendanceStatus; label: string; description: string }[] = [
  { value: 'present', label: 'Present', description: 'Mark as checked in on time' },
  { value: 'late', label: 'Late', description: 'Mark as arrived late' },
  { value: 'manually_approved', label: 'Manually Approved', description: 'Override with manager approval' },
  { value: 'not_checked_in', label: 'Not Checked In', description: 'Reset to pending status' },
];

export const AttendanceOverrideModal: React.FC<AttendanceOverrideModalProps> = ({
  open,
  onOpenChange,
  shift,
  worker,
  currentStatus,
  onOverride,
}) => {
  const [selectedStatus, setSelectedStatus] = useState<AttendanceStatus | ''>('');
  const [notes, setNotes] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = () => {
    if (!selectedStatus) return;
    
    const timestamp = new Date().toISOString();
    onOverride(selectedStatus, notes, timestamp);
    setSubmitted(true);
    
    // Show toast notification
    toast({
      title: 'Attendance Override Applied',
      description: `${worker?.name}'s status updated to ${selectedStatus.replace('_', ' ')}.`,
    });
    
    setTimeout(() => {
      onOpenChange(false);
      setSubmitted(false);
      setSelectedStatus('');
      setNotes('');
    }, 1500);
  };

  const handleClose = (value: boolean) => {
    if (!value) {
      setSelectedStatus('');
      setNotes('');
      setSubmitted(false);
    }
    onOpenChange(value);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Override Attendance</DialogTitle>
          <DialogDescription>
            Manually update attendance status with notes
          </DialogDescription>
        </DialogHeader>

        {submitted ? (
          <div className="py-8 text-center">
            <div className="w-16 h-16 mx-auto rounded-full bg-success-muted flex items-center justify-center mb-4">
              <Check className="w-8 h-8 text-success" />
            </div>
            <p className="font-semibold text-foreground">Attendance Updated!</p>
            <p className="text-sm text-muted-foreground mt-1">
              Override logged at {new Date().toLocaleTimeString()}
            </p>
          </div>
        ) : (
          <div className="space-y-4 pt-4">
            {/* Worker Info */}
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
                    Current status: <span className="font-medium capitalize">{currentStatus.replace('_', ' ')}</span>
                  </p>
                )}
              </div>
            )}

            {/* Status Selection */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">New Status</label>
              <Select value={selectedStatus} onValueChange={(v) => setSelectedStatus(v as AttendanceStatus)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  {statusOptions.map(option => (
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

            {/* Notes */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground flex items-center gap-2">
                <FileText className="w-4 h-4" />
                Override Notes
              </label>
              <Textarea
                placeholder="Add reason for override (required)..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="min-h-[80px]"
              />
            </div>

            {/* Timestamp Preview */}
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Clock className="w-3 h-3" />
              Will be logged at: {new Date().toLocaleString()}
            </div>

            {/* Actions */}
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
                disabled={!selectedStatus || !notes.trim()}
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
