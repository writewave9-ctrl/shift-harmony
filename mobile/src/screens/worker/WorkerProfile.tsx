import React from 'react';
import { View, Text, ScrollView } from 'react-native';
import { useAuth } from '@/contexts/AuthContext';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { LogOut } from 'lucide-react-native';

export function WorkerProfile() {
  const { profile, user, signOut } = useAuth();
  return (
    <ScrollView className="flex-1" contentContainerStyle={{ padding: 16, paddingBottom: 32, gap: 16 }}>
      <View className="items-center mt-2 mb-2">
        <View className="w-20 h-20 rounded-full bg-accent items-center justify-center">
          <Text className="text-accent-foreground text-2xl font-sans-bold">{(profile?.full_name || 'A')[0]}</Text>
        </View>
        <Text className="font-display text-[22px] text-foreground mt-3" style={{ letterSpacing: -0.4 }}>
          {profile?.full_name || 'Worker'}
        </Text>
        <Text className="text-muted-foreground text-sm">{user?.email}</Text>
      </View>

      <Card className="gap-2">
        <Row label="Position" value={profile?.position || '—'} />
        <Row label="Phone" value={profile?.phone || '—'} />
      </Card>

      <Button variant="outline" onPress={signOut} leftIcon={<LogOut size={16} color="rgb(var(--foreground))" />}>
        Sign out
      </Button>
    </ScrollView>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <View className="flex-row items-center justify-between py-2 border-b border-border last:border-b-0">
      <Text className="text-muted-foreground text-sm">{label}</Text>
      <Text className="text-foreground text-sm font-sans-medium">{value}</Text>
    </View>
  );
}
