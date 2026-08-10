export const homeEn = {
  title: 'Mahibere Ahaw Yekiristos Betekerstian',
  subtitle: 'Better Service for Everyone',
  description: "A renewed Orthodox Church that serves according to God's will revealed in the Holy Scripture.",
  getStarted: 'Get Started',
  learnMore: 'Learn More',
};

/**
 * Amharic is the default language, so a missing key here is a bug, not a
 * fallback. `Record` rather than `Partial<Record>` makes that a compile error.
 */
export const homeAm: Record<keyof typeof homeEn, string> = {
  title: 'ማኅበረ አኀው የክርስቶስ ቤተክርስቲያን',
  subtitle: 'የተሻለ አገልግሎት ለሁሉም ይደረጋል',
  description: 'በመጽሐፍ ቅዱስ የተገለጠውን የእግዚአብሔርን ሃሳብ የምታገለግል ቤተክርስቲያን።',
  getStarted: 'እንቀሳቀስ በመጀመሪያ?',
  learnMore: 'ተጨማሪ ይመልከቱ',
};

export const homeOm: Partial<Record<keyof typeof homeEn, string>> = {
  title: 'Waldaa Kiristaanaa Mahibere Ahaw',
  subtitle: 'Tajaajila Fooyya\'aa Hundaaf',
  description: 'Waldaa Ortodoksii haaraa fedha Waaqayyoo Macaafa Qulqulluu keessatti ibsameen tajaajiltu.',
  getStarted: 'Eegali',
  learnMore: 'Dabalata Baradhu',
};

export const homeTi: Partial<Record<keyof typeof homeEn, string>> = {
  title: 'ማሕበረ ኣኀው ናይ ክርስቶስ ቤተክርስቲያን',
  subtitle: 'ዝሓሸ ኣገልግሎት ንኹሉ',
  description: 'ኣብ መጽሓፍ ቅዱስ ዝተገልጸ ፍቓድ ኣምላኽ እተገልግል ቤተክርስቲያን።',
  getStarted: 'ጀምር',
  learnMore: 'ተወሳኺ ፍለጥ',
};
