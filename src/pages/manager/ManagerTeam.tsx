import { useState } from 'react';
import { ManagerTeamSkeleton } from '@/components/PageSkeletons';
import { cn } from '@/lib/utils';
import { WorkerCard } from '@/components/WorkerCard';
 import { InviteWorkerModal } from '@/components/InviteWorkerModal';
 import { useTeamMembers, TeamMember } from '@/hooks/useTeamMembers';
import { 
  ChevronLeft, 
  Users,
  Search,
  TrendingUp,
  TrendingDown,
   Minus,
   UserPlus,
   Loader2,
   UserMinus,
   Ban
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Input } from '@/components/ui/input';
 import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export const ManagerTeam = () => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
   const [selectedWorker, setSelectedWorker] = useState<TeamMember | null>(null);
   const [showInviteModal, setShowInviteModal] = useState(false);
   const [deactivateAction, setDeactivateAction] = useState<'deactivate' | 'remove' | null>(null);
   const [deactivating, setDeactivating] = useState(false);
   const { workers, loading, fetchMembers } = useTeamMembers();

  const handleDeactivateWorker = async (action: 'deactivate' | 'remove') => {
    if (!selectedWorker) return;
    setDeactivating(true);
    try {
      const { data, error } = await supabase.functions.invoke('deactivate-worker', {
        body: {
          worker_profile_id: selectedWorker.id,
          action,
        },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      toast.success(data.message || `Worker ${action === 'remove' ? 'removed' : 'deactivated'}`);
      setSelectedWorker(null);
      setDeactivateAction(null);
      fetchMembers();
    } catch (err: any) {
      toast.error(err.message || `Failed to ${action} worker`);
    } finally {
      setDeactivating(false);
    }
  };

  const filteredWorkers = workers.filter(w => 
     w.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
     (w.position?.toLowerCase() || '').includes(searchQuery.toLowerCase())
  );

  // Categorize workers
   const overloaded = filteredWorkers.filter(w => 
     (w.willingness_for_extra === 'low')
   );
  const available = filteredWorkers.filter(w => 
     w.willingness_for_extra === 'high'
  );
  const balanced = filteredWorkers.filter(w => 
     w.willingness_for_extra === 'medium' || !w.willingness_for_extra
  );

   // Convert TeamMember to Worker-like structure for WorkerCard
   const toWorkerCardData = (member: TeamMember) => ({
     id: member.id,
     name: member.full_name,
     role: 'worker' as const,
     email: member.email,
     phone: member.phone || undefined,
     avatar: member.avatar_url || undefined,
     weeklyHoursWorked: 0, // Would need to calculate from shifts
     weeklyHoursTarget: member.weekly_hours_target || 40,
     willingnessForExtra: member.willingness_for_extra || 'medium',
     reliabilityScore: member.reliability_score || 80,
     position: member.position || 'Team Member',
   });
 
  if (loading) return <ManagerTeamSkeleton />;
 
  return (
    <div className="min-h-screen bg-background pb-8">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-background/95 backdrop-blur-sm border-b border-border/50 px-4 py-4 lg:px-8">
        <div className="flex items-center gap-3 mb-4">
          <button 
            onClick={() => navigate('/manager')}
            className="p-2 -ml-2 rounded-lg hover:bg-accent transition-colors lg:hidden"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-lg font-semibold text-foreground">Team</h1>
            <p className="text-xs text-muted-foreground">{workers.length} members</p>
          </div>
           <Button
             size="sm"
             className="ml-auto gap-1.5"
             onClick={() => setShowInviteModal(true)}
           >
             <UserPlus className="w-4 h-4" />
             <span className="hidden sm:inline">Add Worker</span>
           </Button>
        </div>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search by name or position..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
      </header>

      <div className="px-4 py-6 lg:px-8 space-y-6">
        {/* Summary Cards */}
        <div className="grid grid-cols-3 gap-3">
          <div className="card-elevated rounded-xl p-3 text-center">
            <div className="flex items-center justify-center gap-1 text-success mb-1">
              <TrendingUp className="w-4 h-4" />
              <span className="text-xl font-bold">{available.length}</span>
            </div>
            <p className="text-xs text-muted-foreground">Available</p>
          </div>
          <div className="card-elevated rounded-xl p-3 text-center">
            <div className="flex items-center justify-center gap-1 text-muted-foreground mb-1">
              <Minus className="w-4 h-4" />
              <span className="text-xl font-bold">{balanced.length}</span>
            </div>
            <p className="text-xs text-muted-foreground">Balanced</p>
          </div>
          <div className="card-elevated rounded-xl p-3 text-center">
            <div className="flex items-center justify-center gap-1 text-warning mb-1">
              <TrendingDown className="w-4 h-4" />
              <span className="text-xl font-bold">{overloaded.length}</span>
            </div>
            <p className="text-xs text-muted-foreground">At Capacity</p>
          </div>
        </div>

        {/* Available for More */}
        {available.length > 0 && (
          <section>
            <h2 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-success" />
              Can Take More Shifts
            </h2>
            <div className="space-y-3">
              {available.map(worker => (
                <WorkerCard
                  key={worker.id}
                   worker={toWorkerCardData(worker)}
                  showReliability
                  onClick={() => setSelectedWorker(worker)}
                />
              ))}
            </div>
          </section>
        )}

        {/* Balanced */}
        {balanced.length > 0 && (
          <section>
            <h2 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
              <Minus className="w-4 h-4 text-muted-foreground" />
              Prefer Current Load
            </h2>
            <div className="space-y-3">
              {balanced.map(worker => (
                <WorkerCard
                  key={worker.id}
                   worker={toWorkerCardData(worker)}
                  showReliability
                  onClick={() => setSelectedWorker(worker)}
                />
              ))}
            </div>
          </section>
        )}

        {/* At Capacity */}
        {overloaded.length > 0 && (
          <section>
            <h2 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
              <TrendingDown className="w-4 h-4 text-warning" />
              At or Over Target
            </h2>
            <div className="space-y-3">
              {overloaded.map(worker => (
                <WorkerCard
                  key={worker.id}
                   worker={toWorkerCardData(worker)}
                  showReliability
                  onClick={() => setSelectedWorker(worker)}
                />
              ))}
            </div>
          </section>
        )}

        {filteredWorkers.length === 0 && (
          <div className="text-center py-12">
            <Users className="w-12 h-12 mx-auto text-muted-foreground/50 mb-4" />
            <p className="text-muted-foreground">No team members found</p>
          </div>
        )}
      </div>

      {/* Worker Detail Dialog */}
      <Dialog open={!!selectedWorker} onOpenChange={() => setSelectedWorker(null)}>
        <DialogContent className="sm:max-w-md">
           <DialogHeader>
             <DialogTitle>{selectedWorker?.full_name}</DialogTitle>
           </DialogHeader>
          
          {selectedWorker && (
            <div className="space-y-4 pt-4">
              <WorkerCard
                 worker={toWorkerCardData(selectedWorker)}
                showReliability
                showHours
              />
              
              <div className="p-4 rounded-xl bg-accent/50 border border-border/50">
                <p className="text-xs font-medium text-muted-foreground mb-2">CONTACT</p>
                <p className="text-sm">{selectedWorker.email}</p>
                {selectedWorker.phone && (
                  <p className="text-sm text-muted-foreground">{selectedWorker.phone}</p>
                )}
              </div>

              {selectedWorker.role === 'worker' && (
                <div className="pt-2 space-y-2">
                  <Button
                    variant="outline"
                    className="w-full gap-2 text-warning border-warning/30 hover:bg-warning/10"
                    onClick={() => setDeactivateAction('deactivate')}
                  >
                    <UserMinus className="w-4 h-4" />
                    Remove from Team
                  </Button>
                  <Button
                    variant="outline"
                    className="w-full gap-2 text-destructive border-destructive/30 hover:bg-destructive/10"
                    onClick={() => setDeactivateAction('remove')}
                  >
                    <Ban className="w-4 h-4" />
                    Deactivate Account
                  </Button>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Deactivate Confirmation */}
      <AlertDialog open={!!deactivateAction} onOpenChange={() => setDeactivateAction(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {deactivateAction === 'remove' ? 'Deactivate Account' : 'Remove from Team'}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {deactivateAction === 'remove'
                ? `This will remove ${selectedWorker?.full_name} from the team and disable their account. They will no longer be able to sign in. This action cannot be easily undone.`
                : `This will remove ${selectedWorker?.full_name} from your team and unassign them from future shifts. Their account will remain active and they can be re-added later.`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deactivating}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              disabled={deactivating}
              className={deactivateAction === 'remove' ? 'bg-destructive text-destructive-foreground hover:bg-destructive/90' : ''}
              onClick={(e) => {
                e.preventDefault();
                handleDeactivateWorker(deactivateAction!);
              }}
            >
              {deactivating && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
              {deactivateAction === 'remove' ? 'Deactivate' : 'Remove'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
 
       {/* Invite Modal */}
       <InviteWorkerModal
         open={showInviteModal}
         onOpenChange={setShowInviteModal}
         onWorkerCreated={() => fetchMembers()}
       />
    </div>
  );
};
