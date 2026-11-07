import Ionicons from '@expo/vector-icons/Ionicons';
import { useRouter } from 'expo-router';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';

import { vintageRange, type ItemListRow } from '@/db/items';
import { formatCents, formatRange } from '@/lib/money';
import { useColors } from '@/theme/colors';

export function ItemCard({ item }: { item: ItemListRow }) {
  const c = useColors();
  const router = useRouter();
  const meta = [item.era, item.brand, item.size].filter(Boolean).join(' · ');
  const value = formatRange(vintageRange(item));
  const priceLine =
    item.status === 'collection'
      ? `Paid ${item.price_paid != null ? formatCents(item.price_paid) : '—'} · Worth ${value}`
      : `Typical ${value}${item.target_price != null ? ` · Target ${formatCents(item.target_price)}` : ''}`;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${item.title}. ${meta}. ${priceLine}`}
      accessibilityHint="Opens the piece"
      onPress={() => router.push({ pathname: '/item/[id]', params: { id: item.id } })}
      style={({ pressed }) => [
        styles.card,
        { backgroundColor: c.surface, borderColor: c.border, opacity: pressed ? 0.85 : 1 },
      ]}>
      {item.photo_uri ? (
        <Image source={{ uri: item.photo_uri }} style={styles.thumb} />
      ) : (
        <View style={[styles.thumb, styles.placeholder, { backgroundColor: c.background }]}>
          <Ionicons name="shirt-outline" size={28} color={c.muted} />
        </View>
      )}
      <View style={styles.text}>
        <Text style={[styles.title, { color: c.text }]} numberOfLines={2}>
          {item.title}
        </Text>
        {meta ? (
          <Text style={[styles.meta, { color: c.muted }]} numberOfLines={1}>
            {meta}
          </Text>
        ) : null}
        <Text style={[styles.price, { color: c.text }]}>{priceLine}</Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    gap: 12,
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
  },
  thumb: { width: 72, height: 72, borderRadius: 8 },
  placeholder: { alignItems: 'center', justifyContent: 'center' },
  text: { flex: 1, gap: 2 },
  title: { fontSize: 17, fontWeight: '600' },
  meta: { fontSize: 14 },
  price: { fontSize: 15, marginTop: 4 },
});
