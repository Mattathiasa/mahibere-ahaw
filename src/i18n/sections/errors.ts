/**
 * User-facing error text thrown by service modules via `AppError` and resolved at the catch site with `errorMessage(t, e)`.
 *
 * Two levels only: this file supplies one flat `key -> string` object per
 * language. See src/i18n/translations.ts for why that shape is load-bearing.
 */
export const errorsEn = {};

/**
 * Amharic is the default language, so a missing key here is a bug, not a
 * fallback. `Record` rather than `Partial<Record>` makes that a compile error.
 */
export const errorsAm: Record<keyof typeof errorsEn, string> = {};

/** Afaan Oromoo and Tigrinya fall through to English until translated. */
export const errorsOm: Partial<Record<keyof typeof errorsEn, string>> = {};
export const errorsTi: Partial<Record<keyof typeof errorsEn, string>> = {};
