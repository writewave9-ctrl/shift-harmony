import { useState, useRef, useEffect, useMemo } from 'react';
import { cn } from '@/lib/utils';
import { Shift, ShiftMessage } from '@/types/align';
import {
  Send, MessageCircle, Clock, Archive, User, Reply, Info, ChevronRight, Lock,
  Check, CheckCheck, X,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet';
import { formatTimeRange } from '@/lib/formatTime';

interface ShiftMessagingProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  shift: Shift | null;
  messages: ShiftMessage[];
  currentUserId: string;
  currentUserName: string;
  onSendMessage: (message: string, replyTo?: ShiftMessage | null) => void;
  /** Optional: when defined, surfaces a "View request context" affordance in the header. */
  onViewRequestContext?: () => void;
  /** Optional label for the request context affordance, e.g. "View swap request". */
  requestContextLabel?: string;
}

// Parse legacy reply prefix "↳ @Name: ..." for backward compatibility.
const REPLY_PREFIX = /^↳\s+@([^:]+):\s+([\s\S]+)$/;

function extractReply(msg: ShiftMessage): { reply: { sender: string; excerpt: string } | null; body: string } {
  if (msg.replyToSender && msg.replyToExcerpt) {
    return { reply: { sender: msg.replyToSender, excerpt: msg.replyToExcerpt }, body: msg.message };
  }
  const m = msg.message.match(REPLY_PREFIX);
  if (m) return { reply: { sender: m[1].trim(), excerpt: '' }, body: m[2] };
  return { reply: null, body: msg.message };
}

export const ShiftMessaging: React.FC<ShiftMessagingProps> = ({
  open,
  onOpenChange,
  shift,
  messages,
  currentUserId,
  currentUserName,
  onSendMessage,
  onViewRequestContext,
  requestContextLabel = 'View request context',
}) => {
  const [newMessage, setNewMessage] = useState('');
  const [replyingTo, setReplyingTo] = useState<ShiftMessage | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  // Track which message ids the current user has seen this session.
  // Used to render a "New" divider above messages received since open.
  const lastSeenRef = useRef<string | null>(null);

  // When the sheet first opens, capture the last message id as "already seen"
  useEffect(() => {
    if (open) {
      lastSeenRef.current = messages.length > 0 ? messages[messages.length - 1].id : null;
      messagesEndRef.current?.scrollIntoView({ behavior: 'auto' });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  useEffect(() => {
    if (open) messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, open]);

  const handleSend = () => {
    const trimmed = newMessage.trim();
    if (!trimmed) return;
    onSendMessage(trimmed, replyingTo);
    setNewMessage('');
    setReplyingTo(null);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
  };

  const isShiftEnded = () => {
    if (!shift) return false;
    const now = new Date();
    const shiftDate = new Date(shift.date);
    const [endHour, endMinute] = shift.endTime.split(':').map(Number);
    shiftDate.setHours(endHour, endMinute, 0, 0);
    return now > shiftDate;
  };

  const shiftEnded = isShiftEnded();

  const handleReply = (msg: ShiftMessage) => {
    setReplyingTo(msg);
    requestAnimationFrame(() => inputRef.current?.focus());
  };

  // Find the index where the "New" divider should appear
  const newDividerIndex = useMemo(() => {
    if (!open || !lastSeenRef.current) return -1;
    const idx = messages.findIndex((m) => m.id === lastSeenRef.current);
    if (idx < 0 || idx === messages.length - 1) return -1;
    // First new message is at idx + 1, but only show divider if it's from someone else
    const firstNew = messages[idx + 1];
    if (!firstNew || firstNew.senderId === currentUserId) return -1;
    return idx + 1;
  }, [messages, open, currentUserId]);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-md flex flex-col p-0 bg-gradient-surface">
        {/* Conversation header — premium, hairline-divided */}
        <SheetHeader className="px-5 pt-5 pb-4 border-b border-border/60 bg-card/40 backdrop-blur-sm">
          <div className="flex items-start gap-3">
            <div
              className={cn(
                'w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 shadow-inset-hairline',
                shiftEnded
                  ? 'bg-muted text-muted-foreground'
                  : 'bg-gradient-primary text-primary-foreground shadow-glow',
              )}
              aria-hidden
            >
              {shiftEnded ? <Archive className="w-4 h-4" /> : <MessageCircle className="w-4 h-4" />}
            </div>
            <div className="min-w-0 flex-1 text-left">
              <SheetTitle className="font-display text-[17px] tracking-tight text-foreground leading-tight">
                {shift?.position || 'Shift conversation'}
              </SheetTitle>
              <SheetDescription className="text-[12px] text-muted-foreground mt-0.5 flex items-center gap-1.5">
                {shift && (
                  <>
                    <Clock className="w-3 h-3" />
                    {formatTimeRange(shift.startTime, shift.endTime)}
                  </>
                )}
              </SheetDescription>
            </div>
          </div>

          {/* Archived indicator — subtle, never alarming */}
          {shiftEnded && (
            <div className="mt-3 inline-flex items-center gap-1.5 self-start text-[11px] font-semibold uppercase tracking-wider text-muted-foreground bg-muted/70 px-2.5 py-1 rounded-full ring-1 ring-border">
              <Archive className="w-3 h-3" />
              Archived after shift
            </div>
          )}

          {/* Request context affordance — safe, prominent tap target with focus ring */}
          {onViewRequestContext && (
            <button
              type="button"
              onClick={onViewRequestContext}
              className="mt-3 w-full flex items-center justify-between gap-2 px-3 py-2.5 rounded-xl bg-accent/60 hover:bg-accent transition-colors text-left ring-1 ring-border/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
            >
              <span className="flex items-center gap-2 min-w-0">
                <Info className="w-3.5 h-3.5 text-primary shrink-0" />
                <span className="text-xs font-medium text-foreground truncate">
                  {requestContextLabel}
                </span>
              </span>
              <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0" />
            </button>
          )}
        </SheetHeader>

        {/* Messages Area */}
        <div className="flex-1 overflow-y-auto px-5 py-5 space-y-4">
          {messages.length === 0 ? (
            <div className="empty-state mx-auto max-w-sm bg-transparent border-0 shadow-none">
              <div className="empty-state-icon">
                <MessageCircle className="w-5 h-5" />
              </div>
              <p className="empty-state-title">No messages yet</p>
              <p className="empty-state-body">
                {shiftEnded
                  ? 'This shift ended before any messages were exchanged.'
                  : 'Start the conversation about this shift — coordination, hand-offs, or quick questions.'}
              </p>
            </div>
          ) : (
            messages.map((msg, idx) => {
              const isOwn = msg.senderId === currentUserId;
              const { reply, body } = extractReply(msg);
              const showNewDivider = idx === newDividerIndex;
              const isLastOwn = isOwn && idx === messages.length - 1;
              return (
                <div key={msg.id}>
                  {showNewDivider && (
                    <div className="flex items-center gap-2 my-3" aria-label="New messages">
                      <div className="flex-1 h-px bg-primary/30" />
                      <span className="text-[10px] font-semibold uppercase tracking-wider text-primary px-2 py-0.5 rounded-full bg-primary/10 ring-1 ring-primary/20">
                        New
                      </span>
                      <div className="flex-1 h-px bg-primary/30" />
                    </div>
                  )}
                  <div
                    className={cn(
                      'group flex gap-2',
                      isOwn ? 'flex-row-reverse' : 'flex-row',
                    )}
                  >
                    <div
                      className={cn(
                        'w-8 h-8 rounded-full flex items-center justify-center shrink-0 shadow-inset-hairline',
                        isOwn ? 'bg-primary/15' : 'bg-accent',
                      )}
                      aria-hidden
                    >
                      <User
                        className={cn(
                          'w-4 h-4',
                          isOwn ? 'text-primary' : 'text-accent-foreground',
                        )}
                      />
                    </div>
                    <div
                      className={cn(
                        'max-w-[78%] flex flex-col gap-1',
                        isOwn ? 'items-end' : 'items-start',
                      )}
                    >
                      {/* Reply context strip */}
                      {reply && (
                        <div
                          className={cn(
                            'flex items-center gap-1.5 text-[11px] px-2.5 py-1 rounded-lg max-w-full',
                            'bg-muted/60 ring-1 ring-border/50 text-muted-foreground',
                          )}
                        >
                          <Reply className="w-3 h-3 shrink-0 text-primary/70" aria-hidden />
                          <span className="font-medium text-foreground/80 truncate">
                            {reply.sender}
                          </span>
                          {reply.excerpt && (
                            <span className="truncate italic">"{reply.excerpt}"</span>
                          )}
                        </div>
                      )}
                      <div
                        className={cn(
                          'px-3.5 py-2.5 rounded-2xl shadow-soft text-[14px] leading-snug',
                          isOwn
                            ? 'bg-gradient-primary text-primary-foreground rounded-tr-md'
                            : 'bg-card text-foreground rounded-tl-md ring-1 ring-border/50',
                        )}
                      >
                        <p className="whitespace-pre-wrap break-words">{body}</p>
                      </div>
                      <div
                        className={cn(
                          'flex items-center gap-2 px-1 text-[10px] text-muted-foreground',
                          isOwn ? 'flex-row-reverse' : 'flex-row',
                        )}
                      >
                        {!isOwn && (
                          <span className="font-medium text-foreground/80">
                            {msg.senderName}
                          </span>
                        )}
                        <span aria-hidden>•</span>
                        <span>{formatTime(msg.createdAt)}</span>

                        {/* Read indicator on own messages: 'Sent' then 'Seen' once a teammate replies after */}
                        {isOwn && (
                          <span
                            className="inline-flex items-center gap-0.5"
                            aria-label={isLastOwn ? 'Sent' : 'Seen by team'}
                            title={isLastOwn ? 'Sent' : 'Seen by team'}
                          >
                            {isLastOwn ? (
                              <Check className="w-3 h-3" />
                            ) : (
                              <CheckCheck className="w-3 h-3 text-primary" />
                            )}
                          </span>
                        )}

                        {!shiftEnded && !isOwn && (
                          <button
                            type="button"
                            onClick={() => handleReply(msg)}
                            className="inline-flex items-center gap-0.5 ml-1 px-1.5 py-0.5 rounded-md text-muted-foreground hover:text-primary hover:bg-primary/5 opacity-0 group-hover:opacity-100 focus-visible:opacity-100 transition-opacity focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1 focus-visible:ring-offset-background"
                            aria-label={`Reply to ${msg.senderName}`}
                          >
                            <Reply className="w-3 h-3" />
                            <span className="text-[10px] font-medium">Reply</span>
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        {shiftEnded ? (
          <div className="px-5 py-4 border-t border-border/60 bg-muted/30">
            <p className="text-xs text-muted-foreground text-center flex items-center justify-center gap-1.5">
              <Lock className="w-3 h-3" />
              Read-only — this conversation is archived
            </p>
          </div>
        ) : (
          <div className="px-5 pt-3 pb-4 border-t border-border/60 bg-card/40">
            {replyingTo && (
              <div className="mb-2 flex items-start gap-2 text-xs px-2.5 py-2 rounded-xl bg-primary/5 ring-1 ring-primary/20">
                <Reply className="w-3.5 h-3.5 text-primary shrink-0 mt-0.5" aria-hidden />
                <div className="min-w-0 flex-1">
                  <div className="text-[10px] font-semibold uppercase tracking-wider text-primary">
                    Replying to {replyingTo.senderName}
                  </div>
                  <div className="text-foreground/80 truncate mt-0.5">
                    "{extractReply(replyingTo).body}"
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setReplyingTo(null)}
                  className="text-muted-foreground hover:text-foreground p-1 rounded-md hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  aria-label="Cancel reply"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            )}
            <div className="flex gap-2">
              <Input
                ref={inputRef}
                placeholder={replyingTo ? `Reply to ${replyingTo.senderName}…` : 'Type a message…'}
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                onKeyPress={handleKeyPress}
                className="flex-1 h-11 rounded-xl bg-background"
                aria-label="Message text"
                maxLength={1000}
              />
              <Button
                size="icon"
                disabled={!newMessage.trim()}
                onClick={handleSend}
                className="h-11 w-11 rounded-xl bg-gradient-primary shadow-floating disabled:shadow-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
                aria-label="Send message"
              >
                <Send className="w-4 h-4" />
              </Button>
            </div>
            <p className="text-[10px] text-muted-foreground mt-2 flex items-center gap-1">
              <Clock className="w-3 h-3" />
              Messages auto-archive when this shift ends
            </p>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
};
