import { db } from '@/lib/firebase';
import {
    collection, getDocs, getDoc, doc,
    addDoc, updateDoc, deleteDoc,
    query, orderBy, where, serverTimestamp
} from 'firebase/firestore';

export interface CreateMissionaryApplicationData {
    desiredLocation: string;
    missionaryType: string;
    description: string;
    userId: string;
    fullName: string;
    phoneNumber?: string;
}

export interface CreateMissionaryReportData {
    title: string;
    location: string;
    content: string;
    stats: { peopleReached: number; baptized: number };
    missionaryId: string;
    date: string;
}

export const missionaryService = {
    async getAllApplications(userId?: string) {
        let q = query(collection(db, 'missionary_applications'), orderBy('createdAt', 'desc'));
        if (userId) q = query(collection(db, 'missionary_applications'), where('userId', '==', userId), orderBy('createdAt', 'desc'));
        const snapshot = await getDocs(q);
        return snapshot.docs.map(d => ({ id: d.id, _id: d.id, ...d.data() }));
    },

    async createApplication(data: CreateMissionaryApplicationData) {
        const docRef = await addDoc(collection(db, 'missionary_applications'), {
            ...data,
            status: 'Pending',
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
        });
        return { id: docRef.id, _id: docRef.id, ...data, status: 'Pending' };
    },

    async getAllReports(missionaryId?: string) {
        let q = query(collection(db, 'missionary_reports'), orderBy('createdAt', 'desc'));
        if (missionaryId) q = query(collection(db, 'missionary_reports'), where('missionaryId', '==', missionaryId), orderBy('createdAt', 'desc'));
        const snapshot = await getDocs(q);
        return snapshot.docs.map(d => ({ id: d.id, _id: d.id, ...d.data() }));
    },

    async createReport(data: CreateMissionaryReportData) {
        const docRef = await addDoc(collection(db, 'missionary_reports'), {
            ...data,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
        });
        return { id: docRef.id, _id: docRef.id, ...data };
    },
};
