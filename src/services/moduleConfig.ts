import { db } from '@/lib/firebase';
import type { Translations } from '@/i18n/translations';
import type { modulesEn } from '@/i18n/sections/modules';
import { doc, getDoc, setDoc, onSnapshot } from 'firebase/firestore';

// ─── Configurable module content for every post-login page ───────────────────
// Each module exposes: page header (title/description), a "Learn More" help
// panel, form-field show/require toggles, and named option lists used by its
// dropdowns. Stored in siteConfig/moduleConfig (public read, admin write).

export type ModuleKey =
  | 'members' | 'plans' | 'reports' | 'announcements' | 'meetings' | 'finance'
  | 'hr' | 'inventory' | 'teachings' | 'documents' | 'hierarchy' | 'missionary'
  | 'volunteer' | 'strategicPlan' | 'churchRules' | 'higeDenb' | 'news';

export interface FieldConfig {
  key: string;
  /**
   * The admin's override. Blank means "use the built-in translated default",
   * matching how headerTitle and headerDescription already work in this file.
   *
   * This is NOT where the built-in label lives. It used to be, and that was a
   * trap: moduleConfig round-trips through Firestore, so the moment an admin
   * pressed Save the English defaults were persisted and `mergeModule`'s
   * `over.fields ?? base.fields` made them win over anything shipped later.
   */
  label: string;
  /** Translation key for the built-in default. Resolved via `fieldLabel`. */
  labelKey?: keyof typeof modulesEn;
  visible: boolean;
  required: boolean;
}

export interface SingleModuleConfig {
  /** Overrides the page header title; empty = translated default. */
  headerTitle: string;
  /** Overrides the page header description; empty = translated default. */
  headerDescription: string;
  /** Rich help text shown behind a "Learn More" button (line breaks kept). */
  learnMore: string;
  /** Form fields, with show/require toggles. */
  fields: FieldConfig[];
  /** Named option lists used by the module's dropdowns. */
  options: Record<string, string[]>;
}

export type ModuleConfig = Record<ModuleKey, SingleModuleConfig> & {
  meta?: { updatedAt?: string; updatedBy?: string };
};

/**
 * A built-in field. `labelKey` points at the translated default; `label` starts
 * blank and only fills in when an admin types an override — see FieldConfig.
 */
const f = (
  key: string,
  labelKey: keyof typeof modulesEn,
  visible = true,
  required = false
): FieldConfig => ({ key, label: '', labelKey, visible, required });

export const MODULE_KEYS: ModuleKey[] = [
  'members', 'plans', 'reports', 'announcements', 'meetings', 'finance',
  'hr', 'inventory', 'teachings', 'documents', 'hierarchy', 'missionary',
  'volunteer', 'strategicPlan', 'churchRules', 'higeDenb', 'news',
];

export const DEFAULT_MODULE_CONFIG: ModuleConfig = {
  news: {
    headerTitle: '', headerDescription: '',
    learnMore: '',
    fields: [
      f('title', 'fldNewsTitle', true, true),
      f('excerpt', 'fldNewsExcerpt'),
      f('body', 'fldNewsBody', true, true),
      f('coverImageUrl', 'fldNewsCoverImageUrl'),
    ],
    options: {},
  },
  members: {
    headerTitle: '', headerDescription: '',
    learnMore: '',
    fields: [
      f('fullName', 'fldMembersFullName', true, true),
      f('phone', 'fldMembersPhone'),
      f('gender', 'fldMembersGender'),
      f('dateOfBirth', 'fldMembersDateOfBirth'),
      f('workSchool', 'fldMembersWorkSchool'),
      f('maritalStatus', 'fldMembersMaritalStatus'),
      f('hierarchyLevel', 'fldMembersHierarchyLevel', true, true),
    ],
    options: { genders: ['Male', 'Female'], sortBy: ['name', 'hierarchy', 'region', 'zone'] },
  },
  plans: {
    headerTitle: '', headerDescription: '',
    learnMore: '',
    fields: [f('name', 'fldPlansName', true, true), f('timeframe', 'fldPlansTimeframe', true, true), f('department', 'fldPlansDepartment'), f('details', 'fldPlansDetails')],
    options: {
      periods: ['Weekly', 'Monthly', 'Annually'],
      departments: ['Evangelism', 'Education & Training', 'Services Coordination', 'Administration & Finance', 'Public & External Relations', 'Youth & Children'],
    },
  },
  reports: {
    headerTitle: '', headerDescription: '',
    learnMore: '',
    fields: [
      f('plan', 'fldReportsPlan', true, true), f('type', 'fldReportsType', true, true),
      f('department', 'fldReportsDepartment'),
      f('workPlanned', 'fldReportsWorkPlanned'), f('workPerformed', 'fldReportsWorkPerformed', true, true),
      f('uncompletedTasks', 'fldReportsUncompletedTasks'), f('results', 'fldReportsResults'),
    ],
    options: {
      types: ['Memriya', 'Kifil', 'Zerf'],
      departments: ['Evangelism', 'Education & Training', 'Services Coordination', 'Administration & Finance', 'Public & External Relations', 'Youth & Children'],
    },
  },
  announcements: {
    headerTitle: '', headerDescription: '',
    learnMore: '',
    fields: [f('title', 'fldAnnouncementsTitle', true, true), f('content', 'fldAnnouncementsContent', true, true), f('expiresAt', 'fldAnnouncementsExpiresAt')],
    options: {},
  },
  meetings: {
    headerTitle: '', headerDescription: '',
    learnMore: '',
    fields: [f('title', 'fldMeetingsTitle', true, true), f('scheduledDate', 'fldMeetingsScheduledDate', true, true), f('location', 'fldMeetingsLocation'), f('description', 'fldMeetingsDescription')],
    options: {},
  },
  finance: {
    headerTitle: '', headerDescription: '',
    learnMore: '',
    fields: [],
    options: {
      transactionTypes: ['Income', 'Expense', 'Tithe', 'Offering', 'Donation', 'Collection', 'Deposit', 'Asrat', 'YefikirSetota', 'Transfer'],
      bankAccounts: ['CBE', 'Berhan Bank', 'Abyssinia Bank', 'Awash Bank', 'Oromia Bank', 'Nib Bank'],
    },
  },
  hr: {
    headerTitle: '', headerDescription: '',
    learnMore: '',
    fields: [
      f('fullName', 'fldHrFullName', true, true), f('position', 'fldHrPosition', true, true),
      f('department', 'fldHrDepartment'), f('employmentType', 'fldHrEmploymentType'),
      f('salary', 'fldHrSalary'), f('hireDate', 'fldHrHireDate'), f('phone', 'fldHrPhone'),
      f('email', 'fldHrEmail'), f('status', 'fldHrStatus'),
    ],
    options: {
      employmentTypes: ['FullTime', 'PartTime', 'Contract', 'Volunteer'],
      statuses: ['Active', 'OnLeave', 'Terminated'],
    },
  },
  inventory: {
    headerTitle: '', headerDescription: '',
    learnMore: '',
    fields: [
      f('name', 'fldInventoryName', true, true), f('category', 'fldInventoryCategory'), f('quantity', 'fldInventoryQuantity', true, true),
      f('location', 'fldInventoryLocation'), f('assignedTo', 'fldInventoryAssignedTo'), f('condition', 'fldInventoryCondition'),
      f('status', 'fldInventoryStatus'), f('value', 'fldInventoryValue'), f('purchaseDate', 'fldInventoryPurchaseDate'),
    ],
    options: {
      conditions: ['New', 'Good', 'Fair', 'Poor'],
      statuses: ['InUse', 'InStorage', 'Maintenance', 'Retired'],
    },
  },
  teachings: {
    headerTitle: '', headerDescription: '',
    learnMore: '',
    fields: [
      f('title', 'fldTeachingsTitle', true, true), f('speaker', 'fldTeachingsSpeaker'), f('serviceType', 'fldTeachingsServiceType'),
      f('shortDescription', 'fldTeachingsShortDescription'), f('fullContent', 'fldTeachingsFullContent'), f('dateDelivered', 'fldTeachingsDateDelivered'),
    ],
    options: { serviceTypes: ['Sunday Morning', 'Wednesday Bible Study', "Men's Breakfast", "Women's Ministry", 'Youth Service', 'Special Event', 'Other'] },
  },
  documents: {
    headerTitle: '', headerDescription: '',
    learnMore: '',
    fields: [],
    options: {},
  },
  hierarchy: {
    headerTitle: '', headerDescription: '',
    learnMore: '',
    fields: [],
    options: {},
  },
  missionary: {
    headerTitle: '', headerDescription: '',
    learnMore: '',
    fields: [
      f('missionaryType', 'fldMissionaryMissionaryType', true, true), f('desiredLocation', 'fldMissionaryDesiredLocation'),
      f('whyServe', 'fldMissionaryWhyServe'),
    ],
    options: { missionaryTypes: ['FullTime', 'PartTime', 'ShortTerm'] },
  },
  volunteer: {
    headerTitle: '', headerDescription: '',
    learnMore: '',
    fields: [],
    options: {
      ministries: ['Ebet Metreg', 'Natanim Agelgelot', 'Choir', 'Ushering', 'Sunday School', 'Charity', 'Evangelism', 'Media'],
    },
  },
  strategicPlan: {
    headerTitle: '', headerDescription: '',
    learnMore: '',
    fields: [],
    options: {},
  },
  churchRules: {
    headerTitle: '', headerDescription: '',
    learnMore: '',
    fields: [],
    options: {},
  },
  higeDenb: {
    headerTitle: '', headerDescription: '',
    learnMore: '',
    fields: [],
    options: {},
  },
};

/**
 * A field's label in the reader's language: the admin's override if they typed
 * one, otherwise the built-in translation, otherwise the raw field key.
 */
export function fieldLabel(t: Translations, field: FieldConfig): string {
  if (field.label.trim()) return field.label;
  const section = t.modules as unknown as Record<string, string | undefined>;
  return (field.labelKey && section[field.labelKey]) || field.key;
}

/** A module's "learn more" text: the admin's override, else the built-in translation. */
export function moduleLearnMore(t: Translations, key: ModuleKey, cfg: SingleModuleConfig): string {
  if (cfg.learnMore.trim()) return cfg.learnMore;
  const section = t.modules as unknown as Record<string, string | undefined>;
  return section[`${key}LearnMore`] ?? '';
}

function mergeModule(base: SingleModuleConfig, over?: Partial<SingleModuleConfig>): SingleModuleConfig {
  if (!over) return base;
  return {
    headerTitle: over.headerTitle ?? base.headerTitle,
    headerDescription: over.headerDescription ?? base.headerDescription,
    learnMore: over.learnMore ?? base.learnMore,
    fields: over.fields ?? base.fields,
    options: over.options ?? base.options,
  };
}

function mergeAll(data: Partial<ModuleConfig>): ModuleConfig {
  const out = {} as ModuleConfig;
  for (const key of MODULE_KEYS) {
    out[key] = mergeModule(DEFAULT_MODULE_CONFIG[key], data[key]);
  }
  out.meta = data.meta;
  return out;
}

const REF = () => doc(db, 'siteConfig', 'moduleConfig');

export const moduleConfigService = {
  async get(): Promise<ModuleConfig> {
    const snap = await getDoc(REF());
    if (!snap.exists()) return mergeAll({});
    return mergeAll(snap.data() as Partial<ModuleConfig>);
  },

  async save(config: ModuleConfig, updatedBy: string): Promise<void> {
    await setDoc(REF(), {
      ...config,
      meta: { updatedAt: new Date().toISOString(), updatedBy },
    });
  },

  subscribe(cb: (config: ModuleConfig) => void): () => void {
    return onSnapshot(REF(), (snap) => {
      cb(snap.exists() ? mergeAll(snap.data() as Partial<ModuleConfig>) : mergeAll({}));
    }, () => cb(mergeAll({})));
  },
};
