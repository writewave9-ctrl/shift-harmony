import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Loader2, Send } from 'lucide-react';
import { useSupportTickets } from '@/hooks/useSupportTickets';

interface Props {
  onSent?: () => void;
}

export const SupportTicketForm = ({ onSent }: Props) => {
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [busy, setBusy] = useState(false);
  const { openTicket } = useSupportTickets();

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!subject.trim() || !body.trim()) return;
    setBusy(true);
    const ok = await openTicket(subject.trim(), body.trim());
    setBusy(false);
    if (ok) {
      setSubject(''); setBody('');
      onSent?.();
    }
  };

  return (
    <form onSubmit={submit} className="space-y-3">
      <div className="space-y-1.5">
        <Label htmlFor="subject" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Subject</Label>
        <Input id="subject" value={subject} onChange={e => setSubject(e.target.value)} placeholder="Brief description" required />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="body" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">How can we help?</Label>
        <Textarea
          id="body" value={body} onChange={e => setBody(e.target.value)}
          placeholder="Tell us what's happening, what you've tried, and what you expected."
          rows={5} required
        />
      </div>
      <Button type="submit" disabled={busy || !subject.trim() || !body.trim()} className="w-full rounded-xl bg-gradient-primary shadow-floating">
        {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Send className="w-4 h-4 mr-2" />Send request</>}
      </Button>
    </form>
  );
};
