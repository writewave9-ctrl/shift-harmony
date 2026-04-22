import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, LifeBuoy, Crown, MessageCircle, Loader2, Send } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerDescription } from '@/components/ui/drawer';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import { format, formatDistanceToNow } from 'date-fns';
import { useSupportTickets, type SupportTicket, type SupportMessage } from '@/hooks/useSupportTickets';
import { SupportTicketForm } from '@/components/SupportTicketForm';
import { usePlan } from '@/hooks/usePlan';
import { useAuth } from '@/contexts/AuthContext';

export const ManagerSupport = () => {
  const navigate = useNavigate();
  const { plan } = usePlan();
  const { profile } = useAuth();
  const { tickets, loading, fetchMessages, replyToTicket, updateTicketStatus } = useSupportTickets();
  const [selected, setSelected] = useState<SupportTicket | null>(null);
  const [messages, setMessages] = useState<SupportMessage[]>([]);
  const [reply, setReply] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!selected) { setMessages([]); return; }
    fetchMessages(selected.id).then(setMessages);
  }, [selected]);

  const sendReply = async () => {
    if (!selected || !reply.trim()) return;
    setBusy(true);
    const ok = await replyToTicket(selected.id, reply.trim());
    if (ok) {
      setReply('');
      const fresh = await fetchMessages(selected.id);
      setMessages(fresh);
    }
    setBusy(false);
  };

  const isPriority = plan === 'enterprise';

  return (
    <div className="min-h-screen bg-background pb-12">
      <header className="sticky top-0 z-10 bg-background/95 backdrop-blur-xl border-b border-border/40 px-4 py-4 lg:px-8">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate('/manager/settings')} className="p-2 -ml-2 rounded-lg hover:bg-accent">
            <ChevronLeft className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-gradient-accent flex items-center justify-center">
              <LifeBuoy className="w-4 h-4 text-primary" />
            </div>
            <h1 className="text-lg font-semibold tracking-tight">Support</h1>
          </div>
        </div>
      </header>

      <div className="px-4 lg:px-8 py-6 max-w-2xl mx-auto space-y-5">
        <div className={`rounded-2xl border p-4 shadow-elevated ${isPriority ? 'bg-gradient-primary text-primary-foreground border-transparent' : 'bg-gradient-surface border-border/40'}`}>
          <div className="flex items-center gap-2">
            {isPriority && <Crown className="w-4 h-4" />}
            <p className="text-sm font-semibold">
              {isPriority ? 'Priority support active' : 'Standard support'}
            </p>
          </div>
          <p className={`text-xs mt-1 ${isPriority ? 'text-primary-foreground/80' : 'text-muted-foreground'}`}>
            Average response time: {isPriority ? '2 hours' : '24 hours'}.
          </p>
        </div>

        <Card className="rounded-2xl shadow-elevated border-border/50">
          <CardContent className="p-5">
            <h2 className="text-sm font-semibold mb-3">Open a new ticket</h2>
            <SupportTicketForm />
          </CardContent>
        </Card>

        <section className="space-y-2">
          <h2 className="text-sm font-semibold">Your tickets</h2>
          {loading ? (
            <div className="text-center py-8"><Loader2 className="w-5 h-5 animate-spin mx-auto text-muted-foreground" /></div>
          ) : tickets.length === 0 ? (
            <div className="rounded-2xl border border-border/40 bg-muted/30 p-6 text-center">
              <p className="text-sm text-muted-foreground">No tickets yet. Open one above when you need help.</p>
            </div>
          ) : tickets.map(t => (
            <button
              key={t.id}
              onClick={() => setSelected(t)}
              className="w-full text-left rounded-2xl border border-border/50 bg-card shadow-elevated p-4 hover:bg-accent/30 transition-colors"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="text-sm font-semibold truncate">{t.subject}</p>
                  <p className="text-xs text-muted-foreground line-clamp-2 mt-1">{t.body}</p>
                </div>
                <div className="flex flex-col items-end gap-1 shrink-0">
                  <span className={`text-[10px] uppercase tracking-wider font-bold px-2 py-0.5 rounded-full ${
                    t.priority === 'priority' ? 'bg-gradient-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
                  }`}>
                    {t.priority === 'priority' ? 'Priority' : 'Standard'}
                  </span>
                  <span className="text-[10px] text-muted-foreground">{formatDistanceToNow(new Date(t.created_at), { addSuffix: true })}</span>
                </div>
              </div>
              <div className="flex items-center gap-2 mt-2 text-[10px] text-muted-foreground">
                <span className={`px-2 py-0.5 rounded-full border ${
                  t.status === 'resolved' ? 'border-success/30 bg-success-muted text-success' :
                  t.status === 'closed' ? 'border-border bg-muted text-muted-foreground' :
                  'border-warning/30 bg-warning-muted text-warning-foreground'
                }`}>{t.status}</span>
              </div>
            </button>
          ))}
        </section>
      </div>

      <Drawer open={!!selected} onOpenChange={(o) => !o && setSelected(null)}>
        <DrawerContent className="bg-gradient-surface">
          <DrawerHeader>
            <DrawerTitle className="flex items-center gap-2">
              <MessageCircle className="w-4 h-4 text-primary" />
              {selected?.subject}
            </DrawerTitle>
            <DrawerDescription>
              Opened {selected && format(new Date(selected.created_at), 'MMM d, h:mm a')}
            </DrawerDescription>
          </DrawerHeader>
          {selected && (
            <div className="px-4 pb-8 space-y-4 max-h-[70vh] overflow-y-auto">
              <div className="rounded-2xl bg-card border border-border/50 p-3 shadow-elevated">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-1">Original request</p>
                <p className="text-sm whitespace-pre-wrap">{selected.body}</p>
              </div>

              {messages.map(m => (
                <div key={m.id} className={`rounded-2xl p-3 shadow-elevated ${m.sender_id === profile?.id ? 'bg-gradient-accent border border-primary/20 ml-6' : 'bg-card border border-border/50 mr-6'}`}>
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-1">
                    {m.sender?.full_name || 'You'} · {formatDistanceToNow(new Date(m.created_at), { addSuffix: true })}
                  </p>
                  <p className="text-sm whitespace-pre-wrap">{m.body}</p>
                </div>
              ))}

              <div className="space-y-2">
                <Textarea value={reply} onChange={e => setReply(e.target.value)} placeholder="Add a reply…" rows={3} />
                <Button onClick={sendReply} disabled={busy || !reply.trim()} className="w-full rounded-xl bg-gradient-primary shadow-floating">
                  {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Send className="w-4 h-4 mr-2" />Reply</>}
                </Button>
              </div>

              {selected.status !== 'resolved' && (
                <Button variant="outline" className="w-full rounded-xl" onClick={() => updateTicketStatus(selected.id, 'resolved')}>
                  Mark as resolved
                </Button>
              )}
            </div>
          )}
        </DrawerContent>
      </Drawer>
    </div>
  );
};

export default ManagerSupport;
