import { HierarchyLevel } from './mockData';

export const rolePermissions = {
  canCreateAnnouncement: (role: HierarchyLevel): boolean => {
    return ['Sinodos', 'KuamiSinodos', 'Memriya'].includes(role);
  },

  canCreatePlan: (role: HierarchyLevel): boolean => {
    return ['Sinodos', 'KuamiSinodos', 'Memriya', 'Zone', 'Atbiya'].includes(role);
  },

  canCreateReport: (role: HierarchyLevel): boolean => {
    // Atbiya level and above can create reports
    return ['Sinodos', 'KuamiSinodos', 'Memriya', 'Zone', 'Atbiya'].includes(role);
  },

  canViewAllReports: (role: HierarchyLevel): boolean => {
    return ['Sinodos', 'KuamiSinodos'].includes(role);
  },

  canAddMembers: (role: HierarchyLevel): boolean => {
    return ['Sinodos', 'KuamiSinodos', 'Memriya', 'Zone', 'Atbiya', 'HiyawanMahderat'].includes(
      role
    );
  },

  canViewHierarchy: (role: HierarchyLevel): boolean => {
    return ['Sinodos', 'KuamiSinodos', 'Memriya', 'Zone'].includes(role);
  },

  canScheduleMeeting: (role: HierarchyLevel): boolean => {
    return ['Sinodos', 'KuamiSinodos', 'Memriya'].includes(role);
  },

  canExportData: (role: HierarchyLevel): boolean => {
    return ['Sinodos', 'KuamiSinodos', 'Memriya'].includes(role);
  },

  getDashboardView: (role: HierarchyLevel): 'full' | 'limited' | 'basic' => {
    if (['Sinodos', 'KuamiSinodos'].includes(role)) return 'full';
    if (['Memriya', 'Zone', 'Atbiya'].includes(role)) return 'limited';
    return 'basic';
  },
};
