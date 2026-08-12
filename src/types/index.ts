// Local type definitions (previously from @church-cms/shared)

/**
 * Whether an account may use the app. Enforced server-side in
 * `firestore.rules` — a 'pending' user can authenticate but every data read
 * and write is denied until their parish approves them.
 */
export type MembershipStatus = 'active' | 'pending' | 'rejected' | 'suspended';

export interface User {
  id: string;
  username: string;
  email: string;
  role: string;
  firstName?: string;
  lastName?: string;
  fullName?: string;
  fullNameEnglish?: string;
  fullNameAmharic?: string;
  phone?: string;
  dateOfBirth?: string;
  /** Role key from the `siteConfig/roles` registry. */
  hierarchyLevel?: string;
  hierarchyEntityId?: string;
  atbiyaId?: string;
  /** Denormalized parish name so lists need no join. */
  atbiyaName?: string;
  mahderatId?: string;
  /**
   * Membership state. A MISSING value means 'active' — every account created
   * before self-service sign-up existed predates this field.
   */
  status?: MembershipStatus;
  approvedBy?: string;
  approvedAt?: string;
  rejectedBy?: string;
  rejectedAt?: string;
  rejectedReason?: string;
  /** How the account came into being. */
  signupSource?: 'self' | 'admin' | 'legacy';
  requestedAt?: string;
  ministryType?: string[];
  churchRoles?: string[];
  workSchool?: string;
  maritalStatus?: 'Single' | 'Married' | 'Divorced' | 'Widowed';
  hasChildren?: boolean;
  childrenCount?: number;
  gender?: 'Male' | 'Female' | 'Other';
  /**
   * Home address. Region/zone/woreda are Ethiopian CIVIL divisions — unrelated
   * to the church org tree, which uses `atbiyaId` and `hierarchyEntityId`.
   *
   * `lat`/`lng` are the member's own pin, captured at sign-up. They live inside
   * this map rather than as new top-level fields so the self-sign-up
   * `keys().hasOnly([...])` whitelist in firestore.rules needs no change —
   * `hasOnly` inspects top-level keys only, and `address` is already listed.
   */
  address?: {
    region?: string;
    zone?: string;
    woreda?: string;
    city?: string;
    lat?: number;
    lng?: number;
  };
  createdAt?: string;
  updatedAt?: string;
  /** Cloudinary (or any) profile picture URL. */
  profilePicture?: string;
}

export interface LoginCredentials {
  username: string;
  password: string;
}

export interface AuthResponse {
  token: string;
  user: User;
}

/**
 * A notification addressed to exactly one user.
 *
 * Reaching many people means one document each — see
 * `notificationService.createMany`.
 *
 * This interface previously declared `read: boolean`, which nothing has ever
 * written; read state is the `status` field below. Every UI that touched a
 * notification was therefore fighting the compiler.
 */
export interface Notification {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: 'info' | 'warning' | 'error' | 'success';
  /** Read state. A missing value means unread. */
  status?: 'unread' | 'read' | 'archived';
  /** In-app route opened when the notification is clicked. */
  link?: string;
  createdAt: string;
  /** Optional translations, shown when the UI language is Amharic. */
  titleAmharic?: string;
  messageAmharic?: string;
  /**
   * The sender's uid. Stamped by `notificationService`, and firestore.rules
   * requires it to equal the caller's own uid — so unlike the name it once sat
   * beside, this cannot be forged.
   */
  senderId?: string;
  /**
   * The sender's display name at send time. Still denormalised, because a
   * recipient usually cannot read the sender's profile — but the rules now pin
   * it to a name the sender's own record holds.
   */
  senderName?: string;
  attachments?: string[];
}

export interface FinanceTransaction {
  id: string;
  type: string; // Using string to allow more types like Collection, Deposit, Tithe, etc.
  amount: number;
  category: string;
  description: string;
  date: string;
  createdBy: string;
  createdAt: string;
}

export interface FinanceTransactionInput {
  type: string;
  amount: number;
  category: string;
  description: string;
  date: string;
  mahderatId?: string;
  atbiyaId?: string;
  /** Bank-to-bank transfer fields (when type === 'Transfer'). */
  fromAccount?: string;
  toAccount?: string;
  receiptUrl?: string;
}

export interface MonthlyBudget {
  id: string;
  month: any; // Allow number or name
  year: number;
  category?: string;
  plannedIncome: number;
  plannedExpenses: number;
  actualIncome?: number;
  actualExpenses?: number;
  status?: string;
  attachments?: string[];
  allocated?: number;
  spent?: number;
  remaining?: number;
}

export interface MonthlyBudgetInput {
  month: string;
  year: number;
  category: string;
  allocated: number;
  mahderatId?: string;
  atbiyaId?: string;
}

export interface FinancialReport {
  id: string;
  title: string;
  titleAmharic?: string;
  period: string;
  reportType?: string;
  startDate: string;
  endDate: string;
  totalIncome: number;
  totalExpenses: number;
  totalTithes: number;
  totalOfferings: number;
  remainder: number;
  recipientInfo?: string;
  balance?: number;
  createdAt: string;
  createdBy: string;
}

export interface FinancialReportInput {
  title: string;
  period: string;
  reportType: string;
  mahderatId?: string;
  atbiyaId?: string;
}

export enum TeachingServiceType {
  SUNDAY_SCHOOL = 'SUNDAY_SCHOOL',
  BIBLE_STUDY = 'BIBLE_STUDY',
  YOUTH_SERVICE = 'YOUTH_SERVICE',
  PRAYER_MEETING = 'PRAYER_MEETING',
  SPECIAL_EVENT = 'SPECIAL_EVENT',
}

export enum TeachingStatus {
  DRAFT = 'Draft',
  PUBLISHED = 'Published',
  ARCHIVED = 'Archived',
  SCHEDULED = 'Scheduled',
  COMPLETED = 'Completed',
  CANCELLED = 'Cancelled',
}

/**
 * @deprecated Roles are dynamic — they live in `siteConfig/roles` and are read
 * through `usePermissions().roles`. This union only names the seven roles the
 * app ships with, and will not include any role added in Software Control.
 * Use `string` for a role key.
 */
export type HierarchyLevel =
  | 'Sinodos'
  | 'KuamiSinodos'
  | 'Memriya'
  | 'Zone'
  | 'Atbiya'
  | 'EnkesekaseMaikel'
  | 'HiyawanMahderat';

export type MinistryType = 
  | 'Sunday School'
  | 'Youth Ministry'
  | 'Women Ministry'
  | 'Choir'
  | 'Deacon Service'
  | 'Prayer Team'
  | 'Media Ministry';

// Ethiopian regions constant
export const ETHIOPIAN_REGIONS = [
  'Addis Ababa',
  'Afar',
  'Amhara',
  'Benishangul-Gumuz',
  'Dire Dawa',
  'Gambela',
  'Harari',
  'Oromia',
  'Sidama',
  'Somali',
  'Southern Nations, Nationalities, and Peoples Region',
  'Tigray',
] as const;

export type EthiopianRegion = typeof ETHIOPIAN_REGIONS[number];
