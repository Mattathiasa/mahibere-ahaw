import { db } from '@/lib/firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import type { Language } from '@/i18n/translations';

/**
 * The /features page, in full.
 *
 * Every word and picture on that page used to be a string literal in
 * AboutFeatures.tsx — no Firestore, no translations, and images hotlinked from
 * Unsplash. This mirrors `landingContent.ts` exactly: one complete copy per
 * language in a single `siteConfig` document, deep-merged over the defaults on
 * read so a half-filled translation still renders.
 */

/**
 * Section accents. A fixed list rather than free text: Tailwind classes
 * assembled at runtime are not in the source, so the purge would strip them and
 * the colour would silently vanish in the production build.
 */
export const FEATURE_COLORS = {
  blue: 'bg-blue-500/10 text-blue-500',
  emerald: 'bg-emerald-500/10 text-emerald-500',
  purple: 'bg-purple-500/10 text-purple-500',
  amber: 'bg-amber-500/10 text-amber-500',
  rose: 'bg-rose-500/10 text-rose-500',
  cyan: 'bg-cyan-500/10 text-cyan-500',
} as const;

export type FeatureColor = keyof typeof FEATURE_COLORS;
export const FEATURE_COLOR_KEYS = Object.keys(FEATURE_COLORS) as FeatureColor[];

export function colorClass(color: string | undefined): string {
  return FEATURE_COLORS[(color ?? 'blue') as FeatureColor] ?? FEATURE_COLORS.blue;
}

export interface FeatureSection {
  /**
   * The `#anchor` in /features#<id>. Home's feature cards link here using
   * `LandingFeature.id`, so the two must match — the editor says so.
   */
  id: string;
  title: string;
  subtitle: string;
  description: string;
  /** Lucide icon name, resolved through ICON_MAP. */
  icon: string;
  color: FeatureColor | string;
  bullets: string[];
  imageUrl: string;
  ctaLabel: string;
}

export interface FeaturesContent {
  badge: string;
  title: string;
  titleHighlight: string;
  subtitle: string;
  backLabel: string;
  brand: string;
  sections: FeatureSection[];
  cta: {
    title: string;
    description: string;
    primaryLabel: string;
    secondaryLabel: string;
  };
  footer: string;
}

export type MultiLangFeaturesContent = Partial<Record<Language, FeaturesContent>> & {
  meta?: { updatedAt?: string; updatedBy?: string };
};

const EN: FeaturesContent = {
  badge: 'Ecosystem Details',
  title: 'Divine Tools for',
  titleHighlight: 'Modern Ministry',
  subtitle: 'Discover how Mahibere Ahaw empowers your church to manage, plan, and grow in the digital age.',
  backLabel: 'Back to Home',
  brand: 'MAHIBERE AHAW',
  sections: [
    {
      id: 'members',
      title: 'Member Management',
      subtitle: 'The Heart of Your Ministry',
      description: 'Comprehensive tools to manage your congregation with dignity and precision. From spiritual growth tracking to ministry assignments, keep everyone connected.',
      icon: 'Users',
      color: 'blue',
      bullets: [
        'Detailed spiritual profiles for every member',
        'Ministry assignment and participation tracking',
        'Advanced search and filtering by region or hierarchy',
        'Secure contact and family relationship management',
        'Automated birthday and anniversary spiritual blessings',
      ],
      imageUrl: '',
      ctaLabel: 'Experience This Feature',
    },
    {
      id: 'planning',
      title: 'Planning Management',
      subtitle: 'Visionary Leadership Tools',
      description: 'Strategic planning made simple. Coordinate events, manage liturgical calendars, and align your ministry goals across all levels of the church hierarchy.',
      icon: 'Calendar',
      color: 'emerald',
      bullets: [
        'Dynamic liturgical calendar integration',
        'Hierarchical event coordination (Sinodos to Atbiya)',
        'Resource and venue allocation management',
        'Task delegation and progress monitoring',
        'Collaborative planning workspaces for ministries',
      ],
      imageUrl: '',
      ctaLabel: 'Experience This Feature',
    },
    {
      id: 'reports',
      title: 'Report Management',
      subtitle: 'Insightful Stewardship',
      description: 'Transform data into divine insights. Generate comprehensive reports on ministry growth, financial stewardship, and spiritual milestones with ease.',
      icon: 'BarChart3',
      color: 'purple',
      bullets: [
        'Real-time automated gathering of statistics',
        'Customizable report templates for all departments',
        'Financial transparency and audit-ready tools',
        'Visual growth trends and impact analytics',
        'Secure multi-level reporting submission system',
      ],
      imageUrl: '',
      ctaLabel: 'Experience This Feature',
    },
  ],
  cta: {
    title: 'Ready to Transform Your Church?',
    description: 'Join hundreds of congregations already using Mahibere Ahaw to serve their communities.',
    primaryLabel: 'Get Started Now',
    secondaryLabel: 'Contact Support',
  },
  footer: `© ${new Date().getFullYear()} Mahibere Ahaw Ecosystem. All Rights Reserved.`,
};

/**
 * Amharic. Spelling of the church's name matches what the rest of the app
 * already ships — `ማኅበረ አኀው`, per landingContent and the footer copyright.
 *
 * REVIEW: this is marketing prose describing the church's own platform, so the
 * wording is the church's voice. It is a faithful translation of the English
 * above rather than independently written Amharic copy, and an admin can
 * rewrite any of it in the Landing Editor without a deploy.
 */
const AM: FeaturesContent = {
  badge: 'የሥርዓቱ ዝርዝር',
  title: 'መንፈሳዊ መሣሪያዎች ለ',
  titleHighlight: 'ዘመናዊ አገልግሎት',
  subtitle:
    'ማኅበረ አኀው ቤተ ክርስቲያንዎን በዲጂታል ዘመን እንድታስተዳድር፣ እንድታቅድና እንድታድግ እንዴት እንደሚያግዝ ይመልከቱ።',
  backLabel: 'ወደ ዋና ገፅ ተመለስ',
  brand: 'ማኅበረ አኀው',
  sections: [
    {
      id: 'members',
      title: 'የአባላት አስተዳደር',
      subtitle: 'የአገልግሎትዎ ልብ',
      description:
        'ምእመናንዎን በክብርና በጥንቃቄ ለማስተዳደር የተሟሉ መሣሪያዎች። ከመንፈሳዊ ዕድገት ክትትል እስከ የአገልግሎት ኃላፊነት ድልድል ድረስ፣ ሁሉንም ሰው በአንድነት ያገናኙ።',
      icon: 'Users',
      color: 'blue',
      bullets: [
        'ለእያንዳንዱ አባል ዝርዝር መንፈሳዊ መገለጫ',
        'የአገልግሎት ኃላፊነት ድልድልና የተሳትፎ ክትትል',
        'በክልል ወይም በእርከን የላቀ ፍለጋና ማጣሪያ',
        'የተጠበቀ የአድራሻና የቤተሰብ ግንኙነት አያያዝ',
        'በራስ-ሰር የልደትና የዓመት በዓል መንፈሳዊ ምርቃት',
      ],
      imageUrl: '',
      ctaLabel: 'ይህንን አገልግሎት ይሞክሩ',
    },
    {
      id: 'planning',
      title: 'የዕቅድ አስተዳደር',
      subtitle: 'የራእይ መሪነት መሣሪያዎች',
      description:
        'ስትራቴጂያዊ ዕቅድ ቀላል ሆኗል። ዝግጅቶችን ያስተባብሩ፣ የአጽዋማትና የበዓላት ቀን መቁጠሪያን ያስተዳድሩ፣ የአገልግሎት ግቦችዎን በሁሉም የቤተ ክርስቲያኒቱ እርከኖች ያስተሳስሩ።',
      icon: 'Calendar',
      color: 'emerald',
      bullets: [
        'ተለዋዋጭ የበዓላት ቀን መቁጠሪያ ውሕደት',
        'በእርከን የተደራጀ የዝግጅት ማስተባበር (ከሲኖዶስ እስከ አጥቢያ)',
        'የሀብትና የቦታ ድልድል አስተዳደር',
        'የተግባር ውክልናና የሂደት ክትትል',
        'ለአገልግሎት ክፍሎች የጋራ የዕቅድ መደላድል',
      ],
      imageUrl: '',
      ctaLabel: 'ይህንን አገልግሎት ይሞክሩ',
    },
    {
      id: 'reports',
      title: 'የሪፖርት አስተዳደር',
      subtitle: 'በማስተዋል መጋቢነት',
      description:
        'መረጃን ወደ መንፈሳዊ ማስተዋል ይለውጡ። ስለ አገልግሎት ዕድገት፣ ስለ ገንዘብ መጋቢነትና ስለ መንፈሳዊ ምዕራፎች የተሟሉ ሪፖርቶችን በቀላሉ ያዘጋጁ።',
      icon: 'BarChart3',
      color: 'purple',
      bullets: [
        'በራስ-ሰር በቅጽበት የሚሰበሰብ ስታቲስቲክስ',
        'ለሁሉም መምሪያዎች የሚስተካከሉ የሪፖርት ቅጦች',
        'የገንዘብ ግልጽነትና ለኦዲት የተዘጋጁ መሣሪያዎች',
        'የዕድገት አዝማሚያና የተጽዕኖ ትንተና በሥዕል',
        'የተጠበቀ ባለ ብዙ እርከን የሪፖርት ማቅረቢያ ሥርዓት',
      ],
      imageUrl: '',
      ctaLabel: 'ይህንን አገልግሎት ይሞክሩ',
    },
  ],
  cta: {
    title: 'ቤተ ክርስቲያንዎን ለመለወጥ ዝግጁ ነዎት?',
    description:
      'ማኅበረሰባቸውን ለማገልገል ማኅበረ አኀውን አስቀድመው ከሚጠቀሙ በመቶዎች ከሚቆጠሩ ጉባኤያት ጋር ይቀላቀሉ።',
    primaryLabel: 'አሁን ይጀምሩ',
    secondaryLabel: 'ድጋፍ ያግኙ',
  },
  footer: `© ${new Date().getFullYear()} ማኅበረ አኀው ስነ-ምህዳር። ሁሉም መብቶች የተጠበቁ ናቸው።`,
};

/**
 * Amharic is the app default, so the /features page — which every "Learn More"
 * on the home page links to — is now Amharic out of the box. It used to map to
 * the English copy, making it the largest English surface on the public site
 * for a readership that mostly does not read English.
 *
 * Afaan Oromoo and Tigrinya still fall back to English rather than to invented
 * marketing prose nobody has reviewed. Both are listed for translation in the
 * Landing Editor, and a partial translation deep-merges over these defaults.
 */
export const DEFAULT_FEATURES_CONTENT: Record<Language, FeaturesContent> = {
  en: EN,
  am: AM,
  om: EN,
  ti: EN,
};

const REF = () => doc(db, 'siteConfig', 'featuresPage');

export const featuresContentService = {
  async getAll(): Promise<MultiLangFeaturesContent> {
    try {
      const snap = await getDoc(REF());
      return snap.exists() ? (snap.data() as MultiLangFeaturesContent) : {};
    } catch {
      // Public page: it must render from defaults rather than fail.
      return {};
    }
  },

  async saveAll(data: MultiLangFeaturesContent, updatedBy: string): Promise<void> {
    await setDoc(REF(), {
      ...data,
      meta: { updatedAt: new Date().toISOString(), updatedBy },
    });
  },
};
