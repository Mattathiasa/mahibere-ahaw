/**
 * Ethiopian Calendar Conversion Library
 * Uses the Julian Day Number (JDN) algorithm for exact conversions.
 *
 * Ethiopian calendar epoch: JDN 1723856 = Meskerem 1, year 1 (Ethiopian Era)
 * Ethiopian year is 7 years and ~8 months behind Gregorian.
 */

export interface EthiopianDate {
  year: number;
  month: number; // 1-13
  day: number;   // 1-30 (1-5/6 for Pagume)
  monthName: string;
  formatted: string;
}

/** The four languages the app ships. Mirrors `Language` in src/i18n. */
type MonthLang = 'en' | 'am' | 'om' | 'ti';

/**
 * Ethiopian month names per language.
 *
 * `name` (Amharic) and `englishName` are kept as aliases so the existing
 * callers — EthiopianDatePicker, Dashboard, Finance — keep working unchanged;
 * new code should use `monthName(id, lang)`.
 *
 * Tigrinya uses the same Ge'ez month names as Amharic. Afaan Oromoo uses the
 * Latin transliterations rather than invented translations, which is what
 * Oromo-language Ethiopian calendars in common use do.
 */
export const ETHIOPIAN_MONTHS = [
  { id: 1,  name: 'መስከረም', englishName: 'Meskerem', am: 'መስከረም', ti: 'መስከረም', om: 'Meskeraam' },
  { id: 2,  name: 'ጥቅምት',  englishName: 'Tikimt',   am: 'ጥቅምት',  ti: 'ጥቅምቲ',  om: 'Tiqimti'   },
  { id: 3,  name: 'ሕዳር',   englishName: 'Hidar',    am: 'ሕዳር',   ti: 'ሕዳር',   om: 'Hidaar'    },
  { id: 4,  name: 'ታኅሣሥ',  englishName: 'Tahsas',   am: 'ታኅሣሥ',  ti: 'ታሕሳስ',  om: 'Tahsaas'   },
  { id: 5,  name: 'ጥር',    englishName: 'Tir',      am: 'ጥር',    ti: 'ጥሪ',    om: 'Tiri'      },
  { id: 6,  name: 'የካቲት',  englishName: 'Yekatit',  am: 'የካቲት',  ti: 'ለካቲት',  om: 'Yakaatiit' },
  { id: 7,  name: 'መጋቢት',  englishName: 'Megabit',  am: 'መጋቢት',  ti: 'መጋቢት',  om: 'Magaabiit' },
  { id: 8,  name: 'ሚያዝያ',  englishName: 'Miyazya',  am: 'ሚያዝያ',  ti: 'ሚያዝያ',  om: 'Miyaaziyaa'},
  { id: 9,  name: 'ግንቦት',  englishName: 'Ginbot',   am: 'ግንቦት',  ti: 'ግንቦት',  om: 'Ginboot'   },
  { id: 10, name: 'ሰኔ',    englishName: 'Sene',     am: 'ሰኔ',    ti: 'ሰነ',    om: 'Seenee'    },
  { id: 11, name: 'ሐምሌ',   englishName: 'Hamle',    am: 'ሐምሌ',   ti: 'ሓምለ',   om: 'Hamlee'    },
  { id: 12, name: 'ነሐሴ',   englishName: 'Nehase',   am: 'ነሐሴ',   ti: 'ነሓሰ',   om: 'Nahaasee'  },
  { id: 13, name: 'ጳጉሜ',   englishName: 'Pagume',   am: 'ጳጉሜ',   ti: 'ጳጉሜ',   om: 'Phaagumee' },
];

/** An Ethiopian month's name in the reader's language. */
export function monthName(id: number, lang: MonthLang): string {
  const m = ETHIOPIAN_MONTHS[Math.min(Math.max(id, 1), 13) - 1] ?? ETHIOPIAN_MONTHS[0];
  return lang === 'en' ? m.englishName : m[lang];
}

/**
 * BCP-47 tags for `toLocaleDateString`, so Gregorian dates follow the language
 * the reader picked in the app rather than whatever their browser is set to.
 *
 * Returns a fallback *chain* rather than a single tag, which every `Intl`
 * constructor accepts. ICU coverage for `ti-ET` and especially `om-ET` is thin
 * and varies by browser and by OS; a lone unsupported tag silently resolves to
 * the root locale, which formats dates in a way no reader recognises. Ending
 * every chain at `en-GB` means the worst case is day/month order rather than
 * something arbitrary.
 */
export function localeFor(lang: string): string[] {
  switch (lang) {
    case 'am': return ['am-ET', 'am', 'en-GB'];
    case 'ti': return ['ti-ET', 'ti', 'am-ET', 'en-GB'];
    case 'om': return ['om-ET', 'om', 'en-GB'];
    default:   return ['en-GB'];
  }
}

const ETHIOPIC_EPOCH = 1723856; // JDN of Meskerem 1, Year 1

// ─── Julian Day Number helpers ────────────────────────────────────────────────

/** Gregorian calendar date → Julian Day Number */
function gregorianToJDN(year: number, month: number, day: number): number {
  const a = Math.floor((14 - month) / 12);
  const y = year + 4800 - a;
  const m = month + 12 * a - 3;
  return (
    day +
    Math.floor((153 * m + 2) / 5) +
    365 * y +
    Math.floor(y / 4) -
    Math.floor(y / 100) +
    Math.floor(y / 400) -
    32045
  );
}

/** Julian Day Number → Gregorian calendar date */
function jdnToGregorian(jdn: number): { year: number; month: number; day: number } {
  const a = jdn + 32044;
  const b = Math.floor((4 * a + 3) / 146097);
  const c = a - Math.floor((146097 * b) / 4);
  const d = Math.floor((4 * c + 3) / 1461);
  const e = c - Math.floor((1461 * d) / 4);
  const m = Math.floor((5 * e + 2) / 153);
  return {
    day:   e - Math.floor((153 * m + 2) / 5) + 1,
    month: m + 3 - 12 * Math.floor(m / 10),
    year:  100 * b + d - 4800 + Math.floor(m / 10),
  };
}

/** Ethiopian calendar date → Julian Day Number */
function ethiopianToJDN(year: number, month: number, day: number): number {
  return ETHIOPIC_EPOCH + 365 * (year - 1) + Math.floor(year / 4) + 30 * (month - 1) + day - 1;
}

/** Julian Day Number → Ethiopian calendar date */
function jdnToEthiopian(jdn: number): { year: number; month: number; day: number } {
  const r = (jdn - ETHIOPIC_EPOCH) % 1461;
  const n = r % 365 + 365 * Math.floor(r / 1460);
  const year  = 4 * Math.floor((jdn - ETHIOPIC_EPOCH) / 1461) + Math.floor(r / 365) - Math.floor(r / 1460);
  const month = Math.floor(n / 30) + 1;
  const day   = (n % 30) + 1;
  return { year, month, day };
}

// ─── Public API ───────────────────────────────────────────────────────────────

/** True when the Ethiopian year is a leap year (13th month has 6 days). */
export function isEthiopianLeapYear(ethYear: number): boolean {
  return ethYear % 4 === 3;
}

/**
 * Convert any date value (Date | ISO string | timestamp | null/undefined)
 * to a fully-populated EthiopianDate object.
 * Falls back to **today** when input is missing or invalid.
 */
export function toEthiopianDate(input?: Date | string | number | null): EthiopianDate {
  let d: Date;
  if (!input) {
    d = new Date();
  } else if (input instanceof Date) {
    d = input;
  } else {
    d = new Date(input);
  }
  if (isNaN(d.getTime())) d = new Date();

  const jdn = gregorianToJDN(d.getFullYear(), d.getMonth() + 1, d.getDate());
  const { year, month, day } = jdnToEthiopian(jdn);
  const monthObj = ETHIOPIAN_MONTHS[Math.min(month, 13) - 1] ?? ETHIOPIAN_MONTHS[0];

  return {
    year,
    month,
    day,
    monthName: monthObj.name,
    formatted: `${monthObj.name} ${day}, ${year} ዓ.ም.`,
  };
}

/**
 * Convert an Ethiopian date (year, month 1-13, day) to a JavaScript Date.
 * The returned Date object is at midnight local time.
 */
export function toGregorianDate(ethYear: number, ethMonth: number, ethDay: number): Date {
  const jdn = ethiopianToJDN(ethYear, ethMonth, ethDay);
  const { year, month, day } = jdnToGregorian(jdn);
  return new Date(year, month - 1, day);
}

/** Return today's date as an ISO string (YYYY-MM-DD). */
export function todayISO(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
}

/**
 * Returns an array of Ethiopian year numbers for pickers.
 * @param minYear earliest year (default 1990)
 * @param maxOffset years ahead of today (default 5)
 */
export function getEthiopianYearOptions(minYear = 1990, maxOffset = 5): number[] {
  const currentEthYear = toEthiopianDate().year;
  const years: number[] = [];
  for (let y = currentEthYear + maxOffset; y >= minYear; y--) {
    years.push(y);
  }
  return years;
}
