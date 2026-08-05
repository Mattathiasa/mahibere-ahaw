// @vitest-environment node
// Pure logic, no DOM — and the shared jsdom environment currently fails to
// start in this repo, which is why the rules tests pin node too.
import { describe, expect, it, vi } from 'vitest';
import { deriveFlags, SEED_ROLES } from '@/services/roleRegistry';

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
