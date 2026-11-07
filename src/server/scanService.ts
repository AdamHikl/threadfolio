/**
 * Server-only scan logic. Imported only from API routes (`+api.ts`) and dev
 * scripts, so it and the API key never reach the app bundle.
 */
import Anthropic from '@anthropic-ai/sdk';
import { zodOutputFormat } from '@anthropic-ai/sdk/helpers/zod';

import { MOCK_SCAN_RESULT } from '@/scan/mock';
import {
  normalizeScanResult,
  ScanResultSchema,
  type ScanRequest,
  type ScanResponse,
  type ScanResult,
  type Source,
} from '@/scan/schema';

export class ScanError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message);
  }
}

export const DEFAULT_MODEL = 'claude-opus-5-5';

const SYSTEM_PROMPT = `You help people who buy vintage and secondhand clothing to wear and collect.
They are standing in a shop or market and want to know what a piece is, whether the asking price is fair, and what to inspect before paying.

From the photo (and the label photo, if given):
- Identify the item, its likely era and brand. Only name a brand you can read on a label or identify with real confidence; otherwise use null.
- Estimate what a comparable NEW item costs today, and the typical price range for this piece in vintage shops and secondhand marketplaces, in whole US dollars. Give honest ranges and lower your confidence when the photo is unclear.
- List up to five things the buyer should check on this specific piece (condition, authenticity, fit). Be concrete and short.
- Write a short search query someone could use to find comparable sold listings.
If the photo doesn't show clothing, shoes or an accessory, set isClothing to false and keep other fields minimal.`;

const SEARCH_INSTRUCTIONS = `
You have a web_search tool. Before answering, run up to 3 focused searches to ground your prices and checks in current evidence: recent sold or listed prices for comparable pieces (eBay sold listings, Etsy, Depop, Grailed, vintage shops) and, if useful, collector guidance on dating or authenticating this kind of item (Reddit, blogs, brand histories). Prefer recent sold prices over asking prices. Skip searching if the photo isn't clothing.
When you are done, call the submit_scan tool exactly once with your final answer. Do not write the answer as text.`;

const resultFormat = zodOutputFormat(ScanResultSchema);

const SUBMIT_TOOL: Anthropic.Tool = {
  name: 'submit_scan',
  description: 'Submit the final identification, price ranges and buyer checks for the photographed piece.',
  strict: true,
  input_schema: resultFormat.schema as Anthropic.Tool.InputSchema,
};

export type ScanOptions = {
  /** Claude model id; defaults to SCAN_MODEL or claude-opus-5-5. */
  model?: string;
  /** Let the model search the web for prices and buying guidance. */
  webSearch?: boolean;
};

export type ScanRun = {
  response: ScanResponse;
  model: string;
  webSearch: boolean;
  durationMs: number;
  inputTokens: number;
  outputTokens: number;
  searches: number;
};

type Provider = 'anthropic' | 'mock';

function provider(): Provider {
  const chosen = process.env.SCAN_PROVIDER;
  if (chosen === 'anthropic' || chosen === 'mock') return chosen;
  return process.env.ANTHROPIC_API_KEY ? 'anthropic' : 'mock';
}

let client: Anthropic | null = null;
function getClient(): Anthropic {
  client ??= new Anthropic();
  return client;
}

function userContent(req: ScanRequest): Anthropic.ContentBlockParam[] {
  const images: Anthropic.ImageBlockParam[] = [req.photo, req.labelPhoto]
    .filter((p): p is string => Boolean(p))
    .map((data) => ({ type: 'image', source: { type: 'base64', media_type: 'image/jpeg', data } }));
  return [
    ...images,
    {
      type: 'text',
      text: req.labelPhoto
        ? 'The first photo is the piece; the second is its label or tag.'
        : 'Here is the piece.',
    },
  ];
}

type Usage = { inputTokens: number; outputTokens: number; searches: number };

function addUsage(total: Usage, usage: Anthropic.Usage) {
  total.inputTokens +=
    usage.input_tokens + (usage.cache_creation_input_tokens ?? 0) + (usage.cache_read_input_tokens ?? 0);
  total.outputTokens += usage.output_tokens;
  total.searches += usage.server_tool_use?.web_search_requests ?? 0;
}

/** One structured-output call, no tools. Fast and cheapest. */
async function scanPlain(req: ScanRequest, model: string, usage: Usage): Promise<ScanResponse> {
  const response = await getClient().messages.parse({
    model,
    max_tokens: 16000,
    system: SYSTEM_PROMPT,
    output_config: { effort: 'medium', format: resultFormat },
    messages: [{ role: 'user', content: userContent(req) }],
  });
  addUsage(usage, response.usage);
  if (response.stop_reason === 'refusal') {
    throw new ScanError('This photo could not be analysed. Try another photo.', 422);
  }
  if (!response.parsed_output) {
    throw new ScanError('The scan did not return a usable result. Please try again.', 502);
  }
  return { ...response.parsed_output, sources: [] };
}

function collectSources(content: Anthropic.ContentBlock[], into: Map<string, Source>) {
  for (const block of content) {
    if (block.type === 'web_search_tool_result' && Array.isArray(block.content)) {
      for (const r of block.content) {
        if (!into.has(r.url)) into.set(r.url, { title: r.title, url: r.url });
      }
    }
  }
}

/**
 * Web-search-backed scan. Web search always returns citations, which can't be
 * combined with structured output, so the final answer comes back through a
 * strict `submit_scan` tool instead.
 */
async function scanWithSearch(req: ScanRequest, model: string, usage: Usage): Promise<ScanResponse> {
  const messages: Anthropic.MessageParam[] = [{ role: 'user', content: userContent(req) }];
  const sources = new Map<string, Source>();

  for (let round = 0; round < 4; round++) {
    const response = await getClient().messages.create({
      model,
      max_tokens: 16000,
      system: SYSTEM_PROMPT + SEARCH_INSTRUCTIONS,
      output_config: { effort: 'medium' },
      tools: [
        { type: 'web_search_20260318', name: 'web_search', max_uses: 3, allowed_callers: ['direct'] },
        SUBMIT_TOOL,
      ],
      tool_choice: { type: 'auto' },
      messages,
    });
    addUsage(usage, response.usage);
    collectSources(response.content, sources);

    if (response.stop_reason === 'refusal') {
      throw new ScanError('This photo could not be analysed. Try another photo.', 422);
    }

    const submit = response.content.find(
      (b): b is Anthropic.ToolUseBlock => b.type === 'tool_use' && b.name === 'submit_scan',
    );
    if (submit) {
      const parsed = ScanResultSchema.safeParse(submit.input);
      if (!parsed.success) {
        throw new ScanError('The scan did not return a usable result. Please try again.', 502);
      }
      return { ...parsed.data, sources: [...sources.values()].slice(0, 6) };
    }

    // Send the assistant turn back unchanged (search results and thinking included).
    messages.push({ role: 'assistant', content: response.content });
    if (response.stop_reason !== 'pause_turn') {
      messages.push({
        role: 'user',
        content: 'Now call submit_scan with your final answer.',
      });
    }
  }
  throw new ScanError('The scan took too long. Please try again.', 504);
}

export async function runScan(req: ScanRequest, options: ScanOptions = {}): Promise<ScanRun> {
  const model = options.model ?? process.env.SCAN_MODEL ?? DEFAULT_MODEL;
  const webSearch = options.webSearch ?? process.env.SCAN_WEB_SEARCH === 'true';
  const started = Date.now();
  const usage: Usage = { inputTokens: 0, outputTokens: 0, searches: 0 };

  let response: ScanResponse;
  if (provider() === 'mock') {
    response = { ...MOCK_SCAN_RESULT, sources: [] };
  } else {
    response = webSearch
      ? await scanWithSearch(req, model, usage)
      : await scanPlain(req, model, usage);
  }

  const normalized: ScanResult = normalizeScanResult(response);
  return {
    response: { ...normalized, sources: response.sources },
    model,
    webSearch,
    durationMs: Date.now() - started,
    ...usage,
  };
}
