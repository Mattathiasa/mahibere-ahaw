import { auth, db } from '@/lib/firebase';
import {
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  reauthenticateWithCredential,
  updatePassword,
  EmailAuthProvider,
  User as FirebaseUser
} from 'firebase/auth';
import { doc, getDoc, collection, query, where, getDocs } from 'firebase/firestore';
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
    if (!email.includes('@')) {
      const typed = email;
      const deterministic = `${typed.toLowerCase().replace(/[^a-z0-9]/g, '')}@mahibereahaw.local`;
      try {
        const mapped = await getDoc(doc(db, 'usernames', typed.toLowerCase()));
        email = (mapped.exists() && (mapped.data().email as string)) || deterministic;
      } catch {
        email = deterministic;
      }
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
          throw new Error('Incorrect password. Please try again.');
        case 'auth/user-not-found':
          throw new Error('No account found with this username or email.');
        case 'auth/invalid-email':
          throw new Error('The email or username format is invalid.');
        case 'auth/user-disabled':
          throw new Error('This account has been disabled. Contact your administrator.');
        case 'auth/too-many-requests':
          throw new Error('Too many failed attempts. Please wait a few minutes and try again.');
        default:
          throw new Error(`Login failed: ${error.message}`);
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

    const token = await firebaseUser.getIdToken();

    // Store token and user for compatibility with existing code
    localStorage.setItem('auth_token', token);
    localStorage.setItem('user', JSON.stringify(user));

    auditLogService.log({
      action: 'login',
      targetType: 'auth',
      description: `${user.fullName || user.username} signed in`,
      actor: { id: user.id, name: user.fullName, email: user.email, hierarchyLevel: user.hierarchyLevel },
    });

    return { token, user };
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
    await auditLogService.log({ action: 'logout', targetType: 'auth', description: 'Signed out', actor });

    await signOut(auth);
    localStorage.removeItem('auth_token');
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
            username: firebaseUser.email?.split('@')[0] || 'user',
            email: firebaseUser.email || '',
            role: userData.role || 'user',
            firstName: userData.firstName,
            lastName: userData.lastName,
            fullName: userData.fullName || `${userData.firstName || ''} ${userData.lastName || ''}`.trim() || 'Church Member',
            phone: userData.phone,
            hierarchyLevel: userData.hierarchyLevel || 'Atbiya',
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

  getToken(): string | null {
    return localStorage.getItem('auth_token');
  },

  isAuthenticated(): boolean {
    return !!auth.currentUser || !!this.getToken();
  },

  clearAuth(): void {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('user');
  },

  async changePassword(data: { currentPassword: string; newPassword: string }): Promise<void> {
    const firebaseUser = auth.currentUser;
    if (!firebaseUser || !firebaseUser.email) {
      throw new Error('No user is currently signed in.');
    }
    if (data.newPassword.length < 6) {
      throw new Error('New password must be at least 6 characters long.');
    }
    // Re-authenticate the user before changing the password (Firebase requirement)
    const credential = EmailAuthProvider.credential(firebaseUser.email, data.currentPassword);
    try {
      await reauthenticateWithCredential(firebaseUser, credential);
    } catch {
      throw new Error('Current password is incorrect.');
    }
    await updatePassword(firebaseUser, data.newPassword);
  },
};
