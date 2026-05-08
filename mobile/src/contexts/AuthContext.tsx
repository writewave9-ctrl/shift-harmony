import React, { createContext, useContext, useEffect, useState } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';

export interface Profile {
  id: string;
  user_id: string;
  organization_id: string | null;
  team_id: string | null;
  active_team_id: string | null;
  full_name: string;
  email: string;
  phone: string | null;
  avatar_url: string | null;
  position: string | null;
}
export interface UserRole {
  role: 'admin' | 'manager' | 'worker';
}

interface Ctx {
  user: User | null;
  session: Session | null;
  profile: Profile | null;
  userRole: UserRole | null;
  loading: boolean;
  signUp: (email: string, password: string, fullName: string, role: 'manager' | 'worker', invitationToken?: string) => Promise<{ error: Error | null }>;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<Ctx | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [userRole, setUserRole] = useState<UserRole | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchProfile = async (userId: string) => {
    try {
      const [p, r] = await Promise.all([
        supabase.from('profiles').select('*').eq('user_id', userId).maybeSingle(),
        supabase.from('user_roles').select('role').eq('user_id', userId).maybeSingle(),
      ]);
      setProfile((p.data as any) ?? null);
      setUserRole((r.data as any) ?? null);
    } catch (e) {
      console.warn('fetchProfile', e);
    }
  };

  useEffect(() => {
    let mounted = true;
    const apply = (s: Session | null) => {
      if (!mounted) return;
      setSession(s);
      setUser(s?.user ?? null);
      if (!s?.user) {
        setProfile(null);
        setUserRole(null);
        setLoading(false);
        return;
      }
      setLoading(false);
      void fetchProfile(s.user.id);
    };
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, s) => apply(s));
    supabase.auth.getSession().then(({ data }) => apply(data.session));
    return () => { mounted = false; subscription.unsubscribe(); };
  }, []);

  const signUp: Ctx['signUp'] = async (email, password, fullName, role, invitationToken) => {
    try {
      const { data, error } = await supabase.auth.signUp({
        email, password,
        options: {
          data: {
            full_name: fullName,
            role: invitationToken ? 'worker' : role,
            invitation_token: invitationToken || null,
          },
        },
      });
      if (error) throw error;
      if (data.user) {
        await new Promise(r => setTimeout(r, 600));
        await fetchProfile(data.user.id);
      }
      return { error: null };
    } catch (e) { return { error: e as Error }; }
  };

  const signIn: Ctx['signIn'] = async (email, password) => {
    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
      return { error: null };
    } catch (e) { return { error: e as Error }; }
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null); setSession(null); setProfile(null); setUserRole(null);
  };

  const refreshProfile = async () => { if (user) await fetchProfile(user.id); };

  return (
    <AuthContext.Provider value={{ user, session, profile, userRole, loading, signUp, signIn, signOut, refreshProfile }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const c = useContext(AuthContext);
  if (!c) throw new Error('useAuth must be inside AuthProvider');
  return c;
};
