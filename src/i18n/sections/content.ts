/**
 * News, teachings, announcements, documents and other publishable content.
 *
 * Two levels only: this file supplies one flat `key -> string` object per
 * language. See src/i18n/translations.ts for why that shape is load-bearing.
 */
export const contentEn = {};

/**
 * Amharic is the default language, so a missing key here is a bug, not a
 * fallback. `Record` rather than `Partial<Record>` makes that a compile error.
 */
export const contentAm: Record<keyof typeof contentEn, string> = {};

/** Afaan Oromoo and Tigrinya fall through to English until translated. */
export const contentOm: Partial<Record<keyof typeof contentEn, string>> = {};
export const contentTi: Partial<Record<keyof typeof contentEn, string>> = {};
