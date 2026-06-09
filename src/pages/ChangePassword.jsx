import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { auth } from '../firebase';
import { updatePassword, EmailAuthProvider, reauthenticateWithCredential, signOut } from 'firebase/auth';
import { ArrowLeft, RefreshCw, Key, Lock, Shield, EyeOff, Eye, Info, LockIcon } from 'lucide-react';

export default function ChangePassword() {
    const { currentUser } = useAuth();
    const navigate = useNavigate();

    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');

    const [showCurrent, setShowCurrent] = useState(false);
    const [showNew, setShowNew] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);

    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    async function handleSubmit(e) {
        e.preventDefault();

        if (newPassword !== confirmPassword) {
            return setError('New passwords do not match');
        }

        if (newPassword.length < 8) {
            return setError('Password must be at least 8 characters long');
        }

        try {
            setError('');
            setLoading(true);

            // Re-authenticate user
            const credential = EmailAuthProvider.credential(currentUser.email, currentPassword);
            await reauthenticateWithCredential(currentUser, credential);

            // Update password
            await updatePassword(currentUser, newPassword);

            // Sign out
            await signOut(auth);
            navigate('/login');

        } catch (err) {
            console.error(err);
            if (err.code === 'auth/invalid-credential' || err.code === 'auth/wrong-password') {
                setError('Incorrect current password');
            } else {
                setError('Failed to change password. Please try again.');
            }
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="flex flex-col min-h-screen bg-[#f8fafc] dark:bg-slate-950 pb-32">
            <header className="flex items-center p-6 mb-2">
                <button onClick={() => navigate(-1)} className="text-slate-800 dark:text-white p-2 -ml-2">
                    <ArrowLeft size={24} strokeWidth={2.5} />
                </button>
                <h1 className="text-lg font-[800] text-slate-900 dark:text-white flex-1 text-center pr-8 tracking-tight">Change Password</h1>
            </header>

            <div className="flex-1 flex flex-col items-center px-6 max-w-md mx-auto w-full">
                <div className="size-[80px] bg-[#e2e8f0] dark:bg-slate-800 rounded-full flex items-center justify-center text-[#4338ca] dark:text-indigo-400 mb-6">
                    <div className="relative">
                        <RefreshCw size={32} strokeWidth={2.5} className="absolute -inset-1 opacity-20" />
                        <RefreshCw size={32} strokeWidth={2.5} />
                        <div className="absolute inset-0 flex items-center justify-center">
                            <LockIcon size={12} fill="currentColor" className="mt-1" />
                        </div>
                    </div>
                </div>

                <p className="text-[#64748b] text-center text-[14px] font-medium leading-relaxed mb-8 px-2">
                    To secure your account, please ensure your new password is at least 8 characters long and includes numbers.
                </p>

                {error && (
                    <div className="p-4 rounded-xl bg-rose-50 text-rose-500 font-bold text-sm mb-6 w-full text-center">
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="w-full space-y-6">
                    <div className="space-y-2">
                        <label className="text-[13px] font-[800] text-slate-900 dark:text-slate-200 ml-1">Current Password</label>
                        <div className="relative">
                            <Key className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} strokeWidth={2.5} />
                            <input
                                type={showCurrent ? "text" : "password"}
                                placeholder="••••••••"
                                className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[24px] py-[18px] pl-12 pr-12 font-bold text-slate-900 dark:text-white placeholder:text-slate-400 outline-none focus:border-[#4338ca] focus:ring-1 focus:ring-[#4338ca] transition-all shadow-sm tracking-widest text-lg"
                                value={currentPassword}
                                onChange={(e) => setCurrentPassword(e.target.value)}
                                required
                            />
                            <button type="button" onClick={() => setShowCurrent(!showCurrent)} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 p-1">
                                {showCurrent ? <Eye size={20} /> : <EyeOff size={20} strokeWidth={2} />}
                            </button>
                        </div>
                    </div>

                    <div className="w-full h-px bg-slate-100 dark:bg-slate-800 my-2"></div>

                    <div className="space-y-2">
                        <label className="text-[13px] font-[800] text-slate-900 dark:text-slate-200 ml-1">New Password</label>
                        <div className="relative">
                            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} strokeWidth={2.5} />
                            <input
                                type={showNew ? "text" : "password"}
                                placeholder="••••••••"
                                className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[24px] py-[18px] pl-12 pr-12 font-bold text-slate-900 dark:text-white placeholder:text-slate-400 outline-none focus:border-[#4338ca] focus:ring-1 focus:ring-[#4338ca] transition-all shadow-sm tracking-widest text-lg"
                                value={newPassword}
                                onChange={(e) => setNewPassword(e.target.value)}
                                required
                            />
                            <button type="button" onClick={() => setShowNew(!showNew)} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 p-1">
                                {showNew ? <Eye size={20} /> : <EyeOff size={20} strokeWidth={2} />}
                            </button>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-[13px] font-[800] text-slate-900 dark:text-slate-200 ml-1">Confirm New Password</label>
                        <div className="relative">
                            <Shield className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} strokeWidth={2.5} />
                            <input
                                type={showConfirm ? "text" : "password"}
                                placeholder="••••••••"
                                className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[24px] py-[18px] pl-12 pr-12 font-bold text-slate-900 dark:text-white placeholder:text-slate-400 outline-none focus:border-[#4338ca] focus:ring-1 focus:ring-[#4338ca] transition-all shadow-sm tracking-widest text-lg"
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                required
                            />
                            <button type="button" onClick={() => setShowConfirm(!showConfirm)} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 p-1">
                                {showConfirm ? <Eye size={20} /> : <EyeOff size={20} strokeWidth={2} />}
                            </button>
                        </div>
                    </div>

                    <div className="bg-[#f1f5f9] dark:bg-slate-800/50 rounded-[24px] p-5 flex gap-3 mt-4 border border-[#e2e8f0] dark:border-slate-800">
                        <Info size={20} className="text-[#3730a3] shrink-0 mt-0.5" strokeWidth={2.5} />
                        <p className="text-[13px] text-slate-600 dark:text-slate-400 font-medium leading-relaxed">
                            Changing your password will sign you out of all other active sessions on different devices for security reasons.
                        </p>
                    </div>

                    <button
                        disabled={loading}
                        className="w-full bg-[#3730a3] text-white font-[800] text-[15px] py-[18px] rounded-[24px] shadow-lg shadow-[#3730a3]/20 flex items-center justify-center gap-2 transition-all active:scale-95 disabled:opacity-70 mt-4"
                    >
                        {loading ? "UPDATING..." : "Update Password"}
                    </button>
                </form>
            </div>

            <div className="h-20"></div> {/* Bottom spacer for fixed nav if needed */}
        </div>
    );
}
