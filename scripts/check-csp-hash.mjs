#!/usr/bin/env node
/**
 * Keeps the Content-Security-Policy in sync with the inline boot-splash script.
 *
 * `index.html` carries one inline script — it reads the stored theme so the splash
 * cannot flash the wrong colour before React mounts, which means it has to run
 * before anything external can load. The CSP pins its SHA-256 rather than
 * allowing `'unsafe-inline'`, because `'unsafe-inline'` on script-src permits
 * every inline script on every page and leaves little of the policy standing.
 *
 * The hazard is that the hash is invisible coupling: edit a character of that
 * script and the browser silently refuses to run it. Nothing fails, no test
 * breaks, and a dark-mode reader just gets a white flash on every page load. So
 * this check runs in `npm run check` and prints the replacement hash.
 *
 * Reads dist/, so it needs a build first. Skips (exit 0) when dist/index.html is
 * absent, so a fresh checkout running the gate does not fail on a missing build.
 */

import { readFileSync, existsSync } from 'node:fs';
import { createHash } from 'node:crypto';

const HTML = 'dist/index.html';
const CONFIG = 'vercel.json';

if (!existsSync(HTML)) {
  console.log('csp hash: skipped (no dist/index.html — run `npm run build` first)');
  process.exit(0);
}

// Strip comments BEFORE looking for scripts. An earlier version of this check
// lived in an HTML comment that quoted its own regex, so the matcher found the
// `<script` inside the documentation instead of the real one.
const html = readFileSync(HTML, 'utf8').replace(/<!--[\s\S]*?-->/g, '');

const inline = [...html.matchAll(/<script(?![^>]*\bsrc=)[^>]*>([\s\S]*?)<\/script>/g)]
  .map((m) => m[1]);

if (inline.length === 0) {
  console.log('csp hash: no inline scripts in the build — nothing to pin');
  process.exit(0);
}

const config = readFileSync(CONFIG, 'utf8');
const pinned = [...config.matchAll(/'(sha256-[A-Za-z0-9+/=]+)'/g)].map((m) => m[1]);

const actual = inline.map(
  (body) => `sha256-${createHash('sha256').update(body).digest('base64')}`
);

const missing = actual.filter((h) => !pinned.includes(h));
const stale = pinned.filter((h) => !actual.includes(h));

if (missing.length === 0 && stale.length === 0) {
  console.log(`csp hash: OK (${actual.length} inline script${actual.length === 1 ? '' : 's'} pinned)`);
  process.exit(0);
}

console.error('csp hash: MISMATCH — the browser will refuse to run the inline script.\n');
for (const h of missing) console.error(`  not pinned in ${CONFIG}:  ${h}`);
for (const h of stale) console.error(`  pinned but not built:    ${h}`);
console.error(`\nUpdate script-src in ${CONFIG} to:\n  ${actual.map((h) => `'${h}'`).join(' ')}`);
process.exit(1);
