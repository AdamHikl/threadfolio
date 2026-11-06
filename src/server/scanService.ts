/**
 * Server-only scan logic. Imported only from API routes (`+api.ts`), so it and
 * the API key never reach the app bundle.
 */
import Anthropic from '@anthropic-ai/sdk';
import { zodOutputFormat } from '@anthropic-ai/sdk/helpers/zod';

import { MOCK_SCAN_RESULT } from '@/scan/mock';
import {
  normalizeScanResult,
  ScanResultSchema,
  type ScanRequest,
  type ScanResult,
} from '@/scan/schema';

export class ScanError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message);
  }
}

const SYSTEM_PROMPT = `You help people who buy vintage and secondhand clothing to wear and collect.
They are standing in a shop or market and want to know what a piece is, whether the asking price is fair, and what to inspect before paying.

From the photo (and the label photo, if given):
- Identify the item, its likely era and brand. Only name a brand you can read on a label or identify with real confidence; otherwise use null.
- Estimate what a comparable NEW item costs today, and the typical price range for this piece in vintage shops and secondhand marketplaces, in whole US dollars. Give honest ranges and lower your confidence when the photo is unclear.
- List up to five things the buyer should check on this specific piece (condition, authenticity, fit). Be concrete and short.
- Write a short search query someone could use to find comparable sold listings.
If the photo doesn't show clothing, shoes or an accessory, set isClothing to false and keep other fields minimal.`;

type Provider = 'anthropic' | 'mock';

function provider(): Provider {
  const chosen = process.env.SCAN_PROVIDER;
  if (chosen === 'anthropic' || chosen === 'mock') return chosen;
  return process.env.ANTHROPIC_API_KEY ? 'anthropic' : 'mock';
}

let client: Anthropic | null = null;

async function scanWithClaude(req: ScanRequest): Promise<ScanResult> {
  client ??= new Anthropic();
  const images: Anthropic.ImageBlockParam[] = [req.photo, req.labelPhoto]
    .filter((p): p is string => Boolean(p))
    .map((data) => ({
      type: 'image',
      source: { type: 'base64', media_type: 'image/jpeg', data },
    }));

  const response = await client.messages.parse({
    model: process.env.SCAN_MODEL ?? 'claude-opus-5-5',
    max_tokens: 16000,
    system: SYSTEM_PROMPT,
    output_config: { effort: 'medium', format: zodOutputFormat(ScanResultSchema) },
    messages: [
      {
        role: 'user',
        content: [
          ...images,
          {
            type: 'text',
            text: req.labelPhoto
              ? 'The first photo is the piece; the second is its label or tag.'
              : 'Here is the piece.',
          },
        ],
      },
    ],
  });

  if (response.stop_reason === 'refusal') {
    throw new ScanError('This photo could not be analysed. Try another photo.', 422);
  }
  if (!response.parsed_output) {
    throw new ScanError('The scan did not return a usable result. Please try again.', 502);
  }
  return response.parsed_output;
}

export async function runScan(req: ScanRequest): Promise<ScanResult> {
  const result = provider() === 'anthropic' ? await scanWithClaude(req) : MOCK_SCAN_RESULT;
  return normalizeScanResult(result);
}
