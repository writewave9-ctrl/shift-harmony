 import { useState } from 'react';
 import { Button } from '@/components/ui/button';
 import { Input } from '@/components/ui/input';
 import { Label } from '@/components/ui/label';
 import {
   Dialog,
   DialogContent,
   DialogDescription,
   DialogFooter,
   DialogHeader,
   DialogTitle,
 } from '@/components/ui/dialog';
 import { Mail, Loader2, UserPlus, X, Clock, RefreshCw } from 'lucide-react';
 import { useTeamInvitations, TeamInvitation } from '@/hooks/useTeamInvitations';
 import { cn } from '@/lib/utils';
 
 interface InviteWorkerModalProps {
   open: boolean;
   onOpenChange: (open: boolean) => void;
 }
 
 export const InviteWorkerModal = ({ open, onOpenChange }: InviteWorkerModalProps) => {
   const [email, setEmail] = useState('');
   const [sending, setSending] = useState(false);
   const { pendingInvitations, sendInvitation, cancelInvitation, resendInvitation, loading } = useTeamInvitations();
 
   const handleSubmit = async (e: React.FormEvent) => {
     e.preventDefault();
     if (!email.trim()) return;
 
     setSending(true);
     const success = await sendInvitation(email.trim());
     setSending(false);
 
     if (success) {
       setEmail('');
     }
   };
 
   const formatDate = (dateStr: string) => {
     return new Date(dateStr).toLocaleDateString('en-US', {
       month: 'short',
       day: 'numeric',
     });
   };
 
   const isExpired = (expiresAt: string) => {
     return new Date(expiresAt) < new Date();
   };
 
   return (
     <Dialog open={open} onOpenChange={onOpenChange}>
       <DialogContent className="sm:max-w-md">
         <DialogHeader>
           <DialogTitle className="flex items-center gap-2">
             <UserPlus className="w-5 h-5 text-primary" />
             Invite Team Members
           </DialogTitle>
           <DialogDescription>
             Send an email invitation to add workers to your team.
           </DialogDescription>
         </DialogHeader>
 
         <form onSubmit={handleSubmit} className="space-y-4">
           <div className="space-y-2">
             <Label htmlFor="email">Email Address</Label>
             <div className="flex gap-2">
               <div className="relative flex-1">
                 <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                 <Input
                   id="email"
                   type="email"
                   placeholder="worker@example.com"
                   value={email}
                   onChange={(e) => setEmail(e.target.value)}
                   className="pl-10"
                   required
                 />
               </div>
               <Button type="submit" disabled={sending || !email.trim()}>
                 {sending ? (
                   <Loader2 className="w-4 h-4 animate-spin" />
                 ) : (
                   'Send'
                 )}
               </Button>
             </div>
           </div>
         </form>
 
         {/* Pending Invitations */}
         {pendingInvitations.length > 0 && (
           <div className="mt-6">
             <p className="text-xs font-medium text-muted-foreground mb-3">PENDING INVITATIONS</p>
             <div className="space-y-2 max-h-48 overflow-y-auto">
               {pendingInvitations.map((invitation) => (
                 <InvitationItem
                   key={invitation.id}
                   invitation={invitation}
                   isExpired={isExpired(invitation.expires_at)}
                   formatDate={formatDate}
                   onCancel={() => cancelInvitation(invitation.id)}
                   onResend={() => resendInvitation(invitation.id)}
                 />
               ))}
             </div>
           </div>
         )}
 
         <DialogFooter>
           <Button variant="outline" onClick={() => onOpenChange(false)}>
             Done
           </Button>
         </DialogFooter>
       </DialogContent>
     </Dialog>
   );
 };
 
 interface InvitationItemProps {
   invitation: TeamInvitation;
   isExpired: boolean;
   formatDate: (date: string) => string;
   onCancel: () => void;
   onResend: () => void;
 }
 
 const InvitationItem = ({ invitation, isExpired, formatDate, onCancel, onResend }: InvitationItemProps) => {
   const [loading, setLoading] = useState(false);
 
   const handleCancel = async () => {
     setLoading(true);
     await onCancel();
     setLoading(false);
   };
 
   const handleResend = async () => {
     setLoading(true);
     await onResend();
     setLoading(false);
   };
 
   return (
     <div className={cn(
       'flex items-center justify-between p-3 rounded-lg border',
       isExpired ? 'bg-destructive/5 border-destructive/20' : 'bg-accent/50 border-border'
     )}>
       <div className="flex-1 min-w-0">
         <p className="text-sm font-medium truncate">{invitation.email}</p>
         <p className={cn(
           'text-xs flex items-center gap-1',
           isExpired ? 'text-destructive' : 'text-muted-foreground'
         )}>
           <Clock className="w-3 h-3" />
           {isExpired ? 'Expired' : `Expires ${formatDate(invitation.expires_at)}`}
         </p>
       </div>
       <div className="flex items-center gap-1">
         {isExpired && (
           <Button
             variant="ghost"
             size="icon"
             className="h-8 w-8"
             onClick={handleResend}
             disabled={loading}
           >
             <RefreshCw className={cn('w-4 h-4', loading && 'animate-spin')} />
           </Button>
         )}
         <Button
           variant="ghost"
           size="icon"
           className="h-8 w-8 text-muted-foreground hover:text-destructive"
           onClick={handleCancel}
           disabled={loading}
         >
           <X className="w-4 h-4" />
         </Button>
       </div>
     </div>
   );
 };