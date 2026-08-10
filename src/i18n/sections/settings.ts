export const settingsEn = {
  profile: 'Profile',
  notifications: 'Notifications',
  appearance: 'Appearance',
  language: 'Language',
  security: 'Security',
  system: 'System',
  switchToDark: 'Switch to Dark Mode',
  switchToLight: 'Switch to Light Mode',
};

/**
 * Amharic is the default language, so a missing key here is a bug, not a
 * fallback. `Record` rather than `Partial<Record>` makes that a compile error.
 */
export const settingsAm: Record<keyof typeof settingsEn, string> = {
  profile: 'መገለጫ',
  notifications: 'ማሳወቂያዎች',
  appearance: 'መልክ',
  language: 'ቋንቋ',
  security: 'ደህንነት',
  system: 'ስርዓት',
  switchToDark: 'ወደ ጨለማ ሁነታ ቀይር',
  switchToLight: 'ወደ ብርሃን ሁነታ ቀይር',
};

export const settingsOm: Partial<Record<keyof typeof settingsEn, string>> = {
  profile: 'Piroofayilii',
  notifications: 'Beeksisa',
  appearance: 'Bifa',
  language: 'Afaan',
  security: 'Nageenya',
  system: 'Sirna',
  switchToDark: 'Bifa Gurraachatti Jijjiiri',
  switchToLight: 'Bifa Ifatti Jijjiiri',
};

export const settingsTi: Partial<Record<keyof typeof settingsEn, string>> = {
  profile: 'ፕሮፋይል',
  notifications: 'መፍለጢታት',
  appearance: 'ትርኢት',
  language: 'ቋንቋ',
  security: 'ድሕነት',
  system: 'ስርዓት',
  switchToDark: 'ናብ ጸልማት ቅዲ ቀይር',
  switchToLight: 'ናብ ብርሃን ቅዲ ቀይር',
};
