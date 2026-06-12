import { db } from '@/lib/firebase';
import {
  collection,
  getDocs,
  doc,
  getDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  addDoc,
  serverTimestamp
} from 'firebase/firestore';
import { initializeApp, deleteApp } from 'firebase/app';
import { getAuth, createUserWithEmailAndPassword } from 'firebase/auth';
import { firebaseConfig } from '@/lib/firebase';

export interface CreateUserData {
  email: string;
  fullName: string;
  phone: string;
  address: {
    region: string;
    zone: string;
    woreda: string;
  };
  dateOfBirth: string;
  gender: 'Male' | 'Female';
  ministryType: string;
  hierarchyLevel: string;
  hierarchyEntityId: string;
}

export const userService = {
  async getAllUsers() {
    const querySnapshot = await getDocs(collection(db, 'users'));
    const users = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    return { users };
  },

  async createUser(userData: any) {
    const secondaryApp = initializeApp(firebaseConfig, `SecondaryApp-${Date.now()}`);
    const secondaryAuth = getAuth(secondaryApp);

    try {
      const username = userData.username || `user${Date.now()}`;
      const email = userData.email || `${username.toLowerCase().replace(/[^a-z0-9]/g, '')}@mahibereahaw.local`;
      const password = userData.password;
      
      if (!password) {
        throw new Error('Password is required');
      }

      const userCredential = await createUserWithEmailAndPassword(secondaryAuth, email, password);
      const id = userCredential.user.uid;

      const dataToSave = {
        ...userData,
        email,
        username,
        role: userData.role || 'user',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };

      delete dataToSave.password;

      await setDoc(doc(db, 'users', id), dataToSave);
      await deleteApp(secondaryApp);

      return { id, ...dataToSave };
    } catch (error) {
      await deleteApp(secondaryApp);
      console.error("Error creating user auth:", error);
      throw error;
    }
  },

  async updateUser(id: string, userData: any) {
    const userRef = doc(db, 'users', id);
    await updateDoc(userRef, {
      ...userData,
      updatedAt: serverTimestamp(),
    });
  },

  async deleteUser(id: string) {
    await deleteDoc(doc(db, 'users', id));
  },

  async getUserById(id: string) {
    const docSnap = await getDoc(doc(db, 'users', id));
    if (docSnap.exists()) {
      return { id: docSnap.id, ...docSnap.data() };
    }
    return null;
  },

  async getUsersByHierarchyLevel(hierarchyLevel?: string) {
    const usersRef = collection(db, 'users');
    const q = hierarchyLevel
      ? query(usersRef, where('hierarchyLevel', '==', hierarchyLevel))
      : query(usersRef);

    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  },

  async getAuditLogs(limit: number = 10) {
    // Audit logs collection — returns an empty list if it doesn't exist yet
    try {
      const { query: fsQuery, orderBy: fsOrderBy, limit: fsLimit } = await import('firebase/firestore');
      const q = fsQuery(
        collection(db, 'audit_logs'),
        fsOrderBy('createdAt', 'desc'),
        fsLimit(limit)
      );
      const snapshot = await getDocs(q);
      const logs = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
      return { logs };
    } catch {
      return { logs: [] };
    }
  },
};
