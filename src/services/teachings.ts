import { db } from '@/lib/firebase';
import { AppError } from '@/lib/appError';
import {
    collection, getDocs, getDoc, doc,
    addDoc, updateDoc, deleteDoc,
    query, orderBy, where, limit as fsLimit, serverTimestamp
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

    /**
     * Published teachings only, newest first — readable by anonymous visitors
     * (the public homepage section and archive). Mirrors newsService.listPublished.
     * Needs the composite index teachings(status, createdAt desc).
     */
    async listPublished({ max = 4 }: { max?: number } = {}) {
        const q = query(
            collection(db, 'teachings'),
            where('status', '==', 'Published'),
            orderBy('createdAt', 'desc'),
            fsLimit(max),
        );
        const snapshot = await getDocs(q);
        return snapshot.docs.map(d => ({ id: d.id, _id: d.id, ...d.data() }));
    },

    async getTeachingById(id: string) {
        const snap = await getDoc(doc(db, 'teachings', id));
        if (snap.exists()) return { id: snap.id, _id: snap.id, ...snap.data() };
        throw new AppError('teachingNotFound');
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
