import { db } from '@/lib/firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import type { Language } from '@/i18n/translations';

// A flat key→value map of string overrides per language
export type PageStringOverrides = Record<string, string>;
export type AllLanguageOverrides = Partial<Record<Language, PageStringOverrides>>;

const COLLECTION = 'siteConfig';
const DOCUMENT = 'pageStrings';

export const pageStringsService = {
  async get(): Promise<AllLanguageOverrides> {
    const ref = doc(db, COLLECTION, DOCUMENT);
    const snap = await getDoc(ref);
    if (!snap.exists()) return {};
    return snap.data() as AllLanguageOverrides;
  },

  async save(overrides: AllLanguageOverrides, updatedBy: string): Promise<void> {
    const ref = doc(db, COLLECTION, DOCUMENT);
    await setDoc(ref, { ...overrides, _meta: { updatedAt: new Date().toISOString(), updatedBy } });
  },
};

// ─── Override key handling ────────────────────────────────────────────────────

/**
 * Overrides are keyed by dotted path — `nav.login`.
 *
 * They used to be keyed by the leaf name alone (`login`), which collides
 * whenever two sections share a key name: the translations tree has both
 * `nav.plans` and `pages.plans`, and a single `plans` override could only ever
 * mean one of them. Documents saved under the old scheme are still read, so
 * nothing an admin already translated is lost.
 */
export function overrideKey(section: string, key: string): string {
  return `${section}.${key}`;
}

/** The leaf name of a dotted path — the legacy key form. */
export function leafOf(path: string): string {
  const dot = path.indexOf('.');
  return dot === -1 ? path : path.slice(dot + 1);
}

/** Dotted key first, then the legacy bare leaf. Blank means "use the default". */
export function lookupOverride(
  overrides: PageStringOverrides | undefined,
  section: string,
  key: string
): string | undefined {
  if (!overrides) return undefined;
  const value = overrides[overrideKey(section, key)] ?? overrides[key];
  return value && value.trim() ? value : undefined;
}

/**
 * Layer flat overrides onto the nested translations tree for one language.
 *
 * The tree is exactly two levels — `section -> key -> string` — so this walks
 * that shape directly rather than recursing. Keys beginning with `_` are
 * skipped: `_meta` shares the document with the real overrides.
 */
export function applyStringOverrides<T extends Record<string, unknown>>(
  tree: T,
  overrides: PageStringOverrides | undefined
): T {
  if (!overrides) return tree;
  const usable = Object.keys(overrides).some((k) => !k.startsWith('_'));
  if (!usable) return tree;

  const out: Record<string, unknown> = { ...tree };
  for (const [section, value] of Object.entries(tree)) {
    if (!value || typeof value !== 'object' || Array.isArray(value)) continue;
    const merged: Record<string, unknown> = {};
    for (const [key, leaf] of Object.entries(value as Record<string, unknown>)) {
      merged[key] =
        typeof leaf === 'string' ? lookupOverride(overrides, section, key) ?? leaf : leaf;
    }
    out[section] = merged;
  }
  return out as T;
}
