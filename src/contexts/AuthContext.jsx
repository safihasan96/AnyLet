import { createContext, useContext, useEffect, useState } from 'react';
import {
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    signOut,
    onAuthStateChanged,
    reload
} from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { auth, db } from '../firebase';
import LoadingScreen from '../components/LoadingScreen';

const AuthContext = createContext();

export function useAuth() {
    return useContext(AuthContext);
}

export function AuthProvider({ children }) {
    const [currentUser, setCurrentUser] = useState(null);
    const [userRole, setUserRole] = useState(null);
    const [userData, setUserData] = useState(null);
    const [loading, setLoading] = useState(true);

    async function signup(email, password, additionalData) {
        try {
            const userCredential = await createUserWithEmailAndPassword(auth, email, password);
            const user = userCredential.user;

            // Create a user document in Firestore
            await setDoc(doc(db, "users", user.uid), {
                email: user.email,
                createdAt: new Date(),
                ...additionalData
            });

            return userCredential;
        } catch (error) {
            throw error;
        }
    }

    async function login(email, password) {
        try {
            const userCredential = await signInWithEmailAndPassword(auth, email, password);
            return userCredential;
        } catch (error) {
            throw error;
        }
    }

    function logout() {
        return signOut(auth);
    }

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (user) => {
            setCurrentUser(user);
            if (user) {
                try {
                    const userRef = doc(db, 'users', user.uid);
                    const docSnap = await getDoc(userRef);

                    if (docSnap.exists()) {
                        const data = docSnap.data();
                        setUserData(data);
                        setUserRole(data.role || 'client');
                    } else if (user.email === 'safi.has.official@gmail.com') {
                        // Critical Synchronization: Superadmin document missing, creating it now.
                        const superadminData = {
                            email: user.email,
                            role: "admin",
                            isAdmin: true,
                            accessLevel: "superadmin",
                            fullName: "Safi Hasan",
                            accountStatus: "active",
                            createdAt: new Date()
                        };
                        await setDoc(userRef, superadminData);
                        setUserData(superadminData);
                        setUserRole("admin");
                        console.log("Superadmin session synchronized with Firestore.");
                    } else {
                        setUserData(null);
                        setUserRole(null);
                    }
                } catch (error) {
                    console.error("Error fetching user role inside AuthContext:", error);
                    setUserData(null);
                    setUserRole('client');
                }
            } else {
                setUserData(null);
                setUserRole(null);
            }
            setLoading(false);
        });

        return unsubscribe;
    }, []);

    async function refreshUser() {
        if (auth.currentUser) {
            await reload(auth.currentUser);
            setCurrentUser({ ...auth.currentUser });
        }
    }

    const value = {
        currentUser,
        userRole,
        userData,
        userProfile: userData, 
        login,
        signup,
        logout,
        refreshUser,
        loading
    };

    return (
        <AuthContext.Provider value={value}>
            {loading ? <LoadingScreen /> : children}
        </AuthContext.Provider>
    );
}
