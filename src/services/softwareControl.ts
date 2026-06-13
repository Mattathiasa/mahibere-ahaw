import { db } from '@/lib/firebase';
import { doc, getDoc, setDoc, onSnapshot } from 'firebase/firestore';

// ─── Central UI control: which roles see which tabs and buttons ──────────────
// Stored in siteConfig/softwareControl (public read via existing siteConfig
// rule; admin-only write). Both the web and any future mobile gating can read
// the same document.

export const HIERARCHY_LEVELS = [
  'Sinodos',
  'KuamiSinodos',
  'Memriya',
  'Zone',
  'Atbiya',
  'EnkesekaseMaikel',
  'HiyawanMahderat',
] as const;

/** Sidebar tabs that can be restricted per hierarchy level. */
export const NAV_KEYS = [
  'dashboard', 'announcements', 'plans', 'reports', 'members', 'meetings',
  'finance', 'hr', 'inventory', 'churchRules', 'higeDenb', 'strategicPlan',
  'documents', 'userManagement', 'hierarchy', 'settings',
] as const;

/** UI elements (buttons/actions) that can be toggled or role-restricted.
 *  Add a key here + a useElementControl() call at the button to gate it. */
export const ELEMENT_KEYS: { key: string; label: string; page: string }[] = [
  { key: 'announcements.create', label: 'New Announcement button', page: 'Announcements' },
  { key: 'plans.create', label: 'New Plan button', page: 'Plans' },
  { key: 'reports.create', label: 'New Report button', page: 'Reports' },
  { key: 'members.add', label: 'Add Member button', page: 'Members' },
  { key: 'members.export', label: 'Export button', page: 'Members' },
  { key: 'meetings.schedule', label: 'Schedule Meeting button', page: 'Meetings' },
  { key: 'finance.addTransaction', label: 'Add Transaction button', page: 'Finance' },
  { key: 'finance.createBudget', label: 'Create Budget button', page: 'Finance' },
  { key: 'finance.generateReport', label: 'Generate Report button', page: 'Finance' },
  { key: 'hr.add', label: 'Add Employee button', page: 'HR' },
  { key: 'hr.delete', label: 'Delete Employee button', page: 'HR' },
  { key: 'inventory.add', label: 'Add Asset button', page: 'Inventory' },
  { key: 'inventory.delete', label: 'Delete Asset button', page: 'Inventory' },
  { key: 'teachings.create', label: 'Create Teaching button', page: 'Teachings' },
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
