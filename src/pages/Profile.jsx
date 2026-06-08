import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { db, auth } from '../firebase';
import { doc, getDoc, collection, query, where, getDocs, setDoc } from 'firebase/firestore';
import { updateProfile } from 'firebase/auth';
import { useAuth } from '../contexts/AuthContext';
import { motion } from 'framer-motion';
import {
  User, Lock, CreditCard, Settings2, LogOut,
  Building2, Heart, Briefcase,
  Gift, Users,
  MessageCircle, ClipboardList,
  Info, Shield, FileText,
  ChevronRight, Camera, CheckCircle2, ShieldAlert,
  Star
} from 'lucide-react';

/* ─── Menu Row ─── */
function MenuRow({ icon: Icon, label, sub, onClick, iconBg = 'bg-primary/10', iconColor = 'text-primary', danger = false }) {
  return (
    <motion.button
      whileTap={{ scale: 0.985 }}
      onClick={onClick}
      className={`w-full flex items-center justify-between px-5 py-4 transition-colors group border-b border-slate-100 dark:border-white/5 last:border-b-0 ${danger ? 'hover:bg-rose-50/60 dark:hover:bg-rose-500/10' : 'hover:bg-slate-50 dark:hover:bg-white/[0.03]'}`}
    >
      <div className="flex items-center gap-4">
        <div className={`size-11 rounded-2xl flex items-center justify-center ${danger ? 'bg-rose-50 dark:bg-rose-500/10' : iconBg}`}>
          <Icon size={20} strokeWidth={2} className={danger ? 'text-rose-500' : iconColor} />
        </div>
        <div className="text-left">
          <p className={`text-[15px] font-bold leading-snug ${danger ? 'text-rose-500' : 'text-slate-900 dark:text-white'}`}>{label}</p>
          {sub && <p className="text-[12px] font-medium text-slate-400 mt-0.5">{sub}</p>}
        </div>
      </div>
      {!danger && (
        <ChevronRight size={18} strokeWidth={2.5} className="text-slate-300 dark:text-slate-600 group-hover:text-primary dark:group-hover:text-indigo-400 transition-colors shrink-0" />
      )}
    </motion.button>
  );
}

/* ─── Section Card ─── */
function SectionCard({ title, children }) {
  return (
    <div className="mb-4">
      <p className="text-[11px] font-black uppercase tracking-[0.12em] text-slate-400 dark:text-slate-500 px-1 mb-2">{title}</p>
      <div className="bg-white dark:bg-[#25243B] rounded-[20px] overflow-hidden border border-slate-100/80 dark:border-white/[0.06] shadow-sm">
        {children}
      </div>
    </div>
  );
}

export default function Profile() {
  const { currentUser, logout, refreshUser } = useAuth();
  const navigate = useNavigate();

  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ listings: 0, bookings: 0, saved: 0 });
  const [avatarUrl, setAvatarUrl] = useState(null);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const fileRef = useRef();

  /* ── Fetch user data ── */
  useEffect(() => {
    if (!currentUser) { navigate('/login'); return; }

    const fetchAll = async () => {
      try {
        const userDoc = await getDoc(doc(db, 'users', currentUser.uid));
        const ud = userDoc.exists()
          ? { ...userDoc.data(), email: currentUser.email }
          : { fullName: currentUser.displayName || '', email: currentUser.email };
        setUserData(ud);
        if (ud.photoURL) setAvatarUrl(ud.photoURL);

        const [listingsSnap, bookingsSnap, savedSnap] = await Promise.all([
          getDocs(query(collection(db, 'properties'), where('userId', '==', currentUser.uid))),
          getDocs(query(collection(db, 'escrowDeposits'), where('tenantId', '==', currentUser.uid))),
          getDoc(doc(db, 'users', currentUser.uid)),
        ]);

        const savedCount = savedSnap.exists() ? (savedSnap.data().savedProperties || []).length : 0;

        setStats({
          listings: listingsSnap.size,
          bookings: bookingsSnap.size,
          saved: savedCount,
        });
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchAll();
  }, [currentUser, navigate]);

  /* ── Avatar upload via Cloudinary ── */
  const handleAvatarChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploadingAvatar(true);
    try {
      const data = new FormData();
      data.append('file', file);
      data.append('upload_preset', import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET || 'cn6piwep');

      const cloudName = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME || 'dmkbsddqk';
      const res = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
        method: 'POST',
        body: data
      });
      const fileData = await res.json();
      
      if (fileData.secure_url) {
        const url = fileData.secure_url;
        const uid = currentUser?.uid || auth.currentUser?.uid;
        if (!uid) throw new Error("User session not found.");

        // Update Firestore
        await setDoc(doc(db, 'users', uid), { photoURL: url }, { merge: true });

        // Update Firebase Auth profile
        if (auth.currentUser) {
          await updateProfile(auth.currentUser, { photoURL: url });
        }

        // Refresh global Auth state
        if (refreshUser) {
          await refreshUser();
        }

        setAvatarUrl(url);
      } else {
        console.error("Cloudinary upload failed:", fileData.error?.message);
        alert(`Upload failed: ${fileData.error?.message || "Unknown error"}`);
      }
    } catch (err) {
      console.error("Avatar change error:", err);
      alert(`Error saving avatar: ${err.message || err}`);
    } finally {
      setUploadingAvatar(false);
    }
  };

  const handleLogout = async () => {
    try { await logout(); navigate('/login'); } catch (e) { console.error(e); }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f6f6f8] dark:bg-[#161626]">
        <div className="size-12 rounded-full border-4 border-primary/20 border-t-primary animate-spin" />
      </div>
    );
  }

  const initials = (() => {
    const name = userData?.fullName || '';
    if (!name) return 'U';
    const parts = name.trim().split(' ');
    return parts.length >= 2 ? `${parts[0][0]}${parts[1][0]}`.toUpperCase() : name[0].toUpperCase();
  })();

  return (
    <div className="min-h-screen bg-[#f6f6f8] dark:bg-[#161626] pb-28">

      {/* ── Hero Header ── */}
      <div className="relative bg-gradient-to-br from-primary to-[#0f1559] dark:from-[#1a1a35] dark:to-[#0a0a1a] pt-10 pb-20 px-5 overflow-hidden">
        {/* Decorative blobs */}
        <div className="absolute -top-16 -right-16 size-56 bg-white/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-8 -left-12 size-48 bg-white/10 rounded-full blur-2xl pointer-events-none" />

        <div className="relative z-10 flex flex-col items-center text-center max-w-sm mx-auto">
          {/* Avatar */}
          <div className="relative mb-4">
            <div
              onClick={() => fileRef.current?.click()}
              className="size-24 rounded-full border-4 border-white/30 shadow-2xl relative bg-primary-dark flex items-center justify-center text-3xl font-black text-white cursor-pointer overflow-hidden group"
            >
              {avatarUrl ? (
                <img src={avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
              ) : (
                <span>{initials}</span>
              )}
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                <Camera size={22} className="text-white" />
              </div>
              {uploadingAvatar && (
                <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                  <div className="size-7 border-3 border-white border-t-transparent rounded-full animate-spin" />
                </div>
              )}
            </div>
            {/* Camera badge */}
            <button
              onClick={() => fileRef.current?.click()}
              className="absolute -bottom-1 -right-1 size-8 bg-white rounded-full flex items-center justify-center shadow-lg border-2 border-primary"
            >
              <Camera size={14} className="text-primary" strokeWidth={2.5} />
            </button>
          </div>
          <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} />

          {/* Name & email */}
          <h1 className="text-[22px] font-black text-white tracking-tight leading-tight">{userData?.fullName || 'Your Name'}</h1>
          <p className="text-white/60 text-sm font-medium mt-0.5">{userData?.email}</p>

          {/* Verified badge */}
          <div className="mt-3 flex items-center gap-1.5 bg-white/10 backdrop-blur-sm border border-white/20 rounded-full px-3 py-1.5">
            {currentUser?.emailVerified ? (
              <>
                <CheckCircle2 size={13} className="text-emerald-300" />
                <span className="text-[11px] font-black text-white/90 uppercase tracking-wider">Verified Member</span>
              </>
            ) : (
              <>
                <ShieldAlert size={13} className="text-amber-300 animate-pulse" />
                <span className="text-[11px] font-black text-amber-300 uppercase tracking-wider">Unverified</span>
              </>
            )}
          </div>
        </div>
      </div>

      {/* ── Stats strip (floating over hero) ── */}
      <div className="max-w-sm mx-auto px-5 -mt-10 mb-6 relative z-10">
        <div className="bg-white dark:bg-[#25243B] rounded-[20px] border border-slate-100 dark:border-white/[0.06] shadow-xl shadow-black/10 grid grid-cols-3 divide-x divide-slate-100 dark:divide-white/[0.06]">
          {[
            { label: 'Listings', value: stats.listings, icon: Building2 },
            { label: 'Bookings', value: stats.bookings, icon: Briefcase },
            { label: 'Saved', value: stats.saved, icon: Heart },
          ].map(({ label, value, icon: Icon }) => (
            <div key={label} className="flex flex-col items-center py-4 gap-1">
              <Icon size={16} className="text-primary dark:text-indigo-400" strokeWidth={2.5} />
              <span className="text-xl font-black text-slate-900 dark:text-white">{value}</span>
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">{label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* ── Menu Sections ── */}
      <div className="max-w-sm mx-auto px-5">

        {/* 1. Account Settings */}
        <SectionCard title="Account Settings">
          <MenuRow
            icon={User}
            label="Edit Profile"
            sub="Name, phone, photo & location"
            iconBg="bg-blue-50 dark:bg-blue-500/10"
            iconColor="text-blue-600 dark:text-blue-400"
            onClick={() => navigate('/edit-profile')}
          />
          <MenuRow
            icon={Lock}
            label="Change Password"
            sub="Update your login credentials"
            iconBg="bg-violet-50 dark:bg-violet-500/10"
            iconColor="text-violet-600 dark:text-violet-400"
            onClick={() => navigate('/change-password')}
          />
          <MenuRow
            icon={CreditCard}
            label="Payment Options"
            sub="Cards, mobile banking & more"
            iconBg="bg-emerald-50 dark:bg-emerald-500/10"
            iconColor="text-emerald-600 dark:text-emerald-400"
            onClick={() => navigate('/my-bookings')}
          />
          <MenuRow
            icon={Settings2}
            label="App Preferences"
            sub="Language, theme & notifications"
            iconBg="bg-slate-100 dark:bg-white/10"
            iconColor="text-slate-600 dark:text-slate-300"
            onClick={() => navigate('/settings')}
          />
        </SectionCard>

        {/* 2. Listings & Bookings */}
        <SectionCard title="Listings & Bookings">
          <MenuRow
            icon={Building2}
            label="My Listings"
            sub="Manage your posted properties"
            iconBg="bg-primary/10 dark:bg-primary/20"
            iconColor="text-primary dark:text-indigo-400"
            onClick={() => navigate('/my-listings')}
          />
          <MenuRow
            icon={Heart}
            label="Saved Properties"
            sub="Your wishlist & favourites"
            iconBg="bg-rose-50 dark:bg-rose-500/10"
            iconColor="text-rose-500 dark:text-rose-400"
            onClick={() => navigate('/favorites')}
          />
          <MenuRow
            icon={Briefcase}
            label="Booking Escrow"
            sub="Track deposits & move-ins"
            iconBg="bg-amber-50 dark:bg-amber-500/10"
            iconColor="text-amber-600 dark:text-amber-400"
            onClick={() => navigate('/my-bookings')}
          />
        </SectionCard>

        {/* 3. Refer a Owner */}
        <SectionCard title="Refer a Owner">
          <MenuRow
            icon={Gift}
            label="Refer a Owner"
            sub="Invite owners & earn rewards"
            iconBg="bg-fuchsia-50 dark:bg-fuchsia-500/10"
            iconColor="text-fuchsia-600 dark:text-fuchsia-400"
            onClick={() => navigate('/referral')}
          />
          <MenuRow
            icon={Users}
            label="My Referrals"
            sub="Track friends you have invited"
            iconBg="bg-sky-50 dark:bg-sky-500/10"
            iconColor="text-sky-600 dark:text-sky-400"
            onClick={() => navigate('/referral')}
          />
        </SectionCard>

        {/* 4. 24/7 Help & Support */}
        <SectionCard title="24/7 Help & Support">
          <MenuRow
            icon={MessageCircle}
            label="Contact Support"
            sub="Chat with our support team"
            iconBg="bg-teal-50 dark:bg-teal-500/10"
            iconColor="text-teal-600 dark:text-teal-400"
            onClick={() => navigate('/contact')}
          />
          <MenuRow
            icon={ClipboardList}
            label="Inquiry History"
            sub="View all your enquiries"
            iconBg="bg-orange-50 dark:bg-orange-500/10"
            iconColor="text-orange-600 dark:text-orange-400"
            onClick={() => navigate('/enquiry')}
          />
        </SectionCard>

        {/* 5. Legal */}
        <SectionCard title="Legal & Information">
          <MenuRow
            icon={Info}
            label="About Us"
            sub="Learn more about Any.Let"
            iconBg="bg-primary/10 dark:bg-primary/20"
            iconColor="text-primary dark:text-indigo-400"
            onClick={() => navigate('/about')}
          />
          <MenuRow
            icon={Shield}
            label="Privacy Policy"
            sub="How we protect your data"
            iconBg="bg-slate-100 dark:bg-white/10"
            iconColor="text-slate-600 dark:text-slate-300"
            onClick={() => navigate('/privacy-policy')}
          />
          <MenuRow
            icon={FileText}
            label="Terms & Conditions"
            sub="Our terms of service"
            iconBg="bg-slate-100 dark:bg-white/10"
            iconColor="text-slate-600 dark:text-slate-300"
            onClick={() => navigate('/terms')}
          />
        </SectionCard>

        {/* Sign Out */}
        <div className="mb-10">
          <div className="bg-white dark:bg-[#25243B] rounded-[20px] overflow-hidden border border-slate-100/80 dark:border-white/[0.06] shadow-sm">
            <MenuRow
              icon={LogOut}
              label="Sign Out"
              onClick={handleLogout}
              danger
            />
          </div>
        </div>

        {/* App Version */}
        <p className="text-center text-[11px] font-semibold text-slate-400 pb-4">Any.Let · Version 1.0.0</p>

      </div>
    </div>
  );
}
