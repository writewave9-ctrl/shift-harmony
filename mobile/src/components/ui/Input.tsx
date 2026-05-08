import React from 'react';
import { TextInput, TextInputProps, View, Text } from 'react-native';
import { cn } from '@/lib/utils';

interface InputProps extends TextInputProps {
  label?: string;
  error?: string;
  className?: string;
}

export const Input = React.forwardRef<TextInput, InputProps>(
  ({ label, error, className, ...p }, ref) => {
    return (
      <View className="gap-1.5">
        {label ? <Text className="text-foreground text-sm font-sans-medium">{label}</Text> : null}
        <TextInput
          ref={ref}
          placeholderTextColor="rgb(150 150 150)"
          className={cn(
            'h-11 rounded-xl border border-input bg-card px-3.5 text-foreground text-[15px]',
            error && 'border-destructive',
            className,
          )}
          {...p}
        />
        {error ? <Text className="text-destructive text-xs">{error}</Text> : null}
      </View>
    );
  },
);
Input.displayName = 'Input';
