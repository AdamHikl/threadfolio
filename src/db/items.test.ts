import { describe, expect, it } from '@jest/globals';

import { buildUpdate, categoriesIn, summarizeCollection, wishlistTotal } from './items';
import { SAMPLE_ITEMS } from './sampleData';
import type { ItemRow, NewItem } from './types';

function row(item: NewItem, i: number): ItemRow {
  return { ...item, id: `id-${i}`, created_at: '2026-11-06T00:00:00.000Z' };
}

const collection = SAMPLE_ITEMS.filter((i) => i.status === 'collection').map(row);
const wishlist = SAMPLE_ITEMS.filter((i) => i.status === 'wishlist').map(row);

describe('summarizeCollection', () => {
  it('totals what was paid and the estimated vintage value', () => {
    expect(summarizeCollection(collection)).toEqual({
      count: 3,
      paid: 4500 + 3800 + 12000,
      estimatedValue: { low: 4000 + 3500 + 10000, high: 8000 + 6500 + 18000 },
    });
  });

  it('handles an empty collection', () => {
    expect(summarizeCollection([])).toEqual({
      count: 0,
      paid: 0,
      estimatedValue: { low: 0, high: 0 },
    });
  });
});

describe('wishlistTotal', () => {
  it('uses the target price when set, otherwise the typical vintage range', () => {
    // Chore coat has a $90 target; tour tee falls back to $40–$120.
    expect(wishlistTotal(wishlist)).toEqual({ low: 9000 + 4000, high: 9000 + 12000 });
  });
});

describe('sample data', () => {
  it('has a valid vintage range for every piece', () => {
    for (const item of SAMPLE_ITEMS) {
      expect(item.vintage_low).not.toBeNull();
      expect(item.vintage_low!).toBeLessThanOrEqual(item.vintage_high!);
    }
  });
});

describe('buildUpdate', () => {
  it('only updates editable columns, in a fixed order', () => {
    const update = buildUpdate('abc', {
      notes: 'Mended cuff',
      title: 'Jeans',
      // @ts-expect-error status is not editable here
      status: 'wishlist',
    });
    expect(update).toEqual({
      sql: 'UPDATE item SET title = ?, notes = ? WHERE id = ?',
      params: ['Jeans', 'Mended cuff', 'abc'],
    });
  });

  it('writes null for cleared fields and skips empty patches', () => {
    expect(buildUpdate('abc', { brand: null })?.params).toEqual([null, 'abc']);
    expect(buildUpdate('abc', {})).toBeNull();
  });
});

describe('categoriesIn', () => {
  it('lists each category once, sorted', () => {
    expect(categoriesIn([{ category: 'tees' }, { category: 'denim' }, { category: 'tees' }])).toEqual([
      'denim',
      'tees',
    ]);
  });
});
