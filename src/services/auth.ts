import { auth, db } from '@/lib/firebase';
import {
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  User as FirebaseUser
} from 'firebase/auth';
import { doc, getDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { User, LoginCredentials, AuthResponse } from '@/types';

export const authService = {
  async login(credentials: LoginCredentials): Promise<AuthResponse> {
    let email = credentials.username.trim();

    // If the input doesn't look like an email, try to find the user by username
    if (!email.includes('@')) {
      try {
        const q = query(collection(db, 'users'), where('username', '==', email));
        const snapshot = await getDocs(q);

        if (!snapshot.empty) {
          const userData = snapshot.docs[0].data();
          if (userData.email) {
            email = userData.email;
          } else {
            // User exists but has no email field (created before fix). Fall back to deterministic email.
            const cleanUsername = email.toLowerCase().replace(/[^a-z0-9]/g, '');
            email = `${cleanUsername}@mahibereahaw.local`;
          }
        } else {
          // If we can verify it's not there, throw
          throw new Error('Username not found');
        }
      } catch (error: any) {
        if (error.message === 'Username not found') throw error;

        // If Firestore blocks read due to missing rules (e.g. unauthenticated), 
        // we log it and fallback to the auto-generated deterministic email format.
        console.warn('Firestore username lookup failed (likely permission denied). Falling back to deterministic email.', error);
        const cleanUsername = email.toLowerCase().replace(/[^a-z0-9]/g, '');
        email = `${cleanUsername}@mahibereahaw.local`;
      }
    }

    let userCredential;
    try {
      console.log(`Attempting login with authenticated email: ${email}`);
      userCredential = await signInWithEmailAndPassword(
        auth,
        email,
        credentials.password
      );
    } catch (error: any) {
      console.error('Firebase Auth Error:', error);
      if (error.code === 'auth/invalid-login-credentials' || error.code === 'auth/wrong-password' || error.code === 'auth/user-not-found') {
        throw new Error('Invalid username, email, or password. Please try again.');
      } else if (error.code === 'auth/invalid-email') {
        throw new Error('The email or username format is invalid.');
      }
      throw error;
    }

    const firebaseUser = userCredential.user;

    // Fetch additional user data from Firestore if needed
    const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
    const userData = userDoc.exists() ? userDoc.data() : {};

    const user: User = {
      id: firebaseUser.uid,
      username: firebaseUser.email?.split('@')[0] || 'user',
      email: firebaseUser.email || '',
      role: userData.role || 'user',
      firstName: userData.firstName,
      lastName: userData.lastName,
      fullName: userData.fullName || `${userData.firstName || ''} ${userData.lastName || ''}`.trim() || 'Church Member',
      phone: userData.phone,
      hierarchyLevel: userData.hierarchyLevel || 'Atbiya',
      ministryType: userData.ministryType || 'General',
    };

    const token = await firebaseUser.getIdToken();

    // Store token and user for compatibility with existing code
    localStorage.setItem('auth_token', token);
    localStorage.setItem('user', JSON.stringify(user));

    return { token, user };
  },

  async logout(): Promise<void> {
    await signOut(auth);
    localStorage.removeItem('auth_token');
    localStorage.removeItem('user');
  },

  async getCurrentUser(): Promise<User> {
    return new Promise((resolve, reject) => {
      const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
        unsubscribe();
        if (firebaseUser) {
          const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
          const userData = userDoc.exists() ? userDoc.data() : {};

          const user: User = {
            id: firebaseUser.uid,
            username: firebaseUser.email?.split('@')[0] || 'user',
            email: firebaseUser.email || '',
            role: userData.role || 'user',
            firstName: userData.firstName,
            lastName: userData.lastName,
            fullName: userData.fullName || `${userData.firstName || ''} ${userData.lastName || ''}`.trim() || 'Church Member',
            phone: userData.phone,
            hierarchyLevel: userData.hierarchyLevel || 'Atbiya',
            ministryType: userData.ministryType || 'General',
          };

          localStorage.setItem('user', JSON.stringify(user));
          resolve(user);
        } else {
          reject(new Error('No user authenticated'));
        }
      });
    });
  },

  getStoredUser(): User | null {
    const userStr = localStorage.getItem('user');
    if (!userStr) return null;
    try {
      return JSON.parse(userStr);
    } catch {
      return null;
    }
  },

  getToken(): string | null {
    return localStorage.getItem('auth_token');
  },

  isAuthenticated(): boolean {
    return !!auth.currentUser || !!this.getToken();
  },

  clearAuth(): void {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('user');
  },

  async changePassword(data: { currentPassword: string; newPassword: string }): Promise<void> {
    // Firebase password change requires re-authentication or different flow
    // For now, leaving it as is or using a simplified version if possible
    if (auth.currentUser) {
      // This is a simplified version, real one needs re-auth
      throw new Error('Password change requires re-authentication');
    }
  },
};
