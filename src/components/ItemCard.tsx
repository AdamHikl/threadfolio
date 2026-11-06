import { StyleSheet, Text, View } from 'react-native';

import { vintageRange } from '@/db/items';
import type { ItemRow } from '@/db/types';
import { formatCents, formatRange } from '@/lib/money';
import { useColors } from '@/theme/colors';

export function ItemCard({ item }: { item: ItemRow }) {
  const c = useColors();
  const meta = [item.era, item.brand, item.size].filter(Boolean).join(' · ');
  const value = formatRange(vintageRange(item));
  const priceLine =
    item.status === 'collection'
      ? `Paid ${item.price_paid != null ? formatCents(item.price_paid) : '—'} · Worth ${value}`
      : `Typical ${value}${item.target_price != null ? ` · Target ${formatCents(item.target_price)}` : ''}`;

  return (
    <View
      accessible
      accessibilityLabel={`${item.title}. ${meta}. ${priceLine}`}
      style={[styles.card, { backgroundColor: c.surface, borderColor: c.border }]}>
      <Text style={[styles.title, { color: c.text }]}>{item.title}</Text>
      {meta ? <Text style={[styles.meta, { color: c.muted }]}>{meta}</Text> : null}
      <Text style={[styles.price, { color: c.text }]}>{priceLine}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { borderWidth: StyleSheet.hairlineWidth, borderRadius: 12, padding: 14, gap: 4 },
  title: { fontSize: 17, fontWeight: '600' },
  meta: { fontSize: 14 },
  price: { fontSize: 15, marginTop: 4 },
});
