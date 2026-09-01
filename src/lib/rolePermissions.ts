import type { Translations } from '@/i18n/translations';
import type { permissionsEn } from '@/i18n/sections/permissions';

// ─── All permission keys in the system ───────────────────────────────────────

export const ALL_PERMISSIONS = [
  // ── Pages / Nav ──────────────────────────────────────────────────────────
  'canViewDashboard',
  'canViewAnnouncements',
  'canViewPlans',
  'canViewReports',
  'canViewMembers',
  'canViewMeetings',
  'canViewFinance',
  'canViewChurchRules',
  'canViewHigeDenb',
  'canViewStrategicPlan',
  'canViewDocuments',
  'canViewHierarchy',
  'canViewMissionary',
  'canViewTeachings',
  'canViewVolunteer',
  'canViewUserManagement',
  'canViewSettings',
  'canViewNotifications',
  'canViewNews',
  // These two pages had no view permission at all, which is why they could
  // never be hidden from an ordinary member.
  'canViewHR',
  'canViewInventory',
  // ── Actions ───────────────────────────────────────────────────────────────
  'canCreateAnnouncement',
  'canEditAnnouncement',
  'canDeleteAnnouncement',
  'canCreatePlan',
  'canDeletePlan',
  'canCreateReport',
  'canViewAllReports',
  'canCommentOnReport',
  'canAddMembers',
  'canEditMembers',
  'canDeleteMembers',
  'canExportData',
  'canScheduleMeeting',
  'canDeleteMeeting',
  'canAddTransaction',
  'canCreateBudget',
  'canGenerateFinancialReport',
  'canUploadDocuments',
  'canDeleteDocuments',
  'canCreateTeaching',
  'canSubmitMissionaryApplication',
  'canSubmitMissionaryReport',
  'canManageNews',
  'canApproveMembers',
  'canManageAtbiyas',
  'canEditOwnAtbiya',
  // ── Dashboard view level ──────────────────────────────────────────────────
  'canViewFullDashboard',
  'canViewLimitedDashboard',
] as const;

export type PermissionKey = typeof ALL_PERMISSIONS[number];

// ─── Labels and grouping ─────────────────────────────────────────────────────

/**
 * Permission metadata holds translation KEYS, not prose.
 *
 * This module cannot call `useLanguage()` — it is not a component — and it used
 * to carry English sentences that rendered verbatim in PermissionMatrix,
 * PermissionControl and the access-denied screen. Resolving the key at the
 * render site, where `t` is in scope, also means every one of these strings is
 * editable by an admin in the Localization Editor, which prose in this file
 * never could be.
 */
export interface PermissionMeta {
  labelKey: keyof typeof permissionsEn;
  descriptionKey: keyof typeof permissionsEn;
  /**
   * NOT a label. This string is a React key, a `Set` member and the predicate
   * in `ALL_PERMISSIONS.filter(p => PERMISSION_META[p].group === group)`, so it
   * stays a stable English token. `permissionGroupLabel` translates it for
   * display.
   */
  group: string;
}

export const PERMISSION_META: Record<PermissionKey, PermissionMeta> = {
  canViewDashboard: { labelKey: 'canViewDashboardLabel', descriptionKey: 'canViewDashboardDesc', group: 'Pages' },
  canViewAnnouncements: { labelKey: 'canViewAnnouncementsLabel', descriptionKey: 'canViewAnnouncementsDesc', group: 'Pages' },
  canViewPlans: { labelKey: 'canViewPlansLabel', descriptionKey: 'canViewPlansDesc', group: 'Pages' },
  canViewReports: { labelKey: 'canViewReportsLabel', descriptionKey: 'canViewReportsDesc', group: 'Pages' },
  canViewMembers: { labelKey: 'canViewMembersLabel', descriptionKey: 'canViewMembersDesc', group: 'Pages' },
  canViewMeetings: { labelKey: 'canViewMeetingsLabel', descriptionKey: 'canViewMeetingsDesc', group: 'Pages' },
  canViewFinance: { labelKey: 'canViewFinanceLabel', descriptionKey: 'canViewFinanceDesc', group: 'Pages' },
  canViewChurchRules: { labelKey: 'canViewChurchRulesLabel', descriptionKey: 'canViewChurchRulesDesc', group: 'Pages' },
  canViewHigeDenb: { labelKey: 'canViewHigeDenbLabel', descriptionKey: 'canViewHigeDenbDesc', group: 'Pages' },
  canViewStrategicPlan: { labelKey: 'canViewStrategicPlanLabel', descriptionKey: 'canViewStrategicPlanDesc', group: 'Pages' },
  canViewDocuments: { labelKey: 'canViewDocumentsLabel', descriptionKey: 'canViewDocumentsDesc', group: 'Pages' },
  canViewHierarchy: { labelKey: 'canViewHierarchyLabel', descriptionKey: 'canViewHierarchyDesc', group: 'Pages' },
  canViewMissionary: { labelKey: 'canViewMissionaryLabel', descriptionKey: 'canViewMissionaryDesc', group: 'Pages' },
  canViewTeachings: { labelKey: 'canViewTeachingsLabel', descriptionKey: 'canViewTeachingsDesc', group: 'Pages' },
  canViewVolunteer: { labelKey: 'canViewVolunteerLabel', descriptionKey: 'canViewVolunteerDesc', group: 'Pages' },
  canViewUserManagement: { labelKey: 'canViewUserManagementLabel', descriptionKey: 'canViewUserManagementDesc', group: 'Pages' },
  canViewSettings: { labelKey: 'canViewSettingsLabel', descriptionKey: 'canViewSettingsDesc', group: 'Pages' },
  canViewNotifications: { labelKey: 'canViewNotificationsLabel', descriptionKey: 'canViewNotificationsDesc', group: 'Pages' },
  canViewNews: { labelKey: 'canViewNewsLabel', descriptionKey: 'canViewNewsDesc', group: 'Pages' },
  canViewHR: { labelKey: 'canViewHRLabel', descriptionKey: 'canViewHRDesc', group: 'Pages' },
  canViewInventory: { labelKey: 'canViewInventoryLabel', descriptionKey: 'canViewInventoryDesc', group: 'Pages' },
  canCreateAnnouncement: { labelKey: 'canCreateAnnouncementLabel', descriptionKey: 'canCreateAnnouncementDesc', group: 'Announcements' },
  canEditAnnouncement: { labelKey: 'canEditAnnouncementLabel', descriptionKey: 'canEditAnnouncementDesc', group: 'Announcements' },
  canDeleteAnnouncement: { labelKey: 'canDeleteAnnouncementLabel', descriptionKey: 'canDeleteAnnouncementDesc', group: 'Announcements' },
  canCreatePlan: { labelKey: 'canCreatePlanLabel', descriptionKey: 'canCreatePlanDesc', group: 'Plans' },
  canDeletePlan: { labelKey: 'canDeletePlanLabel', descriptionKey: 'canDeletePlanDesc', group: 'Plans' },
  canCreateReport: { labelKey: 'canCreateReportLabel', descriptionKey: 'canCreateReportDesc', group: 'Reports' },
  canViewAllReports: { labelKey: 'canViewAllReportsLabel', descriptionKey: 'canViewAllReportsDesc', group: 'Reports' },
  canCommentOnReport: { labelKey: 'canCommentOnReportLabel', descriptionKey: 'canCommentOnReportDesc', group: 'Reports' },
  canAddMembers: { labelKey: 'canAddMembersLabel', descriptionKey: 'canAddMembersDesc', group: 'Members' },
  canEditMembers: { labelKey: 'canEditMembersLabel', descriptionKey: 'canEditMembersDesc', group: 'Members' },
  canDeleteMembers: { labelKey: 'canDeleteMembersLabel', descriptionKey: 'canDeleteMembersDesc', group: 'Members' },
  canExportData: { labelKey: 'canExportDataLabel', descriptionKey: 'canExportDataDesc', group: 'Members' },
  canScheduleMeeting: { labelKey: 'canScheduleMeetingLabel', descriptionKey: 'canScheduleMeetingDesc', group: 'Meetings' },
  canDeleteMeeting: { labelKey: 'canDeleteMeetingLabel', descriptionKey: 'canDeleteMeetingDesc', group: 'Meetings' },
  canAddTransaction: { labelKey: 'canAddTransactionLabel', descriptionKey: 'canAddTransactionDesc', group: 'Finance' },
  canCreateBudget: { labelKey: 'canCreateBudgetLabel', descriptionKey: 'canCreateBudgetDesc', group: 'Finance' },
  canGenerateFinancialReport: { labelKey: 'canGenerateFinancialReportLabel', descriptionKey: 'canGenerateFinancialReportDesc', group: 'Finance' },
  canUploadDocuments: { labelKey: 'canUploadDocumentsLabel', descriptionKey: 'canUploadDocumentsDesc', group: 'Documents' },
  canDeleteDocuments: { labelKey: 'canDeleteDocumentsLabel', descriptionKey: 'canDeleteDocumentsDesc', group: 'Documents' },
  canCreateTeaching: { labelKey: 'canCreateTeachingLabel', descriptionKey: 'canCreateTeachingDesc', group: 'Teachings' },
  canSubmitMissionaryApplication: { labelKey: 'canSubmitMissionaryApplicationLabel', descriptionKey: 'canSubmitMissionaryApplicationDesc', group: 'Missionary' },
  canSubmitMissionaryReport: { labelKey: 'canSubmitMissionaryReportLabel', descriptionKey: 'canSubmitMissionaryReportDesc', group: 'Missionary' },
  canManageNews: { labelKey: 'canManageNewsLabel', descriptionKey: 'canManageNewsDesc', group: 'News' },
  canApproveMembers: { labelKey: 'canApproveMembersLabel', descriptionKey: 'canApproveMembersDesc', group: 'Administration' },
  canManageAtbiyas: { labelKey: 'canManageAtbiyasLabel', descriptionKey: 'canManageAtbiyasDesc', group: 'Administration' },
  canEditOwnAtbiya: { labelKey: 'canEditOwnAtbiyaLabel', descriptionKey: 'canEditOwnAtbiyaDesc', group: 'Administration' },
  canViewFullDashboard: { labelKey: 'canViewFullDashboardLabel', descriptionKey: 'canViewFullDashboardDesc', group: 'Dashboard' },
  canViewLimitedDashboard: { labelKey: 'canViewLimitedDashboardLabel', descriptionKey: 'canViewLimitedDashboardDesc', group: 'Dashboard' },
};

/** A permission's name in the reader's language. */
export function permissionLabel(t: Translations, permission: PermissionKey): string {
  const key = PERMISSION_META[permission]?.labelKey;
  return (key && t.permissions[key]) || permission;
}

/** A permission's one-line explanation in the reader's language. */
export function permissionDescription(t: Translations, permission: PermissionKey): string {
  const key = PERMISSION_META[permission]?.descriptionKey;
  return (key && t.permissions[key]) || '';
}

/**
 * A group heading in the reader's language. Takes the English token from
 * `PermissionMeta.group` and looks up `group<Token>`; falls back to the token
 * so a group added without a label is visible rather than blank.
 */
export function permissionGroupLabel(t: Translations, group: string): string {
  const key = `group${group}` as keyof typeof permissionsEn;
  return t.permissions[key] ?? group;
}

export const PERMISSION_GROUPS = [...new Set(ALL_PERMISSIONS.map(p => PERMISSION_META[p].group))];

/**
 * Bump this whenever DEFAULT_ROLE_PERMISSIONS changes for a built-in role.
 *
 * Roles are persisted to `siteConfig/roles` once an admin has opened Software
 * Control, and the persisted copy wins over this file — which meant a deploy
 * that changed a role's permissions had no effect at all. `roleRegistry`
 * compares this number against the stored one and reconciles the built-in roles
 * back to what the app ships. See `reconcileRoles` there.
 *
 * History:
 *   1 — original seven bylaw roles
 *   2 — added canViewHR / canViewInventory / canEditOwnAtbiya; narrowed
 *       HiyawanMahderat to an ordinary member (no members, meetings,
 *       announcements or canAddMembers)
 *
 * Adding a NEW built-in role does not belong here — that is not a change to an
 * existing role's permissions, and bumping would reset every operator's
 * customisations as a side effect. `withMissingSeeds` in roleRegistry handles
 * it version-independently instead.
 */
export const PERMISSIONS_VERSION = 2;

// ─── Default role → permissions mapping ──────────────────────────────────────
// Seed values for the role registry (siteConfig/roles) and the FALLBACK used
// when Firestore is unreachable. Roles are dynamic, so this is keyed on plain
// strings — the seven bylaw levels below are simply the roles we ship with.

export const DEFAULT_ROLE_PERMISSIONS: Record<string, PermissionKey[]> = {
  SuperAdmin: [...ALL_PERMISSIONS], // system owner — all permissions

  Sinodos: [...ALL_PERMISSIONS], // all permissions

  KuamiSinodos: ALL_PERMISSIONS.filter(p => p !== 'canViewUserManagement'),

  Memriya: [
    'canViewDashboard', 'canViewAnnouncements', 'canViewPlans', 'canViewReports',
    'canViewMembers', 'canViewMeetings', 'canViewFinance', 'canViewChurchRules',
    'canViewHigeDenb', 'canViewStrategicPlan', 'canViewDocuments', 'canViewMissionary',
    'canViewTeachings', 'canViewVolunteer', 'canViewUserManagement', 'canViewSettings',
    'canViewNotifications', 'canViewNews', 'canViewHR', 'canViewInventory',
    'canCreateAnnouncement', 'canEditAnnouncement', 'canDeleteAnnouncement',
    'canCreatePlan', 'canDeletePlan',
    'canCreateReport', 'canViewAllReports', 'canCommentOnReport',
    'canAddMembers', 'canEditMembers', 'canDeleteMembers', 'canExportData',
    'canScheduleMeeting', 'canDeleteMeeting',
    'canAddTransaction', 'canCreateBudget', 'canGenerateFinancialReport',
    'canUploadDocuments', 'canDeleteDocuments',
    'canCreateTeaching',
    'canSubmitMissionaryApplication', 'canSubmitMissionaryReport',
    'canManageNews', 'canApproveMembers', 'canManageAtbiyas',
    'canViewFullDashboard',
  ],

  Zone: [
    'canViewDashboard', 'canViewAnnouncements', 'canViewPlans', 'canViewReports',
    'canViewMembers', 'canViewMeetings', 'canViewFinance', 'canViewChurchRules',
    'canViewHigeDenb', 'canViewStrategicPlan', 'canViewDocuments', 'canViewHierarchy',
    'canViewMissionary', 'canViewTeachings', 'canViewVolunteer', 'canViewSettings',
    'canViewNotifications', 'canViewHR', 'canViewInventory',
    'canCreatePlan', 'canCreateReport', 'canCommentOnReport',
    'canAddMembers', 'canEditMembers', 'canExportData',
    'canAddTransaction',
    'canUploadDocuments',
    'canSubmitMissionaryApplication', 'canSubmitMissionaryReport',
    'canViewNews', 'canApproveMembers',
    'canViewLimitedDashboard',
  ],

  Atbiya: [
    'canViewDashboard', 'canViewAnnouncements', 'canViewPlans', 'canViewReports',
    'canViewMembers', 'canViewMeetings', 'canViewFinance', 'canViewChurchRules',
    'canViewHigeDenb', 'canViewDocuments', 'canViewMissionary', 'canViewTeachings',
    'canViewVolunteer', 'canViewSettings', 'canViewNotifications',
    'canViewHR', 'canViewInventory',
    'canCreatePlan', 'canCreateReport', 'canCommentOnReport',
    'canAddMembers', 'canEditMembers',
    'canAddTransaction',
    'canUploadDocuments',
    'canSubmitMissionaryApplication', 'canSubmitMissionaryReport',
    // A parish approves its own membership requests, posts its own news and
    // maintains its own record — but cannot register other parishes.
    'canViewNews', 'canManageNews', 'canApproveMembers', 'canEditOwnAtbiya',
    'canViewLimitedDashboard',
  ],

  EnkesekaseMaikel: [
    'canViewDashboard', 'canViewAnnouncements', 'canViewPlans', 'canViewReports',
    'canViewMembers', 'canViewMeetings', 'canViewChurchRules', 'canViewHigeDenb',
    'canViewDocuments', 'canViewTeachings', 'canViewVolunteer', 'canViewSettings',
    'canViewNotifications',
    'canCreateReport', 'canCommentOnReport',
    'canAddMembers',
    'canSubmitMissionaryApplication',
    'canViewLimitedDashboard',
  ],

  // An ordinary church member. Deliberately narrow: they read announcements and
  // the church rules, and nothing else. Every administration page — plans,
  // reports, finance, HR, inventory, documents, the member directory — is
  // somebody's job, not theirs.
  //
  // `canAddMembers` is absent on purpose. memberManagerRoles is derived from it,
  // so granting it would put every self-service sign-up into isMemberManager()
  // in firestore.rules, letting them create user documents and username rows
  // for other people.
  // `canViewAnnouncements` is absent deliberately: announcements are broadcast
  // to members as notifications rather than being a page they browse.
  HiyawanMahderat: [
    'canViewDashboard',
    'canViewChurchRules', 'canViewHigeDenb', 'canViewTeachings', 'canViewVolunteer',
    'canViewSettings', 'canViewNotifications',
    'canSubmitMissionaryApplication',
    'canViewLimitedDashboard',
  ],
};

// ─── Runtime permission resolver ─────────────────────────────────────────────
// Merges role defaults with per-user overrides loaded from Firestore.

export type RolePermissionOverrides = Record<string, PermissionKey[]>;
export type UserPermissionOverrides = Record<string, Partial<Record<PermissionKey, boolean>>>;

export function resolvePermissions(
  role: string,
  userId: string,
  roleOverrides: RolePermissionOverrides,
  userOverrides: UserPermissionOverrides
): Set<PermissionKey> {
  // Start from role-level config (Firestore override or default)
  const rolePerms = roleOverrides[role] ?? DEFAULT_ROLE_PERMISSIONS[role] ?? [];
  const perms = new Set<PermissionKey>(rolePerms);

  // Apply per-user overrides on top
  const userOverride = userOverrides[userId];
  if (userOverride) {
    for (const [key, value] of Object.entries(userOverride) as [PermissionKey, boolean][]) {
      if (value) perms.add(key);
      else perms.delete(key);
    }
  }

  return perms;
}
