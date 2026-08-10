/**
 * The church organisational structure — body names and their duties, transcribed from the bylaws. Duties are flattened to indexed keys (`sinodosRole1`) because the override layer skips arrays.
 *
 * Two levels only: this file supplies one flat `key -> string` object per
 * language. See src/i18n/translations.ts for why that shape is load-bearing.
 */
export const structureEn = {};

/**
 * Amharic is the default language, so a missing key here is a bug, not a
 * fallback. `Record` rather than `Partial<Record>` makes that a compile error.
 */
export const structureAm: Record<keyof typeof structureEn, string> = {};

/** Afaan Oromoo and Tigrinya fall through to English until translated. */
export const structureOm: Partial<Record<keyof typeof structureEn, string>> = {};
export const structureTi: Partial<Record<keyof typeof structureEn, string>> = {};
