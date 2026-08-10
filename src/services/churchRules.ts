import { db } from '@/lib/firebase';
import type { Language } from '@/i18n/translations';
import { doc, getDoc, setDoc } from 'firebase/firestore';

// ─── Church Rules (Hige Denb), three categories ──────────────────────────────
// Regulations (Denb), Directives (Memerya), Policies. Admin-editable, stored in
// siteConfig/churchRules (public read, admin write via existing siteConfig rule).

export interface RuleItem {
  title: string;
  content: string;
}

export interface ChurchRulesData {
  denb: RuleItem[];      // ደንብ — Regulations
  memerya: RuleItem[];   // መመሪያ — Directives
  policies: RuleItem[];  // Policies
  meta?: { updatedAt?: string; updatedBy?: string };
}

const RULES_EN: ChurchRulesData = {
  denb: [
    { title: 'Sunday Worship', content: 'All members are expected to attend Sunday worship services regularly with devotion and humility.' },
    { title: 'Membership Conduct', content: 'Members must uphold spiritual and moral purity in personal and public life, honoring the hierarchy and spiritual leadership.' },
    { title: 'Tithe (Asrat)', content: 'Faithful and regular contribution of the tithe supports the operations and ministry of the church.' },
  ],
  memerya: [
    { title: 'Reporting Directive', content: 'All Memriya members and higher levels must submit regular reports (weekly, monthly, or yearly) on attendance, finance, and ministry progress.' },
    { title: 'Communication Protocol', content: 'Official announcements may only be made by Memriya level and above, following the established chain of command.' },
    { title: 'Ministry Conduct', content: 'Ministry workers must complete appropriate training and maintain regular attendance and active participation in assigned areas.' },
  ],
  policies: [
    { title: 'Financial Accountability', content: 'Elections, appointments, and financial management follow the Central Council guidelines; transparency and divine accountability are the pillars of administration.' },
    { title: 'Asset Stewardship', content: 'Church funds, property, and sacred items must be handled with care; misuse is strictly prohibited.' },
  ],
};

const RULES_AM: ChurchRulesData = {
  denb: [
    { title: 'የእሑድ አምልኮ', content: 'አባላት ሁሉ በእሑድ የአምልኮ ሥርዓት ላይ በተመስጦና በትሕትና በመደበኛነት እንዲገኙ ይጠበቃል።' },
    { title: 'የአባልነት ሥነ ምግባር', content: 'አባላት በግልና በሕዝብ ሕይወታቸው መንፈሳዊና ሥነ ምግባራዊ ንጽሕናን መጠበቅ፣ እርከኑንና መንፈሳዊ አመራሩን ማክበር አለባቸው።' },
    { title: 'አሥራት', content: 'በታማኝነትና በመደበኛነት የሚሰጥ አሥራት የቤተ ክርስቲያኒቱን ሥራና አገልግሎት ይደግፋል።' },
  ],
  memerya: [
    { title: 'የሪፖርት መመሪያ', content: 'የመምሪያ አባላትና ከዚያ በላይ ያሉ እርከኖች ሁሉ ስለ ተሳትፎ፣ ገንዘብና የአገልግሎት ሂደት መደበኛ ሪፖርት (ሳምንታዊ፣ ወርኃዊ ወይም ዓመታዊ) ማቅረብ አለባቸው።' },
    { title: 'የመገናኛ ሥርዓት', content: 'ይፋዊ ማስታወቂያ ማውጣት የሚችሉት ከመምሪያ ደረጃና ከዚያ በላይ ያሉ ብቻ ሲሆኑ፣ የተዘረጋውን የትእዛዝ ሰንሰለት መከተል አለባቸው።' },
    { title: 'የአገልግሎት ሥነ ምግባር', content: 'የአገልግሎት ሠራተኞች ተገቢውን ሥልጠና ማጠናቀቅ፣ በመደበኛነት መገኘትና በተመደቡበት ዘርፍ በንቃት መሳተፍ አለባቸው።' },
  ],
  policies: [
    { title: 'የገንዘብ ተጠያቂነት', content: 'ምርጫ፣ ሹመትና የገንዘብ አስተዳደር የማዕከላዊ ጉባኤውን መመሪያ ይከተላሉ፤ ግልጽነትና መንፈሳዊ ተጠያቂነት የአስተዳደሩ ምሰሶዎች ናቸው።' },
    { title: 'የንብረት መጋቢነት', content: 'የቤተ ክርስቲያኒቱ ገንዘብ፣ ንብረትና ቅዱሳት ንዋያት በጥንቃቄ መያዝ አለባቸው፤ አላግባብ መጠቀም በጥብቅ የተከለከለ ነው።' },
  ],
};

/**
 * Seed rules per language, mirroring how landingContent and featuresContent
 * ship their defaults. These are what the church sees until an admin writes
 * its own in the Church Rules editor, so Amharic — the app default — needs a
 * real version rather than English standing in.
 *
 * Afaan Oromoo and Tigrinya fall back to English rather than to prose nobody
 * has reviewed.
 */
export const DEFAULT_CHURCH_RULES_BY_LANGUAGE: Record<Language, ChurchRulesData> = {
  en: RULES_EN,
  am: RULES_AM,
  om: RULES_EN,
  ti: RULES_EN,
};

/** Kept for callers that predate the per-language defaults. */
export const DEFAULT_CHURCH_RULES = RULES_EN;


const REF = () => doc(db, 'siteConfig', 'churchRules');

export const churchRulesService = {
  async get(): Promise<ChurchRulesData> {
    const snap = await getDoc(REF());
    if (!snap.exists()) return { ...DEFAULT_CHURCH_RULES };
    const d = snap.data() as Partial<ChurchRulesData>;
    return {
      denb: d.denb ?? DEFAULT_CHURCH_RULES.denb,
      memerya: d.memerya ?? DEFAULT_CHURCH_RULES.memerya,
      policies: d.policies ?? DEFAULT_CHURCH_RULES.policies,
      meta: d.meta,
    };
  },

  async save(data: ChurchRulesData, updatedBy: string): Promise<void> {
    await setDoc(REF(), {
      denb: data.denb,
      memerya: data.memerya,
      policies: data.policies,
      meta: { updatedAt: new Date().toISOString(), updatedBy },
    });
  },
};
