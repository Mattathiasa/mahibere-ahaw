/**
 * Place names — regions, zones and other geography rendered as labels.
 *
 * Two levels only: this file supplies one flat `key -> string` object per
 * language. See src/i18n/translations.ts for why that shape is load-bearing.
 */
export const geoEn = {
  // ── Ethiopian regions (persisted values) ──────────────────────────────────
  regionAddisAbaba: "Addis Ababa",
  regionAfar: "Afar",
  regionAmhara: "Amhara",
  regionBenishangulGumuz: "Benishangul-Gumuz",
  regionDireDawa: "Dire Dawa",
  regionGambela: "Gambela",
  regionHarari: "Harari",
  regionOromia: "Oromia",
  regionSidama: "Sidama",
  regionSomali: "Somali",
  regionSnnpr: "Southern Nations, Nationalities, and Peoples Region",
  regionTigray: "Tigray",
};

/**
 * Amharic is the default language, so a missing key here is a bug, not a
 * fallback. `Record` rather than `Partial<Record>` makes that a compile error.
 */
export const geoAm: Record<keyof typeof geoEn, string> = {
  // ── Ethiopian regions ─────────────────────────────────────────────────────
  regionAddisAbaba: "አዲስ አበባ",
  regionAfar: "አፋር",
  regionAmhara: "አማራ",
  regionBenishangulGumuz: "ቤንሻንጉል ጉሙዝ",
  regionDireDawa: "ድሬዳዋ",
  regionGambela: "ጋምቤላ",
  regionHarari: "ሐረሪ",
  regionOromia: "ኦሮሚያ",
  regionSidama: "ሲዳማ",
  regionSomali: "ሶማሌ",
  regionSnnpr: "የደቡብ ብሔሮች፣ ብሔረሰቦችና ሕዝቦች ክልል",
  regionTigray: "ትግራይ",
};

/** Afaan Oromoo and Tigrinya fall through to English until translated. */
export const geoOm: Partial<Record<keyof typeof geoEn, string>> = {};
export const geoTi: Partial<Record<keyof typeof geoEn, string>> = {};
