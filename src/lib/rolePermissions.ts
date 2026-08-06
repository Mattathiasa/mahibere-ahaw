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

// ─── Human-readable labels and grouping ──────────────────────────────────────

export interface PermissionMeta {
  label: string;
  description: string;
  group: string;
}

export const PERMISSION_META: Record<PermissionKey, PermissionMeta> = {
  // Pages
  canViewDashboard:            { label: 'View Dashboard',           description: 'Access the main dashboard',                    group: 'Pages' },
  canViewAnnouncements:        { label: 'View Announcements',       description: 'See the announcements page',                   group: 'Pages' },
  canViewPlans:                { label: 'View Plans',               description: 'See the plans & ministry page',                group: 'Pages' },
  canViewReports:              { label: 'View Reports',             description: 'See the reports page',                         group: 'Pages' },
  canViewMembers:              { label: 'View Members',             description: 'See the members directory',                    group: 'Pages' },
  canViewMeetings:             { label: 'View Meetings',            description: 'See the meetings page',                        group: 'Pages' },
  canViewFinance:              { label: 'View Finance',             description: 'See the finance page',                         group: 'Pages' },
  canViewChurchRules:          { label: 'View Church Rules',        description: 'See the church rules page',                    group: 'Pages' },
  canViewHigeDenb:             { label: 'View HigeDenb',            description: 'See the HigeDenb page',                        group: 'Pages' },
  canViewStrategicPlan:        { label: 'View Strategic Plan',      description: 'See the strategic plan page',                  group: 'Pages' },
  canViewDocuments:            { label: 'View Documents',           description: 'See the documents page',                       group: 'Pages' },
  canViewHierarchy:            { label: 'View Hierarchy',           description: 'See the church hierarchy page',                group: 'Pages' },
  canViewMissionary:           { label: 'View Missionary',          description: 'See the missionary page',                      group: 'Pages' },
  canViewTeachings:            { label: 'View Teachings',           description: 'See the teachings page',                       group: 'Pages' },
  canViewVolunteer:            { label: 'View Volunteer',           description: 'See the volunteer page',                       group: 'Pages' },
  canViewUserManagement:       { label: 'View User Management',     description: 'See the user management page',                 group: 'Pages' },
  canViewSettings:             { label: 'View Settings',            description: 'Access settings',                              group: 'Pages' },
  canViewNotifications:        { label: 'View Notifications',       description: 'See notifications',                            group: 'Pages' },
  canViewNews:                 { label: 'View News',                description: 'See the news manager',                         group: 'Pages' },
  canViewHR:                   { label: 'View Human Resources',     description: 'See the HR page',                              group: 'Pages' },
  canViewInventory:            { label: 'View Inventory',           description: 'See the inventory page',                       group: 'Pages' },
  // Announcements
  canCreateAnnouncement:       { label: 'Create Announcement',      description: 'Post new announcements',                       group: 'Announcements' },
  canEditAnnouncement:         { label: 'Edit Announcement',        description: 'Edit existing announcements',                  group: 'Announcements' },
  canDeleteAnnouncement:       { label: 'Delete Announcement',      description: 'Delete announcements',                         group: 'Announcements' },
  // Plans
  canCreatePlan:               { label: 'Create Plan',              description: 'Create new ministry plans',                    group: 'Plans' },
  canDeletePlan:               { label: 'Delete Plan',              description: 'Delete ministry plans',                        group: 'Plans' },
  // Reports
  canCreateReport:             { label: 'Create Report',            description: 'Submit new reports',                           group: 'Reports' },
  canViewAllReports:           { label: 'View All Reports',         description: 'See reports from all units',                   group: 'Reports' },
  canCommentOnReport:          { label: 'Comment on Report',        description: 'Add feedback to reports',                      group: 'Reports' },
  // Members
  canAddMembers:               { label: 'Add Members',              description: 'Enroll new church members',                    group: 'Members' },
  canEditMembers:              { label: 'Edit Members',             description: 'Edit member profiles',                         group: 'Members' },
  canDeleteMembers:            { label: 'Delete Members',           description: 'Remove members from the system',               group: 'Members' },
  canExportData:               { label: 'Export Data',              description: 'Export member and report data',                group: 'Members' },
  // Meetings
  canScheduleMeeting:          { label: 'Schedule Meeting',         description: 'Create new meetings',                          group: 'Meetings' },
  canDeleteMeeting:            { label: 'Delete Meeting',           description: 'Delete scheduled meetings',                    group: 'Meetings' },
  // Finance
  canAddTransaction:           { label: 'Add Transaction',          description: 'Record financial transactions',                group: 'Finance' },
  canCreateBudget:             { label: 'Create Budget',            description: 'Create monthly budgets',                       group: 'Finance' },
  canGenerateFinancialReport:  { label: 'Generate Financial Report',description: 'Generate financial reports',                   group: 'Finance' },
  // Documents
  canUploadDocuments:          { label: 'Upload Documents',         description: 'Upload files and create folders',              group: 'Documents' },
  canDeleteDocuments:          { label: 'Delete Documents',         description: 'Delete files and folders',                     group: 'Documents' },
  // Teachings
  canCreateTeaching:           { label: 'Create Teaching',          description: 'Publish new teachings',                        group: 'Teachings' },
  // Missionary
  canSubmitMissionaryApplication: { label: 'Submit Missionary Application', description: 'Apply for missionary service',         group: 'Missionary' },
  canSubmitMissionaryReport:   { label: 'Submit Missionary Report', description: 'Submit field reports',                         group: 'Missionary' },
  // News
  canManageNews:               { label: 'Manage News',              description: 'Write, publish and unpublish homepage news',   group: 'News' },
  // Administration
  canApproveMembers:           { label: 'Approve Member Requests',  description: 'Approve or reject membership sign-up requests', group: 'Administration' },
  // Two deliberately separate keys. Registering a parish is a head-office act;
  // maintaining the one you belong to is not. Folding them together would mean
  // every parish leader could mint new parishes.
  canManageAtbiyas:            { label: 'Manage Atbiya Registry',   description: 'Register parishes and edit any parish record', group: 'Administration' },
  canEditOwnAtbiya:            { label: 'Edit Own Atbiya',          description: "Edit the details of the parish you belong to", group: 'Administration' },
  // Dashboard
  canViewFullDashboard:        { label: 'Full Dashboard View',      description: 'See all stats and quick actions',              group: 'Dashboard' },
  canViewLimitedDashboard:     { label: 'Limited Dashboard View',   description: 'See basic stats only',                         group: 'Dashboard' },
};

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
 */
export const PERMISSIONS_VERSION = 2;

// ─── Default role → permissions mapping ──────────────────────────────────────
// Seed values for the role registry (siteConfig/roles) and the FALLBACK used
// when Firestore is unreachable. Roles are dynamic, so this is keyed on plain
// strings — the seven bylaw levels below are simply the roles we ship with.

export const DEFAULT_ROLE_PERMISSIONS: Record<string, PermissionKey[]> = {
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
