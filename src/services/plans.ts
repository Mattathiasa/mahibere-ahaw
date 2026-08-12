import { db } from '@/lib/firebase';
import { auditLogService } from '@/services/auditLog';
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
    // Typed as id + open record rather than bare `{ id }`. TypeScript drops the
    // index signature when spreading `DocumentData`, so every consumer reading a
    // real field off a plan — `plan.name` in Reports, for one — was a type error.
    return {
      plans: snapshot.docs.map(
        (d) => ({ id: d.id, ...d.data() }) as { id: string } & Record<string, any>
      ),
    };
  },

  async getPlanById(id: string) {
    const docRef = doc(db, 'plans', id);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      return { id: docSnap.id, ...docSnap.data() };
    }
    throw new AppError('planNotFound');
  },

  async createPlan(data: CreatePlanData) {
    const docRef = await addDoc(collection(db, 'plans'), {
      ...data,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    auditLogService.dataChange('create', 'plans', docRef.id, `Created plan "${data.name}"`);
    return { id: docRef.id, ...data };
  },

  async updatePlan(id: string, data: UpdatePlanData) {
    const docRef = doc(db, 'plans', id);
    await updateDoc(docRef, { ...data, updatedAt: serverTimestamp() });
    auditLogService.dataChange('update', 'plans', id, `Updated plan "${data.name ?? id}"`);
  },

  async deletePlan(id: string) {
    await deleteDoc(doc(db, 'plans', id));
    auditLogService.dataChange('delete', 'plans', id, 'Deleted a plan');
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
