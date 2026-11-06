import { useState } from 'react';
import { Linking, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import {
  dollarsToCents,
  formatRange,
  parsePriceInput,
  priceVerdict,
  type PriceVerdict,
} from '@/lib/money';
import { buildChecklist } from '@/scan/checklist';
import { priceCheckLinks } from '@/scan/links';
import type { ScanResult } from '@/scan/schema';
import { useColors, type Colors } from '@/theme/colors';
import { Button } from './Button';

type Props = {
  result: ScanResult;
  saving: boolean;
  onSave: (status: 'collection' | 'wishlist', tagPrice: number | null) => void;
  onReset: () => void;
};

const VERDICT_TEXT: Record<PriceVerdict, string> = {
  'good-deal': 'Good deal',
  fair: 'Fair price',
  overpriced: 'Overpriced',
};

function confidenceLabel(confidence: number): string {
  if (confidence >= 0.75) return 'High confidence';
  if (confidence >= 0.45) return 'Medium confidence';
  return 'Low confidence: double-check before buying';
}

export function ScanResultView({ result, saving, onSave, onReset }: Props) {
  const c = useColors();
  const [tagText, setTagText] = useState('');
  const [checked, setChecked] = useState<Set<number>>(new Set());

  const tagPrice = parsePriceInput(tagText);
  const vintage = dollarsToCents(result.vintagePrice);
  const verdict = tagPrice != null && vintage ? priceVerdict(tagPrice, vintage) : null;
  const checklist = buildChecklist(result.category, result.checks);
  const meta = [result.era, result.brand, result.materials.join(', ')].filter(Boolean).join(' · ');

  if (!result.isClothing) {
    return (
      <View style={styles.section}>
        <Text style={[styles.title, { color: c.text }]}>That doesn&apos;t look like clothing</Text>
        <Text style={[styles.body, { color: c.muted }]}>
          Try a clear photo of the whole piece in good light.
        </Text>
        <Button label="Try again" onPress={onReset} />
      </View>
    );
  }

  return (
    <View style={styles.stack}>
      <View style={styles.section}>
        <Text accessibilityRole="header" style={[styles.title, { color: c.text }]}>
          {result.title}
        </Text>
        {meta ? <Text style={[styles.body, { color: c.muted }]}>{meta}</Text> : null}
        <Text style={[styles.small, { color: c.muted }]}>{confidenceLabel(result.confidence)}</Text>
        <Text style={[styles.body, { color: c.text }]}>{result.summary}</Text>
      </View>

      <Card c={c} title="Prices">
        <Row c={c} label="New today" value={formatRange(dollarsToCents(result.newPrice))} />
        <Row c={c} label="In vintage shops" value={formatRange(vintage)} />
        <Text style={[styles.small, { color: c.muted }]}>Estimates. Check real sold prices below.</Text>
      </Card>

      <Card c={c} title="Is the price fair?">
        <TextInput
          value={tagText}
          onChangeText={setTagText}
          placeholder="Price on the tag, e.g. 45"
          placeholderTextColor={c.muted}
          keyboardType="decimal-pad"
          accessibilityLabel="Price on the tag in dollars"
          style={[styles.input, { color: c.text, borderColor: c.border }]}
        />
        {verdict ? (
          <Text
            accessibilityLiveRegion="polite"
            style={[styles.verdict, { color: verdict === 'overpriced' ? c.accent : c.text }]}>
            {VERDICT_TEXT[verdict]}
          </Text>
        ) : tagText && tagPrice == null ? (
          <Text style={[styles.small, { color: c.muted }]}>Enter a number like 45 or 45.50.</Text>
        ) : null}
      </Card>

      <Card c={c} title="Before you buy">
        {checklist.map((item, i) => {
          const done = checked.has(i);
          return (
            <Pressable
              key={item}
              accessibilityRole="checkbox"
              accessibilityState={{ checked: done }}
              onPress={() =>
                setChecked((prev) => {
                  const next = new Set(prev);
                  if (next.has(i)) next.delete(i);
                  else next.add(i);
                  return next;
                })
              }
              style={styles.checkRow}>
              <Text style={[styles.checkBox, { color: c.accent }]}>{done ? '☑' : '☐'}</Text>
              <Text style={[styles.body, styles.flex, { color: c.text }]}>{item}</Text>
            </Pressable>
          );
        })}
      </Card>

      <Card c={c} title="Check real prices">
        {priceCheckLinks(result.searchQuery).map((link) => (
          <Pressable
            key={link.url}
            accessibilityRole="link"
            onPress={() => Linking.openURL(link.url)}
            style={styles.linkRow}>
            <Text style={[styles.body, { color: c.accent }]}>{link.label} ↗</Text>
          </Pressable>
        ))}
      </Card>

      <View style={styles.stack}>
        <Button
          label="I bought it"
          disabled={saving}
          accessibilityHint="Saves to your collection, using the tag price as the price paid"
          onPress={() => onSave('collection', tagPrice)}
        />
        <Button
          label="Add to wishlist"
          variant="secondary"
          disabled={saving}
          accessibilityHint="Saves to your wishlist, using the tag price as your target price"
          onPress={() => onSave('wishlist', tagPrice)}
        />
        <Button label="Scan another piece" variant="secondary" onPress={onReset} />
      </View>
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
  stack: { gap: 12 },
  flex: { flex: 1 },
  section: { gap: 6 },
  title: { fontSize: 22, fontWeight: '700' },
  body: { fontSize: 16, lineHeight: 22 },
  small: { fontSize: 14 },
  bold: { fontWeight: '600' },
  card: { borderWidth: StyleSheet.hairlineWidth, borderRadius: 12, padding: 14, gap: 8 },
  cardTitle: { fontSize: 17, fontWeight: '600' },
  row: { flexDirection: 'row', justifyContent: 'space-between', gap: 12 },
  input: { borderWidth: 1, borderRadius: 10, padding: 12, fontSize: 16 },
  verdict: { fontSize: 18, fontWeight: '700' },
  checkRow: { flexDirection: 'row', gap: 10, alignItems: 'flex-start', minHeight: 44, paddingVertical: 4 },
  checkBox: { fontSize: 20, lineHeight: 22 },
  linkRow: { minHeight: 44, justifyContent: 'center' },
});
