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
      const username = (memberData.username || `user${Date.now()}`).trim();
      const password = memberData.password || 'password123';

      // First check if username is already taken in Firestore
      const existingUsernameQ = query(collection(db, 'users'), where('username', '==', username));
      const existingUsernameSnap = await getDocs(existingUsernameQ);
      if (!existingUsernameSnap.empty) {
        await deleteApp(secondaryApp);
        throw new Error(`Username "${username}" is already taken. Please choose a different username.`);
      }

      // Build the email — use provided email or deterministic pattern
      const cleanUsername = username.toLowerCase().replace(/[^a-z0-9]/g, '');
      const email = memberData.email?.trim() || `${cleanUsername}@mahibereahaw.local`;

      // If a real email was provided, check if it's already registered
      if (memberData.email?.trim()) {
        const existingEmailQ = query(collection(db, 'users'), where('email', '==', email));
        const existingEmailSnap = await getDocs(existingEmailQ);
        if (!existingEmailSnap.empty) {
          await deleteApp(secondaryApp);
          throw new Error(`Email "${email}" is already registered. Please use a different email.`);
        }
      }

      const userCredential = await createUserWithEmailAndPassword(secondaryAuth, email, password);
      const id = userCredential.user.uid;

      const data: any = {
        ...memberData,
        email,
        username,
        fullName: memberData.fullNameEnglish || memberData.fullName || 'Unknown',
        role: memberData.role || 'Member',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };
      delete data.password;

      await setDoc(doc(db, 'users', id), data);
      await deleteApp(secondaryApp);

      return { id, ...data };
    } catch (error: any) {
      // Attempt cleanup — ignore errors here
      try { await deleteApp(secondaryApp); } catch (_) { }

      // Translate Firebase auth errors into user-friendly messages
      if (error.code === 'auth/email-already-in-use') {
        throw new Error('A member with this username or email already exists. Please use different credentials.');
      }
      if (error.code === 'auth/weak-password') {
        throw new Error('Password must be at least 6 characters long.');
      }
      if (error.code === 'auth/invalid-email') {
        throw new Error('The email address is not valid. Please check the email field.');
      }

      console.error('Error creating member:', error);
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

  async updateMember(id: string, memberData: any) {
    const docRef = doc(db, 'users', id);
    const data = {
      ...memberData,
      updatedAt: serverTimestamp(),
    };
    // Don't update username or password here for simplicity
    delete data.password;
    delete data.username;

    await setDoc(docRef, data, { merge: true });
    return { id, ...data };
  },

  async deleteMember(id: string) {
    const docRef = doc(db, 'users', id);
    // In a real app, we might want to also delete the Firebase Auth user,
    // but that usually requires admin privileges or a Cloud Function.
    // For now, we'll just remove them from Firestore.
    const { deleteDoc } = await import('firebase/firestore');
    await deleteDoc(docRef);
  },
};
