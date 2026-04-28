import { useState, useEffect } from 'react';
import { AlertTriangle, Loader2 } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
  AlertDialogAction,
} from '@/components/ui/alert-dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';

export interface ConfirmDestructiveDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  /** When true, shows a reason textarea and requires it for confirmation. */
  requireReason?: boolean;
  reasonLabel?: string;
  reasonPlaceholder?: string;
  reasonOptional?: boolean;
  confirmLabel?: string;
  cancelLabel?: string;
  /** Visual tone of the confirm button */
  tone?: 'destructive' | 'primary';
  /** Returns false if the action failed; reason is passed when collected. */
  onConfirm: (reason: string) => Promise<boolean | void> | boolean | void;
}

/**
 * Reusable confirmation dialog for destructive or sensitive actions.
 * Captures a short reason to prevent accidental taps and gives the user
 * a moment to reconsider.
 */
export const ConfirmDestructiveDialog: React.FC<ConfirmDestructiveDialogProps> = ({
  open,
  onOpenChange,
  title,
  description,
  requireReason = false,
  reasonLabel = 'Reason',
  reasonPlaceholder = 'Add a brief reason…',
  reasonOptional = false,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  tone = 'destructive',
  onConfirm,
}) => {
  const [reason, setReason] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!open) {
      setReason('');
      setBusy(false);
    }
  }, [open]);

  const reasonReady = !requireReason || reasonOptional || reason.trim().length >= 2;

  const handleConfirm = async () => {
    if (!reasonReady || busy) return;
    setBusy(true);
    try {
      const result = await onConfirm(reason.trim());
      if (result !== false) onOpenChange(false);
    } finally {
      setBusy(false);
    }
  };

  return (
    <AlertDialog open={open} onOpenChange={(v) => !busy && onOpenChange(v)}>
      <AlertDialogContent className="rounded-2xl border-border/60">
        <AlertDialogHeader>
          <div className="mx-auto sm:mx-0 w-12 h-12 rounded-2xl bg-destructive/10 text-destructive flex items-center justify-center mb-2 ring-1 ring-destructive/20">
            <AlertTriangle className="w-5 h-5" strokeWidth={1.8} />
          </div>
          <AlertDialogTitle className="font-display tracking-tight">
            {title}
          </AlertDialogTitle>
          <AlertDialogDescription className="leading-relaxed">
            {description}
          </AlertDialogDescription>
        </AlertDialogHeader>

        {requireReason && (
          <div className="space-y-2 mt-1">
            <Label htmlFor="confirm-reason" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              {reasonLabel}{reasonOptional ? ' (optional)' : ''}
            </Label>
            <Textarea
              id="confirm-reason"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder={reasonPlaceholder}
              maxLength={300}
              className="min-h-[80px] rounded-xl resize-none"
              autoFocus
            />
            <p className="text-[11px] text-muted-foreground text-right tabular-nums">
              {reason.length}/300
            </p>
          </div>
        )}

        <AlertDialogFooter className="gap-2 sm:gap-2">
          <AlertDialogCancel disabled={busy} className="rounded-xl">
            {cancelLabel}
          </AlertDialogCancel>
          <AlertDialogAction
            disabled={!reasonReady || busy}
            onClick={(e) => {
              e.preventDefault();
              handleConfirm();
            }}
            className={cn(
              'rounded-xl gap-2',
              tone === 'destructive'
                ? 'bg-destructive text-destructive-foreground hover:bg-destructive/90'
                : 'bg-gradient-primary text-primary-foreground hover:opacity-95',
            )}
          >
            {busy && <Loader2 className="w-4 h-4 animate-spin" />}
            {confirmLabel}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};
