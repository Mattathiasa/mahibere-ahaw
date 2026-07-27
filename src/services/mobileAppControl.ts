import { db } from '@/lib/firebase';
import {
  doc, getDoc, setDoc, collection, getDocs, query, orderBy, limit,
} from 'firebase/firestore';

// ─── Remote config for the Flutter app ────────────────────────────────────────
// Stored in siteConfig/mobileAppConfig so it is publicly readable (the app must
// read it before login) and writable only by admins (existing siteConfig rule).

/** Module keys the mobile app gates with feature flags. */
export const MOBILE_FEATURE_KEYS = [
  'announcements',
  'plans',
  'reports',
  'members',
  'meetings',
  'finance',
  'hr',
  'inventory',
  'hierarchy',
  'higeDenb',
  'churchRules',
  'teachings',
  'documents',
  'missionary',
  'volunteer',
  'partner',
  'strategicPlan',
  'notifications',
  'userManagement',
  'permissionControl',
] as const;

export type MobileFeatureKey = (typeof MOBILE_FEATURE_KEYS)[number];

export interface MobileAppConfig {
  /** When true the app shows a maintenance screen and blocks all usage. */
  killSwitch: boolean;
  /** Message shown on the maintenance / kill-switch screen. */
  maintenanceMessage: string;
  /** Builds below this number are forced to update before continuing. */
  minBuildNumber: number;
  /** Latest available version, shown in the update prompt. */
  latestVersionName: string;
  /** Where the update button sends users (Play Store / APK link). */
  updateUrl: string;
  /** Per-module switches; a missing key counts as enabled. */
  features: Partial<Record<MobileFeatureKey, boolean>>;
  meta?: { updatedAt?: string; updatedBy?: string };
}

export const DEFAULT_MOBILE_APP_CONFIG: MobileAppConfig = {
  killSwitch: false,
  maintenanceMessage: 'The app is under maintenance. Please try again later.',
  minBuildNumber: 1,
  latestVersionName: '1.0.0',
  updateUrl: '',
  features: {},
};

// ─── Audit records written by the mobile app ─────────────────────────────────
// One document per user in the mobileAudit collection, upserted on login/resume.

export interface MobileAuditRecord {
  id: string; // uid
  displayName?: string;
  email?: string;
  hierarchyLevel?: string;
  platform?: string; // android | ios
  appVersion?: string;
  buildNumber?: number;
  deviceModel?: string;
  osVersion?: string;
  firstSeen?: string;
  lastSeen?: string;
  sessionCount?: number;
}

const CONFIG_REF = () => doc(db, 'siteConfig', 'mobileAppConfig');

export const mobileAppControlService = {
  async getConfig(): Promise<MobileAppConfig> {
    const snap = await getDoc(CONFIG_REF());
    if (!snap.exists()) return { ...DEFAULT_MOBILE_APP_CONFIG };
    return { ...DEFAULT_MOBILE_APP_CONFIG, ...(snap.data() as Partial<MobileAppConfig>) };
  },

  async saveConfig(config: MobileAppConfig, updatedBy: string): Promise<void> {
    await setDoc(CONFIG_REF(), {
      ...config,
      meta: { updatedAt: new Date().toISOString(), updatedBy },
    });
  },

  async getAuditRecords(max = 200): Promise<MobileAuditRecord[]> {
    const q = query(collection(db, 'mobileAudit'), orderBy('lastSeen', 'desc'), limit(max));
    const snap = await getDocs(q);
    return snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<MobileAuditRecord, 'id'>) }));
  },
};
