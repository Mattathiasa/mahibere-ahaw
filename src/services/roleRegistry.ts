import { doc, getDoc, writeBatch, onSnapshot } from 'firebase/firestore';
import { AppError } from '@/lib/appError';
import { db } from '@/lib/firebase';
import {
  DEFAULT_ROLE_PERMISSIONS,
  PERMISSIONS_VERSION,
  type PermissionKey,
  type RolePermissionOverrides,
} from '@/lib/rolePermissions';
import { auditLogService } from '@/services/auditLog';
import type { Language } from '@/i18n/translations';

/**
 * Roles used to be a hardcoded 7-value union duplicated across seven files and
 * `firestore.rules`. They now live in `siteConfig/roles` and can be added,
 * renamed, reordered and deleted from Software Control.
 *
 * The seven bylaw levels ship as `isSystem` roles: their KEYS are what every
 * existing `users/{uid}.hierarchyLevel` already stores, so they can never be
 * renamed or deleted — only their labels, permissions and flags are editable.
 */

/** Determines what slice of data a role can see. */
export type RoleScope = 'global' | 'zone' | 'atbiya' | 'mahder';

export interface Role {
  /** Immutable identity. Stored in `users/{uid}.hierarchyLevel`. */
  key: string;
  labels: Partial<Record<Language, string>>;
  description: string;
  scope: RoleScope;
  permissions: PermissionKey[];
  /** Grants access to /admin/* routes and `siteConfig` writes. */
  isAdmin: boolean;
  /** Can approve or reject membership sign-up requests. */
  canApproveMembers: boolean;
  /** Shipped with the app — key is locked, role cannot be deleted. */
  isSystem: boolean;
  /** Tailwind-ish colour token used for badges. */
  color: string;
  active: boolean;
}

export interface RoleRegistry {
  version: number;
  roles: Role[];
  /**
   * Which PERMISSIONS_VERSION this document was last reconciled against.
   * Missing means it predates reconciliation entirely.
   */
  permissionsVersion?: number;
  meta?: { updatedAt?: string; updatedBy?: string };
}

/**
 * Flattened projection of the registry, written alongside it and read by
 * `firestore.rules`. Rules CEL cannot filter a list of maps — only
 * `x in ['a','b']` works — so the flags must be pre-computed into string
 * arrays here.
 */
export interface RoleFlags {
  adminRoles: string[];
  approverRoles: string[];
  globalScopeRoles: string[];
  /** May register a parish and edit ANY parish record. Head office. */
  atbiyaManagerRoles: string[];
  /** May edit only the parish the account belongs to. */
  ownAtbiyaRoles: string[];
  memberManagerRoles: string[];
  directoryRoles: string[];
  newsRoles: string[];
  allRoleKeys: string[];
  /** Role assigned to self-service sign-ups. */
  signupRole: string;
  updatedAt: string;
}

// ─── Seed ────────────────────────────────────────────────────────────────────

interface SeedSpec {
  key: string;
  labels: Partial<Record<Language, string>>;
  description: string;
  scope: RoleScope;
  isAdmin: boolean;
  canApproveMembers: boolean;
  color: string;
}

/** Amharic names are taken from the bylaws org chart in `data/churchStructure.ts`. */
const SEED_SPECS: SeedSpec[] = [
  {
    key: 'Sinodos',
    labels: { en: 'Sinodos', am: 'ሲኖዶስ ዘአኀው', om: 'Sinodos', ti: 'ሲኖዶስ' },
    description: 'Supreme general assembly and final decision-making body.',
    scope: 'global', isAdmin: true, canApproveMembers: true, color: 'indigo',
  },
  {
    key: 'KuamiSinodos',
    labels: { en: 'KuamiSinodos', am: 'ቋሚ ሲኖዶስ', om: 'Sinodos Dhaabbataa', ti: 'ቋሚ ሲኖዶስ' },
    description: 'Standing Synod — executive leadership council.',
    scope: 'global', isAdmin: true, canApproveMembers: true, color: 'violet',
  },
  {
    key: 'Memriya',
    labels: { en: 'Memriya', am: 'መምሪያ', om: 'Kutaa', ti: 'መምርሒ' },
    description: 'Head office department.',
    scope: 'global', isAdmin: false, canApproveMembers: true, color: 'blue',
  },
  {
    key: 'Zone',
    labels: { en: 'Diocese', am: 'ሀገረ ስብከት', om: 'Diyoosiisii', ti: 'ሃገረ ስብከት' },
    description: 'Diocese overseeing a group of local congregations.',
    scope: 'zone', isAdmin: false, canApproveMembers: true, color: 'cyan',
  },
  {
    key: 'Atbiya',
    labels: { en: 'Local Congregation', am: 'አጥቢያ', om: 'Waldaa Naannoo', ti: 'ኣጥቢያ' },
    description: 'Local congregation — the base unit of the structure.',
    scope: 'atbiya', isAdmin: false, canApproveMembers: true, color: 'emerald',
  },
  {
    key: 'EnkesekaseMaikel',
    labels: { en: 'EnkesekaseMaikel', am: 'እንቀጸ ካሴ ሚካኤል', om: 'EnkesekaseMaikel', ti: 'እንቀጸ ካሴ ሚካኤል' },
    description: 'Parish sub-unit.',
    scope: 'atbiya', isAdmin: false, canApproveMembers: false, color: 'amber',
  },
  {
    key: 'HiyawanMahderat',
    labels: { en: 'HiyawanMahderat', am: 'የሕያዋን ማኅደራት', om: 'HiyawanMahderat', ti: 'ናይ ህያዋን ማሕደራት' },
    description: 'Living archives group — the smallest fellowship unit.',
    scope: 'mahder', isAdmin: false, canApproveMembers: false, color: 'slate',
  },
];

/** The role a self-service sign-up is given until an admin promotes them. */
export const DEFAULT_SIGNUP_ROLE = 'HiyawanMahderat';

export const SEED_ROLES: Role[] = SEED_SPECS.map((s) => ({
  key: s.key,
  labels: s.labels,
  description: s.description,
  scope: s.scope,
  permissions: DEFAULT_ROLE_PERMISSIONS[s.key] ?? [],
  isAdmin: s.isAdmin,
  canApproveMembers: s.canApproveMembers,
  isSystem: true,
  color: s.color,
  active: true,
}));

export const DEFAULT_ROLE_REGISTRY: RoleRegistry = {
  version: 1,
  roles: SEED_ROLES,
  permissionsVersion: PERMISSIONS_VERSION,
};

// ─── Derivations ─────────────────────────────────────────────────────────────

/**
 * Pure projection of the registry into the flat arrays `firestore.rules` reads.
 * Kept pure so it can be unit-tested and re-run on every save.
 */
export function deriveFlags(roles: Role[], signupRole = DEFAULT_SIGNUP_ROLE): RoleFlags {
  const active = roles.filter((r) => r.active !== false);
  const withPerm = (p: PermissionKey) =>
    active.filter((r) => r.permissions.includes(p)).map((r) => r.key);

  return {
    adminRoles: active.filter((r) => r.isAdmin).map((r) => r.key),
    approverRoles: active
      .filter((r) => r.canApproveMembers || r.permissions.includes('canApproveMembers'))
      .map((r) => r.key),
    globalScopeRoles: active.filter((r) => r.scope === 'global').map((r) => r.key),
    atbiyaManagerRoles: withPerm('canManageAtbiyas'),
    ownAtbiyaRoles: withPerm('canEditOwnAtbiya'),
    memberManagerRoles: withPerm('canAddMembers'),
    directoryRoles: withPerm('canViewMembers'),
    newsRoles: withPerm('canManageNews'),
    allRoleKeys: roles.map((r) => r.key),
    signupRole,
    updatedAt: new Date().toISOString(),
  };
}

/**
 * Brings roles saved before `PERMISSIONS_VERSION` back in line with the app.
 *
 * Once an admin opens Software Control, `siteConfig/roles` exists and is
 * preferred over DEFAULT_ROLE_PERMISSIONS everywhere — so a deploy that added a
 * permission key or narrowed a role changed nothing at all. That is why members
 * kept seeing pages their role had already been stripped of in code.
 *
 * Only roles the app actually ships are touched, identified by having an entry
 * in DEFAULT_ROLE_PERMISSIONS. A role an operator created themselves is left
 * exactly as it is — the app has no opinion about it.
 *
 * `permissions`, `isAdmin`, `canApproveMembers` and `scope` are behaviour and
 * come back from the seed. `labels`, `color`, `description` and `active` are
 * presentation and deliberate operator choices, so they survive: a role that was
 * renamed or deactivated stays renamed and deactivated.
 *
 * Pure, and applied on read rather than by writing — ordinary users cannot write
 * siteConfig, and every client needs the corrected answer immediately.
 */
export function reconcileRoles(roles: Role[]): Role[] {
  const seedByKey = new Map(SEED_ROLES.map((r) => [r.key, r]));
  return roles.map((role) => {
    const seed = seedByKey.get(role.key);
    if (!seed || !DEFAULT_ROLE_PERMISSIONS[role.key]) return role;
    return {
      ...role,
      permissions: [...DEFAULT_ROLE_PERMISSIONS[role.key]],
      isAdmin: seed.isAdmin,
      canApproveMembers: seed.canApproveMembers,
      scope: seed.scope,
      isSystem: true,
    };
  });
}

/**
 * Built-in labels that have been superseded, keyed by role.
 *
 * `reconcileRoles` deliberately preserves `labels` — an operator who renamed a
 * role should keep their name. That is right, but it also means shipping a new
 * seed label changes nothing on any installation that has ever opened Software
 * Control, because `siteConfig/roles` already exists with the old text.
 *
 * So a rename that has to reach everybody is recorded here instead, and applied
 * only where the stored label is still EXACTLY the old seed value. An operator's
 * own wording never matches, so it is never touched.
 */
const RENAMED_LABELS: Record<string, Array<{ lang: Language; from: string; to: string }>> = {
  Zone: [
    { lang: 'en', from: 'Zone', to: 'Diocese' },
    { lang: 'am', from: 'ዞን', to: 'ሀገረ ስብከት' },
    { lang: 'om', from: 'Zoonii', to: 'Diyoosiisii' },
    { lang: 'ti', from: 'ዞባ', to: 'ሃገረ ስብከት' },
  ],
  Atbiya: [
    { lang: 'en', from: 'Atbiya', to: 'Local Congregation' },
    { lang: 'am', from: 'አጥቢያ ቤተ ክርስቲያን', to: 'አጥቢያ' },
    { lang: 'ti', from: 'ኣጥቢያ', to: 'ኣጥቢያ' },
  ],
};

/**
 * Applies `RENAMED_LABELS`. Pure and idempotent — once a label has moved on it
 * no longer matches `from`, so re-running is a no-op.
 */
export function applyRenamedLabels(roles: Role[]): Role[] {
  return roles.map((role) => {
    const renames = RENAMED_LABELS[role.key];
    if (!renames || !role.isSystem) return role;

    let labels = role.labels;
    for (const { lang, from, to } of renames) {
      if (labels[lang] === from && from !== to) {
        // Copy on first hit only, so untouched roles keep their identity.
        if (labels === role.labels) labels = { ...role.labels };
        labels[lang] = to;
      }
    }
    return labels === role.labels ? role : { ...role, labels };
  });
}

/** Legacy mirror so pre-upgrade browser tabs keep resolving permissions. */
export function deriveRolePermissions(roles: Role[]): RolePermissionOverrides {
  const out: RolePermissionOverrides = {};
  for (const r of roles) out[r.key] = r.permissions;
  return out;
}

export function roleLabel(role: Role | undefined, lang: Language): string {
  if (!role) return '';
  return role.labels[lang] || role.labels.en || role.key;
}

// ─── Validation ──────────────────────────────────────────────────────────────

/**
 * Guards against the two ways the editor can lock everyone out of the system.
 * Returns a human-readable reason, or null when the registry is safe to save.
 */
export function validateRegistry(roles: Role[]): string | null {
  if (roles.length === 0) return 'At least one role is required.';

  const keys = roles.map((r) => r.key);
  const dupes = keys.filter((k, i) => keys.indexOf(k) !== i);
  if (dupes.length) return `Duplicate role key: ${dupes[0]}`;

  const badKey = keys.find((k) => !/^[A-Za-z][A-Za-z0-9_-]*$/.test(k));
  if (badKey !== undefined) {
    return `Invalid role key "${badKey}". Use letters, digits, dash or underscore, starting with a letter.`;
  }

  if (!roles.some((r) => r.isAdmin && r.active !== false)) {
    return 'At least one active role must have administrator access, or nobody could open Software Control again.';
  }

  for (const seed of SEED_ROLES) {
    if (!roles.some((r) => r.key === seed.key)) {
      return `The built-in role "${seed.key}" cannot be removed — existing accounts still reference it.`;
    }
  }
  return null;
}

// ─── Firestore ───────────────────────────────────────────────────────────────

const rolesRef = doc(db, 'siteConfig', 'roles');
const flagsRef = doc(db, 'siteConfig', 'roleFlags');
const mirrorRef = doc(db, 'siteConfig', 'rolePermissions');

function normalize(raw: unknown): RoleRegistry | null {
  const data = raw as Partial<RoleRegistry> | undefined;
  if (!data || !Array.isArray(data.roles) || data.roles.length === 0) return null;

  const storedPermissionsVersion = typeof data.permissionsVersion === 'number'
    ? data.permissionsVersion
    : 0;

  const parsed: Role[] = data.roles.map((r) => ({
    ...r,
    permissions: Array.isArray(r.permissions) ? r.permissions : [],
    labels: r.labels ?? {},
    active: r.active !== false,
    isSystem: r.isSystem === true,
    isAdmin: r.isAdmin === true,
    canApproveMembers: r.canApproveMembers === true,
    scope: (r.scope ?? 'atbiya') as RoleScope,
    color: r.color ?? 'slate',
    description: r.description ?? '',
  }));

  return {
    version: typeof data.version === 'number' ? data.version : 1,
    // A document saved before this version predates permission changes that
    // shipped since, so the built-in roles are brought back in line here.
    // The label migration runs unconditionally: it is version-independent and
    // a no-op once applied.
    roles: applyRenamedLabels(
      storedPermissionsVersion < PERMISSIONS_VERSION ? reconcileRoles(parsed) : parsed
    ),
    permissionsVersion: storedPermissionsVersion,
    meta: data.meta,
  };
}

export const roleRegistryService = {
  /**
   * Reads the registry. Falls back to the bundled seed when the document does
   * not exist yet or is unreadable — it never writes, because ordinary users
   * have no permission to and a failed write here would break sign-in.
   */
  async get(): Promise<RoleRegistry> {
    try {
      const snap = await getDoc(rolesRef);
      return (snap.exists() && normalize(snap.data())) || DEFAULT_ROLE_REGISTRY;
    } catch {
      return DEFAULT_ROLE_REGISTRY;
    }
  },

  async getFlags(): Promise<RoleFlags> {
    try {
      const snap = await getDoc(flagsRef);
      if (snap.exists()) return snap.data() as RoleFlags;
    } catch { /* fall through to the derived default */ }
    return deriveFlags(SEED_ROLES);
  },

  subscribe(cb: (registry: RoleRegistry) => void) {
    return onSnapshot(
      rolesRef,
      (snap) => cb((snap.exists() && normalize(snap.data())) || DEFAULT_ROLE_REGISTRY),
      () => cb(DEFAULT_ROLE_REGISTRY)
    );
  },

  /**
   * Writes the registry, its flattened flags and the legacy mirror atomically.
   *
   * `expectedVersion` implements optimistic concurrency: Software Control and
   * Permission Control used to write `siteConfig/rolePermissions` independently
   * and silently clobber one another. A stale editor now fails loudly instead.
   */
  async save(
    roles: Role[],
    updatedBy: string,
    expectedVersion: number,
    signupRole = DEFAULT_SIGNUP_ROLE
  ): Promise<number> {
    const problem = validateRegistry(roles);
    if (problem) throw new Error(problem);

    const current = await this.get();
    if (current.version !== expectedVersion) {
      throw new AppError('rolesChangedElsewhere');
    }

    const nextVersion = expectedVersion + 1;
    const batch = writeBatch(db);
    batch.set(rolesRef, {
      version: nextVersion,
      roles,
      // Records that this document has caught up with the shipped defaults, so
      // reconcileRoles stops re-applying them on read.
      permissionsVersion: PERMISSIONS_VERSION,
      meta: { updatedAt: new Date().toISOString(), updatedBy },
    });
    batch.set(flagsRef, deriveFlags(roles, signupRole));
    batch.set(mirrorRef, {
      ...deriveRolePermissions(roles),
      _meta: { updatedAt: new Date().toISOString(), updatedBy, source: 'roleRegistry' },
    });
    await batch.commit();

    auditLogService.dataChange(
      'update',
      'siteConfig/roles',
      'roles',
      `Updated role registry (${roles.length} roles, v${nextVersion})`
    );
    return nextVersion;
  },

  /**
   * Writes the seed on first use. Called only from Software Control by a super
   * admin — the write succeeds under the pre-migration rules too, which is what
   * lets `siteConfig/roleFlags` exist before the new rules start reading it.
   */
  async ensureSeeded(updatedBy: string): Promise<boolean> {
    const snap = await getDoc(rolesRef);
    if (snap.exists()) return false;

    const batch = writeBatch(db);
    batch.set(rolesRef, {
      version: 1,
      roles: SEED_ROLES,
      permissionsVersion: PERMISSIONS_VERSION,
      meta: { updatedAt: new Date().toISOString(), updatedBy, seeded: true },
    });
    batch.set(flagsRef, deriveFlags(SEED_ROLES));
    await batch.commit();

    auditLogService.dataChange(
      'create',
      'siteConfig/roles',
      'roles',
      `Initialized role registry with ${SEED_ROLES.length} built-in roles`
    );
    return true;
  },
};
