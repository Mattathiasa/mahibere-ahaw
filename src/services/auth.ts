import { auth, db } from '@/lib/firebase';
import { AppError } from '@/lib/appError';
import { syntheticEmail, isSyntheticEmail } from '@/services/signup';
import {
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  reauthenticateWithCredential,
  updatePassword,
  sendPasswordResetEmail,
  verifyBeforeUpdateEmail,
  EmailAuthProvider,
  User as FirebaseUser
} from 'firebase/auth';
import { doc, getDoc, setDoc, updateDoc, deleteDoc, collection, query, where, getDocs, serverTimestamp } from 'firebase/firestore';
import { User, LoginCredentials, AuthResponse } from '@/types';
import { auditLogService } from '@/services/auditLog';

export const authService = {
  async login(credentials: LoginCredentials): Promise<AuthResponse> {
    let email = credentials.username.trim();

    // If the input doesn't look like an email, resolve the username to one.
    //
    // The `users` collection is not readable before sign-in (and never really
    // was — that query always failed and silently fell through). The public
    // `usernames/{username}` map exists precisely for this lookup; the
    // deterministic fallback keeps every pre-existing account working, since
    // those were all created with a synthetic @mahibereahaw.local address.
    const typedAUsername = !email.includes('@');
    if (typedAUsername) {
      email = await this.resolveEmail(email);
    }

    let userCredential;
    try {
      console.log(`Attempting login with email: ${email}`);
      userCredential = await signInWithEmailAndPassword(
        auth,
        email,
        credentials.password
      );
    } catch (error: any) {
      console.error('Firebase Auth Error:', error.code, error.message);
      switch (error.code) {
        case 'auth/invalid-login-credentials':
        case 'auth/invalid-credential':
        case 'auth/wrong-password':
          // Firebase does not distinguish "no such account" from "wrong
          // password", so a username that resolves to an address nobody signs in
          // with lands here. That is exactly what happens to an account which
          // attached a recovery email: its sign-in address became the real one,
          // and the username no longer resolves to it. Point those users at their
          // email rather than telling them their correct password is wrong.
          throw new AppError(typedAUsername ? 'wrongPasswordTryEmail' : 'wrongPassword');
        case 'auth/user-not-found':
          throw new AppError('noAccount');
        case 'auth/invalid-email':
          throw new AppError('invalidIdentifier');
        case 'auth/user-disabled':
          throw new AppError('accountDisabled');
        case 'auth/too-many-requests':
          throw new AppError('tooManyAttempts');
        default:
          throw new AppError('loginFailedDetail', { detail: error.message });
      }
    }

    const firebaseUser = userCredential.user;

    // Fetch additional user data from Firestore if needed
    const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
    const userData = userDoc.exists() ? userDoc.data() : {};

    // ── Membership gate ──────────────────────────────────────────────────
    // Credentials are valid at this point, but the account may not be
    // approved. Firestore rules already deny a pending account everything;
    // this turns that into a clear message instead of an app full of empty
    // screens. A MISSING status means 'active' — every account created before
    // sign-up existed has no such field.
    const status: string = userData.status ?? 'active';
    if (!userDoc.exists() || status !== 'active') {
      const parish = userData.atbiyaName ? ` (${userData.atbiyaName})` : '';
      const message =
        !userDoc.exists()
          ? 'This login is not linked to a member record. Please contact your parish administrator.'
          : status === 'pending'
            ? `Your membership request is still waiting for approval from your Atbiya${parish}. You will be able to sign in once it is approved.`
            : status === 'rejected'
              ? `Your membership request was not approved.${userData.rejectedReason ? ` Reason: ${userData.rejectedReason}` : ''} Please contact your parish if you believe this is a mistake.`
              : 'This account has been suspended. Please contact your administrator.';

      // Record the blocked attempt BEFORE signing out, while auth is still live.
      await auditLogService.log({
        action: 'login',
        targetType: 'auth',
        description: `Blocked sign-in (${!userDoc.exists() ? 'no profile' : status})`,
        actor: {
          id: firebaseUser.uid,
          name: userData.fullNameEnglish || userData.fullName,
          email: firebaseUser.email ?? undefined,
          hierarchyLevel: userData.hierarchyLevel,
        },
      });
      await signOut(auth);

      const err = new Error(message) as Error & { membershipStatus?: string };
      err.membershipStatus = userDoc.exists() ? status : 'missing';
      throw err;
    }

    const user: User = {
      id: firebaseUser.uid,
      username: userData.username || firebaseUser.email?.split('@')[0] || 'user',
      email: firebaseUser.email || '',
      role: userData.role || 'user',
      firstName: userData.firstName,
      lastName: userData.lastName,
      fullName: userData.fullNameEnglish || userData.fullName || `${userData.firstName || ''} ${userData.lastName || ''}`.trim() || 'Church Member',
      phone: userData.phone,
      hierarchyLevel: userData.hierarchyLevel || 'Atbiya',
      hierarchyEntityId: userData.hierarchyEntityId,
      atbiyaId: userData.atbiyaId,
      atbiyaName: userData.atbiyaName,
      mahderatId: userData.mahderatId,
      status: 'active',
      ministryType: userData.ministryType || 'General',
    };

    // The ID token is deliberately NOT stored. It used to be written to
    // localStorage and `isAuthenticated()` returned true on the mere presence of
    // that string — so an expired token left the app convinced it was signed in,
    // and any XSS could read a live credential. The Firebase SDK already persists
    // and refreshes the session; the copy added exposure and nothing else.
    //
    // The `user` blob stays: auditLogService reads the actor from it when signing
    // out, after auth state has already been torn down.
    localStorage.setItem('user', JSON.stringify(user));

    auditLogService.log({
      action: 'login',
      targetType: 'auth',
      description: `${user.fullName || user.username} signed in`,
      actor: { id: user.id, name: user.fullName, email: user.email, hierarchyLevel: user.hierarchyLevel },
    });

    return { user };
  },

  async logout(): Promise<void> {
    // Capture the actor before sign-out clears auth state.
    let actor: { id: string; name?: string; email?: string; hierarchyLevel?: string } | undefined;
    try {
      const cached = JSON.parse(localStorage.getItem('user') || '{}');
      if (cached?.id) {
        actor = { id: cached.id, name: cached.fullName || cached.fullNameEnglish, email: cached.email, hierarchyLevel: cached.hierarchyLevel };
      }
    } catch { /* ignore */ }
    // Audit descriptions stay English on purpose. The log is a record, not UI
    // copy: entries are written once and read later by whoever is
    // investigating, so translating each at write time would leave the trail in
    // whatever language the actor happened to be using — a mix that is harder
    // to read, not easier. Same reasoning as the persisted enum tokens.
    await auditLogService.log({ action: 'logout', targetType: 'auth', description: 'Signed out', actor });

    await signOut(auth);
    localStorage.removeItem('user');
  },

  async getCurrentUser(): Promise<User> {
    return new Promise((resolve, reject) => {
      const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
        unsubscribe();
        if (firebaseUser) {
          const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
          const userData = userDoc.exists() ? userDoc.data() : {};

          const user: User = {
            id: firebaseUser.uid,
            // The Firestore record is the source of truth. Deriving this from
            // the email local-part made a renamed username silently revert on
            // the next reload, and showed the wrong name entirely once someone
            // attached a recovery email.
            username: userData.username || firebaseUser.email?.split('@')[0] || 'user',
            // Contact address from the profile, not the synthetic sign-in one.
            email: userData.email || firebaseUser.email || '',
            role: userData.role || 'user',
            firstName: userData.firstName,
            lastName: userData.lastName,
            fullName: userData.fullNameEnglish || userData.fullName || `${userData.firstName || ''} ${userData.lastName || ''}`.trim() || 'Church Member',
            phone: userData.phone,
            hierarchyLevel: userData.hierarchyLevel || 'Atbiya',
            // Org placement and membership state. These were omitted, and since
            // this overwrites the cached `user` blob, calling it (Login, Settings)
            // stripped the parish off the cache that auditLogService reads its
            // actor from. Same fields AuthContext already maps.
            hierarchyEntityId: userData.hierarchyEntityId,
            atbiyaId: userData.atbiyaId,
            atbiyaName: userData.atbiyaName,
            mahderatId: userData.mahderatId,
            status: userData.status || 'active',
            ministryType: userData.ministryType || 'General',
          };

          localStorage.setItem('user', JSON.stringify(user));
          resolve(user);
        } else {
          reject(new Error('No user authenticated'));
        }
      });
    });
  },

  getStoredUser(): User | null {
    const userStr = localStorage.getItem('user');
    if (!userStr) return null;
    try {
      return JSON.parse(userStr);
    } catch {
      return null;
    }
  },

  /**
   * Whether a session is live RIGHT NOW.
   *
   * Note the synchronous limitation: on a cold page load the SDK has not yet
   * restored the persisted session, so this reads false for a moment even for a
   * signed-in user. Anything that needs the settled answer must await
   * `getCurrentUser()`, which resolves through `onAuthStateChanged`.
   *
   * This used to fall back to a token string in localStorage, which made it
   * report true long after that token expired.
   */
  isAuthenticated(): boolean {
    return !!auth.currentUser;
  },

  clearAuth(): void {
    localStorage.removeItem('user');
  },

  async changePassword(data: { currentPassword: string; newPassword: string }): Promise<void> {
    const firebaseUser = auth.currentUser;
    if (!firebaseUser || !firebaseUser.email) {
      throw new AppError('notSignedIn');
    }
    if (data.newPassword.length < 6) {
      throw new AppError('passwordTooShort');
    }
    // Re-authenticate before changing the password (a Firebase requirement).
    const credential = EmailAuthProvider.credential(firebaseUser.email, data.currentPassword);
    try {
      await reauthenticateWithCredential(firebaseUser, credential);
    } catch (e) {
      // Previously every failure here read as "wrong password", including a
      // rate-limit, which sent people round in circles retrying a password
      // that was in fact correct.
      const code = (e as { code?: string }).code ?? '';
      if (code === 'auth/too-many-requests') {
        throw new AppError('tooManyAttemptsShort');
      }
      if (code === 'auth/network-request-failed') {
        throw new AppError('networkProblem');
      }
      throw new AppError('currentPasswordWrong');
    }

    try {
      await updatePassword(firebaseUser, data.newPassword);
    } catch (e) {
      const code = (e as { code?: string }).code ?? '';
      if (code === 'auth/weak-password') {
        throw new AppError('passwordTooWeak');
      }
      if (code === 'auth/requires-recent-login') {
        throw new AppError('reauthRequired');
      }
      throw new AppError('passwordChangeFailed');
    }
  },

  /**
   * Renames the account.
   *
   * The Auth email is deliberately left alone. Accounts created from a username
   * sign in as `name@mahibereahaw.local`, and the only way to change that
   * address is a link mailed to it — impossible for an address with no inbox.
   * Sign-in survives because `login` resolves the typed name through
   * `usernames/{name}`, so the new row carries the account's REAL current email.
   *
   * The new row records the account's CURRENT sign-in address whenever that is a
   * synthetic one, because after a rename it no longer matches the new name:
   * `oldname@mahibereahaw.local` cannot be derived from `newname`. Without it a
   * rename would silently break sign-in by the new username. A synthetic address
   * is safe to publish — it encodes a username that was already public as this
   * collection's key. A REAL address is omitted, and the rules refuse it; such an
   * account signs in with its email anyway, which is what Settings tells the user
   * when they attach one.
   *
   * Ordered `users` doc FIRST, then the new row, then the old one.
   *
   * That order is now forced: firestore.rules requires a `usernames` row to
   * spell the stored username of the account it points at — the check that makes
   * name-squatting impossible — so the profile has to carry the new name before
   * the row can be written.
   *
   * If the row write then fails, the account is renamed with no row. Sign-in by
   * the new name falls back to the deterministic @mahibereahaw.local address,
   * which works for any account that never attached a recovery email; the rest
   * can still sign in with their email, and `repairUsernameMapping` writes the
   * missing row on that next sign-in. The old row is removed last, so nothing is
   * released until the replacement is in place.
   */
  async changeUsername(next: string): Promise<void> {
    const firebaseUser = auth.currentUser;
    if (!firebaseUser?.email) throw new AppError('notSignedIn');

    const trimmed = next.trim();
    if (!/^[a-zA-Z0-9._-]{3,}$/.test(trimmed)) {
      throw new AppError('usernameInvalid');
    }

    const snap = await getDoc(doc(db, 'users', firebaseUser.uid));
    const current: string = snap.exists() ? (snap.data().username ?? '') : '';
    if (trimmed.toLowerCase() === current.toLowerCase()) return;

    const existing = await getDoc(doc(db, 'usernames', trimmed.toLowerCase()));
    if (existing.exists() && existing.data().uid !== firebaseUser.uid) {
      throw new AppError('usernameTaken');
    }

    try {
      await updateDoc(doc(db, 'users', firebaseUser.uid), {
        username: trimmed,
        updatedAt: new Date().toISOString(),
      });
      await setDoc(doc(db, 'usernames', trimmed.toLowerCase()), {
        uid: firebaseUser.uid,
        ...(isSyntheticEmail(firebaseUser.email) ? { email: firebaseUser.email } : {}),
        createdAt: serverTimestamp(),
      });
    } catch {
      throw new AppError('usernameSaveFailed');
    }

    // Best-effort: the rename has already taken effect. A leftover row only
    // means the old name stays reserved.
    if (current) {
      try { await deleteDoc(doc(db, 'usernames', current.toLowerCase())); }
      catch { /* non-fatal */ }
    }

    auditLogService.dataChange('update', 'users', firebaseUser.uid, `Changed username to ${trimmed}`);
  },

  // ── Password recovery ─────────────────────────────────────────────────────
  // All of this rides on Firebase Auth's built-in email templates, which are
  // free on the Spark plan. Nothing here needs Cloud Functions or the Admin
  // SDK, which the project deliberately avoids.

  /**
   * The address a username signs in with. Resolvable before sign-in, which is
   * why `usernames/{name}` is world-readable.
   *
   * New accounts are always created with the synthetic address, and their rows
   * carry no `email` at all, so for them this is pure derivation and the read
   * finds nothing to return. The read remains for accounts created BEFORE that
   * change, whose sign-in address is a real inbox recorded only here — dropping
   * it would break username sign-in for every one of them.
   *
   * That residue is the remaining half of the leak: probing a username still
   * returns a pre-existing member's real email. Closing it means stripping the
   * field from those rows, which costs those accounts their username sign-in, so
   * it waits on a count of how many there are. See the plan's §2 Stage B.
   *
   * A Cloud Function would have resolved this properly by keeping the map
   * private, but the project is on Spark and nothing here may assume a server.
   */
  async resolveEmail(usernameOrEmail: string): Promise<string> {
    const typed = usernameOrEmail.trim();
    if (typed.includes('@')) return typed;

    const key = typed.toLowerCase();
    const deterministic = syntheticEmail(key);

    try {
      const mapped = await getDoc(doc(db, 'usernames', key));
      return (mapped.exists() && (mapped.data().email as string)) || deterministic;
    } catch {
      return deterministic;
    }
  },

  /**
   * Sends a password reset link.
   *
   * Accounts created with only a username sign in as `@mahibereahaw.local`,
   * which is not a real inbox — there is no way to mail them and no Admin SDK
   * to set a password server-side, so the caller is told plainly rather than
   * being shown a success message for a link nobody will ever receive.
   *
   * A TYPED USERNAME cannot be told apart from that case. `usernames/{name}`
   * may now only carry `uid` (the rules refuse an address there, and
   * repairUsernameMapping is gone), so `resolveEmail` falls back to the
   * synthetic address for every account created since — including the
   * admin-created ones that DO own a real inbox and are perfectly recoverable.
   * Only legacy rows still resolve. That is why `noEmailOnAccount` tells the
   * reader to type their email address instead rather than asserting the
   * account has none: from the name alone we genuinely cannot know.
   *
   * Resolving a name properly needs a lookup that can read without being the
   * caller — `resolveLoginEmail` in functions/src/index.ts, still undeployed.
   */
  async sendPasswordReset(usernameOrEmail: string): Promise<{ sentTo: string }> {
    const input = usernameOrEmail.trim();
    if (!input) throw new AppError('enterIdentifierFirst');

    const email = await this.resolveEmail(input);
    if (email.toLowerCase().endsWith('@mahibereahaw.local')) {
      throw new AppError('noEmailOnAccount');
    }

    try {
      await sendPasswordResetEmail(auth, email);
    } catch (e) {
      const code = (e as { code?: string }).code ?? '';
      if (code === 'auth/invalid-email') throw new AppError('emailInvalid');
      if (code === 'auth/too-many-requests') {
        throw new AppError('tooManyAttemptsShort');
      }
      // auth/user-not-found is deliberately NOT distinguished: saying which
      // addresses have accounts would let anyone enumerate the membership.
      if (code !== 'auth/user-not-found') {
        throw new AppError('resetEmailFailed');
      }
    }
    return { sentTo: email };
  },

  /**
   * Attaches a real email address to an account that only had a username, so
   * password reset becomes possible for it.
   *
   * Firebase only mails the address on the Auth account, so this genuinely has
   * to change the sign-in email. `verifyBeforeUpdateEmail` does not take effect
   * until the link is clicked, and the `usernames` row is deliberately NOT
   * rewritten — putting a real address in that world-readable document is the
   * leak this project is unwinding.
   *
   * The consequence is that once the link is clicked, this account signs in with
   * its EMAIL rather than its username: the row still resolves to the old
   * synthetic address, which no longer authenticates. The confirmation toast in
   * Settings already says exactly that, which is the only place it can be said —
   * nothing client-side can observe the link being clicked.
   */
  async addRecoveryEmail(currentPassword: string, newEmail: string): Promise<void> {
    const firebaseUser = auth.currentUser;
    if (!firebaseUser?.email) throw new AppError('notSignedIn');
    if (!/^\S+@\S+\.\S+$/.test(newEmail.trim())) {
      throw new AppError('emailInvalid');
    }

    const credential = EmailAuthProvider.credential(firebaseUser.email, currentPassword);
    try {
      await reauthenticateWithCredential(firebaseUser, credential);
    } catch {
      throw new AppError('currentPasswordWrong');
    }

    try {
      await verifyBeforeUpdateEmail(firebaseUser, newEmail.trim());
    } catch (e) {
      const code = (e as { code?: string }).code ?? '';
      if (code === 'auth/email-already-in-use') {
        throw new AppError('emailTaken');
      }
      throw new AppError('emailChangeFailed');
    }
  },

  // repairUsernameMapping used to live here. It wrote the account's real email
  // into the world-readable `usernames` row on every sign-in, which is precisely
  // how personal addresses ended up published — and it is what the rules now
  // refuse, since a row may only carry `uid` and `createdAt`.
};
