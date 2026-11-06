import { describe, expect, it } from '@jest/globals';

import {
  dollarsToCents,
  formatCents,
  formatRange,
  parsePriceInput,
  priceVerdict,
  rangeOf,
  sumRanges,
} from './money';

describe('parsePriceInput', () => {
  it('accepts plain, dollar-sign and decimal prices', () => {
    expect(parsePriceInput('45')).toBe(4500);
    expect(parsePriceInput(' $1,200 ')).toBe(120000);
    expect(parsePriceInput('45.5')).toBe(4550);
  });

  it('rejects empty and invalid input', () => {
    expect(parsePriceInput('')).toBeNull();
    expect(parsePriceInput('abc')).toBeNull();
    expect(parsePriceInput('4.555')).toBeNull();
    expect(parsePriceInput('-5')).toBeNull();
  });
});

describe('dollarsToCents', () => {
  it('converts a range and passes null through', () => {
    expect(dollarsToCents({ low: 90, high: 180 })).toEqual({ low: 9000, high: 18000 });
    expect(dollarsToCents(null)).toBeNull();
  });
});

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
