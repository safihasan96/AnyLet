import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { db } from '../firebase';
import { doc, setDoc } from 'firebase/firestore';
import { Mail, Lock, User, ArrowRight, Home as HomeIcon, CheckCircle2, ShieldCheck, RefreshCw } from 'lucide-react';
import { generateOTP, sendOTPEmail, storeOTP, verifyOTP } from '../utils/otp';

export default function Signup() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [fullName, setFullName] = useState('');
    const [otp, setOtp] = useState('');
    const [step, setStep] = useState(1); // 1: Details, 2: OTP
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const { signup } = useAuth();
    const navigate = useNavigate();

    async function handleSendVerification(e) {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            const otpCode = generateOTP();
            // Call EmailJS to send the email
            await sendOTPEmail(email, fullName, otpCode);
            // Store the OTP in Firestore for verification
            await storeOTP(email, otpCode);
            setStep(2);
            setLoading(false);
        } catch (err) {
            console.error(err);
            setError('Failed to send verification code. Please check your email or try again later.');
            setLoading(false);
        }
    }

    async function handleVerifyAndSignup(e) {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            const verification = await verifyOTP(email, otp);
            if (!verification.success) {
                setError(verification.message);
                setLoading(false);
                return;
            }

            // OTP is correct, proceed with Firebase Signup
            const userCredential = await signup(email, password);
            await setDoc(doc(db, 'users', userCredential.user.uid), {
                fullName,
                email,
                role: 'user',
                accountStatus: 'active',
                emailVerified: true,
                createdAt: new Date().toISOString()
            });
            navigate('/');
        } catch (err) {
            setError('Failed to create account. Email might already be in use.');
            setLoading(false);
        }
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
                    <h2 className="text-xl font-[900] uppercase tracking-tighter text-primary">Rent.BD</h2>
                </div>

                <div className="mb-10">
                    <h1 className="text-3xl font-[900] text-slate-900 dark:text-white mb-2 uppercase tracking-tight">
                        {step === 1 ? <>Create <br /> Account</> : <>Verify <br /> Email</>}
                    </h1>
                    <p className="text-slate-500 font-bold text-[10px] uppercase tracking-widest leading-none">
                        {step === 1 ? "Start your property journey today." : `Code sent to ${email}`}
                    </p>
                </div>

                {error && (
                    <div className="p-4 bg-rose-50 dark:bg-rose-950/30 text-rose-500 rounded-2xl font-black text-[10px] uppercase tracking-wider mb-6 border border-rose-100 dark:border-rose-900/50 flex items-center gap-3 animate-shake">
                        <ShieldCheck size={18} className="shrink-0" />
                        {error}
                    </div>
                )}

                {step === 1 ? (
                    <form onSubmit={handleSendVerification} className="space-y-4">
                        <div className="space-y-4">
                            <InputField 
                                icon={User} 
                                type="text" 
                                name="fullName"
                                autoComplete="name"
                                placeholder="Full Name" 
                                value={fullName} 
                                onChange={(e) => {
                                    const val = e.target.value.replace(/\[object Object\]/g, '');
                                    setFullName(val);
                                }} 
                            />
                            <InputField 
                                icon={Mail} 
                                type="email" 
                                name="email"
                                autoComplete="email"
                                placeholder="Email Address" 
                                value={email} 
                                onChange={(e) => {
                                    const val = e.target.value.replace(/\[object Object\]/g, '');
                                    setEmail(val);
                                }} 
                            />
                            <InputField 
                                icon={Lock} 
                                type="password" 
                                name="password"
                                autoComplete="new-password"
                                placeholder="Create Password" 
                                value={password} 
                                onChange={(e) => {
                                    const val = e.target.value.replace(/\[object Object\]/g, '');
                                    setPassword(val);
                                }} 
                            />
                        </div>

                        <button
                            disabled={loading}
                            className="w-full bg-primary text-white font-[900] py-[18px] rounded-2xl shadow-xl shadow-primary/20 flex items-center justify-center gap-2 transition-all active:scale-95 disabled:opacity-70 mt-6"
                        >
                            {loading ? <RefreshCw className="animate-spin" size={20} /> : "GET VERIFICATION CODE"}
                            {!loading && <ArrowRight size={20} />}
                        </button>
                    </form>
                ) : (
                    <form onSubmit={handleVerifyAndSignup} className="space-y-4">
                        <div className="relative group">
                            <ShieldCheck className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-primary transition-colors" size={20} />
                            <input
                                type="text"
                                placeholder="6-Digit Code"
                                maxLength={6}
                                className="w-full bg-white dark:bg-slate-900 border-2 border-slate-100 dark:border-slate-800 rounded-2xl py-4 pl-12 pr-4 font-black text-center text-xl tracking-[0.5em] text-slate-900 dark:text-white placeholder:text-slate-300 outline-none focus:border-primary/50 transition-all"
                                value={otp}
                                onChange={(e) => setOtp(e.target.value)}
                                required
                            />
                        </div>

                        <button
                            disabled={loading}
                            className="w-full bg-primary text-white font-[900] py-[18px] rounded-2xl shadow-xl shadow-primary/20 flex items-center justify-center gap-2 transition-all active:scale-95 disabled:opacity-70 mt-4"
                        >
                            {loading ? <RefreshCw className="animate-spin" size={20} /> : "VERIFY & CREATE ACCOUNT"}
                            {!loading && <CheckCircle2 size={20} />}
                        </button>

                        <button
                            type="button"
                            onClick={() => setStep(1)}
                            className="w-full py-2 text-slate-400 font-bold text-[10px] uppercase tracking-widest hover:text-primary transition-colors"
                        >
                            Change Email Address
                        </button>
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
