import { afterEach, describe, expect, it } from '@jest/globals';

import { ScanRequestSchema } from '@/scan/schema';
import { DEEP_MODEL, DEFAULT_MODEL, modeSettings, runScan } from './scanService';

const ENV_KEYS = ['SCAN_MODEL', 'SCAN_DEEP_MODEL', 'SCAN_WEB_SEARCH', 'SCAN_PROVIDER'] as const;
const saved = Object.fromEntries(ENV_KEYS.map((k) => [k, process.env[k]]));

afterEach(() => {
  for (const k of ENV_KEYS) {
    if (saved[k] === undefined) delete process.env[k];
    else process.env[k] = saved[k];
  }
});

describe('modeSettings', () => {
  it('uses Sonnet without search for quick scans', () => {
    delete process.env.SCAN_MODEL;
    delete process.env.SCAN_WEB_SEARCH;
    expect(DEFAULT_MODEL).toBe('claude-sonnet-5-5');
    expect(modeSettings('quick')).toEqual({ model: DEFAULT_MODEL, webSearch: false });
  });

  it('uses Opus with web search for deep checks', () => {
    delete process.env.SCAN_DEEP_MODEL;
    expect(DEEP_MODEL).toBe('claude-opus-5-5');
    expect(modeSettings('deep')).toEqual({ model: DEEP_MODEL, webSearch: true });
  });

  it('lets environment variables override the models', () => {
    process.env.SCAN_MODEL = 'claude-haiku-5-5';
    process.env.SCAN_DEEP_MODEL = 'claude-sonnet-5-5';
    expect(modeSettings('quick').model).toBe('claude-haiku-5-5');
    expect(modeSettings('deep').model).toBe('claude-sonnet-5-5');
  });
});

describe('scan requests', () => {
  it('default to a quick scan', () => {
    expect(ScanRequestSchema.parse({ photo: 'abc' }).mode).toBe('quick');
  });

  it('reject unknown modes', () => {
    expect(ScanRequestSchema.safeParse({ photo: 'abc', mode: 'max' }).success).toBe(false);
  });

  it('report the mode back in mock mode', async () => {
    process.env.SCAN_PROVIDER = 'mock';
    const run = await runScan({ photo: 'abc', mode: 'deep' });
    expect(run.response.mode).toBe('deep');
    expect(run.model).toBe(modeSettings('deep').model);
    expect(run.webSearch).toBe(true);
  });
});
