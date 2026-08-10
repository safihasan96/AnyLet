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
import { doc, getDoc, setDoc, updateDoc, getDocs, query, collection, where, arrayUnion } from 'firebase/firestore';
import { auth, db, googleProvider } from '../firebase';
import { generateReferralCode } from '../utils/referral';
import SplashScreen from '../components/SplashScreen';
import { AnimatePresence } from 'framer-motion';
import logger from '../utils/logger';

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
    const [splashFinished, setSplashFinished] = useState(() => {
        if (typeof window !== 'undefined') {
            if (sessionStorage.getItem('splashPlayed')) return true;
            if (window.location.pathname !== '/') {
                sessionStorage.setItem('splashPlayed', 'true');
                return true;
            }
        }
        return false;
    });

    const handleSplashComplete = useCallback(() => {
        if (typeof window !== 'undefined') {
            sessionStorage.setItem('splashPlayed', 'true');
        }
        setSplashFinished(true);
    }, []);

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
    async function signInWithGoogle(refCode = '') {
        try {
            const result = await signInWithPopup(auth, googleProvider);
            const user = result.user;

            const userRef = doc(db, 'users', user.uid);
            const snap = await getDoc(userRef);

            if (!snap.exists()) {
                // Resolve referrer
                let referrerId = null;
                if (refCode) {
                    const refSnap = await getDocs(query(collection(db, 'users'), where('referralCode', '==', refCode)));
                    if (!refSnap.empty && refSnap.docs[0].id !== user.uid) {
                        referrerId = refSnap.docs[0].id;
                    }
                }

                // Brand-new user via Google → create doc + start onboarding
                const newDoc = await createUserDoc(user, {
                    displayName: user.displayName || '',
                    photoURL: user.photoURL || '',
                    emailVerified: true, // Google accounts are pre-verified
                    providers: ['google'],
                    ...(referrerId ? { referredBy: referrerId } : {})
                });

                if (referrerId) {
                    await updateDoc(doc(db, 'users', referrerId), { refereeIds: arrayUnion(user.uid) });
                }

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
                    const token = await user.getIdTokenResult();
                    const isAdminClaim = !!token.claims.admin;

                    const userRef = doc(db, 'users', user.uid);
                    let docSnap;
                    try {
                        docSnap = await getDoc(userRef);
                    } catch (readErr) {
                        // A stale auth/App Check token can make the first read of the
                        // user's own doc fail with permission-denied. Force a token
                        // refresh and retry once before giving up.
                        if (readErr?.code === 'permission-denied') {
                            await user.getIdToken(true);
                            docSnap = await getDoc(userRef);
                        } else {
                            throw readErr;
                        }
                    }

                    if (docSnap.exists()) {
                        const data = docSnap.data();
                        setUserData(data);
                        setUserRole(isAdminClaim ? 'admin' : (data.role || 'user'));

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
                    } else {
                        setUserData(null);
                        setUserRole(isAdminClaim ? 'admin' : null);
                    }
                } catch (error) {
                    logger.error('AuthContext error:', error);
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
            <AnimatePresence>
                {!splashFinished && (
                    <SplashScreen key="splash" onComplete={handleSplashComplete} />
                )}
            </AnimatePresence>
            {!loading && children}
        </AuthContext.Provider>
    );
}
