import { Directory, File, Paths } from 'expo-file-system';
import type { SQLiteDatabase } from 'expo-sqlite';

import { dollarsToCents } from '@/lib/money';
import type { ScanResult } from '@/scan/schema';
import { insertItem, newId } from './items';
import type { ItemStatus, NewItem } from './types';

/** Build the database row for a scanned piece. Pure, so it can be unit tested. */
export function itemFromScan(
  result: ScanResult,
  status: ItemStatus,
  tagPrice: number | null,
  today = new Date(),
): NewItem {
  const newRange = dollarsToCents(result.newPrice);
  const vintageRange = dollarsToCents(result.vintagePrice);
  const notes = [result.summary, result.materials.length ? `Materials: ${result.materials.join(', ')}` : null]
    .filter(Boolean)
    .join('\n');
  return {
    status,
    title: result.title,
    category: result.category,
    brand: result.brand,
    era: result.era,
    colour: result.colour,
    size: null,
    notes: notes || null,
    price_paid: status === 'collection' ? tagPrice : null,
    target_price: status === 'wishlist' ? tagPrice : null,
    new_low: newRange?.low ?? null,
    new_high: newRange?.high ?? null,
    vintage_low: vintageRange?.low ?? null,
    vintage_high: vintageRange?.high ?? null,
    confidence: result.confidence,
    acquired_at: status === 'collection' ? today.toISOString().slice(0, 10) : null,
    acquired_where: null,
  };
}

/** Copy a temporary photo into the app's permanent photo folder. */
async function keepPhoto(uri: string): Promise<string> {
  const dir = new Directory(Paths.document, 'photos');
  if (!dir.exists) dir.create();
  const dest = new File(dir, `${newId()}.jpg`);
  await new File(uri).copy(dest);
  return dest.uri;
}

export async function saveScannedItem(
  db: SQLiteDatabase,
  result: ScanResult,
  status: ItemStatus,
  tagPrice: number | null,
  photos: { main: string; label?: string },
): Promise<string> {
  const kept = {
    main: await keepPhoto(photos.main),
    label: photos.label ? await keepPhoto(photos.label) : null,
  };
  const now = new Date().toISOString();
  let itemId = '';
  await db.withTransactionAsync(async () => {
    itemId = await insertItem(db, itemFromScan(result, status, tagPrice));
    for (const [kind, uri] of [
      ['main', kept.main],
      ['label', kept.label],
    ] as const) {
      if (!uri) continue;
      await db.runAsync(
        'INSERT INTO item_photo (id, item_id, uri, kind, created_at) VALUES (?, ?, ?, ?, ?)',
        newId(),
        itemId,
        uri,
        kind,
        now,
      );
    }
  });
  return itemId;
}
