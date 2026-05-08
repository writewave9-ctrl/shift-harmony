import React from 'react';
import { View, Text } from 'react-native';
import { cn } from '@/lib/utils';

type Variant = 'default' | 'success' | 'warning' | 'destructive' | 'info' | 'outline';
const styles: Record<Variant, string> = {
  default: 'bg-secondary',
  success: 'bg-success-muted',
  warning: 'bg-warning-muted',
  destructive: 'bg-destructive/15',
  info: 'bg-info-muted',
  outline: 'border border-border',
};
const text: Record<Variant, string> = {
  default: 'text-secondary-foreground',
  success: 'text-success',
  warning: 'text-warning-foreground',
  destructive: 'text-destructive',
  info: 'text-info',
  outline: 'text-foreground',
};

export function Badge({ children, variant = 'default', className }: { children: React.ReactNode; variant?: Variant; className?: string }) {
  return (
    <View className={cn('self-start rounded-full px-2.5 py-1', styles[variant], className)}>
      <Text className={cn('text-[11px] font-sans-semibold uppercase tracking-wider', text[variant])}>{children}</Text>
    </View>
  );
}
