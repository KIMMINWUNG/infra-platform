// --- /src/contexts/AuthContext.jsx ---
import React, { useState, useEffect, createContext } from 'react';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from '../firebase/config';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [isAdmin, setIsAdmin] = useState(false);
    const [userData, setUserData] = useState(null);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
            if (firebaseUser) {
                if (firebaseUser.email === 'alsdnd8842@kalis.or.kr') {
                    setUser(firebaseUser);
                    setIsAdmin(true);
                    setUserData({ name: '관리자' });
                } else {
                    const userDocRef = doc(db, 'users', firebaseUser.uid);
                    const userDocSnap = await getDoc(userDocRef);
                    
                    if (userDocSnap.exists() && userDocSnap.data().approved) {
                        setUser(firebaseUser);
                        setIsAdmin(false);
                        setUserData({ id: userDocSnap.id, ...userDocSnap.data() });
                    } else {
                        const creationTime = new Date(firebaseUser.metadata.creationTime);
                        const now = new Date();
                        const isNewUser = (now.getTime() - creationTime.getTime()) < 5000;

                        if (!isNewUser) {
                            await signOut(auth);
                        }
                        setUser(null);
                        setIsAdmin(false);
                        setUserData(null);
                    }
                }
            } else {
                setUser(null);
                setIsAdmin(false);
                setUserData(null);
            }
            setLoading(false);
        });
        return () => unsubscribe();
    }, []);

    const value = { user, isAdmin, userData, loading };

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
};