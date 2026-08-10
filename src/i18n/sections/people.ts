/**
 * Members, congregation, user management and membership request screens.
 *
 * Two levels only: this file supplies one flat `key -> string` object per
 * language. See src/i18n/translations.ts for why that shape is load-bearing.
 */
export const peopleEn = {
  ministrySundaySchool: 'Sunday school',
  ministryYouthMinistry: 'Youth ministry',
  ministryWomenMinistry: 'Women ministry',
  ministryChoir: 'Choir',
  ministryDeaconService: 'Deacon service',
  ministryPrayerTeam: 'Prayer team',
  ministryMediaMinistry: 'Media ministry',
};

/**
 * Amharic is the default language, so a missing key here is a bug, not a
 * fallback. `Record` rather than `Partial<Record>` makes that a compile error.
 */
export const peopleAm: Record<keyof typeof peopleEn, string> = {
  ministrySundaySchool: 'ሰንበት ትምህርት ቤት',
  ministryYouthMinistry: 'የወጣቶች አገልግሎት',
  ministryWomenMinistry: 'የሴቶች አገልግሎት',
  ministryChoir: 'መዘምራን',
  ministryDeaconService: 'የዲያቆናት አገልግሎት',
  ministryPrayerTeam: 'የጸሎት ቡድን',
  ministryMediaMinistry: 'የሚዲያ አገልግሎት',
};

/** Afaan Oromoo and Tigrinya fall through to English until translated. */
export const peopleOm: Partial<Record<keyof typeof peopleEn, string>> = {};
export const peopleTi: Partial<Record<keyof typeof peopleEn, string>> = {};
