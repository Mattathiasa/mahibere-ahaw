import { db } from '@/lib/firebase';
import { localeFor } from '@/lib/ethiopian-calendar';
import {
  collection,
  getDocs,
  getDoc,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  orderBy,
  serverTimestamp
} from 'firebase/firestore';
import { auditLogService } from '@/services/auditLog';
import { notificationService } from '@/services/notifications';
import { hierarchyService } from '@/services/hierarchy';
import { userService } from '@/services/users';
import type { User } from '@/types';

/**
 * Who a meeting is for.
 *
 * Scope and roles compose, because the two questions are independent: "a
 * diocese meeting" and "only congregation administrators" is a real case and
 * neither axis alone expresses it.
 *
 * Stored on the meeting rather than only used at send time — the same reasoning
 * as AnnouncementAudience: it stays auditable, and the list can show a member
 * why a meeting concerns them.
 */
export interface MeetingAudience {
  scope:
    | { kind: 'all' }
    /** A `hierarchy` doc with level 'Zone' — a Diocese in the UI. */
    | { kind: 'diocese'; dioceseId: string }
    | { kind: 'congregation'; atbiyaId: string };
  /** Empty means everyone in scope. Otherwise only these role keys. */
  roles: string[];
}

export const everyoneAudience = (): MeetingAudience => ({ scope: { kind: 'all' }, roles: [] });

export interface CreateMeetingData {
  title: string;
  description: string;
  scheduledDate: string;
  location?: string;
  audience?: MeetingAudience;
  /** Required by firestore.rules on create, and what delete/update check. */
  createdBy?: string;
  createdByName?: string;
}

export interface UpdateMeetingData {
  title?: string;
  description?: string;
  scheduledDate?: string;
  location?: string;
  audience?: MeetingAudience;
}

export const meetingService = {
  async getAllMeetings() {
    const q = query(collection(db, 'meetings'), orderBy('scheduledDate', 'asc'));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  },

  async getMeetingById(id: string) {
    const docSnap = await getDoc(doc(db, 'meetings', id));
    if (docSnap.exists()) return { id: docSnap.id, ...docSnap.data() };
    throw new Error('Meeting not found');
  },

  async createMeeting(data: CreateMeetingData) {
    const payload = {
      ...data,
      audience: data.audience ?? everyoneAudience(),
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };
    const docRef = await addDoc(collection(db, 'meetings'), payload);
    auditLogService.dataChange('create', 'meetings', docRef.id, `Scheduled meeting "${data.title}"`);
    return { id: docRef.id, ...data };
  },

  /**
   * Everyone an audience resolves to: approved accounts only, never the
   * organiser, and role-filtered when the audience names roles.
   *
   * Mirrors announcementService.resolveRecipients — the two deliberately share
   * a shape so a reader who understands one understands the other.
   */
  async resolveRecipients(audience: MeetingAudience, organiserId?: string): Promise<User[]> {
    let candidates: User[];

    if (audience.scope.kind === 'congregation') {
      candidates = await userService.getUsersByAtbiya(audience.scope.atbiyaId) as User[];
    } else if (audience.scope.kind === 'diocese') {
      // A diocese has no members of its own — its people are the members of the
      // congregations under it, so the congregation ids come first.
      const children = await hierarchyService.getEntitiesByParent(audience.scope.dioceseId);
      const ids = new Set(
        (children as Array<{ id: string; level?: string }>)
          .filter((c) => c.level === 'Atbiya')
          .map((c) => c.id)
      );
      const all = (await userService.getAllUsers()).users as User[];
      candidates = all.filter((u) => !!u.atbiyaId && ids.has(u.atbiyaId));
    } else {
      candidates = (await userService.getAllUsers()).users as User[];
    }

    return candidates.filter((u) => {
      if (u.id === organiserId) return false;
      // A missing status means active — every account predating sign-up.
      if ((u.status ?? 'active') !== 'active') return false;
      if (audience.roles.length === 0) return true;
      return !!u.hierarchyLevel && audience.roles.includes(u.hierarchyLevel);
    });
  },

  /**
   * Delivers the meeting to its audience as notifications.
   *
   * Until now `createMeeting` was a bare addDoc while the page announced
   * "Meeting scheduled and notifications sent!" — nothing was ever sent to
   * anyone. Returns the number of people actually reached so the caller can say
   * something true.
   */
  async broadcast(
    meeting: { id: string; title: string; description: string; scheduledDate: string; location?: string },
    audience: MeetingAudience,
    organiser?: { id?: string; name?: string }
  ): Promise<number> {
    const recipients = await this.resolveRecipients(audience, organiser?.id);
    if (recipients.length === 0) return 0;

    // Amharic, not the organiser's browser locale. This text is written into
    // each recipient's notification document, so it is frozen at send time and
    // read later by many people whose languages differ — there is no single
    // reader whose preference could apply. Amharic matches DEFAULT_LANGUAGE and
    // the Cloud Functions notification text, for the same reason.
    const when = new Date(meeting.scheduledDate);
    const whenText = Number.isNaN(when.getTime())
      ? meeting.scheduledDate
      : when.toLocaleString(localeFor('am'));
    const where = meeting.location ? ` · ${meeting.location}` : '';

    return notificationService.createMany(
      recipients.map((u) => ({
        userId: u.id,
        title: meeting.title,
        message: `${whenText}${where}`,
        type: 'info' as const,
        link: '/meetings',
        senderName: organiser?.name,
      }))
    );
  },

  async updateMeeting(id: string, data: UpdateMeetingData) {
    const docRef = doc(db, 'meetings', id);
    await updateDoc(docRef, { ...data, updatedAt: serverTimestamp() });
    const updated = await getDoc(docRef);
    return { id: updated.id, ...updated.data() };
  },

  async deleteMeeting(id: string) {
    await deleteDoc(doc(db, 'meetings', id));
    auditLogService.dataChange('delete', 'meetings', id, `Deleted meeting ${id}`);
  },
};
