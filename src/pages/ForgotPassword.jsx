import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { auth } from '../firebase';
import { sendPasswordResetEmail } from 'firebase/auth';
import { Mail, ArrowLeft, RefreshCw, KeyRound, UnlockIcon, LockIcon } from 'lucide-react';

export default function ForgotPassword() {
    const [email, setEmail] = useState('');
    const [message, setMessage] = useState({ type: '', text: '' });
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    async function handleSubmit(e) {
        e.preventDefault();
        try {
            setMessage({ type: '', text: '' });
            setLoading(true);
            console.log(`Attempting to send password reset email to: ${email}`);
            await sendPasswordResetEmail(auth, email);
            console.log("Password reset email sent successfully.");
            setMessage({ type: 'success', text: 'Password reset link sent to your email.' });
        } catch (err) {
            console.error("Error sending password reset email:", err);
            setMessage({ type: 'error', text: `Failed to reset password: ${err.message}` });
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="flex flex-col min-h-screen bg-[#f8fafc] dark:bg-slate-950 px-6 pt-10 pb-6 relative overflow-hidden">
            <button onClick={() => navigate(-1)} className="text-slate-800 dark:text-white mb-10 p-2">
                <ArrowLeft size={24} strokeWidth={2.5} />
            </button>

            <div className="flex-1 flex flex-col items-center max-w-sm mx-auto w-full z-10">
                <div className="size-20 bg-[#e2e8f0] dark:bg-slate-800 rounded-3xl flex items-center justify-center text-[#4338ca] dark:text-indigo-400 mb-6 mt-4">
                    <div className="relative">
                        <RefreshCw size={36} strokeWidth={2.5} className="absolute -inset-1 opacity-20" />
                        <RefreshCw size={36} strokeWidth={2.5} />
                        <div className="absolute inset-0 flex items-center justify-center">
                            <LockIcon size={14} fill="currentColor" className="mt-1" />
                        </div>
                    </div>
                </div>

                <h1 className="text-3xl font-[900] text-slate-900 dark:text-white mb-4 tracking-tight">Forgot Password?</h1>
                <p className="text-[#64748b] text-center text-[15px] font-medium leading-relaxed mb-10 px-4">
                    No worries! Enter your email address below and we'll send you a link to reset your password.
                </p>

                {message.text && (
                    <div className={`p-4 rounded-xl font-bold text-sm mb-6 w-full text-center ${message.type === 'error' ? 'bg-rose-50 text-rose-500' : 'bg-emerald-50 text-emerald-600'}`}>
                        {message.text}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="w-full space-y-6">
                    <div className="space-y-2">
                        <label className="text-[13px] font-[800] text-slate-900 dark:text-slate-200 ml-1">Email Address</label>
                        <div className="relative">
                            <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} strokeWidth={2.5} />
                            <input
                                type="email"
                                placeholder="name@example.com"
                                className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[24px] py-[18px] pl-12 pr-4 font-semibold text-slate-900 dark:text-white placeholder:text-slate-400 outline-none focus:border-[#4338ca] focus:ring-1 focus:ring-[#4338ca] transition-all shadow-sm"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                            />
                        </div>
                    </div>

                    <button
                        disabled={loading}
                        className="w-full bg-[#3730a3] text-white font-[800] text-[15px] py-[18px] rounded-[24px] shadow-lg shadow-[#3730a3]/20 flex items-center justify-center gap-2 transition-all active:scale-95 disabled:opacity-70 mt-2"
                    >
                        {loading ? "SENDING..." : "Send Reset Link"}
                    </button>
                </form>
            </div>

            {/* Background Graphic */}
            <div className="absolute bottom-0 left-0 right-0 flex flex-col items-center pointer-events-none opacity-50 dark:opacity-20">
                <div className="relative w-48 h-48">
                    <svg viewBox="0 0 100 100" className="w-full h-full text-slate-200 fill-current">
                        <path d="M50 10 L90 40 V100 H10 V40 Z" />
                        <rect x="40" y="70" width="20" height="30" fill="#f8fafc" />
                    </svg>
                </div>
                <div className="absolute bottom-16 w-full flex justify-center pointer-events-auto">
                    <Link to="/login" className="flex items-center gap-2 text-[#3730a3] dark:text-indigo-400 font-[800]">
                        <ArrowLeft size={16} strokeWidth={3} />
                        Back to Login
                    </Link>
                </div>
                <div className="absolute bottom-6 flex items-center w-full max-w-[200px] gap-4">
                    <div className="h-px bg-slate-200 flex-1"></div>
                    <span className="text-[10px] uppercase font-[900] tracking-[0.2em] text-slate-400">Rental App</span>
                    <div className="h-px bg-slate-200 flex-1"></div>
                </div>
            </div>
        </div>
    );
}
