import { db } from '@/lib/firebase';
import { doc, getDoc, setDoc, onSnapshot } from 'firebase/firestore';
import type {
  PermissionKey,
  RolePermissionOverrides,
  UserPermissionOverrides,
} from '@/lib/rolePermissions';
import type { HierarchyLevel } from '@/types';

const COLLECTION = 'siteConfig';
const ROLE_DOC    = 'rolePermissions';
const USER_DOC    = 'userPermissionOverrides';

export const permissionService = {
  // ── Role-level permissions ──────────────────────────────────────────────

  async getRolePermissions(): Promise<RolePermissionOverrides> {
    const snap = await getDoc(doc(db, COLLECTION, ROLE_DOC));
    return snap.exists() ? (snap.data() as RolePermissionOverrides) : {};
  },

  async saveRolePermissions(
    overrides: RolePermissionOverrides,
    updatedBy: string
  ): Promise<void> {
    await setDoc(doc(db, COLLECTION, ROLE_DOC), {
      ...overrides,
      _meta: { updatedAt: new Date().toISOString(), updatedBy },
    });
  },

  // ── Per-user overrides ──────────────────────────────────────────────────

  async getUserOverrides(): Promise<UserPermissionOverrides> {
    const snap = await getDoc(doc(db, COLLECTION, USER_DOC));
    return snap.exists() ? (snap.data() as UserPermissionOverrides) : {};
  },

  async saveUserOverrides(
    overrides: UserPermissionOverrides,
    updatedBy: string
  ): Promise<void> {
    await setDoc(doc(db, COLLECTION, USER_DOC), {
      ...overrides,
      _meta: { updatedAt: new Date().toISOString(), updatedBy },
    });
  },

  // ── Super Admin management ──────────────────────────────────────────────

  async getSuperAdmins(): Promise<string[]> {
    const snap = await getDoc(doc(db, COLLECTION, 'superAdmins'));
    return snap.exists() ? (snap.data().uids as string[]) ?? [] : [];
  },

  async setSuperAdmins(uids: string[], updatedBy: string): Promise<void> {
    await setDoc(doc(db, COLLECTION, 'superAdmins'), {
      uids,
      _meta: { updatedAt: new Date().toISOString(), updatedBy },
    });
  },
};
