import { X } from 'lucide-react';

/**
 * UserDetailDrawer — centered modal card showing a user's profile, account
 * details, KYC status, and government ID. Renders nothing when `user` is null.
 * Presentational; `onClose` comes from the AdminPanel shell.
 */
export default function UserDetailDrawer({ user, onClose }) {
    if (!user) return null;

    return (
        <div
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={onClose}
        >
            {/* Modal Card */}
            <div
                className="bg-white dark:bg-slate-900 rounded-[32px] w-full max-w-lg overflow-hidden shadow-2xl border border-zinc-100 dark:border-slate-800"
                onClick={e => e.stopPropagation()}
            >
                {/* Header */}
                <div className="px-8 py-6 border-b border-zinc-100 dark:border-slate-800 flex items-center justify-between">
                    <div>
                        <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest mb-1">User Profile Card</p>
                        <h3 className="text-xl font-black text-zinc-950 dark:text-white leading-tight">Identity Details</h3>
                    </div>
                    <button
                        onClick={onClose}
                        className="w-9 h-9 rounded-xl bg-zinc-50 dark:bg-slate-800 flex items-center justify-center text-zinc-400 hover:text-zinc-900 dark:hover:text-white transition-all"
                    >
                        <X size={18} />
                    </button>
                </div>

                {/* Body */}
                <div className="p-8 space-y-6 max-h-[70vh] overflow-y-auto">
                    {/* Profile Head */}
                    <div className="flex items-center gap-5 bg-zinc-50 dark:bg-slate-800/50 p-6 rounded-3xl">
                        {user.photoURL ? (
                            <img loading="lazy" src={user.photoURL} alt="Profile" className="w-16 h-16 rounded-2xl object-cover" />
                        ) : (
                            <div className="w-16 h-16 bg-emerald-500 rounded-2xl flex items-center justify-center font-black text-white text-2xl uppercase">
                                {user.fullName?.[0] || user.email?.[0] || '?'}
                            </div>
                        )}
                        <div>
                            <h4 className="text-lg font-black text-zinc-950 dark:text-white">{user.fullName || 'Anonymous User'}</h4>
                            <p className="text-sm font-bold text-zinc-500 dark:text-zinc-400">{user.email}</p>
                            <span className="inline-block mt-2 text-[9px] font-black px-2.5 py-1 bg-emerald-100 text-emerald-800 rounded-full uppercase tracking-widest">
                                {user.role || 'client'}
                            </span>
                        </div>
                    </div>

                    {/* Main details */}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="bg-zinc-50 dark:bg-slate-800/30 p-4 rounded-2xl">
                            <p className="text-[9px] font-black text-zinc-400 dark:text-zinc-500 uppercase tracking-widest">Account Status</p>
                            <p className="text-sm font-bold text-zinc-950 dark:text-white mt-1 capitalize">{user.accountStatus || 'Active'}</p>
                        </div>
                        <div className="bg-zinc-50 dark:bg-slate-800/30 p-4 rounded-2xl">
                            <p className="text-[9px] font-black text-zinc-400 dark:text-zinc-500 uppercase tracking-widest">Contact Phone</p>
                            <p className="text-sm font-bold text-zinc-950 dark:text-white mt-1">{user.phone || user.contact || 'Not provided'}</p>
                        </div>
                        <div className="bg-zinc-50 dark:bg-slate-800/30 p-4 rounded-2xl">
                            <p className="text-[9px] font-black text-zinc-400 dark:text-zinc-500 uppercase tracking-widest">Subscription Plan</p>
                            <p className="text-sm font-bold text-zinc-950 dark:text-white mt-1">{user.subscriptionPlan || 'Free'}</p>
                        </div>
                        <div className="bg-zinc-50 dark:bg-slate-800/30 p-4 rounded-2xl">
                            <p className="text-[9px] font-black text-zinc-400 dark:text-zinc-500 uppercase tracking-widest">KYC Status</p>
                            <p className="text-sm font-bold text-zinc-950 dark:text-white mt-1">
                                {user.verification?.isKycApproved ? '✅ Verified' : user.onboardingStatus === 'PENDING_VERIFICATION' ? '⏳ Under Review' : '❌ Unverified'}
                            </p>
                        </div>
                    </div>

                    {/* Documents / ID Verification */}
                    {user.verification?.idDocumentUrl && (
                        <div className="border-t border-zinc-100 dark:border-slate-800 pt-6">
                            <p className="text-[10px] font-black text-zinc-400 dark:text-zinc-500 uppercase tracking-widest mb-3">Government Issued ID</p>
                            <a
                                href={user.verification.idDocumentUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="block overflow-hidden rounded-2xl border border-zinc-200 dark:border-slate-800 hover:opacity-90 transition-opacity"
                            >
                                <img loading="lazy" src={user.verification.idDocumentUrl} alt="Government ID" className="w-full h-40 object-cover bg-zinc-50" />
                            </a>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="px-8 py-5 border-t border-zinc-100 dark:border-slate-800 bg-zinc-50 dark:bg-slate-800/50 flex justify-end gap-3">
                    <button
                        onClick={onClose}
                        className="px-6 py-2.5 bg-zinc-950 hover:bg-zinc-800 text-white font-black rounded-xl text-sm transition-all"
                    >
                        Close Details
                    </button>
                </div>
            </div>
        </div>
    );
}
