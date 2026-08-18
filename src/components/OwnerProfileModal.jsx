import { useState } from 'react';
import { X, Phone, Mail, User, ShieldCheck } from 'lucide-react';
import ConfirmationModal from './ConfirmationModal';
import { BottomSheet3D } from './Modal3D';
import { useToast } from '../contexts/ToastContext';

export default function OwnerProfileModal({ isOpen, onClose, owner }) {
    const [callModalOpen, setCallModalOpen] = useState(false);
    const [phoneNumberToCall, setPhoneNumberToCall] = useState('');
    const toast = useToast();

    // Fallbacks for missing data
    const displayName = owner?.fullName || owner?.name || owner?.displayName || "Property Owner";
    const displayEmail = owner?.email || "No email provided";
    const displayPhone = owner?.phone || owner?.phoneNumber || "No phone provided";
    const displayRole = owner?.role === 'admin' ? 'Administrator' : 'Property Owner';
    const displayAvatar = owner?.photoURL || owner?.avatar || null;
    const isVerified = owner?.verified || owner?.role === 'admin';

    return (
        <>
            <BottomSheet3D isOpen={isOpen} onClose={onClose} className="max-w-sm mx-auto" zIndex={50}>
                <div className="bg-white dark:bg-slate-900 rounded-[40px] shadow-2xl overflow-hidden">

                    {/* Header */}
                    <header className="flex items-center justify-between px-6 pt-4 pb-0">
                        <h2 className="text-[18px] font-black text-slate-900 dark:text-white flex items-center gap-2">
                            <User size={20} className="text-primary dark:text-indigo-400" />
                            Host Profile
                        </h2>
                        <button
                            onClick={onClose}
                            className="size-10 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors"
                        >
                            <X size={20} strokeWidth={2.5} />
                        </button>
                    </header>

                    <main className="p-6 pt-6 flex flex-col items-center">
                        {/* Avatar */}
                        <div className="relative mb-4">
                            <div className="size-24 rounded-[28px] bg-primary/10 flex items-center justify-center text-primary dark:text-indigo-400 overflow-hidden shadow-inner border-4 border-white dark:border-slate-800 shadow-xl shadow-primary/10">
                                {displayAvatar ? (
                                    <img loading="lazy" src={displayAvatar} alt={displayName} className="w-full h-full object-cover" />
                                ) : (
                                    <span className="text-3xl font-black uppercase">{displayName.charAt(0)}</span>
                                )}
                            </div>
                            {isVerified && (
                                <div className="absolute -bottom-2 -right-2 bg-emerald-500 text-white p-1.5 rounded-xl shadow-lg shadow-emerald-500/30 ring-4 ring-white dark:ring-slate-900">
                                    <ShieldCheck size={16} strokeWidth={3} />
                                </div>
                            )}
                        </div>

                        {/* Name & Role */}
                        <h3 className="text-xl font-black text-slate-900 dark:text-white text-center mb-1 leading-tight">{displayName}</h3>
                        <p className="text-[11px] font-black uppercase tracking-widest text-primary dark:text-indigo-400 mb-8 px-3 py-1 bg-primary/10 rounded-lg">
                            {displayRole}
                        </p>

                        {/* Contact Info Cards */}
                        <div className="w-full space-y-3">
                            <button
                                onClick={() => {
                                    if (displayPhone && displayPhone !== "No phone provided") {
                                        setPhoneNumberToCall(displayPhone);
                                        setCallModalOpen(true);
                                    } else {
                                        toast.error("Phone number not available");
                                    }
                                }}
                                className="w-full flex items-center gap-4 p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 hover:border-primary/30 transition-colors group text-left"
                            >
                                <div className="size-10 shrink-0 rounded-xl bg-white dark:bg-slate-800 shadow-sm flex items-center justify-center text-primary dark:text-indigo-400 group-hover:scale-110 transition-transform">
                                    <Phone size={18} strokeWidth={2.5} />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-[10px] uppercase font-black tracking-widest text-slate-400 mb-0.5">Phone Number</p>
                                    <p className="text-[14px] font-bold text-slate-700 dark:text-slate-200 truncate">{displayPhone}</p>
                                </div>
                            </button>

                            <a href={`mailto:${displayEmail}`} className="flex items-center gap-4 p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 hover:border-primary/30 transition-colors group">
                                <div className="size-10 rounded-xl bg-white dark:bg-slate-800 shadow-sm flex items-center justify-center text-primary dark:text-indigo-400 group-hover:scale-110 transition-transform">
                                    <Mail size={18} strokeWidth={2.5} />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-[10px] uppercase font-black tracking-widest text-slate-400 mb-0.5">Email Address</p>
                                    <p className="text-[14px] font-bold text-slate-700 dark:text-slate-200 truncate">{displayEmail}</p>
                                </div>
                            </a>
                        </div>

                        {/* Close Button */}
                        <button
                            onClick={onClose}
                            className="w-full mt-8 bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-black text-[15px] py-4 rounded-[20px] shadow-xl shadow-slate-900/10 dark:shadow-white/10 active:scale-95 transition-transform"
                        >
                            Close Profile
                        </button>
                    </main>
                </div>
            </BottomSheet3D>

            <ConfirmationModal
                isOpen={callModalOpen}
                title="Make a Call to Owner"
                message="Are you sure you want to call the property owner? Your phone dialer will be launched."
                confirmText="Call"
                confirmColor="#16a34a"
                icon={Phone}
                variant="success"
                onConfirm={() => {
                    window.location.href = `tel:${phoneNumberToCall}`;
                    setCallModalOpen(false);
                }}
                onCancel={() => setCallModalOpen(false)}
            />
        </>
    );
}
