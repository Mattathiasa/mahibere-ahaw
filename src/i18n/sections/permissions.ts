/**
 * Labels, descriptions and group names for `PERMISSION_META` (src/lib/rolePermissions.ts). Keyed `<permissionKey>Label` / `<permissionKey>Desc` / `group<Name>`.
 *
 * Two levels only: this file supplies one flat `key -> string` object per
 * language. See src/i18n/translations.ts for why that shape is load-bearing.
 */
export const permissionsEn = {};

/**
 * Amharic is the default language, so a missing key here is a bug, not a
 * fallback. `Record` rather than `Partial<Record>` makes that a compile error.
 */
export const permissionsAm: Record<keyof typeof permissionsEn, string> = {};

/** Afaan Oromoo and Tigrinya fall through to English until translated. */
export const permissionsOm: Partial<Record<keyof typeof permissionsEn, string>> = {};
export const permissionsTi: Partial<Record<keyof typeof permissionsEn, string>> = {};
