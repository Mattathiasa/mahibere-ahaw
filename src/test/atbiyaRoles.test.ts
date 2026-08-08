// @vitest-environment node
// Pure logic, no DOM — and the shared jsdom environment currently fails to
// start in this repo, which is why the rules tests pin node too.
import { describe, expect, it, vi } from 'vitest';
import {
  applyRenamedLabels, deriveFlags, reconcileRoles, SEED_ROLES, type Role,
} from '@/services/roleRegistry';

/**
 * The two pure pieces of the parish-administrator wiring.
 *
 * `deriveFlags` is what firestore.rules actually reads, so a role losing its
 * flag here silently removes a capability the UI still offers. `postLoginPath`
 * is what sends a parish administrator to their queue.
 */

// roleRegistry builds its document references at module scope, so the Firestore
// SDK has to be stubbed before the import rather than inside a test.
vi.mock('@/lib/firebase', () => ({ db: {}, auth: {}, firebaseConfig: {} }));
vi.mock('firebase/firestore', () => ({
  doc: () => ({}),
  collection: () => ({}),
  getDoc: async () => ({ exists: () => false }),
  getDocs: async () => ({ docs: [] }),
  setDoc: async () => undefined,
  addDoc: async () => ({ id: 'x' }),
  updateDoc: async () => undefined,
  writeBatch: () => ({ set: () => undefined, commit: async () => undefined }),
  onSnapshot: () => () => undefined,
  query: () => ({}),
  where: () => ({}),
  orderBy: () => ({}),
  limit: () => ({}),
  serverTimestamp: () => null,
  Timestamp: class {},
}));

/**
 * The rename from Zone/Atbiya to Diocese/Local Congregation.
 *
 * `reconcileRoles` preserves labels on purpose, so without this migration the
 * new seed wording would never reach any installation that had already written
 * `siteConfig/roles` — which is every installation whose admin has opened
 * Software Control once.
 */
describe('applyRenamedLabels', () => {
  /** A registry as it would have been stored before the rename shipped. */
  const stored = (): Role[] => SEED_ROLES.map((r) => {
    if (r.key === 'Zone') {
      return { ...r, labels: { en: 'Zone', am: 'ዞን', om: 'Zoonii', ti: 'ዞባ' } };
    }
    if (r.key === 'Atbiya') {
      return { ...r, labels: { en: 'Atbiya', am: 'አጥቢያ ቤተ ክርስቲያን', om: 'Waldaa Naannoo', ti: 'ኣጥቢያ' } };
    }
    return r;
  });

  const labelOf = (roles: Role[], key: string) => roles.find((r) => r.key === key)!.labels;

  it('renames an untouched seed label in every language', () => {
    const out = applyRenamedLabels(stored());
    expect(labelOf(out, 'Zone').en).toBe('Diocese');
    expect(labelOf(out, 'Zone').am).toBe('ሀገረ ስብከት');
    expect(labelOf(out, 'Atbiya').en).toBe('Local Congregation');
    expect(labelOf(out, 'Atbiya').am).toBe('አጥቢያ');
  });

  it('leaves a label the operator renamed themselves alone', () => {
    const custom = stored().map((r) =>
      r.key === 'Zone' ? { ...r, labels: { ...r.labels, en: 'Region Office' } } : r
    );
    const out = applyRenamedLabels(custom);
    expect(labelOf(out, 'Zone').en).toBe('Region Office');
    // The languages they did not touch still migrate.
    expect(labelOf(out, 'Zone').am).toBe('ሀገረ ስብከት');
  });

  it('is idempotent', () => {
    const once = applyRenamedLabels(stored());
    expect(applyRenamedLabels(once)).toEqual(once);
  });

  it('does not touch roles it has no rename for', () => {
    const out = applyRenamedLabels(stored());
    expect(labelOf(out, 'Sinodos')).toEqual(labelOf(SEED_ROLES, 'Sinodos'));
    expect(labelOf(out, 'HiyawanMahderat')).toEqual(labelOf(SEED_ROLES, 'HiyawanMahderat'));
  });

  it('leaves a non-system role alone even if its label collides', () => {
    // An operator-created role named "Zone" is theirs, not ours to rewrite.
    const custom: Role[] = [
      ...stored(),
      { ...SEED_ROLES[0], key: 'Zone2', isSystem: false, labels: { en: 'Zone' } },
    ];
    expect(labelOf(applyRenamedLabels(custom), 'Zone2').en).toBe('Zone');
  });

  it('keeps the role KEYS untouched, so stored user records still resolve', () => {
    const out = applyRenamedLabels(stored());
    expect(out.map((r) => r.key)).toEqual(SEED_ROLES.map((r) => r.key));
  });
});

describe('deriveFlags', () => {
  const flags = deriveFlags(SEED_ROLES);

  it('keeps registry-wide parish management with head office', () => {
    expect(flags.atbiyaManagerRoles).toContain('Sinodos');
    expect(flags.atbiyaManagerRoles).toContain('Memriya');
    // The whole point of the split: a parish cannot register other parishes.
    expect(flags.atbiyaManagerRoles).not.toContain('Atbiya');
  });

  it('gives a parish the right to edit its own record', () => {
    expect(flags.ownAtbiyaRoles).toContain('Atbiya');
  });

  it('still lets a parish approve its own members', () => {
    expect(flags.approverRoles).toContain('Atbiya');
  });

  it('drops flags for a deactivated role', () => {
    const deactivated = SEED_ROLES.map((r) =>
      r.key === 'Atbiya' ? { ...r, active: false } : r
    );
    expect(deriveFlags(deactivated).ownAtbiyaRoles).not.toContain('Atbiya');
  });
});

describe('reconcileRoles', () => {
  /** A role as it would have been saved before the permission changes shipped. */
  const staleMember = (): Role => ({
    ...SEED_ROLES.find((r) => r.key === 'HiyawanMahderat')!,
    permissions: ['canViewDashboard', 'canViewMembers', 'canViewMeetings', 'canAddMembers'],
  });

  it('restores a built-in role to the shipped permissions', () => {
    const [member] = reconcileRoles([staleMember()]);
    // The whole point: these were stripped in code but persisted in Firestore.
    expect(member.permissions).not.toContain('canViewMembers');
    expect(member.permissions).not.toContain('canViewMeetings');
    expect(member.permissions).not.toContain('canAddMembers');
    expect(member.permissions).toContain('canViewDashboard');
  });

  it('keeps an operator\'s renaming and colour', () => {
    const renamed: Role = {
      ...staleMember(),
      labels: { en: 'Congregant' },
      color: 'rose',
      description: 'Our own wording',
    };
    const [out] = reconcileRoles([renamed]);
    expect(out.labels.en).toBe('Congregant');
    expect(out.color).toBe('rose');
    expect(out.description).toBe('Our own wording');
  });

  it('keeps a deactivated role deactivated', () => {
    const [out] = reconcileRoles([{ ...staleMember(), active: false }]);
    expect(out.active).toBe(false);
  });

  it('leaves a role the app does not ship completely alone', () => {
    const custom: Role = {
      key: 'Choir', labels: { en: 'Choir' }, description: '', scope: 'atbiya',
      permissions: ['canViewDashboard'], isAdmin: false, canApproveMembers: false,
      isSystem: false, color: 'amber', active: true,
    };
    expect(reconcileRoles([custom])[0]).toEqual(custom);
  });

  it('restores behaviour flags, not just permissions', () => {
    const tampered: Role = {
      ...SEED_ROLES.find((r) => r.key === 'Atbiya')!,
      isAdmin: true, canApproveMembers: false, scope: 'global',
    };
    const [out] = reconcileRoles([tampered]);
    expect(out.isAdmin).toBe(false);
    expect(out.canApproveMembers).toBe(true);
    expect(out.scope).toBe('atbiya');
  });

  // The landmine: deriveFlags runs on save, and firestore.rules only uses its
  // fallback when a key is ABSENT — an empty array would deny parish self-edits.
  it('produces a non-empty ownAtbiyaRoles after reconciliation', () => {
    const stale = SEED_ROLES.map((r) => ({ ...r, permissions: ['canViewDashboard'] as Role['permissions'] }));
    expect(deriveFlags(stale).ownAtbiyaRoles).toHaveLength(0);
    expect(deriveFlags(reconcileRoles(stale)).ownAtbiyaRoles).toContain('Atbiya');
  });
});

describe('postLoginPath', () => {
  async function pathFor(
    user: { hierarchyLevel?: string; atbiyaId?: string },
    roles = SEED_ROLES
  ) {
    vi.resetModules();
    vi.doMock('@/services/roleRegistry', () => ({
      roleRegistryService: { get: async () => ({ version: 1, roles }) },
    }));
    const { postLoginPath } = await import('@/lib/postLogin');
    return postLoginPath(user);
  }

  it('sends a parish administrator to their console', async () => {
    expect(await pathFor({ hierarchyLevel: 'Atbiya', atbiyaId: 'atbiya-1' }))
      .toBe('/my-atbiya');
  });

  it('sends head office to the dashboard', async () => {
    expect(await pathFor({ hierarchyLevel: 'Sinodos', atbiyaId: 'atbiya-1' }))
      .toBe('/dashboard');
  });

  it('sends a parish-scoped user with no parish to the dashboard', async () => {
    // Otherwise they land on a console that can only tell them it is empty.
    expect(await pathFor({ hierarchyLevel: 'Atbiya' })).toBe('/dashboard');
  });

  it('falls back to the dashboard for an unknown role', async () => {
    expect(await pathFor({ hierarchyLevel: 'Invented', atbiyaId: 'atbiya-1' }))
      .toBe('/dashboard');
  });

  it('falls back to the dashboard when the registry cannot be read', async () => {
    vi.resetModules();
    vi.doMock('@/services/roleRegistry', () => ({
      roleRegistryService: { get: async () => { throw new Error('offline'); } },
    }));
    const { postLoginPath } = await import('@/lib/postLogin');
    expect(await postLoginPath({ hierarchyLevel: 'Atbiya', atbiyaId: 'atbiya-1' }))
      .toBe('/dashboard');
  });
});
