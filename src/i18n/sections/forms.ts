/**
 * Field labels, placeholders and validation messages shared across forms, wizards and dialogs. The most reused section — check here before adding a key elsewhere.
 *
 * Two levels only: this file supplies one flat `key -> string` object per
 * language. See src/i18n/translations.ts for why that shape is load-bearing.
 */
export const formsEn = {};

/**
 * Amharic is the default language, so a missing key here is a bug, not a
 * fallback. `Record` rather than `Partial<Record>` makes that a compile error.
 */
export const formsAm: Record<keyof typeof formsEn, string> = {};

/** Afaan Oromoo and Tigrinya fall through to English until translated. */
export const formsOm: Partial<Record<keyof typeof formsEn, string>> = {};
export const formsTi: Partial<Record<keyof typeof formsEn, string>> = {};
