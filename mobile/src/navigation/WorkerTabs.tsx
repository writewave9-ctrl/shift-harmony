import React from 'react';
import { View } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Home, Calendar, Users, Bell, User } from 'lucide-react-native';
import { AppHeader } from '@/components/AppHeader';
import { WorkerHome } from '@/screens/worker/WorkerHome';
import { WorkerShifts } from '@/screens/worker/WorkerShifts';
import { WorkerTeamDirectory } from '@/screens/worker/WorkerTeamDirectory';
import { WorkerNotifications } from '@/screens/worker/WorkerNotifications';
import { WorkerProfile } from '@/screens/worker/WorkerProfile';

const Tab = createBottomTabNavigator();

const wrap = (Comp: React.ComponentType) => () => (
  <View className="flex-1 bg-background">
    <AppHeader />
    <Comp />
  </View>
);

export function WorkerTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: 'rgb(80 165 145)',
        tabBarInactiveTintColor: 'rgb(140 140 140)',
        tabBarStyle: {
          backgroundColor: 'rgb(var(--card))',
          borderTopColor: 'rgb(var(--border))',
          height: 64,
          paddingBottom: 8,
          paddingTop: 6,
        },
        tabBarLabelStyle: { fontSize: 11, fontWeight: '600' },
        tabBarIcon: ({ color, size }) => {
          const I = ({ Home, Shifts: Calendar, Team: Users, Alerts: Bell, Me: User } as any)[route.name];
          return I ? <I size={20} color={color} /> : null;
        },
      })}
    >
      <Tab.Screen name="Home" component={wrap(WorkerHome)} />
      <Tab.Screen name="Shifts" component={wrap(WorkerShifts)} />
      <Tab.Screen name="Team" component={wrap(WorkerTeamDirectory)} />
      <Tab.Screen name="Alerts" component={wrap(WorkerNotifications)} />
      <Tab.Screen name="Me" component={wrap(WorkerProfile)} />
    </Tab.Navigator>
  );
}
