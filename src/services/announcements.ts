import { db } from '@/lib/firebase';
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

export interface CreateAnnouncementData {
  title: string;
  content: string;
  expiresAt?: string;
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
    throw new Error('Announcement not found');
  },

  async createAnnouncement(data: CreateAnnouncementData) {
    const docRef = await addDoc(collection(db, 'announcements'), {
      ...data,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    auditLogService.dataChange('create', 'announcements', docRef.id, `Posted announcement "${(data as any).title ?? ''}"`);
    return { id: docRef.id, ...data };
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
