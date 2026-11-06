import type { ReactNode } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { useColors } from '@/theme/colors';

type Props = {
  title: string;
  subtitle?: string;
  children?: ReactNode;
};

/** Placeholder layout for screens that are not built yet. */
export function EmptyState({ title, subtitle, children }: Props) {
  const c = useColors();
  return (
    <View style={[styles.container, { backgroundColor: c.background }]}>
      <Text accessibilityRole="header" style={[styles.title, { color: c.text }]}>
        {title}
      </Text>
      {subtitle ? <Text style={[styles.subtitle, { color: c.muted }]}>{subtitle}</Text> : null}
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24, gap: 12 },
  title: { fontSize: 22, fontWeight: '600', textAlign: 'center' },
  subtitle: { fontSize: 16, textAlign: 'center', lineHeight: 22 },
});
