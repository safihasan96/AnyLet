import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { db } from '../firebase';
import { doc, setDoc } from 'firebase/firestore';
import { sendEmailVerification } from 'firebase/auth';
import { Mail, Lock, User, ArrowRight, Home as HomeIcon, CheckCircle2, ShieldCheck, RefreshCw } from 'lucide-react';

export default function Signup() {
    const [email, setEmail]       = useState('');
    const [password, setPassword] = useState('');
    const [fullName, setFullName] = useState('');
    const [error, setError]       = useState('');
    const [loading, setLoading]   = useState(false);
    const [done, setDone]         = useState(false);
    const { signup } = useAuth();
    const navigate = useNavigate();

    async function handleSignup(e) {
        e.preventDefault();
        setError('');
        setLoading(true);
        try {
            const userCredential = await signup(email, password);

            // Save user profile to Firestore
            await setDoc(doc(db, 'users', userCredential.user.uid), {
                fullName,
                email,
                role: 'user',
                accountStatus: 'active',
                emailVerified: false,
                createdAt: new Date().toISOString(),
            });

            // Send Firebase's own verification email — no config needed
            await sendEmailVerification(userCredential.user);

            setDone(true);
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

    // ── Success / Verify Email Screen ──────────────────────────────────────
    if (done) {
        return (
            <div className="flex flex-col min-h-screen bg-[#f8fafc] dark:bg-slate-950 p-6 items-center justify-center">
                <div className="max-w-sm w-full text-center">

                    {/* Animated success ring */}
                    <div className="relative mb-8 inline-flex">
                        <div className="size-28 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">
                            <CheckCircle2 size={52} className="text-emerald-500" strokeWidth={1.5} />
                        </div>
                        <div className="absolute inset-0 rounded-full border-4 border-emerald-400/30 animate-ping" />
                    </div>

                    <h1 className="text-2xl font-[900] text-slate-900 dark:text-white mb-3 tracking-tight">
                        Check Your Email!
                    </h1>
                    <p className="text-slate-500 dark:text-slate-400 font-semibold text-sm mb-2 leading-relaxed">
                        We've sent a verification link to
                    </p>
                    <div className="px-5 py-2.5 bg-primary/10 rounded-2xl inline-block mb-6">
                        <span className="text-primary font-black text-sm">{email}</span>
                    </div>
                    <p className="text-slate-400 dark:text-slate-500 text-xs text-center font-semibold mb-10 max-w-[260px] mx-auto">
                        Click the link in the email to verify your account, then log in.
                    </p>

                    <button
                        onClick={() => navigate('/login')}
                        className="w-full bg-primary text-white font-[900] py-[18px] rounded-2xl shadow-xl shadow-primary/20 flex items-center justify-center gap-2 transition-all active:scale-95"
                    >
                        Go to Login <ArrowRight size={20} />
                    </button>
                    <p className="text-slate-300 dark:text-slate-700 text-[10px] font-bold uppercase tracking-widest mt-6">
                        Didn't receive it? Check your spam folder
                    </p>
                </div>
            </div>
        );
    }

    // ── Signup Form ─────────────────────────────────────────────────────────
    return (
        <div className="flex flex-col min-h-screen bg-[#f8fafc] dark:bg-slate-950 p-6 relative overflow-hidden">
            <div className="absolute -top-24 -right-24 size-96 bg-primary/5 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute -bottom-24 -left-24 size-96 bg-primary/5 rounded-full blur-3xl pointer-events-none" />

            <div className="flex-1 flex flex-col justify-center max-w-sm mx-auto w-full z-10">

                {/* Logo */}
                <div className="flex items-center gap-2 mb-10 translate-y-[-20%]">
                    <div className="size-10 bg-primary rounded-2xl flex items-center justify-center text-white shadow-lg shadow-primary/30">
                        <HomeIcon size={22} fill="currentColor" />
                    </div>
                    <h2 className="text-xl font-[900] uppercase tracking-tighter text-primary">Any.Let</h2>
                </div>

                {/* Heading */}
                <div className="mb-10">
                    <h1 className="text-3xl font-[900] text-slate-900 dark:text-white mb-2 uppercase tracking-tight">
                        Create <br /> Account
                    </h1>
                    <p className="text-slate-500 font-bold text-[10px] uppercase tracking-widest leading-none">
                        Start your property journey today.
                    </p>
                </div>

                {/* Error */}
                {error && (
                    <div className="p-4 bg-rose-50 dark:bg-rose-950/30 text-rose-500 rounded-2xl font-bold text-sm mb-6 border border-rose-100 dark:border-rose-900/50 flex items-center gap-3">
                        <ShieldCheck size={18} className="shrink-0" />
                        {error}
                    </div>
                )}

                {/* Form */}
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
                        <Link to="/login" className="text-primary font-black ml-1">Log In</Link>
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
                className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-primary transition-colors"
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
