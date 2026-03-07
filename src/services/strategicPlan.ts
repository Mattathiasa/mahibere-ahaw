import { db } from '@/lib/firebase';
import {
    collection,
    getDocs,
    doc,
    addDoc,
    updateDoc,
    deleteDoc,
    query,
    orderBy,
    serverTimestamp
} from 'firebase/firestore';

export interface StrategicGoal {
    id?: string;
    title: string;
    description: string;
    targetYear: number;
    currentValue: number;
    targetValue: number;
    unit: string;
    order?: number;
}

export const strategicPlanService = {
    async getAllGoals() {
        const q = query(collection(db, 'strategic_plans'), orderBy('targetYear', 'asc'));
        const snapshot = await getDocs(q);
        return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as StrategicGoal));
    },

    async createGoal(goal: StrategicGoal) {
        const docRef = await addDoc(collection(db, 'strategic_plans'), {
            ...goal,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
        });
        return { id: docRef.id, ...goal };
    },

    async updateGoal(id: string, updates: Partial<StrategicGoal>) {
        const docRef = doc(db, 'strategic_plans', id);
        await updateDoc(docRef, {
            ...updates,
            updatedAt: serverTimestamp(),
        });
    },

    async deleteGoal(id: string) {
        const docRef = doc(db, 'strategic_plans', id);
        await deleteDoc(docRef);
    }
};
