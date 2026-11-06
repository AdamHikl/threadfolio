import type { SQLiteDatabase } from 'expo-sqlite';

import { countItems, insertItem } from './items';
import type { NewItem } from './types';

/**
 * Made-up sample pieces for development builds only. No real people, shops
 * or purchases. Prices are integer cents.
 */
export const SAMPLE_ITEMS: NewItem[] = [
  {
    status: 'collection',
    title: 'Faded straight-leg jeans',
    category: 'denim',
    brand: 'Sample Denim Co.',
    era: '1990s',
    colour: 'light wash',
    size: 'W30 L32',
    notes: 'Single-stitch back pockets. Small repair on the knee.',
    price_paid: 4500,
    target_price: null,
    new_low: 6000,
    new_high: 9000,
    vintage_low: 4000,
    vintage_high: 8000,
    confidence: 0.7,
    acquired_at: '2026-09-14',
    acquired_where: 'Sunday flea market',
  },
  {
    status: 'collection',
    title: 'Cable-knit fisherman sweater',
    category: 'knitwear',
    brand: null,
    era: '1980s',
    colour: 'cream',
    size: 'M',
    notes: 'Pure wool, no moth holes.',
    price_paid: 3800,
    target_price: null,
    new_low: 9000,
    new_high: 15000,
    vintage_low: 3500,
    vintage_high: 6500,
    confidence: 0.6,
    acquired_at: '2026-10-02',
    acquired_where: 'Charity shop',
  },
  {
    status: 'collection',
    title: 'Suede trucker jacket',
    category: 'outerwear',
    brand: 'Sample Leathers',
    era: '1970s',
    colour: 'tan',
    size: 'L',
    notes: 'Original snaps. Light wear on cuffs.',
    price_paid: 12000,
    target_price: null,
    new_low: 25000,
    new_high: 40000,
    vintage_low: 10000,
    vintage_high: 18000,
    confidence: 0.55,
    acquired_at: '2026-10-20',
    acquired_where: 'Vintage shop',
  },
  {
    status: 'wishlist',
    title: 'Chore coat in duck canvas',
    category: 'outerwear',
    brand: null,
    era: '1960s–1970s',
    colour: 'navy',
    size: 'M',
    notes: 'Blanket lining preferred.',
    price_paid: null,
    target_price: 9000,
    new_low: null,
    new_high: null,
    vintage_low: 8000,
    vintage_high: 16000,
    confidence: 0.5,
    acquired_at: null,
    acquired_where: null,
  },
  {
    status: 'wishlist',
    title: 'Tour tee, single-stitch',
    category: 'tees',
    brand: null,
    era: '1990s',
    colour: 'black',
    size: 'L',
    notes: 'Check for reprint signs.',
    price_paid: null,
    target_price: null,
    new_low: null,
    new_high: null,
    vintage_low: 4000,
    vintage_high: 12000,
    confidence: 0.4,
    acquired_at: null,
    acquired_where: null,
  },
];

/** Insert the sample pieces into an empty database. Returns how many were added. */
export async function seedSampleDataIfEmpty(db: SQLiteDatabase): Promise<number> {
  if ((await countItems(db)) > 0) return 0;
  await db.withTransactionAsync(async () => {
    for (const item of SAMPLE_ITEMS) await insertItem(db, item);
  });
  return SAMPLE_ITEMS.length;
}
