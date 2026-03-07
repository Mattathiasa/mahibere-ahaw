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
  orderBy,
  serverTimestamp
} from 'firebase/firestore';

export interface CreateMeetingData {
  title: string;
  description: string;
  scheduledDate: string;
}

export interface UpdateMeetingData {
  title?: string;
  description?: string;
  scheduledDate?: string;
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
    const docRef = await addDoc(collection(db, 'meetings'), {
      ...data,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    return { id: docRef.id, ...data };
  },

  async updateMeeting(id: string, data: UpdateMeetingData) {
    const docRef = doc(db, 'meetings', id);
    await updateDoc(docRef, { ...data, updatedAt: serverTimestamp() });
    const updated = await getDoc(docRef);
    return { id: updated.id, ...updated.data() };
  },

  async deleteMeeting(id: string) {
    await deleteDoc(doc(db, 'meetings', id));
  },
};
