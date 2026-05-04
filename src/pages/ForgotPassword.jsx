import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { auth } from '../firebase';
import { sendPasswordResetEmail } from 'firebase/auth';
import { Mail, ArrowLeft, RefreshCw, CheckCircle2, Home as HomeIcon } from 'lucide-react';

export default function ForgotPassword() {
    const [email, setEmail]   = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError]   = useState('');
    const [sent, setSent]     = useState(false);
    const navigate = useNavigate();

    async function handleSubmit(e) {
        e.preventDefault();
        setError('');
        setLoading(true);
        try {
            await sendPasswordResetEmail(auth, email);
            setSent(true);
        } catch (err) {
            console.error(err);
            if (err.code === 'auth/user-not-found') {
                setError('No account found with this email address.');
            } else if (err.code === 'auth/invalid-email') {
                setError('Please enter a valid email address.');
            } else {
                setError('Something went wrong. Please try again.');
            }
        } finally {
            setLoading(false);
        }
    }

    // ── Success State ──────────────────────────────────────────────────────
    if (sent) {
        return (
            <div className="flex flex-col min-h-screen bg-[#f8fafc] dark:bg-slate-950 p-6 items-center justify-center">

                {/* Animated success ring */}
                <div className="relative mb-8">
                    <div className="size-28 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">
                        <CheckCircle2 size={52} className="text-emerald-500" strokeWidth={1.5} />
                    </div>
                    <div className="absolute inset-0 rounded-full border-4 border-emerald-400/30 animate-ping" />
                </div>

                <h1 className="text-2xl font-[900] text-slate-900 dark:text-white mb-3 tracking-tight text-center">
                    Check Your Inbox!
                </h1>
                <p className="text-slate-500 dark:text-slate-400 font-semibold text-sm text-center leading-relaxed max-w-xs mb-2">
                    We've sent a password reset link to
                </p>
                <div className="px-5 py-2.5 bg-primary/10 rounded-2xl mb-8">
                    <span className="text-primary font-black text-sm">{email}</span>
                </div>

                <p className="text-slate-400 dark:text-slate-500 text-xs text-center font-semibold mb-10 max-w-[240px]">
                    Click the link in the email to set a new password. The link expires in 1 hour.
                </p>

                <div className="w-full max-w-sm space-y-3">
                    <button
                        onClick={() => navigate('/login')}
                        className="w-full bg-primary text-white font-[900] py-[18px] rounded-2xl shadow-xl shadow-primary/20 flex items-center justify-center gap-2 transition-all active:scale-95"
                    >
                        Back to Login <ArrowLeft size={18} />
                    </button>
                    <button
                        onClick={() => { setSent(false); setEmail(''); }}
                        className="w-full text-slate-400 font-bold text-[10px] uppercase tracking-widest py-3"
                    >
                        Use a different email
                    </button>
                </div>

                <p className="text-slate-300 dark:text-slate-700 text-[10px] font-bold uppercase tracking-widest mt-8">
                    Didn't receive it? Check your spam folder
                </p>
            </div>
        );
    }

    // ── Form State ─────────────────────────────────────────────────────────
    return (
        <div className="flex flex-col min-h-screen bg-[#f8fafc] dark:bg-slate-950 p-6 relative overflow-hidden">
            {/* Background blobs */}
            <div className="absolute -top-24 -right-24 size-96 bg-primary/5 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute -bottom-24 -left-24 size-72 bg-primary/5 rounded-full blur-3xl pointer-events-none" />

            {/* Back button */}
            <button
                onClick={() => navigate(-1)}
                className="text-slate-500 dark:text-slate-400 p-2 -ml-2 flex items-center gap-2 font-bold text-sm hover:text-primary transition-colors w-fit mb-6"
            >
                <ArrowLeft size={20} strokeWidth={2.5} /> Back
            </button>

            <div className="flex-1 flex flex-col justify-center max-w-sm mx-auto w-full z-10">

                {/* Logo */}
                <div className="flex items-center gap-2 mb-12">
                    <div className="size-10 bg-primary rounded-2xl flex items-center justify-center text-white shadow-lg shadow-primary/30">
                        <HomeIcon size={22} fill="currentColor" />
                    </div>
                    <h2 className="text-xl font-[900] uppercase tracking-tighter text-primary">Any.Let</h2>
                </div>

                {/* Icon */}
                <div className="size-20 bg-primary/10 dark:bg-primary/20 rounded-[28px] flex items-center justify-center mb-8">
                    <Mail size={36} className="text-primary" strokeWidth={1.5} />
                </div>

                {/* Heading */}
                <h1 className="text-3xl font-[900] text-slate-900 dark:text-white mb-3 tracking-tight leading-tight">
                    Forgot your<br />Password?
                </h1>
                <p className="text-slate-500 dark:text-slate-400 font-semibold text-sm leading-relaxed mb-10">
                    No worries! Enter your registered email address and we'll send you a secure reset link instantly.
                </p>

                {/* Error */}
                {error && (
                    <div className="p-4 bg-rose-50 dark:bg-rose-950/30 text-rose-500 rounded-2xl font-bold text-sm mb-6 border border-rose-100 dark:border-rose-900/50 flex items-center gap-3">
                        <span className="text-lg">⚠️</span> {error}
                    </div>
                )}

                {/* Form */}
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="relative group">
                        <Mail
                            className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-primary transition-colors"
                            size={20} strokeWidth={2.5}
                        />
                        <input
                            type="email"
                            placeholder="Enter your email address"
                            className="w-full bg-white dark:bg-slate-900 border-2 border-slate-100 dark:border-slate-800 rounded-2xl py-4 pl-12 pr-4 font-bold text-slate-900 dark:text-white placeholder:text-slate-300 placeholder:font-normal outline-none focus:border-primary/50 transition-all"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                        />
                    </div>

                    <button
                        disabled={loading}
                        className="w-full bg-primary text-white font-[900] py-[18px] rounded-2xl shadow-xl shadow-primary/20 flex items-center justify-center gap-2 transition-all active:scale-95 disabled:opacity-70"
                    >
                        {loading
                            ? <><RefreshCw className="animate-spin" size={20} /> Sending...</>
                            : 'Send Reset Link'
                        }
                    </button>
                </form>

                {/* Back to login link */}
                <div className="mt-10 text-center">
                    <Link to="/login" className="inline-flex items-center gap-2 text-primary font-black text-[11px] uppercase tracking-widest hover:underline">
                        <ArrowLeft size={14} strokeWidth={3} /> Back to Login
                    </Link>
                </div>
            </div>
        </div>
    );
}
