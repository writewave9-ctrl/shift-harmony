import { useState } from 'react';
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerDescription } from '@/components/ui/drawer';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { Loader2, AlertOctagon } from 'lucide-react';
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

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  shift: { id: string; position: string; date: string; start_time: string; end_time: string } | null;
  onSubmitted?: () => void;
}

export const CallOffRequestModal = ({ open, onOpenChange, shift, onSubmitted }: Props) => {
  const { profile } = useAuth();
  const [reason, setReason] = useState<Reason>('sick');
  const [custom, setCustom] = useState('');
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    if (!shift || !profile?.id) return;
    setBusy(true);
    try {
      const { error } = await supabase.from('call_off_requests').insert({
        shift_id: shift.id,
        worker_id: profile.id,
        reason,
        custom_reason: custom.trim() || null,
      });
      if (error) throw error;
      toast.success('Call-off submitted — your manager has been notified.');
      onSubmitted?.();
      onOpenChange(false);
      setCustom('');
      setReason('sick');
    } catch (err: any) {
      toast.error(err.message || 'Could not submit call-off');
    } finally {
      setBusy(false);
    }
  };

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent className="bg-gradient-surface">
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
            <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Optional note
            </Label>
            <Textarea
              value={custom}
              onChange={(e) => setCustom(e.target.value)}
              placeholder="Any context that will help your manager arrange coverage."
              rows={3}
            />
          </div>

          <div className="flex gap-3 pt-2">
            <Button variant="outline" className="flex-1 h-11 rounded-xl" onClick={() => onOpenChange(false)} disabled={busy}>
              Cancel
            </Button>
            <Button className="flex-1 h-11 rounded-xl bg-gradient-primary shadow-floating" onClick={submit} disabled={busy}>
              {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Submit call-off'}
            </Button>
          </div>
        </div>
      </DrawerContent>
    </Drawer>
  );
};
