/** Money is stored as integer cents in a single currency (USD for now). */

export type PriceRange = { low: number; high: number };

/** Sum a list of optional ranges; items without a range are skipped. */
export function sumRanges(ranges: (PriceRange | null | undefined)[]): PriceRange {
  return ranges.reduce<PriceRange>(
    (acc, r) => (r ? { low: acc.low + r.low, high: acc.high + r.high } : acc),
    { low: 0, high: 0 },
  );
}

/** Build a range from nullable columns; returns null unless both ends are set. */
export function rangeOf(low: number | null, high: number | null): PriceRange | null {
  if (low == null || high == null) return null;
  return low <= high ? { low, high } : { low: high, high: low };
}

export function formatCents(cents: number, currency = 'USD'): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    maximumFractionDigits: 0,
  }).format(Math.round(cents / 100));
}

export function formatRange(range: PriceRange | null, currency = 'USD'): string {
  if (!range) return '—';
  if (range.low === range.high) return formatCents(range.low, currency);
  return `${formatCents(range.low, currency)}–${formatCents(range.high, currency)}`;
}

export type PriceVerdict = 'good-deal' | 'fair' | 'overpriced';

/**
 * Compare a shop's asking price with the typical vintage range.
 * Below the range is a good deal, inside it is fair, above it is overpriced.
 */
export function priceVerdict(asking: number, vintage: PriceRange): PriceVerdict {
  if (asking < vintage.low) return 'good-deal';
  if (asking > vintage.high) return 'overpriced';
  return 'fair';
}
