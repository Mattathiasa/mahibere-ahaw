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
    serverTimestamp
} from 'firebase/firestore';
import { integrationsService } from '@/services/integrations';
import { uploadToCloudinary } from '@/services/cloudinary';

export interface Document {
    id: string;
    name: string;
    type: 'folder' | 'file';
    parentId: string | null;
    size?: string;
    fileType?: string;
    filePath?: string;
    createdAt: any;
}

export const documentService = {
    getDocuments: async (parentId: string | null = null) => {
        const q = query(
            collection(db, 'documents'),
            where('parentId', '==', parentId),
            orderBy('name', 'asc')
        );
        const snapshot = await getDocs(q);
        return { documents: snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) };
    },

    createFolder: async (name: string, parentId: string | null) => {
        const docRef = await addDoc(collection(db, 'documents'), {
            name,
            type: 'folder',
            parentId,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
        });
        return { id: docRef.id, name, type: 'folder', parentId };
    },

    uploadFile: async (file: File, parentId: string | null, opts?: { planId?: string; reportId?: string }) => {
        // Upload the real file (PDF/image/etc.) to Cloudinary, store its URL.
        const integ = await integrationsService.get();
        const result = await uploadToCloudinary(
            file,
            integrationsService.toCloudinary(integ),
            'mahibere-ahaw/documents',
            'auto',
        );
        const docRef = await addDoc(collection(db, 'documents'), {
            name: file.name,
            type: 'file',
            parentId,
            size: `${(file.size / 1024).toFixed(2)} KB`,
            fileType: file.type,
            filePath: result.secureUrl,
            ...(opts?.planId ? { planId: opts.planId } : {}),
            ...(opts?.reportId ? { reportId: opts.reportId } : {}),
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
        });
        return {
            id: docRef.id,
            name: file.name,
            type: 'file',
            parentId,
            size: `${(file.size / 1024).toFixed(2)} KB`,
            fileType: file.type,
            filePath: result.secureUrl,
        };
    },

    deleteDocument: async (id: string) => {
        await deleteDoc(doc(db, 'documents', id));
    },
};
