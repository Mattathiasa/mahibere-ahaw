import { db } from '@/lib/firebase';
import {
  collection, query, where, orderBy, getDocs, getCountFromServer, doc, runTransaction,
} from 'firebase/firestore';
import { auditLogService } from '@/services/auditLog';
import { notificationService } from '@/services/notifications';
import type { User } from '@/types';

/**
 * Membership sign-up requests.
 *
 * A request is not a separate document — it IS the `users/{uid}` record, sitting
 * at `status: 'pending'` until the parish decides. That keeps one identity per
 * person and means approval is a single field flip rather than a copy.
 */

/** A pending `users/{uid}` document. All the profile fields come from User. */
export interface MembershipRequest extends Partial<User> {
  id: string;
}

export interface Approver {
  id: string;
  name: string;
}

export const membershipRequestService = {
  /**
   * Pending requests. Head office passes no atbiyaId and sees all; a parish
   * passes its own and sees only its own.
   *
   * Needs the composite index users(status, atbiyaId, requestedAt desc).
   */
  async listPending(atbiyaId?: string): Promise<MembershipRequest[]> {
    const base = collection(db, 'users');
    const q = atbiyaId
      ? query(base,
          where('status', '==', 'pending'),
          where('atbiyaId', '==', atbiyaId),
          orderBy('requestedAt', 'desc'))
      : query(base, where('status', '==', 'pending'), orderBy('requestedAt', 'desc'));

    const snap = await getDocs(q);
    return snap.docs.map((d) => ({ id: d.id, ...d.data() })) as MembershipRequest[];
  },

  /**
   * How many requests are waiting. Drives the badge that tells a parish a
   * request has arrived.
   *
   * Uses an aggregation query rather than fetching the documents: Firestore
   * bills a count as one read per 1000 documents, so polling this costs
   * essentially nothing. Reuses the users(status, atbiyaId, requestedAt) index
   * by its prefix, so no new index is needed.
   */
  async countPending(atbiyaId?: string): Promise<number> {
    const base = collection(db, 'users');
    const q = atbiyaId
      ? query(base, where('status', '==', 'pending'), where('atbiyaId', '==', atbiyaId))
      : query(base, where('status', '==', 'pending'));
    try {
      return (await getCountFromServer(q)).data().count;
    } catch {
      // A badge is not worth surfacing an error for.
      return 0;
    }
  },

  /** Recently decided requests, for context under the pending list. */
  async listDecided(atbiyaId?: string, max = 25): Promise<MembershipRequest[]> {
    const base = collection(db, 'users');
    const snap = await getDocs(
      atbiyaId ? query(base, where('atbiyaId', '==', atbiyaId)) : query(base)
    );
    return snap.docs
      .map((d) => ({ id: d.id, ...d.data() }) as MembershipRequest)
      .filter((u) => u.status === 'rejected' || (u.signupSource === 'self' && u.status === 'active'))
      .sort((a, b) => (b.requestedAt ?? '').localeCompare(a.requestedAt ?? ''))
      .slice(0, max);
  },

  /**
   * Approves a request.
   *
   * Runs in a transaction that re-reads `status` so two approvers clicking at
   * the same time cannot both "win" — the second gets a clear error instead of
   * silently overwriting the first decision.
   */
  async approve(uid: string, approver: Approver, roleKey: string): Promise<void> {
    const ref = doc(db, 'users', uid);

    await runTransaction(db, async (tx) => {
      const snap = await tx.get(ref);
      if (!snap.exists()) throw new Error('This request no longer exists.');
      const data = snap.data();
      if (data.status !== 'pending') {
        throw new Error(
          `This request was already ${data.status === 'active' ? 'approved' : 'decided'} by someone else.`
        );
      }
      tx.update(ref, {
        status: 'active',
        hierarchyLevel: roleKey,
        approvedBy: approver.id,
        approvedAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
    });

    auditLogService.dataChange(
      'update', 'users', uid,
      `Approved membership request (role: ${roleKey})`
    );
    notificationService.create({
      userId: uid,
      title: 'Your membership was approved',
      message: 'You can now sign in and use the system. Welcome!',
      type: 'success',
    }).catch(() => { /* notification failure must not undo the approval */ });
  },

  /** Rejects a request, keeping the record so the decision is auditable. */
  async reject(uid: string, approver: Approver, reason: string): Promise<void> {
    const ref = doc(db, 'users', uid);

    await runTransaction(db, async (tx) => {
      const snap = await tx.get(ref);
      if (!snap.exists()) throw new Error('This request no longer exists.');
      const data = snap.data();
      if (data.status !== 'pending') {
        throw new Error('This request was already decided by someone else.');
      }
      tx.update(ref, {
        status: 'rejected',
        rejectedBy: approver.id,
        rejectedAt: new Date().toISOString(),
        rejectedReason: reason.trim(),
        updatedAt: new Date().toISOString(),
      });
    });

    auditLogService.dataChange('update', 'users', uid, `Rejected membership request: ${reason}`);
    notificationService.create({
      userId: uid,
      title: 'Your membership request was not approved',
      message: reason.trim() || 'Please contact your parish for details.',
      type: 'warning',
    }).catch(() => { /* non-fatal */ });
  },
};
