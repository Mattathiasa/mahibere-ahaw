import { currentUser } from '@/lib/mockData';
import { rolePermissions } from '@/lib/rolePermissions';

export const useRolePermissions = () => {
  const role = currentUser.hierarchyLevel;

  return {
    canCreateAnnouncement: rolePermissions.canCreateAnnouncement(role),
    canCreatePlan: rolePermissions.canCreatePlan(role),
    canCreateReport: rolePermissions.canCreateReport(role),
    canViewAllReports: rolePermissions.canViewAllReports(role),
    canAddMembers: rolePermissions.canAddMembers(role),
    canViewHierarchy: rolePermissions.canViewHierarchy(role),
    canScheduleMeeting: rolePermissions.canScheduleMeeting(role),
    canExportData: rolePermissions.canExportData(role),
    dashboardView: rolePermissions.getDashboardView(role),
    currentRole: role,
  };
};
