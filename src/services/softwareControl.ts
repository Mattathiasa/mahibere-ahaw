import { db } from '@/lib/firebase';
import type { Translations } from '@/i18n/translations';
import type { modulesEn } from '@/i18n/sections/modules';
import { doc, getDoc, setDoc, onSnapshot } from 'firebase/firestore';

// ─── Central UI control: which roles see which tabs and buttons ──────────────
// Stored in siteConfig/softwareControl (public read via existing siteConfig
// rule; admin-only write). Both the web and any future mobile gating can read
// the same document.

/** Sidebar tabs that can be restricted per role. */
export const NAV_KEYS = [
  'dashboard', 'announcements', 'plans', 'reports', 'members', 'meetings',
  'finance', 'hr', 'inventory', 'churchRules', 'higeDenb', 'strategicPlan',
  'documents', 'userManagement', 'hierarchy', 'settings',
  'news', 'missionary', 'teachings', 'volunteer', 'notifications', 'softwareControl',
  'myAtbiya', 'organisation',
] as const;

/**
 * A navigation entry's name in the reader's language.
 *
 * There used to be a NAV_LABELS map here that restated every nav label in
 * English — a second copy of `translations.en.nav` that could not be translated
 * and drifted from the real one. Resolving through the dictionary means the
 * Software Control table shows the same words as the sidebar it controls.
 */
export function navLabel(t: Translations, key: string): string {
  const nav = t.nav as Record<string, string | undefined>;
  const pages = t.pages as Record<string, string | undefined>;
  return nav[key] ?? pages[key] ?? key;
}

/**
 * UI elements (buttons/actions) that can be toggled or role-restricted.
 * Add a key here + a useElementControl() call at the button to gate it.
 *
 * `key` is the identity: it is persisted in `siteConfig/softwareControl` and
 * must never change. `labelKey` and `pageKey` are display only.
 */
export const ELEMENT_KEYS: {
  key: string;
  labelKey: keyof typeof modulesEn;
  pageKey: string;
}[] = [
  { key: 'announcements.create', labelKey: 'elAnnouncementsCreate', pageKey: 'announcements' },
  { key: 'plans.create', labelKey: 'elPlansCreate', pageKey: 'plans' },
  { key: 'reports.create', labelKey: 'elReportsCreate', pageKey: 'reports' },
  { key: 'members.add', labelKey: 'elMembersAdd', pageKey: 'members' },
  { key: 'members.export', labelKey: 'elMembersExport', pageKey: 'members' },
  { key: 'meetings.schedule', labelKey: 'elMeetingsSchedule', pageKey: 'meetings' },
  { key: 'finance.addTransaction', labelKey: 'elFinanceAddTransaction', pageKey: 'finance' },
  { key: 'finance.createBudget', labelKey: 'elFinanceCreateBudget', pageKey: 'finance' },
  { key: 'finance.generateReport', labelKey: 'elFinanceGenerateReport', pageKey: 'finance' },
  { key: 'hr.add', labelKey: 'elHrAdd', pageKey: 'hr' },
  { key: 'hr.delete', labelKey: 'elHrDelete', pageKey: 'hr' },
  { key: 'inventory.add', labelKey: 'elInventoryAdd', pageKey: 'inventory' },
  { key: 'inventory.delete', labelKey: 'elInventoryDelete', pageKey: 'inventory' },
  { key: 'teachings.create', labelKey: 'elTeachingsCreate', pageKey: 'teachings' },
  { key: 'news.create', labelKey: 'elNewsCreate', pageKey: 'news' },
  { key: 'atbiya.add', labelKey: 'elAtbiyaAdd', pageKey: 'atbiyaRegistry' },
  { key: 'atbiya.addAdmin', labelKey: 'elAtbiyaAddAdmin', pageKey: 'atbiyaRegistry' },
  { key: 'members.approve', labelKey: 'elMembersApprove', pageKey: 'membershipRequests' },
];

export interface ElementRule {
  /** false hides the element for everyone (except super admins). */
  visible?: boolean;
  /** When set, only these hierarchy levels see the element. */
  levels?: string[];
}

export interface SoftwareControlConfig {
  /** navKey → allowed hierarchy levels. Missing key = visible to all. */
  navAccess: Record<string, string[]>;
  /** elementKey → rule. Missing key = visible to all. */
  elements: Record<string, ElementRule>;
  meta?: { updatedAt?: string; updatedBy?: string };
}

export const DEFAULT_SOFTWARE_CONTROL: SoftwareControlConfig = {
  navAccess: {},
  elements: {},
};

const REF = () => doc(db, 'siteConfig', 'softwareControl');

export const softwareControlService = {
  async get(): Promise<SoftwareControlConfig> {
    const snap = await getDoc(REF());
    if (!snap.exists()) return { ...DEFAULT_SOFTWARE_CONTROL };
    return { ...DEFAULT_SOFTWARE_CONTROL, ...(snap.data() as Partial<SoftwareControlConfig>) };
  },

  async save(config: SoftwareControlConfig, updatedBy: string): Promise<void> {
    await setDoc(REF(), {
      ...config,
      meta: { updatedAt: new Date().toISOString(), updatedBy },
    });
  },

  subscribe(cb: (config: SoftwareControlConfig) => void): () => void {
    return onSnapshot(REF(), (snap) => {
      if (snap.exists()) {
        cb({ ...DEFAULT_SOFTWARE_CONTROL, ...(snap.data() as Partial<SoftwareControlConfig>) });
      } else {
        cb({ ...DEFAULT_SOFTWARE_CONTROL });
      }
    }, () => cb({ ...DEFAULT_SOFTWARE_CONTROL }));
  },
};

// ─── Pure helpers (shared by the hook and any direct callers) ────────────────

export function navAllowed(
  config: SoftwareControlConfig,
  navKey: string,
  level: string,
  isSuperAdmin: boolean
): boolean {
  if (isSuperAdmin) return true;
  const allowed = config.navAccess[navKey];
  if (!allowed || allowed.length === 0) return true;
  return allowed.includes(level);
}

export function elementAllowed(
  config: SoftwareControlConfig,
  elementKey: string,
  level: string,
  isSuperAdmin: boolean
): boolean {
  if (isSuperAdmin) return true;
  const rule = config.elements[elementKey];
  if (!rule) return true;
  if (rule.visible === false) return false;
  if (rule.levels && rule.levels.length > 0) return rule.levels.includes(level);
  return true;
}
