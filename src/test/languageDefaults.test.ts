// @vitest-environment node
// Pure data assertions, no DOM — matching landingContent.test.ts, which pins
// node because the shared jsdom environment currently fails to start in this
// repo.
import { describe, expect, it, vi } from 'vitest';
import { readFileSync } from 'node:fs';

vi.mock('@/lib/firebase', () => ({ db: {}, auth: {}, firebaseConfig: {} }));
vi.mock('firebase/firestore', () => ({
  doc: () => ({}),
  getDoc: async () => ({ exists: () => false }),
  setDoc: async () => undefined,
}));

const { DEFAULT_LANGUAGE } = await import('@/contexts/LanguageContext');
const { LANGUAGE_CYCLE, LANGUAGE_ENDONYM, LANGUAGE_CODE, nextLanguage } = await import(
  '@/i18n/languages'
);
const { translations } = await import('@/i18n/translations');
const { localeFor } = await import('@/lib/ethiopian-calendar');
const { DEFAULT_FEATURES_CONTENT } = await import('@/services/featuresContent');

describe('Amharic is the default', () => {
  it('is the language a first-time visitor gets', () => {
    expect(DEFAULT_LANGUAGE).toBe('am');
  });

  it('is declared on <html> for the pre-JavaScript render', () => {
    // Whatever index.html ships with is what a screen reader announces until
    // React mounts, so it has to agree with DEFAULT_LANGUAGE rather than
    // sitting at the framework default of "en".
    const html = readFileSync('index.html', 'utf8');
    const lang = html.match(/<html[^>]*\slang="([^"]+)"/)?.[1];
    expect(lang).toBe(DEFAULT_LANGUAGE);
  });
});

describe('language switcher', () => {
  it('covers every language the app ships', () => {
    expect([...LANGUAGE_CYCLE].sort()).toEqual(Object.keys(translations).sort());
  });

  it('visits every language and returns to the start', () => {
    // The bug this replaces: a three-branch label on a four-language cycle, so
    // an Afaan Oromoo reader saw a button reading "ENGLISH" that in fact
    // switched to Tigrinya.
    const visited: string[] = [];
    let lang = LANGUAGE_CYCLE[0];
    for (let i = 0; i < LANGUAGE_CYCLE.length; i++) {
      visited.push(lang);
      lang = nextLanguage(lang);
    }
    expect(new Set(visited).size).toBe(LANGUAGE_CYCLE.length);
    expect(lang).toBe(LANGUAGE_CYCLE[0]);
  });

  it('labels every language, in its own script', () => {
    for (const lang of LANGUAGE_CYCLE) {
      expect(LANGUAGE_ENDONYM[lang]?.trim(), `endonym for ${lang}`).toBeTruthy();
      expect(LANGUAGE_CODE[lang]?.trim(), `code for ${lang}`).toBeTruthy();
    }
    // Endonyms, not English exonyms: a reader looking for their own language
    // scans for "አማርኛ", not for "Amharic".
    expect(LANGUAGE_ENDONYM.am).toMatch(/[ሀ-፿]/);
    expect(LANGUAGE_ENDONYM.ti).toMatch(/[ሀ-፿]/);
  });
});

describe('date formatting follows the app language', () => {
  it('gives every language a locale chain ending in a supported tag', () => {
    for (const lang of LANGUAGE_CYCLE) {
      const chain = localeFor(lang);
      expect(Array.isArray(chain), `${lang} must resolve to a chain`).toBe(true);
      expect(chain.length).toBeGreaterThan(0);
      // A lone unsupported tag resolves to the root locale and formats dates
      // in a way no reader recognises; the chain must end somewhere real.
      expect(chain[chain.length - 1]).toBe('en-GB');
    }
  });

  it('formats Amharic dates differently from English', () => {
    const d = new Date('2025-03-14T09:30:00Z');
    const am = new Intl.DateTimeFormat(localeFor('am'), { dateStyle: 'medium' }).format(d);
    const en = new Intl.DateTimeFormat(localeFor('en'), { dateStyle: 'medium' }).format(d);
    expect(am).not.toBe(en);
    expect(am).toMatch(/[ሀ-፿]/);
  });
});

describe('the public /features page', () => {
  it('is Amharic by default, not English', () => {
    // Every "Learn More" on the home page links here, so it was the largest
    // English surface on the public site.
    expect(DEFAULT_FEATURES_CONTENT.am).not.toBe(DEFAULT_FEATURES_CONTENT.en);
    expect(DEFAULT_FEATURES_CONTENT.am.subtitle).toMatch(/[ሀ-፿]/);
    expect(DEFAULT_FEATURES_CONTENT.am.sections.length).toBeGreaterThan(0);
    for (const section of DEFAULT_FEATURES_CONTENT.am.sections) {
      expect(section.title, `section ${section.id} title`).toMatch(/[ሀ-፿]/);
      expect(section.bullets.length).toBeGreaterThan(0);
      for (const b of section.bullets) expect(b).toMatch(/[ሀ-፿]/);
    }
  });

  it('keeps section ids stable across languages, since they are #anchors', () => {
    const ids = (c: { sections: { id: string }[] }) => c.sections.map((s) => s.id);
    expect(ids(DEFAULT_FEATURES_CONTENT.am)).toEqual(ids(DEFAULT_FEATURES_CONTENT.en));
  });
});
