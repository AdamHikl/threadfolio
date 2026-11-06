import type { SQLiteDatabase } from 'expo-sqlite';

import { rangeOf, sumRanges, type PriceRange } from '@/lib/money';
import type { ItemRow, ItemStatus, NewItem } from './types';

export function newId(): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

export async function listItems(db: SQLiteDatabase, status: ItemStatus): Promise<ItemRow[]> {
  return db.getAllAsync<ItemRow>(
    'SELECT * FROM item WHERE status = ? ORDER BY created_at DESC',
    status,
  );
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
