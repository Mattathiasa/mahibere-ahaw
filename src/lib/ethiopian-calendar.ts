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

export const ETHIOPIAN_MONTHS = [
  { id: 1,  name: 'መስከረም', englishName: 'Meskerem' },
  { id: 2,  name: 'ጥቅምት',  englishName: 'Tikimt'   },
  { id: 3,  name: 'ሕዳር',   englishName: 'Hidar'    },
  { id: 4,  name: 'ታኅሣሥ',  englishName: 'Tahsas'   },
  { id: 5,  name: 'ጥር',    englishName: 'Tir'      },
  { id: 6,  name: 'የካቲት',  englishName: 'Yekatit'  },
  { id: 7,  name: 'መጋቢት',  englishName: 'Megabit'  },
  { id: 8,  name: 'ሚያዝያ',  englishName: 'Miyazya'  },
  { id: 9,  name: 'ግንቦት',  englishName: 'Ginbot'   },
  { id: 10, name: 'ሰኔ',    englishName: 'Sene'     },
  { id: 11, name: 'ሐምሌ',   englishName: 'Hamle'    },
  { id: 12, name: 'ነሐሴ',   englishName: 'Nehase'   },
  { id: 13, name: 'ጳጉሜ',   englishName: 'Pagume'   },
];

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
