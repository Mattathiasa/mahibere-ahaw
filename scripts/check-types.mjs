#!/usr/bin/env node
/**
 * Ratchet on TypeScript errors.
 *
 * Two things this exists for.
 *
 * First, `tsc --noEmit` against the root tsconfig.json is a NO-OP. That config
 * is solution-style — `"files": []` plus project references — so tsc resolves
 * an empty program and exits 0 without reading a single source file. Anyone
 * running it gets a green light that means nothing. This always targets
 * tsconfig.app.json.
 *
 * Second, the app carries pre-existing type errors that predate this work, so
 * a plain pass/fail gate would be red from the start and get ignored. This
 * compares per-file counts against `typecheck-baseline.json` and fails only
 * when a file gets WORSE or a clean file breaks.
 *
 *   node scripts/check-types.mjs           # check against baseline
 *   node scripts/check-types.mjs --update  # rewrite the baseline
 */
import { execFileSync } from 'node:child_process';
import { readFileSync, writeFileSync, existsSync } from 'node:fs';

const BASELINE = 'typecheck-baseline.json';

let raw = '';
try {
  raw = execFileSync('npx', ['tsc', '-p', 'tsconfig.app.json', '--noEmit'], {
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
  });
} catch (e) {
  // tsc exits non-zero when there are errors; the report is on stdout.
  raw = `${e.stdout ?? ''}${e.stderr ?? ''}`;
}

const counts = {};
for (const line of raw.split('\n')) {
  const m = line.match(/^(\S+?)\(\d+,\d+\): error TS/);
  if (m) counts[m[1]] = (counts[m[1]] ?? 0) + 1;
}
const total = Object.values(counts).reduce((a, b) => a + b, 0);

if (process.argv.includes('--update')) {
  writeFileSync(BASELINE, JSON.stringify({ total, files: counts }, null, 2) + '\n');
  console.log(`typecheck baseline written: ${total} errors across ${Object.keys(counts).length} files`);
  process.exit(0);
}

if (!existsSync(BASELINE)) {
  console.error(`No ${BASELINE}. Run with --update to create it.`);
  process.exit(1);
}

const base = JSON.parse(readFileSync(BASELINE, 'utf8'));
const regressions = [];
for (const [file, n] of Object.entries(counts)) {
  const was = base.files[file] ?? 0;
  if (n > was) regressions.push(`  ${file}: ${was} -> ${n}`);
}

const delta = base.total - total;
console.log(
  `type errors: ${total} (baseline ${base.total}, ${delta >= 0 ? '-' : '+'}${Math.abs(delta)})`
);

if (regressions.length) {
  console.error('\nNew type errors:');
  console.error(regressions.join('\n'));
  console.error('\nRun `npm run typecheck` for the full report.');
  process.exit(1);
}
console.log('OK — no file regressed.');
