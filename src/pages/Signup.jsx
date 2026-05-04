import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { db } from '../firebase';
import { doc, setDoc, getDoc, deleteDoc } from 'firebase/firestore';
import { Mail, Lock, User, ArrowRight, Home as HomeIcon, ShieldCheck, RefreshCw, KeyRound } from 'lucide-react';
import emailjs from '@emailjs/browser';

// Replace these with your real EmailJS credentials
// (stored in .env.local as VITE_EMAILJS_SERVICE_ID etc.)
const EMAILJS_SERVICE_ID  = import.meta.env.VITE_EMAILJS_SERVICE_ID  || '';
const EMAILJS_TEMPLATE_ID = import.meta.env.VITE_EMAILJS_TEMPLATE_ID || '';
const EMAILJS_PUBLIC_KEY  = import.meta.env.VITE_EMAILJS_PUBLIC_KEY  || '';

function generateOTP() {
    return Math.floor(100000 + Math.random() * 900000).toString();
}

async function storeOTP(email, code) {
    await setDoc(doc(db, 'otp_verifications', email), {
        code,
        expiresAt: Date.now() + 10 * 60 * 1000, // 10 min
    });
}

async function verifyOTP(email, provided) {
    const snap = await getDoc(doc(db, 'otp_verifications', email));
    if (!snap.exists()) return { ok: false, msg: 'No code found. Please resend.' };
    const { code, expiresAt } = snap.data();
    if (Date.now() > expiresAt) return { ok: false, msg: 'Code expired. Please resend.' };
    if (code !== provided)      return { ok: false, msg: 'Incorrect code. Please try again.' };
    await deleteDoc(doc(db, 'otp_verifications', email)); // clean up
    return { ok: true };
}

export default function Signup() {
    const [step, setStep]         = useState(1); // 1 = form, 2 = OTP
    const [fullName, setFullName] = useState('');
    const [email, setEmail]       = useState('');
    const [password, setPassword] = useState('');
    const [otp, setOtp]           = useState('');
    const [error, setError]       = useState('');
    const [loading, setLoading]   = useState(false);
    const { signup } = useAuth();
    const navigate = useNavigate();

    // ── Step 1: send the code ──────────────────────────────────────────────
    async function handleSendCode(e) {
        e.preventDefault();
        setError('');
        setLoading(true);
        try {
            const code = generateOTP();
            await storeOTP(email, code);
            await emailjs.send(
                EMAILJS_SERVICE_ID,
                EMAILJS_TEMPLATE_ID,
                { to_email: email, to_name: fullName, otp_code: code },
                EMAILJS_PUBLIC_KEY
            );
            setStep(2);
        } catch (err) {
            console.error(err);
            setError('Failed to send verification code. Please check your email address and try again.');
        } finally {
            setLoading(false);
        }
    }

    // ── Step 2: verify code & create account ──────────────────────────────
    async function handleVerify(e) {
        e.preventDefault();
        setError('');
        setLoading(true);
        try {
            const result = await verifyOTP(email, otp.trim());
            if (!result.ok) {
                setError(result.msg);
                setLoading(false);
                return;
            }
            const cred = await signup(email, password);
            await setDoc(doc(db, 'users', cred.user.uid), {
                fullName,
                email,
                role: 'user',
                accountStatus: 'active',
                emailVerified: true,
                createdAt: new Date().toISOString(),
            });
            navigate('/');
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

    async function handleResend() {
        setError('');
        setLoading(true);
        try {
            const code = generateOTP();
            await storeOTP(email, code);
            await emailjs.send(
                EMAILJS_SERVICE_ID,
                EMAILJS_TEMPLATE_ID,
                { to_email: email, to_name: fullName, otp_code: code },
                EMAILJS_PUBLIC_KEY
            );
            setOtp('');
            setError('');
            alert('A new code has been sent!');
        } catch (err) {
            setError('Failed to resend. Please try again.');
        } finally {
            setLoading(false);
        }
    }

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
                        {step === 1 ? <>Create <br /> Account</> : <>Verify <br /> Email</>}
                    </h1>
                    <p className="text-slate-500 font-bold text-[10px] uppercase tracking-widest leading-none">
                        {step === 1 ? 'Start your property journey today.' : `Enter the 6-digit code sent to ${email}`}
                    </p>
                </div>

                {/* Progress dots */}
                <div className="flex items-center gap-2 mb-8">
                    <div className={`h-1.5 rounded-full transition-all ${step >= 1 ? 'bg-primary w-8' : 'bg-slate-200 w-4'}`} />
                    <div className={`h-1.5 rounded-full transition-all ${step >= 2 ? 'bg-primary w-8' : 'bg-slate-200 w-4'}`} />
                </div>

                {/* Error */}
                {error && (
                    <div className="p-4 bg-rose-50 dark:bg-rose-950/30 text-rose-500 rounded-2xl font-black text-[10px] uppercase tracking-wider mb-6 border border-rose-100 dark:border-rose-900/50 flex items-center gap-3">
                        <ShieldCheck size={18} className="shrink-0" />
                        {error}
                    </div>
                )}

                {/* ── STEP 1: Details Form ─────────────────── */}
                {step === 1 && (
                    <form onSubmit={handleSendCode} className="space-y-4">
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
                            {loading ? <RefreshCw className="animate-spin" size={20} /> : 'SEND VERIFICATION CODE'}
                            {!loading && <ArrowRight size={20} />}
                        </button>
                    </form>
                )}

                {/* ── STEP 2: OTP Entry ────────────────────── */}
                {step === 2 && (
                    <form onSubmit={handleVerify} className="space-y-4">
                        <div className="relative group">
                            <KeyRound className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-primary transition-colors" size={20} strokeWidth={2.5} />
                            <input
                                type="text"
                                inputMode="numeric"
                                maxLength={6}
                                placeholder="6-Digit Code"
                                className="w-full bg-white dark:bg-slate-900 border-2 border-slate-100 dark:border-slate-800 rounded-2xl py-4 pl-12 pr-4 font-black text-center text-2xl tracking-[0.5em] text-slate-900 dark:text-white placeholder:text-slate-300 placeholder:tracking-normal placeholder:text-base outline-none focus:border-primary/50 transition-all"
                                value={otp}
                                onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                                required
                            />
                        </div>

                        <button
                            disabled={loading || otp.length !== 6}
                            className="w-full bg-primary text-white font-[900] py-[18px] rounded-2xl shadow-xl shadow-primary/20 flex items-center justify-center gap-2 transition-all active:scale-95 disabled:opacity-70"
                        >
                            {loading ? <RefreshCw className="animate-spin" size={20} /> : 'VERIFY & CREATE ACCOUNT'}
                            {!loading && <ArrowRight size={20} />}
                        </button>

                        <div className="flex items-center justify-between pt-2">
                            <button
                                type="button"
                                onClick={() => { setStep(1); setOtp(''); setError(''); }}
                                className="text-slate-400 font-bold text-[10px] uppercase tracking-widest hover:text-primary transition-colors"
                            >
                                ← Change Email
                            </button>
                            <button
                                type="button"
                                onClick={handleResend}
                                disabled={loading}
                                className="text-primary font-bold text-[10px] uppercase tracking-widest hover:underline disabled:opacity-50"
                            >
                                Resend Code
                            </button>
                        </div>
                    </form>
                )}

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
