import { db } from '@/lib/firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import type { Language } from '@/i18n/translations';

// ─── Content shape (language-agnostic structure) ──────────────────────────────

export interface LandingFeature {
  id: string;
  title: string;
  description: string;
  icon: string; // lucide icon name
  /**
   * Card photo (Cloudinary, or any URL). Empty falls back to the bundled
   * `PICTURES` photo at this card's position, which is what every card used
   * before the field existed.
   */
  imageUrl?: string;
  /** Overrides the shared `t.common.learnMore` label for this card only. */
  learnMoreLabel?: string;
  /**
   * Where the card's link goes. Empty resolves to `/features#<id>`, the
   * previous hard-coded behaviour. An `http(s)://` value opens in a new tab;
   * anything else is treated as an in-app path.
   */
  learnMoreUrl?: string;
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

/** A labelled destination in the footer link columns. */
export interface LandingLink {
  label: string;
  /** In-app path, `#section` anchor, or external URL. Blank hides the row. */
  url: string;
}

export interface LandingContent {
  hero: {
    badge: string;
    title: string;
    titleHighlight: string;
    description: string;
    ctaPrimary: string;
    ctaSecondary: string;
    /** Where the buttons go. Blank falls back to the historic destinations. */
    ctaPrimaryUrl?: string;
    ctaSecondaryUrl?: string;
    /** Optional Cloudinary (or any) hero image URL; empty = use bundled default. */
    imageUrl?: string;
  };
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
    /**
     * Sends the reader to the full history. The homepage carries a summary
     * because the complete account runs to about 1,800 words — long enough
     * that putting it here would bury the vision and mission below it.
     */
    historyLinkLabel?: string;
    historyUrl?: string;
    missionTitle: string;
    /**
     * A blank line separates items — rendered as a list when there is more
     * than one, and as a paragraph when there is not.
     */
    missionDescription: string;
    visionTitle: string;
    visionDescription: string;
    /** Small eyebrow above the beliefs heading, e.g. "Statement of Faith". */
    beliefsEyebrow: string;
    beliefsTitle: string;
    beliefs: LandingBelief[];
    /** Small eyebrow above the values heading, e.g. "Our Culture". */
    valuesEyebrow: string;
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
  /**
   * The homepage news feed. The posts themselves come from the `news`
   * collection; everything the section says around them lives here.
   */
  news: {
    badge: string;
    sectionTitle: string;
    sectionDescription: string;
    seeAllLabel: string;
    readMoreLabel: string;
    /** Attribution shown on each card, by post scope. */
    headOfficeLabel: string;
    parishLabel: string;
    emptyTitle: string;
    emptyDescription: string;
    /** How many posts the homepage feed shows. */
    maxPosts: number;
  };
  /**
   * The homepage suggestion box — the one place a visitor who is not a member
   * can write to the church. Nothing submitted is ever shown back on the page;
   * submissions are read only in Software Control. Every string a visitor sees
   * around the form lives here so it can be reworded without a deploy.
   */
  suggestions: {
    badge: string;
    sectionTitle: string;
    sectionDescription: string;
    /**
     * The four choices, in the order they appear. These are LABELS only — the
     * value stored in Firestore is the English token from
     * `SUGGESTION_CATEGORIES` in src/i18n/enums.ts, and rewording a label here
     * does not (and must not) change it.
     */
    categoryAppreciationLabel: string;
    categoryChangeLabel: string;
    categoryFeatureLabel: string;
    categoryProblemLabel: string;
    categoryFieldLabel: string;
    nameFieldLabel: string;
    namePlaceholder: string;
    contactFieldLabel: string;
    contactPlaceholder: string;
    messageFieldLabel: string;
    messagePlaceholder: string;
    /** Sits under the form: says who reads this and that a reply is not promised. */
    privacyNote: string;
    submitLabel: string;
    submittingLabel: string;
    thankYouTitle: string;
    thankYouMessage: string;
    sendAnotherLabel: string;
  };
  footer: {
    description: string;
    email: string;
    emailLabel: string;
    copyright: string;
    youtube?: string;
    telegram?: string;
    phone?: string;
    platformHeading: string;
    platformLinks: LandingLink[];
    supportHeading: string;
    supportLinks: LandingLink[];
    /** The "Stay Connected" signup block; hidden when false. */
    newsletterEnabled: boolean;
    newsletterHeading: string;
    newsletterPlaceholder: string;
    /** Bottom-bar legal links. A blank URL hides the link. */
    privacyLabel: string;
    privacyUrl?: string;
    termsLabel: string;
    termsUrl?: string;
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
  facebook: 'https://www.facebook.com/share/1ESM67DnRT/',
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
      title: 'Ahaw Orthodox Reformed Church',
      titleHighlight: '',
      description:
        "A renewed Orthodox Church that serves according to God's will revealed in the Holy Scripture, fulfilling its mission throughout the world through His Word and Spirit.",
      ctaPrimary: 'Get Started',
      ctaSecondary: 'Learn More',
      ctaPrimaryUrl: '/login',
      ctaSecondaryUrl: '#about',
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
      badge: 'About Us',
      sectionTitle: 'About Us & Our Faith',
      sectionDescription: 'Founded on Holy Scripture, receiving Orthodox tradition, and living in continual renewal through His Word and His Spirit.',
      whoWeAreTitle: 'Our Origin',
      whoWeAreDescription: 'The founding members of the Ahaw Orthodox Reformed Church are Orthodox servants and believers of Christ who faced exile. The association was formed in 1998 E.C. from several prayer and fellowship groups, whose servants taught, trained and built up others for years without pay. At a general assembly held 2–4 Tir 2010 E.C. we resolved to establish ourselves on biblical truth and to organise as one church. We serve today by receiving with an open heart all exiled Orthodox believers in Christ, and by standing as a witness to the vision of Orthodox renewal.',
      historyLinkLabel: 'Read our full history',
      historyUrl: '/about',
      missionTitle: 'Our Mission',
      missionDescription: [
        'To preach the Gospel;',
        'To worship God in spirit and in truth;',
        'To train and send messengers of the Gospel;',
        'To make our members disciples of Christ;',
        'To lead ourselves in continual renewal, and to work for the renewal of other churches;',
        'To carry out apologetic work that guards us from false teaching;',
        'To raise up and equip leaders for the church of Christ.',
      ].join('\n'),
      visionTitle: 'Our Vision',
      visionDescription: 'To see an Orthodox church that serves the purpose of God revealed in Holy Scripture, renewed by His Word and His Spirit, fulfilling its mission throughout the world.',
      beliefsEyebrow: 'Statement of Faith',
      beliefsTitle: 'What We Believe',
      beliefs: [
        { title: 'The Supremacy of Scripture', description: 'The Bible alone is the source, measure and standard of all our teaching. It is the Word of God and the highest authority over our position of faith.', icon: 'BookOpen' },
        { title: 'Testing by the Word', description: 'Any Christian teaching is accepted or rejected only as it is weighed against Holy Scripture.', icon: 'Scale' },
        { title: 'The Trinity and Christ', description: 'We believe in the Holy Trinity, in the full humanity and full divinity of Christ, and in Jesus Christ as the perfect and only Saviour.', icon: 'Church' },
        { title: 'The Historic Creeds', description: 'We receive the Apostles\', the Nicene, the Epiphanian, the Athanasian and Emperor Gelawdewos\' statements of faith, weighing each against Scripture.', icon: 'Shield' },
        { title: 'Shared Confessions', description: 'We receive the confessions issued by the fellowship of Gospel ministry associations, on the foundation of Scripture.', icon: 'Users' },
      ],
      valuesEyebrow: 'Our Core Values',
      valuesTitle: 'Our Values',
      values: [
        { title: 'Honouring the authority of Scripture', description: 'The Old and New Testaments are the only source of our teaching and our spiritual practice.', icon: 'BookOpen' },
        { title: 'Testing conciliar decisions by the Word', description: 'We make use of the creeds of Nicaea, Constantinople and Ephesus, examining each against Scripture.', icon: 'Scale' },
        { title: 'Christ-centred service', description: 'Christ is the centre of our ministry.', icon: 'Church' },
        { title: 'Apostolic mission', description: 'Bringing the Gospel to all who have not heard it, in their own language and culture.', icon: 'Send' },
        { title: 'Valuing holiness and righteous living', description: 'Living in righteousness and holiness so as to be a good influence on society.', icon: 'Sparkles' },
        { title: 'Guarding fellowship', description: 'Keeping our unity with other Christians and the ecumenical spirit of cooperation among churches.', icon: 'Users' },
        { title: 'Working for spiritual renewal', description: 'Because renewal by God\'s Word and Spirit turns the church back from error, we live in continual renewal and help others to do the same.', icon: 'Heart' },
        { title: 'Valuing accountability', description: 'Being accountable to God and to His people in our teaching, our lives and our administration.', icon: 'CheckCircle2' },
        { title: 'Carrying social responsibility', description: 'Honouring national laws and regulations, and working sincerely for the good of society.', icon: 'Handshake' },
      ],
    },
    news: {
      badge: 'Latest',
      sectionTitle: 'News & Updates',
      sectionDescription: 'What is happening across the church and its parishes.',
      seeAllLabel: 'See all news',
      readMoreLabel: 'Read more',
      headOfficeLabel: 'Head Office',
      parishLabel: 'Local Congregation',
      emptyTitle: 'News & Updates',
      emptyDescription: 'Stay tuned! News stories and updates from our ministry will appear here soon.',
      maxPosts: 4,
    },
    suggestions: {
      badge: 'Your Voice',
      sectionTitle: 'Tell Us What You Think',
      sectionDescription:
        'Something you appreciated, something you would change, something you would like us to build — write it here. It goes straight to the church office.',
      categoryAppreciationLabel: 'Something I appreciate',
      categoryChangeLabel: 'Something to change',
      categoryFeatureLabel: 'Something to add',
      categoryProblemLabel: 'Something is not working',
      categoryFieldLabel: 'What is this about?',
      nameFieldLabel: 'Your name (optional)',
      namePlaceholder: 'Leave blank to stay anonymous',
      contactFieldLabel: 'Phone or email (optional)',
      contactPlaceholder: 'Only if you would like a reply',
      messageFieldLabel: 'Your message',
      messagePlaceholder: 'Write as much or as little as you like.',
      privacyNote:
        'Suggestions are read by the church office and are not shown publicly on this page.',
      submitLabel: 'Send suggestion',
      submittingLabel: 'Sending…',
      thankYouTitle: 'Thank you',
      thankYouMessage: 'Your suggestion has reached the church office. We are grateful you took the time.',
      sendAnotherLabel: 'Send another',
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
      facebook: CONTACT_CHANNELS.facebook,
    },
    footer: {
      description: 'Integrating ancient spiritual values with the precision of modern engineering. Join the movement of digital discipleship.',
      email: 'meleketeahew@gmail.com',
      copyright: '© 2025 Mahibere Ahaw Ecosystem. All rights reserved.',
      youtube: CONTACT_CHANNELS.youtube,
      telegram: CONTACT_CHANNELS.telegram,
      facebook: CONTACT_CHANNELS.facebook,
      phone: CONTACT_CHANNELS.phones[0],
      emailLabel: 'Email',
      platformHeading: 'Platform',
      platformLinks: [
        { label: 'Dashboard', url: '' },
        { label: 'Community', url: '' },
        { label: 'Analytics', url: '' },
        { label: 'Security', url: '' },
      ],
      supportHeading: 'Support',
      supportLinks: [
        { label: 'About Us', url: '/about' },
        { label: 'Documentation', url: '' },
        { label: 'API Reference', url: '' },
        { label: 'Help Center', url: '' },
        { label: 'Status', url: '' },
      ],
      newsletterEnabled: true,
      newsletterHeading: 'Stay Connected',
      newsletterPlaceholder: 'Email Address',
      privacyLabel: 'Privacy Architecture',
      privacyUrl: '',
      termsLabel: 'Terms of Faith',
      termsUrl: '',
    },
  },
  am: {
    hero: {
      badge: 'አገልግሎትን እያሳደጉ',
      title: 'አኀው ኦርቶዶክሳዊት ተሐድሶ ቤተ ክርስቲያን',
      titleHighlight: '',
      description: 'በመጽሐፍ ቅዱስ የተገለጠውን የእግዚአብሔርን ሃሳብ የምታገለግል በቃሉና በመንፈሱ የታደሰች ኦርቶዶክሳዊት ቤ/ክ በመላው ዓለም ተልዕኮዋን ስትፈጽም ማየት።',
      ctaPrimary: 'ጀምር',
      ctaSecondary: 'ተጨማሪ ይመልከቱ',
      ctaPrimaryUrl: '/login',
      ctaSecondaryUrl: '#about',
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
      sectionDescription: 'በመጽሐፍ ቅዱስ ላይ ተመሥርተን፣ ኦርቶዶክሳዊ ትውፊትን ተቀብለን፣ በቃሉና በመንፈሱ በማያቋርጥ ተሐድሶ የምንኖር ቤተ ክርስቲያን ነን።',
      whoWeAreTitle: 'መነሻችን',
      whoWeAreDescription: 'የአኀው ኦርቶዶክሳዊት ተሐድሶ ቤተ ክርስቲያን መሥራች አባላት ስደት የገጠማቸው ኦርቶዶክሳውያን የክርስቶስ አገልጋዮችና ምእመናን ናቸው። ማኅበሩ በ1998 ዓ.ም ከተለያዩ የጸሎትና የጽዋ ማኅበራት በአንድነት ተመሥርቶ፣ አገልጋዮች ያለ ደሞዝ በትምህርት፣ በሥልጠናና በተለያዩ መንፈሳዊ አገልግሎቶች ሰዎችን ሲያንፁ ቆይተዋል። ከጥር 2–4 ቀን 2010 ዓ.ም. በተደረገ አጠቃላይ ስብሰባ፣ ራሳችንን በመጽሐፍ ቅዱሳዊ እውነት ላይ መሥርተን በአንዲት ቤተ ክርስቲያን ለመደራጀት ወስነናል። ከቤተ ክርስቲያኒቱ የተሰደዱ በክርስቶስ ያመኑ ኦርቶዶክሳውያንን ሁሉ በሰፊ ልብ በመቀበል ለኦርቶዶክሳዊ ተሐድሶ ራእይ ማሳያ በመሆን በማገልገል ላይ እንገኛለን።',
      historyLinkLabel: 'ሙሉ ታሪካችንን ያንብቡ',
      historyUrl: '/about',
      missionTitle: 'ተልእኮአችን',
      missionDescription: [
        'ወንጌልን መስበክ፤',
        'እግዚአብሔርን በእውነትና በመንፈስ ማምለክ፤',
        'የወንጌል መልእክተኞችን ማሠልጠንና መላክ፤',
        'አባላቷን የክርስቶስ ደቀ መዛሙርት ማድረግ፤',
        'ራሷን በማያቋርጥ ተሐድሶ ውስጥ መምራትና ለሌሎች አብያተ ክርስቲያናት ተሐድሶ መሥራት፤',
        'ራሷን ከስሕተት ትምህርቶች ለመጠበቅ የዕቅበተ እምነት ሥራዎችን መሥራት፤',
        'ለክርስቶስ ቤተ ክርስቲያን መሪዎችን ማፍራትና ማብቃት።',
      ].join('\n'),
      visionTitle: 'ራእያችን',
      visionDescription: 'በመጽሐፍ ቅዱስ የተገለጠውን የእግዚአብሔርን ሀሳብ የምታገለግል፣ በቃሉና በመንፈሱ የታደሰች፣ ኦርቶዶክሳዊት ቤተ ክርስቲያን በመላው ዓለም ተልእኮዋን ስትፈጽም ማየት።',
      beliefsEyebrow: 'የእምነት መግለጫ',
      beliefsTitle: 'እምነታችን',
      beliefs: [
        { title: 'የመጽሐፍ ቅዱስ የበላይነት', description: 'የትምህርታችን ሁሉ ምንጭ፣ መለኪያና መመዘኛ መጽሐፍ ቅዱስ ብቻ ነው። መጽሐፍ ቅዱስ የእግዚአብሔር ቃልና የሃይማኖታዊ አቋማችን የበላይ ባለሥልጣን ነው።', icon: 'BookOpen' },
        { title: 'ምዘና', description: 'ማንኛውም ክርስቲያናዊ ትምህርት ተቀባይነት የሚያገኘው ወይም ውድቅ የሚደረገው በመጽሐፍ ቅዱስ ሲመዘን ብቻ ነው።', icon: 'Scale' },
        { title: 'ሥላሴና ክርስቶስ', description: 'በቅድስት ሥላሴ፣ በክርስቶስ ፍጹም ሰውነትና አምላክነት፣ እንዲሁም በክርስቶስ ኢየሱስ ፍጹም እና ብቸኛ አዳኝነት እናምናለን።', icon: 'Church' },
        { title: 'የእምነት መግለጫዎች', description: 'የሐዋርያትን፣ የሠለስቱ ምእትን (የኒቂያ)፣ የኤጲፋንዮስን፣ የአትናቴዎስንና የአፄ ገላውዴዎስን የእምነት መግለጫዎች በመጽሐፍ ቅዱስ እየመዘንን እንቀበላቸዋለን።', icon: 'Shield' },
        { title: 'ኅብረታዊ አቋሞች', description: 'የወንጌል አገልግሎት ማኅበራት ኅብረት የሚያወጣቸውን የእምነት አቋሞች በመጽሐፍ ቅዱስ መሠረትነት እንቀበላለን።', icon: 'Users' },
      ],
      valuesEyebrow: 'መሠረታዊ እሴቶቻችን',
      valuesTitle: 'እሴቶቻችን',
      values: [
        { title: 'የመጽሐፍ ቅዱስን ሥልጣን ማክበር', description: 'ብሉያትና ሐዲሳት የትምህርታችንና የመንፈሳዊ ልምምዶቻችን ብቸኛ ምንጭ ናቸው።', icon: 'BookOpen' },
        { title: 'የጉባኤያት ውሳኔዎችን በቃሉ መመርመር', description: 'የኒቂያ፣ የቁስጠንጥንያና የኤፌሶን ጉባኤያት የደነገጓቸውን የእምነት መግለጫዎች በቃሉ እየፈተሽን እንገለገልባቸዋለን።', icon: 'Scale' },
        { title: 'ክርስቶስን ያማከለ አገልግሎት', description: 'የአገልግሎታችን ማዕከል ክርስቶስ ነው።', icon: 'Church' },
        { title: 'ሐዋርያዊ ተልእኮ', description: 'ወንጌልን ላልሰሙት ሁሉ እንደ ቋንቋቸውና ባህላቸው ማድረስ።', icon: 'Send' },
        { title: 'ለቅድስና እና ለጽድቅ ኑሮ ቦታ መስጠት', description: 'በጽድቅና በቅድስና በመኖር በኅብረተሰቡ ላይ መልካም ተጽዕኖ ማሳደር።', icon: 'Sparkles' },
        { title: 'ኅብረትን መጠበቅ', description: 'ከሌሎች ክርስቲያኖች ጋር ያለንን አንድነትና የኢኩሜኒዝም መንፈስ መጠበቅ።', icon: 'Users' },
        { title: 'ለመንፈሳዊ ተሐድሶ መሥራት', description: 'በእግዚአብሔር ቃልና በመንፈሱ የሚከናወን ተሐድሶ ቤተ ክርስቲያንን ከስሕተት ስለሚመልስ በማያቋርጥ ተሐድሶ ውስጥ መኖርና ሌሎችንም መርዳት።', icon: 'Heart' },
        { title: 'ለተጠያቂነት ዋጋ መስጠት', description: 'በትምህርታችን፣ በሕይወታችንና በአስተዳደራችን ለእግዚአብሔርና ለሕዝቡ ተጠያቂ መሆን።', icon: 'CheckCircle2' },
        { title: 'ማኅበራዊ ኃላፊነትን መወጣት', description: 'ሀገራዊ ሕጎችንና ደንቦችን በማክበር ለኅብረተሰቡ በጎ መስተጋብር በቅንነት መሥራት።', icon: 'Handshake' },
      ],
    },
    news: {
      badge: 'የቅርብ ጊዜ',
      sectionTitle: 'ዜና እና መረጃ',
      sectionDescription: 'በቤተክርስቲያኗና በአጥቢያዎቿ ውስጥ እየተካሄደ ያለው።',
      seeAllLabel: 'ሁሉንም ዜናዎች ይመልከቱ',
      readMoreLabel: 'ተጨማሪ ያንብቡ',
      headOfficeLabel: 'ዋና ጽሕፈት ቤት',
      parishLabel: 'አጥቢያ',
      emptyTitle: 'ዜና እና መረጃ',
      emptyDescription: 'በቅርቡ ከአገልግሎታችን ዜናዎችና መረጃዎች እዚህ ይወጣሉ።',
      maxPosts: 4,
    },
    suggestions: {
      badge: 'የእርስዎ ድምፅ',
      sectionTitle: 'ሃሳብዎን ያካፍሉን',
      sectionDescription:
        'የወደዱት ነገር፣ እንዲቀየር የሚፈልጉት ነገር፣ እንዲጨመር የሚፈልጉት ነገር — እዚህ ይጻፉ። በቀጥታ ወደ ቤተክርስቲያኗ ጽሕፈት ቤት ይደርሳል።',
      categoryAppreciationLabel: 'የወደድኩት ነገር',
      categoryChangeLabel: 'እንዲቀየር የምፈልገው',
      categoryFeatureLabel: 'እንዲጨመር የምፈልገው',
      categoryProblemLabel: 'የማይሠራ ነገር',
      categoryFieldLabel: 'ስለ ምንድን ነው?',
      nameFieldLabel: 'ስምዎ (አማራጭ)',
      namePlaceholder: 'ስም ሳይገልጹ ለመላክ ባዶ ይተዉት',
      contactFieldLabel: 'ስልክ ወይም ኢሜይል (አማራጭ)',
      contactPlaceholder: 'መልስ ከፈለጉ ብቻ',
      messageFieldLabel: 'መልእክትዎ',
      messagePlaceholder: 'እንደፈለጉ በአጭሩ ወይም በሰፊው ይጻፉ።',
      privacyNote: 'አስተያየቶች የሚነበቡት በቤተክርስቲያኗ ጽሕፈት ቤት ሲሆን በዚህ ገጽ ላይ ለሕዝብ አይታዩም።',
      submitLabel: 'አስተያየት ላክ',
      submittingLabel: 'እየተላከ ነው…',
      thankYouTitle: 'እናመሰግናለን',
      thankYouMessage: 'አስተያየትዎ ወደ ቤተክርስቲያኗ ጽሕፈት ቤት ደርሷል። ጊዜ ስለሰጡን እናመሰግናለን።',
      sendAnotherLabel: 'ሌላ ላክ',
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
      facebook: CONTACT_CHANNELS.facebook,
    },
    footer: {
      description: 'የጥንታዊ መንፈሳዊ እሴቶችን ከዘመናዊ ምህንድስና ትክክለኛነት ጋር በማዋሃድ። የዲጂታል ደቀ መዝሙርነት እንቅስቃሴን ይቀላቀሉ።',
      email: 'meleketeahew@gmail.com',
      copyright: '© 2025 ማኅበረ አኀው ስነ-ምህዳር። ሁሉም መብቶች የተጠበቁ ናቸው።',
      youtube: CONTACT_CHANNELS.youtube,
      telegram: CONTACT_CHANNELS.telegram,
      facebook: CONTACT_CHANNELS.facebook,
      phone: CONTACT_CHANNELS.phones[0],
      emailLabel: 'ኢሜይል',
      platformHeading: 'መድረክ',
      platformLinks: [
        { label: 'ዳሽቦርድ', url: '' },
        { label: 'ማህበረሰብ', url: '' },
        { label: 'ትንታኔዎች', url: '' },
        { label: 'ደህንነት', url: '' },
      ],
      supportHeading: 'ድጋፍ',
      supportLinks: [
        { label: 'ስለ እኛ', url: '/about' },
        { label: 'ሰነዶች', url: '' },
        { label: 'የኤፒአይ ማጣቀሻ', url: '' },
        { label: 'የእገዛ ማዕከል', url: '' },
        { label: 'ሁኔታ', url: '' },
      ],
      newsletterEnabled: true,
      newsletterHeading: 'ተገናኝተው ይቆዩ',
      newsletterPlaceholder: 'የኢሜይል አድራሻ',
      privacyLabel: 'የግላዊነት አርክቴክቸር',
      privacyUrl: '',
      termsLabel: 'የእምነት ውሎች',
      termsUrl: '',
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
      ctaPrimaryUrl: '/login',
      ctaSecondaryUrl: '#about',
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
      historyLinkLabel: 'Seenaa keenya guutuu dubbisaa',
      historyUrl: '/about',
      missionTitle: 'Ergama Keenya',
      missionDescription: 'Wangeela Yesuus Kiristoos lallabuu, amantoota hafuuraan guddisuu, hoggantoota tajaajilaa qopheessuu fi tajaajila dijitaalaa guddisuu.',
      visionTitle: 'Mul\'ata Keenya',
      visionDescription: 'Waldaa Macaafa Qulqulluurratti cichite, Hafuura Qulqulluudhaan haromfamte fi hawaasa hunda jaalalaa fi tokkummaadhaan tajaajiltu arguu.',
      beliefsEyebrow: 'Ibsa Amantaa',
      beliefsTitle: 'Waan Amannu',
      beliefs: [
        { title: 'Macaafa Qulqulluu', description: 'Macaafni Qulqulluun sagalee Waaqayyoo kan hafuraan barreeffamee fi hundee amantaa keenyaati.', icon: 'BookOpen' },
        { title: 'Sadaasa Qulqulluu', description: 'Waaqa tokko qaama sadan: Abbaa, Ilma, fi Hafuura Qulqulluutti amanna.', icon: 'Church' },
        { title: 'Fayyina Kiristoosiin', description: 'Fayyinni bara baraa du\'aa fi du\'aa ka\'uu Yesuus Kiristoosiin kan argamu ayyaana Waaqayyooti.', icon: 'Heart' },
        { title: 'Waldaa Qulqulluu Tokkitti', description: 'Waldaan qaama Kiristoos kan amantaa fi tokkummaa hafuuraatiin walqabatedha.', icon: 'Shield' },
      ],
      valuesEyebrow: 'Aadaa Keenya',
      valuesTitle: 'Dhaadannoo Keenya',
      values: [
        { title: 'Amanamummaa Macaafa Qulqulluu', description: 'Barsiisa fi hojii hunda keessatti Sagalee Waaqayyoo jahjeeffachuu.', icon: 'Shield' },
        { title: 'Jaalala fi Tokkummaa', description: 'Waloo hafuuraa, garaalaafummaa fi jaalala kiristaanaatiin wal tajaajiluu.', icon: 'Users' },
        { title: 'Guddina Hafuuraa', description: 'Miseensota kadhannaa, qulqullummaa fi ogummaa hafuuraatiin guddisuu.', icon: 'Sparkles' },
        { title: 'Hogganummaa Tajaajiltummaa', description: 'Gadi deebi\'iinsaan, kutannoon fi amanamummaadhaan Waaqayyoo fi uummata tajaajiluu.', icon: 'CheckCircle2' },
      ],
    },
    news: {
      badge: 'Haaraa',
      sectionTitle: 'Oduu fi Odeeffannoo',
      sectionDescription: 'Waldaa fi waldaalee naannoo keessatti wanti adeemsifamaa jiru.',
      seeAllLabel: 'Oduu hunda ilaali',
      readMoreLabel: 'Dabalata dubbisi',
      headOfficeLabel: 'Waajjira Muummee',
      parishLabel: 'Waldaa Naannoo',
      emptyTitle: 'Oduu fi Odeeffannoo',
      emptyDescription: 'Oduu fi odeeffannoon tajaajila keenyaa dhiyootti asitti ni mul\'ata.',
      maxPosts: 4,
    },
    suggestions: {
      badge: 'Sagalee Kee',
      sectionTitle: 'Yaada Kee Nuuf Himi',
      sectionDescription:
        'Wanti si gammachiise, wanti akka jijjiiramu barbaaddu, wanti akka dabalamu barbaaddu — asitti barreessi. Kallattiin gara waajjira waldaa deema.',
      categoryAppreciationLabel: 'Wanta ani jaalladhe',
      categoryChangeLabel: 'Wanta jijjiiramuu qabu',
      categoryFeatureLabel: 'Wanta dabalamuu qabu',
      categoryProblemLabel: 'Wanti hin hojjenne jira',
      categoryFieldLabel: 'Waa\'ee maalii?',
      nameFieldLabel: 'Maqaa kee (filannoo)',
      namePlaceholder: 'Maqaa malee erguuf duwwaa dhiisi',
      contactFieldLabel: 'Bilbila yookaan imeelii (filannoo)',
      contactPlaceholder: 'Yoo deebii barbaadde qofa',
      messageFieldLabel: 'Ergaa kee',
      messagePlaceholder: 'Akka feete gabaabsitee yookaan bal\'isitee barreessi.',
      privacyNote:
        'Yaadonni kan dubbifaman waajjira waldaatiin yoo ta\'u, fuula kana irratti ummataaf hin mul\'atan.',
      submitLabel: 'Yaada ergi',
      submittingLabel: 'Ergamaa jira…',
      thankYouTitle: 'Galatoomi',
      thankYouMessage: 'Yaadni kee waajjira waldaa gaheera. Yeroo kee waan nuuf kennitteef galatoomi.',
      sendAnotherLabel: 'Kan biraa ergi',
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
      facebook: CONTACT_CHANNELS.facebook,
    },
    footer: {
      description: 'Aadaa hafuuraa durii fi ogummaa injinariingii ammayyaa waliin makuun. Sosochii bartummaa dijitaalaa bira gaa\'i.',
      email: 'meleketeahew@gmail.com',
      copyright: '© 2025 Mahibere Ahaw Ecosystem. Mirgi hundi eegamaadha.',
      youtube: CONTACT_CHANNELS.youtube,
      telegram: CONTACT_CHANNELS.telegram,
      facebook: CONTACT_CHANNELS.facebook,
      phone: CONTACT_CHANNELS.phones[0],
      emailLabel: 'Imeelii',
      platformHeading: 'Pilaatfoormii',
      platformLinks: [
        { label: 'Daashboordii', url: '' },
        { label: 'Hawaasa', url: '' },
        { label: 'Xiinxala', url: '' },
        { label: 'Nageenya', url: '' },
      ],
      supportHeading: 'Deggersa',
      supportLinks: [
        { label: "Waa'ee Keenya", url: '/about' },
        { label: 'Sanadoota', url: '' },
        { label: 'API', url: '' },
        { label: 'Giddu-gala Gargaarsaa', url: '' },
        { label: 'Haala Hojii', url: '' },
      ],
      newsletterEnabled: true,
      newsletterHeading: 'Waliin Turi',
      newsletterPlaceholder: 'Imeelii',
      privacyLabel: 'Icciitii',
      privacyUrl: '',
      termsLabel: 'Waliigaltee',
      termsUrl: '',
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
      ctaPrimaryUrl: '/login',
      ctaSecondaryUrl: '#about',
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
      historyLinkLabel: 'ምሉእ ታሪኽና ኣንብቡ',
      historyUrl: '/about',
      missionTitle: 'ተልእኾና',
      missionDescription: 'ወንጌል ኢየሱስ ክርስቶስ መስበኽ፣ ምእመናን ብመንፈሳዊ ሕይወት ምህናጽ፣ መራሕቲ ኣገልግሎት ምድላውን ዲጂታላዊ ኣገልግሎት ምዕባይን።',
      visionTitle: 'ራእይና',
      visionDescription: 'ኣብ ቃል ኣምላኽ ዝተመሠረተት፣ ብመንፈስ ቅዱስ ዝተሓደሰትን ንነፍሲ ወከፍ ብፍቕሪ፣ ብቅድስናን ብሓድነትን እተገልግል ቤተክርስቲያን ምእላይ።',
      beliefsEyebrow: 'መግለጺ እምነት',
      beliefsTitle: 'እንእምነሉ እምነትና',
      beliefs: [
        { title: 'ቅዱሳት መጻሕፍቲ', description: 'መጽሓፍ ቅዱስ ብመንፈስ ኣምላኽ ዝተጻሕፈ፣ ንእምነትን ንሕይወትን ኩሉ ላዕለዋይ መመርሕን መሠረትን እዩ።', icon: 'BookOpen' },
        { title: 'ቅድስት ሥላሴ', description: 'ብሓደ ኣምላኽነት ብሠለስተ ኣካላት፡ በአብ፣ በወልድ፣ በመንፈስ ቅዱስ ንእምን።', icon: 'Church' },
        { title: 'ድሕነት ብክርስቶስ', description: 'ናይ ዘለዓለም ድሕነትን ሕይወትን ብሞትን ትንሣኤን ኢየሱስ ክርስቶስ ብምእማን ዝርከብ ጸጋ እዩ።', icon: 'Heart' },
        { title: 'ሓንቲ ቅድስት ቤተክርስቲያን', description: 'ቤተክርስቲያን ብእምነት፣ ብምሥጢራትን ብመንፈሳዊ ኅብረትን ዝተኣሳሰረት ኣካል ክርስቶስ እያ።', icon: 'Shield' },
      ],
      valuesEyebrow: 'ባህልና',
      valuesTitle: 'መሠረታውያን እሴታትና',
      values: [
        { title: 'ታማኝነት መጽሓፍ ቅዱስ', description: 'ኣብ ኩሉ ትምህርትታትን ኣሰራርሓታትን ቃል ኣምላኽ መሠረት ምግባር።', icon: 'Shield' },
        { title: 'ፍቕርን ሓድነትን', description: 'ንሓድሕድና ብሓድነት፣ ብርኅራኄን ብክርስቲያናዊ ፍቕርን ምድግጋፍ።', icon: 'Users' },
        { title: 'መንፈሳዊ ደቀ መዛሙርትነት', description: 'ምእመናን ብጸሎት፣ ብቅድስናን ብመንፈሳዊ ጥበብን ንኽዓብዩ ምህናጽ።', icon: 'Sparkles' },
        { title: 'ናይ ኣገልጋላይነት መራሕነት', description: 'ብትሕትና፣ ብትጋህን ብታማኝነትን ንኣምላኽን ንሕዝብን ምግልጋል።', icon: 'CheckCircle2' },
      ],
    },
    news: {
      badge: 'ናይ ቀረባ እዋን',
      sectionTitle: 'ዜናን ሓበሬታን',
      sectionDescription: 'ኣብ ቤተክርስቲያንን ኣብ ኣጥቢያታታን ዝካየድ ዘሎ።',
      seeAllLabel: 'ኩሉ ዜናታት ርአ',
      readMoreLabel: 'ተወሳኺ ኣንብብ',
      headOfficeLabel: 'ቤት ጽሕፈት',
      parishLabel: 'ኣጥቢያ',
      emptyTitle: 'ዜናን ሓበሬታን',
      emptyDescription: 'ኣብ ቀረባ እዋን ዜናታትን ሓበሬታን ናይ ኣገልግሎትና ኣብዚ ክወጽእ እዩ።',
      maxPosts: 4,
    },
    suggestions: {
      badge: 'ድምጽኻ',
      sectionTitle: 'ሓሳብካ ንገረና',
      sectionDescription:
        'ዝፈተኻዮ ነገር፣ ክቕየር እትደሊ ነገር፣ ክውሰኽ እትደሊ ነገር — ኣብዚ ጽሓፍ። ብቐጥታ ናብ ቤት ጽሕፈት ቤተክርስቲያን ይበጽሕ።',
      categoryAppreciationLabel: 'ዝፈተኹዎ ነገር',
      categoryChangeLabel: 'ክቕየር ዘለዎ',
      categoryFeatureLabel: 'ክውሰኽ ዘለዎ',
      categoryProblemLabel: 'ዘይሰርሕ ነገር',
      categoryFieldLabel: 'ብዛዕባ እንታይ እዩ?',
      nameFieldLabel: 'ስምካ (ኣማራጺ)',
      namePlaceholder: 'ብዘይ ስም ንምስዳድ ባዶ ግደፎ',
      contactFieldLabel: 'ስልኪ ወይ ኢመይል (ኣማራጺ)',
      contactPlaceholder: 'መልሲ እንተደሊኻ ጥራይ',
      messageFieldLabel: 'መልእኽትኻ',
      messagePlaceholder: 'ከምዝደለኻ ብሓጺር ወይ ብሰፊሑ ጽሓፍ።',
      privacyNote: 'ርእይቶታት ብቤት ጽሕፈት ቤተክርስቲያን ይንበቡ፣ ኣብዚ ገጽ ንህዝቢ ኣይረኣዩን።',
      submitLabel: 'ርእይቶ ስደድ',
      submittingLabel: 'ይለኣኽ ኣሎ…',
      thankYouTitle: 'የቐንየልና',
      thankYouMessage: 'ርእይቶኻ ናብ ቤት ጽሕፈት ቤተክርስቲያን በጺሑ። ግዜኻ ስለዝሃብካና የቐንየልና።',
      sendAnotherLabel: 'ካልእ ስደድ',
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
      facebook: CONTACT_CHANNELS.facebook,
    },
    footer: {
      description: 'ጥንታዊ መንፈሳዊ ክብርታት ምስ ዘመናዊ ምህንድስና ብምውህሃድ። ናብ ምንቅስቓስ ዲጂታላዊ ደቀ መዛሙርትነት ተጸንበሩ።',
      email: 'meleketeahew@gmail.com',
      copyright: '© 2025 ማሕበረ ኣኀው። ኩሉ መሰላት ዝተሓለወ እዩ።',
      youtube: CONTACT_CHANNELS.youtube,
      telegram: CONTACT_CHANNELS.telegram,
      facebook: CONTACT_CHANNELS.facebook,
      phone: CONTACT_CHANNELS.phones[0],
      emailLabel: 'ኢመይል',
      platformHeading: 'መድረኽ',
      platformLinks: [
        { label: 'ዳሽቦርድ', url: '' },
        { label: 'ማሕበረሰብ', url: '' },
        { label: 'ትንተና', url: '' },
        { label: 'ድሕነት', url: '' },
      ],
      supportHeading: 'ደገፍ',
      supportLinks: [
        { label: 'ብዛዕባና', url: '/about' },
        { label: 'ሰነዳት', url: '' },
        { label: 'ናይ API መወከሲ', url: '' },
        { label: 'ማእከል ሓገዝ', url: '' },
        { label: 'ኩነታት', url: '' },
      ],
      newsletterEnabled: true,
      newsletterHeading: 'ተራኺብኩም ጽንሑ',
      newsletterPlaceholder: 'ኢመይል ኣድራሻ',
      privacyLabel: 'ውልቃዊ ሓበሬታ',
      privacyUrl: '',
      termsLabel: 'ውዕላት እምነት',
      termsUrl: '',
    },
  },
};

// ─── Feature card links ───────────────────────────────────────────────────────

/**
 * Where a feature card's "Learn More" goes. Shared by the home page and the
 * Landing Editor, so the hint an admin reads while typing is produced by the
 * same code that does the navigating.
 */
export function featureLinkTarget(feature: LandingFeature): string {
  return feature.learnMoreUrl?.trim() || `/features#${feature.id}`;
}

/** External links open in a new tab; everything else routes in-app. */
export function isExternalLink(url: string): boolean {
  return /^https?:\/\//i.test(url.trim());
}

/** What following a configured link should actually do. */
export type LinkAction =
  | { kind: 'external'; url: string }
  | { kind: 'anchor'; id: string }
  | { kind: 'route'; path: string }
  | { kind: 'none' };

/**
 * One place that decides what a link configured in the Landing Editor means.
 *
 * Shared by the hero buttons, the feature cards and the footer columns, so an
 * admin can type `https://…`, `/news` or `#contact` into any of them and get
 * the behaviour they'd expect from all three.
 */
export function resolveLink(url: string | undefined, fallback = ''): LinkAction {
  const target = (url ?? '').trim() || fallback.trim();
  if (!target) return { kind: 'none' };
  if (isExternalLink(target)) return { kind: 'external', url: target };
  if (target.startsWith('#')) return { kind: 'anchor', id: target.slice(1) };
  return { kind: 'route', path: target };
}

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
