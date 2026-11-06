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

/** Convert a whole-dollar range (as returned by the scan service) to cents. */
export function dollarsToCents(range: PriceRange | null): PriceRange | null {
  return range ? { low: Math.round(range.low * 100), high: Math.round(range.high * 100) } : null;
}

/**
 * Parse what the user typed as a price ("45", "$45", "45.50") into cents.
 * Returns null for empty or invalid input.
 */
export function parsePriceInput(text: string): number | null {
  const cleaned = text.replace(/[$,\s]/g, '');
  if (!/^\d+(\.\d{0,2})?$/.test(cleaned)) return null;
  return Math.round(Number(cleaned) * 100);
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
