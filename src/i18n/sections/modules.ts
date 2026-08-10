/**
 * Built-in defaults for the admin-configurable module registry (src/services/moduleConfig.ts). An admin's saved override wins; a blank override falls back to these.
 *
 * Two levels only: this file supplies one flat `key -> string` object per
 * language. See src/i18n/translations.ts for why that shape is load-bearing.
 */
export const modulesEn = {};

/**
 * Amharic is the default language, so a missing key here is a bug, not a
 * fallback. `Record` rather than `Partial<Record>` makes that a compile error.
 */
export const modulesAm: Record<keyof typeof modulesEn, string> = {};

/** Afaan Oromoo and Tigrinya fall through to English until translated. */
export const modulesOm: Partial<Record<keyof typeof modulesEn, string>> = {};
export const modulesTi: Partial<Record<keyof typeof modulesEn, string>> = {};
