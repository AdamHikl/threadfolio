import type { ScanResult } from './schema';

/**
 * A made-up scan result returned when no AI provider is configured, so the
 * whole scan flow can be developed and demoed without an API key.
 */
export const MOCK_SCAN_RESULT: ScanResult = {
  isClothing: true,
  title: 'Wool varsity jacket with leather sleeves',
  category: 'outerwear',
  brand: null,
  era: '1980s',
  colour: 'navy and cream',
  materials: ['wool', 'leather'],
  newPrice: { low: 250, high: 450 },
  vintagePrice: { low: 90, high: 180 },
  confidence: 0.5,
  summary:
    'Sample result (no AI provider configured). Varsity jackets from this era are popular; condition of the leather drives the price.',
  checks: [
    'Check the leather sleeves for cracking at the elbows.',
    'Look for chenille patches that are loose or moth-eaten.',
  ],
  searchQuery: 'vintage 80s wool leather varsity jacket',
};
