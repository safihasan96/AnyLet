import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { auth, db } from '../firebase';
import { signOut, sendEmailVerification, signInWithEmailAndPassword } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { Mail, Lock, ArrowRight, Home as HomeIcon, RefreshCw, ArrowLeft, Loader2 } from 'lucide-react';

// Google logo SVG inline (no external dependency)
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

export default function Login() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [googleLoading, setGoogleLoading] = useState(false);
    const [unverified, setUnverified] = useState(false);
    const [resending, setResending] = useState(false);
    const [resent, setResent] = useState(false);
    // Account-linking state
    const [linkPending, setLinkPending] = useState(null); // { email, pendingCredential }
    const [linkPassword, setLinkPassword] = useState('');

    const { login, signInWithGoogle, linkGoogleAfterPassword } = useAuth();
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const nextRoute = searchParams.get('next') || '/';

    function getRedirect(role, onboardingStep) {
        if (role === 'admin') return '/admin';
        if (!onboardingStep || onboardingStep !== 'completed') return `/onboarding?next=${encodeURIComponent(nextRoute)}`;
        return nextRoute;
    }

    async function handleSubmit(e) {
        e.preventDefault();
        setError('');
        setUnverified(false);
        setResent(false);
        try {
            setLoading(true);
            const userCredential = await login(email, password);

            if (!userCredential.user.emailVerified) {
                await signOut(auth);
                setUnverified(true);
                setLoading(false);
                return;
            }

            const snap = await getDoc(doc(db, 'users', userCredential.user.uid));
            const data = snap.exists() ? snap.data() : {};
            navigate(getRedirect(data.role, data.onboardingStep), { replace: true });
        } catch {
            setError('Incorrect email or password. Please try again.');
            setLoading(false);
        }
    }

    async function handleGoogleSignIn() {
        setError('');
        setGoogleLoading(true);
        try {
            const result = await signInWithGoogle();
            const snap = await getDoc(doc(db, 'users', result.user.uid));
            const data = snap.exists() ? snap.data() : {};
            navigate(getRedirect(data.role, data.onboardingStep), { replace: true });
        } catch (err) {
            if (err.code === 'auth/link-required') {
                // Same email exists under password — prompt to link
                setLinkPending({ email: err.email, pendingCredential: err.pendingCredential });
            } else if (err.code !== 'auth/popup-closed-by-user') {
                console.error("Google Auth Error:", err);
                setError(`Google sign-in failed: ${err.message}`);
            }
        } finally {
            setGoogleLoading(false);
        }
    }

    async function handleLinkSubmit(e) {
        e.preventDefault();
        setError('');
        setLoading(true);
        try {
            const result = await linkGoogleAfterPassword(linkPassword, linkPending.email, linkPending.pendingCredential);
            const snap = await getDoc(doc(db, 'users', result.user.uid));
            const data = snap.exists() ? snap.data() : {};
            navigate(getRedirect(data.role, data.onboardingStep), { replace: true });
        } catch {
            setError('Wrong password. Please try again.');
        } finally {
            setLoading(false);
        }
    }

    async function handleResendVerification() {
        setResending(true);
        try {
            const userCredential = await signInWithEmailAndPassword(auth, email, password);
            await sendEmailVerification(userCredential.user);
            await signOut(auth);
            setResent(true);
        } catch {
            setError('Could not resend email. Please check your credentials.');
        } finally {
            setResending(false);
        }
    }

    /* ── Account Linking Screen ──────────────────────────────────────────── */
    if (linkPending) {
        return (
            <div className="flex flex-col min-h-screen bg-white dark:bg-slate-950 p-6">
                <header className="flex items-center mb-6">
                    <button onClick={() => setLinkPending(null)} className="p-2.5 rounded-2xl bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                        <ArrowLeft size={20} strokeWidth={3} />
                    </button>
                </header>
                <div className="flex-1 flex flex-col justify-center max-w-sm mx-auto w-full">
                    <div className="flex items-center gap-2 mb-10">
                        <div className="size-10 bg-[#1a227f] rounded-2xl flex items-center justify-center text-white shadow-lg shadow-[#1a227f]/30">
                            <HomeIcon size={24} />
                        </div>
                        <h2 className="text-2xl font-black uppercase tracking-tighter text-[#1a227f] dark:text-indigo-400">AnyLet</h2>
                    </div>
                    <h1 className="text-3xl font-black text-slate-900 dark:text-white mb-2">Link your accounts</h1>
                    <p className="text-slate-500 font-medium text-sm mb-8">
                        You already have an account with <strong>{linkPending.email}</strong> using a password. Enter your password to link Google sign-in to your account.
                    </p>
                    {error && <div className="p-4 bg-rose-50 dark:bg-rose-950/30 text-rose-500 rounded-2xl font-black text-xs uppercase tracking-wider mb-6 border border-rose-100">{error}</div>}
                    <form onSubmit={handleLinkSubmit} className="space-y-4">
                        <input
                            type="password"
                            placeholder="Your existing password"
                            value={linkPassword}
                            onChange={e => setLinkPassword(e.target.value)}
                            required
                            className="w-full bg-slate-50 dark:bg-slate-900/50 border-none rounded-2xl py-4 px-5 font-bold text-slate-900 dark:text-white placeholder:text-slate-300 outline-none focus:ring-2 focus:ring-[#1a227f]/50 transition-all"
                        />
                        <button disabled={loading} className="w-full bg-[#1a227f] text-white font-black py-4 rounded-2xl shadow-xl shadow-[#1a227f]/20 flex items-center justify-center gap-2 transition-all active:scale-95 disabled:opacity-70">
                            {loading ? <Loader2 size={18} className="animate-spin" /> : <><ArrowRight size={20} /> Link Accounts & Continue</>}
                        </button>
                    </form>
                </div>
            </div>
        );
    }

    /* ── Main Login Screen ────────────────────────────────────────────────── */
    return (
        <div className="flex flex-col min-h-screen bg-white dark:bg-slate-950 p-6">
            <header className="flex items-center mb-6">
                <button onClick={() => navigate(-1)} className="p-2.5 rounded-2xl bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-[#1a227f]/10 hover:text-[#1a227f] dark:text-indigo-400 transition-all active:scale-95 border border-slate-100 dark:border-slate-700">
                    <ArrowLeft size={20} strokeWidth={3} />
                </button>
            </header>

            <div className="flex-1 flex flex-col justify-center max-w-sm mx-auto w-full">
                <div className="flex items-center gap-2 mb-12">
                    <div className="size-10 bg-[#1a227f] rounded-2xl flex items-center justify-center text-white shadow-lg shadow-[#1a227f]/30">
                        <HomeIcon size={24} />
                    </div>
                    <h2 className="text-2xl font-black uppercase tracking-tighter text-[#1a227f] dark:text-indigo-400">AnyLet</h2>
                </div>

                <div className="mb-10">
                    <h1 className="text-4xl font-black text-slate-900 dark:text-white mb-2 uppercase tracking-tight">Welcome <br />Back!</h1>
                    <p className="text-slate-500 font-bold text-xs uppercase tracking-widest">Sign in to manage your rentals.</p>
                </div>

                {error && <div className="p-4 bg-rose-50 dark:bg-rose-950/30 text-rose-500 rounded-2xl font-black text-xs uppercase tracking-wider mb-6 border border-rose-100 dark:border-rose-900/50">{error}</div>}

                {unverified && (
                    <div className="p-5 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-2xl mb-6">
                        <p className="text-amber-700 dark:text-amber-400 font-bold text-sm mb-3">
                            📧 Your email is not verified yet. Please check your inbox.
                        </p>
                        {resent ? (
                            <p className="text-emerald-600 font-bold text-xs uppercase tracking-wider">✅ Verification email resent!</p>
                        ) : (
                            <button onClick={handleResendVerification} disabled={resending} className="flex items-center gap-2 text-amber-700 dark:text-amber-400 font-black text-xs uppercase tracking-wider hover:underline disabled:opacity-60">
                                {resending ? <RefreshCw size={14} className="animate-spin" /> : null}
                                {resending ? 'Resending...' : 'Resend verification email'}
                            </button>
                        )}
                    </div>
                )}

                {/* Google Sign-In */}
                <button
                    onClick={handleGoogleSignIn}
                    disabled={googleLoading || loading}
                    className="w-full flex items-center justify-center gap-3 py-4 bg-white dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 rounded-2xl font-black text-slate-700 dark:text-white text-sm hover:border-slate-300 dark:hover:border-slate-600 transition-all active:scale-95 disabled:opacity-60 mb-4 shadow-sm"
                >
                    {googleLoading ? <Loader2 size={18} className="animate-spin text-slate-400" /> : <GoogleLogo />}
                    Continue with Google
                </button>

                <div className="flex items-center gap-3 mb-4">
                    <div className="flex-1 h-px bg-slate-100 dark:bg-slate-800" />
                    <span className="text-xs font-black text-slate-300 dark:text-slate-600 uppercase tracking-widest">or</span>
                    <div className="flex-1 h-px bg-slate-100 dark:bg-slate-800" />
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="relative group">
                        <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-[#1a227f] dark:text-indigo-400 transition-colors" size={20} />
                        <input
                            type="email"
                            placeholder="Email Address"
                            className="w-full bg-slate-50 dark:bg-slate-900/50 border-none rounded-2xl py-4 pl-12 pr-4 font-bold text-slate-900 dark:text-white placeholder:text-slate-300 outline-none focus:ring-2 focus:ring-[#1a227f]/50 transition-all"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                        />
                    </div>

                    <div className="relative group">
                        <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-[#1a227f] dark:text-indigo-400 transition-colors" size={20} />
                        <input
                            type="password"
                            placeholder="Password"
                            className="w-full bg-slate-50 dark:bg-slate-900/50 border-none rounded-2xl py-4 pl-12 pr-4 font-bold text-slate-900 dark:text-white placeholder:text-slate-300 outline-none focus:ring-2 focus:ring-[#1a227f]/50 transition-all"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                        />
                    </div>

                    <div className="flex justify-end pt-2">
                        <Link to="/forgot-password" className="text-[10px] uppercase font-black text-[#1a227f] dark:text-indigo-400 tracking-widest cursor-pointer hover:underline">Forgot Password?</Link>
                    </div>

                    <button
                        disabled={loading}
                        className="w-full bg-[#1a227f] text-white font-black py-4 rounded-2xl shadow-xl shadow-[#1a227f]/20 flex items-center justify-center gap-2 transition-all active:scale-95 disabled:opacity-70 mt-4"
                    >
                        {loading ? <Loader2 size={18} className="animate-spin" /> : <><ArrowRight size={20} /> SIGN IN NOW</>}
                    </button>
                </form>

                <div className="mt-12 text-center">
                    <p className="text-slate-400 font-bold text-xs uppercase tracking-widest">
                        Don't have an account? <Link to="/signup" className="text-[#1a227f] dark:text-indigo-400 font-black ml-1">Create One</Link>
                    </p>
                </div>
            </div>
        </div>
    );
}
