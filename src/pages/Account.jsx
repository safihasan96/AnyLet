import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { db, auth } from '../firebase';
import { doc, onSnapshot, collection, query, where, getDocs, setDoc, getCountFromServer } from 'firebase/firestore';
import { updateProfile, sendEmailVerification } from 'firebase/auth';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import { motion, AnimatePresence, useMotionValue, useTransform, useSpring, useReducedMotion } from 'framer-motion';
import logger from '../utils/logger';
import KYCVerification from '../components/KYCVerification';
import {
  User, Lock, CreditCard, Settings2, LogOut,
  Building2, Heart, Briefcase,
  Gift, Users, Star,
  MessageCircle, ClipboardList,
  Info, Shield, FileText,
  ChevronDown, Camera, CheckCircle2, ShieldAlert,
  ShieldCheck, Upload, X, Clock, Loader2, Sparkles, Crown, Receipt
} from 'lucide-react';
import { ProfileSkeleton } from '../components/Skeleton';
import { getApiUrl } from '../utils/api';

/* ─────────────────────────────────────────────────────────────
   ANIMATION VARIANTS
   All variants use ONLY transform/opacity for 60fps GPU rendering.
   Configured to match the spring dynamics and sliding axis of the Inbox page.
 ───────────────────────────────────────────────────────────────*/
const pageVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.06, delayChildren: 0.04 }
  }
};

const heroVariants = {
  hidden: { opacity: 0, x: -32 },
  visible: {
    opacity: 1, x: 0,
    transition: { type: 'spring', stiffness: 90, damping: 20 }
  }
};

const avatarVariants = {
  hidden: { opacity: 0, scale: 0.72 },
  visible: {
    opacity: 1, scale: 1,
    transition: { type: 'spring', stiffness: 360, damping: 22, delay: 0.08 }
  }
};

const textVariants = {
  hidden: { opacity: 0, x: -20 },
  visible: {
    opacity: 1, x: 0,
    transition: { type: 'spring', stiffness: 200, damping: 24 }
  }
};

const sectionVariants = {
  hidden: { opacity: 0, x: -20 },
  visible: {
    opacity: 1, x: 0,
    transition: { type: 'spring', stiffness: 200, damping: 24 }
  }
};

/* ─────────────────────────────────────────────────────────────
   3D TILT CARD
   Uses hover positioning and spring physics for premium response.
 ───────────────────────────────────────────────────────────────*/
function TiltCard({ children, onClick, className, variants, style = {} }) {
  const ref = useRef(null);
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const shouldReduce = useReducedMotion();

  const rotateX = useTransform(y, [-0.5, 0.5], [3, -3]);
  const rotateY = useTransform(x, [-0.5, 0.5], [-5, 5]);
  const sRotateX = useSpring(rotateX, { stiffness: 400, damping: 30 });
  const sRotateY = useSpring(rotateY, { stiffness: 400, damping: 30 });

  function handleMouseMove(e) {
    if (shouldReduce) return;
    const rect = ref.current.getBoundingClientRect();
    x.set((e.clientX - rect.left) / rect.width - 0.5);
    y.set((e.clientY - rect.top) / rect.height - 0.5);
  }
  function handleMouseLeave() { x.set(0); y.set(0); }

  return (
    <motion.div
      ref={ref}
      variants={variants}
      onClick={onClick}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      whileTap={{ scale: 0.98 }}
      style={{
        rotateX: shouldReduce ? 0 : sRotateX,
        rotateY: shouldReduce ? 0 : sRotateY,
        perspective: 800,
        transformStyle: 'preserve-3d',
        willChange: 'transform',
        ...style
      }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

// Accordion open/close
const accordionVariants = {
  closed: {
    height: 0,
    opacity: 0,
    transition: { height: { type: 'spring', stiffness: 340, damping: 30 }, opacity: { duration: 0.15 } }
  },
  open: {
    height: 'auto',
    opacity: 1,
    transition: {
      height: { type: 'spring', stiffness: 340, damping: 30 },
      opacity: { duration: 0.2, delay: 0.05 },
      staggerChildren: 0.05,
      delayChildren: 0.06
    }
  }
};

// Stagger child items inside accordion
const itemVariants = {
  closed: { opacity: 0, x: -10 },
  open: {
    opacity: 1, x: 0,
    transition: { type: 'spring', stiffness: 340, damping: 28 }
  }
};

const chevronVariants = {
  closed: { rotate: 0 },
  open: { rotate: 180, transition: { type: 'spring', stiffness: 360, damping: 26 } }
};

const kycOverlayVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.22 } },
  exit: { opacity: 0, transition: { duration: 0.18 } }
};

const kycModalVariants = {
  hidden: { opacity: 0, scale: 0.88, y: 32 },
  visible: {
    opacity: 1, scale: 1, y: 0,
    transition: { type: 'spring', stiffness: 380, damping: 28, mass: 0.9 }
  },
  exit: {
    opacity: 0, scale: 0.88, y: 32,
    transition: { duration: 0.16 }
  }
};

/* ─────────────────────────────────────────────────────────────
   MENU ROW — individual item inside an accordion section
───────────────────────────────────────────────────────────────*/
function MenuItem({ icon: Icon, label, sub, onClick, danger = false }) {
  return (
    <motion.button
      variants={itemVariants}
      whileTap={{ scale: 0.97 }}
      onClick={onClick}
      className={`transform-gpu will-change-transform w-full flex items-center gap-3.5 px-5 py-3.5 transition-colors
        border-b border-slate-100/70 dark:border-white/[0.04] last:border-b-0
        ${danger
          ? 'hover:bg-rose-50/80 dark:hover:bg-rose-500/[0.08]'
          : 'hover:bg-primary/[0.04] dark:hover:bg-primary/[0.08]'
        }`}
    >
      <div className={`size-9 rounded-xl flex items-center justify-center shrink-0
        ${danger ? 'bg-rose-50 dark:bg-rose-500/10' : 'bg-primary/10 dark:bg-primary/[0.18]'}`}>
        <Icon size={16} strokeWidth={2.1}
          className={danger ? 'text-rose-500' : 'text-primary dark:text-indigo-400'} />
      </div>
      <div className="text-left flex-1 min-w-0">
        <p className={`text-[13.5px] font-semibold leading-snug truncate
          ${danger ? 'text-rose-500' : 'text-slate-800 dark:text-slate-100'}`}>{label}</p>
        {sub && <p className="text-[11px] font-medium text-slate-400 dark:text-slate-500 mt-0.5 truncate">{sub}</p>}
      </div>
    </motion.button>
  );
}

/* ─────────────────────────────────────────────────────────────
   ACCORDION SECTION
───────────────────────────────────────────────────────────────*/
function AccordionSection({ icon: Icon, title, badge, children, defaultOpen = false }) {
  const [open, setOpen] = useState(defaultOpen);
  const shouldReduceMotion = useReducedMotion();

  return (
    <motion.div
      variants={sectionVariants}
      className="bg-white dark:bg-[#1A1D24] rounded-2xl overflow-hidden border border-slate-100/80 dark:border-white/[0.06] shadow-sm"
    >
      <button
        onClick={() => setOpen(v => !v)}
        className="w-full flex items-center gap-3.5 px-5 py-4 hover:bg-slate-50/70 dark:hover:bg-white/[0.03] transition-colors"
        aria-expanded={open}
      >
        <div className="size-10 rounded-xl bg-primary/10 dark:bg-primary/[0.18] flex items-center justify-center shrink-0">
          <Icon size={18} strokeWidth={2} className="text-primary dark:text-indigo-400" />
        </div>
        <span className="flex-1 text-left text-[14.5px] font-bold text-slate-900 dark:text-white">{title}</span>
        {badge && (
          <span className="text-[10px] font-black uppercase tracking-widest text-white bg-primary rounded-full px-2.5 py-0.5 mr-1">
            {badge}
          </span>
        )}
        <motion.div
          variants={chevronVariants}
          animate={shouldReduceMotion ? undefined : (open ? 'open' : 'closed')}
          className="shrink-0"
        >
          <ChevronDown size={16} strokeWidth={2.5} className="text-slate-400 dark:text-slate-500" />
        </motion.div>
      </button>

      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            key="content"
            variants={accordionVariants}
            initial="closed"
            animate="open"
            exit="closed"
            className="overflow-hidden"
          >
            <div className="border-t border-slate-100 dark:border-white/[0.05]">
              {children}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

/* ─────────────────────────────────────────────────────────────
   STAT BLOCK — used inside the white profile card
───────────────────────────────────────────────────────────────*/
function StatBlock({ icon: Icon, iconBg, iconColor, value, label, onClick, isLoading = false }) {
  return (
    <motion.button
      whileHover={{ scale: 1.06, y: -2 }}
      whileTap={{ scale: 0.95 }}
      onClick={onClick}
      transition={{ type: 'spring', stiffness: 420, damping: 22 }}
      className="transform-gpu flex flex-col items-center gap-2 px-3 py-1 cursor-pointer"
    >
      <div className={`size-11 rounded-2xl flex items-center justify-center ${iconBg}`}>
        <Icon size={20} strokeWidth={2} className={iconColor} />
      </div>
      <span className={`text-[15px] font-black text-slate-900 dark:text-white leading-none ${isLoading ? 'animate-pulse text-slate-300 dark:text-slate-500' : ''}`}>
        {isLoading ? '—' : value}
      </span>
      <span className="text-[10.5px] font-semibold uppercase tracking-widest text-slate-400 dark:text-slate-500">{label}</span>
    </motion.button>
  );
}


/* ─────────────────────────────────────────────────────────────
   DYNAMIC MEMBER BADGE
   Reads live from Firestore: membershipTier, membershipLevel,
   verification.isKycApproved, onboardingStatus, emailVerified.
   Updates in real-time via onSnapshot — no page reload needed.
───────────────────────────────────────────────────────────────*/
function DynamicMemberBadge({ userData, isEmailVerified, toast }) {
  const tier = userData?.membershipTier || 'Standard';
  const level = userData?.membershipLevel || 1;
  const isKycApproved = userData?.verification?.isKycApproved === true;
  const kycPending = userData?.onboardingStatus === 'PENDING_VERIFICATION';

  // Tier display config
  const tierConfig = (() => {
    const t = tier.toLowerCase();
    if (t.includes('premium')) return { label: tier, icon: <Crown size={13} className="text-amber-500 fill-amber-400" />, color: 'text-amber-600 dark:text-amber-400' };
    if (t.includes('pro'))     return { label: tier, icon: <Crown size={13} className="text-violet-500 fill-violet-400" />, color: 'text-violet-600 dark:text-violet-400' };
    if (t.includes('elite'))   return { label: tier, icon: <Crown size={13} className="text-rose-500 fill-rose-400" />, color: 'text-rose-600 dark:text-rose-400' };
    return { label: 'Standard Member', icon: <User size={13} className="text-slate-400" />, color: 'text-slate-500 dark:text-slate-400' };
  })();

  // Verification pill
  const verificationPill = (() => {
    if (!isEmailVerified) return (
      <button
        onClick={async () => {
          try { await sendEmailVerification(auth.currentUser); toast.success('Verification email sent!'); }
          catch { toast.error('Failed to send. Try again later.'); }
        }}
        className="flex items-center gap-1 bg-amber-400/15 border border-amber-400/30 rounded-full px-2.5 py-0.5 hover:bg-amber-400/25 transition-all active:scale-95"
      >
        <ShieldAlert size={10} className="text-amber-500 animate-pulse" />
        <span className="text-[9.5px] font-black text-amber-500 uppercase tracking-wider">Verify Email</span>
      </button>
    );
    if (isKycApproved) return (
      <div className="flex items-center gap-1 bg-emerald-400/15 border border-emerald-400/30 rounded-full px-2.5 py-0.5">
        <ShieldCheck size={10} className="text-emerald-500" />
        <span className="text-[9.5px] font-black text-emerald-500 uppercase tracking-wider">Verified</span>
      </div>
    );
    if (kycPending) return (
      <div className="flex items-center gap-1 bg-sky-400/15 border border-sky-400/30 rounded-full px-2.5 py-0.5">
        <Clock size={10} className="text-sky-500 animate-pulse" />
        <span className="text-[9.5px] font-black text-sky-500 uppercase tracking-wider">Under Review</span>
      </div>
    );
    return (
      <div className="flex items-center gap-1 bg-slate-100 dark:bg-white/10 border border-slate-200 dark:border-white/15 rounded-full px-2.5 py-0.5">
        <CheckCircle2 size={10} className="text-slate-400 dark:text-slate-500" />
        <span className="text-[9.5px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-wider">Member</span>
      </div>
    );
  })();

  return (
    <div className="flex justify-center">
      {/* Verification status pill */}
      {verificationPill}
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────
   MAIN PROFILE PAGE
───────────────────────────────────────────────────────────────*/
export default function Profile() {
  const { currentUser, logout, refreshUser } = useAuth();
  const navigate = useNavigate();
  const toast = useToast();
  const shouldReduceMotion = useReducedMotion();

  const [userData, setUserData] = useState(() => currentUser ? { fullName: currentUser.displayName, email: currentUser.email } : null);
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState({ listings: 0, bookings: 0, reviews: 0 });
  const [statsLoading, setStatsLoading] = useState(true);
  const [avatarUrl, setAvatarUrl] = useState(null);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const fileRef = useRef();

  /* KYC State */
  const [showKycModal, setShowKycModal] = useState(false);
  const [kycDocType, setKycDocType] = useState('nid');
  const [kycFile, setKycFile] = useState(null);
  const [kycPreview, setKycPreview] = useState(null);
  const [kycUploading, setKycUploading] = useState(false);
  const kycFileRef = useRef();

  /* ── Live Firestore listener — updates profile data instantly ── */
  useEffect(() => {
    if (!currentUser) { navigate('/login'); return; }

    setLoading(true);
    const userRef = doc(db, 'users', currentUser.uid);

    // onSnapshot gives real-time updates without a page reload
    const unsubscribe = onSnapshot(userRef, async (snap) => {
      try {
        let ud = snap.exists()
          ? { ...snap.data(), email: currentUser.email }
          : { fullName: currentUser.displayName || '', email: currentUser.email };

        // Bootstrap membership fields if new user
        if (!ud.membershipTier || !ud.membershipLevel) {
          const defaults = { membershipTier: 'Standard', membershipLevel: 1 };
          Object.assign(ud, defaults);
          // Write defaults to Firestore (only if doc exists, avoids creating phantom docs)
          if (snap.exists()) {
            await setDoc(userRef, defaults, { merge: true });
          }
        }

        setUserData(ud);
        if (ud.photoURL) setAvatarUrl(ud.photoURL);
      } catch (err) {
        logger.error('Firestore snapshot error:', err);
      } finally {
        setLoading(false);
      }
    }, (err) => {
      logger.error('Firestore listener error:', err);
      setLoading(false);
    });

    return () => unsubscribe(); // cleanup on unmount
  }, [currentUser, navigate]);

  /* ── Fetch stats separately in background with getCountFromServer ── */
  useEffect(() => {
    if (!currentUser) return;

    let isMounted = true;
    setStatsLoading(true);

    async function fetchStats() {
      try {
        const [listingsCount, bookingsCount, propertyReviewsCount, ownerReviewsCount] = await Promise.all([
          // 'ownerId' is the exact field saved by AddProperty.jsx — no or() needed, no index required
          getCountFromServer(query(
            collection(db, 'properties'),
            where('ownerId', '==', currentUser.uid)
          )),
          getCountFromServer(query(collection(db, 'escrowDeposits'), where('tenantId', '==', currentUser.uid))),
          getCountFromServer(query(collection(db, 'propertyReviews'), where('reviewerId', '==', currentUser.uid))),
          getCountFromServer(query(collection(db, 'ownerReviews'), where('reviewerId', '==', currentUser.uid))),
        ]);

        if (isMounted) {
          setStats({
            listings: listingsCount.data().count,
            bookings: bookingsCount.data().count,
            reviews: propertyReviewsCount.data().count + ownerReviewsCount.data().count,
          });
        }
      } catch (err) {
        logger.error('Error fetching stats count:', err);
      } finally {
        if (isMounted) {
          setStatsLoading(false);
        }
      }
    }

    fetchStats();
    return () => { isMounted = false; };
  }, [currentUser]);

  /* ── Avatar upload via Cloudinary ── */
  const handleAvatarChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploadingAvatar(true);
    try {
      const sigRes = await fetch(getApiUrl('/api/cloudinary-sign'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${await auth.currentUser.getIdToken()}`,
        },
        body: JSON.stringify({ isKyc: false })
      });
      const sigData = await sigRes.json();
            if (!sigRes.ok) throw new Error(sigData.error || 'Failed to generate secure upload signature. Ensure backend API keys are configured.');

      const data = new FormData();
      data.append('file', file);
      data.append('api_key', sigData.apiKey);
      data.append('timestamp', sigData.timestamp);
      data.append('signature', sigData.signature);
      data.append('folder', sigData.folder);

      const res = await fetch(`https://api.cloudinary.com/v1_1/${sigData.cloudName}/image/upload`, { method: 'POST', body: data });
      const fileData = await res.json();
      if (fileData.secure_url) {
        const url = fileData.secure_url;
        const uid = currentUser?.uid || auth.currentUser?.uid;
        if (!uid) throw new Error('User session not found.');
        await setDoc(doc(db, 'users', uid), { photoURL: url }, { merge: true });
        if (auth.currentUser) await updateProfile(auth.currentUser, { photoURL: url });
        if (refreshUser) await refreshUser();
        setAvatarUrl(url);
        toast.success('Profile photo updated!');
      } else {
        toast.error(`Upload failed: ${fileData.error?.message || 'Unknown error'}`);
      }
    } catch (err) {
      logger.error('Avatar change error:', err);
      toast.error(`Error saving avatar: ${err.message || err}`);
    } finally {
      setUploadingAvatar(false);
    }
  };

  const handleLogout = async () => {
    try { await logout(); navigate('/login'); } catch (e) { logger.error(e); }
  };

  if (loading) return <ProfileSkeleton />;

  const initials = (() => {
    const name = userData?.fullName || '';
    if (!name) return 'U';
    const parts = name.trim().split(' ');
    return parts.length >= 2 ? `${parts[0][0]}${parts[1][0]}`.toUpperCase() : name[0].toUpperCase();
  })();

  const isEmailVerified = currentUser?.emailVerified;
  const isKycApproved = userData?.verification?.isKycApproved === true;
  const kycPending = userData?.onboardingStatus === 'PENDING_VERIFICATION';

  const motionConfig = shouldReduceMotion
    ? { initial: false, animate: 'visible' }
    : { initial: 'hidden', animate: 'visible' };

  return (
    <motion.div
      variants={pageVariants}
      {...motionConfig}
      className="min-h-screen bg-transparent pb-28 lg:pb-12"
    >
      {/* Desktop two-column wrapper */}
      <div className="lg:max-w-[1100px] lg:mx-auto lg:px-8 lg:py-12 lg:flex lg:gap-10 lg:items-start">
      {/* ══════════════════════════════════════════════
          HERO — short dark banner (no overflow-hidden so avatar can float out)
      ══════════════════════════════════════════════ */}
      <motion.div
        variants={heroVariants}
        className="relative bg-gradient-to-br from-[#1a227f] via-[#1e2a9a] to-[#0f1559] dark:from-[#1a1a35] dark:via-[#14143a] dark:to-[#0a0a1a] lg:hidden"
        style={{ paddingBottom: '140px' }}
      >
        {/* Ambient orbs */}
        <motion.div aria-hidden
          className="absolute -top-16 -right-16 size-64 rounded-full pointer-events-none opacity-25"
          animate={{ x: [0, 24, -8, 0], y: [0, -20, 14, 0] }}
          transition={{ duration: 14, repeat: Infinity, ease: 'linear' }}
          style={{ background: 'radial-gradient(circle, rgba(140,150,255,0.55) 0%, transparent 70%)' }}
        />
        <motion.div aria-hidden
          className="absolute top-4 left-1/4 size-40 rounded-full pointer-events-none opacity-15"
          animate={{ x: [0, -14, 14, 0], y: [0, 10, -6, 0] }}
          transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
          style={{ background: 'radial-gradient(circle, rgba(180,190,255,0.4) 0%, transparent 70%)' }}
        />
        {/* Grid texture */}
        <div aria-hidden className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: 'linear-gradient(rgba(255,255,255,.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.5) 1px, transparent 1px)',
            backgroundSize: '34px 34px'
          }}
        />
        {/* Top padding only — content lives in the card below */}
        <div className="relative z-10 px-5" style={{ paddingTop: 'calc(8rem + env(safe-area-inset-top))' }} />
      </motion.div>

      {/* ── Desktop Left Column: Profile Card ── */}
      <div className="lg:w-[320px] lg:shrink-0">
        {/* Desktop standalone profile card (no hero overlap) */}
        <div className="hidden lg:block bg-gradient-to-br from-[#1a227f] via-[#1e2a9a] to-[#0f1559] dark:from-[#1a1a35] dark:via-[#14143a] dark:to-[#0a0a1a] rounded-[32px] p-8 mb-5 relative overflow-hidden shadow-2xl shadow-primary/20">
          <div aria-hidden className="absolute -top-10 -right-10 size-48 rounded-full opacity-20" style={{ background: 'radial-gradient(circle, rgba(140,150,255,0.55) 0%, transparent 70%)' }} />
          <div className="flex flex-col items-center gap-3 relative z-10">
            <div
              onClick={() => fileRef.current?.click()}
              className="size-24 rounded-[22px] shadow-2xl relative flex items-center justify-center text-3xl font-black text-white cursor-pointer overflow-hidden group bg-[#0f1559] border-4 border-white/20"
            >
              {avatarUrl ? (
                <img loading="lazy" src={avatarUrl} alt="Profile avatar" className="w-full h-full object-cover" />
              ) : (
                <span>{initials}</span>
              )}
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                <Camera size={22} className="text-white" />
              </div>
            </div>
            <div className="text-center">
              <h2 className="text-xl font-black text-white">{userData?.fullName || 'Your Name'}</h2>
              <p className="text-indigo-200 text-sm font-semibold mt-0.5">{userData?.email}</p>
            </div>
            <DynamicMemberBadge userData={userData} isEmailVerified={isEmailVerified} toast={toast} />
          </div>
          <div className="grid grid-cols-3 gap-3 mt-6 relative z-10">
            <button onClick={() => navigate('/my-listings')} className="flex flex-col items-center gap-1 bg-white/10 rounded-2xl py-3 hover:bg-white/20 transition-colors">
              <span className="text-white font-black text-lg">{statsLoading ? '—' : stats.listings}</span>
              <span className="text-indigo-200 text-[10px] font-bold uppercase tracking-wider">Listings</span>
            </button>
            <button onClick={() => navigate('/my-reviews')} className="flex flex-col items-center gap-1 bg-white/10 rounded-2xl py-3 hover:bg-white/20 transition-colors">
              <span className="text-white font-black text-lg">{statsLoading ? '—' : stats.reviews}</span>
              <span className="text-indigo-200 text-[10px] font-bold uppercase tracking-wider">Reviews</span>
            </button>
            <button onClick={() => navigate('/my-bookings')} className="flex flex-col items-center gap-1 bg-white/10 rounded-2xl py-3 hover:bg-white/20 transition-colors">
              <span className="text-white font-black text-lg">{statsLoading ? '—' : stats.bookings}</span>
              <span className="text-indigo-200 text-[10px] font-bold uppercase tracking-wider">Bookings</span>
            </button>
          </div>
        </div>

        {/* ════ FLOATING PROFILE CARD (mobile only) ════ */}
        <div className="lg:hidden max-w-lg mx-auto px-8 -mt-[140px] relative z-10">
        <TiltCard
          variants={textVariants}
          className="bg-white dark:bg-[#1A1D24] rounded-[28px] shadow-2xl shadow-black/10 dark:shadow-black/30 border border-slate-100/70 dark:border-white/[0.06] pt-0 pb-4 px-4 cursor-default select-none"
        >
          {/* Avatar — floats up, overlapping the dark header */}
          <motion.div
            variants={avatarVariants}
            className="flex justify-center transform-gpu will-change-transform"
            style={{ marginTop: '-56px', marginBottom: '10px' }}
          >
            <div className="relative">
              <div
                onClick={() => fileRef.current?.click()}
                className="size-[108px] rounded-[26px] shadow-2xl relative flex items-center justify-center text-4xl font-black text-white cursor-pointer overflow-hidden group bg-[#0f1559] border-4 border-white dark:border-[#1A1D24]"
                style={{ boxShadow: '0 12px 40px rgba(0,0,0,0.28)' }}
              >
                {avatarUrl ? (
                  <img loading="lazy" src={avatarUrl} alt="Profile avatar" className="w-full h-full object-cover" />
                ) : (
                  <span>{initials}</span>
                )}
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center rounded-[22px]">
                  <Camera size={24} className="text-white" />
                </div>
                {uploadingAvatar && (
                  <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                    <Loader2 size={26} className="text-white animate-spin" />
                  </div>
                )}
              </div>
              {/* Camera badge */}
              <motion.button
                onClick={() => fileRef.current?.click()}
                aria-label="Change profile photo"
                whileHover={{ scale: 1.18 }}
                whileTap={{ scale: 0.9 }}
                className="absolute -bottom-1 -right-1 size-8 bg-white dark:bg-[#1A1D24] rounded-full flex items-center justify-center shadow-lg border-2 border-primary"
              >
                <Camera size={13} className="text-primary" strokeWidth={2.5} />
              </motion.button>
            </div>
          </motion.div>
          <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} />

          {/* Name — Perfectly centered without edit button */}
          <motion.div variants={textVariants} className="flex justify-center mb-1">
            <h1 className="text-[20px] font-black text-slate-900 dark:text-white tracking-tight leading-tight">
              {userData?.fullName || 'Your Name'}
            </h1>
          </motion.div>

          {/* Dynamic Member Badge — live from Firestore */}
          <motion.div variants={textVariants} className="flex justify-center mb-5 mt-1">
            <DynamicMemberBadge
              userData={userData}
              isEmailVerified={isEmailVerified}
              toast={toast}
            />
          </motion.div>

          {/* Stats — 3 column grid with icons */}
          <motion.div variants={textVariants} className="grid grid-cols-3 gap-2">
            <StatBlock
              icon={Building2}
              iconBg="bg-primary/10 dark:bg-primary/20"
              iconColor="text-primary dark:text-indigo-400"
              value={stats.listings}
              label="Listings"
              onClick={() => navigate('/my-listings')}
              isLoading={statsLoading}
            />
            <StatBlock
              icon={Star}
              iconBg="bg-amber-50 dark:bg-amber-500/15"
              iconColor="text-amber-500 dark:text-amber-400"
              value={stats.reviews}
              label="Reviews"
              onClick={() => navigate('/my-reviews')}
              isLoading={statsLoading}
            />
            <StatBlock
              icon={Briefcase}
              iconBg="bg-rose-50 dark:bg-rose-500/15"
              iconColor="text-rose-500 dark:text-rose-400"
              value={stats.bookings}
              label="Bookings"
              onClick={() => navigate('/my-bookings')}
              isLoading={statsLoading}
            />
          </motion.div>
        </TiltCard>
        </div> {/* closes lg:hidden mobile card wrapper */}
      </div> {/* closes lg left column */}

      {/* ── Desktop Right Column: Menu ── */}
      <div className="lg:flex-1">

      {/* ══════════════════════════════════════════════
          ACCORDION MENU
      ══════════════════════════════════════════════ */}
      <div className="max-w-lg mx-auto px-4 pt-5 pb-4 space-y-3">

        {/* ── Account & Settings ── */}
        <AccordionSection icon={User} title="Account & Settings" defaultOpen>
          <MenuItem icon={User} label="Edit Profile" sub="Name, phone, photo & location"
            onClick={() => navigate('/edit-profile')} />
          <MenuItem icon={Building2} label="Setup Owner Profile" sub="Manage your public owner page"
            onClick={() => navigate('/setup-owner-profile')} />
          <MenuItem icon={ShieldCheck} label="Identity Verification"
            sub={isKycApproved ? 'KYC Approved ✅' : kycPending ? 'Under Review ⏳' : 'Verify your identity'}
            onClick={() => setShowKycModal(true)} />
          <MenuItem icon={Lock} label="Change Password" sub="Update your login credentials"
            onClick={() => navigate('/change-password')} />
          <MenuItem icon={CreditCard} label="My Payments" sub="Transaction history & invoices"
            onClick={() => navigate('/my-payments')} />
          <MenuItem icon={Settings2} label="App Preferences" sub="Language, theme & notifications"
            onClick={() => navigate('/settings')} />
        </AccordionSection>

        {/* ── Listings & Bookings ── */}
        <AccordionSection icon={Building2} title="Listings & Bookings">
          <MenuItem icon={Building2} label="My Listings" sub="Manage your posted properties"
            onClick={() => navigate('/my-listings')} />
          <MenuItem icon={Heart} label="Saved Properties" sub="Your wishlist & favourites"
            onClick={() => navigate('/favorites')} />
          <MenuItem icon={Star} label="My Reviews" sub="Reviews you've written"
            onClick={() => navigate('/my-reviews')} />
          <MenuItem icon={Briefcase} label="My Bookings (Tenant)" sub="Properties you have booked"
            onClick={() => navigate('/my-bookings')} />
          <MenuItem icon={CheckCircle2} label="Guest Bookings (Owner)" sub="Confirm move-ins & escrows"
            onClick={() => navigate('/owner-bookings')} />
        </AccordionSection>

        {/* ── Referrals ── */}
        <AccordionSection icon={Gift} title="Referrals">
          <MenuItem icon={Gift} label="Refer an Owner" sub="Invite owners & earn rewards"
            onClick={() => navigate('/referral')} />
          <MenuItem icon={Users} label="My Referrals" sub="Track friends you have invited"
            onClick={() => navigate('/referral')} />
        </AccordionSection>

        {/* ── Help & Support ── */}
        <AccordionSection icon={MessageCircle} title="Help & Support">
          <MenuItem icon={MessageCircle} label="Contact Support" sub="Chat with our support team"
            onClick={() => navigate('/contact')} />
          <MenuItem icon={ClipboardList} label="Inquiry History" sub="View all your enquiries"
            onClick={() => navigate('/enquiry')} />
        </AccordionSection>

        {/* ── Legal & Information ── */}
        <AccordionSection icon={FileText} title="Legal & Information">
          <MenuItem icon={Info} label="About Us" sub="Learn more about Any.Let"
            onClick={() => navigate('/about')} />
          <MenuItem icon={Shield} label="Privacy Policy" sub="How we protect your data"
            onClick={() => navigate('/privacy-policy')} />
          <MenuItem icon={FileText} label="Terms & Conditions" sub="Our terms of service"
            onClick={() => navigate('/terms')} />
        </AccordionSection>

        {/* ── Sign Out ── */}
        <motion.div variants={sectionVariants}>
          <motion.button
            whileHover={{ scale: 1.012, y: -1 }}
            whileTap={{ scale: 0.975 }}
            onClick={handleLogout}
            className="transform-gpu w-full flex items-center gap-3.5 px-5 py-4
              bg-white dark:bg-[#1A1D24] rounded-2xl border border-rose-100/80 dark:border-rose-500/20
              hover:bg-rose-50/70 dark:hover:bg-rose-500/[0.06] transition-colors shadow-sm"
          >
            <div className="size-10 rounded-xl bg-rose-50 dark:bg-rose-500/10 flex items-center justify-center shrink-0">
              <LogOut size={17} strokeWidth={2.1} className="text-rose-500" />
            </div>
            <span className="text-[14.5px] font-bold text-rose-500">Sign Out</span>
          </motion.button>
        </motion.div>

        {/* App Version */}
        <motion.div variants={textVariants} className="flex items-center justify-center gap-2 pt-1 pb-2">
          <Sparkles size={11} className="text-slate-300 dark:text-slate-600" />
          <p className="text-center text-[11px] font-semibold text-slate-400 dark:text-slate-500">Any.Let · Version 1.0.1</p>
          <Sparkles size={11} className="text-slate-300 dark:text-slate-600" />
        </motion.div>
      </div>
      </div>
      </div>

      <KYCVerification
        isOpen={showKycModal}
        onClose={() => setShowKycModal(false)}
        userData={userData}
        onSubmitted={() => {
          setUserData(prev => ({
            ...prev,
            kycStatus: 'pending',
            onboardingStatus: 'PENDING_VERIFICATION',
          }));
        }}
      />

      {/* Legacy KYC modal kept disabled while the secure component above owns the flow.
          KYC VERIFICATION MODAL
      ══════════════════════════════════════════════ */}
      <AnimatePresence>
        {false && showKycModal && (
          <motion.div
            key="kyc-overlay"
            variants={kycOverlayVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            onClick={() => { setShowKycModal(false); setKycFile(null); setKycPreview(null); }}
            className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/55 px-4"
            role="dialog"
            aria-modal="true"
            aria-label="Identity Verification"
          >
            <motion.div
              key="kyc-modal"
              variants={kycModalVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              onClick={(e) => e.stopPropagation()}
              className="bg-white dark:bg-slate-900 rounded-[28px] w-full max-w-md max-h-[90dvh] overflow-y-auto shadow-2xl border border-slate-100 dark:border-slate-800"
            >
              {/* Top handle */}
              <div className="flex justify-center pt-3 pb-0">
                <div className="w-10 h-1 rounded-full bg-slate-200 dark:bg-slate-700" />
              </div>

              {/* Modal Header */}
              <div className="flex items-center justify-between p-6 pb-0">
                <div className="flex items-center gap-3">
                  <div className="size-11 bg-primary/10 dark:bg-primary/20 rounded-2xl flex items-center justify-center">
                    <ShieldCheck size={22} className="text-primary dark:text-indigo-400" />
                  </div>
                  <div>
                    <h2 className="text-lg font-black text-slate-900 dark:text-white tracking-tight">Identity Verification</h2>
                    <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">KYC Process</p>
                  </div>
                </div>
                <button
                  onClick={() => { setShowKycModal(false); setKycFile(null); setKycPreview(null); }}
                  aria-label="Close modal"
                  className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-400 hover:text-slate-600 hover:scale-110 transition-all"
                >
                  <X size={18} />
                </button>
              </div>

              <div className="p-6 space-y-6">
                {/* Already Approved */}
                {isKycApproved && (
                  <div className="text-center py-8">
                    <div className="size-20 bg-emerald-50 dark:bg-emerald-500/10 rounded-full flex items-center justify-center mx-auto mb-5">
                      <ShieldCheck size={40} className="text-emerald-500" />
                    </div>
                    <h3 className="text-xl font-black text-slate-900 dark:text-white mb-2">Identity Verified</h3>
                    <p className="text-sm font-medium text-slate-400">Your identity has been successfully verified. You now have full access to all features.</p>
                  </div>
                )}

                {/* Pending Review */}
                {!isKycApproved && kycPending && (
                  <div className="text-center py-8">
                    <div className="size-20 bg-sky-50 dark:bg-sky-500/10 rounded-full flex items-center justify-center mx-auto mb-5">
                      <Clock size={40} className="text-sky-500 animate-pulse" />
                    </div>
                    <h3 className="text-xl font-black text-slate-900 dark:text-white mb-2">Under Review</h3>
                    <p className="text-sm font-medium text-slate-400">Your documents are being reviewed by our team. This usually takes 24–48 hours.</p>
                  </div>
                )}

                {/* Rejected */}
                {userData?.onboardingStatus === 'REJECTED' && (
                  <div className="bg-rose-50 dark:bg-rose-500/10 border border-rose-100 dark:border-rose-800/30 rounded-2xl p-4">
                    <p className="text-xs font-bold text-rose-600 dark:text-rose-400">Your previous submission was rejected. Please re-upload a clear, valid government-issued ID document.</p>
                  </div>
                )}

                {/* Upload Form */}
                {!isKycApproved && !kycPending && (
                  <>
                    <div className="bg-gradient-to-br from-primary/5 to-indigo-50 dark:from-primary/5 dark:to-indigo-500/5 rounded-2xl p-5 border border-primary/10 dark:border-primary/10">
                      <h4 className="text-xs font-black text-primary dark:text-indigo-400 uppercase tracking-wider mb-3">Why Verify?</h4>
                      <ul className="space-y-2 text-xs font-medium text-slate-600 dark:text-slate-400">
                        <li className="flex items-center gap-2"><CheckCircle2 size={13} className="text-emerald-500 shrink-0" /> Get a &ldquo;Verified Member&rdquo; badge on your profile</li>
                        <li className="flex items-center gap-2"><CheckCircle2 size={13} className="text-emerald-500 shrink-0" /> Build trust with property owners &amp; tenants</li>
                        <li className="flex items-center gap-2"><CheckCircle2 size={13} className="text-emerald-500 shrink-0" /> Priority support &amp; features</li>
                      </ul>
                    </div>

                    <div>
                      <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1 mb-2 block">Document Type</label>
                      <div className="grid grid-cols-3 gap-2">
                        {[
                          { id: 'nid', label: 'National ID' },
                          { id: 'passport', label: 'Passport' },
                          { id: 'license', label: 'License' },
                        ].map(dt => (
                          <button
                            key={dt.id}
                            onClick={() => setKycDocType(dt.id)}
                            className={`py-3 rounded-xl text-xs font-black transition-all ${
                              kycDocType === dt.id
                                ? 'bg-primary text-white shadow-lg shadow-primary/20'
                                : 'bg-slate-50 dark:bg-slate-800 text-slate-500 dark:text-slate-400 hover:bg-slate-100'
                            }`}
                          >
                            {dt.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div>
                      <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1 mb-2 block">Upload Document</label>
                      <input
                        ref={kycFileRef} type="file" accept="image/*" className="hidden"
                        onChange={(e) => {
                          const file = e.target.files[0];
                          if (file) { setKycFile(file); setKycPreview(URL.createObjectURL(file)); }
                        }}
                      />
                      {kycPreview ? (
                        <div className="relative rounded-2xl overflow-hidden border-2 border-dashed border-primary/30 dark:border-primary/40">
                          <img loading="lazy" src={kycPreview} alt="Document preview" className="w-full h-48 object-contain bg-white dark:bg-slate-900 p-2" />
                          <button
                            onClick={() => { setKycFile(null); setKycPreview(null); }}
                            aria-label="Remove document"
                            className="absolute top-2 right-2 p-1.5 rounded-lg bg-rose-500 text-white shadow-lg hover:bg-rose-600 transition-colors"
                          >
                            <X size={14} />
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => kycFileRef.current?.click()}
                          className="w-full py-10 border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-2xl flex flex-col items-center gap-3 text-slate-400 hover:border-primary hover:text-primary transition-all active:scale-[0.98]"
                        >
                          <div className="size-14 bg-slate-100 dark:bg-slate-800 rounded-2xl flex items-center justify-center">
                            <Upload size={24} />
                          </div>
                          <div className="text-center">
                            <p className="text-sm font-black">Tap to upload</p>
                            <p className="text-[11px] font-medium">JPG, PNG — max 5MB</p>
                          </div>
                        </button>
                      )}
                    </div>

                    <button
                      disabled={!kycFile || kycUploading}
                      onClick={async () => {
                        if (!kycFile) return;
                        setKycUploading(true);
                        try {
                          const sigRes = await fetch(getApiUrl('/api/cloudinary-sign'), {
                            method: 'POST',
                            headers: {
                              'Content-Type': 'application/json',
                              Authorization: `Bearer ${await auth.currentUser.getIdToken()}`,
                            },
                            body: JSON.stringify({ isKyc: true })
                          });
                          const sigData = await sigRes.json();
            if (!sigRes.ok) throw new Error(sigData.error || 'Failed to generate secure upload signature. Ensure backend API keys are configured.');

                          const data = new FormData();
                          data.append('file', kycFile);
                          data.append('api_key', sigData.apiKey);
                          data.append('timestamp', sigData.timestamp);
                          data.append('signature', sigData.signature);
                          data.append('folder', sigData.folder);
                          if (sigData.type) data.append('type', sigData.type);

                          const res = await fetch(`https://api.cloudinary.com/v1_1/${sigData.cloudName}/image/upload`, { method: 'POST', body: data });
                          const fileData = await res.json();
                          if (!fileData.secure_url) throw new Error(fileData.error?.message || 'Upload failed');
                          await setDoc(doc(db, 'users', currentUser.uid), {
                            verification: {
                              idDocumentUrl: fileData.secure_url,
                              docType: kycDocType,
                              isKycApproved: false,
                              submittedAt: new Date().toISOString(),
                            },
                            onboardingStatus: 'PENDING_VERIFICATION',
                          }, { merge: true });
                          setUserData(prev => ({
                            ...prev,
                            verification: { idDocumentUrl: fileData.secure_url, docType: kycDocType, isKycApproved: false, submittedAt: new Date().toISOString() },
                            onboardingStatus: 'PENDING_VERIFICATION',
                          }));
                          setKycFile(null); setKycPreview(null);
                          toast.success('Document submitted! We will review it within 24–48 hours.');
                        } catch (err) {
                          logger.error(err);
                          toast.error(`Upload failed: ${err.message}`);
                        } finally {
                          setKycUploading(false);
                        }
                      }}
                      className="w-full py-4 bg-primary text-white rounded-2xl font-black text-sm flex items-center justify-center gap-2 shadow-xl shadow-primary/20 disabled:opacity-50 disabled:shadow-none transition-all active:scale-95"
                    >
                      {kycUploading ? (
                        <><Loader2 size={18} className="animate-spin" /> Uploading...</>
                      ) : (
                        <><ShieldCheck size={18} /> Submit for Verification</>
                      )}
                    </button>
                  </>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
