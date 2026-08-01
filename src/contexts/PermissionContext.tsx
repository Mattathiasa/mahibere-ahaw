import React, { createContext, useContext, useEffect, useState } from 'react';
import { useAuthContext } from './AuthContext';
import {
  resolvePermissions,
  DEFAULT_ROLE_PERMISSIONS,
  ALL_PERMISSIONS,
  type PermissionKey,
  type RolePermissionOverrides,
  type UserPermissionOverrides,
} from '@/lib/rolePermissions';
import { permissionService } from '@/services/permissionService';
import type { HierarchyLevel } from '@/types';

interface PermissionContextType {
  /** Check if the current user has a specific permission */
  can: (permission: PermissionKey) => boolean;
  /** The resolved set of permissions for the current user */
  permissions: Set<PermissionKey>;
  /** Whether the current user is a Super Admin */
  isSuperAdmin: boolean;
  /** Raw role overrides (for the admin editor) */
  roleOverrides: RolePermissionOverrides;
  /** Raw user overrides (for the admin editor) */
  userOverrides: UserPermissionOverrides;
  /** Reload permissions from Firestore */
  reload: () => Promise<void>;
  loading: boolean;
}

const PermissionContext = createContext<PermissionContextType | undefined>(undefined);

// Module-level cache so we only fetch once per session
let cachedRoleOverrides: RolePermissionOverrides | null = null;
let cachedUserOverrides: UserPermissionOverrides | null = null;
let cachedSuperAdmins: string[] | null = null;

export const PermissionProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuthContext();
  const [roleOverrides, setRoleOverrides] = useState<RolePermissionOverrides>(cachedRoleOverrides ?? {});
  const [userOverrides, setUserOverrides] = useState<UserPermissionOverrides>(cachedUserOverrides ?? {});
  const [superAdmins, setSuperAdmins] = useState<string[]>(cachedSuperAdmins ?? []);
  const [loading, setLoading] = useState(!cachedRoleOverrides);

  const load = async () => {
    try {
      const [ro, uo, sa] = await Promise.all([
        permissionService.getRolePermissions(),
        permissionService.getUserOverrides(),
        permissionService.getSuperAdmins(),
      ]);
      cachedRoleOverrides = ro;
      cachedUserOverrides = uo;
      cachedSuperAdmins = sa;
      setRoleOverrides(ro);
      setUserOverrides(uo);
      setSuperAdmins(sa);
    } catch (err) {
      console.warn('[PermissionContext] Failed to load permissions, using defaults.', err);
    } finally {
      setLoading(false);
    }
  };

  // Re-resolve whenever the signed-in user changes. The cached copies give an
  // instant first paint, but they must not outlive the session that fetched
  // them — user-level overrides are per-uid, so a stale cache would hand user B
  // the permissions that were resolved for user A.
  useEffect(() => {
    load();
  }, [user?.id]);

  const isSuperAdmin =
    user?.role === 'SuperAdmin' ||
    (user?.id ? superAdmins.includes(user.id) : false);

  const permissions: Set<PermissionKey> = (() => {
    if (!user) return new Set<PermissionKey>();

    // Super Admin gets everything
    if (isSuperAdmin) {
      return new Set<PermissionKey>(ALL_PERMISSIONS);
    }

    const role = (user.hierarchyLevel as HierarchyLevel) ?? 'HiyawanMahderat';
    return resolvePermissions(role, user.id, roleOverrides, userOverrides);
  })();

  const can = (permission: PermissionKey): boolean => {
    if (isSuperAdmin) return true;
    return permissions.has(permission);
  };

  return (
    <PermissionContext.Provider value={{
      can,
      permissions,
      isSuperAdmin,
      roleOverrides,
      userOverrides,
      reload: load,
      loading,
    }}>
      {children}
    </PermissionContext.Provider>
  );
};

export const usePermissions = () => {
  const ctx = useContext(PermissionContext);
  if (!ctx) throw new Error('usePermissions must be used within PermissionProvider');
  return ctx;
};
