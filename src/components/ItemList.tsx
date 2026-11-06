import { useFocusEffect } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { useCallback, useState, type ReactElement } from 'react';
import { FlatList, StyleSheet, Text, View } from 'react-native';

import { listItems } from '@/db/items';
import type { ItemRow, ItemStatus } from '@/db/types';
import { useColors } from '@/theme/colors';
import { EmptyState } from './Screen';
import { ItemCard } from './ItemCard';

type Props = {
  status: ItemStatus;
  emptyTitle: string;
  emptySubtitle: string;
  renderSummary: (items: ItemRow[]) => ReactElement;
};

/** Lists items with one status and reloads whenever the tab comes into focus. */
export function ItemList({ status, emptyTitle, emptySubtitle, renderSummary }: Props) {
  const db = useSQLiteContext();
  const c = useColors();
  const [items, setItems] = useState<ItemRow[] | null>(null);

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

  return (
    <FlatList
      style={{ backgroundColor: c.background }}
      contentContainerStyle={styles.list}
      data={items}
      keyExtractor={(i) => i.id}
      ListHeaderComponent={renderSummary(items)}
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
  summary: { borderWidth: StyleSheet.hairlineWidth, borderRadius: 12, padding: 14, gap: 6 },
  row: { flexDirection: 'row', justifyContent: 'space-between', gap: 12 },
  label: { fontSize: 15 },
  value: { fontSize: 15, fontWeight: '600' },
});
