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
  limit,
  writeBatch
} from 'firebase/firestore';

export interface NotificationInput {
  userId: string;
  title: string;
  message: string;
  type?: 'info' | 'success' | 'warning' | 'error';
  link?: string;
}

export const notificationService = {
  /**
   * Sends a notification to one user. The collection was read-only from the
   * app until now — nothing could actually create one.
   */
  async create(input: NotificationInput) {
    const docRef = await addDoc(collection(db, 'notifications'), {
      ...input,
      type: input.type ?? 'info',
      status: 'unread',
      createdAt: new Date().toISOString(),
    });
    return docRef.id;
  },

  async getNotifications(options?: {
    userId: string;
    status?: 'unread' | 'read' | 'archived';
    limitCount?: number;
  }) {
    const notificationsCol = collection(db, 'notifications');
    let q = query(notificationsCol, where('userId', '==', options?.userId || 'system'), orderBy('createdAt', 'desc'));

    if (options?.status) {
      q = query(q, where('status', '==', options.status));
    }

    if (options?.limitCount) {
      q = query(q, limit(options.limitCount));
    }

    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  },

  async getUnreadCount(userId: string) {
    const q = query(
      collection(db, 'notifications'),
      where('userId', '==', userId),
      where('status', '==', 'unread')
    );
    const snapshot = await getDocs(q);
    return snapshot.size;
  },

  async markAsRead(notificationId: string) {
    const docRef = doc(db, 'notifications', notificationId);
    await updateDoc(docRef, { status: 'read' });
  },

  async markAllAsRead(userId: string) {
    const q = query(
      collection(db, 'notifications'),
      where('userId', '==', userId),
      where('status', '==', 'unread')
    );
    const snapshot = await getDocs(q);
    const batch = writeBatch(db);
    snapshot.docs.forEach((doc) => {
      batch.update(doc.ref, { status: 'read' });
    });
    await batch.commit();
  },

  async deleteNotification(notificationId: string) {
    await deleteDoc(doc(db, 'notifications', notificationId));
  },
};