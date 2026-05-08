import React, { createContext, useContext, useEffect, useState } from 'react';
import { Appearance, View } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { themes } from './tokens';

type Theme = 'light' | 'dark' | 'system';
type Resolved = 'light' | 'dark';

interface Ctx {
  theme: Theme;
  resolvedTheme: Resolved;
  setTheme: (t: Theme) => void;
}

const ThemeCtx = createContext<Ctx | undefined>(undefined);
const KEY = 'align-theme';

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<Theme>('system');
  const [resolved, setResolved] = useState<Resolved>(
    Appearance.getColorScheme() === 'dark' ? 'dark' : 'light',
  );

  useEffect(() => {
    AsyncStorage.getItem(KEY).then((v) => v && setThemeState(v as Theme));
    const sub = Appearance.addChangeListener(({ colorScheme }) => {
      if (theme === 'system') setResolved(colorScheme === 'dark' ? 'dark' : 'light');
    });
    return () => sub.remove();
  }, [theme]);

  useEffect(() => {
    if (theme === 'system') {
      setResolved(Appearance.getColorScheme() === 'dark' ? 'dark' : 'light');
    } else {
      setResolved(theme);
    }
  }, [theme]);

  const setTheme = (t: Theme) => {
    setThemeState(t);
    AsyncStorage.setItem(KEY, t);
  };

  return (
    <ThemeCtx.Provider value={{ theme, resolvedTheme: resolved, setTheme }}>
      <View style={[themes[resolved], { flex: 1 }]} className="bg-background">
        {children}
      </View>
    </ThemeCtx.Provider>
  );
}

export const useTheme = () => {
  const c = useContext(ThemeCtx);
  if (!c) throw new Error('useTheme must be inside ThemeProvider');
  return c;
};
