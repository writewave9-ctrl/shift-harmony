import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, RefreshControl } from 'react-native';
import { Users } from 'lucide-react-native';
import { Card } from '@/components/ui/Card';
import { EmptyState } from '@/components/ui/Feedback';
import { supabase } from '@/integrations/supabase/client';

interface Member { id: string; full_name: string; avatar_url: string | null; role_position: string | null }

export function WorkerTeamDirectory() {
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    const { data } = await supabase.rpc('get_team_member_directory');
    setMembers((data as any[]) ?? []);
    setLoading(false);
  };
  useEffect(() => { void load(); }, []);

  return (
    <ScrollView
      className="flex-1"
      contentContainerStyle={{ padding: 16, paddingBottom: 32 }}
      refreshControl={<RefreshControl refreshing={loading} onRefresh={load} />}
    >
      <Text className="font-display text-[26px] text-foreground mb-4" style={{ letterSpacing: -0.7 }}>Team</Text>
      {members.length === 0 && !loading ? (
        <EmptyState icon={<Users size={28} color="rgb(var(--muted-foreground))" />} title="No teammates yet" />
      ) : (
        <View className="gap-2">
          {members.map(m => (
            <Card key={m.id} className="flex-row items-center gap-3">
              <View className="w-10 h-10 rounded-full bg-accent items-center justify-center">
                <Text className="text-accent-foreground font-sans-bold">{(m.full_name || '?')[0]}</Text>
              </View>
              <View className="flex-1">
                <Text className="text-foreground text-[15px] font-sans-semibold">{m.full_name}</Text>
                {m.role_position ? <Text className="text-muted-foreground text-xs mt-0.5">{m.role_position}</Text> : null}
              </View>
            </Card>
          ))}
        </View>
      )}
    </ScrollView>
  );
}
