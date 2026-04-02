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
import { Mail, Loader2, UserPlus, User, Briefcase, Copy, Check } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface InviteWorkerModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onWorkerCreated?: () => void;
}

interface CreatedWorker {
  email: string;
  full_name: string;
  temp_password: string;
}

export const InviteWorkerModal = ({ open, onOpenChange, onWorkerCreated }: InviteWorkerModalProps) => {
  const [email, setEmail] = useState('');
  const [fullName, setFullName] = useState('');
  const [position, setPosition] = useState('');
  const [sending, setSending] = useState(false);
  const [createdWorker, setCreatedWorker] = useState<CreatedWorker | null>(null);
  const [copied, setCopied] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !fullName.trim()) return;

    setSending(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast.error('You must be logged in');
        return;
      }

      const { data, error } = await supabase.functions.invoke('create-worker', {
        body: {
          email: email.trim(),
          full_name: fullName.trim(),
          position: position.trim() || undefined,
        },
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      setCreatedWorker({
        email: data.worker.email,
        full_name: data.worker.full_name,
        temp_password: data.worker.temp_password,
      });

      toast.success(`Worker account created for ${fullName}`);
      onWorkerCreated?.();
    } catch (err: any) {
      console.error('Error creating worker:', err);
      toast.error(err.message || 'Failed to create worker account');
    } finally {
      setSending(false);
    }
  };

  const handleCopyCredentials = async () => {
    if (!createdWorker) return;
    const text = `Align Login Credentials\nEmail: ${createdWorker.email}\nTemporary Password: ${createdWorker.temp_password}\n\nPlease sign in and change your password.`;
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast.success('Credentials copied to clipboard');
  };

  const handleClose = (isOpen: boolean) => {
    if (!isOpen) {
      setEmail('');
      setFullName('');
      setPosition('');
      setCreatedWorker(null);
      setCopied(false);
    }
    onOpenChange(isOpen);
  };

  const handleAddAnother = () => {
    setEmail('');
    setFullName('');
    setPosition('');
    setCreatedWorker(null);
    setCopied(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserPlus className="w-5 h-5 text-primary" />
            Add Worker
          </DialogTitle>
          <DialogDescription>
            Create a worker account. They'll receive login credentials to access their shifts.
          </DialogDescription>
        </DialogHeader>

        {!createdWorker ? (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="workerName">Full Name</Label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  id="workerName"
                  type="text"
                  placeholder="Worker's full name"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="pl-10"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="workerEmail">Email Address</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  id="workerEmail"
                  type="email"
                  placeholder="worker@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-10"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="workerPosition">Position (optional)</Label>
              <div className="relative">
                <Briefcase className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  id="workerPosition"
                  type="text"
                  placeholder="e.g. Cashier, Server, Driver"
                  value={position}
                  onChange={(e) => setPosition(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            <DialogFooter className="gap-2">
              <Button variant="outline" type="button" onClick={() => handleClose(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={sending || !email.trim() || !fullName.trim()}>
                {sending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                Create Account
              </Button>
            </DialogFooter>
          </form>
        ) : (
          <div className="space-y-4">
            <div className="p-4 rounded-xl bg-accent/50 border border-border space-y-3">
              <p className="text-sm font-medium text-foreground">Worker account created!</p>
              <div className="space-y-2 text-sm">
                <div>
                  <span className="text-muted-foreground">Name: </span>
                  <span className="font-medium">{createdWorker.full_name}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Email: </span>
                  <span className="font-medium">{createdWorker.email}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Temp Password: </span>
                  <code className="px-2 py-0.5 rounded bg-muted text-foreground font-mono text-xs">
                    {createdWorker.temp_password}
                  </code>
                </div>
              </div>
            </div>

            <p className="text-xs text-muted-foreground">
              Share these credentials with the worker. They can change their password after signing in via the Reset Password option.
            </p>

            <div className="flex gap-2">
              <Button variant="outline" className="flex-1 gap-2" onClick={handleCopyCredentials}>
                {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                {copied ? 'Copied!' : 'Copy Credentials'}
              </Button>
            </div>

            <DialogFooter className="gap-2">
              <Button variant="outline" onClick={handleAddAnother}>
                Add Another
              </Button>
              <Button onClick={() => handleClose(false)}>
                Done
              </Button>
            </DialogFooter>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};
