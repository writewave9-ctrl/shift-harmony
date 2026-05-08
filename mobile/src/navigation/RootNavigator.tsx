import React from 'react';
import { NavigationContainer, DefaultTheme, DarkTheme } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/theme/ThemeProvider';
import { FullScreenLoader } from '@/components/ui/Feedback';
import { AuthScreen } from '@/screens/auth/AuthScreen';
import { WorkerTabs } from './WorkerTabs';
import { ManagerTabs } from './ManagerTabs';

const Stack = createNativeStackNavigator();

export function RootNavigator() {
  const { user, userRole, loading } = useAuth();
  const { resolvedTheme } = useTheme();

  const navTheme = resolvedTheme === 'dark'
    ? { ...DarkTheme, colors: { ...DarkTheme.colors, background: 'rgb(15 25 27)' } }
    : { ...DefaultTheme, colors: { ...DefaultTheme.colors, background: 'rgb(250 248 244)' } };

  if (loading) return <FullScreenLoader label="Loading…" />;

  return (
    <NavigationContainer theme={navTheme}>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {!user ? (
          <Stack.Screen name="Auth" component={AuthScreen} />
        ) : !userRole ? (
          <Stack.Screen name="Loading" component={FullScreenLoader as any} />
        ) : userRole.role === 'manager' || userRole.role === 'admin' ? (
          <Stack.Screen name="Manager" component={ManagerTabs} />
        ) : (
          <Stack.Screen name="Worker" component={WorkerTabs} />
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}
