import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { auth, db } from '../firebase';
import { signOut } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { useAuth } from '../contexts/AuthContext';
import {
    ArrowLeft, Settings, User, Lock, Building2, Heart,
    History, ChevronRight, Phone,
    Info, HelpCircle, ShieldCheck, FileText, Map, ShieldAlert, Gift
} from 'lucide-react';
import { motion } from 'framer-motion';

export default function Profile() {
    const { currentUser } = useAuth();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [userData, setUserData] = useState({
        fullName: '',
        phone: '',
        email: ''
    });

    useEffect(() => {
        if (!currentUser) {
            navigate('/login');
            return;
        }

        const fetchUserData = async () => {
            try {
                const docRef = doc(db, 'users', currentUser.uid);
                const docSnap = await getDoc(docRef);
                if (docSnap.exists()) {
                    setUserData({
                        ...docSnap.data(),
                        email: currentUser.email
                    });
                } else {
                    setUserData({
                        fullName: currentUser.displayName || '',
                        email: currentUser.email,
                        phone: ''
                    });
                }
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        };

        fetchUserData();
    }, [currentUser, navigate]);

    if (loading) return <div className="p-20 text-center animate-pulse text-[#1a227f]">Loading profile...</div>;

    // Get initials for avatar
    const getInitials = (name) => {
        if (!name) return 'U';
        const parts = name.split(' ');
        if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
        return name[0].toUpperCase();
    };

    return (
        <div className="flex flex-col min-h-screen bg-white dark:bg-slate-950 pb-32">
            {/* Header */}
            <header className="flex items-center justify-between p-6 bg-white dark:bg-slate-950 sticky top-0 z-10">
                <button onClick={() => navigate(-1)} className="text-[#1a227f] dark:text-white p-2 border border-transparent">
                    <ArrowLeft size={20} strokeWidth={2.5} />
                </button>
                <h1 className="text-[14px] font-[900] text-[#1a227f] dark:text-white tracking-[0.2em] uppercase">Profile</h1>
                <div className="flex items-center gap-2">
                    <button className="text-[#1a227f] dark:text-white p-2 border border-transparent hover:opacity-80 transition-opacity" onClick={() => navigate('/settings')}>
                        <Settings size={20} strokeWidth={2.5} />
                    </button>
                </div>
            </header>

            {/* Profile Hero */}
            <div className="flex flex-col items-center px-6 pt-2 pb-6">
                <div className="relative mb-5">
                    <div className="size-[100px] rounded-full bg-[#1a227f] text-white flex items-center justify-center text-4xl font-bold shadow-md">
                        {getInitials(userData.fullName)}
                    </div>
                    {/* Online status indicator */}
                    <div className="absolute bottom-1 right-1 size-5 bg-white rounded-full flex items-center justify-center">
                        <div className="size-3.5 bg-[#10b981] rounded-full" />
                    </div>
                </div>

                <h2 className="text-xl font-[900] text-[#1a227f] dark:text-white mb-1 tracking-tight">
                    {userData.fullName || 'Awesome User'}
                </h2>

                <div className="flex flex-col items-center gap-1">
                    {currentUser?.emailVerified ? (
                        <span className="text-[#1a227f] text-[10px] font-black uppercase tracking-[0.15em]">Verified Member</span>
                    ) : (
                        <span className="text-rose-500 text-[10px] font-black uppercase tracking-[0.15em]">Pending Verification</span>
                    )}
                    <div className="flex items-center gap-2 text-[#94a3b8] font-bold text-[10px] uppercase tracking-wider mt-0.5">
                        Member since {
                            userData.createdAt 
                            ? (userData.createdAt.toDate ? userData.createdAt.toDate().getFullYear() : new Date(userData.createdAt).getFullYear())
                            : (currentUser?.metadata?.creationTime ? new Date(currentUser.metadata.creationTime).getFullYear() : '2026')
                        }
                    </div>
                    <div className="flex items-center gap-2 text-[#94a3b8] font-semibold text-xs mt-1">
                        <Phone size={12} strokeWidth={2.5} />
                        <span>{userData.phone || '+880 1700-000000'}</span>
                    </div>
                </div>
            </div>

            {/* Content Sections */}
            <div className="px-6 space-y-8 mt-2">
                {!currentUser?.emailVerified && (
                    <motion.div 
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        onClick={() => navigate('/verify-email')}
                        className="bg-rose-50 dark:bg-rose-900/10 border border-rose-100 dark:border-rose-900/30 p-5 rounded-[28px] flex items-center gap-4 cursor-pointer hover:bg-rose-100 transition-colors"
                    >
                        <div className="size-10 bg-rose-500 text-white rounded-2xl flex items-center justify-center shadow-lg shadow-rose-500/20">
                            <ShieldAlert size={20} />
                        </div>
                        <div className="flex-1">
                            <p className="text-sm font-black text-rose-600 dark:text-rose-400">Account Not Verified</p>
                            <p className="text-[11px] font-bold text-rose-500/80">Tap here to verify your email and unlock all features.</p>
                        </div>
                        <ChevronRight size={16} className="text-rose-400" />
                    </motion.div>
                )}

                {/* Account Settings */}
                <Section title="Account Settings">
                    <ProfileMenuItem
                        icon={<User size={18} strokeWidth={2} />}
                        label="Edit Profile"
                        onClick={() => navigate('/edit-profile')}
                    />
                    <ProfileMenuItem
                        icon={<Lock size={18} strokeWidth={2} />}
                        label="Change Password"
                        onClick={() => navigate('/change-password')}
                    />
                </Section>

                {/* My Activity */}
                <Section title="My Activity">
                    <ProfileMenuItem
                        icon={<Building2 size={18} strokeWidth={2} />}
                        label="My Listings"
                        onClick={() => navigate('/my-listings')}
                    />
                    <ProfileMenuItem
                        icon={<Heart size={18} strokeWidth={2} />}
                        label="Saved Homes"
                        onClick={() => navigate('/favorites')}
                    />
                    <ProfileMenuItem
                        icon={<History size={18} strokeWidth={2} />}
                        label="Inquiry History"
                        onClick={() => navigate('/enquiry')}
                    />
                    <ProfileMenuItem
                        icon={<Gift size={18} strokeWidth={2} />}
                        label="Refer A Friend"
                        onClick={() => navigate('/referral')}
                    />
                </Section>

                {/* Company & Legal */}
                <Section title="Company & Legal">
                    <ProfileMenuItem
                        icon={<Info size={18} strokeWidth={2} />}
                        label="About Us"
                        onClick={() => navigate('/about')}
                    />
                    <ProfileMenuItem
                        icon={<HelpCircle size={18} strokeWidth={2} />}
                        label="Contact Support"
                        onClick={() => navigate('/contact')}
                    />
                    <ProfileMenuItem
                        icon={<Map size={18} strokeWidth={2} />}
                        label="Sitemap"
                        onClick={() => navigate('/sitemap')}
                    />
                    <ProfileMenuItem
                        icon={<ShieldCheck size={18} strokeWidth={2} />}
                        label="Privacy Policy"
                        onClick={() => navigate('/privacy-policy')}
                    />
                    <ProfileMenuItem
                        icon={<FileText size={18} strokeWidth={2} />}
                        label="Terms & Conditions"
                        onClick={() => navigate('/terms')}
                    />
                </Section>
            </div>
        </div>
    );
}

function Section({ title, children }) {
    return (
        <div className="space-y-3">
            <h3 className="text-[10px] font-[900] uppercase tracking-[0.2em] text-[#94a3b8] ml-1">{title}</h3>
            <div className="bg-[#f8fafc] dark:bg-slate-900 border border-[#f1f5f9] dark:border-slate-800 rounded-3xl overflow-hidden shadow-sm">
                <div className="divide-y divide-[#f1f5f9] dark:divide-slate-800">
                    {children}
                </div>
            </div>
        </div>
    );
}

function ProfileMenuItem({ icon, label, onClick }) {
    return (
        <button
            onClick={onClick}
            className="w-full flex items-center justify-between p-5 group transition-colors active:bg-white dark:active:bg-slate-800"
        >
            <div className="flex items-center gap-4">
                <div className="size-9 bg-white dark:bg-slate-800 border border-[#f1f5f9] dark:border-slate-700 rounded-[14px] flex items-center justify-center text-[#94a3b8] shadow-sm">
                    {icon}
                </div>
                <span className="text-sm font-[800] text-[#1e293b] dark:text-slate-200">{label}</span>
            </div>
            <ChevronRight size={16} strokeWidth={3} className="text-[#cbd5e1] dark:text-slate-600" />
        </button>
    );
}
