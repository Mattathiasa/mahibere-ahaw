import { db } from '@/lib/firebase';
import {
    collection, getDocs, getDoc, doc,
    addDoc, updateDoc, deleteDoc,
    query, orderBy, serverTimestamp
} from 'firebase/firestore';

export interface CreateTeachingData {
    title: string;
    shortDescription: string;
    speaker: string;
    serviceType: string;
    status: string;
    dateDelivered: string;
    tags?: string[];
    featuredImage?: string;
    fullContent?: string;
}

export const teachingService = {
    async getAllTeachings() {
        const q = query(collection(db, 'teachings'), orderBy('createdAt', 'desc'));
        const snapshot = await getDocs(q);
        return snapshot.docs.map(d => ({ id: d.id, _id: d.id, ...d.data() }));
    },

    async getTeachingById(id: string) {
        const snap = await getDoc(doc(db, 'teachings', id));
        if (snap.exists()) return { id: snap.id, _id: snap.id, ...snap.data() };
        throw new Error('Teaching not found');
    },

    async createTeaching(data: CreateTeachingData) {
        const docRef = await addDoc(collection(db, 'teachings'), {
            ...data,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
        });
        return { id: docRef.id, _id: docRef.id, ...data };
    },

    async updateTeaching(id: string, data: Partial<CreateTeachingData>) {
        const ref = doc(db, 'teachings', id);
        await updateDoc(ref, { ...data, updatedAt: serverTimestamp() });
        const updated = await getDoc(ref);
        return { id: updated.id, _id: updated.id, ...updated.data() };
    },

    async deleteTeaching(id: string) {
        await deleteDoc(doc(db, 'teachings', id));
    },
};
