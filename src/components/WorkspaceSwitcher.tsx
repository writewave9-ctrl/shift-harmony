import { useState } from 'react';
import { Check, ChevronsUpDown, LogOut, Loader2 } from 'lucide-react';
import { useTeamMemberships } from '@/hooks/useTeamMemberships';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
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
import { cn } from '@/lib/utils';

interface WorkspaceSwitcherProps {
  className?: string;
}

export const WorkspaceSwitcher = ({ className }: WorkspaceSwitcherProps) => {
  const { memberships, switchTeam, leaveTeam, switching } = useTeamMemberships();
  const [leaveTarget, setLeaveTarget] = useState<{ id: string; name: string } | null>(null);
  const [leaving, setLeaving] = useState(false);

  const active = memberships.find(m => m.is_active_team);
  const activeName = active?.team_name || 'No workspace';

  if (memberships.length === 0) return null;

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            className={cn('h-8 px-2.5 gap-1.5 max-w-[180px] truncate', className)}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-success shrink-0" />
            <span className="truncate text-xs font-medium">{activeName}</span>
            <ChevronsUpDown className="w-3 h-3 text-muted-foreground shrink-0" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-64">
          <DropdownMenuLabel className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
            Your workspaces
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          {memberships.map((m) => (
            <div key={m.team_id} className="flex items-center group">
              <DropdownMenuItem
                className="flex-1 gap-2 cursor-pointer"
                disabled={switching}
                onClick={() => !m.is_active_team && switchTeam(m.team_id)}
              >
                <Check className={cn('w-4 h-4 shrink-0', m.is_active_team ? 'opacity-100 text-primary' : 'opacity-0')} />
                <span className="truncate text-sm">{m.team_name}</span>
              </DropdownMenuItem>
              <button
                onClick={(e) => { e.preventDefault(); setLeaveTarget({ id: m.team_id, name: m.team_name }); }}
                className="opacity-0 group-hover:opacity-100 p-1 mr-1 rounded hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-all"
                title="Leave workspace"
              >
                <LogOut className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>

      <AlertDialog open={!!leaveTarget} onOpenChange={(o) => !o && setLeaveTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Leave {leaveTarget?.name}?</AlertDialogTitle>
            <AlertDialogDescription>
              You'll be unassigned from any future shifts in this workspace and can no longer be invited unless a manager invites you again.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={leaving}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              disabled={leaving}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={async (e) => {
                e.preventDefault();
                if (!leaveTarget) return;
                setLeaving(true);
                await leaveTeam(leaveTarget.id);
                setLeaving(false);
                setLeaveTarget(null);
              }}
            >
              {leaving && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
              Leave workspace
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};
