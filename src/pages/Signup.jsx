import { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { db } from '../firebase';
import {
    doc, setDoc, collection, query,
    where, getDocs, updateDoc, arrayUnion, serverTimestamp
} from 'firebase/firestore';
import { sendEmailVerification } from 'firebase/auth';
import {
    Mail, Lock, User, ArrowRight, Home as HomeIcon,
    ShieldCheck, RefreshCw, ArrowLeft, Gift
} from 'lucide-react';
import { generateReferralCode, clearStoredReferralCode } from '../utils/referral';

export default function Signup() {
    const [email, setEmail]         = useState('');
    const [password, setPassword]   = useState('');
    const [fullName, setFullName]   = useState('');
    const [error, setError]         = useState('');
    const [loading, setLoading]     = useState(false);
    const [refBanner, setRefBanner] = useState('');

    const { signup } = useAuth();
    const navigate   = useNavigate();
    const [searchParams] = useSearchParams();

    // ── Read `?ref=` from URL on mount ─────────────────────────────────────
    const refCode = searchParams.get('ref') || '';

    useEffect(() => {
        if (!refCode) return;
        // Validate that a user with this referral code actually exists
        const lookupRef = async () => {
            const usersRef = collection(db, 'users');
            const q = query(usersRef, where('referralCode', '==', refCode));
            const snap = await getDocs(q);
            if (!snap.empty) {
                const referrer = snap.docs[0].data();
                setRefBanner(referrer.fullName || 'a friend');
            }
        };
        lookupRef().catch(console.error);
    }, [refCode]);

    async function handleSignup(e) {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            const userCredential = await signup(email, password);
            const user = userCredential.user;

            // Generate this new user's own referral code
            const myCode = generateReferralCode(email);

            // ── Resolve referrer from code ──────────────────────────────────
            let referrerId = null;
            if (refCode) {
                const usersRef = collection(db, 'users');
                const q = query(usersRef, where('referralCode', '==', refCode));
                const snap = await getDocs(q);

                if (!snap.empty) {
                    const referrerDoc = snap.docs[0];
                    // Anti-fraud: cannot refer yourself
                    if (referrerDoc.id !== user.uid) {
                        referrerId = referrerDoc.id;
                    }
                }
            }

            // ── Write new user document ─────────────────────────────────────
            await setDoc(doc(db, 'users', user.uid), {
                fullName,
                email,
                role: 'user',
                accountStatus: 'active',
                emailVerified: false,
                createdAt: serverTimestamp(),
                referralCode: myCode,
                // Only set referredBy if we found a valid, non-self referrer
                ...(referrerId ? { referredBy: referrerId } : {}),
                // Wallet initialised at zero
                referralWallet: {
                    available: 0,
                    withdrawn: 0,
                },
            });

            // ── If a referrer exists, record this signup in their doc ──────
            if (referrerId) {
                await updateDoc(doc(db, 'users', referrerId), {
                    refereeIds: arrayUnion(user.uid),
                });
            }

            clearStoredReferralCode();
            await sendEmailVerification(user);
            navigate('/');
        } catch (err) {
            console.error(err);
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

    return (
        <div className="flex flex-col min-h-screen bg-[#f8fafc] dark:bg-slate-950 p-6 relative overflow-hidden">
            <header className="flex items-center mb-6 relative z-10">
                <button
                    onClick={() => navigate(-1)}
                    className="p-2.5 rounded-2xl bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-primary/10 hover:text-primary dark:text-indigo-400 transition-all active:scale-95 border border-slate-100 dark:border-slate-700 shadow-sm"
                >
                    <ArrowLeft size={20} strokeWidth={3} />
                </button>
            </header>

            {/* background blobs */}
            <div className="absolute -top-24 -right-24 size-96 bg-primary/5 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute -bottom-24 -left-24 size-96 bg-primary/5 rounded-full blur-3xl pointer-events-none" />

            <div className="flex-1 flex flex-col justify-center max-w-sm mx-auto w-full z-10">

                {/* Logo */}
                <div className="flex items-center gap-2 mb-10 translate-y-[-20%]">
                    <div className="size-10 bg-primary rounded-2xl flex items-center justify-center text-white shadow-lg shadow-primary/30">
                        <HomeIcon size={22} fill="currentColor" />
                    </div>
                    <h2 className="text-xl font-[900] uppercase tracking-tighter text-primary dark:text-indigo-400">Any.Let</h2>
                </div>

                {/* Referral banner */}
                {refBanner && (
                    <div className="flex items-center gap-3 bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-100 dark:border-indigo-800 rounded-2xl p-4 mb-6">
                        <div className="size-9 bg-indigo-100 dark:bg-indigo-900 rounded-xl flex items-center justify-center text-indigo-600 shrink-0">
                            <Gift size={18} />
                        </div>
                        <div>
                            <p className="text-[11px] font-black uppercase tracking-widest text-indigo-700 dark:text-indigo-300">Referral Invite</p>
                            <p className="text-xs font-bold text-indigo-600 dark:text-indigo-400">
                                <span className="capitalize">{refBanner}</span> invited you to join Any.Let!
                            </p>
                        </div>
                    </div>
                )}

                {/* Heading */}
                <div className="mb-10">
                    <h1 className="text-3xl font-[900] text-slate-900 dark:text-white mb-2 uppercase tracking-tight">
                        Create <br /> Account
                    </h1>
                    <p className="text-slate-500 font-bold text-[10px] uppercase tracking-widest leading-none">
                        Start your property journey today.
                    </p>
                </div>

                {error && (
                    <div className="p-4 bg-rose-50 dark:bg-rose-950/30 text-rose-500 rounded-2xl font-bold text-sm mb-6 border border-rose-100 dark:border-rose-900/50 flex items-center gap-3">
                        <ShieldCheck size={18} className="shrink-0" />
                        {error}
                    </div>
                )}

                <form onSubmit={handleSignup} className="space-y-4">
                    <InputField
                        icon={User} type="text" name="fullName"
                        autoComplete="name" placeholder="Full Name"
                        value={fullName} onChange={(e) => setFullName(e.target.value)}
                    />
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

                    <button
                        disabled={loading}
                        className="w-full bg-primary text-white font-[900] py-[18px] rounded-2xl shadow-xl shadow-primary/20 flex items-center justify-center gap-2 transition-all active:scale-95 disabled:opacity-70 mt-6"
                    >
                        {loading
                            ? <><RefreshCw className="animate-spin" size={20} /> Creating Account...</>
                            : <>'CREATE ACCOUNT' <ArrowRight size={20} /></>
                        }
                    </button>
                </form>

                <div className="mt-12 text-center">
                    <p className="text-slate-400 font-bold text-[10px] uppercase tracking-widest">
                        Already have an account?{' '}
                        <Link to="/login" className="text-primary dark:text-indigo-400 font-black ml-1">Log In</Link>
                    </p>
                </div>
            </div>
        </div>
    );
}

function InputField({ icon: Icon, ...props }) {
    return (
        <div className="relative group">
            <Icon
                className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-primary dark:text-indigo-400 transition-colors"
                size={20} strokeWidth={2.5}
            />
            <input
                {...props}
                className="w-full bg-white dark:bg-slate-900 border-2 border-slate-100 dark:border-slate-800 rounded-2xl py-4 pl-12 pr-4 font-bold text-slate-900 dark:text-white placeholder:text-slate-300 outline-none focus:border-primary/50 transition-all"
                required
            />
        </div>
    );
}
