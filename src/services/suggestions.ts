import { auth, db } from '@/lib/firebase';
import { signInAnonymously, signOut } from 'firebase/auth';
import {
  addDoc, collection, doc, getCountFromServer, getDocs,
  orderBy, query, serverTimestamp, updateDoc, where,
} from 'firebase/firestore';
import { AppError } from '@/lib/appError';
import { auditLogService } from '@/services/auditLog';
import { SUGGESTION_CATEGORIES, SUGGESTION_STATUSES } from '@/i18n/enums';
import type { Language } from '@/i18n/translations';

const COLLECTION = 'suggestions';

export type SuggestionCategory = (typeof SUGGESTION_CATEGORIES)[number];
export type SuggestionStatus = (typeof SUGGESTION_STATUSES)[number];

export interface Suggestion {
  id: string;
  category: SuggestionCategory;
  message: string;
  /** Both optional on the form — a visitor may stay entirely anonymous. */
  name: string;
  contact: string;
  language: Language | '';
  status: SuggestionStatus;
  /**
   * The uid the submission was written under: a real member's, or the throwaway
   * anonymous one minted for that single submission. Pinned by firestore.rules
   * to `request.auth.uid`, so it cannot be forged.
   */
  authorUid: string;
  /**
   * Whether the submitter had a member account. Verified in the rules against
   * `exists(users/{uid})` rather than trusted from the client, which costs one
   * document read per submission and buys a flag the reviewer can rely on.
   */
  isMember: boolean;
  createdAt?: { seconds: number; nanoseconds: number };
  reviewedBy?: string;
  reviewedAt?: string;
  adminNote?: string;
}

export interface CreateSuggestionData {
  category: SuggestionCategory;
  message: string;
  name: string;
  contact: string;
  language: Language;
}

export const suggestionService = {
  /**
   * File a suggestion from the public homepage.
   *
   * The awkward part is the session. `firestore.rules` requires `signedIn()` so
   * every submission carries a uid it can pin `authorUid` to — accepting writes
   * from `request.auth == null` would leave the church's one open write path
   * completely unattributable. A visitor has no account, so one anonymous
   * session is minted here, used, and dropped:
   *
   *   - minted lazily, at submit rather than on page load, so the thousands of
   *     people who only read the homepage never become Auth users;
   *   - dropped afterwards ONLY when we created it. A signed-in member
   *     submitting from the homepage keeps their real session, and their
   *     submission is recorded against their real uid.
   *
   * See also the `isAnonymous` guard in AuthContext, without which the session
   * minted here is signed straight back out before the write lands.
   */
  async submit(data: CreateSuggestionData): Promise<void> {
    const hadSession = !!auth.currentUser;

    if (!hadSession) {
      try {
        await signInAnonymously(auth);
      } catch (e) {
        // The one failure worth naming separately: anonymous sign-in is a
        // per-project console setting, and if it was never enabled EVERY
        // submission fails this way. A generic "could not send" would send
        // whoever debugs it looking at the rules instead.
        const code = (e as { code?: string }).code;
        throw new AppError(
          code === 'auth/operation-not-allowed' ? 'suggestionAnonDisabled' : 'suggestionFailed'
        );
      }
    }

    const uid = auth.currentUser?.uid;
    if (!uid) throw new AppError('suggestionFailed');

    try {
      await addDoc(collection(db, COLLECTION), {
        ...data,
        status: 'New',
        authorUid: uid,
        isMember: hadSession,
        createdAt: serverTimestamp(),
      });
    } finally {
      // `isAnonymous` re-checked rather than assumed: if the visitor signed in
      // for real in another tab while this was in flight, that session is
      // theirs and must survive.
      if (!hadSession && auth.currentUser?.isAnonymous) {
        await signOut(auth).catch(() => {});
      }
    }
  },

  /** Reviewer-side listing. Admin-only by the rules; the UI lives in Software Control. */
  async list(status?: SuggestionStatus): Promise<Suggestion[]> {
    const base = collection(db, COLLECTION);
    const q = status
      ? query(base, where('status', '==', status), orderBy('createdAt', 'desc'))
      : query(base, orderBy('createdAt', 'desc'));
    const snapshot = await getDocs(q);
    return snapshot.docs.map((d) => ({ id: d.id, ...d.data() }) as Suggestion);
  },

  /**
   * How many are still untriaged, for the tab badge. A count aggregation rather
   * than a full fetch, matching membershipRequestService.countPending — the
   * badge renders for every admin on every visit and should not pay for the
   * documents.
   */
  async countNew(): Promise<number> {
    const q = query(collection(db, COLLECTION), where('status', '==', 'New'));
    const snapshot = await getCountFromServer(q);
    return snapshot.data().count;
  },

  /**
   * Triage. Only these four fields are writable after creation — the rules
   * reject a diff that touches anything else, because an edited suggestion is a
   * fabricated one.
   */
  async setStatus(
    id: string,
    status: SuggestionStatus,
    options: { reviewedBy: string; adminNote?: string }
  ): Promise<void> {
    await updateDoc(doc(db, COLLECTION, id), {
      status,
      reviewedBy: options.reviewedBy,
      reviewedAt: new Date().toISOString(),
      adminNote: options.adminNote ?? '',
    });
    // Description is an audit record read later by whoever is investigating,
    // not UI copy — same reasoning as the 'Signed out' entry in auth.ts.
    await auditLogService
      .dataChange('update', 'suggestion', id, `Suggestion marked ${status}`)
      .catch(() => {});
  },
};
