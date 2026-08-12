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
  /** The member's own home pin, used later to suggest the nearest Mahedher. */
  lat?: number;
  lng?: number;
  ministryType?: string[];
  churchRoles?: string[];
  /** hierarchy doc id of the parish the member is requesting to join. */
  atbiyaId: string;
  atbiyaName: string;
}

/** The domain for addresses that exist only to satisfy Firebase Auth. */
export const SYNTHETIC_EMAIL_DOMAIN = 'mahibereahaw.local';

/** Same synthetic-email scheme userService.createUser has always used. */
export function syntheticEmail(username: string): string {
  return `${username.toLowerCase().replace(/[^a-z0-9]/g, '')}@${SYNTHETIC_EMAIL_DOMAIN}`;
}

/**
 * Is this a placeholder address rather than a real inbox?
 *
 * Matters because a synthetic address is safe to store in the world-readable
 * `usernames` map — it encodes only a username that is already the document key —
 * whereas a real one is somebody's personal email. firestore.rules enforces the
 * same distinction.
 */
export function isSyntheticEmail(email: string | null | undefined): boolean {
  return !!email && email.toLowerCase().endsWith(`@${SYNTHETIC_EMAIL_DOMAIN}`);
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

    // The SIGN-IN address is always synthetic, even when the member gave a real
    // one. It used to be whichever they typed, and because username sign-in has
    // to resolve a typed name to an address before there is an account to
    // authorise, that real address had to be written into the world-readable
    // `usernames/{name}` document — publishing the personal email of everyone who
    // registered with one.
    //
    // Synthetic addresses are derivable from the username, so the map no longer
    // needs to carry an address at all. The real one is kept below as ordinary,
    // access-controlled profile data.
    const loginEmail = syntheticEmail(username);
    const contactEmail = input.email.trim();

    let uid: string | null = null;
    try {
      const cred = await createUserWithEmailAndPassword(auth, loginEmail, input.password);
      uid = cred.user.uid;

      const flags = await roleRegistryService.getFlags();

      // This object must stay inside the `keys().hasOnly([...])` whitelist in
      // firestore.rules — an extra field makes the whole write fail.
      const profile = {
        username,
        // Contact address, not the sign-in address. Blank when they gave none.
        email: contactEmail,
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
        // Coordinates ride inside `address` rather than as new top-level
        // fields: the `keys().hasOnly([...])` whitelist in firestore.rules
        // checks top-level keys only, and `address` is already listed there.
        address: {
          region: input.region ?? '',
          zone: input.zone ?? '',
          woreda: input.woreda ?? '',
          ...(typeof input.lat === 'number' && typeof input.lng === 'number'
            ? { lat: input.lat, lng: input.lng }
            : {}),
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

      // Reserves the username. No address: the sign-in address is derivable from
      // the name, and this document is world-readable.
      // Best-effort — sign-in works regardless, since resolveEmail falls back to
      // the same derivation when the row is missing.
      try {
        await setDoc(doc(db, 'usernames', username.toLowerCase()), {
          uid, createdAt: serverTimestamp(),
        });
      } catch { /* non-fatal */ }

      auditLogService.log({
        action: 'create',
        targetType: 'users',
        targetId: uid,
        description: `Membership request from ${profile.fullNameEnglish} for ${input.atbiyaName}`,
        actor: { id: uid, name: profile.fullNameEnglish, email: contactEmail || loginEmail },
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
