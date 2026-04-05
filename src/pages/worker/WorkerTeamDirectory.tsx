import { useState } from 'react';
import { useTeamMembers, TeamMember } from '@/hooks/useTeamMembers';
import { useAuth } from '@/contexts/AuthContext';
import { Users, Search, Mail, Phone, Shield, Briefcase } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { MotionSection, MotionItem } from '@/components/MotionWrapper';
import { cn } from '@/lib/utils';

const getInitials = (name: string) =>
  name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);

const TeamMemberCard = ({ member, isSelf }: { member: TeamMember; isSelf: boolean }) => {
  const isManager = member.role === 'manager' || member.role === 'admin';

  return (
    <div
      className={cn(
        "rounded-xl p-4 bg-card border border-border/50 shadow-sm transition-all hover:shadow-md",
        isManager && "border-l-[3px] border-l-primary"
      )}
    >
      <div className="flex items-center gap-3">
        <Avatar className="w-11 h-11">
          {member.avatar_url && <AvatarImage src={member.avatar_url} alt={member.full_name} />}
          <AvatarFallback className={cn(
            "text-sm font-semibold",
            isManager ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"
          )}>
            {getInitials(member.full_name)}
          </AvatarFallback>
        </Avatar>

        <div className="flex-1 min-w-0">
          <p className="font-semibold text-foreground text-sm truncate">
            {member.full_name}
            {isSelf && <span className="text-muted-foreground font-normal"> (You)</span>}
          </p>
          <div className="flex items-center gap-2 mt-0.5 flex-wrap">
            {isManager && (
              <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-1.5 py-0.5 rounded-md bg-primary/10 text-primary">
                <Shield className="w-2.5 h-2.5" />Manager
              </span>
            )}
            {member.position && (
              <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                <Briefcase className="w-3 h-3" />{member.position}
              </span>
            )}
          </div>
        </div>

        <div className="flex items-center gap-0.5">
          {member.email && (
            <a
              href={`mailto:${member.email}`}
              className="p-2 rounded-lg hover:bg-accent/80 transition-colors"
              title={member.email}
            >
              <Mail className="w-4 h-4 text-muted-foreground" />
            </a>
          )}
          {member.phone && (
            <a
              href={`tel:${member.phone}`}
              className="p-2 rounded-lg hover:bg-accent/80 transition-colors"
              title={member.phone}
            >
              <Phone className="w-4 h-4 text-muted-foreground" />
            </a>
          )}
        </div>
      </div>
    </div>
  );
};

export const WorkerTeamDirectory = () => {
  const { profile } = useAuth();
  const { members, loading } = useTeamMembers();
  const [search, setSearch] = useState('');

  // Sort: managers first, then by name
  const sorted = [...members].sort((a, b) => {
    const aM = a.role === 'manager' || a.role === 'admin';
    const bM = b.role === 'manager' || b.role === 'admin';
    if (aM && !bM) return -1;
    if (!aM && bM) return 1;
    return a.full_name.localeCompare(b.full_name);
  });

  const filtered = sorted.filter(m =>
    m.full_name.toLowerCase().includes(search.toLowerCase()) ||
    (m.position || '').toLowerCase().includes(search.toLowerCase())
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-background px-5 pt-6 pb-6">
        <Skeleton className="h-8 w-40 mb-4" />
        <Skeleton className="h-10 w-full mb-4" />
        <div className="space-y-3">
          {[1, 2, 3, 4].map(i => (
            <Skeleton key={i} className="h-20 w-full rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="px-5 pt-6 pb-4">
        <div className="flex items-center gap-2 mb-1">
          <Users className="w-5 h-5 text-primary" />
          <h1 className="text-2xl font-bold text-foreground tracking-tight">Team</h1>
        </div>
        <p className="text-sm text-muted-foreground">
          {members.length} team member{members.length !== 1 ? 's' : ''}
        </p>
      </header>

      <div className="px-5 pb-6 space-y-4">
        {members.length > 3 && (
          <MotionSection>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search teammates..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="pl-10 h-10"
              />
            </div>
          </MotionSection>
        )}

        {filtered.length === 0 ? (
          <MotionSection className="text-center py-12">
            <Users className="w-12 h-12 text-muted-foreground/40 mx-auto mb-3" />
            <p className="text-muted-foreground font-medium">
              {search ? 'No teammates found' : 'No team members yet'}
            </p>
          </MotionSection>
        ) : (
          <div className="space-y-2.5">
            {filtered.map((member, index) => (
              <MotionItem key={member.id} index={index}>
                <TeamMemberCard
                  member={member}
                  isSelf={member.id === profile?.id}
                />
              </MotionItem>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default WorkerTeamDirectory;
