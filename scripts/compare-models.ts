/**
 * Compare scan quality, speed and cost across Claude models, with and without
 * web search, on a folder of real photos.
 *
 *   npm run compare -- <photo-folder> [--models opus,sonnet,haiku] [--search both|on|off]
 *
 * Needs ANTHROPIC_API_KEY in .env. Every run calls the API and costs money.
 * Photos are resized to JPEG with macOS `sips`. Results go to eval-results/
 * (git-ignored), never into the repo.
 */
import { execFileSync } from 'node:child_process';
import { mkdirSync, mkdtempSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { basename, extname, join } from 'node:path';

import { formatRange } from '@/lib/money';
import { runScan, type ScanRun } from '@/server/scanService';

const MODELS: Record<string, { id: string; inPerM: number; outPerM: number }> = {
  opus: { id: 'claude-opus-5-5', inPerM: 4, outPerM: 20 },
  sonnet: { id: 'claude-sonnet-5-5', inPerM: 2, outPerM: 10 },
  haiku: { id: 'claude-haiku-5-5', inPerM: 0.1, outPerM: 0.5 },
};
const SEARCH_COST = 0.01; // $10 per 1,000 searches

function arg(name: string, fallback: string): string {
  const i = process.argv.indexOf(`--${name}`);
  return i > 0 ? process.argv[i + 1] : fallback;
}

/** Shrink to 1280px JPEG, like the app does, and return base64. */
function preparePhoto(path: string, workDir: string): string {
  const out = join(workDir, `${basename(path, extname(path))}.jpg`);
  execFileSync('sips', ['-s', 'format', 'jpeg', '-s', 'formatOptions', '70', '-Z', '1280', path, '--out', out], {
    stdio: 'ignore',
  });
  return readFileSync(out).toString('base64');
}

function cost(run: ScanRun, key: string): number {
  const m = MODELS[key];
  return (run.inputTokens * m.inPerM + run.outputTokens * m.outPerM) / 1e6 + run.searches * SEARCH_COST;
}

type Row = {
  photo: string;
  model: string;
  search: boolean;
  ok: boolean;
  error?: string;
  seconds?: number;
  costUsd?: number;
  searches?: number;
  result?: ScanRun['response'];
};

async function main() {
  const folder = process.argv[2];
  if (!folder || folder.startsWith('--')) {
    console.error('Usage: npm run compare -- <photo-folder> [--models opus,sonnet,haiku] [--search both|on|off]');
    process.exit(1);
  }
  if (!process.env.ANTHROPIC_API_KEY) {
    console.error('ANTHROPIC_API_KEY is not set. Add it to .env first.');
    process.exit(1);
  }
  process.env.SCAN_PROVIDER = 'anthropic';

  const models = arg('models', 'opus,sonnet,haiku').split(',');
  const searchModes = { both: [false, true], on: [true], off: [false] }[arg('search', 'both')] ?? [false, true];
  const photos = readdirSync(folder)
    .filter((f) => /\.(jpe?g|png|heic|heif)$/i.test(f))
    .sort();
  if (photos.length === 0) throw new Error(`No photos found in ${folder}`);

  const workDir = mkdtempSync(join(tmpdir(), 'threadfolio-'));
  const rows: Row[] = [];
  console.log(`${photos.length} photos × ${models.length} models × ${searchModes.length} search modes`);

  for (const photo of photos) {
    const base64 = preparePhoto(join(folder, photo), workDir);
    const configs = models.flatMap((m) => searchModes.map((s) => ({ m, s })));
    const results = await Promise.all(
      configs.map(async ({ m, s }): Promise<Row> => {
        try {
          const run = await runScan({ photo: base64 }, { model: MODELS[m].id, webSearch: s });
          return {
            photo,
            model: m,
            search: s,
            ok: true,
            seconds: run.durationMs / 1000,
            costUsd: cost(run, m),
            searches: run.searches,
            result: run.response,
          };
        } catch (e) {
          return { photo, model: m, search: s, ok: false, error: e instanceof Error ? e.message : String(e) };
        }
      }),
    );
    rows.push(...results);
    for (const r of results) {
      const label = `${r.model}${r.search ? '+search' : ''}`.padEnd(14);
      console.log(
        r.ok
          ? `  ${photo} ${label} ${r.seconds!.toFixed(1)}s $${r.costUsd!.toFixed(3)}  ${r.result!.title} | ${r.result!.era ?? '?'} | vintage $${r.result!.vintagePrice?.low ?? '?'}–${r.result!.vintagePrice?.high ?? '?'}`
          : `  ${photo} ${label} ERROR ${r.error}`,
      );
    }
  }

  const outDir = 'eval-results';
  mkdirSync(outDir, { recursive: true });
  const stamp = new Date().toISOString().replace(/[:.]/g, '-');
  writeFileSync(join(outDir, `compare-${stamp}.json`), JSON.stringify(rows, null, 2));

  // Markdown summary: one section per photo, then averages per config.
  const lines: string[] = [`# Model comparison ${stamp}`, ''];
  for (const photo of photos) {
    lines.push(`## ${photo}`, '', '| Config | Time | Cost | Title | Era | Brand | Vintage | New | Conf. | Sources |', '|---|---|---|---|---|---|---|---|---|---|');
    for (const r of rows.filter((x) => x.photo === photo)) {
      const cfg = `${r.model}${r.search ? ' + search' : ''}`;
      if (!r.ok) {
        lines.push(`| ${cfg} | error | | ${r.error} | | | | | | |`);
        continue;
      }
      const x = r.result!;
      const toCents = (p: typeof x.vintagePrice) => (p ? { low: p.low * 100, high: p.high * 100 } : null);
      lines.push(
        `| ${cfg} | ${r.seconds!.toFixed(1)}s | $${r.costUsd!.toFixed(3)} | ${x.title} | ${x.era ?? '—'} | ${x.brand ?? '—'} | ${formatRange(toCents(x.vintagePrice))} | ${formatRange(toCents(x.newPrice))} | ${x.confidence.toFixed(2)} | ${x.sources.length} |`,
      );
    }
    lines.push('');
  }
  lines.push('## Averages', '', '| Config | Runs | Errors | Avg time | Avg cost | Avg searches |', '|---|---|---|---|---|---|');
  for (const m of models) {
    for (const s of searchModes) {
      const set = rows.filter((r) => r.model === m && r.search === s);
      const ok = set.filter((r) => r.ok);
      const avg = (f: (r: Row) => number) => (ok.length ? ok.reduce((a, r) => a + f(r), 0) / ok.length : 0);
      lines.push(
        `| ${m}${s ? ' + search' : ''} | ${set.length} | ${set.length - ok.length} | ${avg((r) => r.seconds!).toFixed(1)}s | $${avg((r) => r.costUsd!).toFixed(3)} | ${avg((r) => r.searches!).toFixed(1)} |`,
      );
    }
  }
  const total = rows.reduce((a, r) => a + (r.costUsd ?? 0), 0);
  lines.push('', `Total estimated cost: $${total.toFixed(2)}`);
  const mdPath = join(outDir, `compare-${stamp}.md`);
  writeFileSync(mdPath, lines.join('\n') + '\n');
  console.log(`\nTotal estimated cost: $${total.toFixed(2)}\nReport: ${mdPath}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
