// @vitest-environment node
/**
 * Security-rules tests.
 *
 * These guard the migration to dynamic roles + membership approval. The two
 * that matter most:
 *
 *   - "legacy user with no status field" MUST still have full access. Every
 *     account that predates sign-up has no `status`, and if the default were
 *     wrong the whole congregation would be locked out on deploy.
 *   - "roleFlags missing" MUST still let an admin in, so a corrupt or absent
 *     siteConfig/roleFlags degrades to the old hardcoded behaviour instead of
 *     being unrecoverable.
 *
 * Run:  npx firebase emulators:exec --only firestore "npx vitest run src/test/firestore.rules.test.ts"
 */
import { readFileSync } from 'fs';
import { resolve } from 'path';
import { beforeAll, afterAll, beforeEach, describe, expect, it } from 'vitest';
import {
  initializeTestEnvironment,
  assertFails,
  assertSucceeds,
  type RulesTestEnvironment,
} from '@firebase/rules-unit-testing';
import {
  doc, getDoc, setDoc, updateDoc, deleteDoc,
  collection, query, where, getDocs,
} from 'firebase/firestore';

let env: RulesTestEnvironment;

const PROJECT_ID = 'mahibere-ahaw-rules-test';

/** Mirrors what services/roleRegistry.ts writes to siteConfig/roleFlags. */
const ROLE_FLAGS = {
  adminRoles: ['Sinodos', 'KuamiSinodos'],
  approverRoles: ['Sinodos', 'KuamiSinodos', 'Memriya', 'Zone', 'Atbiya'],
  globalScopeRoles: ['Sinodos', 'KuamiSinodos', 'Memriya'],
  // withPerm('canManageAtbiyas') — head office only. A parish leader is NOT
  // here; registering parishes is deliberately not something they can do.
  atbiyaManagerRoles: ['Sinodos', 'KuamiSinodos', 'Memriya'],
  // withPerm('canEditOwnAtbiya') — this is what lets a parish maintain itself.
  ownAtbiyaRoles: ['Sinodos', 'KuamiSinodos', 'Atbiya'],
  memberManagerRoles: ['Sinodos', 'KuamiSinodos', 'Memriya', 'Zone', 'Atbiya'],
  directoryRoles: ['Sinodos', 'KuamiSinodos', 'Memriya', 'Zone', 'Atbiya', 'EnkesekaseMaikel', 'HiyawanMahderat'],
  newsRoles: ['Sinodos', 'KuamiSinodos', 'Memriya', 'Atbiya'],
  // Diocese-scoped roles. Read only by the directory rule, which lets them see
  // across congregations because their members ARE the congregations' members.
  zoneScopeRoles: ['Zone'],
  // ── Module access ────────────────────────────────────────────────────────
  // Finance, HR, inventory and documents used to be readable AND writable by any
  // approved account, including the ordinary member role that sign-up assigns.
  financeReadRoles: ['Sinodos', 'KuamiSinodos', 'Memriya', 'Zone', 'Atbiya'],
  financeWriteRoles: ['Sinodos', 'KuamiSinodos', 'Memriya', 'Zone', 'Atbiya'],
  hrRoles: ['Sinodos', 'KuamiSinodos', 'Memriya', 'Zone', 'Atbiya'],
  inventoryRoles: ['Sinodos', 'KuamiSinodos', 'Memriya', 'Zone', 'Atbiya'],
  documentReadRoles: ['Sinodos', 'KuamiSinodos', 'Memriya', 'Zone', 'Atbiya', 'EnkesekaseMaikel'],
  documentWriteRoles: ['Sinodos', 'KuamiSinodos', 'Memriya', 'Zone', 'Atbiya'],
  planWriteRoles: ['Sinodos', 'KuamiSinodos', 'Memriya', 'Zone', 'Atbiya'],
  reportWriteRoles: ['Sinodos', 'KuamiSinodos', 'Memriya', 'Zone', 'Atbiya', 'EnkesekaseMaikel'],
  announcementWriteRoles: ['Sinodos', 'KuamiSinodos', 'Memriya'],
  teachingWriteRoles: ['Sinodos', 'KuamiSinodos', 'Memriya'],
  allRoleKeys: ['Sinodos', 'KuamiSinodos', 'Memriya', 'Zone', 'Atbiya', 'EnkesekaseMaikel', 'HiyawanMahderat'],
  signupRole: 'HiyawanMahderat',
  updatedAt: '2026-08-01T00:00:00.000Z',
};

/** A complete, rules-legal self sign-up payload. */
const signupDoc = (atbiyaId = 'atbiya-bishoftu') => ({
  username: 'newmember',
  email: 'new@example.com',
  fullNameEnglish: 'New Member',
  fullNameAmharic: 'አዲስ አባል',
  phone: '0911000000',
  gender: 'Male',
  atbiyaId,
  atbiyaName: 'Bishoftu Atbiya',
  hierarchyLevel: 'HiyawanMahderat',
  role: 'user',
  status: 'pending',
  signupSource: 'self',
  requestedAt: '2026-08-01T00:00:00.000Z',
  createdAt: '2026-08-01T00:00:00.000Z',
});

// 30s, not vitest's default 10s. The first call has to wait out the emulator's
// JVM cold start, which regularly exceeds 10s on a laptop and fails the whole
// suite before a single assertion runs.
const HOOK_TIMEOUT_MS = 30_000;

beforeAll(async () => {
  env = await initializeTestEnvironment({
    projectId: PROJECT_ID,
    firestore: {
      rules: readFileSync(resolve(__dirname, '../../firestore.rules'), 'utf8'),
      host: '127.0.0.1',
      // Overridable so the suite can still run when something else already
      // holds 8080 (a local http-server, another emulator).
      port: Number(process.env.FIRESTORE_EMULATOR_PORT ?? 8080),
    },
  });
}, HOOK_TIMEOUT_MS);

afterAll(async () => { await env?.cleanup(); });

beforeEach(async () => {
  await env.clearFirestore();
  // Seed baseline state with rules disabled.
  await env.withSecurityRulesDisabled(async (ctx) => {
    const db = ctx.firestore();
    await setDoc(doc(db, 'siteConfig/roleFlags'), ROLE_FLAGS);
    await setDoc(doc(db, 'siteConfig/superAdmins'), { uids: ['super-1'] });

    // ── Accounts ──────────────────────────────────────────────────────────
    // Deliberately has NO `status` field — this is what every pre-existing
    // account in production looks like.
    await setDoc(doc(db, 'users/legacy-1'), {
      username: 'legacy', hierarchyLevel: 'Zone', role: 'user',
    });
    await setDoc(doc(db, 'users/active-1'), {
      username: 'active', hierarchyLevel: 'Zone', role: 'user', status: 'active',
    });
    await setDoc(doc(db, 'users/pending-1'), {
      username: 'pending', hierarchyLevel: 'HiyawanMahderat', role: 'user',
      status: 'pending', atbiyaId: 'atbiya-bishoftu', signupSource: 'self',
    });
    await setDoc(doc(db, 'users/admin-1'), {
      username: 'admin', hierarchyLevel: 'Sinodos', role: 'user', status: 'active',
    });
    // Holds canManageAtbiyas without being an admin role — the case the
    // registry page exists for.
    await setDoc(doc(db, 'users/memriya-1'), {
      username: 'memriya', hierarchyLevel: 'Memriya', role: 'user', status: 'active',
    });
    await setDoc(doc(db, 'users/parish-1'), {
      username: 'parish', hierarchyLevel: 'Atbiya', role: 'user', status: 'active',
      atbiyaId: 'atbiya-bishoftu',
    });
    await setDoc(doc(db, 'users/parish-2'), {
      username: 'other', hierarchyLevel: 'Atbiya', role: 'user', status: 'active',
      atbiyaId: 'atbiya-adama',
    });
    await setDoc(doc(db, 'users/super-1'), {
      username: 'super', hierarchyLevel: 'HiyawanMahderat', role: 'user', status: 'active',
    });
    // An ordinary member of Bishoftu, for the Mahedher join rule.
    await setDoc(doc(db, 'users/member-1'), {
      username: 'member', hierarchyLevel: 'HiyawanMahderat', role: 'user',
      status: 'active', atbiyaId: 'atbiya-bishoftu',
    });

    // ── Parishes ──────────────────────────────────────────────────────────
    // Public fields only. `bankAccounts` and `contact` live in atbiyaPrivate now
    // — /hierarchy is readable by anonymous visitors, so anything left here is
    // published to the internet.
    await setDoc(doc(db, 'hierarchy/atbiya-bishoftu'), {
      name: 'Bishoftu Atbiya', nameAmharic: 'ቢሾፍቱ አጥቢያ', level: 'Atbiya',
      parentId: 'zone-1', active: true, isPublic: true, cityEn: 'Bishoftu',
    });
    await setDoc(doc(db, 'atbiyaPrivate/atbiya-bishoftu'), {
      bankAccounts: [{ bankName: 'CBE', accountNumber: '1000123456789' }],
      contact: { nameEn: 'Parish Secretary', phone: '0911223344' },
    });
    await setDoc(doc(db, 'atbiyaPrivate/atbiya-adama'), {
      bankAccounts: [{ bankName: 'Awash', accountNumber: '01320987654321' }],
      contact: { nameEn: 'Adama Secretary', phone: '0922334455' },
    });
    await setDoc(doc(db, 'hierarchy/atbiya-adama'), {
      name: 'Adama Atbiya', level: 'Atbiya', parentId: 'zone-1',
      active: true, isPublic: true,
    });
    await setDoc(doc(db, 'hierarchy/zone-1'), {
      name: 'Central Zone', level: 'Zone', parentId: null,
    });

    // ── Mahedherat ────────────────────────────────────────────────────────
    await setDoc(doc(db, 'hierarchy/mahder-bole'), {
      name: 'Bole Mahedher', level: 'Mahderat', parentId: 'atbiya-bishoftu',
      lat: 8.995, lng: 38.789, active: true,
    });
    await setDoc(doc(db, 'hierarchy/mahder-adama'), {
      name: 'Adama Mahedher', level: 'Mahderat', parentId: 'atbiya-adama',
      active: true,
    });

    // ── News ──────────────────────────────────────────────────────────────
    await setDoc(doc(db, 'news/published-post'), {
      slug: 'published-post', status: 'published', scope: 'global',
      atbiyaId: null, authorId: 'admin-1', title: { en: 'Hello' },
    });
    await setDoc(doc(db, 'news/draft-post'), {
      slug: 'draft-post', status: 'draft', scope: 'global',
      atbiyaId: null, authorId: 'admin-1', title: { en: 'Draft' },
    });

    await setDoc(doc(db, 'meetings/m1'), { title: 'Council' });
    // Owned by parish-1, for the meeting-ownership rules.
    await setDoc(doc(db, 'meetings/mtg-owned'), {
      title: 'Parish council', scheduledDate: '2026-09-01T09:00', createdBy: 'parish-1',
    });
    await setDoc(doc(db, 'siteConfig/landingPage'), { en: {} });

    // ── Notifications ─────────────────────────────────────────────────────
    await setDoc(doc(db, 'notifications/n-active'), {
      userId: 'active-1', title: 'For you', message: 'hello',
      type: 'info', status: 'unread', createdAt: '2026-08-01T00:00:00.000Z',
    });
    await setDoc(doc(db, 'notifications/n-parish'), {
      userId: 'parish-1', title: 'For the parish leader', message: 'hello',
      type: 'info', status: 'unread', createdAt: '2026-08-01T00:00:00.000Z',
    });
  });
}, HOOK_TIMEOUT_MS);

const anon = () => env.unauthenticatedContext().firestore();

/**
 * Signs in as a fixture account.
 *
 * The token carries an `email` claim because a real Firebase email/password
 * token always does, and the `usernames` rules compare against
 * `request.auth.token.email` — that is what stops a row being pointed at an
 * address the caller does not own. Without the claim here the harness would
 * deny writes the app performs successfully in production.
 *
 * SYNTHETIC, because that is what these accounts actually sign in with: every
 * account created from a username gets `<name>@mahibereahaw.local`, and only
 * someone who attached a recovery email has a real address. Using @example.com
 * here made the rename cases fail against a correct rule.
 */
const emailFor = (uid: string) =>
  `${uid.replace(/[^a-z0-9]/g, '')}@mahibereahaw.local`;
/**
 * `email` overrides the token's address, for the rules that compare a written
 * value against `request.auth.token.email`. Defaults to the synthetic form, so
 * every existing call is unaffected.
 */
const as = (uid: string, claims: { email?: string } = {}) =>
  env.authenticatedContext(uid, { email: claims.email ?? emailFor(uid) }).firestore();

describe('anonymous visitors', () => {
  it('1. can list parishes with the level==Atbiya filter (sign-up dropdown)', async () => {
    const db = anon();
    await assertSucceeds(
      getDocs(query(collection(db, 'hierarchy'), where('level', '==', 'Atbiya')))
    );
  });

  it('2. cannot list the hierarchy collection unfiltered', async () => {
    await assertFails(getDocs(collection(anon(), 'hierarchy')));
  });

  it('3. can list published news', async () => {
    const db = anon();
    await assertSucceeds(
      getDocs(query(collection(db, 'news'), where('status', '==', 'published')))
    );
  });

  it('4. cannot read a draft post', async () => {
    await assertFails(getDoc(doc(anon(), 'news/draft-post')));
  });

  it('can read the landing page config, but not the member directory', async () => {
    await assertSucceeds(getDoc(doc(anon(), 'siteConfig/landingPage')));
    await assertFails(getDocs(collection(anon(), 'users')));
  });

  // Regression: an allowlist of siteConfig docs broke the public pages, which
  // read translation overrides and the permission documents while signed out.
  it('can read every siteConfig document the public pages need', async () => {
    for (const id of ['landingPage', 'pageStrings', 'integrations', 'churchRules',
                      'roleFlags', 'roles', 'translations_overrides',
                      'rolePermissions', 'softwareControl', 'moduleConfig']) {
      await assertSucceeds(getDoc(doc(anon(), `siteConfig/${id}`)));
    }
  });

  // `userPermissionOverrides` and `superAdmins` used to be in the list above.
  // They are not things a public page needs — PermissionContext loads each
  // document independently now and treats a denial as "not for you" — and
  // publishing them handed out a per-uid permission map and a target list of
  // administrator uids.
  it('but NOT the two that are nobody\'s business', async () => {
    await assertFails(getDoc(doc(anon(), 'siteConfig/userPermissionOverrides')));
    await assertFails(getDoc(doc(anon(), 'siteConfig/superAdmins')));
  });

  it('still cannot WRITE siteConfig', async () => {
    await assertFails(setDoc(doc(anon(), 'siteConfig/roles'), { version: 9, roles: [] }));
  });
});

describe('legacy accounts (no status field)', () => {
  it('5. THE CRITICAL CASE — can still read application data', async () => {
    await assertSucceeds(getDoc(doc(as('legacy-1'), 'meetings/m1')));
  });

  it('5b. can still write application data', async () => {
    // `createdBy` is required on meetings since they became owned; the point of
    // this case is unchanged — a status-less legacy account is still active.
    await assertSucceeds(setDoc(doc(as('legacy-1'), 'meetings/m2'), {
      title: 'New', createdBy: 'legacy-1',
    }));
  });

  it('5c. can still read the member directory', async () => {
    await assertSucceeds(getDocs(collection(as('legacy-1'), 'users')));
  });
});

describe('pending accounts', () => {
  it('6. cannot read application data', async () => {
    await assertFails(getDoc(doc(as('pending-1'), 'meetings/m1')));
  });

  it('6b. cannot write application data', async () => {
    await assertFails(setDoc(doc(as('pending-1'), 'meetings/m3'), { title: 'Nope' }));
  });

  it('6c. cannot read the member directory', async () => {
    await assertFails(getDocs(collection(as('pending-1'), 'users')));
  });

  it('7. CAN read its own user document (to see the pending message)', async () => {
    await assertSucceeds(getDoc(doc(as('pending-1'), 'users/pending-1')));
  });

  it('cannot approve itself', async () => {
    await assertFails(updateDoc(doc(as('pending-1'), 'users/pending-1'), { status: 'active' }));
  });
});

describe('self sign-up', () => {
  it('can create its own pending document', async () => {
    await assertSucceeds(setDoc(doc(as('new-1'), 'users/new-1'), signupDoc()));
  });

  it('8. cannot create itself as active', async () => {
    await assertFails(
      setDoc(doc(as('new-1'), 'users/new-1'), { ...signupDoc(), status: 'active' })
    );
  });

  it('cannot self-assign a privileged role', async () => {
    await assertFails(
      setDoc(doc(as('new-1'), 'users/new-1'), { ...signupDoc(), hierarchyLevel: 'Sinodos' })
    );
  });

  it('cannot smuggle in extra fields such as approvedBy', async () => {
    await assertFails(
      setDoc(doc(as('new-1'), 'users/new-1'), { ...signupDoc(), approvedBy: 'nobody' })
    );
  });

  it('cannot create a document for somebody else', async () => {
    await assertFails(setDoc(doc(as('new-1'), 'users/other-uid'), signupDoc()));
  });

  it('must choose a parish', async () => {
    await assertFails(setDoc(doc(as('new-1'), 'users/new-1'), { ...signupDoc(''), atbiyaId: '' }));
  });
});

describe('privilege escalation', () => {
  it('9. an active user cannot change their own hierarchyLevel', async () => {
    await assertFails(updateDoc(doc(as('active-1'), 'users/active-1'), { hierarchyLevel: 'Sinodos' }));
  });

  it('an active user cannot change their own role', async () => {
    await assertFails(updateDoc(doc(as('active-1'), 'users/active-1'), { role: 'SuperAdmin' }));
  });

  it('an active user cannot change their own status', async () => {
    await assertFails(updateDoc(doc(as('active-1'), 'users/active-1'), { status: 'suspended' }));
  });

  it('an active user CAN edit ordinary profile fields', async () => {
    await assertSucceeds(updateDoc(doc(as('active-1'), 'users/active-1'), { phone: '0911999999' }));
  });

  it('a non-admin cannot write siteConfig', async () => {
    await assertFails(setDoc(doc(as('active-1'), 'siteConfig/roles'), { version: 2, roles: [] }));
  });

  // A member manager is any role with canAddMembers — which includes Zone and
  // Atbiya. Without hierarchyLevel in the forbidden list they could promote
  // themselves or anyone else to an admin role.
  it('a member manager cannot promote another user', async () => {
    await assertFails(updateDoc(doc(as('parish-1'), 'users/active-1'), { hierarchyLevel: 'Sinodos' }));
  });

  it('a member manager cannot move a user to another parish', async () => {
    await assertFails(updateDoc(doc(as('parish-1'), 'users/active-1'), { atbiyaId: 'atbiya-adama' }));
  });

  it('a member manager CAN still edit ordinary profile fields', async () => {
    await assertSucceeds(updateDoc(doc(as('parish-1'), 'users/active-1'), { workSchool: 'Addis University' }));
  });

  it('an admin CAN assign roles', async () => {
    await assertSucceeds(updateDoc(doc(as('admin-1'), 'users/active-1'), { hierarchyLevel: 'Memriya' }));
  });
});

/**
 * Mahedherat — small Bible-study groups, stored as `hierarchy` documents with
 * `level: 'Mahderat'` and parented to a congregation. A congregation controls
 * its own; a member joins one of its own congregation's.
 */
describe('mahedherat', () => {
  it('a congregation can create a group under itself', async () => {
    await assertSucceeds(setDoc(doc(as('parish-1'), 'hierarchy/new-mahder'), {
      name: 'Bole Mahedher', level: 'Mahderat', parentId: 'atbiya-bishoftu',
      lat: 8.995, lng: 38.789,
    }));
  });

  it('cannot create a group under a DIFFERENT congregation', async () => {
    await assertFails(setDoc(doc(as('parish-1'), 'hierarchy/sneaky-mahder'), {
      name: 'Not mine', level: 'Mahderat', parentId: 'atbiya-adama',
    }));
  });

  // Otherwise the group permission becomes a way to graft new parishes on.
  it('cannot use the group permission to create a congregation', async () => {
    await assertFails(setDoc(doc(as('parish-1'), 'hierarchy/sneaky-atbiya'), {
      name: 'Mine now', level: 'Atbiya', parentId: 'zone-1',
    }));
  });

  it('a congregation can edit and pin its own group', async () => {
    await assertSucceeds(updateDoc(doc(as('parish-1'), 'hierarchy/mahder-bole'), {
      name: 'Bole Mahedher', lat: 9.01, lng: 38.79,
    }));
  });

  it('cannot re-parent a group to another congregation', async () => {
    await assertFails(updateDoc(doc(as('parish-1'), 'hierarchy/mahder-bole'), {
      parentId: 'atbiya-adama',
    }));
  });

  it('another congregation cannot touch it', async () => {
    await assertFails(updateDoc(doc(as('parish-2'), 'hierarchy/mahder-bole'), { name: 'Hijacked' }));
  });

  it('a member can join a group belonging to their own congregation', async () => {
    await assertSucceeds(updateDoc(doc(as('member-1'), 'users/member-1'), {
      mahderatId: 'mahder-bole',
    }));
  });

  it('a member cannot join another congregation’s group', async () => {
    await assertFails(updateDoc(doc(as('member-1'), 'users/member-1'), {
      mahderatId: 'mahder-adama',
    }));
  });

  // The narrow join rule must not become a general self-edit escape hatch.
  it('the join path cannot smuggle in a role change', async () => {
    await assertFails(updateDoc(doc(as('member-1'), 'users/member-1'), {
      mahderatId: 'mahder-bole', hierarchyLevel: 'Sinodos',
    }));
  });

  it('the join path cannot smuggle in a congregation change', async () => {
    await assertFails(updateDoc(doc(as('member-1'), 'users/member-1'), {
      mahderatId: 'mahder-bole', atbiyaId: 'atbiya-adama',
    }));
  });
});

/**
 * Meetings used to be `read, write: if isActive()`, so any approved member
 * could delete anyone's meeting. Ownership now runs through `createdBy`.
 */
describe('meetings', () => {
  it('an approved member can schedule a meeting in their own name', async () => {
    await assertSucceeds(setDoc(doc(as('parish-1'), 'meetings/mtg-new'), {
      title: 'Parish council', scheduledDate: '2026-09-01T09:00', createdBy: 'parish-1',
    }));
  });

  it('cannot schedule a meeting in somebody else’s name', async () => {
    await assertFails(setDoc(doc(as('parish-1'), 'meetings/mtg-forged'), {
      title: 'Forged', scheduledDate: '2026-09-01T09:00', createdBy: 'admin-1',
    }));
  });

  it('the organiser can edit and delete their own meeting', async () => {
    await assertSucceeds(updateDoc(doc(as('parish-1'), 'meetings/mtg-owned'), { title: 'Moved' }));
    await assertSucceeds(deleteDoc(doc(as('parish-1'), 'meetings/mtg-owned')));
  });

  it('another member cannot edit or delete it', async () => {
    await assertFails(updateDoc(doc(as('parish-2'), 'meetings/mtg-owned'), { title: 'Hijacked' }));
    await assertFails(deleteDoc(doc(as('parish-2'), 'meetings/mtg-owned')));
  });

  it('an admin can still clean up any meeting', async () => {
    await assertSucceeds(deleteDoc(doc(as('admin-1'), 'meetings/mtg-owned')));
  });

  it('every approved member can still read the calendar', async () => {
    await assertSucceeds(getDoc(doc(as('parish-2'), 'meetings/mtg-owned')));
  });
});

describe('membership approval', () => {
  it('the matching parish can approve its own pending request', async () => {
    await assertSucceeds(updateDoc(doc(as('parish-1'), 'users/pending-1'), {
      status: 'active', approvedBy: 'parish-1', approvedAt: '2026-08-01T00:00:00.000Z',
    }));
  });

  it('the matching parish can reject with a reason', async () => {
    await assertSucceeds(updateDoc(doc(as('parish-1'), 'users/pending-1'), {
      status: 'rejected', rejectedBy: 'parish-1', rejectedReason: 'Not known to us',
    }));
  });

  it('a DIFFERENT parish cannot approve it', async () => {
    await assertFails(updateDoc(doc(as('parish-2'), 'users/pending-1'), {
      status: 'active', approvedBy: 'parish-2',
    }));
  });

  it('head office can approve any parish request', async () => {
    await assertSucceeds(updateDoc(doc(as('admin-1'), 'users/pending-1'), {
      status: 'active', approvedBy: 'admin-1',
    }));
  });

  /**
   * A super admin is defined by `siteConfig/superAdmins.uids`, NOT by their
   * role — `super-1` carries the narrowest role there is and belongs to no
   * congregation at all. Their reach has to come from isSuperAdmin() flowing
   * through isAdmin() into both isApprover() and hasGlobalScope(); if either
   * link were broken they could see the queue and not act on it.
   */
  it('a super admin with only a member role can approve any congregation request', async () => {
    await assertSucceeds(updateDoc(doc(as('super-1'), 'users/pending-1'), {
      status: 'active', approvedBy: 'super-1', approvedAt: '2026-08-01T00:00:00.000Z',
    }));
  });

  it('a super admin can reject any congregation request', async () => {
    await assertSucceeds(updateDoc(doc(as('super-1'), 'users/pending-1'), {
      status: 'rejected', rejectedBy: 'super-1', rejectedReason: 'Duplicate account',
    }));
  });

  it('a super admin can list the pending queue across every congregation', async () => {
    await assertSucceeds(getDocs(collection(as('super-1'), 'users')));
  });

  it('the approval path cannot be reused on an already-active account', async () => {
    await assertFails(updateDoc(doc(as('parish-1'), 'users/active-1'), {
      status: 'active', hierarchyLevel: 'Memriya',
    }));
  });

  // Otherwise a parish leader could sign up an account and approve it straight
  // into full administrative control.
  it('an approver cannot approve someone INTO an admin role', async () => {
    await assertFails(updateDoc(doc(as('parish-1'), 'users/pending-1'), {
      status: 'active', hierarchyLevel: 'Sinodos', approvedBy: 'parish-1',
    }));
  });

  it('an approver cannot approve someone into SuperAdmin', async () => {
    await assertFails(updateDoc(doc(as('parish-1'), 'users/pending-1'), {
      status: 'active', role: 'SuperAdmin', approvedBy: 'parish-1',
    }));
  });

  it('an approver CAN approve into an ordinary role', async () => {
    await assertSucceeds(updateDoc(doc(as('parish-1'), 'users/pending-1'), {
      status: 'active', hierarchyLevel: 'EnkesekaseMaikel', approvedBy: 'parish-1',
    }));
  });
});

describe('admins and super admins', () => {
  it('an admin role can write ordinary siteConfig documents', async () => {
    await assertSucceeds(setDoc(doc(as('admin-1'), 'siteConfig/landingPage'), { en: {} }));
  });

  // Used to be `an admin role can write siteConfig`, asserting exactly the hole
  // that let any admin promote itself: siteConfig/roles and siteConfig/superAdmins
  // sat in the same blanket `allow write: if isAdmin()` as the landing page copy.
  it('an admin role CANNOT write the privilege documents', async () => {
    await assertFails(setDoc(doc(as('admin-1'), 'siteConfig/roles'), { version: 2, roles: [] }));
    await assertFails(setDoc(doc(as('admin-1'), 'siteConfig/superAdmins'), { uids: ['admin-1'] }));
    await assertFails(setDoc(doc(as('admin-1'), 'siteConfig/roleFlags'), ROLE_FLAGS));
    await assertFails(setDoc(doc(as('admin-1'), 'siteConfig/rolePermissions'), { Sinodos: [] }));
  });

  it('a super admin listed in siteConfig/superAdmins can write siteConfig', async () => {
    await assertSucceeds(setDoc(doc(as('super-1'), 'siteConfig/roles'), { version: 2, roles: [] }));
  });

  it('a super admin can still appoint another super admin', async () => {
    await assertSucceeds(setDoc(doc(as('super-1'), 'siteConfig/superAdmins'), {
      uids: ['super-1', 'admin-1'],
    }));
  });

  it('an admin can read the audit log; an ordinary user cannot', async () => {
    await assertSucceeds(getDocs(collection(as('admin-1'), 'auditLogs')));
    await assertFails(getDocs(collection(as('active-1'), 'auditLogs')));
  });

  it('audit entries are append-only', async () => {
    await env.withSecurityRulesDisabled(async (ctx) => {
      await setDoc(doc(ctx.firestore(), 'auditLogs/a1'), { userId: 'active-1', action: 'login' });
    });
    await assertFails(updateDoc(doc(as('admin-1'), 'auditLogs/a1'), { action: 'delete' }));
    await assertFails(deleteDoc(doc(as('admin-1'), 'auditLogs/a1')));
  });
});

describe('roleFlags missing — the anti-lockout fallback', () => {
  beforeEach(async () => {
    await env.withSecurityRulesDisabled(async (ctx) => {
      await deleteDoc(doc(ctx.firestore(), 'siteConfig/roleFlags'));
    });
  });

  // Targets the landing page rather than siteConfig/roles: the privilege
  // documents are super-admin-only now, which is a separate boundary from the
  // anti-lockout fallback this block is about.
  it('10. a Sinodos can still write siteConfig via the hardcoded fallback', async () => {
    await assertSucceeds(setDoc(doc(as('admin-1'), 'siteConfig/landingPage'), { en: { hero: 'x' } }));
  });

  it('a super admin still gets in', async () => {
    await assertSucceeds(setDoc(doc(as('super-1'), 'siteConfig/roles'), { version: 3, roles: [] }));
  });

  it('an ordinary active user still cannot', async () => {
    await assertFails(setDoc(doc(as('active-1'), 'siteConfig/roles'), { version: 3, roles: [] }));
  });

  it('legacy accounts still reach application data', async () => {
    await assertSucceeds(getDoc(doc(as('legacy-1'), 'meetings/m1')));
  });

  // ownAtbiyaRoles does not exist in any roleFlags document written before this
  // permission was added, so the fallback is what every existing project runs
  // on until an admin re-saves the role registry.
  // Edits a PUBLIC field. `contact` would now be refused on this document for
  // everyone, including admins — it belongs in atbiyaPrivate.
  it('a parish leader can still edit their own parish', async () => {
    await assertSucceeds(updateDoc(doc(as('parish-1'), 'hierarchy/atbiya-bishoftu'), {
      cityEn: 'Bishoftu Town',
    }));
  });

  it('a parish leader still cannot register a new parish', async () => {
    await assertFails(setDoc(doc(as('parish-1'), 'hierarchy/atbiya-sneaky'), {
      name: 'Sneaky Atbiya', level: 'Atbiya', parentId: 'zone-1',
    }));
  });

  it('an admin can still register a parish', async () => {
    await assertSucceeds(setDoc(doc(as('admin-1'), 'hierarchy/atbiya-new'), {
      name: 'New Atbiya', level: 'Atbiya', parentId: 'zone-1',
    }));
  });
});

describe('parish registry', () => {
  it('an admin can create a parish', async () => {
    await assertSucceeds(setDoc(doc(as('admin-1'), 'hierarchy/atbiya-new'), {
      name: 'New Atbiya', level: 'Atbiya', parentId: 'zone-1',
    }));
  });

  it('a parish leader can edit their own parish record', async () => {
    await assertSucceeds(updateDoc(doc(as('parish-1'), 'hierarchy/atbiya-bishoftu'), {
      cityEn: 'Bishoftu Town',
    }));
  });

  it('a parish leader cannot edit a different parish', async () => {
    await assertFails(updateDoc(doc(as('parish-2'), 'hierarchy/atbiya-bishoftu'), {
      cityEn: 'Hijacked',
    }));
  });

  it('a parish leader cannot move their parish in the tree', async () => {
    await assertFails(updateDoc(doc(as('parish-1'), 'hierarchy/atbiya-bishoftu'), {
      parentId: 'zone-other',
    }));
  });

  it('a parish leader cannot change what kind of entity their parish is', async () => {
    await assertFails(updateDoc(doc(as('parish-1'), 'hierarchy/atbiya-bishoftu'), {
      level: 'Zone',
    }));
  });

  // ── Registering, as opposed to editing ──────────────────────────────────
  it('a canManageAtbiyas holder who is NOT an admin can register a parish', async () => {
    await assertSucceeds(setDoc(doc(as('memriya-1'), 'hierarchy/atbiya-new'), {
      name: 'New Atbiya', level: 'Atbiya', parentId: 'zone-1',
    }));
  });

  it('that same holder cannot graft a non-parish onto the org tree', async () => {
    await assertFails(setDoc(doc(as('memriya-1'), 'hierarchy/zone-new'), {
      name: 'New Zone', level: 'Zone', parentId: null,
    }));
  });

  it('THE POINT OF THE SPLIT — a parish leader cannot register a parish', async () => {
    await assertFails(setDoc(doc(as('parish-1'), 'hierarchy/atbiya-sneaky'), {
      name: 'Sneaky Atbiya', level: 'Atbiya', parentId: 'zone-1',
    }));
  });

  // The three update clauses were folded into one; an admin must still be able
  // to edit the non-parish parts of the tree.
  it('an admin can still edit a Zone', async () => {
    await assertSucceeds(updateDoc(doc(as('admin-1'), 'hierarchy/zone-1'), {
      name: 'Renamed Zone',
    }));
  });

  it('a canManageAtbiyas holder cannot edit a Zone', async () => {
    await assertFails(updateDoc(doc(as('memriya-1'), 'hierarchy/zone-1'), {
      name: 'Renamed Zone',
    }));
  });

  it('an ordinary member can neither register nor edit a parish', async () => {
    await assertFails(setDoc(doc(as('active-1'), 'hierarchy/atbiya-nope'), {
      name: 'Nope', level: 'Atbiya', parentId: null,
    }));
    await assertFails(updateDoc(doc(as('active-1'), 'hierarchy/atbiya-bishoftu'), {
      name: 'Renamed',
    }));
  });
});

/**
 * Deleting a user account.
 *
 * `allow delete` on /users has been in the rules for a while with nothing
 * asserting it either way, and it only became reachable once Software Control
 * grew a permanent-delete action. These pin down who may do it, and the two
 * collateral collections a purge has to reach — the username reservation, which
 * otherwise holds the name forever, and the departed person's notifications,
 * which otherwise become unreachable by everyone.
 */
describe('permanently deleting a user', () => {
  it('an admin may delete a user document', async () => {
    await assertSucceeds(deleteDoc(doc(as('admin-1'), 'users/active-1')));
  });

  it('an ordinary member may not delete anyone, including themselves', async () => {
    await assertFails(deleteDoc(doc(as('active-1'), 'users/active-1')));
  });

  it('a parish role may not delete one of its own members', async () => {
    await assertFails(deleteDoc(doc(as('parish-1'), 'users/active-1')));
  });

  it('an admin may release the username reservation', async () => {
    // Seeded here rather than relying on the shared fixture: an admin passes
    // the delete rule on a NON-existent document too, so without a real row
    // this would pass while proving nothing.
    await env.withSecurityRulesDisabled(async (ctx) => {
      await setDoc(doc(ctx.firestore(), 'usernames/departing'), { uid: 'active-1' });
    });
    await assertSucceeds(deleteDoc(doc(as('admin-1'), 'usernames/departing')));
  });

  it("an admin may delete a departed user's notifications", async () => {
    // Without this the rows strand: isActive() is false for the deleted uid and
    // no other uid matches userId, so nobody could ever remove them.
    await assertSucceeds(deleteDoc(doc(as('admin-1'), 'notifications/n-parish')));
  });

  it('a member still cannot delete somebody else\'s notification', async () => {
    await assertFails(deleteDoc(doc(as('active-1'), 'notifications/n-parish')));
  });
});

describe('notifications are private correspondence', () => {
  it('a user reads their own notification', async () => {
    await assertSucceeds(getDoc(doc(as('active-1'), 'notifications/n-active')));
  });

  it('THE POINT — a user cannot read somebody else\'s', async () => {
    await assertFails(getDoc(doc(as('active-1'), 'notifications/n-parish')));
  });

  it('an owner-scoped list query is allowed', async () => {
    const db = as('active-1');
    await assertSucceeds(
      getDocs(query(collection(db, 'notifications'), where('userId', '==', 'active-1')))
    );
  });

  it('an unfiltered list of everyone\'s notifications is denied', async () => {
    await assertFails(getDocs(collection(as('active-1'), 'notifications')));
  });

  it('listing another user\'s notifications is denied', async () => {
    const db = as('active-1');
    await assertFails(
      getDocs(query(collection(db, 'notifications'), where('userId', '==', 'parish-1')))
    );
  });

  // Broadcasting an announcement, and approving a membership request, both
  // write notifications addressed to other people.
  // Addressing someone else is still allowed — that is what a broadcast and a
  // membership decision both are. The sender fields are now mandatory; see the
  // H6 block for why.
  it('an approved user creates a notification for somebody else', async () => {
    await assertSucceeds(setDoc(doc(as('admin-1'), 'notifications/n-new'), {
      userId: 'active-1', title: 'Broadcast', message: 'hello',
      type: 'info', status: 'unread', createdAt: '2026-08-02T00:00:00.000Z',
      senderId: 'admin-1', senderName: 'admin',
    }));
  });

  it('a pending account cannot create notifications', async () => {
    await assertFails(setDoc(doc(as('pending-1'), 'notifications/n-spam'), {
      userId: 'active-1', title: 'Spam', message: 'hello',
      type: 'info', status: 'unread', createdAt: '2026-08-02T00:00:00.000Z',
    }));
  });

  it('a user marks their own notification read, but not another\'s', async () => {
    await assertSucceeds(updateDoc(doc(as('active-1'), 'notifications/n-active'), { status: 'read' }));
    await assertFails(updateDoc(doc(as('active-1'), 'notifications/n-parish'), { status: 'read' }));
  });

  it('a user deletes their own notification, but not another\'s', async () => {
    await assertSucceeds(deleteDoc(doc(as('active-1'), 'notifications/n-active')));
    await assertFails(deleteDoc(doc(as('active-1'), 'notifications/n-parish')));
  });
});

describe('username → email rows', () => {
  it('a member manager can write the row for an account it just created', async () => {
    // The account has to exist first, carrying the username the row spells —
    // which is the real order of events in atbiyaAdminService.create.
    await env.withSecurityRulesDisabled(async (ctx) => {
      await setDoc(doc(ctx.firestore(), 'users/newadmin-1'), {
        username: 'newadmin', hierarchyLevel: 'Atbiya', role: 'user', status: 'active',
      });
    });
    // No address: the sign-in address is derivable from the name, and a manager
    // has no business asserting one on someone else's behalf.
    await assertSucceeds(setDoc(doc(as('admin-1'), 'usernames/newadmin'), {
      uid: 'newadmin-1',
    }));
  });

  // Note the honest scope of this widening: DEFAULT_ROLE_PERMISSIONS grants
  // canAddMembers to every role, so in practice any APPROVED account is a
  // member manager. What the rule still blocks is everyone who is not approved,
  // plus overwriting a row that already exists (below).
  it('a pending account cannot write a row pointing at someone else', async () => {
    await assertFails(setDoc(doc(as('pending-1'), 'usernames/impostor'), {
      uid: 'admin-1', email: 'attacker@example.com',
    }));
  });

  it('an anonymous visitor cannot write a row at all', async () => {
    await assertFails(setDoc(doc(anon(), 'usernames/impostor'), {
      uid: 'admin-1', email: 'attacker@example.com',
    }));
  });

  it('a member can still write their own row', async () => {
    await assertSucceeds(setDoc(doc(as('active-1'), 'usernames/active'), {
      uid: 'active-1',
    }));
  });

  it('a user deletes their own row when renaming, but not somebody else\'s', async () => {
    await env.withSecurityRulesDisabled(async (ctx) => {
      const db = ctx.firestore();
      await setDoc(doc(db, 'usernames/mine'), { uid: 'active-1', email: 'a@example.com' });
      await setDoc(doc(db, 'usernames/theirs'), { uid: 'parish-1', email: 'p@example.com' });
    });
    await assertSucceeds(deleteDoc(doc(as('active-1'), 'usernames/mine')));
    await assertFails(deleteDoc(doc(as('active-1'), 'usernames/theirs')));
  });

  // Create is widened; overwrite is not. An existing sign-in mapping must not
  // be hijackable by anyone who can create accounts.
  it('a member manager cannot overwrite an existing row', async () => {
    await env.withSecurityRulesDisabled(async (ctx) => {
      await setDoc(doc(ctx.firestore(), 'usernames/taken'), {
        uid: 'active-1', email: 'active@example.com',
      });
    });
    await assertFails(updateDoc(doc(as('parish-1'), 'usernames/taken'), {
      email: 'attacker@example.com',
    }));
  });
});

describe('news authoring', () => {
  it('a parish author can publish a post scoped to their own parish', async () => {
    await assertSucceeds(setDoc(doc(as('parish-1'), 'news/parish-post'), {
      slug: 'parish-post', status: 'published', scope: 'atbiya',
      atbiyaId: 'atbiya-bishoftu', authorId: 'parish-1', title: { en: 'Parish news' },
    }));
  });

  it('a parish author cannot publish a post for a different parish', async () => {
    await assertFails(setDoc(doc(as('parish-1'), 'news/foreign-post'), {
      slug: 'foreign-post', status: 'published', scope: 'atbiya',
      atbiyaId: 'atbiya-adama', authorId: 'parish-1', title: { en: 'Nope' },
    }));
  });

  it('a parish author cannot publish a global post', async () => {
    await assertFails(setDoc(doc(as('parish-1'), 'news/global-post'), {
      slug: 'global-post', status: 'published', scope: 'global',
      atbiyaId: null, authorId: 'parish-1', title: { en: 'Nope' },
    }));
  });

  it('head office can publish a global post', async () => {
    await assertSucceeds(setDoc(doc(as('admin-1'), 'news/hq-post'), {
      slug: 'hq-post', status: 'published', scope: 'global',
      atbiyaId: null, authorId: 'admin-1', title: { en: 'HQ news' },
    }));
  });

  it('a user without canManageNews cannot publish', async () => {
    await assertFails(setDoc(doc(as('active-1'), 'news/nope'), {
      slug: 'nope', status: 'published', scope: 'global',
      atbiyaId: null, authorId: 'active-1', title: { en: 'Nope' },
    }));
  });
});

// ═══════════════════════════════════════════════════════════════════════════
//  Below: the eight findings from the August 2026 audit.
//
//  Each block names the hole it closes, because a rule that looks arbitrary is
//  a rule someone eventually "simplifies" back open.
// ═══════════════════════════════════════════════════════════════════════════

describe('H1 — parish bank accounts are not public', () => {
  it('THE POINT — an anonymous visitor still lists parishes but gets no bank details', async () => {
    const db = anon();
    const snap = await getDocs(
      query(collection(db, 'hierarchy'), where('level', '==', 'Atbiya'))
    );
    // The sign-up dropdown must keep working...
    if (snap.empty) throw new Error('expected the public parish list to be readable');
    // ...while carrying nothing private.
    for (const d of snap.docs) {
      const data = d.data();
      if ('bankAccounts' in data || 'contact' in data) {
        throw new Error(`parish ${d.id} still exposes private fields publicly`);
      }
    }
  });

  it('an anonymous visitor cannot read atbiyaPrivate', async () => {
    await assertFails(getDoc(doc(anon(), 'atbiyaPrivate/atbiya-bishoftu')));
    await assertFails(getDocs(collection(anon(), 'atbiyaPrivate')));
  });

  it('an ordinary member cannot read their own parish\'s bank details', async () => {
    await assertFails(getDoc(doc(as('member-1'), 'atbiyaPrivate/atbiya-bishoftu')));
  });

  it('a parish leader reads and writes their OWN private record', async () => {
    await assertSucceeds(getDoc(doc(as('parish-1'), 'atbiyaPrivate/atbiya-bishoftu')));
    await assertSucceeds(setDoc(doc(as('parish-1'), 'atbiyaPrivate/atbiya-bishoftu'), {
      contact: { phone: '0911999888' },
    }, { merge: true }));
  });

  it('a parish leader cannot touch another parish\'s private record', async () => {
    await assertFails(getDoc(doc(as('parish-1'), 'atbiyaPrivate/atbiya-adama')));
    await assertFails(setDoc(doc(as('parish-1'), 'atbiyaPrivate/atbiya-adama'), {
      contact: { phone: '0000000000' },
    }, { merge: true }));
  });

  it('head office reads every parish\'s private record', async () => {
    await assertSucceeds(getDocs(collection(as('admin-1'), 'atbiyaPrivate')));
    await assertSucceeds(getDoc(doc(as('memriya-1'), 'atbiyaPrivate/atbiya-adama')));
  });

  // This is what protects the migration from a browser tab still running the
  // pre-split bundle, which would otherwise re-publish what was just moved.
  it('nobody can write the private fields back onto the public parish doc', async () => {
    await assertFails(updateDoc(doc(as('parish-1'), 'hierarchy/atbiya-bishoftu'), {
      contact: { phone: '0938714929' },
    }));
    await assertFails(updateDoc(doc(as('admin-1'), 'hierarchy/atbiya-bishoftu'), {
      bankAccounts: [{ bankName: 'CBE', accountNumber: '1' }],
    }));
    await assertFails(setDoc(doc(as('admin-1'), 'hierarchy/atbiya-leaky'), {
      name: 'Leaky', level: 'Atbiya', parentId: 'zone-1',
      contact: { phone: '0911000000' },
    }));
  });

  it('an unrelated edit to an un-migrated parish still works', async () => {
    // `contact` is present on the stored document; the guard must only refuse
    // writes that CHANGE it, or every edit to a legacy parish would be denied.
    await env.withSecurityRulesDisabled(async (ctx) => {
      await setDoc(doc(ctx.firestore(), 'hierarchy/atbiya-legacy'), {
        name: 'Legacy Atbiya', level: 'Atbiya', parentId: 'zone-1',
        contact: { phone: '0911777666' },
      });
    });
    await assertSucceeds(updateDoc(doc(as('admin-1'), 'hierarchy/atbiya-legacy'), {
      cityEn: 'Somewhere',
    }));
  });
});

describe('H2 — username rows cannot be squatted', () => {
  it('THE POINT — a fresh account cannot claim a name that is not its own', async () => {
    // 'parish' is parish-1's username. Without the target check, member-1 could
    // point it at an address they control and break that account's username
    // sign-in permanently — repairUsernameMapping refuses to heal a row owned
    // by another uid, so only an admin could undo it.
    await assertFails(setDoc(doc(as('member-1'), 'usernames/parish'), {
      uid: 'member-1',
    }));
  });

  // An account whose Auth identity is a real inbox has to publish it here or
  // it can never be signed into by name — `resolveEmail` would hand Firebase
  // the synthetic address, which is not its identity. `usernames` is
  // world-readable by `get`, so this is a deliberate trade: guessing a username
  // reveals that person's address. What it must NOT allow is one account
  // publishing ANOTHER's, which is the difference between a known cost and an
  // enumeration hole.
  it('an account CAN publish its own real sign-in address', async () => {
    await assertSucceeds(setDoc(doc(as('member-1', { email: 'member@gmail.com' }), 'usernames/member'), {
      uid: 'member-1', email: 'member@gmail.com',
    }));
  });

  it("a real address that is NOT the writer's own is refused", async () => {
    // The address of somebody else, asserted onto the writer's own row.
    await assertFails(setDoc(doc(as('member-1', { email: 'member@gmail.com' }), 'usernames/member'), {
      uid: 'member-1', email: 'someone.else@gmail.com',
    }));
    // And with no address on the token at all, no real address is publishable.
    await assertFails(setDoc(doc(as('member-1'), 'usernames/member'), {
      uid: 'member-1', email: 'someone@gmail.com',
    }));
  });

  // The member manager creates the account but must not speak for it: the row's
  // address is written by the new account itself, through the secondary app.
  it('a member manager cannot assert an address for the account it creates', async () => {
    await assertFails(setDoc(doc(as('admin-1', { email: 'admin@gmail.com' }), 'usernames/member'), {
      uid: 'member-1', email: 'member@gmail.com',
    }));
  });

  // The whole point, end to end: the sequence userService.createUser performs,
  // then the read authService.resolveEmail makes with nobody signed in. If this
  // passes, a parish administrator can be signed in by NAME and not only by
  // address — which is what was broken.
  it('a typed username resolves to the real sign-in address, anonymously', async () => {
    const REAL = 'yohannes@gmail.com';

    // 1. the member manager writes the profile (primary app, as the admin)
    await env.withSecurityRulesDisabled(async (ctx) => {
      await setDoc(doc(ctx.firestore(), 'users/yohannes-1'), {
        username: 'yohannes', hierarchyLevel: 'Atbiya', role: 'user', status: 'active',
      });
    });

    // 2. the new account publishes its OWN address (secondary app, as itself)
    await assertSucceeds(setDoc(doc(as('yohannes-1', { email: REAL }), 'usernames/yohannes'), {
      uid: 'yohannes-1', email: REAL,
    }));

    // 3. the login screen resolves the name before anyone is signed in
    const snap = await getDoc(doc(anon(), 'usernames/yohannes'));
    expect(snap.exists()).toBe(true);
    expect(snap.data()?.email).toBe(REAL);
  });

  it('a synthetic address belonging to ANOTHER account is refused', async () => {
    await assertFails(setDoc(doc(as('member-1'), 'usernames/member'), {
      uid: 'member-1', email: emailFor('parish-1'),
    }));
  });

  // Load-bearing for renames: after one, the account's sign-in address still
  // spells the OLD username, so the row has to carry it. It encodes a username
  // that is already this document's key, so it publishes nothing new.
  it('a synthetic address IS allowed, so renames keep working', async () => {
    await assertSucceeds(setDoc(doc(as('member-1'), 'usernames/member'), {
      uid: 'member-1', email: emailFor('member-1'),
    }));
  });

  it('a row cannot point at a uid with no user document', async () => {
    await assertFails(setDoc(doc(as('member-1'), 'usernames/ghost'), {
      uid: 'no-such-user',
    }));
  });

  it('extra fields are refused', async () => {
    await assertFails(setDoc(doc(as('member-1'), 'usernames/member'), {
      uid: 'member-1', role: 'SuperAdmin',
    }));
  });

  it('a member CAN write the row matching their own stored username', async () => {
    await assertSucceeds(setDoc(doc(as('member-1'), 'usernames/member'), {
      uid: 'member-1',
    }));
  });

  // changeUsername updates the profile first for exactly this reason.
  it('a rename works once the profile carries the new name', async () => {
    await assertFails(setDoc(doc(as('member-1'), 'usernames/renamed'), {
      uid: 'member-1',
    }));
    await assertSucceeds(updateDoc(doc(as('member-1'), 'users/member-1'), {
      username: 'renamed',
    }));
    await assertSucceeds(setDoc(doc(as('member-1'), 'usernames/renamed'), {
      uid: 'member-1', email: emailFor('member-1'),
    }));
  });
});

describe('H4 — the member directory is scoped to a congregation', () => {
  it('THE POINT — a parish role cannot enumerate the whole organisation', async () => {
    await assertFails(getDocs(collection(as('parish-1'), 'users')));
  });

  it('a parish role CAN list its own congregation', async () => {
    await assertSucceeds(getDocs(
      query(collection(as('parish-1'), 'users'), where('atbiyaId', '==', 'atbiya-bishoftu'))
    ));
  });

  it('a parish role cannot list a DIFFERENT congregation', async () => {
    await assertFails(getDocs(
      query(collection(as('parish-1'), 'users'), where('atbiyaId', '==', 'atbiya-adama'))
    ));
  });

  it('a parish role cannot read an individual member of another congregation', async () => {
    await assertFails(getDoc(doc(as('parish-1'), 'users/parish-2')));
  });

  it('a parish role CAN read a member of its own congregation', async () => {
    await assertSucceeds(getDoc(doc(as('parish-1'), 'users/member-1')));
  });

  it('head office still lists everyone', async () => {
    await assertSucceeds(getDocs(collection(as('admin-1'), 'users')));
    await assertSucceeds(getDocs(collection(as('memriya-1'), 'users')));
  });

  // A diocese's members are the members of the congregations under it, and
  // users/{uid} carries no diocese id — so rules cannot express "in my diocese".
  // Narrowing these roles too needs that field first.
  it('a diocese role still lists everyone, deliberately', async () => {
    await assertSucceeds(getDocs(collection(as('active-1'), 'users')));
  });

  it('everyone can still read their own record', async () => {
    await assertSucceeds(getDoc(doc(as('member-1'), 'users/member-1')));
  });
});

describe('H5 — finance, HR and inventory are not open to every member', () => {
  beforeEach(async () => {
    await env.withSecurityRulesDisabled(async (ctx) => {
      const db = ctx.firestore();
      await setDoc(doc(db, 'finance_transactions/t1'), { amount: 500, type: 'Tithe' });
      await setDoc(doc(db, 'employees/e1'), { fullName: 'Abebe Kebede', salary: 12000 });
      await setDoc(doc(db, 'assets/a1'), { name: 'Projector', value: 30000 });
      await setDoc(doc(db, 'documents/d1'), { title: 'Minutes' });
      await setDoc(doc(db, 'plans/p1'), { title: 'Q3 plan' });
      await setDoc(doc(db, 'announcements/an1'), { title: 'Notice' });
      await setDoc(doc(db, 'teachings/te1'), { title: 'Sermon' });
    });
  });

  it('THE POINT — an ordinary member cannot read the employee roster', async () => {
    await assertFails(getDoc(doc(as('member-1'), 'employees/e1')));
    await assertFails(getDocs(collection(as('member-1'), 'employees')));
  });

  it('an ordinary member cannot DELETE the church books', async () => {
    await assertFails(deleteDoc(doc(as('member-1'), 'finance_transactions/t1')));
    await assertFails(deleteDoc(doc(as('member-1'), 'employees/e1')));
    await assertFails(deleteDoc(doc(as('member-1'), 'assets/a1')));
  });

  it('an ordinary member cannot read or write finance at all', async () => {
    await assertFails(getDoc(doc(as('member-1'), 'finance_transactions/t1')));
    await assertFails(setDoc(doc(as('member-1'), 'finance_transactions/t2'), { amount: 1 }));
  });

  it('an ordinary member cannot alter plans, announcements or teachings', async () => {
    await assertFails(updateDoc(doc(as('member-1'), 'plans/p1'), { title: 'Hijacked' }));
    await assertFails(deleteDoc(doc(as('member-1'), 'announcements/an1')));
    await assertFails(deleteDoc(doc(as('member-1'), 'teachings/te1')));
  });

  it('an ordinary member can still READ what the membership is meant to see', async () => {
    await assertSucceeds(getDoc(doc(as('member-1'), 'plans/p1')));
    await assertSucceeds(getDoc(doc(as('member-1'), 'announcements/an1')));
    await assertSucceeds(getDoc(doc(as('member-1'), 'teachings/te1')));
  });

  it('a parish role holding the finance permissions can use finance', async () => {
    await assertSucceeds(getDoc(doc(as('parish-1'), 'finance_transactions/t1')));
    await assertSucceeds(setDoc(doc(as('parish-1'), 'finance_transactions/t2'), { amount: 250 }));
  });

  it('a parish role can use HR and inventory', async () => {
    await assertSucceeds(getDoc(doc(as('parish-1'), 'employees/e1')));
    await assertSucceeds(setDoc(doc(as('parish-1'), 'assets/a2'), { name: 'Chairs' }));
  });

  it('only announcement-writing roles may post an announcement', async () => {
    await assertSucceeds(setDoc(doc(as('memriya-1'), 'announcements/an2'), { title: 'HQ notice' }));
    // Atbiya holds no canCreateAnnouncement in DEFAULT_ROLE_PERMISSIONS.
    await assertFails(setDoc(doc(as('parish-1'), 'announcements/an3'), { title: 'Parish notice' }));
  });

  it('partner enquiries are append-only and admin-read', async () => {
    await assertSucceeds(setDoc(doc(as('member-1'), 'partner_contacts/pc1'), {
      name: 'Enquirer', message: 'Hello',
    }));
    await assertFails(getDoc(doc(as('member-1'), 'partner_contacts/pc1')));
    await assertSucceeds(getDoc(doc(as('admin-1'), 'partner_contacts/pc1')));
  });

  it('a missionary application can be filed by anyone but amended only by an admin', async () => {
    await assertSucceeds(setDoc(doc(as('member-1'), 'missionary_applications/ma1'), {
      applicantId: 'member-1', status: 'submitted',
    }));
    await assertFails(updateDoc(doc(as('member-1'), 'missionary_applications/ma1'), {
      status: 'approved',
    }));
    await assertSucceeds(updateDoc(doc(as('admin-1'), 'missionary_applications/ma1'), {
      status: 'approved',
    }));
  });

  // The fallbacks are what a project runs on until an admin re-saves Software
  // Control, so they have to TIGHTEN rather than open.
  describe('with roleFlags absent', () => {
    beforeEach(async () => {
      await env.withSecurityRulesDisabled(async (ctx) => {
        await deleteDoc(doc(ctx.firestore(), 'siteConfig/roleFlags'));
      });
    });

    it('an ordinary member is still refused HR, finance and inventory', async () => {
      await assertFails(getDoc(doc(as('member-1'), 'employees/e1')));
      await assertFails(getDoc(doc(as('member-1'), 'finance_transactions/t1')));
      await assertFails(deleteDoc(doc(as('member-1'), 'assets/a1')));
    });

    it('a parish role still reaches finance, HR and inventory', async () => {
      await assertSucceeds(getDoc(doc(as('parish-1'), 'finance_transactions/t1')));
      await assertSucceeds(getDoc(doc(as('parish-1'), 'employees/e1')));
      await assertSucceeds(getDoc(doc(as('parish-1'), 'assets/a1')));
    });

    it('an admin still reaches everything', async () => {
      await assertSucceeds(getDoc(doc(as('admin-1'), 'employees/e1')));
      await assertSucceeds(setDoc(doc(as('admin-1'), 'finance_transactions/t3'), { amount: 9 }));
    });
  });
});

describe('H6 — the notification sender cannot be forged', () => {
  const base = {
    userId: 'member-1', title: 'Notice', message: 'Body',
    type: 'info', status: 'unread', createdAt: '2026-08-11T00:00:00.000Z',
  };

  it('THE POINT — the sender name cannot be a role the caller is not', async () => {
    await assertFails(setDoc(doc(as('member-1'), 'notifications/spoof'), {
      ...base, senderId: 'member-1', senderName: 'ሲኖዶስ ዘአኀው',
      link: '/phishing',
    }));
  });

  it('the sender id cannot be somebody else', async () => {
    await assertFails(setDoc(doc(as('member-1'), 'notifications/spoof2'), {
      ...base, senderId: 'admin-1', senderName: 'admin',
    }));
  });

  it('a notification with no sender at all is refused', async () => {
    await assertFails(setDoc(doc(as('member-1'), 'notifications/nosender'), base));
  });

  it('an approved member CAN send under their own stored name', async () => {
    await assertSucceeds(setDoc(doc(as('member-1'), 'notifications/ok'), {
      ...base, userId: 'parish-1', senderId: 'member-1', senderName: 'member',
    }));
  });

  it('an unattributed notification is allowed', async () => {
    await assertSucceeds(setDoc(doc(as('member-1'), 'notifications/anon'), {
      ...base, userId: 'parish-1', senderId: 'member-1', senderName: '',
    }));
  });

  it('extra fields are refused', async () => {
    await assertFails(setDoc(doc(as('member-1'), 'notifications/extra'), {
      ...base, senderId: 'member-1', senderName: 'member', isAdminBroadcast: true,
    }));
  });

  it('a pending account still cannot send at all', async () => {
    await assertFails(setDoc(doc(as('pending-1'), 'notifications/nope'), {
      ...base, senderId: 'pending-1', senderName: 'pending',
    }));
  });
});

describe('H7 — suspension revokes a super admin', () => {
  beforeEach(async () => {
    await env.withSecurityRulesDisabled(async (ctx) => {
      const db = ctx.firestore();
      // Super admin by the `role` FIELD, suspended.
      await setDoc(doc(db, 'users/super-field'), {
        username: 'superfield', hierarchyLevel: 'HiyawanMahderat',
        role: 'SuperAdmin', status: 'suspended',
      });
      // Super admin by the UID LIST, suspended — the break-glass path.
      await setDoc(doc(db, 'users/super-listed'), {
        username: 'superlisted', hierarchyLevel: 'HiyawanMahderat',
        role: 'user', status: 'suspended',
      });
      await setDoc(doc(db, 'siteConfig/superAdmins'), { uids: ['super-1', 'super-listed'] });
      await setDoc(doc(db, 'users/admin-suspended'), {
        username: 'adminsus', hierarchyLevel: 'Sinodos', role: 'user', status: 'suspended',
      });
    });
  });

  it('THE POINT — a suspended role:SuperAdmin loses everything', async () => {
    await assertFails(setDoc(doc(as('super-field'), 'siteConfig/roles'), { version: 9, roles: [] }));
    await assertFails(getDocs(collection(as('super-field'), 'users')));
    await assertFails(getDoc(doc(as('super-field'), 'employees/e-none')));
  });

  it('a suspended admin role loses everything too', async () => {
    await assertFails(setDoc(doc(as('admin-suspended'), 'siteConfig/landingPage'), { en: {} }));
    await assertFails(getDocs(collection(as('admin-suspended'), 'users')));
  });

  // Kept on purpose: a corrupted status field must not make the project
  // unrecoverable from inside the app.
  it('the uid-list escape hatch still survives suspension', async () => {
    await assertSucceeds(setDoc(doc(as('super-listed'), 'siteConfig/roles'), {
      version: 9, roles: [],
    }));
  });
});

describe('M1 — collections that had no rules at all', () => {
  // finance_tithes, finance_pledges and report_backs were written by
  // services/finance.ts and services/reportBacks.ts but had no `match` block, so
  // Firestore default-denied every read and write. The getters swallow the error
  // and return [], so the Tithes and Pledges tabs looked empty rather than
  // forbidden, and the create paths threw. None of it has ever worked.
  beforeEach(async () => {
    await env.withSecurityRulesDisabled(async (ctx) => {
      const db = ctx.firestore();
      await setDoc(doc(db, 'finance_tithes/t1'), { memberName: 'Abebe', amount: 500 });
      await setDoc(doc(db, 'finance_pledges/p1'), { memberName: 'Abebe', pledgedAmount: 5000 });
      await setDoc(doc(db, 'report_backs/rb1'), { reportId: 'r1', content: 'Noted' });
    });
  });

  it('a finance role can now read and write tithes and pledges', async () => {
    await assertSucceeds(getDoc(doc(as('parish-1'), 'finance_tithes/t1')));
    await assertSucceeds(setDoc(doc(as('parish-1'), 'finance_tithes/t2'), { amount: 250 }));
    await assertSucceeds(getDoc(doc(as('parish-1'), 'finance_pledges/p1')));
    await assertSucceeds(setDoc(doc(as('parish-1'), 'finance_pledges/p2'), { pledgedAmount: 100 }));
  });

  it('an ordinary member cannot', async () => {
    await assertFails(getDoc(doc(as('member-1'), 'finance_tithes/t1')));
    await assertFails(setDoc(doc(as('member-1'), 'finance_tithes/t3'), { amount: 1 }));
    await assertFails(getDoc(doc(as('member-1'), 'finance_pledges/p1')));
    await assertFails(deleteDoc(doc(as('member-1'), 'finance_pledges/p1')));
  });

  it('anonymous visitors cannot touch the church books', async () => {
    await assertFails(getDoc(doc(anon(), 'finance_tithes/t1')));
    await assertFails(getDoc(doc(anon(), 'finance_pledges/p1')));
    await assertFails(getDoc(doc(anon(), 'report_backs/rb1')));
  });

  it('report-backs follow the report gate: all approved members read, staff write', async () => {
    await assertSucceeds(getDoc(doc(as('member-1'), 'report_backs/rb1')));
    await assertFails(setDoc(doc(as('member-1'), 'report_backs/rb2'), { content: 'Nope' }));
    await assertSucceeds(setDoc(doc(as('parish-1'), 'report_backs/rb3'), { content: 'Filed' }));
  });

  it('the fallbacks hold when roleFlags is absent', async () => {
    await env.withSecurityRulesDisabled(async (ctx) => {
      await deleteDoc(doc(ctx.firestore(), 'siteConfig/roleFlags'));
    });
    await assertSucceeds(getDoc(doc(as('parish-1'), 'finance_tithes/t1')));
    await assertFails(getDoc(doc(as('member-1'), 'finance_tithes/t1')));
  });
});

describe('M2/M3/M8 — audit integrity and config reads', () => {
  // `userId == request.auth.uid` used to be the ONLY check, so anyone could
  // append plausible entries — "Approved membership request" under their own
  // name — to the trail an administrator reads to reconstruct what happened.
  const entry = (over: Record<string, unknown> = {}) => ({
    userId: 'member-1',
    userName: 'member',
    action: 'update',
    targetType: 'users',
    targetId: 'someone',
    description: 'Approved membership request',
    platform: 'web',
    device: 'Chrome · macOS',
    createdAt: new Date(),
    ...over,
  });

  it('an entry cannot be backdated to hide among real ones', async () => {
    await assertFails(setDoc(doc(as('member-1'), 'auditLogs/backdated'), entry({
      createdAt: new Date('2020-01-01T00:00:00.000Z'),
    })));
  });

  it('an invented action is refused', async () => {
    await assertFails(setDoc(doc(as('member-1'), 'auditLogs/bogus'), entry({
      action: 'approve-everything',
    })));
  });

  it('extra fields are refused', async () => {
    await assertFails(setDoc(doc(as('member-1'), 'auditLogs/extra'), entry({
      severity: 'none',
    })));
  });

  it('an entry still cannot be attributed to somebody else', async () => {
    await assertFails(setDoc(doc(as('member-1'), 'auditLogs/spoof'), entry({
      userId: 'admin-1',
    })));
  });

  it('mobileAudit cannot claim a role the account does not hold', async () => {
    await assertFails(setDoc(doc(as('member-1'), 'mobileAudit/member-1'), {
      displayName: 'Member', hierarchyLevel: 'Sinodos', platform: 'android',
    }));
  });

  it('mobileAudit cannot claim an address the account does not own', async () => {
    await assertFails(setDoc(doc(as('member-1'), 'mobileAudit/member-1'), {
      displayName: 'Member', email: 'someone.else@example.org', platform: 'android',
    }));
  });

  it('mobileAudit accepts the account\'s own details', async () => {
    await assertSucceeds(setDoc(doc(as('member-1'), 'mobileAudit/member-1'), {
      displayName: 'Member',
      hierarchyLevel: 'HiyawanMahderat',
      email: emailFor('member-1'),
      platform: 'android',
      appVersion: '1.0.0',
      lastSeen: '2026-08-12T00:00:00.000Z',
    }));
  });

  // M8 — siteConfig is public by default because the login and sign-up pages
  // resolve role labels before anyone has an account. Two documents are not.
  it('an anonymous visitor still reads the public config', async () => {
    await assertSucceeds(getDoc(doc(anon(), 'siteConfig/landingPage')));
    await assertSucceeds(getDoc(doc(anon(), 'siteConfig/roles')));
    await assertSucceeds(getDoc(doc(anon(), 'siteConfig/roleFlags')));
  });

  it('THE POINT — the super-admin uid list is not public', async () => {
    await assertFails(getDoc(doc(anon(), 'siteConfig/superAdmins')));
    await assertFails(getDoc(doc(as('member-1'), 'siteConfig/superAdmins')));
    await assertSucceeds(getDoc(doc(as('admin-1'), 'siteConfig/superAdmins')));
    // A uid-list super admin whose role is otherwise ordinary can still read it,
    // which is what lets the client work out that it IS one.
    await assertSucceeds(getDoc(doc(as('super-1'), 'siteConfig/superAdmins')));
  });

  it('per-user permission overrides are not public', async () => {
    await env.withSecurityRulesDisabled(async (ctx) => {
      await setDoc(doc(ctx.firestore(), 'siteConfig/userPermissionOverrides'), {
        'member-1': { canViewFinance: true },
      });
    });
    await assertFails(getDoc(doc(anon(), 'siteConfig/userPermissionOverrides')));
    // Signed-in is as narrow as this can get while the document remains one map
    // keyed by uid — each user genuinely needs their own entry resolved.
    await assertSucceeds(getDoc(doc(as('member-1'), 'siteConfig/userPermissionOverrides')));
  });
});

describe('parish map pins', () => {
  // Congregation coordinates live in atbiyaPrivate, not on the publicly-readable
  // /hierarchy record. `mapUrl` already hints at where a parish is, but a precise
  // pin for every congregation in the country is a different kind of dataset and
  // is wanted only for internal mapping.
  it('THE POINT — a pin cannot be written onto the public parish record', async () => {
    await assertFails(updateDoc(doc(as('admin-1'), 'hierarchy/atbiya-bishoftu'), {
      lat: 8.7521, lng: 38.9789,
    }));
    await assertFails(updateDoc(doc(as('memriya-1'), 'hierarchy/atbiya-bishoftu'), {
      lat: 8.7521, lng: 38.9789,
    }));
    await assertFails(updateDoc(doc(as('parish-1'), 'hierarchy/atbiya-bishoftu'), {
      lat: 8.7521, lng: 38.9789,
    }));
  });

  it('nor smuggled in when the parish is first registered', async () => {
    await assertFails(setDoc(doc(as('admin-1'), 'hierarchy/atbiya-pinned'), {
      name: 'Pinned Atbiya', level: 'Atbiya', parentId: 'zone-1',
      lat: 9.01, lng: 38.76,
    }));
  });

  // THE REGRESSION THIS DESIGN RISKS. Mahedherat are also /hierarchy documents
  // and store their meeting place as top-level lat/lng — legitimately, because a
  // member choosing between groups has to see where each one meets. The guard is
  // scoped to level == 'Atbiya' precisely so this keeps working.
  it('a Mahedher can still be pinned on its own public record', async () => {
    await assertSucceeds(updateDoc(doc(as('parish-1'), 'hierarchy/mahder-bole'), {
      lat: 8.9950, lng: 38.7890,
    }));
    await assertSucceeds(setDoc(doc(as('parish-1'), 'hierarchy/mahder-new'), {
      name: 'New Mahedher', level: 'Mahderat', parentId: 'atbiya-bishoftu',
      lat: 9.01, lng: 38.76,
    }));
  });

  it('head office and admins can write a pin to atbiyaPrivate', async () => {
    await assertSucceeds(setDoc(doc(as('admin-1'), 'atbiyaPrivate/atbiya-bishoftu'), {
      lat: 8.7521, lng: 38.9789,
    }, { merge: true }));
    await assertSucceeds(setDoc(doc(as('memriya-1'), 'atbiyaPrivate/atbiya-adama'), {
      lat: 8.54, lng: 39.27,
    }, { merge: true }));
  });

  it('a congregation can pin ITSELF but not another', async () => {
    await assertSucceeds(setDoc(doc(as('parish-1'), 'atbiyaPrivate/atbiya-bishoftu'), {
      lat: 8.7521, lng: 38.9789,
    }, { merge: true }));
    await assertFails(setDoc(doc(as('parish-1'), 'atbiyaPrivate/atbiya-adama'), {
      lat: 8.54, lng: 39.27,
    }, { merge: true }));
  });

  it('an ordinary member and an anonymous visitor can read no pins at all', async () => {
    await assertFails(getDoc(doc(as('member-1'), 'atbiyaPrivate/atbiya-bishoftu')));
    await assertFails(getDocs(collection(as('member-1'), 'atbiyaPrivate')));
    await assertFails(getDoc(doc(anon(), 'atbiyaPrivate/atbiya-bishoftu')));
  });

  it('the public parish list still carries no coordinates', async () => {
    const snap = await getDocs(
      query(collection(anon(), 'hierarchy'), where('level', '==', 'Atbiya'))
    );
    for (const d of snap.docs) {
      const data = d.data();
      if ('lat' in data || 'lng' in data) {
        throw new Error(`parish ${d.id} exposes coordinates publicly`);
      }
    }
  });

  // Unrelated edits to a parish must keep working — the guard refuses writes that
  // TOUCH the private keys, not every write to a document that has them.
  it('an ordinary parish edit is unaffected', async () => {
    await assertSucceeds(updateDoc(doc(as('parish-1'), 'hierarchy/atbiya-bishoftu'), {
      cityEn: 'Bishoftu Town',
    }));
  });
});
