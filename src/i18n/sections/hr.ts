/**
 * Human resources, payroll and employee record screens.
 *
 * Two levels only: this file supplies one flat `key -> string` object per
 * language. See src/i18n/translations.ts for why that shape is load-bearing.
 */
export const hrEn = {};

/**
 * Amharic is the default language, so a missing key here is a bug, not a
 * fallback. `Record` rather than `Partial<Record>` makes that a compile error.
 */
export const hrAm: Record<keyof typeof hrEn, string> = {};

/** Afaan Oromoo and Tigrinya fall through to English until translated. */
export const hrOm: Partial<Record<keyof typeof hrEn, string>> = {};
export const hrTi: Partial<Record<keyof typeof hrEn, string>> = {};
