import React from 'react';
import { View, Text, ActivityIndicator } from 'react-native';
import { useTheme } from '@/theme/ThemeProvider';
import { themes } from '@/theme/tokens';

export function FullScreenLoader({ label }: { label?: string }) {
  const { resolvedTheme } = useTheme();
  return (
    <View style={[themes[resolvedTheme], { flex: 1 }]} className="bg-background items-center justify-center gap-3">
      <ActivityIndicator size="large" color="rgb(var(--primary))" />
      {label ? <Text className="text-muted-foreground text-sm">{label}</Text> : null}
    </View>
  );
}

export function EmptyState({
  icon,
  title,
  description,
  action,
}: {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: React.ReactNode;
}) {
  return (
    <View className="items-center justify-center py-12 px-6 gap-3">
      {icon ? <View className="mb-1 opacity-60">{icon}</View> : null}
      <Text className="text-foreground text-lg font-display text-center">{title}</Text>
      {description ? (
        <Text className="text-muted-foreground text-sm text-center max-w-[280px] leading-5">{description}</Text>
      ) : null}
      {action ? <View className="mt-2">{action}</View> : null}
    </View>
  );
}
