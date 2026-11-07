import { Stack, useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { useCallback, useState } from 'react';
import {
  Alert,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  type KeyboardTypeOptions,
} from 'react-native';

import { Button } from '@/components/Button';
import { EmptyState } from '@/components/Screen';
import {
  deleteItem,
  getItem,
  listPhotos,
  markBought,
  newRange,
  updateItem,
  vintageRange,
  type ItemPatch,
  type PhotoRow,
} from '@/db/items';
import { deletePhotoFiles } from '@/db/photoFiles';
import type { ItemRow } from '@/db/types';
import { formatCents, formatRange, parsePriceInput, priceVerdict } from '@/lib/money';
import { useColors, type Colors } from '@/theme/colors';

/** Text fields shown in edit mode. Prices are edited in dollars and stored as cents. */
type Draft = {
  title: string;
  brand: string;
  era: string;
  size: string;
  price: string;
  acquired_where: string;
  notes: string;
};

function toDraft(item: ItemRow): Draft {
  const cents = item.status === 'collection' ? item.price_paid : item.target_price;
  return {
    title: item.title,
    brand: item.brand ?? '',
    era: item.era ?? '',
    size: item.size ?? '',
    price: cents != null ? String(cents / 100) : '',
    acquired_where: item.acquired_where ?? '',
    notes: item.notes ?? '',
  };
}

function toPatch(item: ItemRow, d: Draft): ItemPatch | string {
  const title = d.title.trim();
  if (!title) return 'Give the piece a name.';
  const price = d.price.trim() ? parsePriceInput(d.price) : null;
  if (d.price.trim() && price == null) return 'Enter the price as a number, like 45 or 45.50.';
  const text = (s: string) => s.trim() || null;
  return {
    title,
    brand: text(d.brand),
    era: text(d.era),
    size: text(d.size),
    notes: text(d.notes),
    acquired_where: text(d.acquired_where),
    ...(item.status === 'collection' ? { price_paid: price } : { target_price: price }),
  };
}

export default function ItemScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const db = useSQLiteContext();
  const router = useRouter();
  const c = useColors();
  const [item, setItem] = useState<ItemRow | null | undefined>(undefined);
  const [photos, setPhotos] = useState<PhotoRow[]>([]);
  const [draft, setDraft] = useState<Draft | null>(null);
  const [boughtPrice, setBoughtPrice] = useState('');
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    const row = await getItem(db, id);
    setItem(row);
    setPhotos(row ? await listPhotos(db, id) : []);
  }, [db, id]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  if (item === undefined) return <View style={{ flex: 1, backgroundColor: c.background }} />;
  if (item === null) {
    return <EmptyState title="Piece not found" subtitle="It may have been deleted." />;
  }

  const vintage = vintageRange(item);
  const isCollection = item.status === 'collection';

  async function save() {
    if (!item || !draft) return;
    const patch = toPatch(item, draft);
    if (typeof patch === 'string') {
      setError(patch);
      return;
    }
    await updateItem(db, item.id, patch);
    setDraft(null);
    setError(null);
    await load();
  }

  async function bought() {
    if (!item) return;
    const price = boughtPrice.trim() ? parsePriceInput(boughtPrice) : (item.target_price ?? null);
    if (boughtPrice.trim() && price == null) {
      setError('Enter the price as a number, like 45 or 45.50.');
      return;
    }
    await markBought(db, item.id, price);
    setBoughtPrice('');
    setError(null);
    await load();
  }

  function confirmDelete() {
    if (!item) return;
    Alert.alert('Delete this piece?', `"${item.title}" and its photos will be removed from this phone.`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          deletePhotoFiles(await deleteItem(db, item.id));
          router.back();
        },
      },
    ]);
  }

  const meta = [item.era, item.brand, item.size, item.colour].filter(Boolean).join(' · ');

  return (
    <>
      <Stack.Screen
        options={{
          title: isCollection ? 'Collection' : 'Wishlist',
          headerBackTitle: 'Back',
          headerStyle: { backgroundColor: c.surface },
          headerTintColor: c.text,
        }}
      />
      <ScrollView
        contentInsetAdjustmentBehavior="automatic"
        automaticallyAdjustKeyboardInsets
        style={{ backgroundColor: c.background }}
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled">
        {photos.length > 0 ? (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.photos}>
            {photos.map((p) => (
              <Image
                key={p.id}
                source={{ uri: p.uri }}
                style={p.kind === 'label' ? styles.labelPhoto : styles.photo}
                accessibilityLabel={p.kind === 'label' ? 'Label photo' : 'Photo of the piece'}
              />
            ))}
          </ScrollView>
        ) : null}

        {error ? (
          <Text accessibilityRole="alert" style={[styles.body, { color: c.accent }]}>
            {error}
          </Text>
        ) : null}

        {draft ? (
          <View style={styles.stack}>
            <Field c={c} label="Name" value={draft.title} onChange={(v) => setDraft({ ...draft, title: v })} />
            <Field c={c} label="Brand" value={draft.brand} onChange={(v) => setDraft({ ...draft, brand: v })} />
            <Field c={c} label="Era" value={draft.era} onChange={(v) => setDraft({ ...draft, era: v })} />
            <Field c={c} label="Size" value={draft.size} onChange={(v) => setDraft({ ...draft, size: v })} />
            <Field
              c={c}
              label={isCollection ? 'Price paid ($)' : 'Target price ($)'}
              value={draft.price}
              keyboardType="decimal-pad"
              onChange={(v) => setDraft({ ...draft, price: v })}
            />
            {isCollection ? (
              <Field
                c={c}
                label="Where you bought it"
                value={draft.acquired_where}
                onChange={(v) => setDraft({ ...draft, acquired_where: v })}
              />
            ) : null}
            <Field
              c={c}
              label="Notes"
              value={draft.notes}
              multiline
              onChange={(v) => setDraft({ ...draft, notes: v })}
            />
            <Button label="Save" onPress={save} />
            <Button
              label="Cancel"
              variant="secondary"
              onPress={() => {
                setDraft(null);
                setError(null);
              }}
            />
          </View>
        ) : (
          <>
            <View style={styles.section}>
              <Text accessibilityRole="header" style={[styles.title, { color: c.text }]}>
                {item.title}
              </Text>
              {meta ? <Text style={[styles.body, { color: c.muted }]}>{meta}</Text> : null}
            </View>

            <Card c={c} title="Prices">
              {isCollection ? (
                <>
                  <Row c={c} label="You paid" value={item.price_paid != null ? formatCents(item.price_paid) : '—'} />
                  <Row c={c} label="Worth now (vintage)" value={formatRange(vintage)} />
                  {item.price_paid != null && vintage ? (
                    <Text style={[styles.small, { color: c.muted }]}>
                      {
                        {
                          'good-deal': 'You paid less than it usually sells for.',
                          fair: 'You paid about what it usually sells for.',
                          overpriced: 'You paid more than it usually sells for.',
                        }[priceVerdict(item.price_paid, vintage)]
                      }
                    </Text>
                  ) : null}
                </>
              ) : (
                <>
                  <Row c={c} label="Typical vintage price" value={formatRange(vintage)} />
                  <Row
                    c={c}
                    label="Your target"
                    value={item.target_price != null ? formatCents(item.target_price) : '—'}
                  />
                </>
              )}
              <Row c={c} label="New today" value={formatRange(newRange(item))} />
            </Card>

            {isCollection && (item.acquired_at || item.acquired_where) ? (
              <Card c={c} title="Bought">
                <Text style={[styles.body, { color: c.text }]}>
                  {[item.acquired_at, item.acquired_where].filter(Boolean).join(' · ')}
                </Text>
              </Card>
            ) : null}

            {item.notes ? (
              <Card c={c} title="Notes">
                <Text style={[styles.body, { color: c.text }]}>{item.notes}</Text>
              </Card>
            ) : null}

            {!isCollection ? (
              <Card c={c} title="Found it?">
                <TextInput
                  value={boughtPrice}
                  onChangeText={setBoughtPrice}
                  placeholder={
                    item.target_price != null
                      ? `Price paid (default ${formatCents(item.target_price)})`
                      : 'Price paid, e.g. 45'
                  }
                  placeholderTextColor={c.muted}
                  keyboardType="decimal-pad"
                  accessibilityLabel="Price you paid in dollars"
                  style={[styles.input, { color: c.text, borderColor: c.border }]}
                />
                <Button
                  label="I bought it"
                  accessibilityHint="Moves this piece from your wishlist to your collection"
                  onPress={bought}
                />
              </Card>
            ) : null}

            <View style={styles.stack}>
              <Button label="Edit" variant="secondary" onPress={() => setDraft(toDraft(item))} />
              <Button label="Delete" variant="secondary" onPress={confirmDelete} />
            </View>
          </>
        )}
      </ScrollView>
    </>
  );
}

function Field({
  c,
  label,
  value,
  onChange,
  keyboardType,
  multiline,
}: {
  c: Colors;
  label: string;
  value: string;
  onChange: (v: string) => void;
  keyboardType?: KeyboardTypeOptions;
  multiline?: boolean;
}) {
  return (
    <View style={styles.field}>
      <Text style={[styles.small, { color: c.muted }]}>{label}</Text>
      <TextInput
        value={value}
        onChangeText={onChange}
        accessibilityLabel={label}
        keyboardType={keyboardType}
        multiline={multiline}
        style={[
          styles.input,
          multiline && styles.multiline,
          { color: c.text, borderColor: c.border, backgroundColor: c.surface },
        ]}
      />
    </View>
  );
}

function Card({ c, title, children }: { c: Colors; title: string; children: React.ReactNode }) {
  return (
    <View style={[styles.card, { backgroundColor: c.surface, borderColor: c.border }]}>
      <Text accessibilityRole="header" style={[styles.cardTitle, { color: c.text }]}>
        {title}
      </Text>
      {children}
    </View>
  );
}

function Row({ c, label, value }: { c: Colors; label: string; value: string }) {
  return (
    <View style={styles.row} accessible accessibilityLabel={`${label}: ${value}`}>
      <Text style={[styles.body, { color: c.muted }]}>{label}</Text>
      <Text style={[styles.body, styles.bold, { color: c.text }]}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  content: { padding: 16, gap: 12 },
  stack: { gap: 12 },
  section: { gap: 6 },
  photos: { gap: 8 },
  photo: { width: 220, height: 280, borderRadius: 12 },
  labelPhoto: { width: 140, height: 280, borderRadius: 12 },
  title: { fontSize: 24, fontWeight: '700' },
  body: { fontSize: 16, lineHeight: 22 },
  small: { fontSize: 14 },
  bold: { fontWeight: '600' },
  card: { borderWidth: StyleSheet.hairlineWidth, borderRadius: 12, padding: 14, gap: 8 },
  cardTitle: { fontSize: 17, fontWeight: '600' },
  row: { flexDirection: 'row', justifyContent: 'space-between', gap: 12 },
  field: { gap: 4 },
  input: { borderWidth: 1, borderRadius: 10, padding: 12, fontSize: 16 },
  multiline: { minHeight: 96, textAlignVertical: 'top' },
});
