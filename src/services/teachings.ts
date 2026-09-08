import { db } from '@/lib/firebase';
import { AppError } from '@/lib/appError';
import {
    collection, getDocs, getDoc, doc,
    addDoc, updateDoc, deleteDoc,
    query, orderBy, where, serverTimestamp
} from 'firebase/firestore';

/** Sortable millisecond value from a Firestore Timestamp or an ISO date string. */
function sortableTime(v: any): number {
    if (!v) return 0;
    if (typeof v?.toMillis === 'function') return v.toMillis();
    if (typeof v?.seconds === 'number') return v.seconds * 1000;
    if (typeof v === 'string') { const t = Date.parse(v); return isNaN(t) ? 0 : t; }
    return 0;
}

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
     * (the public homepage section and archive).
     *
     * Filters by status ONLY (a single-field equality, so no composite index is
     * required) and sorts + limits client-side, ordering by createdAt and
     * falling back to dateDelivered for older records that predate createdAt.
     * This keeps the homepage working before any index is deployed.
     */
    async listPublished({ max = 4 }: { max?: number } = {}) {
        const snapshot = await getDocs(
            query(collection(db, 'teachings'), where('status', '==', 'Published'))
        );
        const rows = snapshot.docs.map(d => ({ id: d.id, _id: d.id, ...d.data() } as any));
        rows.sort((a, b) =>
            (sortableTime(b.createdAt) || sortableTime(b.dateDelivered)) -
            (sortableTime(a.createdAt) || sortableTime(a.dateDelivered)));
        return rows.slice(0, max);
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
