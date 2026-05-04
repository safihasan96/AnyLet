import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { db } from '../firebase';
import { doc, setDoc } from 'firebase/firestore';
import { sendEmailVerification } from 'firebase/auth';
import { Mail, Lock, User, ArrowRight, Home as HomeIcon, CheckCircle2, ShieldCheck, RefreshCw } from 'lucide-react';

export default function Signup() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [fullName, setFullName] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [done, setDone] = useState(false);
    const { signup } = useAuth();
    const navigate = useNavigate();

    async function handleSignup(e) {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            const userCredential = await signup(email, password);

            // Save user data to Firestore
            await setDoc(doc(db, 'users', userCredential.user.uid), {
                fullName,
                email,
                role: 'user',
                accountStatus: 'active',
                emailVerified: false,
                createdAt: new Date().toISOString()
            });

            // Send Firebase's built-in verification email
            await sendEmailVerification(userCredential.user);

            setDone(true);
        } catch (err) {
            console.error(err);
            if (err.code === 'auth/email-already-in-use') {
                setError('This email is already registered. Please log in instead.');
            } else if (err.code === 'auth/weak-password') {
                setError('Password must be at least 6 characters.');
            } else {
                setError('Failed to create account. Please try again.');
            }
        } finally {
            setLoading(false);
        }
    }

    if (done) {
        return (
            <div className="flex flex-col min-h-screen bg-[#f8fafc] dark:bg-slate-950 p-6 items-center justify-center">
                <div className="max-w-sm w-full text-center">
                    <div className="size-20 bg-emerald-100 dark:bg-emerald-900/30 rounded-full flex items-center justify-center mx-auto mb-6">
                        <CheckCircle2 size={40} className="text-emerald-500" strokeWidth={2} />
                    </div>
                    <h1 className="text-2xl font-[900] text-slate-900 dark:text-white mb-3 tracking-tight">Account Created!</h1>
                    <p className="text-slate-500 font-semibold text-sm mb-8 leading-relaxed">
                        We've sent a verification link to <span className="text-primary font-bold">{email}</span>.
                        Please check your inbox and click the link to verify your account.
                    </p>
                    <button
                        onClick={() => navigate('/login')}
                        className="w-full bg-primary text-white font-[900] py-[18px] rounded-2xl shadow-xl shadow-primary/20 flex items-center justify-center gap-2 transition-all active:scale-95"
                    >
                        Go to Login <ArrowRight size={20} />
                    </button>
                    <p className="text-slate-400 font-bold text-[10px] uppercase tracking-widest mt-6">
                        Didn't receive it? Check your spam folder.
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className="flex flex-col min-h-screen bg-[#f8fafc] dark:bg-slate-950 p-6 relative overflow-hidden">
            {/* Design Graphics */}
            <div className="absolute -top-24 -right-24 size-96 bg-primary/5 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute -bottom-24 -left-24 size-96 bg-primary/5 rounded-full blur-3xl pointer-events-none" />

            <div className="flex-1 flex flex-col justify-center max-w-sm mx-auto w-full z-10">
                <div className="flex items-center gap-2 mb-10 translate-y-[-20%]">
                    <div className="size-10 bg-primary rounded-2xl flex items-center justify-center text-white shadow-lg shadow-primary/30">
                        <HomeIcon size={22} fill="currentColor" />
                    </div>
                    <h2 className="text-xl font-[900] uppercase tracking-tighter text-primary">Any.Let</h2>
                </div>

                <div className="mb-10">
                    <h1 className="text-3xl font-[900] text-slate-900 dark:text-white mb-2 uppercase tracking-tight">
                        Create <br /> Account
                    </h1>
                    <p className="text-slate-500 font-bold text-[10px] uppercase tracking-widest leading-none">
                        Start your property journey today.
                    </p>
                </div>

                {error && (
                    <div className="p-4 bg-rose-50 dark:bg-rose-950/30 text-rose-500 rounded-2xl font-black text-[10px] uppercase tracking-wider mb-6 border border-rose-100 dark:border-rose-900/50 flex items-center gap-3">
                        <ShieldCheck size={18} className="shrink-0" />
                        {error}
                    </div>
                )}

                <form onSubmit={handleSignup} className="space-y-4">
                    <div className="space-y-4">
                        <InputField
                            icon={User}
                            type="text"
                            name="fullName"
                            autoComplete="name"
                            placeholder="Full Name"
                            value={fullName}
                            onChange={(e) => setFullName(e.target.value)}
                        />
                        <InputField
                            icon={Mail}
                            type="email"
                            name="email"
                            autoComplete="email"
                            placeholder="Email Address"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                        />
                        <InputField
                            icon={Lock}
                            type="password"
                            name="password"
                            autoComplete="new-password"
                            placeholder="Create Password (min 6 chars)"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                        />
                    </div>

                    <button
                        disabled={loading}
                        className="w-full bg-primary text-white font-[900] py-[18px] rounded-2xl shadow-xl shadow-primary/20 flex items-center justify-center gap-2 transition-all active:scale-95 disabled:opacity-70 mt-6"
                    >
                        {loading ? <RefreshCw className="animate-spin" size={20} /> : 'CREATE ACCOUNT'}
                        {!loading && <ArrowRight size={20} />}
                    </button>
                </form>

                <div className="mt-12 text-center">
                    <p className="text-slate-400 font-bold text-[10px] uppercase tracking-widest">
                        Already have an account? <Link to="/login" className="text-primary font-black ml-1">Log In</Link>
                    </p>
                </div>
            </div>
        </div>
    );
}

function InputField({ icon: Icon, ...props }) {
    return (
        <div className="relative group">
            <Icon className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-primary transition-colors" size={20} strokeWidth={2.5} />
            <input
                {...props}
                className="w-full bg-white dark:bg-slate-900 border-2 border-slate-100 dark:border-slate-800 rounded-2xl py-4 pl-12 pr-4 font-bold text-slate-900 dark:text-white placeholder:text-slate-300 outline-none focus:border-primary/50 transition-all"
                required
            />
        </div>
    );
}
