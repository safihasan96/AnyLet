import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { db, auth } from '../firebase';
import { doc, setDoc } from 'firebase/firestore';
import { updateProfile } from 'firebase/auth';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import { motion, useReducedMotion } from 'framer-motion';
import logger from '../utils/logger';
import KYCVerification from '../components/KYCVerification';
import { ProfileSkeleton } from '../components/Skeleton';
import useImageUpload from '../hooks/useImageUpload';
import useAccountData from '../hooks/useAccountData';
import ProfileCard from '../components/account/ProfileCard';
import AccountMenu from '../components/account/AccountMenu';
import { pageVariants } from '../components/account/motion';

/* ─────────────────────────────────────────────────────────────
   MAIN PROFILE PAGE — thin shell. Data lives in useAccountData;
   the hero/profile UI in ProfileCard; the menu in AccountMenu.
───────────────────────────────────────────────────────────────*/
export default function Profile() {
  const { currentUser, logout, refreshUser } = useAuth();
  const navigate = useNavigate();
  const toast = useToast();
  const shouldReduceMotion = useReducedMotion();

  const { userData, setUserData, avatarUrl, setAvatarUrl, loading, stats, statsLoading } = useAccountData(currentUser, navigate);
  const { uploading: uploadingAvatar, uploadImages } = useImageUpload();

  const [showKycModal, setShowKycModal] = useState(false);

  /* ── Avatar upload via Cloudinary (shared hook) + profile write ── */
  const handleAvatarChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const [url] = await uploadImages([file]);
    if (!url) return; // uploadImages surfaces its own error toast

    try {
      const uid = currentUser?.uid || auth.currentUser?.uid;
      if (!uid) throw new Error('User session not found.');
      await setDoc(doc(db, 'users', uid), { photoURL: url }, { merge: true });
      if (auth.currentUser) await updateProfile(auth.currentUser, { photoURL: url });
      if (refreshUser) await refreshUser();
      setAvatarUrl(url);
      toast.success('Profile photo updated!');
    } catch (err) {
      logger.error('Avatar change error:', err);
      toast.error(`Error saving avatar: ${err.message || err}`);
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
        <ProfileCard
          userData={userData}
          avatarUrl={avatarUrl}
          initials={initials}
          uploadingAvatar={uploadingAvatar}
          stats={stats}
          statsLoading={statsLoading}
          isEmailVerified={isEmailVerified}
          toast={toast}
          onAvatarChange={handleAvatarChange}
          onNav={navigate}
        />

        {/* ── Desktop Right Column: Menu ── */}
        <div className="lg:flex-1">
          <AccountMenu
            onNav={navigate}
            onKyc={() => setShowKycModal(true)}
            onLogout={handleLogout}
            isKycApproved={isKycApproved}
            kycPending={kycPending}
          />
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
    </motion.div>
  );
}
