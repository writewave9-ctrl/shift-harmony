import React from 'react';
import { View } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { LayoutDashboard, Calendar, Inbox, Users, Settings } from 'lucide-react-native';
import { AppHeader } from '@/components/AppHeader';
import { ManagerDashboard } from '@/screens/manager/ManagerDashboard';
import { ManagerShifts } from '@/screens/manager/ManagerShifts';
import { ManagerShiftRequests } from '@/screens/manager/ManagerShiftRequests';
import { ManagerTeam } from '@/screens/manager/ManagerTeam';
import { ManagerMore } from '@/screens/manager/ManagerMore';

const Tab = createBottomTabNavigator();

const wrap = (Comp: React.ComponentType) => () => (
  <View className="flex-1 bg-background">
    <AppHeader />
    <Comp />
  </View>
);

export function ManagerTabs() {
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
        tabBarIcon: ({ color }) => {
          const I = ({
            Dashboard: LayoutDashboard,
            Shifts: Calendar,
            Requests: Inbox,
            Team: Users,
            More: Settings,
          } as any)[route.name];
          return I ? <I size={20} color={color} /> : null;
        },
      })}
    >
      <Tab.Screen name="Dashboard" component={wrap(ManagerDashboard)} />
      <Tab.Screen name="Shifts" component={wrap(ManagerShifts)} />
      <Tab.Screen name="Requests" component={wrap(ManagerShiftRequests)} />
      <Tab.Screen name="Team" component={wrap(ManagerTeam)} />
      <Tab.Screen name="More" component={wrap(ManagerMore)} />
    </Tab.Navigator>
  );
}
