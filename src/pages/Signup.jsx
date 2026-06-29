import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { db, auth } from '../firebase';
import {
    doc, setDoc, collection, query,
    where, getDocs, updateDoc, arrayUnion, serverTimestamp
} from 'firebase/firestore';
import { sendEmailVerification } from 'firebase/auth';
import {
    Mail, Lock, ArrowRight, Home as HomeIcon,
    ShieldCheck, ArrowLeft, Gift, Loader2,
    ChevronDown, Users, CheckCircle2, XCircle, Tag
} from 'lucide-react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { generateReferralCode, clearStoredReferralCode } from '../utils/referral';
import logger from '../utils/logger';

// ─── Animation Variants (defined outside component — Framer Motion rule #1) ───
const pageVariants = {
    hidden: { opacity: 0, y: 24 },
    visible: {
        opacity: 1,
        y: 0,
        transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1], staggerChildren: 0.07 }
    },
};

const itemVariants = {
    hidden: { opacity: 0, y: 16 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.45, ease: [0.22, 1, 0.36, 1] } },
};

const bannerVariants = {
    hidden: { opacity: 0, scale: 0.95, y: -8 },
    visible: { opacity: 1, scale: 1, y: 0, transition: { type: 'spring', stiffness: 320, damping: 22 } },
    exit: { opacity: 0, scale: 0.95, y: -8, transition: { duration: 0.2 } },
};

const expandVariants = {
    hidden: { height: 0, opacity: 0 },
    visible: {
        height: 'auto',
        opacity: 1,
        transition: { duration: 0.38, ease: [0.22, 1, 0.36, 1] }
    },
    exit: {
        height: 0,
        opacity: 0,
        transition: { duration: 0.25, ease: [0.4, 0, 1, 1] }
    },
};

const statusVariants = {
    hidden: { opacity: 0, y: 6, scale: 0.95 },
    visible: { opacity: 1, y: 0, scale: 1, transition: { type: 'spring', stiffness: 350, damping: 22 } },
    exit: { opacity: 0, y: -4, scale: 0.95, transition: { duration: 0.15 } },
};

// ─── Google Logo ────────────────────────────────────────────────────────────────
function GoogleLogo() {
    return (
        <svg width="20" height="20" viewBox="0 0 48 48" fill="none">
            <path fill="#FFC107" d="M43.611 20.083H42V20H24v8h11.303c-1.649 4.657-6.08 8-11.303 8-6.627 0-12-5.373-12-12s5.373-12 12-12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 12.955 4 4 12.955 4 24s8.955 20 20 20 20-8.955 20-20c0-1.341-.138-2.65-.389-3.917z" />
            <path fill="#FF3D00" d="M6.306 14.691l6.571 4.819C14.655 15.108 18.961 12 24 12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 16.318 4 9.656 8.337 6.306 14.691z" />
            <path fill="#4CAF50" d="M24 44c5.166 0 9.86-1.977 13.409-5.192l-6.19-5.238A11.91 11.91 0 0 1 24 36c-5.202 0-9.619-3.317-11.283-7.946l-6.522 5.025C9.505 39.556 16.227 44 24 44z" />
            <path fill="#1976D2" d="M43.611 20.083H42V20H24v8h11.303a12.04 12.04 0 0 1-4.087 5.571l.003-.002 6.19 5.238C36.971 39.205 44 34 44 24c0-1.341-.138-2.65-.389-3.917z" />
        </svg>
    );
}

// ─── Referral Code Status Types ──────────────────────────────────────────────
const REF_STATUS = { IDLE: 'idle', CHECKING: 'checking', VALID: 'valid', INVALID: 'invalid' };

export default function Signup() {
    const shouldReduceMotion = useReducedMotion();

    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [googleLoading, setGoogleLoading] = useState(false);
    const [agreeTerms, setAgreeTerms] = useState(false);

    // Referral state
    const [referrerBannerName, setReferrerBannerName] = useState(''); // auto-detected from URL
    const [referralOpen, setReferralOpen] = useState(false);
    const [manualRefCode, setManualRefCode] = useState('');
    const [refStatus, setRefStatus] = useState(REF_STATUS.IDLE);
    const [refName, setRefName] = useState('');
    const [refDebounce, setRefDebounce] = useState(null);

    const { signup, signInWithGoogle } = useAuth();
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const urlRefCode = searchParams.get('ref') || '';

    // Active referral code: URL takes priority, otherwise manual input
    const activeRefCode = urlRefCode || (refStatus === REF_STATUS.VALID ? manualRefCode : '');

    // ── Auto-detect referral from URL ─────────────────────────────────────────
    useEffect(() => {
        if (!urlRefCode) return;
        const lookupRef = async () => {
            const snap = await getDocs(query(collection(db, 'users'), where('referralCode', '==', urlRefCode)));
            if (!snap.empty) setReferrerBannerName(snap.docs[0].data().fullName || snap.docs[0].data().displayName || 'a friend');
        };
        lookupRef().catch(console.error);
    }, [urlRefCode]);

    // ── Debounced referral code validation ────────────────────────────────────
    useEffect(() => {
        if (!manualRefCode.trim() || urlRefCode) {
            setRefStatus(REF_STATUS.IDLE);
            setRefName('');
            return;
        }
        if (refDebounce) clearTimeout(refDebounce);
        setRefStatus(REF_STATUS.CHECKING);
        const t = setTimeout(async () => {
            try {
                const snap = await getDocs(query(
                    collection(db, 'users'),
                    where('referralCode', '==', manualRefCode.trim().toLowerCase())
                ));
                if (!snap.empty) {
                    const data = snap.docs[0].data();
                    const name = data.fullName || data.displayName || data.personalDetails?.firstName || 'a friend';
                    setRefName(name);
                    setRefStatus(REF_STATUS.VALID);
                } else {
                    setRefStatus(REF_STATUS.INVALID);
                    setRefName('');
                }
            } catch (err) {
                logger.error("Referral check error:", err);
                // If it's a permission/app-check error, don't falsely claim the code is invalid
                if (err.code?.includes('permission-denied') || err.message?.includes('AppCheck')) {
                    setRefStatus(REF_STATUS.IDLE);
                    setError("Security verification failed. Please check your AppCheck configuration.");
                } else {
                    setRefStatus(REF_STATUS.INVALID);
                }
            }
        }, 700);
        setRefDebounce(t);
        return () => clearTimeout(t);
    }, [manualRefCode, urlRefCode]);

    const handleBack = () => {
        navigate('/', { replace: true });
    };

    // ── Email/Password Signup ─────────────────────────────────────────────────
    async function handleSignup(e) {
        e.preventDefault();
        setError('');
        if (!agreeTerms) {
            setError('You must agree to the Terms and Conditions to sign up.');
            return;
        }
        setLoading(true);
        try {
            const userCredential = await signup(email, password);
            const user = userCredential.user;
            const myCode = generateReferralCode(email);

            // Resolve referrer (URL ref takes priority over manual)
            let referrerId = null;
            const codeToUse = urlRefCode || (refStatus === REF_STATUS.VALID ? manualRefCode.trim().toLowerCase() : '');
            if (codeToUse) {
                const snap = await getDocs(query(collection(db, 'users'), where('referralCode', '==', codeToUse)));
                if (!snap.empty && snap.docs[0].id !== user.uid) {
                    referrerId = snap.docs[0].id;
                }
            }

            await setDoc(doc(db, 'users', user.uid), {
                email,
                uid: user.uid,
                role: 'user',
                accountStatus: 'active',
                emailVerified: false,
                createdAt: serverTimestamp(),
                referralCode: myCode,
                referralWallet: { available: 0, withdrawn: 0 },
                ...(referrerId ? { referredBy: referrerId } : {}),
                onboardingStep: 'personal_details',
                onboardingStatus: 'IN_PROGRESS',
                userRole: 'tenant',
                personalDetails: { firstName: '', lastName: '', dateOfBirth: '', phoneNumber: '', isPhoneVerified: false },
                verification: { idDocumentUrl: '', isKycApproved: false, submittedAt: null },
            });

            if (referrerId) {
                await updateDoc(doc(db, 'users', referrerId), { refereeIds: arrayUnion(user.uid) });
            }

            clearStoredReferralCode();
            await sendEmailVerification(user);
            navigate('/verify-email');
        } catch (err) {
            if (err.code === 'auth/email-already-in-use') {
                setError('This email is already registered. Please log in instead.');
            } else if (err.code === 'auth/weak-password') {
                setError('Password must be at least 6 characters.');
            } else if (err.code === 'auth/invalid-email') {
                setError('Please enter a valid email address.');
            } else {
                setError('Something went wrong. Please try again.');
            }
        } finally {
            setLoading(false);
        }
    }

    // ── Google Signup ─────────────────────────────────────────────────────────
    async function handleGoogleSignup(e) {
        if (e) e.preventDefault();
        setError('');
        const codeToUse = urlRefCode || (refStatus === REF_STATUS.VALID ? manualRefCode.trim().toLowerCase() : '');
        try {
            await signInWithGoogle(codeToUse);
            setGoogleLoading(true);
            navigate('/onboarding');
        } catch (err) {
            if (err.code === 'auth/unauthorized-domain') {
                setError('Google Sign-In failed: This domain is not authorized. Add it in Firebase Console → Authentication → Settings → Authorized domains.');
            } else if (err.code === 'auth/popup-blocked') {
                setError('Popup blocked. Disable popup blockers and try again.');
            } else if (err.code !== 'auth/popup-closed-by-user') {
                logger.error('Google Auth Error:', err);
                setError(`Google sign-up failed: ${err.message}`);
            }
        } finally {
            setGoogleLoading(false);
        }
    }

    // ─────────────────────────────────────────────────────────────────────────
    return (
        <div className="flex flex-col min-h-screen relative overflow-hidden bg-transparent">
            <div className="flex flex-col min-h-screen p-6 relative z-10">
                {/* Back button */}
                <motion.header
                    className="flex items-center mb-6"
                    initial={shouldReduceMotion ? false : { opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
                >
                    <motion.button
                        onClick={handleBack}
                        whileHover={{ scale: 1.05, y: -1 }}
                        whileTap={{ scale: 0.93 }}
                        className="p-2.5 rounded-2xl bg-white dark:bg-slate-800 text-slate-500 dark:text-slate-300 border border-slate-100 dark:border-slate-700 shadow-sm hover:shadow-md hover:border-slate-200 hover:text-primary dark:hover:text-indigo-400 transition-all duration-200"
                        aria-label="Go back"
                    >
                        <ArrowLeft size={20} strokeWidth={2.5} />
                    </motion.button>
                </motion.header>

                <motion.div
                    className="flex-1 flex flex-col justify-center max-w-sm mx-auto w-full"
                    variants={shouldReduceMotion ? {} : pageVariants}
                    initial="hidden"
                    animate="visible"
                >
                    {/* Logo mark */}
                    <motion.div variants={itemVariants} className="flex items-center gap-2.5 mb-10">
                        <div className="size-10 bg-primary rounded-2xl flex items-center justify-center shadow-lg shadow-primary/30">
                            <HomeIcon size={20} fill="white" className="text-white" />
                        </div>
                        <h2 className="text-xl font-[900] uppercase tracking-tighter text-primary dark:text-indigo-400">AnyLet</h2>
                    </motion.div>

                    {/* URL-based referral banner */}
                    <AnimatePresence>
                        {referrerBannerName && (
                            <motion.div
                                key="url-ref-banner"
                                variants={shouldReduceMotion ? {} : bannerVariants}
                                initial="hidden"
                                animate="visible"
                                exit="exit"
                                className="flex items-center gap-3 bg-gradient-to-r from-indigo-50 to-violet-50 dark:from-indigo-950/50 dark:to-violet-950/30 border border-indigo-100 dark:border-indigo-800/60 rounded-2xl p-4 mb-6 shadow-sm"
                            >
                                <div className="size-9 bg-indigo-100 dark:bg-indigo-900/60 rounded-xl flex items-center justify-center text-indigo-600 dark:text-indigo-400 shrink-0">
                                    <Gift size={17} />
                                </div>
                                <div>
                                    <p className="text-[10px] font-black uppercase tracking-widest text-indigo-500 dark:text-indigo-400 mb-0.5">Referral Invite</p>
                                    <p className="text-xs font-bold text-slate-700 dark:text-slate-200">
                                        <span className="capitalize text-indigo-700 dark:text-indigo-300">{referrerBannerName}</span> invited you to AnyLet!
                                    </p>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {/* Heading */}
                    <motion.div variants={itemVariants} className="mb-8">
                        <h1 className="text-[2.1rem] font-[900] text-slate-900 dark:text-white mb-2 leading-[1.1] tracking-tight uppercase">
                            Create<br />Account
                        </h1>
                        <p className="text-slate-400 font-bold text-[10px] uppercase tracking-[0.15em]">Start your property journey today.</p>
                    </motion.div>

                    {/* Error banner */}
                    <AnimatePresence>
                        {error && (
                            <motion.div
                                key="error"
                                variants={shouldReduceMotion ? {} : statusVariants}
                                initial="hidden"
                                animate="visible"
                                exit="exit"
                                role="alert"
                                className="p-4 bg-rose-50 dark:bg-rose-950/30 text-rose-600 dark:text-rose-400 rounded-2xl font-bold text-sm mb-5 border border-rose-100 dark:border-rose-900/60 flex items-center gap-3"
                            >
                                <ShieldCheck size={17} className="shrink-0" /> {error}
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {/* Google Sign-Up */}
                    <motion.div variants={itemVariants}>
                        <motion.button
                            onClick={handleGoogleSignup}
                            disabled={googleLoading || loading}
                            whileHover={{ scale: 1.01, y: -1, boxShadow: '0 8px 24px rgba(0,0,0,0.08)' }}
                            whileTap={{ scale: 0.97 }}
                            className="w-full flex items-center justify-center gap-3 py-[15px] bg-white dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 rounded-2xl font-black text-slate-700 dark:text-white text-sm hover:border-slate-300 dark:hover:border-slate-600 transition-colors disabled:opacity-60 mb-4 shadow-sm"
                        >
                            {googleLoading ? <Loader2 size={18} className="animate-spin text-slate-400" /> : <GoogleLogo />}
                            Continue with Google
                        </motion.button>
                    </motion.div>

                    {/* Divider */}
                    <motion.div variants={itemVariants} className="flex items-center gap-3 mb-4">
                        <div className="flex-1 h-px bg-slate-200 dark:bg-slate-800" />
                        <span className="text-[10px] font-black text-slate-300 dark:text-slate-600 uppercase tracking-widest">or</span>
                        <div className="flex-1 h-px bg-slate-200 dark:bg-slate-800" />
                    </motion.div>

                    {/* Email/Password Form */}
                    <motion.form onSubmit={handleSignup} className="space-y-3.5" variants={itemVariants}>
                        <InputField
                            icon={Mail} type="email" name="email"
                            autoComplete="email" placeholder="Email Address"
                            value={email} onChange={(e) => setEmail(e.target.value)}
                        />
                        <InputField
                            icon={Lock} type="password" name="password"
                            autoComplete="new-password" placeholder="Create Password (min. 6 chars)"
                            value={password} onChange={(e) => setPassword(e.target.value)}
                        />

                        {/* ── REFERRAL SECTION ─────────────────────────────────── */}
                        {!urlRefCode && (
                            <div className="rounded-2xl border border-slate-100 dark:border-slate-800 bg-white/80 dark:bg-slate-900/60 backdrop-blur-sm overflow-hidden shadow-sm">
                                {/* Toggle trigger */}
                                <motion.button
                                    type="button"
                                    onClick={() => setReferralOpen(o => !o)}
                                    whileHover={{ backgroundColor: 'rgba(99,102,241,0.04)' }}
                                    whileTap={{ scale: 0.99 }}
                                    className="w-full flex items-center justify-between px-4 py-3.5 text-left transition-colors"
                                    aria-expanded={referralOpen}
                                    aria-controls="referral-panel"
                                >
                                    <div className="flex items-center gap-2.5">
                                        <div className="size-7 rounded-xl bg-indigo-50 dark:bg-indigo-900/40 flex items-center justify-center">
                                            <Users size={14} className="text-indigo-500 dark:text-indigo-400" />
                                        </div>
                                        <div>
                                            <p className="text-[11px] font-black text-slate-700 dark:text-slate-200 uppercase tracking-wider">Have a referral code?</p>
                                            {refStatus === REF_STATUS.VALID && (
                                                <p className="text-[10px] font-bold text-emerald-500">✓ Code applied</p>
                                            )}
                                        </div>
                                    </div>
                                    <motion.div
                                        animate={{ rotate: referralOpen ? 180 : 0 }}
                                        transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
                                    >
                                        <ChevronDown size={16} className="text-slate-400" />
                                    </motion.div>
                                </motion.button>

                                {/* Expandable content */}
                                <AnimatePresence initial={false}>
                                    {referralOpen && (
                                        <motion.div
                                            id="referral-panel"
                                            key="referral-panel"
                                            variants={shouldReduceMotion ? {} : expandVariants}
                                            initial="hidden"
                                            animate="visible"
                                            exit="exit"
                                            style={{ overflow: 'hidden' }}
                                        >
                                            <div className="px-4 pb-4 space-y-3">
                                                <div className="h-px bg-slate-100 dark:bg-slate-800" />

                                                {/* Promo copy */}
                                                <div className="flex items-start gap-2.5 p-3 bg-indigo-50/70 dark:bg-indigo-950/30 rounded-xl border border-indigo-100 dark:border-indigo-900/50">
                                                    <Tag size={14} className="text-indigo-500 shrink-0 mt-0.5" />
                                                    <p className="text-[11px] font-semibold text-indigo-700 dark:text-indigo-300 leading-relaxed">
                                                        Enter your referrer's code to give them a <span className="font-black">2% commission</span> on your future payments — at no extra cost to you.
                                                    </p>
                                                </div>

                                                {/* Code input */}
                                                <div className="space-y-1.5 group">
                                                    <label className="text-xs font-black uppercase tracking-widest text-slate-500 dark:text-slate-400 group-focus-within:text-primary dark:group-focus-within:text-indigo-400 transition-colors block ml-1">
                                                        Referral Code
                                                    </label>
                                                    <div className="relative">
                                                        <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-primary dark:group-focus-within:text-indigo-400 transition-colors">
                                                            <Gift size={17} strokeWidth={2} />
                                                        </div>
                                                        <input
                                                            type="text"
                                                            inputMode="text"
                                                            placeholder="e.g. john-doe-a3f9"
                                                            value={manualRefCode}
                                                            onChange={(e) => setManualRefCode(e.target.value)}
                                                            autoComplete="off"
                                                            spellCheck={false}
                                                            className="w-full bg-slate-50 dark:bg-[#0A0C10] border-2 border-transparent rounded-2xl py-[15px] pl-10 pr-10 font-bold text-slate-900 dark:text-white placeholder:text-slate-300 dark:placeholder:text-slate-700 outline-none focus:border-primary/30 dark:focus:border-indigo-500/30 transition-all text-sm"
                                                        />
                                                    {/* Status icon — right side */}
                                                    <div className="absolute right-3.5 top-1/2 -translate-y-1/2">
                                                        <AnimatePresence mode="wait">
                                                            {refStatus === REF_STATUS.CHECKING && (
                                                                <motion.div key="checking" variants={statusVariants} initial="hidden" animate="visible" exit="exit">
                                                                    <Loader2 size={16} className="animate-spin text-slate-400" />
                                                                </motion.div>
                                                            )}
                                                            {refStatus === REF_STATUS.VALID && (
                                                                <motion.div key="valid" variants={statusVariants} initial="hidden" animate="visible" exit="exit">
                                                                    <CheckCircle2 size={17} className="text-emerald-500" />
                                                                </motion.div>
                                                            )}
                                                            {refStatus === REF_STATUS.INVALID && (
                                                                <motion.div key="invalid" variants={statusVariants} initial="hidden" animate="visible" exit="exit">
                                                                    <XCircle size={17} className="text-rose-400" />
                                                                </motion.div>
                                                            )}
                                                        </AnimatePresence>
                                                    </div>
                                                </div>
                                            </div>

                                                {/* Validation feedback */}
                                                <AnimatePresence>
                                                    {refStatus === REF_STATUS.VALID && (
                                                        <motion.div
                                                            key="ref-valid"
                                                            variants={shouldReduceMotion ? {} : statusVariants}
                                                            initial="hidden"
                                                            animate="visible"
                                                            exit="exit"
                                                            className="flex items-center gap-2 px-3 py-2.5 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-100 dark:border-emerald-900/50 rounded-xl"
                                                        >
                                                            <CheckCircle2 size={13} className="text-emerald-500 shrink-0" />
                                                            <p className="text-[11px] font-bold text-emerald-700 dark:text-emerald-400">
                                                                Referred by <span className="capitalize">{refName}</span> — code applied!
                                                            </p>
                                                        </motion.div>
                                                    )}
                                                    {refStatus === REF_STATUS.INVALID && manualRefCode.length > 2 && (
                                                        <motion.div
                                                            key="ref-invalid"
                                                            variants={shouldReduceMotion ? {} : statusVariants}
                                                            initial="hidden"
                                                            animate="visible"
                                                            exit="exit"
                                                            className="flex items-center gap-2 px-3 py-2.5 bg-rose-50 dark:bg-rose-950/30 border border-rose-100 dark:border-rose-900/50 rounded-xl"
                                                        >
                                                            <XCircle size={13} className="text-rose-400 shrink-0" />
                                                            <p className="text-[11px] font-bold text-rose-600 dark:text-rose-400">
                                                                Code not found. Check for typos and try again.
                                                            </p>
                                                        </motion.div>
                                                    )}
                                                </AnimatePresence>
                                            </div>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>
                        )}

                        {/* Terms & Conditions */}
                        <label className="flex items-start gap-3 pt-1 cursor-pointer group" id="agree-terms-label">
                            <div className="relative flex items-center justify-center mt-0.5 shrink-0">
                                <input
                                    id="agree-terms"
                                    type="checkbox"
                                    checked={agreeTerms}
                                    onChange={(e) => setAgreeTerms(e.target.checked)}
                                    className="peer appearance-none w-5 h-5 border-2 border-slate-300 dark:border-slate-600 rounded-md checked:bg-primary checked:border-primary transition-all cursor-pointer"
                                    aria-label="Agree to Terms and Conditions"
                                />
                                <ShieldCheck size={12} className="absolute text-white opacity-0 peer-checked:opacity-100 pointer-events-none transition-opacity" strokeWidth={3} />
                            </div>
                            <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 leading-snug">
                                By signing up, I agree to AnyLet's{' '}
                                <a href="#" className="text-primary dark:text-indigo-400 font-black hover:underline">Terms of Service</a>
                                {' '}and{' '}
                                <a href="#" className="text-primary dark:text-indigo-400 font-black hover:underline">Privacy Policy</a>.
                            </span>
                        </label>

                        {/* Submit */}
                        <motion.button
                            disabled={loading}
                            whileHover={loading ? {} : { scale: 1.01, y: -1, boxShadow: '0 16px 40px rgba(var(--color-primary),0.28)' }}
                            whileTap={loading ? {} : { scale: 0.97 }}
                            className="w-full bg-primary text-white font-[900] py-[18px] rounded-2xl shadow-xl shadow-primary/20 flex items-center justify-center gap-2 transition-colors disabled:opacity-70 mt-2 uppercase tracking-wide text-sm"
                        >
                            {loading
                                ? <><Loader2 className="animate-spin" size={18} /> Creating Account...</>
                                : <>Create Account <ArrowRight size={18} /></>
                            }
                        </motion.button>
                    </motion.form>

                    {/* Login link */}
                    <motion.div variants={itemVariants} className="mt-8 text-center">
                        <p className="text-slate-400 font-bold text-[10px] uppercase tracking-widest">
                            Already have an account?{' '}
                            <Link to="/login" className="text-primary dark:text-indigo-400 font-black ml-1 hover:underline">Log In</Link>
                        </p>
                    </motion.div>
                </motion.div>
            </div>
        </div>
    );
}

// ─── Reusable Input Field ─────────────────────────────────────────────────────
function InputField({ icon: Icon, name, placeholder, ...props }) {
    // Generate a readable label from the name attribute
    const labelText = name === 'email' ? 'Email Address' :
                      name === 'password' ? 'Password' :
                      name.charAt(0).toUpperCase() + name.slice(1);

    return (
        <div className="space-y-1.5 group">
            <label className="text-xs font-black uppercase tracking-widest text-slate-500 dark:text-slate-400 group-focus-within:text-primary dark:group-focus-within:text-indigo-400 transition-colors block ml-1">
                {labelText}
            </label>
            <div className="relative">
                <Icon
                    className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-primary dark:text-slate-500 dark:group-focus-within:text-indigo-400 transition-colors"
                    size={18}
                    strokeWidth={2}
                />
                <input
                    name={name}
                    placeholder={placeholder}
                    {...props}
                    className="w-full bg-slate-50 dark:bg-[#0A0C10] border-2 border-transparent rounded-2xl py-[15px] pl-11 pr-4 font-bold text-slate-900 dark:text-white placeholder:text-slate-300 dark:placeholder:text-slate-700 outline-none focus:border-primary/30 dark:focus:border-indigo-500/30 transition-all text-sm"
                    required
                />
            </div>
        </div>
    );
}
