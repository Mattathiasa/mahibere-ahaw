import { db } from '@/lib/firebase';
import { AppError } from '@/lib/appError';
import {
  collection,
  getDocs,
  getDoc,
  doc,
  addDoc,
  updateDoc,
  query,
  orderBy,
  serverTimestamp,
  arrayUnion
} from 'firebase/firestore';

export interface CreateReportBackData {
  planId: string;
  reportId: string;
}

export interface AddReportBackCommentData {
  content: string;
  authorName?: string;
}

export const reportBackService = {
  async getAllReportBacks() {
    const q = query(collection(db, 'report_backs'), orderBy('createdAt', 'desc'));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  },

  async getReportBackById(id: string) {
    const docSnap = await getDoc(doc(db, 'report_backs', id));
    if (docSnap.exists()) return { id: docSnap.id, ...docSnap.data() };
    throw new AppError('reportBackNotFound');
  },

  async createReportBack(data: CreateReportBackData) {
    const docRef = await addDoc(collection(db, 'report_backs'), {
      ...data,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      comments: []
    });
    return { id: docRef.id, ...data };
  },

  async addComment(reportBackId: string, data: AddReportBackCommentData) {
    const docRef = doc(db, 'report_backs', reportBackId);
    await updateDoc(docRef, {
      comments: arrayUnion({
        id: Math.random().toString(36).substr(2, 9),
        ...data,
        createdAt: new Date().toISOString()
      })
    });
  },
};
