import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { auth } from '../firebase';
import { updatePassword, EmailAuthProvider, reauthenticateWithCredential, signOut } from 'firebase/auth';
import { ArrowLeft, RefreshCw, Key, Lock, Shield, EyeOff, Eye, Info, LockIcon } from 'lucide-react';
import { Button, Input, Field } from '../components/ui';
import logger from '../utils/logger';

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
            logger.error(err);
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
        <div className="flex flex-col min-h-screen bg-surface-sunken pb-32">
            <header className="flex items-center justify-center p-6 mb-2">
                <h1 className="text-lg font-bold text-content tracking-tight">Change Password</h1>
            </header>

            <div className="flex-1 flex flex-col items-center px-6 max-w-md mx-auto w-full">
                <div className="size-[80px] bg-primary-subtle rounded-full flex items-center justify-center text-primary mb-6">
                    <div className="relative">
                        <RefreshCw size={32} strokeWidth={2.5} className="absolute -inset-1 opacity-20" />
                        <RefreshCw size={32} strokeWidth={2.5} />
                        <div className="absolute inset-0 flex items-center justify-center">
                            <LockIcon size={12} fill="currentColor" className="mt-1" />
                        </div>
                    </div>
                </div>

                <p className="text-muted text-center text-[14px] font-medium leading-relaxed mb-8 px-2">
                    To secure your account, please ensure your new password is at least 8 characters long and includes numbers.
                </p>

                {error && (
                    <div className="p-4 rounded-xl bg-rose-50 text-rose-500 font-bold text-sm mb-6 w-full text-center">
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="w-full space-y-6">
                    <Field label="Current Password">
                        <div className="relative">
                            <Input
                                type={showCurrent ? "text" : "password"}
                                placeholder="••••••••"
                                leftIcon={<Key size={20} strokeWidth={2.5} />}
                                rightIcon={
                                    <button type="button" onClick={() => setShowCurrent(!showCurrent)} className="text-muted p-1">
                                        {showCurrent ? <Eye size={20} /> : <EyeOff size={20} strokeWidth={2} />}
                                    </button>
                                }
                                value={currentPassword}
                                onChange={(e) => setCurrentPassword(e.target.value)}
                                required
                            />
                        </div>
                    </Field>

                    <div className="w-full h-px bg-border my-2"></div>

                    <Field label="New Password">
                        <div className="relative">
                            <Input
                                type={showNew ? "text" : "password"}
                                placeholder="••••••••"
                                leftIcon={<Lock size={20} strokeWidth={2.5} />}
                                rightIcon={
                                    <button type="button" onClick={() => setShowNew(!showNew)} className="text-muted p-1">
                                        {showNew ? <Eye size={20} /> : <EyeOff size={20} strokeWidth={2} />}
                                    </button>
                                }
                                value={newPassword}
                                onChange={(e) => setNewPassword(e.target.value)}
                                required
                            />
                        </div>
                    </Field>

                    <Field label="Confirm New Password">
                        <div className="relative">
                            <Input
                                type={showConfirm ? "text" : "password"}
                                placeholder="••••••••"
                                leftIcon={<Shield size={20} strokeWidth={2.5} />}
                                rightIcon={
                                    <button type="button" onClick={() => setShowConfirm(!showConfirm)} className="text-muted p-1">
                                        {showConfirm ? <Eye size={20} /> : <EyeOff size={20} strokeWidth={2} />}
                                    </button>
                                }
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                required
                            />
                        </div>
                    </Field>

                    <div className="bg-surface-sunken rounded-[24px] p-5 flex gap-3 mt-4 border border-border">
                        <Info size={20} className="text-primary shrink-0 mt-0.5" strokeWidth={2.5} />
                        <p className="text-[13px] text-muted font-medium leading-relaxed">
                            Changing your password will sign you out of all other active sessions on different devices for security reasons.
                        </p>
                    </div>

                    <Button
                        type="submit"
                        fullWidth
                        size="lg"
                        loading={loading}
                        className="mt-4"
                    >
                        {loading ? "UPDATING..." : "Update Password"}
                    </Button>
                </form>
            </div>

            <div className="h-20"></div> {/* Bottom spacer for fixed nav if needed */}
        </div>
    );
}
