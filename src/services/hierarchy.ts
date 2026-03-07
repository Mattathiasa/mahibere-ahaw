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

export const hierarchyService = {
  // Get all entities by level
  getEntitiesByLevel: async (level: string) => {
    const q = query(collection(db, 'hierarchy'), where('level', '==', level), orderBy('name', 'asc'));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  },

  // Get entities by parent
  getEntitiesByParent: async (parentId: string) => {
    const q = query(collection(db, 'hierarchy'), where('parentId', '==', parentId), orderBy('name', 'asc'));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  },

  // Create new entity
  createEntity: async (entityData: {
    name: string;
    nameAmharic: string;
    level: string;
    parentId?: string | null;
    location?: string;
    description?: string;
  }) => {
    const docRef = await addDoc(collection(db, 'hierarchy'), {
      ...entityData,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    return { id: docRef.id, ...entityData };
  },

  // Update entity
  updateEntity: async (id: string, entityData: any) => {
    const docRef = doc(db, 'hierarchy', id);
    await updateDoc(docRef, { ...entityData, updatedAt: serverTimestamp() });
    const updated = await getDoc(docRef);
    return { id: updated.id, ...updated.data() };
  },

  // Delete entity
  deleteEntity: async (id: string) => {
    await deleteDoc(doc(db, 'hierarchy', id));
  },

  // Get hierarchy tree
  getTree: async () => {
    const snapshot = await getDocs(collection(db, 'hierarchy'));
    const allEntities = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

    // Simple tree builder - assuming parent-child relationship
    const buildTree = (parentId: string | null = null): any[] => {
      return allEntities
        .filter((e: any) => e.parentId === parentId)
        .map((e: any) => ({
          ...e,
          children: buildTree(e.id),
        }));
    };

    return buildTree(null);
  },
};
