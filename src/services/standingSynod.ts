import { db } from '@/lib/firebase';
import { collection, getDocs, query, where, doc, updateDoc } from 'firebase/firestore';
import { auditLogService } from '@/services/auditLog';
import type { User } from '@/types';

/**
 * The Standing Synod (ቋሚ ሲኖዶስ).
 *
 * Not an org unit — it is a body of people, so membership is simply the set of
 * accounts carrying the `KuamiSinodos` role. There is deliberately no separate
 * roster document: a second list of "who is on the Standing Synod" would drift
 * from the roles the permission system actually reads, and firestore.rules
 * consults the role and nothing else.
 *
 * The bylaws set the body at nine. That is enforced as a warning rather than a
 * hard limit — an outgoing and an incoming member overlapping during a handover
 * is normal, and software that forbids it just gets worked around.
 */

export const STANDING_SYNOD_ROLE = 'KuamiSinodos';
export const STANDING_SYNOD_SEATS = 9;

export const standingSynodService = {
  /**
   * Current members.
   *
   * Queries on `hierarchyLevel` and sorts in memory rather than with
   * `orderBy`, which would need a composite index and would silently drop any
   * account missing the sorted field.
   */
  async list(): Promise<User[]> {
    const snap = await getDocs(query(
      collection(db, 'users'),
      where('hierarchyLevel', '==', STANDING_SYNOD_ROLE)
    ));
    return snap.docs
      .map((d) => ({ id: d.id, ...d.data() }) as User)
      .sort((a, b) =>
        (a.fullNameEnglish ?? a.fullName ?? a.username ?? '')
          .localeCompare(b.fullNameEnglish ?? b.fullName ?? b.username ?? ''));
  },

  /**
   * Adds an existing account to the body.
   *
   * Writes `hierarchyLevel` only, which firestore.rules permits solely through
   * its isAdmin() clause — hence the admin gate on the calling UI.
   */
  async add(uid: string, name: string): Promise<void> {
    await updateDoc(doc(db, 'users', uid), {
      hierarchyLevel: STANDING_SYNOD_ROLE,
      updatedAt: new Date().toISOString(),
    });
    auditLogService.dataChange('update', 'users', uid, `Added ${name} to the Standing Synod`);
  },

  /**
   * Removes somebody from the body by moving them to another role.
   *
   * Never deletes or suspends the account: leaving the Standing Synod does not
   * make somebody stop being a member of the church.
   */
  async remove(uid: string, name: string, fallbackRole: string): Promise<void> {
    await updateDoc(doc(db, 'users', uid), {
      hierarchyLevel: fallbackRole,
      updatedAt: new Date().toISOString(),
    });
    auditLogService.dataChange('update', 'users', uid, `Removed ${name} from the Standing Synod`);
  },
};
