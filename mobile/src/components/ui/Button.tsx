import React from 'react';
import { Pressable, Text, View, ActivityIndicator, PressableProps } from 'react-native';
import { cn } from '@/lib/utils';
import { haptics } from '@/lib/haptics';

type Variant = 'default' | 'outline' | 'ghost' | 'destructive' | 'secondary';
type Size = 'default' | 'sm' | 'lg' | 'icon';

interface ButtonProps extends Omit<PressableProps, 'children'> {
  variant?: Variant;
  size?: Size;
  loading?: boolean;
  className?: string;
  textClassName?: string;
  children?: React.ReactNode;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

const baseRoot =
  'flex-row items-center justify-center rounded-xl active:opacity-90';
const variants: Record<Variant, string> = {
  default: 'bg-primary',
  outline: 'border border-border bg-transparent',
  ghost: 'bg-transparent',
  destructive: 'bg-destructive',
  secondary: 'bg-secondary',
};
const variantsText: Record<Variant, string> = {
  default: 'text-primary-foreground',
  outline: 'text-foreground',
  ghost: 'text-foreground',
  destructive: 'text-destructive-foreground',
  secondary: 'text-secondary-foreground',
};
const sizes: Record<Size, string> = {
  default: 'h-11 px-5',
  sm: 'h-9 px-3',
  lg: 'h-12 px-6',
  icon: 'h-10 w-10',
};

export function Button({
  variant = 'default',
  size = 'default',
  loading,
  className,
  textClassName,
  children,
  leftIcon,
  rightIcon,
  disabled,
  onPress,
  ...rest
}: ButtonProps) {
  return (
    <Pressable
      {...rest}
      disabled={disabled || loading}
      onPress={(e) => {
        haptics.light();
        onPress?.(e);
      }}
      className={cn(
        baseRoot,
        variants[variant],
        sizes[size],
        (disabled || loading) && 'opacity-50',
        className,
      )}
    >
      {loading ? (
        <ActivityIndicator color="#fff" size="small" />
      ) : (
        <>
          {leftIcon ? <View className="mr-2">{leftIcon}</View> : null}
          {typeof children === 'string' ? (
            <Text className={cn('text-[15px] font-sans-semibold', variantsText[variant], textClassName)}>{children}</Text>
          ) : (
            children
          )}
          {rightIcon ? <View className="ml-2">{rightIcon}</View> : null}
        </>
      )}
    </Pressable>
  );
}
