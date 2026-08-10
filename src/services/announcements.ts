import { db } from '@/lib/firebase';
import { AppError } from '@/lib/appError';
import {
  collection,
  getDocs,
  getDoc,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  serverTimestamp
} from 'firebase/firestore';
import { auditLogService } from '@/services/auditLog';
import { notificationService } from '@/services/notifications';
import { userService } from '@/services/users';
import type { User } from '@/types';

/**
 * Who an announcement is for.
 *
 * Stored on the announcement rather than only used at send time, so it stays
 * auditable — you can see afterwards who a message was meant to reach.
 */
export type AnnouncementAudience =
  | { kind: 'parish'; atbiyaId: string }
  | { kind: 'everyone' }
  | { kind: 'roles'; roles: string[] };

export interface CreateAnnouncementData {
  title: string;
  content: string;
  expiresAt?: string;
  /** Stamped by the page from the signed-in user. */
  authorId?: string;
  authorName?: string;
  authorHierarchyLevel?: string;
  audience?: AnnouncementAudience;
}

export const announcementService = {
  async getAnnouncements() {
    const q = query(collection(db, 'announcements'), orderBy('createdAt', 'desc'));
    const snapshot = await getDocs(q);
    return { announcements: snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as any)) };
  },

  async getAnnouncementById(id: string) {
    const docRef = doc(db, 'announcements', id);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      return { id: docSnap.id, ...docSnap.data() };
    }
    throw new AppError('announcementNotFound');
  },

  async createAnnouncement(data: CreateAnnouncementData) {
    const docRef = await addDoc(collection(db, 'announcements'), {
      ...data,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    auditLogService.dataChange('create', 'announcements', docRef.id, `Posted announcement "${data.title ?? ''}"`);
    return { id: docRef.id, ...data };
  },

  /**
   * Everyone an audience resolves to: approved accounts only, and never the
   * author — nobody needs to be notified of their own announcement.
   */
  async resolveRecipients(audience: AnnouncementAudience, authorId?: string): Promise<User[]> {
    const all = audience.kind === 'parish'
      ? (await userService.getUsersByAtbiya(audience.atbiyaId)) as User[]
      : (await userService.getAllUsers()).users as User[];

    return all.filter((u) => {
      if (u.id === authorId) return false;
      // A missing status means active — every account predating sign-up.
      if ((u.status ?? 'active') !== 'active') return false;
      if (audience.kind === 'roles') {
        return !!u.hierarchyLevel && audience.roles.includes(u.hierarchyLevel);
      }
      return true;
    });
  },

  /**
   * Delivers an announcement to its audience as notifications.
   *
   * This is how an ordinary member sees an announcement at all — they have no
   * Announcements page. Returns the number of people reached so the caller can
   * say something true rather than an optimistic "notifications sent!".
   */
  async broadcast(
    announcement: { id: string; title: string; content: string },
    audience: AnnouncementAudience,
    author?: { id?: string; name?: string }
  ): Promise<number> {
    const recipients = await this.resolveRecipients(audience, author?.id);
    if (recipients.length === 0) return 0;

    return notificationService.createMany(
      recipients.map((u) => ({
        userId: u.id,
        title: announcement.title,
        message: announcement.content.length > 300
          ? `${announcement.content.slice(0, 300)}…`
          : announcement.content,
        type: 'info' as const,
        link: '/notifications',
        senderName: author?.name,
      }))
    );
  },

  async getActiveAnnouncements() {
    const now = new Date().toISOString();
    const q = query(
      collection(db, 'announcements'),
      where('expiresAt', '>', now),
      orderBy('expiresAt', 'asc')
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  },

  async markAsRead(id: string) {
    // This usually depends on the user, for simplicity we update a status or do nothing in a global feed
    const docRef = doc(db, 'announcements', id);
    await updateDoc(docRef, { read: true });
  },

  async updateAnnouncement(id: string, data: CreateAnnouncementData) {
    const docRef = doc(db, 'announcements', id);
    await updateDoc(docRef, { ...data, updatedAt: serverTimestamp() });
    auditLogService.dataChange('update', 'announcements', id, `Updated announcement "${(data as any).title ?? id}"`);
  },

  async deleteAnnouncement(id: string) {
    await deleteDoc(doc(db, 'announcements', id));
    auditLogService.dataChange('delete', 'announcements', id, `Deleted announcement ${id}`);
  },
};
