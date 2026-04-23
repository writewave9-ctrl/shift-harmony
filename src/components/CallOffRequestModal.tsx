import { useState } from 'react';
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerDescription } from '@/components/ui/drawer';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { Loader2, AlertOctagon, CheckCircle2, MessageSquareHeart } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

type Reason = 'sick' | 'family_emergency' | 'transportation' | 'personal' | 'other';

const REASONS: { value: Reason; label: string }[] = [
  { value: 'sick', label: 'Feeling unwell' },
  { value: 'family_emergency', label: 'Family emergency' },
  { value: 'transportation', label: 'Transportation' },
  { value: 'personal', label: 'Personal' },
  { value: 'other', label: 'Other' },
];

const MAX_DETAILS = 280;

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  shift: { id: string; position: string; date: string; start_time: string; end_time: string } | null;
  onSubmitted?: () => void;
}

export const CallOffRequestModal = ({ open, onOpenChange, shift, onSubmitted }: Props) => {
  const { profile } = useAuth();
  const [reason, setReason] = useState<Reason>('sick');
  const [details, setDetails] = useState('');
  const [busy, setBusy] = useState(false);
  const [confirmed, setConfirmed] = useState(false);

  const remaining = MAX_DETAILS - details.length;
  const overLimit = details.length > MAX_DETAILS;

  const reset = () => {
    setReason('sick');
    setDetails('');
    setConfirmed(false);
  };

  const submit = async () => {
    if (!shift || !profile?.id || overLimit) return;
    setBusy(true);
    try {
      const { error } = await supabase.from('call_off_requests').insert({
        shift_id: shift.id,
        worker_id: profile.id,
        reason,
        custom_reason: details.trim() || null,
      });
      if (error) throw error;
      setConfirmed(true);
      onSubmitted?.();
    } catch (err: any) {
      toast.error(err.message || 'Could not submit call-off');
    } finally {
      setBusy(false);
    }
  };

  const handleClose = (next: boolean) => {
    onOpenChange(next);
    if (!next) setTimeout(reset, 250); // reset after close anim
  };

  return (
    <Drawer open={open} onOpenChange={handleClose}>
      <DrawerContent className="bg-gradient-surface">
        {confirmed ? (
          <>
            <DrawerHeader>
              <DrawerTitle className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-success" />
                You're covered
              </DrawerTitle>
              <DrawerDescription>
                We've let your manager know — no need to follow up.
              </DrawerDescription>
            </DrawerHeader>
            <div className="px-4 pb-8 space-y-4">
              <div className="rounded-2xl border border-success/30 bg-success-muted/40 p-5 shadow-elevated text-center">
                <div className="w-14 h-14 mx-auto rounded-full bg-success/15 flex items-center justify-center mb-3">
                  <MessageSquareHeart className="w-7 h-7 text-success" />
                </div>
                <p className="font-semibold text-foreground">Call-off submitted</p>
                <p className="text-xs text-muted-foreground mt-1 max-w-xs mx-auto">
                  Once your manager approves, your shift will be posted as open coverage.
                  You'll see a status update on your home screen.
                </p>
              </div>

              <div className="rounded-xl bg-muted/40 border border-border/40 p-3 text-xs text-muted-foreground space-y-1">
                <p><span className="font-semibold text-foreground">Reason:</span> {REASONS.find(r => r.value === reason)?.label}</p>
                {details.trim() && (
                  <p className="line-clamp-3"><span className="font-semibold text-foreground">Details:</span> {details.trim()}</p>
                )}
              </div>

              <Button
                className="w-full h-11 rounded-xl bg-gradient-primary shadow-floating"
                onClick={() => handleClose(false)}
              >
                Done
              </Button>
            </div>
          </>
        ) : (
          <>
            <DrawerHeader>
              <DrawerTitle className="flex items-center gap-2">
                <AlertOctagon className="w-4 h-4 text-warning" />
                Call off this shift
              </DrawerTitle>
              <DrawerDescription>
                Let your manager know you can't make it. They'll post it as open coverage.
              </DrawerDescription>
            </DrawerHeader>
            <div className="px-4 pb-8 space-y-4">
              {shift && (
                <div className="p-3 rounded-2xl border border-border/50 bg-card shadow-elevated">
                  <p className="font-semibold text-sm">{shift.position}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {new Date(shift.date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })} ·{' '}
                    {shift.start_time.slice(0, 5)}–{shift.end_time.slice(0, 5)}
                  </p>
                </div>
              )}

              <div className="space-y-2">
                <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Reason</Label>
                <Select value={reason} onValueChange={(v) => setReason(v as Reason)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {REASONS.map(r => <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Other details {reason !== 'other' && <span className="font-normal normal-case tracking-normal text-muted-foreground/70">(optional)</span>}
                  </Label>
                  <span className={`text-[11px] font-medium ${overLimit ? 'text-destructive' : remaining <= 40 ? 'text-warning' : 'text-muted-foreground'}`}>
                    {remaining}
                  </span>
                </div>
                <Textarea
                  value={details}
                  onChange={(e) => setDetails(e.target.value.slice(0, MAX_DETAILS + 50))}
                  placeholder={
                    reason === 'other'
                      ? 'Briefly tell your manager what came up.'
                      : 'Any context that will help your manager arrange coverage.'
                  }
                  rows={3}
                  maxLength={MAX_DETAILS + 50}
                  aria-invalid={overLimit}
                  className={overLimit ? 'border-destructive focus-visible:ring-destructive' : ''}
                />
                {overLimit && (
                  <p className="text-[11px] text-destructive">
                    Please shorten to {MAX_DETAILS} characters or fewer.
                  </p>
                )}
              </div>

              <div className="flex gap-3 pt-2">
                <Button
                  variant="outline"
                  className="flex-1 h-11 rounded-xl"
                  onClick={() => handleClose(false)}
                  disabled={busy}
                >
                  Cancel
                </Button>
                <Button
                  className="flex-1 h-11 rounded-xl bg-gradient-primary shadow-floating"
                  onClick={submit}
                  disabled={busy || overLimit}
                >
                  {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Submit call-off'}
                </Button>
              </div>
            </div>
          </>
        )}
      </DrawerContent>
    </Drawer>
  );
};
