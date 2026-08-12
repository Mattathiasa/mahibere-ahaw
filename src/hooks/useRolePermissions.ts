import { usePermissions } from '@/contexts/PermissionContext';

/**
 * Drop-in replacement for the old useRolePermissions hook.
 * Now reads from the dynamic PermissionContext instead of hardcoded rules.
 */
export const useRolePermissions = () => {
  const { can, isSuperAdmin, myRole: role } = usePermissions();

  // dashboardView derived from permissions
  const dashboardView: 'full' | 'limited' | 'basic' = can('canViewFullDashboard')
    ? 'full'
    : can('canViewLimitedDashboard')
    ? 'limited'
    : 'basic';

  return {
    // Legacy boolean flags — all pages keep working unchanged
    canCreateAnnouncement: can('canCreateAnnouncement'),
    canCreatePlan:         can('canCreatePlan'),
    canCreateReport:       can('canCreateReport'),
    canViewAllReports:     can('canViewAllReports'),

    // These were declared in ALL_PERMISSIONS, editable in Permission Control, and
    // read by nothing at all — toggling any of them changed no behaviour anywhere.
    // Exposed here so the pages can gate the buttons they belong to.
    canEditAnnouncement:   can('canEditAnnouncement'),
    canDeleteAnnouncement: can('canDeleteAnnouncement'),
    canDeletePlan:         can('canDeletePlan'),
    canGenerateFinancialReport: can('canGenerateFinancialReport'),
    canCommentOnReport:    can('canCommentOnReport'),
    canSubmitMissionaryApplication: can('canSubmitMissionaryApplication'),
    canSubmitMissionaryReport:      can('canSubmitMissionaryReport'),
    canAddMembers:         can('canAddMembers'),
    canEditMembers:        can('canEditMembers'),
    canDeleteMembers:      can('canDeleteMembers'),
    canViewHierarchy:      can('canViewHierarchy'),
    canScheduleMeeting:    can('canScheduleMeeting'),
    canDeleteMeeting:      can('canDeleteMeeting'),
    canExportData:         can('canExportData'),
    canAddTransaction:     can('canAddTransaction'),
    canCreateBudget:       can('canCreateBudget'),
    canUploadDocuments:    can('canUploadDocuments'),
    canDeleteDocuments:    can('canDeleteDocuments'),
    canCreateTeaching:     can('canCreateTeaching'),
    canViewNews:           can('canViewNews'),
    canManageNews:         can('canManageNews'),
    canApproveMembers:     can('canApproveMembers'),
    canManageAtbiyas:      can('canManageAtbiyas'),
    canEditOwnAtbiya:      can('canEditOwnAtbiya'),
    canViewUserManagement: can('canViewUserManagement'),
    dashboardView,
    currentRole: role,
    isSuperAdmin,
  };
};
