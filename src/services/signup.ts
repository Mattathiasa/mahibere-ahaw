import { auth, db } from '@/lib/firebase';
import { createUserWithEmailAndPassword, signOut, deleteUser } from 'firebase/auth';
import { doc, setDoc, getDoc, serverTimestamp } from 'firebase/firestore';
import { roleRegistryService } from '@/services/roleRegistry';
import { auditLogService } from '@/services/auditLog';

/**
 * Public member sign-up.
 *
 * The Firebase Auth account is created immediately but the Firestore profile is
 * written with `status: 'pending'`. `firestore.rules` denies every data read and
 * write until an approver at the chosen parish flips that to 'active', so a
 * pending member can authenticate and see nothing at all — the block is
 * server-side, not a UI convention.
 *
 * This avoids needing Cloud Functions (and therefore the Blaze plan) to create
 * accounts, which the project deliberately stepped away from in f4b7fb0.
 */

export interface SignupInput {
  fullNameEnglish: string;
  fullNameAmharic: string;
  username: string;
  email: string;
  password: string;
  phone: string;
  dateOfBirth?: string;
  gender?: string;
  maritalStatus?: string;
  hasChildren?: boolean;
  childrenCount?: number;
  workSchool?: string;
  region?: string;
  zone?: string;
  woreda?: string;
  ministryType?: string[];
  churchRoles?: string[];
  /** hierarchy doc id of the parish the member is requesting to join. */
  atbiyaId: string;
  atbiyaName: string;
}

/** Same synthetic-email scheme userService.createUser has always used. */
export function syntheticEmail(username: string): string {
  return `${username.toLowerCase().replace(/[^a-z0-9]/g, '')}@mahibereahaw.local`;
}

function friendlyAuthError(code: string, fallback: string): string {
  switch (code) {
    case 'auth/email-already-in-use':
      return 'An account with this email already exists. Try signing in instead.';
    case 'auth/invalid-email':
      return 'That email address is not valid.';
    case 'auth/weak-password':
      return 'Please choose a password of at least 6 characters.';
    case 'auth/network-request-failed':
      return 'Network problem — check your connection and try again.';
    case 'auth/operation-not-allowed':
      return 'Email sign-up is disabled for this project. Ask an administrator to enable it.';
    default:
      return fallback;
  }
}

export const signupService = {
  /** Is this username already taken? Readable without an account. */
  async isUsernameTaken(username: string): Promise<boolean> {
    const key = username.trim().toLowerCase();
    if (!key) return false;
    try {
      const snap = await getDoc(doc(db, 'usernames', key));
      return snap.exists();
    } catch {
      // A failed lookup must not block sign-up; Auth still enforces unique emails.
      return false;
    }
  },

  /**
   * Creates the account, writes the pending profile, then signs out so the
   * caller is never left holding a half-authorised session.
   */
  async register(input: SignupInput): Promise<{ atbiyaName: string }> {
    const username = input.username.trim();
    const email = input.email.trim() || syntheticEmail(username);

    let uid: string | null = null;
    try {
      const cred = await createUserWithEmailAndPassword(auth, email, input.password);
      uid = cred.user.uid;

      const flags = await roleRegistryService.getFlags();

      // This object must stay inside the `keys().hasOnly([...])` whitelist in
      // firestore.rules — an extra field makes the whole write fail.
      const profile = {
        username,
        email,
        fullNameEnglish: input.fullNameEnglish.trim(),
        fullNameAmharic: input.fullNameAmharic.trim(),
        fullName: input.fullNameEnglish.trim(),
        phone: input.phone.trim(),
        dateOfBirth: input.dateOfBirth ?? '',
        gender: input.gender ?? '',
        maritalStatus: input.maritalStatus ?? '',
        hasChildren: input.hasChildren ?? false,
        childrenCount: input.childrenCount ?? 0,
        workSchool: input.workSchool ?? '',
        address: {
          region: input.region ?? '',
          zone: input.zone ?? '',
          woreda: input.woreda ?? '',
        },
        ministryType: input.ministryType ?? [],
        churchRoles: input.churchRoles ?? [],
        atbiyaId: input.atbiyaId,
        atbiyaName: input.atbiyaName,
        hierarchyLevel: flags.signupRole,
        role: 'user',
        status: 'pending',
        signupSource: 'self',
        requestedAt: new Date().toISOString(),
        createdAt: new Date().toISOString(),
      };

      await setDoc(doc(db, 'users', uid), profile);

      // Username → email map, so this member can later sign in by username.
      // Best-effort: sign-in by email always works regardless.
      try {
        await setDoc(doc(db, 'usernames', username.toLowerCase()), {
          uid, email, createdAt: serverTimestamp(),
        });
      } catch { /* non-fatal */ }

      auditLogService.log({
        action: 'create',
        targetType: 'users',
        targetId: uid,
        description: `Membership request from ${profile.fullNameEnglish} for ${input.atbiyaName}`,
        actor: { id: uid, name: profile.fullNameEnglish, email },
      });

      await signOut(auth);
      return { atbiyaName: input.atbiyaName };
    } catch (e) {
      const err = e as { code?: string; message?: string };

      // If the Auth account was created but the profile write failed, the user
      // would be stranded: able to sign in, with no document and no request in
      // any queue. Roll the account back so they can simply try again.
      if (uid && auth.currentUser?.uid === uid) {
        try { await deleteUser(auth.currentUser); }
        catch { await signOut(auth).catch(() => {}); }
      }

      throw new Error(
        friendlyAuthError(
          err.code ?? '',
          err.message ?? 'Could not complete your registration. Please try again.'
        )
      );
    }
  },
};
