import { describe, expect, it, jest } from '@jest/globals';

import { MOCK_SCAN_RESULT } from '@/scan/mock';

// The file system is only used when saving photos, not by itemFromScan.
jest.mock('expo-file-system', () => ({}));

// eslint-disable-next-line import/first
import { itemFromScan } from './saveScan';

const today = new Date('2026-11-06T12:00:00Z');

describe('itemFromScan', () => {
  it('records the tag price as the price paid for a purchase', () => {
    const item = itemFromScan(MOCK_SCAN_RESULT, 'collection', 12000, today);
    expect(item).toMatchObject({
      status: 'collection',
      title: MOCK_SCAN_RESULT.title,
      price_paid: 12000,
      target_price: null,
      new_low: 25000,
      new_high: 45000,
      vintage_low: 9000,
      vintage_high: 18000,
      acquired_at: '2026-11-06',
    });
    expect(item.notes).toContain('Materials: wool, leather');
  });

  it('records the tag price as the target price for a wishlist piece', () => {
    const item = itemFromScan(MOCK_SCAN_RESULT, 'wishlist', 9000, today);
    expect(item).toMatchObject({ price_paid: null, target_price: 9000, acquired_at: null });
  });

  it('leaves prices empty when the scan has no ranges', () => {
    const item = itemFromScan({ ...MOCK_SCAN_RESULT, newPrice: null, vintagePrice: null }, 'wishlist', null, today);
    expect(item).toMatchObject({ new_low: null, vintage_high: null, target_price: null });
  });
});
