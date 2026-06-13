import { db } from '@/lib/firebase';
import {
  collection,
  getDocs,
  getDoc,
  doc,
  addDoc,
  updateDoc,
  query,
  where,
  orderBy,
  serverTimestamp,
  arrayUnion
} from 'firebase/firestore';

export interface CreateReportData {
  planId: string;
  planName?: string;
  option: 'Memriya' | 'Kifil' | 'Zerf';
  timeframe: 'Weekly' | 'Monthly' | 'Annually';
  department?: string;
  workPlanned?: string;
  workDone: string;
  uncompletedTasks?: string;
  result: string;
  attachments?: any[];
  recipients?: any[];
  authorId?: string;
  authorName?: string;
  authorHierarchyLevel?: string;
}

export interface AddCommentData {
  content: string;
  authorName?: string;
}

export const reportService = {
  async getAllReports(planId?: string) {
    const reportsCol = collection(db, 'reports');
    // Use createdAt (serverTimestamp) for ordering since submittedAt is an ISO string
    let q = planId
      ? query(reportsCol, where('planId', '==', planId), orderBy('createdAt', 'desc'))
      : query(reportsCol, orderBy('createdAt', 'desc'));

    const snapshot = await getDocs(q);
    return { reports: snapshot.docs.map(d => ({ id: d.id, ...d.data() })) };
  },

  async getReportById(id: string) {
    const docRef = doc(db, 'reports', id);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      return { id: docSnap.id, ...docSnap.data() };
    }
    throw new Error('Report not found');
  },

  async createReport(data: CreateReportData) {
    const docRef = await addDoc(collection(db, 'reports'), {
      ...data,
      submittedAt: new Date().toISOString(),
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      comments: [],
      status: 'submitted',
    });
    return { id: docRef.id, ...data };
  },

  async addComment(reportId: string, data: AddCommentData) {
    const docRef = doc(db, 'reports', reportId);
    await updateDoc(docRef, {
      comments: arrayUnion({
        id: Math.random().toString(36).substr(2, 9),
        ...data,
        createdAt: new Date().toISOString(),
      }),
    });
  },
};
