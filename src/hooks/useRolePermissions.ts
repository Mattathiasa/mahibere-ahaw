import { usePermissions } from '@/contexts/PermissionContext';
import { useAuthContext } from '@/contexts/AuthContext';
import type { HierarchyLevel } from '@/types';

/**
 * Drop-in replacement for the old useRolePermissions hook.
 * Now reads from the dynamic PermissionContext instead of hardcoded rules.
 */
export const useRolePermissions = () => {
  const { can, isSuperAdmin } = usePermissions();
  const { user } = useAuthContext();
  const role = (user?.hierarchyLevel as HierarchyLevel) ?? 'HiyawanMahderat';

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
    dashboardView,
    currentRole: role,
    isSuperAdmin,
  };
};
