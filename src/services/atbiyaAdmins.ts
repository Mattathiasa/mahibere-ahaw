import { auth, db } from '@/lib/firebase';
import { sendPasswordResetEmail } from 'firebase/auth';
import {
  collection, query, where, getDocs, doc, setDoc, updateDoc, serverTimestamp,
} from 'firebase/firestore';
import { userService } from '@/services/users';
import { signupService, syntheticEmail } from '@/services/signup';
import { auditLogService } from '@/services/auditLog';
import type { User } from '@/types';

/**
 * Parish administrators.
 *
 * There is no `atbiyaAdmins` collection and there should never be one. An
 * administrator IS a `users/{uid}` record carrying two fields:
 *
 *   hierarchyLevel — a role whose scope is 'atbiya' and which can approve
 *   atbiyaId       — the `hierarchy` doc id of the parish
 *
 * That pair is exactly what `firestore.rules` reads when it decides whether an
 * approver may act on a membership request (`resource.data.atbiyaId ==
 * myAtbiya()`), so any separate registry of "who runs this parish" would be a
 * second source of truth the server does not consult.
 */

export interface AtbiyaAdmin {
  id: string;
  fullNameEnglish?: string;
  fullNameAmharic?: string;
  fullName?: string;
  username: string;
  email: string;
  phone?: string;
  hierarchyLevel?: string;
  status?: User['status'];
  createdAt?: unknown;
}

export interface AtbiyaAdminInput {
  fullNameEnglish: string;
  fullNameAmharic?: string;
  username: string;
  /** Optional. Blank falls back to the synthetic @mahibereahaw.local address. */
  email?: string;
  phone?: string;
  password: string;
}

/** The form's shape: the service input plus its confirmation field. */
export type AdminDraft = AtbiyaAdminInput & { confirmPassword: string };

export const emptyAdminDraft = (): AdminDraft => ({
  fullNameEnglish: '', fullNameAmharic: '', username: '', email: '', phone: '',
  password: '', confirmPassword: '',
});

/**
 * Returns a human-readable problem, or null when the draft is sound.
 * Mirrors the sign-up form's rules so both paths accept the same usernames.
 */
export function validateAdminDraft(d: AdminDraft): string | null {
  if (!d.fullNameEnglish.trim()) return "Enter the administrator's full name in English.";
  if (!/^[a-zA-Z0-9._-]{3,}$/.test(d.username.trim())) {
    return 'The username needs at least 3 characters, and may use only letters, digits, dot, dash or underscore.';
  }
  if (d.email?.trim() && !/^\S+@\S+\.\S+$/.test(d.email.trim())) {
    return 'That email address is not valid. Leave it blank to sign in by username only.';
  }
  if (d.password.length < 6) return 'The password must be at least 6 characters.';
  if (d.password !== d.confirmPassword) return 'The two passwords do not match.';
  return null;
}

/** A real inbox, as opposed to the synthetic sign-in address. */
export function isRealEmail(email: string | undefined): boolean {
  return !!email && !email.toLowerCase().endsWith('@mahibereahaw.local');
}

function friendlyError(code: string, fallback: string): string {
  switch (code) {
    case 'auth/email-already-in-use':
      return 'An account with this email already exists. Choose another, or use the existing account.';
    case 'auth/invalid-email':
      return 'That email address is not valid.';
    case 'auth/weak-password':
      return 'Please choose a password of at least 6 characters.';
    case 'auth/network-request-failed':
      return 'Network problem — check your connection and try again.';
    case 'permission-denied':
      return 'Firestore denied this write. Your role may not include permission to create accounts.';
    default:
      return fallback;
  }
}

export const atbiyaAdminService = {
  /**
   * Accounts that can act for this parish.
   *
   * Queries on `atbiyaId` alone and filters by role IN MEMORY, which reuses the
   * existing users(atbiyaId, fullNameEnglish) index instead of needing a new
   * one — the same reason `hierarchyService.getAtbiyas` filters `active` in
   * memory rather than with a `where`.
   */
  async list(atbiyaId: string, approverRoleKeys: string[]): Promise<AtbiyaAdmin[]> {
    if (!atbiyaId) return [];
    const snap = await getDocs(query(collection(db, 'users'), where('atbiyaId', '==', atbiyaId)));
    return snap.docs
      .map((d) => ({ id: d.id, ...d.data() }) as AtbiyaAdmin)
      .filter((u) => !!u.hierarchyLevel && approverRoleKeys.includes(u.hierarchyLevel))
      .sort((a, b) => (a.fullNameEnglish ?? a.username ?? '').localeCompare(b.fullNameEnglish ?? b.username ?? ''));
  },

  /** Is this username free? Shares the public `usernames` lookup with sign-up. */
  isUsernameTaken(username: string): Promise<boolean> {
    return signupService.isUsernameTaken(username);
  },

  /**
   * Creates the administrator's account.
   *
   * Goes through `userService.createUser`, which builds the Auth account on a
   * SECONDARY Firebase app — creating it on the primary `auth` would sign the
   * head-office admin out and into the account they just made.
   *
   * Returns the new uid.
   */
  async create(
    atbiya: { id: string; name: string },
    input: AtbiyaAdminInput,
    roleKey: string
  ): Promise<string> {
    const username = input.username.trim();
    const email = (input.email ?? '').trim() || syntheticEmail(username);

    try {
      const created = await userService.createUser({
        username,
        email,
        password: input.password,
        fullNameEnglish: input.fullNameEnglish.trim(),
        fullNameAmharic: (input.fullNameAmharic ?? '').trim(),
        fullName: input.fullNameEnglish.trim(),
        phone: (input.phone ?? '').trim(),
        role: 'user',
        hierarchyLevel: roleKey,
        atbiyaId: atbiya.id,
        atbiyaName: atbiya.name,
        status: 'active',
        signupSource: 'admin',
      });

      // Username → email map so this administrator can sign in by username even
      // when they were given a real email address. Best-effort: sign-in by
      // email always works regardless.
      try {
        await setDoc(doc(db, 'usernames', username.toLowerCase()), {
          uid: created.id, email, createdAt: serverTimestamp(),
        });
      } catch { /* non-fatal */ }

      auditLogService.dataChange(
        'create', 'users', created.id,
        `Created parish administrator ${input.fullNameEnglish} for ${atbiya.name}`
      );
      return created.id;
    } catch (e) {
      const err = e as { code?: string; message?: string };
      throw new Error(friendlyError(err.code ?? '', err.message ?? 'Could not create the administrator account.'));
    }
  },

  /**
   * Suspends or reinstates an administrator.
   *
   * Flips `status`, which `firestore.rules` only lets an admin change — this is
   * offered from the head-office registry, never from the parish's own console.
   */
  async setActive(uid: string, active: boolean): Promise<void> {
    await updateDoc(doc(db, 'users', uid), {
      status: active ? 'active' : 'suspended',
      updatedAt: new Date().toISOString(),
    });
    auditLogService.dataChange(
      'update', 'users', uid,
      `${active ? 'Reinstated' : 'Suspended'} parish administrator`
    );
  },

  /**
   * Sends a password reset email.
   *
   * This project has no Admin SDK (sign-up deliberately avoids Cloud Functions
   * and the Blaze plan), so there is no server-side password reset. An account
   * created with a synthetic @mahibereahaw.local username address has no inbox
   * to send to — callers must check `isRealEmail` first and offer to create a
   * replacement account instead.
   */
  async sendReset(email: string): Promise<void> {
    if (!isRealEmail(email)) {
      throw new Error(
        'This account signs in with a username, not a real email address, so no reset link can be sent. Create a replacement administrator account instead.'
      );
    }
    await sendPasswordResetEmail(auth, email);
    auditLogService.dataChange('update', 'users', email, 'Sent a password reset email to a parish administrator');
  },
};
