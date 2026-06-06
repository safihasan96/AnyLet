import { create } from 'zustand';
import { 
    signInWithEmailAndPassword, 
    createUserWithEmailAndPassword, 
    signOut, 
    onAuthStateChanged,
    reload,
    sendEmailVerification
} from 'firebase/auth';
import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';
import { auth, db } from '../firebase';
import { generateReferralCode } from '../utils/referral';

export const useAuthStore = create((set, get) => {
    // We set up a state object
    return {
        currentUser: null,
        userProfile: null,
        userRole: null,
        loading: true,

        login: async (email, password) => {
            return await signInWithEmailAndPassword(auth, email, password);
        },

        signup: async (email, password, additionalData) => {
            const userCredential = await createUserWithEmailAndPassword(auth, email, password);
            const user = userCredential.user;
            
            const profileData = {
                email: user.email,
                role: 'client',
                accountStatus: 'active',
                createdAt: new Date(),
                referralCode: generateReferralCode(user.email),
                referralWallet: { available: 0, withdrawn: 0 },
                ...additionalData
            };

            await setDoc(doc(db, "users", user.uid), profileData);
            return userCredential;
        },

        logout: async () => {
            return await signOut(auth);
        },

        refreshUser: async () => {
            if (auth.currentUser) {
                await reload(auth.currentUser);
                set({ currentUser: { ...auth.currentUser } });
            }
        },

        updateProfile: async (patch) => {
            const user = auth.currentUser;
            if (!user) throw new Error("No authenticated user found.");
            
            const docRef = doc(db, 'users', user.uid);
            await updateDoc(docRef, patch);
            
            set(state => ({
                userProfile: { ...state.userProfile, ...patch }
            }));
        },

        initializeListener: () => {
            const unsubscribe = onAuthStateChanged(auth, async (user) => {
                if (user) {
                    // Normalize user object to avoid non-serializable warning
                    const serializedUser = {
                        uid: user.uid,
                        email: user.email,
                        emailVerified: user.emailVerified,
                        displayName: user.displayName,
                        photoURL: user.photoURL,
                    };

                    set({ currentUser: serializedUser });

                    try {
                        const userRef = doc(db, 'users', user.uid);
                        const docSnap = await getDoc(userRef);

                        if (docSnap.exists()) {
                            const data = docSnap.data();
                            
                            // Check if referral code backfill is needed
                            const needsBackfill = !data.referralCode || !data.referralWallet;
                            if (needsBackfill) {
                                const patch = {};
                                if (!data.referralCode) patch.referralCode = generateReferralCode(user.email);
                                if (!data.referralWallet) patch.referralWallet = { available: 0, withdrawn: 0 };
                                updateDoc(userRef, patch).catch(() => {});
                                data.referralCode = data.referralCode || patch.referralCode;
                                data.referralWallet = data.referralWallet || patch.referralWallet;
                            }

                            set({ 
                                userProfile: data, 
                                userRole: data.role || 'client',
                                loading: false 
                            });
                        } else if (user.email === 'safi.has.official@gmail.com') {
                            // Synchronize missing superadmin profile
                            const superadminData = {
                                email: user.email,
                                role: "admin",
                                isAdmin: true,
                                accessLevel: "superadmin",
                                fullName: "Safi Hasan",
                                accountStatus: "active",
                                createdAt: new Date(),
                                referralCode: generateReferralCode(user.email),
                                referralWallet: { available: 0, withdrawn: 0 },
                            };
                            await setDoc(userRef, superadminData);
                            set({ 
                                userProfile: superadminData, 
                                userRole: 'admin',
                                loading: false 
                            });
                        } else {
                            set({ userProfile: null, userRole: null, loading: false });
                        }
                    } catch (error) {
                        console.error("Zustand Auth: error fetching profile:", error);
                        set({ userProfile: null, userRole: 'client', loading: false });
                    }
                } else {
                    set({ currentUser: null, userProfile: null, userRole: null, loading: false });
                }
            });

            return unsubscribe;
        }
    };
});
