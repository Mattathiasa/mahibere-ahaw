/**
 * Asset register and inventory screens.
 *
 * Two levels only: this file supplies one flat `key -> string` object per
 * language. See src/i18n/translations.ts for why that shape is load-bearing.
 */
export const inventoryEn = {};

/**
 * Amharic is the default language, so a missing key here is a bug, not a
 * fallback. `Record` rather than `Partial<Record>` makes that a compile error.
 */
export const inventoryAm: Record<keyof typeof inventoryEn, string> = {};

/** Afaan Oromoo and Tigrinya fall through to English until translated. */
export const inventoryOm: Partial<Record<keyof typeof inventoryEn, string>> = {};
export const inventoryTi: Partial<Record<keyof typeof inventoryEn, string>> = {};
