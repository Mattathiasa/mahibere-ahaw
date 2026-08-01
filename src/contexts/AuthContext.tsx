import React, { createContext, useContext, useEffect, useState } from 'react';
import { auth, db } from '@/lib/firebase';
import { onAuthStateChanged, User as FirebaseUser } from 'firebase/auth';
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
                try {
                    const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
                    const userData = userDoc.exists() ? userDoc.data() : {};

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
                localStorage.removeItem('auth_token');
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
