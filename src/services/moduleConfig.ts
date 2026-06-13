import { db } from '@/lib/firebase';
import { doc, getDoc, setDoc, onSnapshot } from 'firebase/firestore';

// ─── Configurable module content: Members, Plans, Reports ────────────────────
// Lets admins edit each module's page header, "Learn More" help content, the
// option lists used in its dropdowns, and which form fields are shown/required.
// Stored in siteConfig/moduleConfig (public read, admin write).

export type ModuleKey = 'members' | 'plans' | 'reports';

export interface FieldConfig {
  key: string;
  label: string;
  visible: boolean;
  required: boolean;
}

export interface SingleModuleConfig {
  /** Overrides the page header title; empty = use the translated default. */
  headerTitle: string;
  /** Overrides the page header description; empty = translated default. */
  headerDescription: string;
  /** Rich help text shown behind a "Learn More" button (supports line breaks). */
  learnMore: string;
  /** Form fields, with show/require toggles. */
  fields: FieldConfig[];
  /** Named option lists used by the module's dropdowns. */
  options: Record<string, string[]>;
}

export type ModuleConfig = Record<ModuleKey, SingleModuleConfig> & {
  meta?: { updatedAt?: string; updatedBy?: string };
};

export const DEFAULT_MODULE_CONFIG: ModuleConfig = {
  members: {
    headerTitle: '',
    headerDescription: '',
    learnMore:
      'The Members module is your church directory. Add members with their personal contact, jurisdiction (hierarchy level, region, zone), and ministry roles. Use search, sort and filters to find people quickly, and export the directory when permitted.',
    fields: [
      { key: 'fullName', label: 'Full Name', visible: true, required: true },
      { key: 'phone', label: 'Phone', visible: true, required: false },
      { key: 'gender', label: 'Gender', visible: true, required: false },
      { key: 'dateOfBirth', label: 'Date of Birth', visible: true, required: false },
      { key: 'workSchool', label: 'Work / School', visible: true, required: false },
      { key: 'maritalStatus', label: 'Marital Status', visible: true, required: false },
      { key: 'hierarchyLevel', label: 'Hierarchy Level', visible: true, required: true },
    ],
    options: {
      genders: ['Male', 'Female'],
      sortBy: ['name', 'hierarchy', 'region', 'zone'],
    },
  },
  plans: {
    headerTitle: '',
    headerDescription: '',
    learnMore:
      'The Plans module organises ministry plans across all levels. Create a plan with a name, a period (weekly, monthly or annually) and details, then track progress through reports submitted against it.',
    fields: [
      { key: 'name', label: 'Plan Name', visible: true, required: true },
      { key: 'timeframe', label: 'Period', visible: true, required: true },
      { key: 'details', label: 'Details', visible: true, required: false },
    ],
    options: {
      periods: ['Weekly', 'Monthly', 'Annually'],
    },
  },
  reports: {
    headerTitle: '',
    headerDescription: '',
    learnMore:
      'The Reports module is where units submit and review work reports. Pick the plan a report belongs to, choose the submission type, describe the work done and the results, and leaders can add professional feedback.',
    fields: [
      { key: 'plan', label: 'Related Plan', visible: true, required: true },
      { key: 'type', label: 'Submission Type', visible: true, required: true },
      { key: 'workDone', label: 'Work Done', visible: true, required: true },
      { key: 'results', label: 'Results', visible: true, required: false },
    ],
    options: {
      types: ['Memriya', 'Kifil', 'Zerf'],
    },
  },
};

const REF = () => doc(db, 'siteConfig', 'moduleConfig');

export const moduleConfigService = {
  async get(): Promise<ModuleConfig> {
    const snap = await getDoc(REF());
    if (!snap.exists()) return { ...DEFAULT_MODULE_CONFIG };
    const data = snap.data() as Partial<ModuleConfig>;
    // Merge per-module so new default fields/options appear even on old docs.
    return {
      members: { ...DEFAULT_MODULE_CONFIG.members, ...(data.members ?? {}) },
      plans: { ...DEFAULT_MODULE_CONFIG.plans, ...(data.plans ?? {}) },
      reports: { ...DEFAULT_MODULE_CONFIG.reports, ...(data.reports ?? {}) },
      meta: data.meta,
    };
  },

  async save(config: ModuleConfig, updatedBy: string): Promise<void> {
    await setDoc(REF(), {
      ...config,
      meta: { updatedAt: new Date().toISOString(), updatedBy },
    });
  },

  subscribe(cb: (config: ModuleConfig) => void): () => void {
    return onSnapshot(REF(), (snap) => {
      if (!snap.exists()) { cb({ ...DEFAULT_MODULE_CONFIG }); return; }
      const data = snap.data() as Partial<ModuleConfig>;
      cb({
        members: { ...DEFAULT_MODULE_CONFIG.members, ...(data.members ?? {}) },
        plans: { ...DEFAULT_MODULE_CONFIG.plans, ...(data.plans ?? {}) },
        reports: { ...DEFAULT_MODULE_CONFIG.reports, ...(data.reports ?? {}) },
        meta: data.meta,
      });
    }, () => cb({ ...DEFAULT_MODULE_CONFIG }));
  },
};
