import type { Language } from './translations';

/**
 * The language switcher, in one place.
 *
 * Five components render a language button — DashboardLayout (twice), Login,
 * Home, Signup and PublicChrome — and each used to spell the cycle and its
 * labels out again. They drifted: DashboardLayout's compact button had three
 * branches for a four-language cycle, so an Afaan Oromoo reader saw a button
 * labelled "ENGLISH" that actually switched to Tigrinya. Adding a fifth
 * language would have meant finding all six sites.
 */

/** The order the toggle walks. Amharic sits first after English by design. */
export const LANGUAGE_CYCLE: readonly Language[] = ['en', 'am', 'om', 'ti'];

/**
 * Each language's endonym — the name it uses for itself.
 *
 * A reader looking for their own language scans for "አማርኛ", not for "Amharic":
 * the English exonym is only legible to someone who already reads English,
 * which is the wrong assumption for the button that escapes English.
 */
export const LANGUAGE_ENDONYM: Record<Language, string> = {
  en: 'English',
  am: 'አማርኛ',
  om: 'Afaan Oromoo',
  ti: 'ትግርኛ',
};

/** ISO 639-1 codes, for narrow buttons where an endonym will not fit. */
export const LANGUAGE_CODE: Record<Language, string> = {
  en: 'EN',
  am: 'AM',
  om: 'OM',
  ti: 'TI',
};

/** The language the toggle moves to next. Wraps around the end of the cycle. */
export function nextLanguage(current: Language): Language {
  const i = LANGUAGE_CYCLE.indexOf(current);
  return LANGUAGE_CYCLE[(i + 1) % LANGUAGE_CYCLE.length];
}
