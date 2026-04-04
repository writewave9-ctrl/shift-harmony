import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Users, Search, Mail, Phone, Shield, Briefcase } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

interface TeamMember {
  id: string;
  full_name: string;
  avatar_url: string | null;
  position: string | null;
  email: string;
  phone: string | null;
  role: string | null;
}

export const WorkerTeamDirectory = () => {
  const { profile } = useAuth();
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    const fetchTeam = async () => {
      if (!profile?.team_id) {
        setLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from('profiles')
        .select('id, full_name, avatar_url, position, email, phone')
        .eq('team_id', profile.team_id)
        .order('full_name');

      if (error) {
        console.error('Error fetching team:', error);
        setLoading(false);
        return;
      }

      // Fetch roles for all members
      const userIds = (data || []).map(m => m.id);
      const { data: roles } = await supabase
        .from('user_roles')
        .select('user_id, role');

      // Get user_ids from profiles to match with roles
      const { data: profileUserIds } = await supabase
        .from('profiles')
        .select('id, user_id')
        .eq('team_id', profile.team_id);

      const userIdMap = new Map((profileUserIds || []).map(p => [p.id, p.user_id]));
      const roleMap = new Map((roles || []).map(r => [r.user_id, r.role]));

      const membersWithRoles: TeamMember[] = (data || []).map(m => ({
        ...m,
        role: roleMap.get(userIdMap.get(m.id) || '') || null,
      }));

      // Sort: managers first, then by name
      membersWithRoles.sort((a, b) => {
        const aIsManager = a.role === 'manager' || a.role === 'admin';
        const bIsManager = b.role === 'manager' || b.role === 'admin';
        if (aIsManager && !bIsManager) return -1;
        if (!aIsManager && bIsManager) return 1;
        return a.full_name.localeCompare(b.full_name);
      });

      setMembers(membersWithRoles);
      setLoading(false);
    };

    fetchTeam();
  }, [profile?.team_id]);

  const filtered = members.filter(m =>
    m.full_name.toLowerCase().includes(search.toLowerCase()) ||
    (m.position || '').toLowerCase().includes(search.toLowerCase())
  );

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

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
        <p className="text-sm text-muted-foreground">{members.length} team member{members.length !== 1 ? 's' : ''}</p>
      </header>

      <div className="px-5 pb-6 space-y-4">
        {members.length > 3 && (
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search teammates..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="pl-10 h-10"
            />
          </div>
        )}

        {filtered.length === 0 ? (
          <div className="text-center py-12">
            <Users className="w-12 h-12 text-muted-foreground/40 mx-auto mb-3" />
            <p className="text-muted-foreground font-medium">
              {search ? 'No teammates found' : 'No team members yet'}
            </p>
          </div>
        ) : (
          <div className="space-y-2.5">
            {filtered.map(member => {
              const isManager = member.role === 'manager' || member.role === 'admin';
              const isSelf = member.id === profile?.id;

              return (
                <div
                  key={member.id}
                  className={cn(
                    "rounded-xl p-4 bg-card border border-border/50 shadow-sm",
                    isManager && "border-l-[3px] border-l-primary"
                  )}
                >
                  <div className="flex items-center gap-3">
                    {member.avatar_url ? (
                      <img
                        src={member.avatar_url}
                        alt={member.full_name}
                        className="w-11 h-11 rounded-full object-cover"
                      />
                    ) : (
                      <div className={cn(
                        "w-11 h-11 rounded-full flex items-center justify-center text-sm font-semibold",
                        isManager
                          ? "bg-primary/10 text-primary"
                          : "bg-muted text-muted-foreground"
                      )}>
                        {getInitials(member.full_name)}
                      </div>
                    )}

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="font-semibold text-foreground text-sm truncate">
                          {member.full_name}
                          {isSelf && <span className="text-muted-foreground font-normal"> (You)</span>}
                        </p>
                      </div>
                      <div className="flex items-center gap-2 mt-0.5">
                        {isManager && (
                          <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-1.5 py-0.5 rounded-md bg-primary/10 text-primary">
                            <Shield className="w-2.5 h-2.5" />
                            Manager
                          </span>
                        )}
                        {member.position && (
                          <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                            <Briefcase className="w-3 h-3" />
                            {member.position}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-1">
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
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default WorkerTeamDirectory;
