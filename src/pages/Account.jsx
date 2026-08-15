import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { db, auth } from '../firebase';
import { doc, onSnapshot, collection, query, where, setDoc, getCountFromServer } from 'firebase/firestore';
import { updateProfile, sendEmailVerification } from 'firebase/auth';
import { useAuth } from '../contexts/AuthContext';
import logger from '../utils/logger';
import { getApiUrl } from '../utils/api';
import KYCVerification from '../components/KYCVerification';
import { ProfileSkeleton } from '../components/Skeleton';
import { cn } from '../lib/cn';
import Container from '../components/layout/Container';
import Sidebar, { SidebarItem } from '../components/layout/Sidebar';
import {
  Card, Avatar, Badge, Button, IconButton, Input, Icon, Spinner, Tabs, TabList, Tab, useToast,
} from '../components/ui';

/* ── Verification pill — live from Firestore ─────────────────────────────── */
function MemberBadge({ userData, isEmailVerified, toast }) {
  const isKycApproved = userData?.verification?.isKycApproved === true;
  const kycPending = userData?.onboardingStatus === 'PENDING_VERIFICATION';

  if (!isEmailVerified) {
    return (
      <Button
        size="sm" variant="soft"
        className="bg-warning-subtle text-warning hover:brightness-95"
        leftIcon={<Icon name="warning" />}
        onClick={async () => {
          try { await sendEmailVerification(auth.currentUser); toast.success('Verification email sent!'); }
          catch { toast.error('Failed to send. Try again later.'); }
        }}
      >
        Verify email
      </Button>
    );
  }
  if (isKycApproved) return <Badge tone="success" size="md" icon={<Icon name="verified" />}>Verified</Badge>;
  if (kycPending) return <Badge tone="info" size="md" icon={<Icon name="pending" />}>Under review</Badge>;
  return <Badge tone="neutral" size="md" icon={<Icon name="check" />}>Member</Badge>;
}

/* ── Single menu row (renders as a Link or a button via the Button primitive) ── */
function MenuItem({ icon, label, sub, to, onClick, danger }) {
  return (
    <Button
      as={to ? Link : 'button'}
      to={to}
      onClick={onClick}
      variant="ghost"
      className={cn('h-auto w-full justify-start gap-3.5 rounded-none px-5 py-3.5 text-left', danger && 'text-danger hover:bg-danger-subtle')}
    >
      <span className={cn('grid size-9 shrink-0 place-items-center rounded-control', danger ? 'bg-danger-subtle text-danger' : 'bg-primary-subtle text-primary')}>
        <Icon name={icon} className="size-5" />
      </span>
      <span className="flex min-w-0 flex-1 flex-col">
        <span className="truncate text-body-sm font-medium">{label}</span>
        {sub && <span className="truncate text-caption text-subtle">{sub}</span>}
      </span>
      <Icon name="chevronRight" className="size-4 shrink-0 text-subtle" />
    </Button>
  );
}

export default function Profile() {
  const { currentUser, logout, refreshUser } = useAuth();
  const navigate = useNavigate();
  const toast = useToast();

  const [userData, setUserData] = useState(() => currentUser ? { fullName: currentUser.displayName, email: currentUser.email } : null);
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState({ listings: 0, bookings: 0, reviews: 0 });
  const [statsLoading, setStatsLoading] = useState(true);
  const [avatarUrl, setAvatarUrl] = useState(null);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const fileRef = useRef();

  const [showKycModal, setShowKycModal] = useState(false);
  const [activeSection, setActiveSection] = useState('account');

  /* ── Live Firestore listener — updates profile data instantly ── */
  useEffect(() => {
    if (!currentUser) { navigate('/login'); return; }
    setLoading(true);
    const userRef = doc(db, 'users', currentUser.uid);
    const unsubscribe = onSnapshot(userRef, async (snap) => {
      try {
        let ud = snap.exists() ? { ...snap.data(), email: currentUser.email } : { fullName: currentUser.displayName || '', email: currentUser.email };
        if (!ud.membershipTier || !ud.membershipLevel) {
          const defaults = { membershipTier: 'Standard', membershipLevel: 1 };
          Object.assign(ud, defaults);
          if (snap.exists()) await setDoc(userRef, defaults, { merge: true });
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
    return () => unsubscribe();
  }, [currentUser, navigate]);

  /* ── Fetch stats in background ── */
  useEffect(() => {
    if (!currentUser) return;
    let isMounted = true;
    setStatsLoading(true);
    async function fetchStats() {
      try {
        const [listingsCount, bookingsCount, propertyReviewsCount, ownerReviewsCount] = await Promise.all([
          getCountFromServer(query(collection(db, 'properties'), where('ownerId', '==', currentUser.uid))),
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
        if (isMounted) setStatsLoading(false);
      }
    }
    fetchStats();
    return () => { isMounted = false; };
  }, [currentUser]);

  /* ── Avatar upload via Cloudinary (preserved verbatim) ── */
  const handleAvatarChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploadingAvatar(true);
    try {
      const sigRes = await fetch(getApiUrl('/api/cloudinary-sign'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${await auth.currentUser.getIdToken()}` },
        body: JSON.stringify({ isKyc: false }),
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

  const isEmailVerified = currentUser?.emailVerified;
  const isKycApproved = userData?.verification?.isKycApproved === true;
  const kycPending = userData?.onboardingStatus === 'PENDING_VERIFICATION';

  const STAT_TILES = [
    { icon: 'apartment', value: stats.listings, label: 'Listings', to: '/my-listings' },
    { icon: 'rating', value: stats.reviews, label: 'Reviews', to: '/my-reviews' },
    { icon: 'locked', value: stats.bookings, label: 'Bookings', to: '/my-bookings' },
  ];

  const sections = [
    { id: 'account', label: 'Account & Settings', short: 'Account', icon: 'settings', items: [
      { icon: 'user', label: 'Edit Profile', sub: 'Name, phone, photo & location', to: '/edit-profile' },
      { icon: 'apartment', label: 'Setup Owner Profile', sub: 'Manage your public owner page', to: '/setup-owner-profile' },
      { icon: 'verified', label: 'Identity Verification', sub: isKycApproved ? 'KYC approved' : kycPending ? 'Under review' : 'Verify your identity', onClick: () => setShowKycModal(true) },
      { icon: 'locked', label: 'Change Password', sub: 'Update your login credentials', to: '/change-password' },
      { icon: 'payments', label: 'My Payments', sub: 'Transaction history & invoices', to: '/my-payments' },
      { icon: 'settings', label: 'App Preferences', sub: 'Language, theme & notifications', to: '/settings' },
    ] },
    { id: 'listings', label: 'Listings & Bookings', short: 'Listings', icon: 'apartment', items: [
      { icon: 'apartment', label: 'My Listings', sub: 'Manage your posted properties', to: '/my-listings' },
      { icon: 'favorite', label: 'Saved Properties', sub: 'Your wishlist & favourites', to: '/favorites' },
      { icon: 'rating', label: 'My Reviews', sub: 'Reviews you’ve written', to: '/my-reviews' },
      { icon: 'locked', label: 'Booking Escrow', sub: 'Track deposits & move-ins', to: '/my-bookings' },
    ] },
    { id: 'referrals', label: 'Referrals', short: 'Referrals', icon: 'referral', items: [
      { icon: 'referral', label: 'Refer an Owner', sub: 'Invite owners & earn rewards', to: '/referral' },
      { icon: 'users', label: 'My Referrals', sub: 'Track friends you have invited', to: '/referral' },
    ] },
    { id: 'support', label: 'Help & Support', short: 'Support', icon: 'help', items: [
      { icon: 'messages', label: 'Contact Support', sub: 'Chat with our support team', to: '/contact' },
      { icon: 'document', label: 'Inquiry History', sub: 'View all your enquiries', to: '/enquiry' },
    ] },
    { id: 'legal', label: 'Legal & Information', short: 'Legal', icon: 'document', items: [
      { icon: 'info', label: 'About Us', sub: 'Learn more about Any.Let', to: '/about' },
      { icon: 'verified', label: 'Privacy Policy', sub: 'How we protect your data', to: '/privacy-policy' },
      { icon: 'document', label: 'Terms & Conditions', sub: 'Our terms of service', to: '/terms' },
    ] },
  ];
  const active = sections.find((s) => s.id === activeSection) || sections[0];

  return (
    <div className="min-h-screen bg-bg pb-24">
      <Container size="wide" className="pt-[max(env(safe-area-inset-top),1.5rem)] md:pt-10">
        {/* Hidden file trigger routed through the Input primitive — no raw markup. */}
        <Input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} />

        {/* ── Header card (Owner-Profile style) ── */}
        <Card variant="raised" padding="lg">
          <div className="flex flex-col items-center gap-4 text-center sm:flex-row sm:items-center sm:text-left">
            <div className="relative shrink-0">
              <Avatar src={avatarUrl} name={userData?.fullName || 'User'} size="2xl" shape="square" ring />
              <IconButton label="Change profile photo" size="sm" variant="primary" shape="pill" onClick={() => fileRef.current?.click()} className="absolute -bottom-1 -right-1 ring-2 ring-surface">
                <Icon name="camera" />
              </IconButton>
              {uploadingAvatar && <span className="absolute inset-0 grid place-items-center rounded-card bg-black/50"><Spinner className="text-white" /></span>}
            </div>
            <div className="min-w-0 flex-1">
              <h1 className="font-display text-title-lg text-content sm:text-display-md">{userData?.fullName || 'Your Name'}</h1>
              <p className="truncate text-body-sm text-muted">{userData?.email}</p>
              <div className="mt-2 flex justify-center sm:justify-start">
                <MemberBadge userData={userData} isEmailVerified={isEmailVerified} toast={toast} />
              </div>
            </div>
          </div>

          <div className="mt-5 grid grid-cols-3 gap-3 border-t border-border pt-5">
            {STAT_TILES.map((t) => (
              <Button key={t.label} as={Link} to={t.to} variant="secondary" className="h-auto flex-col gap-1 px-2 py-3">
                <Icon name={t.icon} className="size-5 text-primary" />
                <span className="font-display text-title-md text-content">{statsLoading ? '—' : t.value}</span>
                <span className="text-caption text-subtle">{t.label}</span>
              </Button>
            ))}
          </div>
        </Card>

        {/* ── Section navigation + panel ── */}
        <div className="mt-6 lg:flex lg:items-start lg:gap-8">
          {/* Desktop Sidebar */}
          <div className="hidden lg:block lg:sticky lg:top-24 lg:self-start">
            <Sidebar
              className="h-auto w-64 overflow-hidden rounded-card border border-border"
              footer={<Button variant="ghost" fullWidth className="justify-start text-danger hover:bg-danger-subtle" onClick={handleLogout} leftIcon={<Icon name="logout" />}>Sign out</Button>}
            >
              {sections.map((s) => (
                <SidebarItem key={s.id} icon={<Icon name={s.icon} />} label={s.label} active={activeSection === s.id} onClick={() => setActiveSection(s.id)} />
              ))}
            </Sidebar>
          </div>

          {/* Mobile Tabs */}
          <div className="mb-4 lg:hidden">
            <Tabs value={activeSection} onChange={setActiveSection} variant="pill">
              <TabList aria-label="Account sections" className="overflow-x-auto no-scrollbar">
                {sections.map((s) => <Tab key={s.id} value={s.id}>{s.short}</Tab>)}
              </TabList>
            </Tabs>
          </div>

          {/* Panel */}
          <div className="min-w-0 flex-1">
            <Card padding="none" className="overflow-hidden">
              <div className="divide-y divide-border">
                {active.items.map((item) => (
                  <MenuItem key={item.label} icon={item.icon} label={item.label} sub={item.sub} to={item.to} onClick={item.onClick} />
                ))}
              </div>
            </Card>

            {/* Sign out (mobile) */}
            <Card padding="none" className="mt-4 overflow-hidden lg:hidden">
              <MenuItem icon="logout" label="Sign out" onClick={handleLogout} danger />
            </Card>

            <p className="mt-4 text-center text-caption text-subtle">Any.Let · Version 1.0.1</p>
          </div>
        </div>
      </Container>

      <KYCVerification
        isOpen={showKycModal}
        onClose={() => setShowKycModal(false)}
        userData={userData}
        onSubmitted={() => setUserData((prev) => ({ ...prev, kycStatus: 'pending', onboardingStatus: 'PENDING_VERIFICATION' }))}
      />
    </div>
  );
}
