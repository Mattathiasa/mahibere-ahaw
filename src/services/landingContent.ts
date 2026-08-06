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

export interface LandingBelief {
  title: string;
  description: string;
  icon: string;
}

export interface LandingValue {
  title: string;
  description: string;
  icon: string;
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
  about?: {
    badge: string;
    sectionTitle: string;
    sectionDescription: string;
    whoWeAreTitle: string;
    whoWeAreDescription: string;
    missionTitle: string;
    missionDescription: string;
    visionTitle: string;
    visionDescription: string;
    beliefsTitle: string;
    beliefs: LandingBelief[];
    valuesTitle: string;
    values: LandingValue[];
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
    about: {
      badge: 'Who We Are',
      sectionTitle: 'About Us & Our Faith',
      sectionDescription: 'Rooted in Holy Scripture and ancient spiritual heritage, serving the Body of Christ with truth, love, and modern dedication.',
      whoWeAreTitle: 'Our Identity',
      whoWeAreDescription: 'Mahibere Ahaw is a Christ-centered Orthodox church institution dedicated to spiritual renewal, biblical teaching, and equipping congregations worldwide through God\'s Word and Holy Spirit.',
      missionTitle: 'Our Mission',
      missionDescription: 'To proclaim the Gospel of Jesus Christ, nurture believers into spiritual maturity, prepare church leaders, and advance digital ministry across all parishes.',
      visionTitle: 'Our Vision',
      visionDescription: 'To see a vibrant, scripture-anchored, and spiritually revived church that transforms lives and serves every community with love and divine unity.',
      beliefsTitle: 'What We Believe',
      beliefs: [
        { title: 'The Holy Scriptures', description: 'The Bible is the inspired, infallible Word of God, serving as the supreme authority for faith, doctrine, and daily life.', icon: 'BookOpen' },
        { title: 'The Holy Trinity', description: 'We confess One God in three co-equal persons: the Father, the Son, and the Holy Spirit.', icon: 'Church' },
        { title: 'Salvation in Jesus Christ', description: 'Eternal salvation is by grace through faith in the crucified and resurrected Lord Jesus Christ.', icon: 'Heart' },
        { title: 'One Holy Apostolic Church', description: 'The Church is the body of Christ, united in faith, sacraments, holy tradition, and spiritual fellowship.', icon: 'Shield' },
      ],
      valuesTitle: 'Our Core Values',
      values: [
        { title: 'Biblical Integrity', description: 'Unwavering faithfulness to the teachings of Holy Scripture and Christian truth.', icon: 'Shield' },
        { title: 'Love & Christian Unity', description: 'Serving one another in genuine fellowship, compassion, and divine love.', icon: 'Users' },
        { title: 'Spiritual Discipleship', description: 'Guiding every member to grow in holiness, prayer, and spiritual wisdom.', icon: 'Sparkles' },
        { title: 'Servant Leadership', description: 'Leading by example with humility, diligence, and stewardship.', icon: 'CheckCircle2' },
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
    about: {
      badge: 'ስለ እኛ',
      sectionTitle: 'ስለ እኛ እና እምነታችን',
      sectionDescription: 'በመጽሐፍ ቅዱስ እና በጥንታዊ መንፈሳዊ ቅርስ ላይ የተመሠረተች፣ የክርስቶስን አካል በእውነት፣ በፍቅርና በትጋት የምታገለግል ቤተክርስቲያን።',
      whoWeAreTitle: 'ማነነታችን',
      whoWeAreDescription: 'ማኅበረ አኀው በክርስቶስ ላይ የተመሰረተች ኦርቶዶክሳዊት ቤተክርስቲያን ስትሆን፣ በመንፈሳዊ ተሐድሶ፣ በመጽሐፍ ቅዱስ ትምህርትና በቃሉ ብርሃን ምዕመናንን በዓለም ዙሪያ የምታገለግል ማኅበር ናት።',
      missionTitle: 'ተልዕኮአችን',
      missionDescription: 'የኢየሱስ ክርስቶስን ወንጌል መስበክ፣ ምዕመናንን በመንፈሳዊ ሕይወት ማነጽ፣ የአገልግሎት መሪዎችን ማዘጋጀትና ዲጂታል አገልግሎትን ማሳደግ።',
      visionTitle: 'ራዕያችን',
      visionDescription: 'በእግዚአብሔር ቃል ላይ የተመሠረተች፣ በመንፈስ ቅዱስ የታደሰችና እያንዳንዱን ነፍስ በፍቅር፣ በቅድስናና በአንድነት የምታገለግል ቤተክርስቲያንን ማየት።',
      beliefsTitle: 'የምናምንበት እምነታችን',
      beliefs: [
        { title: 'ቅዱሳት መጻሕፍት', description: 'መጽሐፍ ቅዱስ በእግዚአብሔር መንፈስ የተጻፈ፣ ለእምነትና ለሕይወት ሁሉ የበላይ መመሪያና መሠረት ነው።', icon: 'BookOpen' },
        { title: 'ቅድስት ሥላሴ', description: 'በአንድ አምላክነት በሦስት አካላት፡ በአብ፣ በወልድ፣ በመንፈስ ቅዱስ እናምናለን።', icon: 'Church' },
        { title: 'ድኅነት በክርስቶስ', description: 'የዘላለም ድኅነትና ሕይወት በኢየሱስ ክርስቶስ ሞትና ትንሣኤ በማመን የሚገኝ ጸጋ ነው።', icon: 'Heart' },
        { title: 'አንዲት ቅድስት ቤተክርስቲያን', description: 'ቤተክርስቲያን በእምነት፣ በምሥጢራትና በመንፈሳዊ ኅብረት የተሳሰረች የክርስቶስ አካል ናት።', icon: 'Shield' },
      ],
      valuesTitle: 'መሠረታዊ እሴቶቻችን',
      values: [
        { title: 'የመጽሐፍ ቅዱስ ታማኝነት', description: 'በሁሉም ትምህርቶችና አሠራሮች የእግዚአብሔርን ቃል መሠረት ማድረግ።', icon: 'Shield' },
        { title: 'ፍቅርና አንድነት', description: 'እርስ በርሳችን በአንድነት፣ በሩኅሩኄ እና በክርስቲያናዊ ፍቅር መደጋገፍ።', icon: 'Users' },
        { title: 'መንፈሳዊ ደቀ መዝሙርነት', description: 'ምዕመናን በጸሎት፣ በቅድስናና በመንፈሳዊ ጥበብ እንዲያድጉ ማነጽ።', icon: 'Sparkles' },
        { title: 'የአገልጋይነት አመራር', description: 'በትህትና፣ በትጋትና በታማኝነት እግዚአብሔርንና ሕዝቡን ማገልገል።', icon: 'CheckCircle2' },
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
    about: {
      badge: 'Waa\'ee Keenya',
      sectionTitle: 'Waa\'ee Keenya fi Amantaa Keenya',
      sectionDescription: 'Macaafa Qulqulluu fi aadaa hafuuraa durii irratti hundaa\'ee, qaama Kiristoos dhugaadhaan, jaalalaan fi kutannoodhaan kan tajaajilu.',
      whoWeAreTitle: 'Eenyummaa Keenya',
      whoWeAreDescription: 'Mahibere Ahaw dhaabbata waldaa kiristaanaa Ortodoksii kan haroomsa hafuuraa, barsiisa Macaafa Qulqulluu fi miseensota addunyaa guutuurra jiran tajaajiluu irratti fuulleffateedha.',
      missionTitle: 'Ergama Keenya',
      missionDescription: 'Wangeela Yesuus Kiristoos lallabuu, amantoota hafuuraan guddisuu, hoggantoota tajaajilaa qopheessuu fi tajaajila dijitaalaa guddisuu.',
      visionTitle: 'Mul\'ata Keenya',
      visionDescription: 'Waldaa Macaafa Qulqulluurratti cichite, Hafuura Qulqulluudhaan haromfamte fi hawaasa hunda jaalalaa fi tokkummaadhaan tajaajiltu arguu.',
      beliefsTitle: 'Waan Amannu',
      beliefs: [
        { title: 'Macaafa Qulqulluu', description: 'Macaafni Qulqulluun sagalee Waaqayyoo kan hafuraan barreeffamee fi hundee amantaa keenyaati.', icon: 'BookOpen' },
        { title: 'Sadaasa Qulqulluu', description: 'Waaqa tokko qaama sadan: Abbaa, Ilma, fi Hafuura Qulqulluutti amanna.', icon: 'Church' },
        { title: 'Fayyina Kiristoosiin', description: 'Fayyinni bara baraa du\'aa fi du\'aa ka\'uu Yesuus Kiristoosiin kan argamu ayyaana Waaqayyooti.', icon: 'Heart' },
        { title: 'Waldaa Qulqulluu Tokkitti', description: 'Waldaan qaama Kiristoos kan amantaa fi tokkummaa hafuuraatiin walqabatedha.', icon: 'Shield' },
      ],
      valuesTitle: 'Dhaadannoo Keenya',
      values: [
        { title: 'Amanamummaa Macaafa Qulqulluu', description: 'Barsiisa fi hojii hunda keessatti Sagalee Waaqayyoo jahjeeffachuu.', icon: 'Shield' },
        { title: 'Jaalala fi Tokkummaa', description: 'Waloo hafuuraa, garaalaafummaa fi jaalala kiristaanaatiin wal tajaajiluu.', icon: 'Users' },
        { title: 'Guddina Hafuuraa', description: 'Miseensota kadhannaa, qulqullummaa fi ogummaa hafuuraatiin guddisuu.', icon: 'Sparkles' },
        { title: 'Hogganummaa Tajaajiltummaa', description: 'Gadi deebi\'iinsaan, kutannoon fi amanamummaadhaan Waaqayyoo fi uummata tajaajiluu.', icon: 'CheckCircle2' },
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
    about: {
      badge: 'ብዛዕባና',
      sectionTitle: 'ብዛዕባናን እምነትናን',
      sectionDescription: 'ኣብ መጽሓፍ ቅዱስን ጥንታዊ መንፈሳዊ ቅርሲን ዝተመሠረተት፣ ንኣካል ክርስቶስ ብሓቂ፣ ብፍቕርን ብትጋህን እተገልግል ቤተክርስቲያን።',
      whoWeAreTitle: 'መንነትና',
      whoWeAreDescription: 'ማሕበረ ኣኀው ኣብ ክርስቶስ ዝተመሠረተት ኦርቶዶክሳዊት ቤተክርስቲያን ኮይና፣ ብመንፈሳዊ ተሓድሶ፣ ብትምህርቲ መጽሓፍ ቅዱስን ብብርሃን ቃሉን ንምእመናን ኣብ ምሉእ ዓለም እተገልግል ማሕበር እያ።',
      missionTitle: 'ተልእኾና',
      missionDescription: 'ወንጌል ኢየሱስ ክርስቶስ መስበኽ፣ ምእመናን ብመንፈሳዊ ሕይወት ምህናጽ፣ መራሕቲ ኣገልግሎት ምድላውን ዲጂታላዊ ኣገልግሎት ምዕባይን።',
      visionTitle: 'ራእይና',
      visionDescription: 'ኣብ ቃል ኣምላኽ ዝተመሠረተት፣ ብመንፈስ ቅዱስ ዝተሓደሰትን ንነፍሲ ወከፍ ብፍቕሪ፣ ብቅድስናን ብሓድነትን እተገልግል ቤተክርስቲያን ምእላይ።',
      beliefsTitle: 'እንእምነሉ እምነትና',
      beliefs: [
        { title: 'ቅዱሳት መጻሕፍቲ', description: 'መጽሓፍ ቅዱስ ብመንፈስ ኣምላኽ ዝተጻሕፈ፣ ንእምነትን ንሕይወትን ኩሉ ላዕለዋይ መመርሕን መሠረትን እዩ።', icon: 'BookOpen' },
        { title: 'ቅድስት ሥላሴ', description: 'ብሓደ ኣምላኽነት ብሠለስተ ኣካላት፡ በአብ፣ በወልድ፣ በመንፈስ ቅዱስ ንእምን።', icon: 'Church' },
        { title: 'ድሕነት ብክርስቶስ', description: 'ናይ ዘለዓለም ድሕነትን ሕይወትን ብሞትን ትንሣኤን ኢየሱስ ክርስቶስ ብምእማን ዝርከብ ጸጋ እዩ።', icon: 'Heart' },
        { title: 'ሓንቲ ቅድስት ቤተክርስቲያን', description: 'ቤተክርስቲያን ብእምነት፣ ብምሥጢራትን ብመንፈሳዊ ኅብረትን ዝተኣሳሰረት ኣካል ክርስቶስ እያ።', icon: 'Shield' },
      ],
      valuesTitle: 'መሠረታውያን እሴታትና',
      values: [
        { title: 'ታማኝነት መጽሓፍ ቅዱስ', description: 'ኣብ ኩሉ ትምህርትታትን ኣሰራርሓታትን ቃል ኣምላኽ መሠረት ምግባር።', icon: 'Shield' },
        { title: 'ፍቕርን ሓድነትን', description: 'ንሓድሕድና ብሓድነት፣ ብርኅራኄን ብክርስቲያናዊ ፍቕርን ምድግጋፍ።', icon: 'Users' },
        { title: 'መንፈሳዊ ደቀ መዛሙርትነት', description: 'ምእመናን ብጸሎት፣ ብቅድስናን ብመንፈሳዊ ጥበብን ንኽዓብዩ ምህናጽ።', icon: 'Sparkles' },
        { title: 'ናይ ኣገልጋላይነት መራሕነት', description: 'ብትሕትና፣ ብትጋህን ብታማኝነትን ንኣምላኽን ንሕዝብን ምግልጋል።', icon: 'CheckCircle2' },
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
