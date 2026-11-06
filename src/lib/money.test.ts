import { describe, expect, it } from '@jest/globals';

import { formatCents, formatRange, priceVerdict, rangeOf, sumRanges } from './money';

describe('rangeOf', () => {
  it('returns null unless both ends are set', () => {
    expect(rangeOf(null, 100)).toBeNull();
    expect(rangeOf(100, null)).toBeNull();
  });

  it('orders a reversed range', () => {
    expect(rangeOf(500, 100)).toEqual({ low: 100, high: 500 });
  });
});

describe('sumRanges', () => {
  it('adds ranges and skips missing ones', () => {
    expect(sumRanges([{ low: 100, high: 200 }, null, { low: 50, high: 75 }])).toEqual({
      low: 150,
      high: 275,
    });
  });

  it('is zero for an empty list', () => {
    expect(sumRanges([])).toEqual({ low: 0, high: 0 });
  });
});

describe('formatting', () => {
  it('formats whole dollars', () => {
    expect(formatCents(4500)).toBe('$45');
  });

  it('formats a range, a single value and a missing range', () => {
    expect(formatRange({ low: 4000, high: 8000 })).toBe('$40–$80');
    expect(formatRange({ low: 9000, high: 9000 })).toBe('$90');
    expect(formatRange(null)).toBe('—');
  });
});

describe('priceVerdict', () => {
  const vintage = { low: 4000, high: 8000 };

  it('is a good deal below the typical range', () => {
    expect(priceVerdict(3000, vintage)).toBe('good-deal');
  });

  it('is fair inside the range, including the edges', () => {
    expect(priceVerdict(4000, vintage)).toBe('fair');
    expect(priceVerdict(8000, vintage)).toBe('fair');
  });

  it('is overpriced above the range', () => {
    expect(priceVerdict(9000, vintage)).toBe('overpriced');
  });
});
