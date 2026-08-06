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
 * The other languages start as the English copy on purpose.
 *
 * Inventing Amharic, Afaan Oromoo and Tigrinya marketing prose here would put
 * words in the church's mouth that nobody reviewed. Showing the English until
 * an admin translates it in the editor is the honest default.
 */
export const DEFAULT_FEATURES_CONTENT: Record<Language, FeaturesContent> = {
  en: EN,
  am: EN,
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
