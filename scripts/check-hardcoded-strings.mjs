#!/usr/bin/env node
/**
 * Ratchet on hardcoded English user-facing strings.
 *
 * The app defaults to Amharic, but roughly 1,800 strings were written as
 * English literals inside components and never reached the dictionary, so they
 * rendered in English no matter what language the reader picked. They are being
 * migrated in phases. This script exists to stop that number going back up
 * while the migration is in progress.
 *
 * It is a ratchet, not a rule: it compares each file's count against
 * `i18n-baseline.json` and fails only when a count INCREASES or a new file
 * appears with hardcoded strings. A boolean "no literals allowed" rule would
 * have had to be disabled on day one and would have taught everyone to ignore
 * it.
 *
 * Why not eslint: `eslint-plugin-react`'s `jsx-no-literals` only sees JSX text
 * nodes, which is a minority of the problem — most of these live in
 * `placeholder=`, `label=`, `toast.error(...)` and `throw new Error(...)`. And
 * `eslint-plugin-react` is not a dependency of this repo.
 *
 *   node scripts/check-hardcoded-strings.mjs           # check against baseline
 *   node scripts/check-hardcoded-strings.mjs --update  # rewrite the baseline
 *   node scripts/check-hardcoded-strings.mjs --report <file>   # per-file detail
 */
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { readdir } from 'node:fs/promises';
import { join, relative } from 'node:path';

const ROOT = process.cwd();
const BASELINE = join(ROOT, 'i18n-baseline.json');

/**
 * Excluded on purpose:
 *  - src/components/ui  vendored shadcn primitives, kept upstream-upgradable;
 *                       their few strings are sr-only and handled via props
 *  - src/i18n           the dictionary itself is English by definition
 *  - src/test           fixtures and assertions are not user-facing
 *  - functions          server-side, has its own notification string module
 */
const SKIP_DIRS = new Set(['node_modules', 'dist', '.git', '.vercel', 'public', 'functions']);
const SKIP_PATHS = [
  'src/components/ui/',
  'src/i18n/',
  'src/test/',
  // Per-language content trees. These hold an `en`/`am`/`om`/`ti` block each,
  // so their English block is correct English by construction — exactly the
  // reason src/i18n is skipped. Whether a language block is *missing* is a
  // different question, and one the i18n test answers properly.
  'src/services/landingContent.ts',
  'src/services/featuresContent.ts',
  'src/services/aboutContent.ts',
  // Unreachable. Neither is imported anywhere — Landing.tsx was superseded by
  // Home.tsx and Index.tsx is leftover create-app scaffold ("Welcome to Your
  // Blank App"). Their ~43 English strings cannot render, so translating them
  // would be busywork and counting them would misreport how much is left.
  // Left in place rather than deleted; delete them and drop these two lines.
  'src/pages/Landing.tsx',
  'src/pages/Index.tsx',
];

/** Props whose value is rendered to the reader. */
const TEXT_PROPS =
  /\b(placeholder|label|title|alt|aria-label|description|hint|emptyTitle|emptyMessage|defaultTitle|defaultDescription)\s*=\s*(["'])(.*?)\2/g;
/** Toast and dialog text. */
const TOAST = /\btoast\s*\.\s*(?:success|error|info|warning|loading|message)\s*\(\s*(["'])(.*?)\1/g;
/**
 * Thrown prose. `Error` only, never `AppError` — an AppError's argument is a
 * translation key, which is the opposite of an untranslated string.
 */
const THROWN = /\bthrow\s+new\s+Error\s*\(\s*(["'])(.*?)\1/g;
/** JSX text nodes: `>Some words<` on one line. */
const JSX_TEXT = />([^<>{}\n]*[A-Za-z]{3,}[^<>{}\n]*)</g;
/**
 * Object-literal label maps in non-component modules — `label: 'View
 * Dashboard'` in PERMISSION_META, `name:` in churchStructure, the field
 * registry in moduleConfig. These render verbatim but never touch a hook, so
 * none of the patterns above see them.
 */
const LABEL_PROP =
  /(?:^|[{,[])\s*(?:label|description|desc|title|name|placeholder|hint|message|summary|learnMore|headerTitle|headerDescription)\s*:\s*(["'])(.*?)\1/g;
// `group:` and `nameEn:` are excluded on purpose. `group` is a filter
// predicate and React key in PERMISSION_META — translating it would break the
// grouping, so it stays an English token with a `group<Name>` label beside it.
// `nameEn` says in its own name that it holds the English rendering; the
// translated name lives in the dictionary.
/**
 * `'Sunday School': 'ministrySundaySchool',` — a persisted token mapped to its
 * translation key. Both halves are identifiers, not copy: the left is a value
 * stored in Firestore and deliberately not translated, the right is the key
 * that carries the translation.
 */
const TOKEN_KEY_MAP = /^\s*(["'])[^"']+\1\s*:\s*(["'])[a-z][A-Za-z0-9]*\2\s*,?\s*$/;

/**
 * A bare quoted string on its own line — an element of a prose array such as
 * `churchStructure`'s per-body list of duties, which renders straight to the
 * Hierarchy page.
 */
const ARRAY_ITEM = /^\s*(["'])([^"']*)\1\s*,?\s*$/;

/** Looks like prose a reader would see, rather than a css class or an id. */
function isProse(s) {
  const v = s.trim();
  if (v.length < 3) return false;
  if (!/[A-Za-z]{3,}/.test(v)) return false;
  if (/[ሀ-፿]/.test(v)) return false; // already Ethiopic
  if (/^[a-z0-9-]+$/.test(v)) return false; // slug / css class / id
  if (/^[A-Z_][A-Z0-9_]*$/.test(v)) return false; // CONSTANT
  if (/^(https?:|\/|#|data:|mailto:)/.test(v)) return false; // url or path
  if (/^[\d\s.,:%$-]+$/.test(v)) return false; // numeric
  return true;
}

/** A line already reaching the dictionary is not a finding. */
function isTranslated(line) {
  return /\bt\s*\.\s*[a-z]|\bt\s*\(|\b(tx|tt|a|f|s)\s*\.\s*[a-z]+[A-Z]|useLanguage|useTranslation/.test(
    line
  );
}

/**
 * `const SERVICE_TYPES: TeachingServiceType[] = [ ... ]` — a type-annotated
 * array of persisted tokens. The annotation is the signal: these are values
 * written to Firestore, deliberately spelled in English forever, and their
 * display labels live in the dictionary keyed by the token.
 */
const TOKEN_ARRAY_OPEN = /^\s*(?:export\s+)?const \w+\s*:\s*\w+\[\]\s*=\s*\[\s*$/;

function scan(source) {
  const findings = [];
  const lines = source.split('\n');
  let inTokenArray = false;

  lines.forEach((line, i) => {
    if (inTokenArray) {
      if (/^\s*\]/.test(line)) inTokenArray = false;
      return;
    }
    if (TOKEN_ARRAY_OPEN.test(line)) { inTokenArray = true; return; }
    const trimmed = line.trim();
    if (trimmed.startsWith('//') || trimmed.startsWith('*') || trimmed.startsWith('/*')) return;
    if (isTranslated(line)) return;
    if (TOKEN_KEY_MAP.test(line)) return;

    const add = (text) => {
      if (isProse(text)) findings.push({ line: i + 1, text: text.trim() });
    };

    for (const m of line.matchAll(TEXT_PROPS)) add(m[3]);
    for (const m of line.matchAll(TOAST)) add(m[2]);
    for (const m of line.matchAll(THROWN)) add(m[2]);
    // `<code>MapPin</code>` is an identifier the admin must type verbatim.
    const withoutCode = line.replace(/<code[^>]*>.*?<\/code>/g, '<code/>');
    for (const m of withoutCode.matchAll(JSX_TEXT)) add(m[1]);

    for (const m of line.matchAll(LABEL_PROP)) add(m[2]);

    const arrayItem = line.match(ARRAY_ITEM);
    // Only count a bare string as prose if it reads like a sentence or a
    // multi-word label; a lone 'InUse' or 'am' is a value, not copy.
    if (arrayItem && /\s/.test(arrayItem[2].trim())) add(arrayItem[2]);
  });

  return findings;
}

async function* walk(dir) {
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    if (entry.name.startsWith('.') || SKIP_DIRS.has(entry.name)) continue;
    const full = join(dir, entry.name);
    if (entry.isDirectory()) yield* walk(full);
    else if (/\.(tsx|ts)$/.test(entry.name) && !entry.name.endsWith('.d.ts')) yield full;
  }
}

const counts = {};
const detail = {};
for await (const file of walk(join(ROOT, 'src'))) {
  const rel = relative(ROOT, file);
  if (SKIP_PATHS.some((p) => rel.startsWith(p))) continue;
  const findings = scan(readFileSync(file, 'utf8'));
  if (findings.length) {
    counts[rel] = findings.length;
    detail[rel] = findings;
  }
}

const total = Object.values(counts).reduce((a, b) => a + b, 0);

// ── --report <file> ───────────────────────────────────────────────────────────
const reportIdx = process.argv.indexOf('--report');
if (reportIdx !== -1) {
  const target = process.argv[reportIdx + 1];
  const matches = Object.keys(detail).filter((f) => f.includes(target ?? ''));
  for (const f of matches) {
    console.log(`\n${f}  (${detail[f].length})`);
    for (const { line, text } of detail[f]) console.log(`  ${line}: ${text}`);
  }
  process.exit(0);
}

// ── --update ──────────────────────────────────────────────────────────────────
if (process.argv.includes('--update')) {
  writeFileSync(BASELINE, JSON.stringify({ total, files: counts }, null, 2) + '\n');
  console.log(`baseline written: ${total} strings across ${Object.keys(counts).length} files`);
  process.exit(0);
}

// ── check ─────────────────────────────────────────────────────────────────────
if (!existsSync(BASELINE)) {
  console.error('No i18n-baseline.json. Run with --update to create it.');
  process.exit(1);
}

const base = JSON.parse(readFileSync(BASELINE, 'utf8'));
const regressions = [];
for (const [file, n] of Object.entries(counts)) {
  const was = base.files[file] ?? 0;
  if (n > was) regressions.push(`  ${file}: ${was} -> ${n}  (+${n - was})`);
}

const improved = base.total - total;
console.log(`hardcoded strings: ${total} (baseline ${base.total}, ${improved >= 0 ? '-' : '+'}${Math.abs(improved)})`);

if (regressions.length) {
  console.error('\nNew hardcoded strings — move them into src/i18n/sections instead:');
  console.error(regressions.join('\n'));
  console.error('\nIf they are genuinely not user-facing, run --update to accept.');
  process.exit(1);
}
console.log('OK — no file regressed.');
