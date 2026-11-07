import type { SQLiteDatabase } from 'expo-sqlite';

import { rangeOf, sumRanges, type PriceRange } from '@/lib/money';
import type { ItemRow, ItemStatus, NewItem } from './types';

export function newId(): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

/** An item plus the URI of its main photo, for lists. */
export type ItemListRow = ItemRow & { photo_uri: string | null };

export type PhotoRow = { id: string; item_id: string; uri: string; kind: string; created_at: string };

export async function listItems(db: SQLiteDatabase, status: ItemStatus): Promise<ItemListRow[]> {
  return db.getAllAsync<ItemListRow>(
    `SELECT item.*,
       (SELECT uri FROM item_photo p WHERE p.item_id = item.id
        ORDER BY CASE p.kind WHEN 'main' THEN 0 ELSE 1 END, p.created_at LIMIT 1) AS photo_uri
     FROM item WHERE status = ? ORDER BY created_at DESC`,
    status,
  );
}

export async function getItem(db: SQLiteDatabase, id: string): Promise<ItemRow | null> {
  return db.getFirstAsync<ItemRow>('SELECT * FROM item WHERE id = ?', id);
}

export async function listPhotos(db: SQLiteDatabase, itemId: string): Promise<PhotoRow[]> {
  return db.getAllAsync<PhotoRow>(
    `SELECT * FROM item_photo WHERE item_id = ?
     ORDER BY CASE kind WHEN 'main' THEN 0 ELSE 1 END, created_at`,
    itemId,
  );
}

/** Fields a person can edit on the item screen. */
export const EDITABLE_FIELDS = [
  'title',
  'brand',
  'era',
  'colour',
  'size',
  'notes',
  'price_paid',
  'target_price',
  'acquired_at',
  'acquired_where',
] as const satisfies readonly (keyof ItemRow)[];

export type ItemPatch = Partial<Pick<ItemRow, (typeof EDITABLE_FIELDS)[number]>>;

/** Build the SQL for an update, using only editable columns. Pure, for testing. */
export function buildUpdate(id: string, patch: ItemPatch): { sql: string; params: (string | number | null)[] } | null {
  const keys = EDITABLE_FIELDS.filter((k) => k in patch);
  if (keys.length === 0) return null;
  return {
    sql: `UPDATE item SET ${keys.map((k) => `${k} = ?`).join(', ')} WHERE id = ?`,
    params: [...keys.map((k) => patch[k] ?? null), id],
  };
}

export async function updateItem(db: SQLiteDatabase, id: string, patch: ItemPatch): Promise<void> {
  const update = buildUpdate(id, patch);
  if (update) await db.runAsync(update.sql, update.params);
}

/** Move a wishlist piece into the collection once it has been bought. */
export async function markBought(
  db: SQLiteDatabase,
  id: string,
  pricePaid: number | null,
  today = new Date(),
): Promise<void> {
  await db.runAsync(
    `UPDATE item SET status = 'collection', price_paid = ?, target_price = NULL, acquired_at = ?
     WHERE id = ?`,
    pricePaid,
    today.toISOString().slice(0, 10),
    id,
  );
}

/** Delete an item and its photo rows. Returns the photo URIs so the files can be removed too. */
export async function deleteItem(db: SQLiteDatabase, id: string): Promise<string[]> {
  const photos = await listPhotos(db, id);
  await db.withTransactionAsync(async () => {
    await db.runAsync('DELETE FROM item_photo WHERE item_id = ?', id);
    await db.runAsync('DELETE FROM item WHERE id = ?', id);
  });
  return photos.map((p) => p.uri);
}

/** Categories that appear in a list, in a stable order, for filter chips. */
export function categoriesIn(items: Pick<ItemRow, 'category'>[]): ItemRow['category'][] {
  return [...new Set(items.map((i) => i.category))].sort();
}

export async function countItems(db: SQLiteDatabase): Promise<number> {
  const row = await db.getFirstAsync<{ n: number }>('SELECT COUNT(*) AS n FROM item');
  return row?.n ?? 0;
}

const COLUMNS = [
  'id',
  'status',
  'title',
  'category',
  'brand',
  'era',
  'colour',
  'size',
  'notes',
  'price_paid',
  'target_price',
  'new_low',
  'new_high',
  'vintage_low',
  'vintage_high',
  'confidence',
  'acquired_at',
  'acquired_where',
  'created_at',
] as const satisfies readonly (keyof ItemRow)[];

export async function insertItem(db: SQLiteDatabase, item: NewItem): Promise<string> {
  const row: ItemRow = {
    ...item,
    id: item.id ?? newId(),
    created_at: item.created_at ?? new Date().toISOString(),
  };
  await db.runAsync(
    `INSERT INTO item (${COLUMNS.join(', ')}) VALUES (${COLUMNS.map(() => '?').join(', ')})`,
    COLUMNS.map((c) => row[c]),
  );
  return row.id;
}

export function vintageRange(item: ItemRow): PriceRange | null {
  return rangeOf(item.vintage_low, item.vintage_high);
}

export function newRange(item: ItemRow): PriceRange | null {
  return rangeOf(item.new_low, item.new_high);
}

export type CollectionSummary = {
  count: number;
  paid: number;
  estimatedValue: PriceRange;
};

export function summarizeCollection(items: ItemRow[]): CollectionSummary {
  return {
    count: items.length,
    paid: items.reduce((sum, i) => sum + (i.price_paid ?? 0), 0),
    estimatedValue: sumRanges(items.map(vintageRange)),
  };
}

/**
 * Estimated cost of a wishlist: the target price when set (as an exact
 * amount), otherwise the typical vintage range.
 */
export function wishlistTotal(items: ItemRow[]): PriceRange {
  return sumRanges(
    items.map((i) =>
      i.target_price != null ? { low: i.target_price, high: i.target_price } : vintageRange(i),
    ),
  );
}
