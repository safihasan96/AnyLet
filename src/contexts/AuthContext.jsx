import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import {
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    signInWithPopup,
    linkWithCredential,
    fetchSignInMethodsForEmail,
    OAuthProvider,
    signOut,
    onAuthStateChanged,
    reload
} from 'firebase/auth';
import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';
import { auth, db, googleProvider } from '../firebase';
import { generateReferralCode } from '../utils/referral';
import LoadingScreen from '../components/LoadingScreen';

const AuthContext = createContext();

export function useAuth() {
    return useContext(AuthContext);
}

// Default onboarding fields for new users
function buildDefaultOnboarding() {
    return {
        onboardingStep: 'personal_details',
        onboardingStatus: 'IN_PROGRESS',
        userRole: 'tenant',
        personalDetails: {
            firstName: '',
            lastName: '',
            dateOfBirth: '',
            phoneNumber: '',
            isPhoneVerified: false,
        },
        verification: {
            idDocumentUrl: '',
            isKycApproved: false,
            submittedAt: null,
        },
    };
}

// Backfill existing users who don't have onboarding fields
function needsOnboardingBackfill(data) {
    return !data.onboardingStep;
}

export function AuthProvider({ children }) {
    const [currentUser, setCurrentUser] = useState(null);
    const [userRole, setUserRole] = useState(null);
    const [userData, setUserData] = useState(null);
    const [loading, setLoading] = useState(true);

    // ── Derived convenience flags ────────────────────────────────────────────
    const onboardingStep = userData?.onboardingStep ?? null;
    const isPhoneVerified = userData?.personalDetails?.isPhoneVerified ?? false;
    const isOnboarded = userData?.onboardingStep === 'completed';

    // ── Core Signup (email/password) ─────────────────────────────────────────
    async function signup(email, password) {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        return userCredential;
    }

    // ── Write new user doc to Firestore ──────────────────────────────────────
    async function createUserDoc(user, overrides = {}) {
        const myCode = generateReferralCode(user.email || user.uid);
        const base = {
            email: user.email || '',
            uid: user.uid,
            role: 'user',
            accountStatus: 'active',
            emailVerified: user.emailVerified || false,
            createdAt: new Date(),
            referralCode: myCode,
            referralWallet: { available: 0, withdrawn: 0 },
            ...buildDefaultOnboarding(),
            ...overrides,
        };
        await setDoc(doc(db, 'users', user.uid), base);
        return base;
    }

    // ── Core Login (email/password) ──────────────────────────────────────────
    async function login(email, password) {
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        return userCredential;
    }

    // ── Google Sign-In (with auto account-linking) ───────────────────────────
    async function signInWithGoogle() {
        try {
            const result = await signInWithPopup(auth, googleProvider);
            const user = result.user;

            const userRef = doc(db, 'users', user.uid);
            const snap = await getDoc(userRef);

            if (!snap.exists()) {
                // Brand-new user via Google → create doc + start onboarding
                const newDoc = await createUserDoc(user, {
                    displayName: user.displayName || '',
                    photoURL: user.photoURL || '',
                    emailVerified: true, // Google accounts are pre-verified
                    providers: ['google'],
                });
                setUserData(newDoc);
                setUserRole('user');
            } else {
                // Existing user → merge providers list
                const data = snap.data();
                const providers = data.providers || [];
                if (!providers.includes('google')) {
                    await updateDoc(userRef, { providers: [...providers, 'google'] });
                }
                // Backfill onboarding fields for pre-existing users
                if (needsOnboardingBackfill(data)) {
                    await updateDoc(userRef, buildDefaultOnboarding());
                }
            }

            return result;
        } catch (err) {
            // ── Auto account-linking: same email registered via password ──────
            if (err.code === 'auth/account-exists-with-different-credential') {
                const email = err.customData?.email;
                if (email) {
                    const methods = await fetchSignInMethodsForEmail(auth, email);
                    if (methods.includes('password')) {
                        // Signal caller to ask for password to link accounts
                        const linkError = new Error('LINK_REQUIRED');
                        linkError.code = 'auth/link-required';
                        linkError.email = email;
                        linkError.pendingCredential = OAuthProvider.credentialFromError(err);
                        throw linkError;
                    }
                }
            }
            throw err;
        }
    }

    // ── Link pending Google credential after password login ──────────────────
    async function linkGoogleAfterPassword(password, email, pendingCredential) {
        const result = await signInWithEmailAndPassword(auth, email, password);
        await linkWithCredential(result.user, pendingCredential);
        const userRef = doc(db, 'users', result.user.uid);
        const data = (await getDoc(userRef)).data() || {};
        const providers = data.providers || ['password'];
        if (!providers.includes('google')) {
            await updateDoc(userRef, { providers: [...providers, 'google'] });
        }
        return result;
    }

    // ── Update user profile fields ───────────────────────────────────────────
    const updateUserProfile = useCallback(async (fields) => {
        if (!auth.currentUser) return;
        const userRef = doc(db, 'users', auth.currentUser.uid);
        await updateDoc(userRef, fields);
        setUserData(prev => {
            if (!prev) return prev;
            // Deep merge for nested objects like personalDetails
            const next = { ...prev };
            for (const [k, v] of Object.entries(fields)) {
                if (typeof v === 'object' && v !== null && !Array.isArray(v) && typeof prev[k] === 'object') {
                    next[k] = { ...prev[k], ...v };
                } else {
                    next[k] = v;
                }
            }
            return next;
        });
    }, []);

    // ── Logout ───────────────────────────────────────────────────────────────
    function logout() {
        return signOut(auth);
    }

    // ── Auth state listener ──────────────────────────────────────────────────
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
                        setUserRole(data.role || 'user');

                        // Backfill referral fields
                        const patch = {};
                        if (!data.referralCode) patch.referralCode = generateReferralCode(user.email || user.uid);
                        if (!data.referralWallet) patch.referralWallet = { available: 0, withdrawn: 0 };
                        // Backfill onboarding fields for pre-existing users (non-blocking)
                        if (needsOnboardingBackfill(data)) {
                            Object.assign(patch, buildDefaultOnboarding());
                        }
                        if (Object.keys(patch).length > 0) {
                            updateDoc(userRef, patch).catch(() => {});
                        }
                    } else if (user.email === 'safi.has.official@gmail.com') {
                        const superadminData = {
                            email: user.email,
                            role: 'admin',
                            isAdmin: true,
                            accessLevel: 'superadmin',
                            fullName: 'Safi Hasan',
                            accountStatus: 'active',
                            createdAt: new Date(),
                            referralCode: generateReferralCode(user.email),
                            referralWallet: { available: 0, withdrawn: 0 },
                            onboardingStep: 'completed',
                            onboardingStatus: 'COMPLETED',
                        };
                        await setDoc(userRef, superadminData);
                        setUserData(superadminData);
                        setUserRole('admin');
                    } else {
                        setUserData(null);
                        setUserRole(null);
                    }
                } catch (error) {
                    console.error('AuthContext error:', error);
                    setUserData(null);
                    setUserRole('user');
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
        onboardingStep,
        isPhoneVerified,
        isOnboarded,
        login,
        signup,
        logout,
        refreshUser,
        signInWithGoogle,
        linkGoogleAfterPassword,
        updateUserProfile,
        createUserDoc,
        loading,
    };

    return (
        <AuthContext.Provider value={value}>
            {loading ? <LoadingScreen /> : children}
        </AuthContext.Provider>
    );
}
