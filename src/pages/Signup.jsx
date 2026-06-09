import { useState, useEffect } from 'react';
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
    ShieldCheck, RefreshCw, ArrowLeft, Gift, Loader2
} from 'lucide-react';
import { generateReferralCode, clearStoredReferralCode } from '../utils/referral';

// Inline Google logo SVG
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

export default function Signup() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [googleLoading, setGoogleLoading] = useState(false);
    const [refBanner, setRefBanner] = useState('');
    const [agreeTerms, setAgreeTerms] = useState(false);

    const { signup, createUserDoc, signInWithGoogle } = useAuth();
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const refCode = searchParams.get('ref') || '';

    useEffect(() => {
        if (!refCode) return;
        const lookupRef = async () => {
            const snap = await getDocs(query(collection(db, 'users'), where('referralCode', '==', refCode)));
            if (!snap.empty) setRefBanner(snap.docs[0].data().fullName || 'a friend');
        };
        lookupRef().catch(console.error);
    }, [refCode]);

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

            // Resolve referrer
            let referrerId = null;
            if (refCode) {
                const snap = await getDocs(query(collection(db, 'users'), where('referralCode', '==', refCode)));
                if (!snap.empty && snap.docs[0].id !== user.uid) {
                    referrerId = snap.docs[0].id;
                }
            }

            // Write user doc with onboarding fields
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
                // Onboarding pipeline
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

    async function handleGoogleSignup(e) {
        if (e) e.preventDefault();
        setError('');
        // Do not set loading state here; state updates can cause browsers to lose the user-click context and block the popup.
        try {
            await signInWithGoogle();
            setGoogleLoading(true);
            // signInWithGoogle creates the user doc — redirect to onboarding
            navigate('/onboarding');
        } catch (err) {
            if (err.code === 'auth/unauthorized-domain') {
                setError('Google Sign-In failed: This domain is not authorized. Please add it in Firebase Console > Authentication > Settings > Authorized domains.');
            } else if (err.code === 'auth/popup-blocked') {
                setError('Google Sign-In failed: Popup blocked by your browser. Please disable popup blockers or use a standard browser like Chrome or Safari.');
            } else if (err.code !== 'auth/popup-closed-by-user') {
                console.error("Google Auth Error:", err);
                setError(`Google sign-up failed: ${err.message}`);
            }
        } finally {
            setGoogleLoading(false);
        }
    }

    return (
        <div className="flex flex-col min-h-screen bg-[#f8fafc] dark:bg-slate-950 p-6 relative overflow-hidden">
            <header className="flex items-center mb-6 relative z-10">
                <button
                    onClick={() => navigate(-1)}
                    className="p-2.5 rounded-2xl bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-[#1a227f]/10 hover:text-[#1a227f] transition-all active:scale-95 border border-slate-100 dark:border-slate-700 shadow-sm"
                >
                    <ArrowLeft size={20} strokeWidth={3} />
                </button>
            </header>

            <div className="absolute -top-24 -right-24 size-96 bg-[#1a227f]/5 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute -bottom-24 -left-24 size-96 bg-[#1a227f]/5 rounded-full blur-3xl pointer-events-none" />

            <div className="flex-1 flex flex-col justify-center max-w-sm mx-auto w-full z-10">
                <div className="flex items-center gap-2 mb-10">
                    <div className="size-10 bg-[#1a227f] rounded-2xl flex items-center justify-center text-white shadow-lg shadow-[#1a227f]/30">
                        <HomeIcon size={22} fill="currentColor" />
                    </div>
                    <h2 className="text-xl font-[900] uppercase tracking-tighter text-[#1a227f] dark:text-indigo-400">AnyLet</h2>
                </div>

                {refBanner && (
                    <div className="flex items-center gap-3 bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-100 dark:border-indigo-800 rounded-2xl p-4 mb-6">
                        <div className="size-9 bg-indigo-100 dark:bg-indigo-900 rounded-xl flex items-center justify-center text-indigo-600 shrink-0">
                            <Gift size={18} />
                        </div>
                        <div>
                            <p className="text-[11px] font-black uppercase tracking-widest text-indigo-700 dark:text-indigo-300">Referral Invite</p>
                            <p className="text-xs font-bold text-indigo-600 dark:text-indigo-400">
                                <span className="capitalize">{refBanner}</span> invited you to join AnyLet!
                            </p>
                        </div>
                    </div>
                )}

                <div className="mb-8">
                    <h1 className="text-3xl font-[900] text-slate-900 dark:text-white mb-2 uppercase tracking-tight">Create <br />Account</h1>
                    <p className="text-slate-500 font-bold text-[10px] uppercase tracking-widest">Start your property journey today.</p>
                </div>

                {error && (
                    <div className="p-4 bg-rose-50 dark:bg-rose-950/30 text-rose-500 rounded-2xl font-bold text-sm mb-6 border border-rose-100 dark:border-rose-900/50 flex items-center gap-3">
                        <ShieldCheck size={18} className="shrink-0" /> {error}
                    </div>
                )}

                {/* Google Sign-Up */}
                <button
                    onClick={handleGoogleSignup}
                    disabled={googleLoading || loading}
                    className="w-full flex items-center justify-center gap-3 py-4 bg-white dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 rounded-2xl font-black text-slate-700 dark:text-white text-sm hover:border-slate-300 transition-all active:scale-95 disabled:opacity-60 mb-4 shadow-sm"
                >
                    {googleLoading ? <Loader2 size={18} className="animate-spin text-slate-400" /> : <GoogleLogo />}
                    Continue with Google
                </button>

                <div className="flex items-center gap-3 mb-4">
                    <div className="flex-1 h-px bg-slate-200 dark:bg-slate-800" />
                    <span className="text-xs font-black text-slate-300 dark:text-slate-600 uppercase tracking-widest">or</span>
                    <div className="flex-1 h-px bg-slate-200 dark:bg-slate-800" />
                </div>

                <form onSubmit={handleSignup} className="space-y-4">
                    <InputField
                        icon={Mail} type="email" name="email"
                        autoComplete="email" placeholder="Email Address"
                        value={email} onChange={(e) => setEmail(e.target.value)}
                    />
                    <InputField
                        icon={Lock} type="password" name="password"
                        autoComplete="new-password" placeholder="Create Password (min 6 chars)"
                        value={password} onChange={(e) => setPassword(e.target.value)}
                    />

                    <label className="flex items-start gap-3 mt-4 cursor-pointer group">
                        <div className="relative flex items-center justify-center mt-0.5">
                            <input
                                type="checkbox"
                                checked={agreeTerms}
                                onChange={(e) => setAgreeTerms(e.target.checked)}
                                className="peer appearance-none w-5 h-5 border-2 border-slate-300 dark:border-slate-600 rounded-md checked:bg-[#1a227f] checked:border-[#1a227f] transition-all"
                            />
                            <ShieldCheck size={14} className="absolute text-white opacity-0 peer-checked:opacity-100 pointer-events-none transition-opacity" strokeWidth={3} />
                        </div>
                        <span className="text-[11px] font-bold text-slate-500 leading-snug">
                            By signing up, I agree to AnyLet's <a href="#" className="text-[#1a227f] dark:text-indigo-400 hover:underline">Terms of Service</a> and acknowledge the <a href="#" className="text-[#1a227f] dark:text-indigo-400 hover:underline">Privacy Policy</a>.
                        </span>
                    </label>

                    <button
                        disabled={loading}
                        className="w-full bg-[#1a227f] text-white font-[900] py-[18px] rounded-2xl shadow-xl shadow-[#1a227f]/20 flex items-center justify-center gap-2 transition-all active:scale-95 disabled:opacity-70 mt-6"
                    >
                        {loading
                            ? <><Loader2 className="animate-spin" size={20} /> Creating Account...</>
                            : <>'CREATE ACCOUNT' <ArrowRight size={20} /></>
                        }
                    </button>
                </form>

                <div className="mt-10 text-center">
                    <p className="text-slate-400 font-bold text-[10px] uppercase tracking-widest">
                        Already have an account?{' '}
                        <Link to="/login" className="text-[#1a227f] dark:text-indigo-400 font-black ml-1">Log In</Link>
                    </p>
                </div>
            </div>
        </div>
    );
}

function InputField({ icon: Icon, ...props }) {
    return (
        <div className="relative group">
            <Icon className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-[#1a227f] dark:text-indigo-400 transition-colors" size={20} strokeWidth={2.5} />
            <input
                {...props}
                className="w-full bg-white dark:bg-slate-900 border-2 border-slate-100 dark:border-slate-800 rounded-2xl py-4 pl-12 pr-4 font-bold text-slate-900 dark:text-white placeholder:text-slate-300 outline-none focus:border-[#1a227f]/50 transition-all"
                required
            />
        </div>
    );
}
