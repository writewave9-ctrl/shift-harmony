import { useState, useRef, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { Shift, ShiftMessage } from '@/types/align';
import { Send, MessageCircle, Clock, Archive, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet';

interface ShiftMessagingProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  shift: Shift | null;
  messages: ShiftMessage[];
  currentUserId: string;
  currentUserName: string;
  onSendMessage: (message: string) => void;
}

export const ShiftMessaging: React.FC<ShiftMessagingProps> = ({
  open,
  onOpenChange,
  shift,
  messages,
  currentUserId,
  currentUserName,
  onSendMessage,
}) => {
  const [newMessage, setNewMessage] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (open) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, open]);

  const handleSend = () => {
    if (!newMessage.trim()) return;
    onSendMessage(newMessage.trim());
    setNewMessage('');
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

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-md flex flex-col">
        <SheetHeader className="pb-4 border-b border-border/50">
          <SheetTitle className="flex items-center gap-2">
            <MessageCircle className="w-5 h-5 text-primary" />
            Shift Chat
          </SheetTitle>
          <SheetDescription>
            {shift && (
              <span className="flex items-center gap-2">
                {shift.position} • {shift.startTime} - {shift.endTime}
                {shiftEnded && (
                  <span className="inline-flex items-center gap-1 text-xs bg-muted px-2 py-0.5 rounded-full">
                    <Archive className="w-3 h-3" />
                    Archived
                  </span>
                )}
              </span>
            )}
          </SheetDescription>
        </SheetHeader>

        {/* Messages Area */}
        <div className="flex-1 overflow-y-auto py-4 space-y-3">
          {shiftEnded && (
            <div className="flex items-center gap-2 p-3 rounded-lg bg-muted/50 text-xs text-muted-foreground mb-4">
              <Archive className="w-4 h-4" />
              <span>This shift has ended. Messages are archived and read-only.</span>
            </div>
          )}

          {messages.length === 0 ? (
            <div className="text-center py-12">
              <MessageCircle className="w-12 h-12 mx-auto text-muted-foreground/30 mb-4" />
              <p className="text-muted-foreground text-sm">No messages yet</p>
              <p className="text-xs text-muted-foreground mt-1">
                Start the conversation about this shift
              </p>
            </div>
          ) : (
            messages.map((msg) => {
              const isOwn = msg.senderId === currentUserId;
              return (
                <div
                  key={msg.id}
                  className={cn(
                    'flex gap-2',
                    isOwn ? 'flex-row-reverse' : 'flex-row'
                  )}
                >
                  <div className={cn(
                    'w-8 h-8 rounded-full flex items-center justify-center shrink-0',
                    isOwn ? 'bg-primary/10' : 'bg-accent'
                  )}>
                    <User className={cn(
                      'w-4 h-4',
                      isOwn ? 'text-primary' : 'text-muted-foreground'
                    )} />
                  </div>
                  <div className={cn(
                    'max-w-[75%] space-y-1',
                    isOwn ? 'items-end' : 'items-start'
                  )}>
                    <div className={cn(
                      'px-3 py-2 rounded-2xl',
                      isOwn
                        ? 'bg-primary text-primary-foreground rounded-tr-sm'
                        : 'bg-muted text-foreground rounded-tl-sm'
                    )}>
                      <p className="text-sm">{msg.message}</p>
                    </div>
                    <p className={cn(
                      'text-[10px] text-muted-foreground px-1',
                      isOwn ? 'text-right' : 'text-left'
                    )}>
                      {!isOwn && <span className="font-medium">{msg.senderName} • </span>}
                      {formatTime(msg.createdAt)}
                    </p>
                  </div>
                </div>
              );
            })
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        {shiftEnded ? (
          <div className="pt-4 border-t border-border/50">
            <p className="text-xs text-muted-foreground text-center">
              Messaging is disabled for completed shifts
            </p>
          </div>
        ) : (
          <div className="pt-4 border-t border-border/50">
            <div className="flex gap-2">
              <Input
                placeholder="Type a message..."
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                onKeyPress={handleKeyPress}
                className="flex-1"
              />
              <Button
                size="icon"
                disabled={!newMessage.trim()}
                onClick={handleSend}
              >
                <Send className="w-4 h-4" />
              </Button>
            </div>
            <p className="text-[10px] text-muted-foreground mt-2 flex items-center gap-1">
              <Clock className="w-3 h-3" />
              Messages auto-archive when shift ends
            </p>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
};
