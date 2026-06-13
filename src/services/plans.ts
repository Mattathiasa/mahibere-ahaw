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
  serverTimestamp,
  arrayUnion
} from 'firebase/firestore';

export interface CreatePlanData {
  name: string;
  timeframe: 'Weekly' | 'Monthly' | 'Annually';
  department?: string;
  details: string;
}

export interface UpdatePlanData {
  name?: string;
  timeframe?: 'Weekly' | 'Monthly' | 'Annually';
  details?: string;
}

export const planService = {
  async getAllPlans(timeframe?: string) {
    const plansCol = collection(db, 'plans');
    let q = query(plansCol, orderBy('createdAt', 'desc'));

    if (timeframe) {
      q = query(plansCol, where('timeframe', '==', timeframe), orderBy('createdAt', 'desc'));
    }

    const snapshot = await getDocs(q);
    return { plans: snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) };
  },

  async getPlanById(id: string) {
    const docRef = doc(db, 'plans', id);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      return { id: docSnap.id, ...docSnap.data() };
    }
    throw new Error('Plan not found');
  },

  async createPlan(data: CreatePlanData) {
    const docRef = await addDoc(collection(db, 'plans'), {
      ...data,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    return { id: docRef.id, ...data };
  },

  async updatePlan(id: string, data: UpdatePlanData) {
    const docRef = doc(db, 'plans', id);
    await updateDoc(docRef, { ...data, updatedAt: serverTimestamp() });
  },

  async deletePlan(id: string) {
    await deleteDoc(doc(db, 'plans', id));
  },

  async addComment(planId: string, data: { content: string, userId: string }) {
    const docRef = doc(db, 'plans', planId);
    await updateDoc(docRef, {
      comments: arrayUnion({
        ...data,
        createdAt: new Date().toISOString()
      })
    });
  },
};
