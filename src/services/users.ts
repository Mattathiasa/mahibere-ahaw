import { db } from '@/lib/firebase';
import { AppError } from '@/lib/appError';
import { auditLogService } from '@/services/auditLog';
import {
  collection,
  getDocs,
  doc,
  getDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  addDoc,
  serverTimestamp,
  getFirestore
} from 'firebase/firestore';
import { initializeApp, deleteApp } from 'firebase/app';
import { getAuth, createUserWithEmailAndPassword } from 'firebase/auth';
import { firebaseConfig } from '@/lib/firebase';
import { syntheticEmail, isSyntheticEmail } from '@/services/signup';
import { permissionService } from '@/services/permissionService';
import { roleRegistryService } from '@/services/roleRegistry';
import { auth } from '@/lib/firebase';

export interface CreateUserData {
  email: string;
  fullName: string;
  phone: string;
  address: {
    region: string;
    zone: string;
    woreda: string;
  };
  dateOfBirth: string;
  gender: 'Male' | 'Female';
  ministryType: string;
  hierarchyLevel: string;
  hierarchyEntityId: string;
}

export const userService = {
  /**
   * The whole directory, unfiltered.
   *
   * Firestore now allows this ONLY for a caller with global scope — every admin
   * role, plus any role whose scope is 'global'. A parish-scoped caller gets
   * permission-denied, by design: this used to be readable by anyone holding
   * canViewMembers, which includes parish-level roles, so a single parish
   * officer could enumerate every member in the organisation along with their
   * phone number, date of birth, address and home coordinates.
   *
   * Prefer `getUsersInScope` anywhere the caller might not be head office.
   */
  async getAllUsers() {
    const querySnapshot = await getDocs(collection(db, 'users'));
    const users = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    return { users };
  },

  /**
   * The directory a caller is actually entitled to see.
   *
   * Head office and diocese roles read it all; everyone else reads their own
   * congregation, which is the `where('atbiyaId','==',…)` equality filter the
   * list rule needs in order to prove the query. A caller with neither wide
   * scope nor a parish sees nobody — they have no directory to read.
   *
   * Pass `canReadWholeDirectory` and `myAtbiyaId` straight from
   * `usePermissions()`; they mirror `hasWideDirectoryScope()` in the rules.
   *
   * Sorts in memory rather than with `orderBy('fullNameEnglish')`, which would
   * silently drop every member whose record predates that field.
   */
  async getUsersInScope(scope: { wholeDirectory: boolean; atbiyaId?: string }) {
    if (scope.wholeDirectory) return this.getAllUsers();
    if (!scope.atbiyaId) return { users: [] as Array<{ id: string }> };

    const snapshot = await getDocs(
      query(collection(db, 'users'), where('atbiyaId', '==', scope.atbiyaId))
    );
    const users = snapshot.docs
      .map(d => ({ id: d.id, ...d.data() }))
      .sort((a: any, b: any) =>
        (a.fullNameEnglish ?? a.fullName ?? '').localeCompare(b.fullNameEnglish ?? b.fullName ?? '')
      );
    return { users };
  },

  async createUser(userData: any) {
    const secondaryApp = initializeApp(firebaseConfig, `SecondaryApp-${Date.now()}`);
    const secondaryAuth = getAuth(secondaryApp);

    try {
      const username = userData.username || `user${Date.now()}`;
      const password = userData.password;

      if (!password) {
        throw new AppError('passwordRequired');
      }

      // The SIGN-IN address. A real inbox is used when one was supplied,
      // because it is the only way Firebase's own password reset can ever reach
      // this person: the project is on Spark, so there is no Admin SDK to set a
      // password server-side, and sendPasswordReset refuses a synthetic address
      // outright. Without a real address we keep the derived synthetic one, so
      // accounts with no inbox still sign in by username exactly as before.
      //
      // The real address deliberately does NOT go into `usernames/{name}`: that
      // document is world-readable and publishing personal emails there is the
      // enumeration leak firestore.rules exists to refuse. The trade is that an
      // account created WITH an email signs in with that email rather than its
      // username — which is precisely what authService.login's
      // 'wrongPasswordTryEmail' message already tells anyone who tries.
      const contactEmail = (userData.email ?? '').trim();
      const hasRealInbox = !!contactEmail && !isSyntheticEmail(contactEmail);
      const loginEmail = hasRealInbox ? contactEmail.toLowerCase() : syntheticEmail(username);
      const userCredential = await createUserWithEmailAndPassword(secondaryAuth, loginEmail, password);
      const id = userCredential.user.uid;

      const dataToSave = {
        ...userData,
        // Contact address. Equal to the sign-in address whenever a real inbox
        // was supplied; otherwise the account signs in as `loginEmail` above.
        email: contactEmail,
        username,
        // Written for every account, not only the wizard's. getUsersByAtbiya
        // orders by this field and Firestore omits documents that lack it, so
        // an account without it disappears from the parish roster, the
        // promote-to-administrator picker and meeting audiences.
        fullNameEnglish: userData.fullNameEnglish || userData.fullName || '',
        role: userData.role || 'user',
        // Admin-created accounts are usable immediately — only self-service
        // sign-ups go through the parish approval queue.
        status: userData.status || 'active',
        signupSource: userData.signupSource || 'admin',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };

      delete dataToSave.password;

      await setDoc(doc(db, 'users', id), dataToSave);

      // Reserves the name so a later sign-up cannot claim it, and — when the
      // account signs in with a real inbox — records WHICH address that is, so
      // `authService.resolveEmail` can turn the typed username back into it.
      // Without the address the name resolves to the synthetic form, which is
      // not this account's Auth identity, and sign-in by username fails.
      //
      // Written through the SECONDARY app, which is signed in as the account
      // just created: the rules accept an address on this row only from the
      // account that owns it, so the member manager doing the creating cannot
      // assert it — and has no business asserting one on someone else's behalf.
      //
      // Best-effort. Without the row a synthetic account still resolves
      // deterministically; a real-inbox account signs in by email and heals the
      // row itself on the way through `authService.login`.
      try {
        const secondaryDb = getFirestore(secondaryApp);
        await setDoc(doc(secondaryDb, 'usernames', username.toLowerCase()), {
          uid: id,
          ...(hasRealInbox ? { email: loginEmail } : {}),
          createdAt: serverTimestamp(),
        });
      } catch { /* non-fatal */ }

      await deleteApp(secondaryApp);

      return { id, ...dataToSave };
    } catch (error) {
      await deleteApp(secondaryApp);
      console.error("Error creating user auth:", error);
      throw error;
    }
  },

  async updateUser(id: string, userData: any) {
    const userRef = doc(db, 'users', id);
    await updateDoc(userRef, {
      ...userData,
      updatedAt: serverTimestamp(),
    });
  },

  /**
   * Suspends an account rather than deleting the document.
   *
   * A hard delete removed only the Firestore record — the Firebase Auth
   * account survived and could still sign in, and login treated the missing
   * document as a default Atbiya-level user. Suspension is now enforced by
   * `isActive()` in firestore.rules, so it actually revokes access.
   */
  async deleteUser(id: string) {
    await updateDoc(doc(db, 'users', id), {
      status: 'suspended',
      updatedAt: serverTimestamp(),
    });
    auditLogService.dataChange('delete', 'users', id, 'Suspended user account');
  },

  /**
   * What a purge would leave behind, so the confirmation can show it.
   *
   * Three cheap reads, run only when somebody opens the dialog. The point is to
   * make a real member with history look obviously different from a throwaway
   * `user1738…` with none — the records below survive the deletion and end up
   * attributed to a name nobody can look up.
   */
  async userFootprint(id: string): Promise<{
    signedInBefore: boolean;
    newsPosts: number;
    financeRows: number;
  }> {
    const [snap, news, finance] = await Promise.all([
      getDoc(doc(db, 'users', id)),
      getDocs(query(collection(db, 'news'), where('authorId', '==', id))).catch(() => null),
      getDocs(query(collection(db, 'finance_transactions'), where('userId', '==', id)))
        .catch(() => null),
    ]);
    return {
      signedInBefore: !!snap.data()?.lastLoginAt,
      newsPosts: news?.size ?? 0,
      financeRows: finance?.size ?? 0,
    };
  },

  /**
   * Refuses a purge that would lock the organisation out of itself.
   *
   * Lives in the service rather than the dialog so it holds wherever purgeUser
   * is called from. Both cases are unrecoverable from inside the app: an admin
   * who deletes their own record loses admin on the very next request, and a
   * project with no admin left cannot open Software Control to appoint one.
   */
  async assertPurgeAllowed(id: string): Promise<void> {
    if (auth.currentUser?.uid === id) throw new AppError('cannotDeleteSelf');

    const [registry, superUids, { users }] = await Promise.all([
      roleRegistryService.get(),
      permissionService.getSuperAdmins().catch(() => [] as string[]),
      this.getAllUsers(),
    ]);

    const adminRoles = new Set(
      registry.roles.filter((r) => r.isAdmin && r.active !== false).map((r) => r.key)
    );
    // A uid on the super-admin list counts even if its role does not, because
    // firestore.rules grants it everything on that basis alone.
    const admins = (users as Array<Record<string, unknown>>).filter((u) => {
      const status = (u.status as string) ?? 'active';
      if (status !== 'active') return false;
      return adminRoles.has(u.hierarchyLevel as string)
        || u.role === 'SuperAdmin'
        || superUids.includes(u.id as string);
    });

    if (admins.length <= 1 && admins.some((u) => u.id === id)) {
      throw new AppError('cannotDeleteLastAdmin');
    }
  },

  /**
   * Permanently deletes an account.
   *
   * NOT the whole account: there is no Admin SDK on the Spark plan, so the
   * Firebase Auth credential cannot be removed from a browser and survives this.
   * That login can still authenticate; it simply has no member record, which
   * `authService.login` reports and refuses. Clearing the leftovers needs
   * functions/scripts/purge-auth-orphans.mjs, run with real credentials.
   *
   * The order below matters, and is chosen so that an interrupted purge leaves
   * an account that still WORKS rather than one that is half-erased:
   *
   *   1. super-admin list first — a uid listed there is granted everything by
   *      firestore.rules with no status and no document check, so a crash after
   *      the document was deleted would leave a login with total access and no
   *      record to revoke.
   *   2. notifications next — they are addressed by uid, and once the user
   *      document is gone no one satisfies the rule that guards them.
   *   3. the username reservation, read off the document while it still exists.
   *   4. the document itself, last.
   *
   * Returns whatever could not be cleaned rather than throwing, so the caller
   * can say what is left instead of claiming a clean sweep.
   */
  async purgeUser(id: string): Promise<{ leftovers: string[] }> {
    await this.assertPurgeAllowed(id);
    const leftovers: string[] = [];

    const snap = await getDoc(doc(db, 'users', id));
    const username = (snap.data()?.username as string | undefined)?.toLowerCase();

    // 1. Privileges, before anything else.
    try {
      const uids = await permissionService.getSuperAdmins();
      if (uids.includes(id)) {
        await permissionService.setSuperAdmins(
          uids.filter((u) => u !== id),
          auth.currentUser?.email ?? 'admin'
        );
      }
    } catch { leftovers.push('superAdmins'); }

    // 2. Notifications, while an admin can still reach them.
    try {
      const notes = await getDocs(
        query(collection(db, 'notifications'), where('userId', '==', id))
      );
      await Promise.all(notes.docs.map((d) => deleteDoc(d.ref)));
    } catch { leftovers.push('notifications'); }

    // 3. The name reservation. Without this the username is held forever: it
    //    still resolves to this account's sign-in address, and no new account
    //    can claim it.
    if (username) {
      try { await deleteDoc(doc(db, 'usernames', username)); }
      catch { leftovers.push('usernames'); }
    }

    // 4. The record.
    await deleteDoc(doc(db, 'users', id));

    // Audit entries are immutable and denormalise the actor, so this outlives
    // both the deleted account and whoever deleted it.
    auditLogService.dataChange(
      'delete', 'users', id,
      `Permanently deleted user record${username ? ` (@${username})` : ''}`
    );

    return { leftovers };
  },

  async getUserById(id: string) {
    const docSnap = await getDoc(doc(db, 'users', id));
    if (docSnap.exists()) {
      return { id: docSnap.id, ...docSnap.data() };
    }
    return null;
  },

  /**
   * Everyone belonging to one parish. Uses the existing
   * users(atbiyaId, fullNameEnglish) composite index.
   */
  async getUsersByAtbiya(atbiyaId: string) {
    if (!atbiyaId) return [];
    const q = query(
      collection(db, 'users'),
      where('atbiyaId', '==', atbiyaId),
      orderBy('fullNameEnglish', 'asc')
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
  },

  async getUsersByHierarchyLevel(hierarchyLevel?: string) {
    const usersRef = collection(db, 'users');
    const q = hierarchyLevel
      ? query(usersRef, where('hierarchyLevel', '==', hierarchyLevel))
      : query(usersRef);

    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  },

  async getAuditLogs(limit: number = 10) {
    // Reads 'auditLogs' — this used to read 'audit_logs' (snake_case), a
    // collection nothing has ever written, so the tab was always empty.
    try {
      const { query: fsQuery, orderBy: fsOrderBy, limit: fsLimit } = await import('firebase/firestore');
      const q = fsQuery(
        collection(db, 'auditLogs'),
        fsOrderBy('createdAt', 'desc'),
        fsLimit(limit)
      );
      const snapshot = await getDocs(q);
      const logs = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
      return { logs };
    } catch {
      return { logs: [] };
    }
  },
};
