export const homeEn = {
  title: 'Mahibere Ahaw Yekiristos Betekerstian',
  subtitle: 'Better Service for Everyone',
  description: "A renewed Orthodox Church that serves according to God's will revealed in the Holy Scripture.",
  getStarted: 'Get Started',
  learnMore: 'Learn More',
  galleryBadge: 'Photo Gallery',
  galleryTitle: 'Fellowship & Life in Service',
  galleryDescription: 'Moments of prayer, worship, fellowship, and church life across our congregations.',
  galleryShowcase: 'Showcase',
  galleryGrid: 'Mosaic',
  galleryPrevious: 'Previous photo',
  galleryNext: 'Next photo',
  galleryOpenFullscreen: 'View fullscreen',
  galleryClose: 'Close',
  gallerySlideCounter: 'Photo',
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
  galleryBadge: 'ፎቶ ጋለሪ',
  galleryTitle: 'ኅብረት እና ሕይወት በአገልግሎት',
  galleryDescription: 'በአጥቢያዎቻችን የጸሎት፣ የአምልኮ፣ የኅብረት እና የቤተክርስቲያን ሕይወት መታሰቢያዎች።',
  galleryShowcase: 'ማሳያ',
  galleryGrid: 'ሞዛይክ',
  galleryPrevious: 'ቀዳሚ ፎቶ',
  galleryNext: 'ቀጣይ ፎቶ',
  galleryOpenFullscreen: 'በሙሉ ማያ ይመልከቱ',
  galleryClose: 'ዝጋ',
  gallerySlideCounter: 'ፎቶ',
};

export const homeOm: Partial<Record<keyof typeof homeEn, string>> = {
  title: 'Waldaa Kiristaanaa Mahibere Ahaw',
  subtitle: 'Tajaajila Fooyya\'aa Hundaaf',
  description: 'Waldaa Ortodoksii haaraa fedha Waaqayyoo Macaafa Qulqulluu keessatti ibsameen tajaajiltu.',
  getStarted: 'Eegali',
  learnMore: 'Dabalata Baradhu',
  galleryBadge: 'Gaalerii Suuraa',
  galleryTitle: 'Tokkummaa fi Jireenya Tajaajilaa',
  galleryDescription: 'Yeroowwan kadhannaa, waaqeffannaa, tokkummaa fi jireenya waldaa keenyaa.',
  galleryShowcase: 'Agarsiisa',
  galleryGrid: 'Mozaayikii',
  galleryPrevious: 'Kan duraa',
  galleryNext: 'Itti aanu',
  galleryOpenFullscreen: 'Bal\'inaan ilaali',
  galleryClose: 'Cufi',
  gallerySlideCounter: 'Suuraa',
};

export const homeTi: Partial<Record<keyof typeof homeEn, string>> = {
  title: 'ማሕበረ ኣኀው ናይ ክርስቶስ ቤተክርስቲያን',
  subtitle: 'ዝሓሸ ኣገልግሎት ንኹሉ',
  description: 'ኣብ መጽሓፍ ቅዱስ ዝተገልጸ ፍቓድ ኣምላኽ እተገልግል ቤተክርስቲያን።',
  getStarted: 'ጀምር',
  learnMore: 'ተወሳኺ ፍለጥ',
  galleryBadge: 'ጋለሪ ስእሊ',
  galleryTitle: 'ሕብረትን ህይወትን ኣብ ኣገልግሎት',
  galleryDescription: 'ናይ ጸሎት፡ ኣምልኾ፡ ሕብረትን ህይወት ቤተክርስቲያንን ኣብ ኣጥቢያታትና ዝነበሩ ህሞታት።',
  galleryShowcase: 'መርኣዪ',
  galleryGrid: 'ሞዛይክ',
  galleryPrevious: 'ዝሓለፈ',
  galleryNext: 'ቀጻሊ',
  galleryOpenFullscreen: 'ብምሉእ ስክሪን ርአ',
  galleryClose: 'ዕጾ',
  gallerySlideCounter: 'ስእሊ',
};
