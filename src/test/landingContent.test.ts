// @vitest-environment node
// Pure data assertions, no DOM — matching atbiyaRoles.test.ts, which pins node
// because the shared jsdom environment currently fails to start in this repo.
import { describe, expect, it, vi } from 'vitest';

// Both modules build Firestore document references at import time.
vi.mock('@/lib/firebase', () => ({ db: {}, auth: {}, firebaseConfig: {} }));
vi.mock('firebase/firestore', () => ({
  doc: () => ({}),
  getDoc: async () => ({ exists: () => false }),
  setDoc: async () => undefined,
}));

const { DEFAULT_LANDING_CONTENT, featureLinkTarget, resolveLink } = await import(
  '@/services/landingContent'
);
const { DEFAULT_FEATURES_CONTENT } = await import('@/services/featuresContent');
const { translations } = await import('@/i18n/translations');
const { applyStringOverrides, overrideKey, leafOf } = await import('@/services/pageStrings');

const LANGS = ['en', 'am', 'om', 'ti'] as const;
type Lang = (typeof LANGS)[number];

/** Every leaf path in an object, as dotted strings, so shapes can be compared. */
function shape(value: unknown, prefix = ''): string[] {
  if (Array.isArray(value)) {
    // Arrays are admin-managed lists whose length is content, not schema —
    // compare the shape of the first entry only.
    return value.length > 0 ? shape(value[0], `${prefix}[]`) : [`${prefix}[]`];
  }
  if (value && typeof value === 'object') {
    return Object.entries(value as Record<string, unknown>).flatMap(([k, v]) =>
      shape(v, prefix ? `${prefix}.${k}` : k)
    );
  }
  return [prefix];
}

describe('landing content defaults', () => {
  it('has the same shape in all four languages', () => {
    const en = shape(DEFAULT_LANDING_CONTENT.en).sort();
    for (const lang of LANGS) {
      expect(shape(DEFAULT_LANDING_CONTENT[lang]).sort(), `${lang} differs from en`).toEqual(en);
    }
  });

  it('has no empty strings, which would render as gaps on the page', () => {
    for (const lang of LANGS) {
      const walk = (value: unknown, path: string) => {
        if (typeof value === 'string') {
          // Blank is meaningful for these: every `*Url` and every link `url`
          // waits for an admin to supply a destination, and an empty
          // `titleHighlight` is how the hero's gradient second line is hidden.
          const optional = /Url$|\.url$|^hero\.titleHighlight$/.test(path);
          if (!optional) expect(value.trim(), `${lang}.${path} is empty`).not.toBe('');
        } else if (Array.isArray(value)) {
          value.forEach((v, i) => walk(v, `${path}[${i}]`));
        } else if (value && typeof value === 'object') {
          Object.entries(value).forEach(([k, v]) => walk(v, path ? `${path}.${k}` : k));
        }
      };
      walk(DEFAULT_LANDING_CONTENT[lang], '');
    }
  });

  it('shows a sensible number of news posts', () => {
    for (const lang of LANGS) {
      const max = DEFAULT_LANDING_CONTENT[lang].news.maxPosts;
      expect(max, `${lang}.news.maxPosts`).toBeGreaterThan(0);
      expect(max, `${lang}.news.maxPosts`).toBeLessThanOrEqual(12);
    }
  });
});

describe('feature card links', () => {
  it('resolve to a section that exists on the /features page', () => {
    for (const lang of LANGS) {
      const ids = new Set(DEFAULT_FEATURES_CONTENT[lang].sections.map((s) => s.id));
      for (const item of DEFAULT_LANDING_CONTENT[lang].features.items) {
        const target = featureLinkTarget(item);
        if (!target.startsWith('/features#')) continue;
        const anchor = target.slice('/features#'.length);
        expect(ids.has(anchor), `${lang}: feature "${item.title}" -> #${anchor} has no section`).toBe(true);
      }
    }
  });

  it('defaults to the card anchor and honours an explicit override', () => {
    expect(featureLinkTarget({ id: 'members', title: '', description: '', icon: '' }))
      .toBe('/features#members');
    expect(featureLinkTarget({
      id: 'members', title: '', description: '', icon: '', learnMoreUrl: 'https://example.org',
    })).toBe('https://example.org');
  });
});

describe('resolveLink', () => {
  it('classifies each link form', () => {
    expect(resolveLink('https://example.org')).toEqual({ kind: 'external', url: 'https://example.org' });
    expect(resolveLink('#contact')).toEqual({ kind: 'anchor', id: 'contact' });
    expect(resolveLink('/news')).toEqual({ kind: 'route', path: '/news' });
    expect(resolveLink('')).toEqual({ kind: 'none' });
    expect(resolveLink('   ')).toEqual({ kind: 'none' });
  });

  it('falls back only when no link is set', () => {
    expect(resolveLink('', '/login')).toEqual({ kind: 'route', path: '/login' });
    expect(resolveLink('/signup', '/login')).toEqual({ kind: 'route', path: '/signup' });
  });
});

describe('UI translations', () => {
  // The landing page reads nav, common and footer directly, so a key missing
  // from one language is a visible English leak rather than a silent fallback.
  it.each(['nav', 'common', 'footer'] as const)(
    '%s has an identical key set in all four languages',
    (section) => {
      const expected = Object.keys(translations.en[section]).sort();
      for (const lang of LANGS) {
        const actual = Object.keys(
          (translations[lang as Lang] as Record<string, Record<string, string>>)[section]
        ).sort();
        expect(actual, `${lang}.${section}`).toEqual(expected);
      }
    }
  );

  it('never renders an empty nav, common or footer string', () => {
    for (const lang of LANGS) {
      for (const section of ['nav', 'common', 'footer'] as const) {
        for (const [key, value] of Object.entries(translations[lang][section])) {
          expect(String(value).trim(), `${lang}.${section}.${key}`).not.toBe('');
        }
      }
    }
  });
});

describe('page string overrides', () => {
  it('applies a dotted override to the right section', () => {
    const tree = { nav: { plans: 'Plans' }, pages: { plans: 'Ministry Plans' } };
    const out = applyStringOverrides(tree, { 'nav.plans': 'Programme' });
    expect(out.nav.plans).toBe('Programme');
    expect(out.pages.plans).toBe('Ministry Plans');
  });

  it('still honours a legacy bare-leaf override', () => {
    const tree = { nav: { login: 'Login' } };
    expect(applyStringOverrides(tree, { login: 'Sign in' }).nav.login).toBe('Sign in');
  });

  it('treats a blank override as "use the default"', () => {
    const tree = { nav: { login: 'Login' } };
    expect(applyStringOverrides(tree, { 'nav.login': '   ' }).nav.login).toBe('Login');
  });

  it('ignores the _meta bookkeeping key', () => {
    const tree = { nav: { login: 'Login' } };
    expect(applyStringOverrides(tree, { _meta: 'x' }).nav.login).toBe('Login');
  });

  it('round-trips a key through overrideKey and leafOf', () => {
    expect(overrideKey('nav', 'login')).toBe('nav.login');
    expect(leafOf('nav.login')).toBe('login');
    expect(leafOf('login')).toBe('login');
  });
});
