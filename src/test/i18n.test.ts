// @vitest-environment node
// Pure data assertions, no DOM — matching landingContent.test.ts, which pins
// node because the shared jsdom environment currently fails to start in this
// repo.
import { describe, expect, it, vi } from 'vitest';

// pageStrings builds a Firestore document reference at import time.
vi.mock('@/lib/firebase', () => ({ db: {}, auth: {}, firebaseConfig: {} }));
vi.mock('firebase/firestore', () => ({
  doc: () => ({}),
  getDoc: async () => ({ exists: () => false }),
  setDoc: async () => undefined,
}));

const { translations, SECTION_NAMES } = await import('@/i18n/translations');
const { ENUM_REGISTRY, statusKey } = await import('@/i18n/enums');
const { applyStringOverrides, overrideKey } = await import('@/services/pageStrings');

type Tree = Record<string, Record<string, string>>;
const en = translations.en as unknown as Tree;
const am = translations.am as unknown as Tree;

/** Every `"section.key"` present in one language. */
function dottedKeys(tree: Tree): string[] {
  return Object.entries(tree).flatMap(([section, entries]) =>
    Object.keys(entries).map((key) => `${section}.${key}`)
  );
}

/**
 * Values that are legitimately identical in English and Amharic: proper nouns,
 * abbreviations and masks. Anything NOT on this list that matches English is
 * almost certainly a key that was wired up but never translated.
 */
const SAME_IN_BOTH_LANGUAGES = new Set<string>([
  'pages.loginPasswordPlaceholder', // '••••••••' — a bullet mask, not words
]);

describe('translation tree shape', () => {
  it('is exactly two levels deep, with string leaves only', () => {
    // Guards flattenSection, applyStringOverrides and buildFlatMap, all three
    // of which walk exactly two levels and silently drop anything deeper. A
    // nested object here would render fine but vanish from the admin editor.
    for (const [lang, sections] of Object.entries(translations)) {
      for (const [section, entries] of Object.entries(sections)) {
        expect(
          entries && typeof entries === 'object' && !Array.isArray(entries),
          `${lang}.${section} must be a plain object`
        ).toBe(true);
        for (const [key, leaf] of Object.entries(entries as Record<string, unknown>)) {
          expect(typeof leaf, `${lang}.${section}.${key} must be a string`).toBe('string');
        }
      }
    }
  });

  it('has no key containing a dot', () => {
    // Override keys are "section.key"; a dot inside a key would make the
    // stored path ambiguous and unparseable.
    for (const [lang, sections] of Object.entries(translations)) {
      for (const [section, entries] of Object.entries(sections)) {
        for (const key of Object.keys(entries as object)) {
          expect(key.includes('.'), `${lang}.${section}.${key} contains a dot`).toBe(false);
        }
      }
    }
  });

  it('gives every language the same section list', () => {
    for (const [lang, sections] of Object.entries(translations)) {
      expect(Object.keys(sections).sort(), `${lang} sections`).toEqual([...SECTION_NAMES].sort());
    }
  });
});

describe('Amharic completeness', () => {
  it('has every English key', () => {
    // Amharic is the app default (DEFAULT_LANGUAGE in LanguageContext), so a
    // gap here is a string the church's own readers see in English.
    const missing = dottedKeys(en).filter((k) => {
      const [section, key] = [k.slice(0, k.indexOf('.')), k.slice(k.indexOf('.') + 1)];
      return !(key in (am[section] ?? {}));
    });
    expect(missing, `${missing.length} English keys have no Amharic`).toEqual([]);
  });

  it('has no value left as its English text', () => {
    const untranslated = dottedKeys(en)
      .filter((k) => !SAME_IN_BOTH_LANGUAGES.has(k))
      .filter((k) => {
        const section = k.slice(0, k.indexOf('.'));
        const key = k.slice(k.indexOf('.') + 1);
        const a = am[section]?.[key];
        return a !== undefined && a === en[section][key];
      });
    expect(untranslated, `${untranslated.length} Amharic values are still English`).toEqual([]);
  });

  it('has no empty or whitespace-only value in any language', () => {
    const blank: string[] = [];
    for (const [lang, sections] of Object.entries(translations)) {
      for (const [section, entries] of Object.entries(sections)) {
        for (const [key, leaf] of Object.entries(entries as Record<string, string>)) {
          if (!leaf.trim()) blank.push(`${lang}.${section}.${key}`);
        }
      }
    }
    expect(blank).toEqual([]);
  });
});

describe('persisted enum labels', () => {
  it('has an English and Amharic label for every stored value', () => {
    // A status added to a service union without a label would otherwise render
    // its raw stored token ('OnLeave') to the reader.
    const missing: string[] = [];
    for (const { prefix, values } of ENUM_REGISTRY) {
      for (const value of values) {
        const key = statusKey(prefix, value);
        if (!(key in en.status)) missing.push(`en.status.${key}`);
        if (!(key in am.status)) missing.push(`am.status.${key}`);
      }
    }
    expect(missing).toEqual([]);
  });
});

describe('cross-cutting registries resolve their keys', () => {
  it('gives every permission a label, a description and a group heading', async () => {
    const { ALL_PERMISSIONS, PERMISSION_META } = await import('@/lib/rolePermissions');
    const missing: string[] = [];
    for (const perm of ALL_PERMISSIONS) {
      const meta = PERMISSION_META[perm];
      expect(meta, `no PERMISSION_META for ${perm}`).toBeTruthy();
      for (const key of [meta.labelKey, meta.descriptionKey, `group${meta.group}`]) {
        if (!(key in en.permissions)) missing.push(`en.permissions.${key} (${perm})`);
        if (!(key in am.permissions)) missing.push(`am.permissions.${key} (${perm})`);
      }
    }
    expect(missing).toEqual([]);
  });

  it('gives every church structure body a name and one key per duty', async () => {
    const { CHURCH_STRUCTURE } = await import('@/data/churchStructure');
    type Node = { id: string; roleCount: number; children?: Node[] };
    const nodes: Node[] = [];
    (function walk(n: Node) {
      nodes.push(n);
      (n.children ?? []).forEach(walk);
    })(CHURCH_STRUCTURE as unknown as Node);

    const missing: string[] = [];
    for (const node of nodes) {
      const prefix = node.id.replace(/-([a-z])/g, (_, c: string) => c.toUpperCase());
      const keys = [`${prefix}Name`, ...Array.from({ length: node.roleCount }, (_, i) => `${prefix}Role${i + 1}`)];
      for (const key of keys) {
        if (!(key in en.structure)) missing.push(`en.structure.${key}`);
        if (!(key in am.structure)) missing.push(`am.structure.${key}`);
      }
    }
    expect(nodes.length).toBeGreaterThan(50);
    expect(missing).toEqual([]);
  });

  it('gives every toggleable UI element a label', async () => {
    const { ELEMENT_KEYS } = await import('@/services/softwareControl');
    const missing: string[] = [];
    for (const { key, labelKey } of ELEMENT_KEYS) {
      if (!(labelKey in en.modules)) missing.push(`en.modules.${labelKey} (${key})`);
      if (!(labelKey in am.modules)) missing.push(`am.modules.${labelKey} (${key})`);
    }
    expect(ELEMENT_KEYS.length).toBeGreaterThan(0);
    expect(missing).toEqual([]);
  });
});

describe('admin override reachability', () => {
  it('lets an override reach every key in the tree', () => {
    // The whole point of putting a string in the dictionary is that an admin
    // can retranslate it without a deploy. applyStringOverrides walks only two
    // levels and skips arrays, so this proves nothing we added is invisible to
    // the Localization Editor.
    const overrides: Record<string, string> = {};
    for (const [section, entries] of Object.entries(am)) {
      for (const key of Object.keys(entries)) {
        overrides[overrideKey(section, key)] = `OVERRIDDEN:${section}.${key}`;
      }
    }

    const result = applyStringOverrides(am as never, overrides) as unknown as Tree;

    const unreachable: string[] = [];
    for (const [section, entries] of Object.entries(am)) {
      for (const key of Object.keys(entries)) {
        if (result[section]?.[key] !== `OVERRIDDEN:${section}.${key}`) {
          unreachable.push(`${section}.${key}`);
        }
      }
    }
    expect(unreachable, `${unreachable.length} keys cannot be overridden by an admin`).toEqual([]);
  });
});
