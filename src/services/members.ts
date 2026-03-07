import { db } from '@/lib/firebase';
import {
  collection,
  getDocs,
  getDoc,
  doc,
  setDoc,
  query,
  where,
  serverTimestamp,
  addDoc
} from 'firebase/firestore';
import { initializeApp, deleteApp } from 'firebase/app';
import { getAuth, createUserWithEmailAndPassword } from 'firebase/auth';
import { firebaseConfig } from '@/lib/firebase';
import { User } from '@/types';

export const memberService = {
  async getAllMembers() {
    const membersCol = collection(db, 'users');
    const memberSnapshot = await getDocs(membersCol);
    const membersList = memberSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as User[];
    return { users: membersList };
  },

  async getMemberById(id: string) {
    const docRef = doc(db, 'users', id);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      return { id: docSnap.id, ...docSnap.data() } as User;
    }
    throw new Error('Member not found');
  },

  async createMember(memberData: any) {
    const secondaryApp = initializeApp(firebaseConfig, `SecondaryApp-${Date.now()}`);
    const secondaryAuth = getAuth(secondaryApp);

    try {
      // Create email from username if missing, or use a default pattern
      const username = memberData.username || `user${Date.now()}`;
      const email = memberData.email || `${username.toLowerCase().replace(/[^a-z0-9]/g, '')}@mahibereahaw.local`;
      const password = memberData.password || 'password123';

      const userCredential = await createUserWithEmailAndPassword(secondaryAuth, email, password);
      const id = userCredential.user.uid;

      // Standardize data for Firestore
      const data = {
        ...memberData,
        email,
        username,
        fullName: memberData.fullNameEnglish || memberData.fullName || 'Unknown',
        role: 'Member',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };
      // Remove password before saving to Firestore
      delete data.password;

      await setDoc(doc(db, 'users', id), data);
      await deleteApp(secondaryApp);

      return { id, ...data };
    } catch (error) {
      await deleteApp(secondaryApp);
      console.error("Error creating member auth:", error);
      throw error;
    }
  },

  async getMembersByHierarchy(entityId: string) {
    const q = query(collection(db, 'users'), where('hierarchyLevel', '==', entityId));
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as User[];
  },

  async getTotalMemberCount() {
    const snapshot = await getDocs(collection(db, 'users'));
    return snapshot.size;
  },
};
