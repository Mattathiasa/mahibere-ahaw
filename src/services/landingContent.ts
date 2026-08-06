import { db } from '@/lib/firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import type { Language } from '@/i18n/translations';

// ─── Content shape (language-agnostic structure) ──────────────────────────────

export interface LandingFeature {
  id: string;
  title: string;
  description: string;
  icon: string; // lucide icon name
}

export interface LandingStat {
  label: string;
  value: string;
  icon: string;
}

export interface LandingBank {
  name: string;
  account: string;
}

export interface LandingContent {
  hero: {
    badge: string;
    title: string;
    titleHighlight: string;
    description: string;
    ctaPrimary: string;
    ctaSecondary: string;
    statsCard1Label: string;
    statsCard1Value: string;
    statsCard2Label: string;
    statsCard2Value: string;
    /** Optional Cloudinary (or any) hero image URL; empty = use bundled default. */
    imageUrl?: string;
  };
  /** Auto-advancing photo carousel (Cloudinary URLs); ~4-5 images. */
  carousel?: string[];
  stats: LandingStat[];
  features: {
    sectionTitle: string;
    sectionDescription: string;
    items: LandingFeature[];
  };
  support: {
    badge: string;
    title: string;
    description: string;
    missionTitle: string;
    missionStatement: string;
    banks: LandingBank[];
  };
  /**
   * Public contact block rendered as its own homepage section. Distinct from
   * `footer`, which only carries the small social icon row.
   */
  contact: {
    badge: string;
    sectionTitle: string;
    sectionDescription: string;
    addressLabel: string;
    address: string;
    phoneLabel: string;
    /** One or more public phone numbers, rendered as `tel:` links. */
    phones: string[];
    emailLabel: string;
    /** One or more public addresses, rendered as `mailto:` links. */
    emails: string[];
    hoursLabel: string;
    hours: string;
    /** Google Maps (or any) link shown as "Open in Maps". */
    mapUrl?: string;
    socialsLabel: string;
    youtube?: string;
    telegram?: string;
    facebook?: string;
    tiktok?: string;
    website?: string;
  };
  footer: {
    description: string;
    email: string;
    copyright: string;
    youtube?: string;
    telegram?: string;
    phone?: string;
  };
}

/**
 * Canonical public contact details. Kept in one place so the four language
 * defaults below cannot drift apart — only the *labels* are translated, the
 * numbers and URLs themselves are language-independent.
 */
const CONTACT_CHANNELS = {
  youtube: 'https://www.youtube.com/@MahiberAhawTV',
  telegram: 'https://t.me/mahibere_ahaw',
  phones: ['+251 911 00 00 00'],
  emails: ['meleketeahew@gmail.com'],
  mapUrl: '',
} as const;

// ─── Per-language store ───────────────────────────────────────────────────────

export type MultiLangLandingContent = Partial<Record<Language, LandingContent>> & {
  meta?: { updatedAt?: string; updatedBy?: string };
};

// ─── Defaults per language ────────────────────────────────────────────────────

export const DEFAULT_LANDING_CONTENT: Record<Language, LandingContent> = {
  en: {
    hero: {
      badge: 'Revolutionizing Ministry',
      title: 'Mahibere Ahaw Yekiristos Betekerstian',
      titleHighlight: '',
      description:
        "A renewed Orthodox Church that serves according to God's will revealed in the Holy Scripture, fulfilling its mission throughout the world through His Word and Spirit.",
      ctaPrimary: 'Get Started',
      ctaSecondary: 'Learn More',
      statsCard1Label: 'Active Souls',
      statsCard1Value: '12.5k+',
      statsCard2Label: 'Service Uptime',
      statsCard2Value: '99.9%',
    },
    stats: [
      { label: 'Congregations', value: '850', icon: 'MapPin' },
      { label: 'Admin Staff', value: '2.4k', icon: 'Shield' },
      { label: 'Spiritual Growth', value: '40%', icon: 'Heart' },
      { label: 'Global Reach', value: '120+', icon: 'Languages' },
    ],
    features: {
      sectionTitle: 'Everything You Need',
      sectionDescription: 'Everything you need to lead your church into the future.',
      items: [
        { id: 'members', title: 'Member Management', description: 'Manage church members, ministries, and contact information with ease.', icon: 'Users' },
        { id: 'planning', title: 'Plans & Reporting', description: 'Organize ministry plans and track progress with detailed reports.', icon: 'Calendar' },
        { id: 'reports', title: 'Analytics & Reports', description: 'Comprehensive reporting and tracking for all church activities.', icon: 'BarChart3' },
      ],
    },
    support: {
      badge: 'Ministerial Support',
      title: 'Support the Ministry',
      description: 'Your generous contributions help us maintain and grow this platform for the glory of God.',
      missionTitle: 'Our Mission',
      missionStatement: 'A renewed Orthodox Church fulfilling its mission throughout the world through His Word and Spirit.',
      banks: [
        { name: 'CBE', account: '1000002580978' },
        { name: 'Berhan Bank', account: '2500600031780' },
        { name: 'Abyssinia Bank', account: '16356077' },
        { name: 'Awash Bank', account: '01303228078700' },
        { name: 'Oromia Bank', account: '1035222' },
        { name: 'Nib Bank', account: '7000012443035' },
      ],
    },
    contact: {
      badge: 'Get in Touch',
      sectionTitle: 'Contact Us',
      sectionDescription: 'Reach the head office directly — by phone, by email, or in person.',
      addressLabel: 'Address',
      address: 'Addis Ababa, Ethiopia',
      phoneLabel: 'Phone',
      phones: [...CONTACT_CHANNELS.phones],
      emailLabel: 'Email',
      emails: [...CONTACT_CHANNELS.emails],
      hoursLabel: 'Office Hours',
      hours: 'Monday – Friday, 8:30 AM – 5:00 PM',
      mapUrl: CONTACT_CHANNELS.mapUrl,
      socialsLabel: 'Follow Us',
      youtube: CONTACT_CHANNELS.youtube,
      telegram: CONTACT_CHANNELS.telegram,
    },
    footer: {
      description: 'Integrating ancient spiritual values with the precision of modern engineering. Join the movement of digital discipleship.',
      email: 'meleketeahew@gmail.com',
      copyright: '© 2025 Mahibere Ahaw Ecosystem. All rights reserved.',
      youtube: CONTACT_CHANNELS.youtube,
      telegram: CONTACT_CHANNELS.telegram,
      phone: CONTACT_CHANNELS.phones[0],
    },
  },
  am: {
    hero: {
      badge: 'አገልግሎትን እያሳደጉ',
      title: 'ማኅበረ አኀው የክርስቶስ ቤተክርስቲያን',
      titleHighlight: '',
      description: 'በመጽሐፍ ቅዱስ የተገለጠውን የእግዚአብሔርን ሃሳብ የምታገለግል በቃሉና በመንፈሱ የታደሰች ኦርቶዶክሳዊት ቤ/ክ በመላው ዓለም ተልዕኮዋን ስትፈጽም ማየት።',
      ctaPrimary: 'ጀምር',
      ctaSecondary: 'ተጨማሪ ይመልከቱ',
      statsCard1Label: 'ንቁ ነፍሳት',
      statsCard1Value: '12.5k+',
      statsCard2Label: 'የአገልግሎት ጊዜ',
      statsCard2Value: '99.9%',
    },
    stats: [
      { label: 'ጉባኤዎች', value: '850', icon: 'MapPin' },
      { label: 'አስተዳዳሪ ሰራተኞች', value: '2.4k', icon: 'Shield' },
      { label: 'መንፈሳዊ እድገት', value: '40%', icon: 'Heart' },
      { label: 'ዓለም አቀፍ ተደራሽነት', value: '120+', icon: 'Languages' },
    ],
    features: {
      sectionTitle: 'የሚያስፈልጉዎት ሁሉ',
      sectionDescription: 'ቤተክርስቲያንዎን ወደ ወደፊቱ ለመምራት የሚያስፈልጉዎት ሁሉ።',
      items: [
        { id: 'members', title: 'የአባላት አስተዳደር', description: 'የቤተክርስቲያን አባላትን፣ አገልግሎቶችን እና የእውቂያ መረጃዎችን ያስተዳድሩ።', icon: 'Users' },
        { id: 'planning', title: 'እቅዶች እና ሪፖርቶች', description: 'የአገልግሎት እቅዶችን ያደራጁ እና እድገትን ይከታተሉ።', icon: 'Calendar' },
        { id: 'reports', title: 'ትንታኔ እና ሪፖርቶች', description: 'ለሁሉም የቤተክርስቲያን እንቅስቃሴዎች ሁሉን አቀፍ ሪፖርት።', icon: 'BarChart3' },
      ],
    },
    support: {
      badge: 'የአገልግሎት ድጋፍ',
      title: 'አገልግሎቱን ይደግፉ',
      description: 'ለእግዚአብሔር ክብር ይህን መድረክ ለማስቀጠልና ለማሳደግ የሚረዱ ልግስናዎ።',
      missionTitle: 'ተልዕኮአችን',
      missionStatement: 'በቃሉና በመንፈሱ በመላው ዓለም ተልዕኮዋን የምትፈጽም የታደሰች ኦርቶዶክሳዊት ቤ/ክ።',
      banks: [
        { name: 'ንግድ ባንክ', account: '1000002580978' },
        { name: 'ብርሃን ባንክ', account: '2500600031780' },
        { name: 'አቢሲኒያ ባንክ', account: '16356077' },
        { name: 'አዋሽ ባንክ', account: '01303228078700' },
        { name: 'ኦሮሚያ ባንክ', account: '1035222' },
        { name: 'ኒብ ባንክ', account: '7000012443035' },
      ],
    },
    contact: {
      badge: 'ያግኙን',
      sectionTitle: 'እኛን ያግኙ',
      sectionDescription: 'ዋናውን ጽሕፈት ቤት በስልክ፣ በኢሜይል ወይም በአካል ያግኙ።',
      addressLabel: 'አድራሻ',
      address: 'አዲስ አበባ፣ ኢትዮጵያ',
      phoneLabel: 'ስልክ',
      phones: [...CONTACT_CHANNELS.phones],
      emailLabel: 'ኢሜይል',
      emails: [...CONTACT_CHANNELS.emails],
      hoursLabel: 'የሥራ ሰዓት',
      hours: 'ከሰኞ – ዓርብ፣ ከጠዋቱ 2:30 – ከቀኑ 11:00',
      mapUrl: CONTACT_CHANNELS.mapUrl,
      socialsLabel: 'ይከተሉን',
      youtube: CONTACT_CHANNELS.youtube,
      telegram: CONTACT_CHANNELS.telegram,
    },
    footer: {
      description: 'የጥንታዊ መንፈሳዊ እሴቶችን ከዘመናዊ ምህንድስና ትክክለኛነት ጋር በማዋሃድ። የዲጂታል ደቀ መዝሙርነት እንቅስቃሴን ይቀላቀሉ።',
      email: 'meleketeahew@gmail.com',
      copyright: '© 2025 ማኅበረ አኀው ስነ-ምህዳር። ሁሉም መብቶች የተጠበቁ ናቸው።',
      youtube: CONTACT_CHANNELS.youtube,
      telegram: CONTACT_CHANNELS.telegram,
      phone: CONTACT_CHANNELS.phones[0],
    },
  },
  om: {
    hero: {
      badge: 'Tajaajila Fooyya\'isuu',
      title: 'Waldaa Kiristaanaa Mahibere Ahaw',
      titleHighlight: '',
      description: 'Waldaa Ortodoksii haaraa fedha Waaqayyoo Macaafa Qulqulluu keessatti ibsameen tajaajiltu, tajaajila ishee addunyaa guutuutti Sagalee fi Hafuura Isaatiin raawwattu.',
      ctaPrimary: 'Eegali',
      ctaSecondary: 'Dabalata Baradhu',
      statsCard1Label: 'Lubbuu Hojirra Jiru',
      statsCard1Value: '12.5k+',
      statsCard2Label: 'Yeroo Tajaajilaa',
      statsCard2Value: '99.9%',
    },
    stats: [
      { label: 'Waldaalee', value: '850', icon: 'MapPin' },
      { label: 'Hojjettoota', value: '2.4k', icon: 'Shield' },
      { label: 'Guddina Hafuuraa', value: '40%', icon: 'Heart' },
      { label: 'Dhaqqabummaa Addunyaa', value: '120+', icon: 'Languages' },
    ],
    features: {
      sectionTitle: 'Waan Barbaaddu Hunda',
      sectionDescription: 'Waldaa kee gara fuulduraatti hogganuu kan si dandeessisu hunda.',
      items: [
        { id: 'members', title: 'Bulchiinsa Miseensota', description: 'Miseensota waldaa, tajaajila fi odeeffannoo quunnamtii bulchi.', icon: 'Users' },
        { id: 'planning', title: 'Karoora fi Gabaasa', description: 'Karoora tajaajilaa qindeessi fi guddina hordofi.', icon: 'Calendar' },
        { id: 'reports', title: 'Xiinxala fi Gabaasa', description: 'Gabaasa fi hordoffii hojii waldaa hundaaf.', icon: 'BarChart3' },
      ],
    },
    support: {
      badge: 'Deggersa Tajaajilaa',
      title: 'Tajaajila Deeggari',
      description: 'Gumaachi kee kabaja Waaqayyoof pilaatfoormii kana eeguu fi guddisuu nu gargaara.',
      missionTitle: 'Ergama Keenya',
      missionStatement: 'Waldaa Ortodoksii haaraa ergama ishee addunyaa guutuutti Sagalee fi Hafuura Isaatiin raawwattu.',
      banks: [
        { name: 'CBE', account: '1000002580978' },
        { name: 'Berhan Bank', account: '2500600031780' },
        { name: 'Abyssinia Bank', account: '16356077' },
        { name: 'Awash Bank', account: '01303228078700' },
        { name: 'Oromia Bank', account: '1035222' },
        { name: 'Nib Bank', account: '7000012443035' },
      ],
    },
    contact: {
      badge: 'Nu Quunnami',
      sectionTitle: 'Nu Quunnamaa',
      sectionDescription: 'Waajjira muummee kallattiin quunnamaa — bilbilaan, imeeliin yookaan dhufuun.',
      addressLabel: 'Teessoo',
      address: 'Finfinnee, Itoophiyaa',
      phoneLabel: 'Bilbila',
      phones: [...CONTACT_CHANNELS.phones],
      emailLabel: 'Imeelii',
      emails: [...CONTACT_CHANNELS.emails],
      hoursLabel: 'Sa\'aatii Hojii',
      hours: 'Wiixata – Jimaata, 2:30 – 11:00',
      mapUrl: CONTACT_CHANNELS.mapUrl,
      socialsLabel: 'Nu Hordofaa',
      youtube: CONTACT_CHANNELS.youtube,
      telegram: CONTACT_CHANNELS.telegram,
    },
    footer: {
      description: 'Aadaa hafuuraa durii fi ogummaa injinariingii ammayyaa waliin makuun. Sosochii bartummaa dijitaalaa bira gaa\'i.',
      email: 'meleketeahew@gmail.com',
      copyright: '© 2025 Mahibere Ahaw Ecosystem. Mirgi hundi eegamaadha.',
      youtube: CONTACT_CHANNELS.youtube,
      telegram: CONTACT_CHANNELS.telegram,
      phone: CONTACT_CHANNELS.phones[0],
    },
  },
  ti: {
    hero: {
      badge: 'ኣገልግሎት ምሕዳስ',
      title: 'ማሕበረ ኣኀው ናይ ክርስቶስ ቤተክርስቲያን',
      titleHighlight: '',
      description: 'ኣብ መጽሓፍ ቅዱስ ዝተገልጸ ፍቓድ ኣምላኽ እተገልግል፣ ብቓሉን ብመንፈሱን ኣብ ምሉእ ዓለም ተልእኾኣ እትፍጽም ዝተሓደሰት ኦርቶዶክሳዊት ቤተክርስቲያን።',
      ctaPrimary: 'ጀምር',
      ctaSecondary: 'ተወሳኺ ፍለጥ',
      statsCard1Label: 'ንጡፋት ነፍሳት',
      statsCard1Value: '12.5k+',
      statsCard2Label: 'ግዜ ኣገልግሎት',
      statsCard2Value: '99.9%',
    },
    stats: [
      { label: 'ጉባኤታት', value: '850', icon: 'MapPin' },
      { label: 'ኣመሓደርቲ ሰራሕተኛታት', value: '2.4k', icon: 'Shield' },
      { label: 'መንፈሳዊ ዕቤት', value: '40%', icon: 'Heart' },
      { label: 'ዓለምለኻዊ ተበጻሕነት', value: '120+', icon: 'Languages' },
    ],
    features: {
      sectionTitle: 'ዘድልየኩም ኩሉ',
      sectionDescription: 'ቤተክርስቲያንኩም ናብ መጻኢ ንምምራሕ ዘድልየኩም ኩሉ።',
      items: [
        { id: 'members', title: 'ምሕደራ ኣባላት', description: 'ኣባላት ቤተክርስቲያን፣ ኣገልግሎታትን ናይ ርክብ ሓበሬታን ብቐሊሉ ኣመሓድሩ።', icon: 'Users' },
        { id: 'planning', title: 'መደባትን ጸብጻባትን', description: 'መደባት ኣገልግሎት ኣዳሉዉ፣ ዕቤት ድማ ተኸታተሉ።', icon: 'Calendar' },
        { id: 'reports', title: 'ትንተናን ጸብጻባትን', description: 'ንኹሉ ንጥፈታት ቤተክርስቲያን ሰፊሕ ጸብጻብን ክትትልን።', icon: 'BarChart3' },
      ],
    },
    support: {
      badge: 'ደገፍ ኣገልግሎት',
      title: 'ነቲ ኣገልግሎት ደግፉ',
      description: 'ለጋስ ወፈያኹም ነዚ መድረኽ ንኽብሪ ኣምላኽ ንምዕቃብን ንምዕባይን ይሕግዘና።',
      missionTitle: 'ተልእኾና',
      missionStatement: 'ብቓሉን ብመንፈሱን ኣብ ምሉእ ዓለም ተልእኾኣ እትፍጽም ዝተሓደሰት ኦርቶዶክሳዊት ቤተክርስቲያን።',
      banks: [
        { name: 'ንግዲ ባንክ', account: '1000002580978' },
        { name: 'ብርሃን ባንክ', account: '2500600031780' },
        { name: 'ኣቢሲንያ ባንክ', account: '16356077' },
        { name: 'ኣዋሽ ባንክ', account: '01303228078700' },
        { name: 'ኦሮሚያ ባንክ', account: '1035222' },
        { name: 'ኒብ ባንክ', account: '7000012443035' },
      ],
    },
    contact: {
      badge: 'ርኸቡና',
      sectionTitle: 'ርኸቡና',
      sectionDescription: 'ንቤት ጽሕፈት ብቐጥታ ብተሌፎን፣ ብኢመይል ወይ ብኣካል ርኸቡና።',
      addressLabel: 'ኣድራሻ',
      address: 'ኣዲስ ኣበባ፣ ኢትዮጵያ',
      phoneLabel: 'ተሌፎን',
      phones: [...CONTACT_CHANNELS.phones],
      emailLabel: 'ኢመይል',
      emails: [...CONTACT_CHANNELS.emails],
      hoursLabel: 'ናይ ስራሕ ሰዓታት',
      hours: 'ሰኑይ – ዓርቢ፣ 2:30 – 11:00',
      mapUrl: CONTACT_CHANNELS.mapUrl,
      socialsLabel: 'ተኸታተሉና',
      youtube: CONTACT_CHANNELS.youtube,
      telegram: CONTACT_CHANNELS.telegram,
    },
    footer: {
      description: 'ጥንታዊ መንፈሳዊ ክብርታት ምስ ዘመናዊ ምህንድስና ብምውህሃድ። ናብ ምንቅስቓስ ዲጂታላዊ ደቀ መዛሙርትነት ተጸንበሩ።',
      email: 'meleketeahew@gmail.com',
      copyright: '© 2025 ማሕበረ ኣኀው። ኩሉ መሰላት ዝተሓለወ እዩ።',
      youtube: CONTACT_CHANNELS.youtube,
      telegram: CONTACT_CHANNELS.telegram,
      phone: CONTACT_CHANNELS.phones[0],
    },
  },
};

// ─── Firestore helpers ────────────────────────────────────────────────────────

const COLLECTION = 'siteConfig';
const DOCUMENT = 'landingPage';

export const landingContentService = {
  async getAll(): Promise<MultiLangLandingContent> {
    const ref = doc(db, COLLECTION, DOCUMENT);
    const snap = await getDoc(ref);
    if (!snap.exists()) return {};
    return snap.data() as MultiLangLandingContent;
  },

  async saveAll(data: MultiLangLandingContent, updatedBy: string): Promise<void> {
    const ref = doc(db, COLLECTION, DOCUMENT);
    await setDoc(ref, {
      ...data,
      meta: { updatedAt: new Date().toISOString(), updatedBy },
    });
  },
};

// ─── Deep merge utility ───────────────────────────────────────────────────────

function isObject(val: unknown): val is Record<string, unknown> {
  return val !== null && typeof val === 'object' && !Array.isArray(val);
}

export function deepMerge<T extends Record<string, unknown>>(
  fallback: T,
  override: Partial<T>
): T {
  const result = { ...fallback } as Record<string, unknown>;
  for (const key of Object.keys(override)) {
    const overrideVal = override[key as keyof T];
    const fallbackVal = fallback[key as keyof T];
    if (overrideVal === undefined || overrideVal === null) continue;
    if (isObject(overrideVal) && isObject(fallbackVal)) {
      result[key] = deepMerge(
        fallbackVal as Record<string, unknown>,
        overrideVal as Record<string, unknown>
      );
    } else {
      result[key] = overrideVal;
    }
  }
  return result as T;
}
