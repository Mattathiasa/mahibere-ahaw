/**
 * Place names — regions, zones and other geography rendered as labels.
 *
 * Two levels only: this file supplies one flat `key -> string` object per
 * language. See src/i18n/translations.ts for why that shape is load-bearing.
 */
export const geoEn = {};

/**
 * Amharic is the default language, so a missing key here is a bug, not a
 * fallback. `Record` rather than `Partial<Record>` makes that a compile error.
 */
export const geoAm: Record<keyof typeof geoEn, string> = {};

/** Afaan Oromoo and Tigrinya fall through to English until translated. */
export const geoOm: Partial<Record<keyof typeof geoEn, string>> = {};
export const geoTi: Partial<Record<keyof typeof geoEn, string>> = {};
