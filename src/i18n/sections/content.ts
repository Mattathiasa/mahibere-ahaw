/**
 * News, teachings, announcements, documents and other publishable content.
 *
 * `serviceType*` labels a value PERSISTED on the teaching record. Those tokens
 * contain spaces and apostrophes ("Men's Breakfast"), so they cannot be key
 * suffixes the way the `status` enums are — the token-to-key map lives beside
 * the list in CreateTeachingDialog. The token itself is never translated.
 *
 * Two levels only: this file supplies one flat `key -> string` object per
 * language. See src/i18n/translations.ts for why that shape is load-bearing.
 */
export const contentEn = {
  // ── Service types (persisted) ─────────────────────────────────────────────
  serviceTypeSundayMorning: 'Sunday morning',
  serviceTypeWednesdayBibleStudy: 'Wednesday Bible study',
  serviceTypeMensBreakfast: "Men's breakfast",
  serviceTypeWomensMinistry: "Women's ministry",
  serviceTypeYouthService: 'Youth service',
  serviceTypeSpecialEvent: 'Special event',
  serviceTypeOther: 'Other',

  // ── Teaching editor: tabs ─────────────────────────────────────────────────
  tabMetadata: 'Metadata',
  tabPublicHeader: 'Public header',
  tabMainContent: 'Main content',
  tabEngagement: 'Engagement',
  tabFooterLegal: 'Footer & legal',

  // ── Teaching editor: fields ───────────────────────────────────────────────
  createTeaching: 'Create new teaching',
  teachingTitle: 'Teaching title *',
  teachingTitlePlaceholder: 'e.g., Born Again: A Nighttime Encounter',
  speaker: 'Speaker / teacher *',
  speakerPlaceholder: 'Pastor name',
  series: 'Series',
  seriesPlaceholder: 'e.g., Gospel of John',
  seriesPart: 'Series part',
  seriesPartPlaceholder: 'e.g., Part 3 of 12',
  serviceType: 'Service type',
  status: 'Status',
  primaryScripture: 'Primary scripture *',
  primaryScripturePlaceholder: 'e.g., John 3:1-21',
  supportingScriptures: 'Supporting scriptures',
  addScripturePlaceholder: 'Add scripture reference',
  tags: 'Tags / key topics',
  addTagPlaceholder: 'Add tag (e.g. Salvation)',
  targetAudience: 'Target audience',
  targetAudiencePlaceholder: 'e.g., New Believers',
  featuredImageUrl: 'Featured image URL',
  preview: 'Preview',
  shortDescription: 'Short description / blurb *',
  shortDescriptionPlaceholder: "1-2 sentences summarizing the teaching's core message.",
  mediaEmbedUrl: 'Media embed URL',
  mediaEmbedPlaceholder: 'YouTube, Vimeo, or audio link',
  mediaType: 'Media type',
  mediaVideo: 'Video',
  mediaAudio: 'Audio',
  fullTranscript: 'Full transcript / notes',
  fullTranscriptPlaceholder: 'Paste full text here...',
  sermonOutline: 'Sermon outline',
  outlinePlaceholder: 'Add outline point (e.g., I. Introduction)',
  keyQuotations: 'Key quotations',
  quotePlaceholder: 'Add a memorable quote',
  discussionQuestions: 'Discussion questions',
  questionPlaceholder: 'Add question for small groups',
  weeklyChallenge: 'Weekly challenge',
  weeklyChallengePlaceholder: 'Specific practical action step',
  digitalConnection: 'Digital connection point',
  digitalConnectionPlaceholder: "e.g. Text 'BORNAGAIN' to 55555",
  relatedResources: 'Related resources',
  resourceTitle: 'Title',
  resourceTitlePlaceholder: 'Resource title',
  copyrightNotice: 'Copyright notice',
  speakerBio: 'Speaker bio',
  speakerBioPlaceholder: 'Brief bio...',
  contactFollowUp: 'Contact for follow-up',
  contactFollowUpPlaceholder: 'email@church.org',

  // ── Shared list actions ───────────────────────────────────────────────────
  add: 'Add',

  // ── Toasts ────────────────────────────────────────────────────────────────
  teachingCreated: 'Teaching created.',
  teachingMissingFields: 'Please fill in the required fields (title, speaker, date).',

  // ── News editor ───────────────────────────────────────────────────────────
  headOffice: 'Head office',
  coverImageSet: 'Cover image set',
  uploadCoverImage: 'Upload cover image',
  addGalleryPhotos: 'Add gallery photos',
  setAsCoverImage: 'Set as cover image',
  removePhoto: 'Remove photo',
  excerptPlaceholder: 'One or two sentences shown on the homepage card.',
  bodyPlaceholder: 'Write the article. Blank lines start a new paragraph.',

  // ── Import dialogs ────────────────────────────────────────────────────────
  chooseFile: 'Choose CSV or Excel file',
  supportedFormats: 'Supported formats: .csv, .xlsx',
  selectFileFirst: 'Please select a CSV or Excel file to import.',
  assetsImported: 'Assets imported.',
  assetsImportFailed: 'Could not import the assets file.',
  selectCsvFirst: 'Please select a CSV file.',
  employeesImported: 'Employees imported.',
  employeesImportFailed: 'Could not import the employees file.',
};

/**
 * Amharic is the default language, so a missing key here is a bug, not a
 * fallback. `Record` rather than `Partial<Record>` makes that a compile error.
 */
export const contentAm: Record<keyof typeof contentEn, string> = {
  serviceTypeSundayMorning: 'የእሑድ ጠዋት',
  serviceTypeWednesdayBibleStudy: 'የረቡዕ የመጽሐፍ ቅዱስ ጥናት',
  serviceTypeMensBreakfast: 'የወንዶች ቁርስ',
  serviceTypeWomensMinistry: 'የሴቶች አገልግሎት',
  serviceTypeYouthService: 'የወጣቶች አገልግሎት',
  serviceTypeSpecialEvent: 'ልዩ ዝግጅት',
  serviceTypeOther: 'ሌላ',

  tabMetadata: 'ተጨማሪ መረጃ',
  tabPublicHeader: 'ይፋዊ ራስጌ',
  tabMainContent: 'ዋና ይዘት',
  tabEngagement: 'ተሳትፎ',
  tabFooterLegal: 'ግርጌና ሕጋዊ',

  createTeaching: 'አዲስ ትምህርት ፍጠር',
  teachingTitle: 'የትምህርቱ ርዕስ *',
  teachingTitlePlaceholder: 'ለምሳሌ ዳግም መወለድ፦ የሌሊት ግንኙነት',
  speaker: 'አስተማሪ / ሰባኪ *',
  speakerPlaceholder: 'የአገልጋዩ ስም',
  series: 'ተከታታይ',
  seriesPlaceholder: 'ለምሳሌ የዮሐንስ ወንጌል',
  seriesPart: 'የተከታታዩ ክፍል',
  seriesPartPlaceholder: 'ለምሳሌ ከ12 ክፍል 3ኛው',
  serviceType: 'የአገልግሎት ዓይነት',
  status: 'ሁኔታ',
  primaryScripture: 'ዋና ጥቅስ *',
  primaryScripturePlaceholder: 'ለምሳሌ ዮሐንስ 3፥1-21',
  supportingScriptures: 'ደጋፊ ጥቅሶች',
  addScripturePlaceholder: 'የጥቅስ ማጣቀሻ ጨምር',
  tags: 'መለያዎች / ቁልፍ ርዕሶች',
  addTagPlaceholder: 'መለያ ጨምር (ለምሳሌ ድኅነት)',
  targetAudience: 'ዒላማ ተደራሲ',
  targetAudiencePlaceholder: 'ለምሳሌ አዲስ አማኞች',
  featuredImageUrl: 'የመሪ ምስል አድራሻ',
  preview: 'ቅድመ ዕይታ',
  shortDescription: 'አጭር መግለጫ *',
  shortDescriptionPlaceholder: 'የትምህርቱን ዋና መልእክት በ1-2 ዓረፍተ ነገር ያጠቃልሉ።',
  mediaEmbedUrl: 'የሚዲያ አድራሻ',
  mediaEmbedPlaceholder: 'የዩቲዩብ፣ የቪሜኦ ወይም የድምፅ አገናኝ',
  mediaType: 'የሚዲያ ዓይነት',
  mediaVideo: 'ቪዲዮ',
  mediaAudio: 'ድምፅ',
  fullTranscript: 'ሙሉ ጽሑፍ / ማስታወሻ',
  fullTranscriptPlaceholder: 'ሙሉ ጽሑፉን እዚህ ይለጥፉ...',
  sermonOutline: 'የስብከቱ ዝርዝር',
  outlinePlaceholder: 'የዝርዝር ነጥብ ጨምር (ለምሳሌ ፩. መግቢያ)',
  keyQuotations: 'ቁልፍ ጥቅሶች',
  quotePlaceholder: 'የሚታወስ ጥቅስ ጨምር',
  discussionQuestions: 'የውይይት ጥያቄዎች',
  questionPlaceholder: 'ለንዑሳን ቡድኖች ጥያቄ ጨምር',
  weeklyChallenge: 'ሳምንታዊ ተግዳሮት',
  weeklyChallengePlaceholder: 'የተለየ ተግባራዊ እርምጃ',
  digitalConnection: 'የዲጂታል መገናኛ ነጥብ',
  digitalConnectionPlaceholder: "ለምሳሌ 'BORNAGAIN' ብለው ወደ 55555 ይላኩ",
  relatedResources: 'ተዛማጅ ግብዓቶች',
  resourceTitle: 'ርዕስ',
  resourceTitlePlaceholder: 'የግብዓቱ ርዕስ',
  copyrightNotice: 'የቅጂ መብት ማስታወቂያ',
  speakerBio: 'የአስተማሪው አጭር የሕይወት ታሪክ',
  speakerBioPlaceholder: 'አጭር የሕይወት ታሪክ...',
  contactFollowUp: 'ለክትትል የሚያገለግል አድራሻ',
  contactFollowUpPlaceholder: 'email@church.org',

  add: 'ጨምር',

  teachingCreated: 'ትምህርቱ ተፈጥሯል።',
  teachingMissingFields: 'እባክዎ የሚያስፈልጉትን መስኮች ይሙሉ (ርዕስ፣ አስተማሪ፣ ቀን)።',

  headOffice: 'ጠቅላይ ጽ/ቤት',
  coverImageSet: 'የሽፋን ምስሉ ተቀምጧል',
  uploadCoverImage: 'የሽፋን ምስል ጫን',
  addGalleryPhotos: 'የማዕከለ ስዕላት ፎቶዎችን ጨምር',
  setAsCoverImage: 'እንደ ሽፋን ምስል አድርግ',
  removePhoto: 'ፎቶውን አስወግድ',
  excerptPlaceholder: 'በዋና ገፅ ካርድ ላይ የሚታይ አንድ ወይም ሁለት ዓረፍተ ነገር።',
  bodyPlaceholder: 'ጽሑፉን ይጻፉ። ባዶ መስመር አዲስ አንቀጽ ይጀምራል።',

  chooseFile: 'የCSV ወይም የExcel ፋይል ይምረጡ',
  supportedFormats: 'የሚደገፉ ቅርጸቶች፦ .csv, .xlsx',
  selectFileFirst: 'እባክዎ ለማስመጣት የCSV ወይም የExcel ፋይል ይምረጡ።',
  assetsImported: 'ንብረቶቹ ገብተዋል።',
  assetsImportFailed: 'የንብረት ፋይሉን ማስመጣት አልተቻለም።',
  selectCsvFirst: 'እባክዎ የCSV ፋይል ይምረጡ።',
  employeesImported: 'ሠራተኞቹ ገብተዋል።',
  employeesImportFailed: 'የሠራተኛ ፋይሉን ማስመጣት አልተቻለም።',
};

/** Afaan Oromoo and Tigrinya fall through to English until translated. */
export const contentOm: Partial<Record<keyof typeof contentEn, string>> = {};
export const contentTi: Partial<Record<keyof typeof contentEn, string>> = {};
