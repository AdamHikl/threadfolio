import Ionicons from '@expo/vector-icons/Ionicons';
import { Tabs } from 'expo-router';
import type { ComponentProps } from 'react';
import type { ColorValue } from 'react-native';

import { useColors } from '@/theme/colors';

type IconName = ComponentProps<typeof Ionicons>['name'];

function icon(name: IconName) {
  function TabIcon({ color, size }: { color: ColorValue; size: number }) {
    return <Ionicons name={name} color={color as string} size={size} />;
  }
  return TabIcon;
}

export default function TabLayout() {
  const c = useColors();
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: c.accent,
        tabBarInactiveTintColor: c.muted,
        tabBarStyle: { backgroundColor: c.surface, borderTopColor: c.border },
        headerStyle: { backgroundColor: c.surface },
        headerTintColor: c.text,
      }}>
      <Tabs.Screen name="index" options={{ title: 'Scan', tabBarIcon: icon('camera-outline') }} />
      <Tabs.Screen
        name="collection"
        options={{ title: 'Collection', tabBarIcon: icon('shirt-outline') }}
      />
      <Tabs.Screen name="outfits" options={{ title: 'Outfits', tabBarIcon: icon('layers-outline') }} />
      <Tabs.Screen name="wishlist" options={{ title: 'Wishlist', tabBarIcon: icon('heart-outline') }} />
    </Tabs>
  );
}
