import React, { createContext, useContext, useEffect, useState } from 'react';
import { useAuthContext } from './AuthContext';
import { useLanguage } from './LanguageContext';
import {
  resolvePermissions,
  ALL_PERMISSIONS,
  type PermissionKey,
  type RolePermissionOverrides,
  type UserPermissionOverrides,
} from '@/lib/rolePermissions';
import { permissionService } from '@/services/permissionService';
import {
  roleRegistryService,
  roleLabel as pickRoleLabel,
  DEFAULT_ROLE_REGISTRY,
  DEFAULT_SIGNUP_ROLE,
  type Role,
  type RoleRegistry,
  type RoleScope,
} from '@/services/roleRegistry';
import type { Language } from '@/i18n/translations';

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

  // ── Dynamic role registry ──────────────────────────────────────────────────
  /** Every declared role, in display order. */
  roles: Role[];
  /** The raw registry, including its version (needed to save without clobbering). */
  registry: RoleRegistry;
  /** Role keys only, in display order. Replaces the old HIERARCHY_LEVELS const. */
  roleKeys: string[];
  /** Localized display name for a role key. */
  roleLabel: (key: string | undefined, lang?: Language) => string;
  /** Does this role key grant /admin/* access? */
  isAdminRole: (key: string | undefined) => boolean;
  /** May this role key approve membership requests? */
  isApproverRole: (key: string | undefined) => boolean;
  /** Data scope for a role key. Unknown roles are treated as the narrowest. */
  scopeOf: (key: string | undefined) => RoleScope;
  /** The signed-in user's role key. */
  myRole: string;
  /** The signed-in user's data scope. */
  myScope: RoleScope;
  /** True when the current user sees data across the whole organisation. */
  isHeadOffice: boolean;
  /**
   * True when this user may read member records outside their own congregation.
   *
   * Deliberately wider than `isHeadOffice`: it also covers diocese-scoped roles,
   * whose members are the members of the congregations beneath them. Mirrors
   * `hasWideDirectoryScope()` in firestore.rules — asking for more than that
   * returns permission-denied, and asking for less shows a diocese officer only
   * one congregation.
   */
  canReadWholeDirectory: boolean;
  /** The parish (hierarchy doc id) this user belongs to, or ''. */
  myAtbiyaId: string;

  /** Reload permissions from Firestore */
  reload: () => Promise<void>;
  loading: boolean;
}

const PermissionContext = createContext<PermissionContextType | undefined>(undefined);

// Module-level cache so the first paint after a route change is instant.
let cachedRoleOverrides: RolePermissionOverrides | null = null;
let cachedUserOverrides: UserPermissionOverrides | null = null;
let cachedSuperAdmins: string[] | null = null;
let cachedRegistry: RoleRegistry | null = null;

export const PermissionProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuthContext();
  const { language } = useLanguage();
  const [roleOverrides, setRoleOverrides] = useState<RolePermissionOverrides>(cachedRoleOverrides ?? {});
  const [userOverrides, setUserOverrides] = useState<UserPermissionOverrides>(cachedUserOverrides ?? {});
  const [superAdmins, setSuperAdmins] = useState<string[]>(cachedSuperAdmins ?? []);
  const [registry, setRegistry] = useState<RoleRegistry>(cachedRegistry ?? DEFAULT_ROLE_REGISTRY);
  const [loading, setLoading] = useState(!cachedRegistry);

  /**
   * Each document is loaded independently, NOT with Promise.all.
   *
   * Two of these four are no longer world-readable: `superAdmins` is admin-only
   * and `userPermissionOverrides` is signed-in only. Under Promise.all a single
   * denial rejected the whole batch, so an anonymous visitor on the landing page
   * would have lost the role registry and permission overrides too — readable
   * documents, dropped because an unreadable one shared their promise.
   *
   * A denial here is expected, not exceptional: it means "not for you", and the
   * empty default is the right answer.
   */
  const load = async () => {
    const settled = await Promise.allSettled([
      permissionService.getRolePermissions(),
      permissionService.getUserOverrides(),
      permissionService.getSuperAdmins(),
      roleRegistryService.get(),
    ]);

    const [ro, uo, sa, reg] = settled;
    if (ro.status === 'fulfilled') { cachedRoleOverrides = ro.value; setRoleOverrides(ro.value); }
    if (uo.status === 'fulfilled') { cachedUserOverrides = uo.value; setUserOverrides(uo.value); }
    if (sa.status === 'fulfilled') { cachedSuperAdmins = sa.value; setSuperAdmins(sa.value); }
    if (reg.status === 'fulfilled') { cachedRegistry = reg.value; setRegistry(reg.value); }

    setLoading(false);
  };

  // Re-resolve whenever the signed-in user changes. The cached copies give an
  // instant first paint, but they must not outlive the session that fetched
  // them — user-level overrides are per-uid, so a stale cache would hand user B
  // the permissions that were resolved for user A.
  useEffect(() => {
    load();
  }, [user?.id]);

  const roles = registry.roles;
  const roleKeys = roles.map((r) => r.key);
  const roleByKey = new Map(roles.map((r) => [r.key, r]));

  const isSuperAdmin =
    user?.role === 'SuperAdmin' ||
    (user?.id ? superAdmins.includes(user.id) : false);

  const myRole = user?.hierarchyLevel ?? DEFAULT_SIGNUP_ROLE;

  const permissions: Set<PermissionKey> = (() => {
    if (!user) return new Set<PermissionKey>();
    if (isSuperAdmin) return new Set<PermissionKey>(ALL_PERMISSIONS);

    // The registry is the source of truth; `siteConfig/rolePermissions` is only
    // consulted for roles the registry does not describe (mid-migration state).
    const fromRegistry = roleByKey.get(myRole)?.permissions;
    const overrides: RolePermissionOverrides = fromRegistry
      ? { ...roleOverrides, [myRole]: fromRegistry }
      : roleOverrides;

    return resolvePermissions(myRole, user.id, overrides, userOverrides);
  })();

  const can = (permission: PermissionKey): boolean => {
    if (isSuperAdmin) return true;
    return permissions.has(permission);
  };

  /**
   * Defaults to the language the user is actually reading in. It used to
   * default to 'en', and since every call site omits the argument, role names
   * rendered English on an otherwise Amharic page.
   */
  const roleLabel = (key: string | undefined, lang: Language = language) =>
    key ? pickRoleLabel(roleByKey.get(key), lang) || key : '';

  const isAdminRole = (key: string | undefined) => !!key && roleByKey.get(key)?.isAdmin === true;
  const isApproverRole = (key: string | undefined) =>
    !!key && (roleByKey.get(key)?.canApproveMembers === true);
  const scopeOf = (key: string | undefined): RoleScope => roleByKey.get(key ?? '')?.scope ?? 'mahder';

  const myScope = scopeOf(myRole);
  const isHeadOffice = isSuperAdmin || myScope === 'global';
  const canReadWholeDirectory = isHeadOffice || myScope === 'zone';
  const myAtbiyaId = user?.atbiyaId ?? user?.hierarchyEntityId ?? '';

  return (
    <PermissionContext.Provider value={{
      can,
      permissions,
      isSuperAdmin,
      roleOverrides,
      userOverrides,
      roles,
      registry,
      roleKeys,
      roleLabel,
      isAdminRole,
      isApproverRole,
      scopeOf,
      myRole,
      myScope,
      isHeadOffice,
      canReadWholeDirectory,
      myAtbiyaId,
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
