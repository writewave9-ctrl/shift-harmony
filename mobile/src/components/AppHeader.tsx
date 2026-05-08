import React from 'react';
import { View, Text } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AlignLogo } from './AlignLogo';
import { ThemeToggle } from './ThemeToggle';

export function AppHeader({ title = 'Align' }: { title?: string }) {
  const insets = useSafeAreaInsets();
  return (
    <View
      style={{ paddingTop: insets.top }}
      className="bg-card/80 border-b border-border"
    >
      <View className="px-4 h-14 flex-row items-center justify-between">
        <View className="flex-row items-center gap-2.5">
          <AlignLogo size={28} />
          <Text className="font-display text-[17px] text-foreground" style={{ letterSpacing: -0.4 }}>
            {title}
          </Text>
        </View>
        <ThemeToggle />
      </View>
    </View>
  );
}
