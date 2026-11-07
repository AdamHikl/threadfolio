import { useFocusEffect } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { useCallback, useState, type ReactElement } from 'react';
import { FlatList, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { categoriesIn, listItems, type ItemListRow } from '@/db/items';
import type { Category, ItemStatus } from '@/db/types';
import { useColors } from '@/theme/colors';
import { ItemCard } from './ItemCard';
import { EmptyState } from './Screen';

type Props = {
  status: ItemStatus;
  emptyTitle: string;
  emptySubtitle: string;
  /** Summary for the pieces currently shown (after filtering). */
  renderSummary: (items: ItemListRow[]) => ReactElement;
};

const CATEGORY_LABELS: Record<Category, string> = {
  tops: 'Tops',
  tees: 'Tees',
  knitwear: 'Knitwear',
  denim: 'Denim',
  trousers: 'Trousers',
  skirts: 'Skirts',
  dresses: 'Dresses',
  outerwear: 'Outerwear',
  shoes: 'Shoes',
  accessories: 'Accessories',
};

/** Lists items with one status, with category filters. Reloads whenever the tab comes into focus. */
export function ItemList({ status, emptyTitle, emptySubtitle, renderSummary }: Props) {
  const db = useSQLiteContext();
  const c = useColors();
  const [items, setItems] = useState<ItemListRow[] | null>(null);
  const [category, setCategory] = useState<Category | null>(null);

  useFocusEffect(
    useCallback(() => {
      let active = true;
      listItems(db, status).then((rows) => {
        if (active) setItems(rows);
      });
      return () => {
        active = false;
      };
    }, [db, status]),
  );

  if (items === null) return <View style={{ flex: 1, backgroundColor: c.background }} />;
  if (items.length === 0) return <EmptyState title={emptyTitle} subtitle={emptySubtitle} />;

  const categories = categoriesIn(items);
  const active = category && categories.includes(category) ? category : null;
  const shown = active ? items.filter((i) => i.category === active) : items;

  return (
    <FlatList
      style={{ backgroundColor: c.background }}
      contentContainerStyle={styles.list}
      data={shown}
      keyExtractor={(i) => i.id}
      ListHeaderComponent={
        <View style={styles.header}>
          {renderSummary(shown)}
          {categories.length > 1 ? (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chips}>
              {[null, ...categories].map((cat) => {
                const selected = cat === active;
                return (
                  <Pressable
                    key={cat ?? 'all'}
                    accessibilityRole="button"
                    accessibilityState={{ selected }}
                    onPress={() => setCategory(cat)}
                    style={[
                      styles.chip,
                      {
                        backgroundColor: selected ? c.accent : c.surface,
                        borderColor: selected ? c.accent : c.border,
                      },
                    ]}>
                    <Text style={[styles.chipText, { color: selected ? c.accentText : c.text }]}>
                      {cat ? CATEGORY_LABELS[cat] : 'All'}
                    </Text>
                  </Pressable>
                );
              })}
            </ScrollView>
          ) : null}
        </View>
      }
      renderItem={({ item }) => <ItemCard item={item} />}
    />
  );
}

export function SummaryBox({ lines }: { lines: [label: string, value: string][] }) {
  const c = useColors();
  return (
    <View style={[styles.summary, { backgroundColor: c.surface, borderColor: c.border }]}>
      {lines.map(([label, value]) => (
        <View key={label} style={styles.row} accessible accessibilityLabel={`${label}: ${value}`}>
          <Text style={[styles.label, { color: c.muted }]}>{label}</Text>
          <Text style={[styles.value, { color: c.text }]}>{value}</Text>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  list: { padding: 16, gap: 12 },
  header: { gap: 12 },
  summary: { borderWidth: StyleSheet.hairlineWidth, borderRadius: 12, padding: 14, gap: 6 },
  row: { flexDirection: 'row', justifyContent: 'space-between', gap: 12 },
  label: { fontSize: 15 },
  value: { fontSize: 15, fontWeight: '600' },
  chips: { gap: 8 },
  chip: { borderWidth: 1, borderRadius: 999, paddingHorizontal: 14, minHeight: 36, justifyContent: 'center' },
  chipText: { fontSize: 15, fontWeight: '500' },
});
