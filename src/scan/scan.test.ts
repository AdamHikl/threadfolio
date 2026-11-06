import { describe, expect, it } from '@jest/globals';

import { buildChecklist } from './checklist';
import { priceCheckLinks } from './links';
import { MOCK_SCAN_RESULT } from './mock';
import { normalizeScanResult, ScanResultSchema } from './schema';

describe('buildChecklist', () => {
  it('puts piece-specific checks first, then category and general checks', () => {
    const list = buildChecklist('tees', ['Check the band name spelling.']);
    expect(list[0]).toBe('Check the band name spelling.');
    expect(list.some((c) => c.includes('single-stitch'))).toBe(true);
    expect(list.some((c) => c.includes('Smell it'))).toBe(true);
  });

  it('removes duplicates ignoring case and spaces', () => {
    const list = buildChecklist('skirts', ['  smell it: mildew and smoke are hard to remove. ']);
    expect(list.filter((c) => c.toLowerCase().startsWith('smell it'))).toHaveLength(1);
  });

  it('falls back to general checks for categories without curated rules', () => {
    expect(buildChecklist('skirts')).toHaveLength(4);
  });
});

describe('priceCheckLinks', () => {
  it('encodes the query into each marketplace search', () => {
    const links = priceCheckLinks('90s tour tee & jacket');
    expect(links).toHaveLength(3);
    expect(links[0].url).toContain('_nkw=90s%20tour%20tee%20%26%20jacket');
    expect(links[0].url).toContain('LH_Sold=1');
  });

  it('returns nothing for an empty query', () => {
    expect(priceCheckLinks('   ')).toEqual([]);
  });
});

describe('scan result', () => {
  it('accepts the mock result', () => {
    expect(ScanResultSchema.parse(MOCK_SCAN_RESULT)).toEqual(MOCK_SCAN_RESULT);
  });

  it('normalizes confidence, reversed ranges and long checklists', () => {
    const r = normalizeScanResult({
      ...MOCK_SCAN_RESULT,
      confidence: 1.4,
      vintagePrice: { low: 80, high: 40 },
      checks: ['a', 'b', 'c', 'd', 'e', 'f'],
    });
    expect(r.confidence).toBe(1);
    expect(r.vintagePrice).toEqual({ low: 40, high: 80 });
    expect(r.checks).toHaveLength(5);
  });
});
