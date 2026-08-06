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
  /** Who it came from, shown on the notifications page. */
  senderName?: string;
}

/**
 * Firestore caps a batch at 500 operations. Chunking below that leaves room and
 * keeps one oversized broadcast from failing wholesale.
 */
const BATCH_LIMIT = 450;

function chunk<T>(items: T[], size = BATCH_LIMIT): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < items.length; i += size) out.push(items.slice(i, i + size));
  return out;
}

/**
 * Firestore rejects `undefined` outright, and the optional fields on
 * NotificationInput are frequently absent — so drop them rather than writing
 * them as null.
 */
function defined(input: NotificationInput): Record<string, unknown> {
  return Object.fromEntries(Object.entries(input).filter(([, v]) => v !== undefined));
}

export const notificationService = {
  /**
   * Sends a notification to one user. The collection was read-only from the
   * app until now — nothing could actually create one.
   */
  async create(input: NotificationInput) {
    const docRef = await addDoc(collection(db, 'notifications'), {
      ...defined(input),
      type: input.type ?? 'info',
      status: 'unread',
      createdAt: new Date().toISOString(),
    });
    return docRef.id;
  },

  /**
   * Sends the same notification to many users at once, one document each.
   *
   * A notification is addressed by a single scalar `userId`, so a broadcast is
   * genuinely N documents — there is no topic or audience field to fan out
   * server-side, and with no Cloud Functions there is nowhere to do it but here.
   *
   * Returns how many were written. Batches are committed in sequence rather
   * than in parallel so a large send degrades gracefully instead of hammering
   * the connection; a failure part-way through leaves earlier batches delivered,
   * which is the right trade for an announcement.
   */
  async createMany(inputs: NotificationInput[]): Promise<number> {
    if (inputs.length === 0) return 0;
    const createdAt = new Date().toISOString();
    let written = 0;

    for (const group of chunk(inputs)) {
      const batch = writeBatch(db);
      for (const input of group) {
        batch.set(doc(collection(db, 'notifications')), {
          ...defined(input),
          type: input.type ?? 'info',
          status: 'unread',
          createdAt,
        });
      }
      await batch.commit();
      written += group.length;
    }
    return written;
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

  /** Chunked for the same reason as createMany — this could exceed 500. */
  async markAllAsRead(userId: string) {
    const q = query(
      collection(db, 'notifications'),
      where('userId', '==', userId),
      where('status', '==', 'unread')
    );
    const snapshot = await getDocs(q);
    for (const group of chunk(snapshot.docs)) {
      const batch = writeBatch(db);
      for (const d of group) batch.update(d.ref, { status: 'read' });
      await batch.commit();
    }
  },

  async deleteNotification(notificationId: string) {
    await deleteDoc(doc(db, 'notifications', notificationId));
  },
};