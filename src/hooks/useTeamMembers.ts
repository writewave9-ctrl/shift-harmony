 import { useState, useEffect } from 'react';
 import { supabase } from '@/integrations/supabase/client';
 import { useAuth } from '@/contexts/AuthContext';
 
 export interface TeamMember {
   id: string;
   user_id: string;
   full_name: string;
   email: string;
   phone: string | null;
   avatar_url: string | null;
   position: string | null;
   weekly_hours_target: number | null;
   willingness_for_extra: 'low' | 'medium' | 'high' | null;
   reliability_score: number | null;
   role: 'worker' | 'manager' | 'admin';
 }
 
 export function useTeamMembers() {
   const { profile } = useAuth();
   const [members, setMembers] = useState<TeamMember[]>([]);
   const [loading, setLoading] = useState(true);
   const [error, setError] = useState<string | null>(null);
 
   const fetchMembers = async () => {
     if (!profile?.team_id) {
       setMembers([]);
       setLoading(false);
       return;
     }
 
     try {
       setLoading(true);
       
       // Get team members with their roles
       const { data: profiles, error: profilesError } = await supabase
         .from('profiles')
         .select('*')
         .eq('team_id', profile.team_id);
 
       if (profilesError) throw profilesError;
 
       // Get roles for these users
       const userIds = profiles?.map(p => p.user_id) || [];
       const { data: roles, error: rolesError } = await supabase
         .from('user_roles')
         .select('*')
         .in('user_id', userIds);
 
       if (rolesError) throw rolesError;
 
       const membersWithRoles = profiles?.map(p => {
         const userRole = roles?.find(r => r.user_id === p.user_id);
         return {
           ...p,
           role: userRole?.role || 'worker',
         };
       }) as TeamMember[];
 
       setMembers(membersWithRoles || []);
     } catch (err: any) {
       console.error('Error fetching team members:', err);
       setError(err.message);
     } finally {
       setLoading(false);
     }
   };
 
   useEffect(() => {
     fetchMembers();
   }, [profile?.team_id]);
 
   const workers = members.filter(m => m.role === 'worker');
   const managers = members.filter(m => m.role === 'manager' || m.role === 'admin');
 
   return {
     members,
     workers,
     managers,
     loading,
     error,
     fetchMembers,
   };
 }