import React, { createContext, useContext, useEffect, useState } from 'react';
import { auth, db } from '@/lib/firebase';
import { onAuthStateChanged, User as FirebaseUser, signOut } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { User } from '@/types';

interface AuthContextType {
    user: User | null;
    loading: boolean;
    isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
            if (firebaseUser) {
                // An anonymous session is not an app identity. The public
                // suggestion box signs a visitor in anonymously for the length
                // of one submission, so firestore.rules can pin `authorUid` to
                // a real uid instead of accepting writes from nobody at all.
                //
                // Returning HERE, above the read, is what makes that work. The
                // branch below signs out any account with no users/{uid}
                // document — which an anonymous visitor never has — so falling
                // through would cancel the very session the submission is about
                // to be written under, and every suggestion would be denied.
                // Skipping the getDoc also saves a read that is certain to come
                // back empty.
                //
                // `user` stays null and `isAuthenticated` stays false, so
                // ProtectedRoute and AdminRoute keep sending these visitors to
                // /login exactly as they do today.
                if (firebaseUser.isAnonymous) {
                    setUser(null);
                    localStorage.removeItem('user');
                    setLoading(false);
                    return;
                }

                try {
                    const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
                    const userData = userDoc.exists() ? userDoc.data() : {};

                    // A missing document is NOT a default active member. Every
                    // field below falls back to something permissive, so an
                    // account whose record was deleted used to restore as an
                    // active Atbiya-level user and walk straight past
                    // ProtectedRoute — into an app where the rules then denied
                    // every read, which looks like breakage rather than a
                    // closed door. Fresh sign-in already refuses this case in
                    // authService.login; the restore path did not.
                    if (!userDoc.exists()) {
                        await signOut(auth).catch(() => {});
                        setUser(null);
                        localStorage.removeItem('user');
                        setLoading(false);
                        return;
                    }

                    const user: User = {
                        id: firebaseUser.uid,
                        username: userData.username || firebaseUser.email?.split('@')[0] || 'user',
                        email: firebaseUser.email || '',
                        role: userData.role || 'user',
                        fullNameEnglish: userData.fullNameEnglish,
                        fullNameAmharic: userData.fullNameAmharic,
                        fullName: userData.fullNameEnglish || userData.fullName || `${userData.firstName || ''} ${userData.lastName || ''}`.trim() || 'Church Member',
                        phone: userData.phone || userData.phoneNumber,
                        dateOfBirth: userData.dateOfBirth,
                        hierarchyLevel: userData.hierarchyLevel || 'Atbiya',
                        // Org placement — previously dropped here, which left
                        // every parish-scoping check falling back to the user's
                        // own uid and silently seeing nothing.
                        hierarchyEntityId: userData.hierarchyEntityId,
                        atbiyaId: userData.atbiyaId,
                        atbiyaName: userData.atbiyaName,
                        mahderatId: userData.mahderatId,
                        // Membership approval state. A missing field means the
                        // account predates sign-up and is therefore active.
                        status: userData.status || 'active',
                        ministryType: userData.ministryType,
                        churchRoles: userData.churchRoles,
                        workSchool: userData.workSchool,
                        maritalStatus: userData.maritalStatus,
                        hasChildren: userData.hasChildren,
                        childrenCount: userData.childrenCount,
                        gender: userData.gender,
                        address: userData.address,
                        createdAt: userData.createdAt,
                        updatedAt: userData.updatedAt,
                        profilePicture: userData.profilePicture,
                        // Both are written by their own pages and were read back
                        // from here — but were never mapped, so every saved
                        // preference reverted on the next reload.
                        notificationPreferences: userData.notificationPreferences,
                        volunteerMinistries: userData.volunteerMinistries,
                        calendarPreference: userData.calendarPreference,
                    };

                    setUser(user);
                    localStorage.setItem('user', JSON.stringify(user));
                } catch (error) {
                    console.error('Error fetching user data:', error);
                    setUser(null);
                }
            } else {
                setUser(null);
                localStorage.removeItem('user');
            }
            setLoading(false);
        });

        return () => unsubscribe();
    }, []);

    return (
        <AuthContext.Provider value={{ user, loading, isAuthenticated: !!user }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuthContext = () => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuthContext must be used within an AuthProvider');
    }
    return context;
};
