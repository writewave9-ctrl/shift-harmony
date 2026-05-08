import React from 'react';
import { View, Text, ViewProps } from 'react-native';
import { cn } from '@/lib/utils';

export function Card({ className, ...p }: ViewProps & { className?: string }) {
  return (
    <View
      {...p}
      className={cn(
        'rounded-2xl border border-border bg-card p-4',
        className,
      )}
      style={[
        { shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 8, shadowOffset: { width: 0, height: 2 }, elevation: 1 },
        p.style as any,
      ]}
    />
  );
}

export function CardTitle({ children, className }: { children: React.ReactNode; className?: string }) {
  return <Text className={cn('text-foreground text-base font-sans-semibold', className)}>{children}</Text>;
}
export function CardDescription({ children, className }: { children: React.ReactNode; className?: string }) {
  return <Text className={cn('text-muted-foreground text-sm', className)}>{children}</Text>;
}
