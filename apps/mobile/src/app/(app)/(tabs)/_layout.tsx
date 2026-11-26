import {Tabs} from 'expo-router';

import {Icon} from '@/components/atoms/Icon';
import {useTheme} from '@/hooks/useTheme';

// Also fulsav: Jarmuvek es Profil. A teljes terv (Fooldal, +, Penzugy, Diagnozis)
// a ui-terv.html-ben van; ide most csak a backenden mar kesz reszek kerultek.
export default function TabsLayout() {
  const theme = useTheme();
  return (
    <Tabs
      screenOptions={{
        headerShown: false, // a fuleken a kepernyo maga rajzolja a cimet
        tabBarActiveTintColor: theme.primary,
        tabBarInactiveTintColor: theme.textSecondary,
        tabBarStyle: {backgroundColor: theme.surface, borderTopColor: theme.line},
        tabBarLabelStyle: {fontSize: 12, fontWeight: '600'},
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Járművek',
          tabBarIcon: ({color}) => (
            <Icon
              name={{ios: 'car.fill', android: 'directions_car', web: 'directions_car'}}
              color={color}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profil',
          tabBarIcon: ({color}) => (
            <Icon
              name={{
                ios: 'person.crop.circle',
                android: 'account_circle',
                web: 'account_circle',
              }}
              color={color}
            />
          ),
        }}
      />
    </Tabs>
  );
}
