import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, ScrollView, RefreshControl } from 'react-native';
import { Inbox, Check, X } from 'lucide-react-native';
import { useAuth } from '@/contexts/AuthContext';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/Feedback';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner-native';

interface Pending {
  id: string;
  kind: 'swap' | 'pickup' | 'calloff';
  title: string;
  subtitle: string;
}

export function ManagerShiftRequests() {
  const { profile } = useAuth();
  const teamId = profile?.active_team_id || profile?.team_id;
  const [items, setItems] = useState<Pending[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!teamId) return;
    setLoading(true);
    const [{ data: swaps }, { data: pickups }, { data: calloffs }] = await Promise.all([
      supabase.from('swap_requests').select('id, requester_id, shift_id, profiles:requester_id(full_name)').eq('status', 'pending').limit(50),
      supabase.from('shift_requests').select('id, worker_id, shift_id, profiles:worker_id(full_name)').eq('status', 'pending').limit(50),
      supabase.from('call_off_requests').select('id, worker_id, shift_id, reason, profiles:worker_id(full_name)').eq('status', 'pending').limit(50),
    ]);
    const out: Pending[] = [];
    (swaps as any[] | null)?.forEach(s => out.push({ id: 's_' + s.id, kind: 'swap', title: 'Swap request', subtitle: s.profiles?.full_name || 'A worker' }));
    (pickups as any[] | null)?.forEach(s => out.push({ id: 'p_' + s.id, kind: 'pickup', title: 'Pickup request', subtitle: s.profiles?.full_name || 'A worker' }));
    (calloffs as any[] | null)?.forEach(s => out.push({ id: 'c_' + s.id, kind: 'calloff', title: 'Call-off request', subtitle: `${s.profiles?.full_name || 'A worker'}${s.reason ? ' · ' + s.reason : ''}` }));
    setItems(out);
    setLoading(false);
  }, [teamId]);

  useEffect(() => { void load(); }, [load]);

  const decide = async (it: Pending, status: 'approved' | 'declined') => {
    const realId = it.id.slice(2);
    const table = it.kind === 'swap' ? 'swap_requests' : it.kind === 'pickup' ? 'shift_requests' : 'call_off_requests';
    const { error } = await supabase.from(table).update({ status }).eq('id', realId);
    if (error) toast.error(error.message);
    else { toast.success(status === 'approved' ? 'Approved' : 'Declined'); void load(); }
  };

  return (
    <ScrollView
      className="flex-1"
      contentContainerStyle={{ padding: 16, paddingBottom: 32 }}
      refreshControl={<RefreshControl refreshing={loading} onRefresh={load} />}
    >
      <Text className="font-display text-[26px] text-foreground mb-4" style={{ letterSpacing: -0.7 }}>Requests</Text>

      {items.length === 0 ? (
        <EmptyState
          icon={<Inbox size={28} color="rgb(var(--muted-foreground))" />}
          title="No pending requests"
          description="When workers submit swaps, pickups, or call-offs, they'll appear here."
        />
      ) : (
        <View className="gap-2.5">
          {items.map(it => (
            <Card key={it.id} className="gap-3">
              <View className="flex-row items-center justify-between">
                <Text className="text-foreground text-[15px] font-sans-semibold">{it.title}</Text>
                <Badge variant={it.kind === 'swap' ? 'info' : it.kind === 'pickup' ? 'success' : 'warning'}>
                  {it.kind}
                </Badge>
              </View>
              <Text className="text-muted-foreground text-sm">{it.subtitle}</Text>
              <View className="flex-row gap-2">
                <Button variant="outline" className="flex-1" onPress={() => decide(it, 'declined')} leftIcon={<X size={16} color="rgb(var(--foreground))" />}>
                  Decline
                </Button>
                <Button className="flex-1" onPress={() => decide(it, 'approved')} leftIcon={<Check size={16} color="white" />}>
                  Approve
                </Button>
              </View>
            </Card>
          ))}
        </View>
      )}
    </ScrollView>
  );
}
