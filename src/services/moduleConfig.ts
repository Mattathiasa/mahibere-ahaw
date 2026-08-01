import { db } from '@/lib/firebase';
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
  label: string;
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

const f = (key: string, label: string, visible = true, required = false): FieldConfig =>
  ({ key, label, visible, required });

export const MODULE_KEYS: ModuleKey[] = [
  'members', 'plans', 'reports', 'announcements', 'meetings', 'finance',
  'hr', 'inventory', 'teachings', 'documents', 'hierarchy', 'missionary',
  'volunteer', 'strategicPlan', 'churchRules', 'higeDenb', 'news',
];

export const DEFAULT_MODULE_CONFIG: ModuleConfig = {
  news: {
    headerTitle: '', headerDescription: '',
    learnMore:
      'The News module publishes articles to the public homepage. Head-office authors write for the whole church; a parish author writes for their own Atbiya and their posts carry the parish name. Save a draft while you work, then publish when it is ready.',
    fields: [
      f('title', 'Title', true, true),
      f('excerpt', 'Short Summary'),
      f('body', 'Full Text', true, true),
      f('coverImageUrl', 'Cover Image'),
    ],
    options: {},
  },
  members: {
    headerTitle: '', headerDescription: '',
    learnMore:
      'The Members module is your church directory. Add members with their personal contact, jurisdiction (hierarchy level, region, zone), and ministry roles. Use search, sort and filters to find people quickly, and export the directory when permitted.',
    fields: [
      f('fullName', 'Full Name', true, true),
      f('phone', 'Phone'),
      f('gender', 'Gender'),
      f('dateOfBirth', 'Date of Birth'),
      f('workSchool', 'Work / School'),
      f('maritalStatus', 'Marital Status'),
      f('hierarchyLevel', 'Hierarchy Level', true, true),
    ],
    options: { genders: ['Male', 'Female'], sortBy: ['name', 'hierarchy', 'region', 'zone'] },
  },
  plans: {
    headerTitle: '', headerDescription: '',
    learnMore:
      'The Plans module organises ministry plans across all levels. Create a plan with a name, a period (weekly, monthly or annually) and details, then track progress through reports submitted against it.',
    fields: [f('name', 'Plan Name', true, true), f('timeframe', 'Period', true, true), f('department', 'Department'), f('details', 'Details')],
    options: {
      periods: ['Weekly', 'Monthly', 'Annually'],
      departments: ['Evangelism', 'Education & Training', 'Services Coordination', 'Administration & Finance', 'Public & External Relations', 'Youth & Children'],
    },
  },
  reports: {
    headerTitle: '', headerDescription: '',
    learnMore:
      'The Reports module is where units submit and review work reports. Pick the plan a report belongs to, choose the submission type, describe the work done and the results, and leaders can add professional feedback.',
    fields: [
      f('plan', 'Related Plan', true, true), f('type', 'Submission Type', true, true),
      f('department', 'Department'),
      f('workPlanned', 'Work Planned'), f('workPerformed', 'Work Performed', true, true),
      f('uncompletedTasks', 'Uncompleted Tasks'), f('results', 'Results'),
    ],
    options: {
      types: ['Memriya', 'Kifil', 'Zerf'],
      departments: ['Evangelism', 'Education & Training', 'Services Coordination', 'Administration & Finance', 'Public & External Relations', 'Youth & Children'],
    },
  },
  announcements: {
    headerTitle: '', headerDescription: '',
    learnMore:
      'Post church-wide announcements here. Members are notified on web and mobile. Optionally set an expiry date so time-sensitive notices disappear automatically.',
    fields: [f('title', 'Title', true, true), f('content', 'Content', true, true), f('expiresAt', 'Expiration Date')],
    options: {},
  },
  meetings: {
    headerTitle: '', headerDescription: '',
    learnMore:
      'Schedule and coordinate leadership meetings and events. Attendees are notified, and upcoming/past meetings are tracked automatically.',
    fields: [f('title', 'Meeting Title', true, true), f('scheduledDate', 'Date & Time', true, true), f('location', 'Location'), f('description', 'Description')],
    options: {},
  },
  finance: {
    headerTitle: '', headerDescription: '',
    learnMore:
      'Track income, expenses, budgets and financial reports. Record transactions, set monthly budgets, and generate reports for accountability.',
    fields: [],
    options: {
      transactionTypes: ['Income', 'Expense', 'Tithe', 'Offering', 'Donation', 'Collection', 'Deposit', 'Asrat', 'YefikirSetota', 'Transfer'],
      bankAccounts: ['CBE', 'Berhan Bank', 'Abyssinia Bank', 'Awash Bank', 'Oromia Bank', 'Nib Bank'],
    },
  },
  hr: {
    headerTitle: '', headerDescription: '',
    learnMore:
      'Manage church employees: positions, departments, employment type, salary and status. Use it as the HR record for staff and contractors.',
    fields: [
      f('fullName', 'Full Name', true, true), f('position', 'Position', true, true),
      f('department', 'Department'), f('employmentType', 'Employment Type'),
      f('salary', 'Salary'), f('hireDate', 'Hire Date'), f('phone', 'Phone'),
      f('email', 'Email'), f('status', 'Status'),
    ],
    options: {
      employmentTypes: ['FullTime', 'PartTime', 'Contract', 'Volunteer'],
      statuses: ['Active', 'OnLeave', 'Terminated'],
    },
  },
  inventory: {
    headerTitle: '', headerDescription: '',
    learnMore:
      'Track church assets, equipment and property — quantity, location, condition, value and assignment. Monitor what the church owns and its state.',
    fields: [
      f('name', 'Asset Name', true, true), f('category', 'Category'), f('quantity', 'Quantity', true, true),
      f('location', 'Location'), f('assignedTo', 'Assigned To'), f('condition', 'Condition'),
      f('status', 'Status'), f('value', 'Unit Value'), f('purchaseDate', 'Purchase Date'),
    ],
    options: {
      conditions: ['New', 'Good', 'Fair', 'Poor'],
      statuses: ['InUse', 'InStorage', 'Maintenance', 'Retired'],
    },
  },
  teachings: {
    headerTitle: '', headerDescription: '',
    learnMore:
      'Publish teachings, sermons and Bible studies. Each teaching has a speaker, service type, summary and full content for members to read.',
    fields: [
      f('title', 'Title', true, true), f('speaker', 'Speaker'), f('serviceType', 'Service Type'),
      f('shortDescription', 'Short Description'), f('fullContent', 'Full Content'), f('dateDelivered', 'Date Delivered'),
    ],
    options: { serviceTypes: ['Sunday Morning', 'Wednesday Bible Study', "Men's Breakfast", "Women's Ministry", 'Youth Service', 'Special Event', 'Other'] },
  },
  documents: {
    headerTitle: '', headerDescription: '',
    learnMore:
      'Browse and manage official church documents in folders. Upload files, create folders, and open documents — access follows your permissions.',
    fields: [],
    options: {},
  },
  hierarchy: {
    headerTitle: '', headerDescription: '',
    learnMore:
      'The official organizational structure of the church per the bylaws — from the Synod down to local parishes — with each body\'s roles and responsibilities.',
    fields: [],
    options: {},
  },
  missionary: {
    headerTitle: '', headerDescription: '',
    learnMore:
      'Apply for missionary service and submit field reports. Choose your missionary type and desired location, and track applications and impact.',
    fields: [
      f('missionaryType', 'Missionary Type', true, true), f('desiredLocation', 'Desired Location'),
      f('whyServe', 'Why do you want to serve?'),
    ],
    options: { missionaryTypes: ['FullTime', 'PartTime', 'ShortTerm'] },
  },
  volunteer: {
    headerTitle: '', headerDescription: '',
    learnMore:
      'Choose the ministries you would like to serve in. Your preferences are saved to your profile so coordinators can reach you.',
    fields: [],
    options: {
      ministries: ['Ebet Metreg', 'Natanim Agelgelot', 'Choir', 'Ushering', 'Sunday School', 'Charity', 'Evangelism', 'Media'],
    },
  },
  strategicPlan: {
    headerTitle: '', headerDescription: '',
    learnMore:
      'Track long-term vision goals and strategic milestones, with progress against targets over time.',
    fields: [],
    options: {},
  },
  churchRules: {
    headerTitle: '', headerDescription: '',
    learnMore:
      'Browse the church\'s canonical guidelines, prohibitions, obligations and administrative rules.',
    fields: [],
    options: {},
  },
  higeDenb: {
    headerTitle: '', headerDescription: '',
    learnMore:
      'Access the church governance rules (Hige Denb) covering structure, reporting, conduct and communication protocol.',
    fields: [],
    options: {},
  },
};

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
