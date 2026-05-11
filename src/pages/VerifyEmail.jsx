import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { sendEmailVerification } from 'firebase/auth';
import { auth } from '../firebase';
import { motion, AnimatePresence } from 'framer-motion';
import { ShieldAlert, Mail, CheckCircle2, ArrowRight, RefreshCw, LogOut, ArrowLeft } from 'lucide-react';

export default function VerifyEmail() {
    const { currentUser, logout, refreshUser } = useAuth();
    const navigate = useNavigate();
    const [sending, setSending] = useState(false);
    const [sent, setSent] = useState(false);
    const [refreshing, setRefreshing] = useState(false);
    const [isVerified, setIsVerified] = useState(currentUser?.emailVerified || false);

    useEffect(() => {
        if (!currentUser) {
            navigate('/login');
            return;
        }
        if (currentUser.emailVerified) {
            setIsVerified(true);
        }
    }, [currentUser, navigate]);

    const handleResend = async () => {
        try {
            setSending(true);
            await sendEmailVerification(auth.currentUser);
            setSent(true);
            setTimeout(() => setSent(false), 5000);
        } catch (error) {
            console.error(error);
            alert("Too many requests. Please try again later.");
        } finally {
            setSending(false);
        }
    };

    const handleCheckStatus = async () => {
        try {
            setRefreshing(true);
            await refreshUser();
            if (auth.currentUser.emailVerified) {
                setIsVerified(true);
            } else {
                alert("Email not yet verified. Please check your inbox and click the link.");
            }
        } catch (error) {
            console.error(error);
        } finally {
            setRefreshing(false);
        }
    };

    if (isVerified) {
        return (
            <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center p-6 text-center">
                <motion.div 
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="max-w-md w-full bg-white dark:bg-slate-900 p-10 rounded-[40px] shadow-xl border border-slate-100 dark:border-slate-800"
                >
                    <div className="size-20 bg-emerald-100 dark:bg-emerald-500/10 rounded-full flex items-center justify-center text-emerald-500 mx-auto mb-6">
                        <CheckCircle2 size={48} />
                    </div>
                    <h1 className="text-2xl font-black text-slate-900 dark:text-white mb-4 uppercase tracking-tight">Verified!</h1>
                    <p className="text-slate-600 dark:text-slate-400 font-bold mb-8">
                        Your email address has been successfully verified. You now have full access to Any-Let.
                    </p>
                    <button 
                        onClick={() => navigate('/')}
                        className="w-full py-5 bg-primary text-white rounded-2xl font-black text-lg shadow-xl shadow-primary/20 transition-transform active:scale-95"
                    >
                        Go to Homepage
                    </button>
                </motion.div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col p-6">
            <header className="max-w-xl mx-auto w-full py-6">
                <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-slate-500 hover:text-primary transition-colors font-bold text-sm">
                    <ArrowLeft size={18} /> Back
                </button>
            </header>

            <div className="flex-1 flex items-center justify-center">
                <div className="max-w-md w-full bg-white dark:bg-slate-900 p-8 md:p-12 rounded-[40px] shadow-2xl border border-slate-100 dark:border-slate-800">
                    <div className="size-20 bg-rose-100 dark:bg-rose-500/10 rounded-[28px] flex items-center justify-center text-rose-500 mb-8">
                        <Mail size={40} />
                    </div>

                    <h1 className="text-3xl font-black text-slate-900 dark:text-white mb-4 uppercase tracking-tighter">
                        Verify Your <br /> Email Address
                    </h1>
                    <p className="text-slate-500 dark:text-slate-400 font-bold text-sm mb-10 leading-relaxed">
                        We've sent a verification link to <span className="text-primary">{currentUser?.email}</span>. 
                        Please check your inbox (and spam folder) to complete your registration.
                    </p>

                    <div className="space-y-4">
                        <button 
                            onClick={handleCheckStatus}
                            disabled={refreshing}
                            className="w-full py-5 bg-primary text-white rounded-2xl font-black text-lg shadow-xl shadow-primary/20 flex items-center justify-center gap-3 transition-all active:scale-95 disabled:opacity-70"
                        >
                            {refreshing ? <RefreshCw className="animate-spin" size={20} /> : <CheckCircle2 size={20} />}
                            I've Verified
                        </button>

                        <button 
                            onClick={handleResend}
                            disabled={sending || sent}
                            className={`w-full py-5 rounded-2xl font-black text-lg transition-all flex items-center justify-center gap-3 ${sent ? 'bg-emerald-50 text-emerald-500' : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-200 active:scale-95'}`}
                        >
                            {sending ? <RefreshCw className="animate-spin" size={20} /> : sent ? <CheckCircle2 size={20} /> : <RefreshCw size={20} />}
                            {sent ? 'Email Sent!' : 'Resend Verification Link'}
                        </button>
                    </div>

                    <div className="mt-12 pt-8 border-t border-slate-100 dark:border-slate-800">
                        <button 
                            onClick={() => {
                                logout();
                                navigate('/login');
                            }}
                            className="flex items-center gap-2 text-slate-400 hover:text-rose-500 transition-colors font-bold text-sm mx-auto"
                        >
                            <LogOut size={16} /> Sign in with a different account
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
