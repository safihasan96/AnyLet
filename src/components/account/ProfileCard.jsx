import { useRef } from 'react';
import { motion } from 'framer-motion';
import { Camera, Loader2, Building2, Star, Briefcase } from 'lucide-react';
import TiltCard from './TiltCard';
import StatBlock from './StatBlock';
import DynamicMemberBadge from './DynamicMemberBadge';
import { heroVariants, avatarVariants, textVariants } from './motion';

/**
 * ProfileCard — the Account hero: mobile dark banner, desktop standalone profile
 * card, and the mobile floating card (avatar w/ upload, name, verification badge,
 * and stat tiles). Owns the hidden avatar file input; `onAvatarChange` /
 * `onNav` come from the shell.
 */
export default function ProfileCard({
  userData,
  avatarUrl,
  initials,
  uploadingAvatar,
  stats,
  statsLoading,
  isEmailVerified,
  toast,
  onAvatarChange,
  onNav,
}) {
  const fileRef = useRef();

  return (
    <>
      {/* ══════════════════════════════════════════════
          HERO — short dark banner (mobile only)
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
            <button onClick={() => onNav('/my-listings')} className="flex flex-col items-center gap-1 bg-white/10 rounded-2xl py-3 hover:bg-white/20 transition-colors">
              <span className="text-white font-black text-lg">{statsLoading ? '—' : stats.listings}</span>
              <span className="text-indigo-200 text-[10px] font-bold uppercase tracking-wider">Listings</span>
            </button>
            <button onClick={() => onNav('/my-reviews')} className="flex flex-col items-center gap-1 bg-white/10 rounded-2xl py-3 hover:bg-white/20 transition-colors">
              <span className="text-white font-black text-lg">{statsLoading ? '—' : stats.reviews}</span>
              <span className="text-indigo-200 text-[10px] font-bold uppercase tracking-wider">Reviews</span>
            </button>
            <button onClick={() => onNav('/my-bookings')} className="flex flex-col items-center gap-1 bg-white/10 rounded-2xl py-3 hover:bg-white/20 transition-colors">
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
          <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={onAvatarChange} />

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
              onClick={() => onNav('/my-listings')}
              isLoading={statsLoading}
            />
            <StatBlock
              icon={Star}
              iconBg="bg-amber-50 dark:bg-amber-500/15"
              iconColor="text-amber-500 dark:text-amber-400"
              value={stats.reviews}
              label="Reviews"
              onClick={() => onNav('/my-reviews')}
              isLoading={statsLoading}
            />
            <StatBlock
              icon={Briefcase}
              iconBg="bg-rose-50 dark:bg-rose-500/15"
              iconColor="text-rose-500 dark:text-rose-400"
              value={stats.bookings}
              label="Bookings"
              onClick={() => onNav('/my-bookings')}
              isLoading={statsLoading}
            />
          </motion.div>
        </TiltCard>
        </div>
      </div>
    </>
  );
}
