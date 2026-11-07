import { z } from 'zod';

import { CATEGORIES } from '@/db/types';

/** A price range in whole US dollars, as estimated by the scan service. */
const DollarRange = z.object({
  low: z.number().describe('Low end of the typical range, whole US dollars'),
  high: z.number().describe('High end of the typical range, whole US dollars'),
});

/**
 * What the scan service returns for one piece. Shared by the API route (as the
 * model's output format) and the app (to validate the response).
 */
export const ScanResultSchema = z.object({
  isClothing: z
    .boolean()
    .describe('False if the photo does not show a clothing item, shoes or accessory'),
  title: z.string().describe('Short buyer-friendly name, e.g. "Cable-knit fisherman sweater"'),
  category: z.enum(CATEGORIES),
  brand: z.string().nullable().describe('Brand only if readable on a label or clearly identifiable'),
  era: z.string().nullable().describe('Likely decade or range, e.g. "1990s" or "1970s–1980s"'),
  colour: z.string().nullable(),
  materials: z.array(z.string()).describe('Likely materials, e.g. ["wool"]'),
  newPrice: DollarRange.nullable().describe(
    'What a comparable new item costs today, or null if there is no sensible comparison',
  ),
  vintagePrice: DollarRange.nullable().describe(
    'Typical price for this piece in vintage shops and secondhand marketplaces',
  ),
  confidence: z.number().describe('0 to 1: how sure the identification and prices are'),
  summary: z.string().describe('One or two sentences on what this is and why it is priced so'),
  checks: z
    .array(z.string())
    .describe('Up to 5 things a buyer should inspect on THIS piece before paying'),
  searchQuery: z.string().describe('Search terms to find comparable sold listings'),
});

export type ScanResult = z.infer<typeof ScanResultSchema>;

/** A web page the scan service looked at, shown to the user as a source. */
export const SourceSchema = z.object({ title: z.string(), url: z.string() });
export type Source = z.infer<typeof SourceSchema>;

/** What `/api/scan` returns: the model's result plus any web sources it used. */
export const ScanResponseSchema = ScanResultSchema.extend({
  sources: z.array(SourceSchema).default([]),
});
export type ScanResponse = z.infer<typeof ScanResponseSchema>;

/** Request body sent by the app: one main photo and an optional label photo. */
export const ScanRequestSchema = z.object({
  photo: z.string().min(1).describe('Base64 JPEG of the piece'),
  labelPhoto: z.string().min(1).optional().describe('Base64 JPEG of the label or tag'),
});

export type ScanRequest = z.infer<typeof ScanRequestSchema>;

/** Tidy a model result: clamp confidence, order ranges, cap the checklist. */
export function normalizeScanResult(r: ScanResult): ScanResult {
  const order = (p: ScanResult['newPrice']) =>
    p ? { low: Math.max(0, Math.min(p.low, p.high)), high: Math.max(0, p.low, p.high) } : null;
  return {
    ...r,
    confidence: Math.min(1, Math.max(0, r.confidence)),
    newPrice: order(r.newPrice),
    vintagePrice: order(r.vintagePrice),
    checks: r.checks.slice(0, 5),
  };
}
