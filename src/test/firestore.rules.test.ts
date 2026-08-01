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
  atbiyaManagerRoles: ['Atbiya'],
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
      port: 8080,
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

    // ── Parishes ──────────────────────────────────────────────────────────
    await setDoc(doc(db, 'hierarchy/atbiya-bishoftu'), {
      name: 'Bishoftu Atbiya', nameAmharic: 'ቢሾፍቱ አጥቢያ', level: 'Atbiya',
      parentId: 'zone-1', active: true, isPublic: true,
    });
    await setDoc(doc(db, 'hierarchy/zone-1'), {
      name: 'Central Zone', level: 'Zone', parentId: null,
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
    await setDoc(doc(db, 'siteConfig/landingPage'), { en: {} });
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
    await assertSucceeds(setDoc(doc(as('legacy-1'), 'meetings/m2'), { title: 'New' }));
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
