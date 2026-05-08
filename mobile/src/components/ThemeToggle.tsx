import React from 'react';
import { Pressable } from 'react-native';
import { Sun, Moon } from 'lucide-react-native';
import { useTheme } from '@/theme/ThemeProvider';
import { haptics } from '@/lib/haptics';

export function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme();
  const isDark = resolvedTheme === 'dark';
  return (
    <Pressable
      onPress={() => { haptics.light(); setTheme(isDark ? 'light' : 'dark'); }}
      className="h-9 w-9 rounded-full border border-border bg-card items-center justify-center"
      hitSlop={6}
    >
      {isDark
        ? <Moon size={18} color="rgb(120 220 200)" />
        : <Sun size={18} color="rgb(214 158 46)" />}
    </Pressable>
  );
}
