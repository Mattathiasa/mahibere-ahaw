export const footerEn = {
  description: 'Integrating ancient spiritual values with the precision of modern engineering.',
  platform: 'Platform',
  support: 'Support',
  stayConnected: 'Stay Connected',
  copyright: '© 2025 Mahibere Ahaw Ecosystem.',
  platformDashboard: 'Dashboard',
  platformCommunity: 'Community',
  platformAnalytics: 'Analytics',
  platformSecurity: 'Security',
  supportDocumentation: 'Documentation',
  supportApiReference: 'API Reference',
  supportHelpCenter: 'Help Center',
  supportStatus: 'Status',
  emailPlaceholder: 'Email Address',
  privacyArchitecture: 'Privacy Architecture',
  termsOfFaith: 'Terms of Faith',
};

/**
 * Amharic is the default language, so a missing key here is a bug, not a
 * fallback. `Record` rather than `Partial<Record>` makes that a compile error.
 */
export const footerAm: Record<keyof typeof footerEn, string> = {
  description: 'የጥንታዊ መንፈሳዊ እሴቶችን ከዘመናዊ ምህንድስና ትክክለኛነት ጋር በማዋሃድ።',
  platform: 'መድረክ',
  support: 'ድጋፍ',
  stayConnected: 'ተገናኝተው ይቆዩ',
  copyright: '© 2025 ማኅበረ አኀው ስነ-ምህዳር።',
  platformDashboard: 'ዳሽቦርድ',
  platformCommunity: 'ማህበረሰብ',
  platformAnalytics: 'ትንታኔዎች',
  platformSecurity: 'ደህንነት',
  supportDocumentation: 'ሰነዶች',
  supportApiReference: 'የኤፒአይ ማጣቀሻ',
  supportHelpCenter: 'የእገዛ ማዕከል',
  supportStatus: 'ሁኔታ',
  emailPlaceholder: 'የኢሜይል አድራሻ',
  privacyArchitecture: 'የግላዊነት አርክቴክቸር',
  termsOfFaith: 'የእምነት ውሎች',
};

export const footerOm: Partial<Record<keyof typeof footerEn, string>> = {
  description: 'Aadaa hafuuraa durii fi ogummaa injinariingii ammayyaa waliin makuun.',
  platform: 'Pilaatfoormii',
  support: 'Deggersa',
  stayConnected: 'Waliin Turi',
  copyright: '© 2025 Mahibere Ahaw Ecosystem.',
  platformDashboard: 'Daashboordii',
  platformCommunity: 'Hawaasa',
  platformAnalytics: 'Xiinxala',
  platformSecurity: 'Nageenya',
  supportDocumentation: 'Sanadoota',
  supportApiReference: 'API',
  supportHelpCenter: 'Giddu-gala Gargaarsaa',
  supportStatus: 'Haala Hojii',
  emailPlaceholder: 'Imeelii',
  privacyArchitecture: 'Icciitii',
  termsOfFaith: 'Waliigaltee',
};

export const footerTi: Partial<Record<keyof typeof footerEn, string>> = {
  description: 'ጥንታዊ መንፈሳዊ ክብርታት ምስ ዘመናዊ ምህንድስና ብምውህሃድ።',
  platform: 'መድረኽ',
  support: 'ደገፍ',
  stayConnected: 'ተራኺብኩም ጽንሑ',
  copyright: '© 2025 ማሕበረ ኣኀው።',
  platformDashboard: 'ዳሽቦርድ',
  platformCommunity: 'ማሕበረሰብ',
  platformAnalytics: 'ትንተና',
  platformSecurity: 'ድሕነት',
  supportDocumentation: 'ሰነዳት',
  supportApiReference: 'ናይ API መወከሲ',
  supportHelpCenter: 'ማእከል ሓገዝ',
  supportStatus: 'ኩነታት',
  emailPlaceholder: 'ኢመይል ኣድራሻ',
  privacyArchitecture: 'ውልቃዊ ሓበሬታ',
  termsOfFaith: 'ውዕላት እምነት',
};
