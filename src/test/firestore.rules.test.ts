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
import { beforeAll, afterAll, beforeEach, describe, it } from 'vitest';
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
});

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
    await setDoc(doc(db, 'hierarchy/atbiya-bishoftu'), {
      name: 'Bishoftu Atbiya', nameAmharic: 'ቢሾፍቱ አጥቢያ', level: 'Atbiya',
      parentId: 'zone-1', active: true, isPublic: true,
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
});

const anon = () => env.unauthenticatedContext().firestore();
const as = (uid: string) => env.authenticatedContext(uid).firestore();

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
                      'rolePermissions', 'userPermissionOverrides', 'superAdmins',
                      'softwareControl', 'moduleConfig']) {
      await assertSucceeds(getDoc(doc(anon(), `siteConfig/${id}`)));
    }
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
  it('an admin role can write siteConfig', async () => {
    await assertSucceeds(setDoc(doc(as('admin-1'), 'siteConfig/roles'), { version: 2, roles: [] }));
  });

  it('a super admin listed in siteConfig/superAdmins can write siteConfig', async () => {
    await assertSucceeds(setDoc(doc(as('super-1'), 'siteConfig/roles'), { version: 2, roles: [] }));
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

  it('10. a Sinodos can still write siteConfig via the hardcoded fallback', async () => {
    await assertSucceeds(setDoc(doc(as('admin-1'), 'siteConfig/roles'), { version: 3, roles: [] }));
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
  it('a parish leader can still edit their own parish', async () => {
    await assertSucceeds(updateDoc(doc(as('parish-1'), 'hierarchy/atbiya-bishoftu'), {
      contact: { phone: '0938714929' },
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
      contact: { phone: '0938714929' },
    }));
  });

  it('a parish leader cannot edit a different parish', async () => {
    await assertFails(updateDoc(doc(as('parish-2'), 'hierarchy/atbiya-bishoftu'), {
      contact: { phone: '0000000000' },
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
  it('an approved user creates a notification for somebody else', async () => {
    await assertSucceeds(setDoc(doc(as('admin-1'), 'notifications/n-new'), {
      userId: 'active-1', title: 'Broadcast', message: 'hello',
      type: 'info', status: 'unread', createdAt: '2026-08-02T00:00:00.000Z',
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
    await assertSucceeds(setDoc(doc(as('admin-1'), 'usernames/newadmin'), {
      uid: 'some-other-uid', email: 'newadmin@example.com',
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
      uid: 'active-1', email: 'active@example.com',
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
