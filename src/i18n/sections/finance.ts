/**
 * Finance, budget, tithe, pledge and voucher screens.
 *
 * Two levels only: this file supplies one flat `key -> string` object per
 * language. See src/i18n/translations.ts for why that shape is load-bearing.
 */
export const financeEn = {};

/**
 * Amharic is the default language, so a missing key here is a bug, not a
 * fallback. `Record` rather than `Partial<Record>` makes that a compile error.
 */
export const financeAm: Record<keyof typeof financeEn, string> = {};

/** Afaan Oromoo and Tigrinya fall through to English until translated. */
export const financeOm: Partial<Record<keyof typeof financeEn, string>> = {};
export const financeTi: Partial<Record<keyof typeof financeEn, string>> = {};
