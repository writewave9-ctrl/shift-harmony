import React from 'react';
import { View, Text, ScrollView } from 'react-native';
import { LogOut, BarChart2, Bell, Settings as SettingsIcon, LifeBuoy } from 'lucide-react-native';
import { useAuth } from '@/contexts/AuthContext';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';

export function ManagerMore() {
  const { profile, user, signOut } = useAuth();

  return (
    <ScrollView className="flex-1" contentContainerStyle={{ padding: 16, paddingBottom: 32, gap: 16 }}>
      <View className="items-center mt-2">
        <View className="w-20 h-20 rounded-full bg-accent items-center justify-center">
          <Text className="text-accent-foreground text-2xl font-sans-bold">{(profile?.full_name || 'M')[0]}</Text>
        </View>
        <Text className="font-display text-[22px] text-foreground mt-3" style={{ letterSpacing: -0.4 }}>
          {profile?.full_name || 'Manager'}
        </Text>
        <Text className="text-muted-foreground text-sm">{user?.email}</Text>
      </View>

      <Card className="gap-3 p-2">
        <Item icon={<BarChart2 size={18} color="rgb(var(--foreground))" />} label="Analytics" />
        <Item icon={<Bell size={18} color="rgb(var(--foreground))" />} label="Notifications" />
        <Item icon={<SettingsIcon size={18} color="rgb(var(--foreground))" />} label="Settings" />
        <Item icon={<LifeBuoy size={18} color="rgb(var(--foreground))" />} label="Support" />
      </Card>

      <Button variant="outline" onPress={signOut} leftIcon={<LogOut size={16} color="rgb(var(--foreground))" />}>
        Sign out
      </Button>
    </ScrollView>
  );
}

function Item({ icon, label }: { icon: React.ReactNode; label: string }) {
  return (
    <View className="flex-row items-center gap-3 px-3 py-3 rounded-xl">
      {icon}
      <Text className="text-foreground text-[15px] font-sans-medium flex-1">{label}</Text>
    </View>
  );
}
