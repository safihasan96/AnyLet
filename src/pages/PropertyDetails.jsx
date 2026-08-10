'use client';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { useState, useEffect, useCallback, useMemo } from 'react';

import { doc, getDoc, collection, addDoc, serverTimestamp, query, where, getDocs, limit, Timestamp, updateDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import { getOrCreateConversation } from '../utils/messageService';
import QUERY_LIMITS from '../config/queryLimits';
import { 
  ArrowLeft, 
  MapPin, 
  Bed, 
  Bath, 
  Maximize, 
  ChevronLeft,
  ChevronRight, 
  Calendar, 
  MessageSquare, 
  Phone, 
  ShieldCheck, 
  Zap, 
  CheckCircle2,
  Share2,
  Heart,
  User,
  Star,
  Info,
  Flag,
  AlertTriangle,
  MessageCircle,
  Shield,
  Lock,
  Home,
  Building2,
  Car,
  Map,
  Users,
  Flame,
  Droplets,
  ArrowRight,
  UserX,
  DoorOpen
} from 'lucide-react';
import { motion, AnimatePresence, useMotionValue, useTransform, useSpring } from 'framer-motion';

// ── Variants (all decoupled from JSX) ──────────────────────────────────────
const pageVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.1, delayChildren: 0.05 } },
};

const sectionVariants = {
    hidden: { opacity: 0, y: 28 },
    visible: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 80, damping: 18 } },
};

const chipVariants = {
    hidden: { opacity: 0, scale: 0.75 },
    visible: (i) => ({
        opacity: 1,
        scale: 1,
        transition: { type: 'spring', stiffness: 200, damping: 18, delay: i * 0.05 },
    }),
};

const ctaVariants = {
    idle: { boxShadow: '0 4px 24px rgba(99,102,241,0.25)' },
    pulse: {
        boxShadow: ['0 4px 24px rgba(99,102,241,0.25)', '0 4px 40px rgba(99,102,241,0.6)', '0 4px 24px rgba(99,102,241,0.25)'],
        transition: { duration: 2, repeat: Infinity, repeatType: 'loop', ease: 'easeInOut' },
    },
};

const bottomBarVariants = {
    hidden: { y: 80, opacity: 0 },
    visible: { y: 0, opacity: 1, transition: { type: 'spring', stiffness: 120, damping: 22, delay: 0.4 } },
};
import ViewingRequestModal from '../components/ViewingRequestModal';
import ConfirmationModal from '../components/ConfirmationModal';
import { PropertyDetailSkeleton } from '../components/Skeleton';
import ShareModal from '../components/ShareModal';
import BookPropertyModal from '../components/BookPropertyModal';
import { useToast } from '../contexts/ToastContext';
import { createNotification } from '../utils/notificationService';
import { getOptimizedImageUrl } from '../utils/imageUtils';
import { Helmet } from 'react-helmet-async';

const sliderVariants = {
    enter: (direction) => ({
        x: direction > 0 ? 1000 : -1000,
        opacity: 0
    }),
    center: {
        zIndex: 1,
        x: 0,
        opacity: 1
    },
    exit: (direction) => ({
        zIndex: 0,
        x: direction < 0 ? 1000 : -1000,
        opacity: 0
    })
};

export default function PropertyDetails() {
    const { id } = useParams();
    const navigate = useNavigate();
    const { currentUser } = useAuth();
    const { t } = useLanguage();
    const toast = useToast();
    const [property, setProperty] = useState(null);
    const [loading, setLoading] = useState(true);
    const [activeImage, setActiveImage] = useState(0);
    const [slideDirection, setSlideDirection] = useState(0);
    const [requestSending, setRequestSending] = useState(false);
    const [requestSent, setRequestSent] = useState(false);
    const [owner, setOwner] = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [callModalOpen, setCallModalOpen] = useState(false);
    const [phoneNumberToCall, setPhoneNumberToCall] = useState('');
    const [shareModalOpen, setShareModalOpen] = useState(false);
    const [bookModalOpen, setBookModalOpen] = useState(false);

    useEffect(() => {
        const fetchProperty = async () => {
            try {
                const docRef = doc(db, 'properties', id);
                const docSnap = await getDoc(docRef);
                if (docSnap.exists()) {
                    const propData = { id: docSnap.id, ...docSnap.data() };
                    setProperty(propData);

                    // Fetch actual owner
                    // NOTE: Firestore rules restrict users/{uid} reads to the
                    // document owner. A tenant viewing someone else's property
                    // will get permission-denied here — that's expected.
                    const ownerIdToFetch = propData.ownerId || propData.userId;
                    if (ownerIdToFetch) {
                        try {
                            const ownerDoc = await getDoc(doc(db, 'users', ownerIdToFetch));
                            if (ownerDoc.exists()) {
                                setOwner({ id: ownerDoc.id, ...ownerDoc.data() });
                            }
                        } catch (ownerErr) {
                            // Permission denied — tenant can't read owner's user doc
                            logger.warn('Could not read owner user doc on page load.', ownerErr);
                        }
                    }

                    // Fetch rental history count
                    try {
                        // ✅ F-08: bounded
                        const moveInsQ = query(
                            collection(db, 'tenantMoveIns'), 
                            where('propertyId', '==', id), 
                            where('status', '==', 'active'),
                            limit(QUERY_LIMITS.HARD_CAP)
                        );
                        const moveInsSnap = await getDocs(moveInsQ);
                        propData.rentHistoryCount = moveInsSnap.size;
                    } catch (e) {
                        propData.rentHistoryCount = 0;
                    }
                    
                    // Check if current user already requested this property recently
                    if (currentUser) {
                        try {
                            // ✅ F-08: bounded — only fetch the last 50 requests for this tenant
                            const reqQ = query(
                                collection(db, 'viewing_requests'),
                                where('tenantId', '==', currentUser.uid),
                                limit(50)
                            );
                            const reqSnap = await getDocs(reqQ);
                            const fortyEightHoursAgoMs = Date.now() - 48 * 60 * 60 * 1000;
                            
                            const hasRecentRequest = reqSnap.docs.some(d => {
                                const data = d.data();
                                if (data.propertyId !== id) return false;
                                
                                let createdMs = 0;
                                if (data.createdAt) {
                                    if (typeof data.createdAt.toMillis === 'function') {
                                        createdMs = data.createdAt.toMillis();
                                    } else if (data.createdAt instanceof Date) {
                                        createdMs = data.createdAt.getTime();
                                    } else if (typeof data.createdAt.seconds === 'number') {
                                        createdMs = data.createdAt.seconds * 1000;
                                    }
                                }
                                
                                if (createdMs === 0) return false;
                                return createdMs >= fortyEightHoursAgoMs;
                            });
                            
                            if (hasRecentRequest) {
                                setRequestSent(true);
                            }
                        } catch (e) {
                            // Silently ignore — non-critical check
                        }
                    }
                }
            } finally {
                setLoading(false);
            }
        };
        fetchProperty();
    }, [id, currentUser]);

    const handleSendRequest = async (formData) => {
        if (!currentUser) return navigate('/login');
        if (!currentUser.emailVerified) {
            toast.warning("Please verify your email address to send viewing requests.");
            return;
        }
        
        const targetOwnerId = property.ownerId || property.userId;
        if (targetOwnerId === currentUser.uid) {
            toast.error('You cannot request your own property.');
            return;
        }

        try {
            setRequestSending(true);

            // ── 48h per-listing cooldown check ────────────────────────────
            // ✅ F-08: bounded — only fetch last 50 requests; tenants rarely exceed this
            const dupQ = query(
                collection(db, 'viewing_requests'),
                where('tenantId', '==', currentUser.uid),
                limit(50)
            );
            const dupSnap = await getDocs(dupQ);
            const fortyEightHoursAgoMs = Date.now() - 48 * 60 * 60 * 1000;
            
            const duplicate = dupSnap.docs.find(d => {
                const data = d.data();
                if (data.propertyId !== id) return false;
                
                let createdMs = 0;
                if (data.createdAt) {
                    if (typeof data.createdAt.toMillis === 'function') {
                        createdMs = data.createdAt.toMillis();
                    } else if (data.createdAt instanceof Date) {
                        createdMs = data.createdAt.getTime();
                    } else if (typeof data.createdAt.seconds === 'number') {
                        createdMs = data.createdAt.seconds * 1000;
                    }
                }
                
                if (createdMs === 0) return false;
                return createdMs >= fortyEightHoursAgoMs;
            });

            if (duplicate) {
                toast.error('You already sent a request for this property. Please wait 48 hours before trying again.');
                return;
            }
            // ─────────────────────────────────────────────────────────────

            const reqRef = await addDoc(collection(db, 'viewing_requests'), {
                propertyId: id,
                propertyName: property.title,
                propertyImage: property.images?.[0] || null,
                propertyPrice: property.rent || property.price || null,
                ownerId: targetOwnerId,
                tenantId: currentUser.uid,
                tenantName: currentUser.displayName ?? formData.name,
                status: 'pending',
                isRead: false,
                conversationId: null,
                createdAt: serverTimestamp(),
                tenantDetails: {
                  name:               formData.name,
                  email:              formData.email,
                  phone:              formData.phone,
                  profession:         formData.profession,
                  maritalStatus:      formData.maritalStatus || 'Prefer not to say',
                  numberOfOccupants:  Number(formData.numberOfOccupants || 1),
                  preferredDate:      formData.preferredDate || '',
                  message:            formData.message || '',
                }
            });

            // Fetch owner info to create conversation properly
            // NOTE: Firestore rules restrict users/{uid} reads to the owner only.
            // A tenant cannot read the owner's user doc, so we wrap this in
            // try/catch and fall back to sensible defaults if the read is denied.
            let ownerData = {};
            try {
                const ownerDoc = await getDoc(doc(db, 'users', targetOwnerId));
                if (ownerDoc.exists()) {
                    ownerData = ownerDoc.data();
                }
            } catch (ownerReadErr) {
                // Expected when Firestore rules deny cross-user reads
                logger.warn('Could not read owner user doc (permission denied). Using fallback.', ownerReadErr);
            }

            const convId = await getOrCreateConversation({
                ownerId: targetOwnerId,
                tenantId: currentUser.uid,
                propertyId: id,
                propertyTitle: property.title,
                propertyImage: property.images?.[0] || null,
                propertyPrice: property.rent || property.price || null,
                requestId: reqRef.id,
                ownerInfo: { name: ownerData.displayName ?? 'Owner', photo: ownerData.photoURL ?? null, phone: ownerData.phone ?? null },
                tenantInfo: { name: currentUser.displayName ?? formData.name, photo: currentUser.photoURL ?? null, phone: formData.phone ?? null },
                initialOwnerUnread: 1, // Make sure owner sees badge
            });

            // Link conversation to request
            await updateDoc(reqRef, { conversationId: convId });

            // Notify Owner (non-blocking — should not fail the request if notification write is denied)
            if (targetOwnerId) {
                try {
                    await createNotification(
                        targetOwnerId,
                        'request_received',
                        'New Viewing Request',
                        `${formData.name} wants to view ${property.title}`,
                        `/messages/${convId}`,
                        { propertyId: id }
                    );
                } catch (notifErr) {
                    logger.warn('Could not create notification (permission denied). Request still succeeded.', notifErr);
                }
            }

            setRequestSent(true);
            setIsModalOpen(false);
            toast.success('Request sent successfully! Check your Messages to start chatting.');
        } catch (error) {
            logger.error(error);
            toast.error('Failed to send request. Please try again.');
        } finally {
            setRequestSending(false);
        }
    };

    if (loading) return <PropertyDetailSkeleton />;

    if (!property) return (
        <div className="min-h-screen bg-[#F8F9FA] dark:bg-[#0F1117] flex items-center justify-center p-6 text-center">
            <div>
                <h1 className="text-2xl font-black mb-4">{t('no_properties')}</h1>
                <Link to="/search" className="text-primary dark:text-indigo-400 font-bold">{t('search')}</Link>
            </div>
        </div>
    );

    const images = property.images || [];

    const paginateImage = (newDirection) => {
        setSlideDirection(newDirection);
        setActiveImage((prev) => {
            const next = prev + newDirection;
            if (next >= images.length) return 0;
            if (next < 0) return images.length - 1;
            return next;
        });
    };

    const isOwner = currentUser && (currentUser.uid === property.ownerId || currentUser.uid === property.userId);

    const waUrl = (() => {
        const raw = owner?.whatsappNumber || owner?.phone || property?.ownerPhone;
        if (!raw) return null;
        // Normalise: strip non-digits, convert leading 0 → 880 (Bangladesh)
        const digits = raw.replace(/\D/g, '');
        const intl = digits.startsWith('880') ? digits : `880${digits.replace(/^0/, '')}`;
        const msg = encodeURIComponent(
            `হ্যালো, আমি Any-Let এ আপনার "${property.title}" প্রপার্টি দেখেছি (https://anylet.com/property/${id})। আমি এটি সম্পর্কে আরও বিস্তারিত জানতে আগ্রহী।`
        );
        return `https://wa.me/${intl}?text=${msg}`;
    })();

    return (
        <div className="min-h-screen bg-[#F8F9FA] dark:bg-[#0F1117] pb-32 lg:pb-12">
        <Helmet>
            <title>{`${property.title || 'Property'} — ${[property.upazila, property.district].filter(Boolean).join(', ') || 'Bangladesh'} | Any-Let`}</title>
            <meta name="description" content={`${property.title || 'Rental property'} for ৳${property.rent || ''}/${property.billingCycle || 'month'} in ${[property.upazila, property.district, property.division].filter(Boolean).join(', ')}. View details on Any-Let.`} />
        </Helmet>
        <div className="max-w-7xl mx-auto px-0 md:px-6 py-4 md:py-8 lg:max-w-[1400px] lg:px-12 lg:py-10">
                {/* Navigation Row with Back and Share (Desktop Only) */}
                <div className="hidden md:flex items-center justify-between px-4 md:px-0 mb-4 md:mb-6">
                    <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-slate-500 hover:text-primary dark:text-indigo-400 transition-colors font-bold">
                        <ArrowLeft size={20} /> {t('back_to_discovery')}
                    </button>
                    <button 
                        onClick={() => setShareModalOpen(true)}
                        className="flex items-center gap-2 px-4 py-2 rounded-full bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 hover:text-primary dark:text-indigo-400 dark:hover:text-primary dark:text-indigo-400 border border-slate-100 dark:border-slate-800 hover:border-primary/20 dark:hover:border-primary/20 transition-all font-bold text-sm shadow-sm hover:shadow-md"
                    >
                        <Share2 size={16} />
                        <span>Share</span>
                    </button>
                </div>

                <div className="flex flex-col lg:flex-row lg:justify-center gap-6 md:gap-10">
                    {/* Left: Content (Gallery + Details) */}
                    <div className="flex-1 lg:max-w-[750px]">
                        {/* Image Gallery */}
                        <div className="relative md:rounded-[40px] overflow-hidden bg-slate-200 dark:bg-slate-900 group shadow-2xl shadow-slate-200/50 dark:shadow-none mb-6 md:mb-10">
                            {/* Mobile Share Overlay */}
                            <button 
                                onClick={() => setShareModalOpen(true)}
                                className="md:hidden absolute top-4 right-4 z-10 flex items-center justify-center size-10 rounded-full bg-white/90 dark:bg-slate-900/90 backdrop-blur-md shadow-lg border border-slate-200/50 dark:border-slate-700/50 text-slate-700 dark:text-slate-300 active:scale-90 transition-transform"
                                aria-label="Share property"
                            >
                                <Share2 size={18} />
                            </button>

                            {images.length > 0 ? (
                                <>
                                    <div className="w-full aspect-[4/3] relative overflow-hidden cursor-grab active:cursor-grabbing">
                                        <AnimatePresence initial={false} custom={slideDirection}>
                                            <motion.img
                                                key={activeImage}
                                                custom={slideDirection}
                                                variants={sliderVariants}
                                                initial="enter"
                                                animate="center"
                                                exit="exit"
                                                transition={{ x: { type: "spring", stiffness: 300, damping: 30 }, opacity: { duration: 0.2 } }}
                                                src={getOptimizedImageUrl(images[activeImage], 1200)}
                                                className="absolute inset-0 w-full h-full object-cover pointer-events-none select-none"
                                                draggable={false}
                                                drag="x"
                                                dragConstraints={{ left: 0, right: 0 }}
                                                dragElastic={1}
                                                onDragEnd={(e, { offset, velocity }) => {
                                                    const swipe = Math.abs(offset.x) * velocity.x;
                                                    if (swipe < -10000) {
                                                        paginateImage(1);
                                                    } else if (swipe > 10000) {
                                                        paginateImage(-1);
                                                    } else if (offset.x < -100) {
                                                        paginateImage(1);
                                                    } else if (offset.x > 100) {
                                                        paginateImage(-1);
                                                    }
                                                }}
                                            />
                                        </AnimatePresence>
                                        
                                        {images.length > 1 && (
                                            <>
                                                <button
                                                    onClick={() => paginateImage(-1)}
                                                    className="absolute left-4 top-1/2 -translate-y-1/2 size-12 rounded-full bg-white/70 backdrop-blur-md text-slate-800 flex items-center justify-center shadow-lg hover:bg-white transition-all opacity-0 group-hover:opacity-100 hidden md:flex z-10"
                                                >
                                                    <ChevronLeft size={24} />
                                                </button>
                                                <button
                                                    onClick={() => paginateImage(1)}
                                                    className="absolute right-4 top-1/2 -translate-y-1/2 size-12 rounded-full bg-white/70 backdrop-blur-md text-slate-800 flex items-center justify-center shadow-lg hover:bg-white transition-all opacity-0 group-hover:opacity-100 hidden md:flex z-10"
                                                >
                                                    <ChevronRight size={24} />
                                                </button>
                                            </>
                                        )}
                                    </div>
                                    <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-3 px-4 py-3 bg-black/20 backdrop-blur-md rounded-full border border-white/20 z-20">
                                        {images.map((_, idx) => (
                                            <motion.button
                                                key={idx}
                                                layoutId={`dot-${idx}`}
                                                onClick={() => {
                                                    setSlideDirection(idx > activeImage ? 1 : -1);
                                                    setActiveImage(idx);
                                                }}
                                                animate={{ width: activeImage === idx ? 24 : 10, background: activeImage === idx ? 'var(--color-primary, #6366f1)' : 'rgba(255,255,255,0.6)' }}
                                                transition={{ type: 'spring', stiffness: 300, damping: 22 }}
                                                className="h-2.5 rounded-full"
                                            />
                                        ))}
                                    </div>
                                </>
                            ) : (
                                <div className="aspect-[4/3] flex items-center justify-center text-slate-400">No Image Available</div>
                            )}
                        </div>

                        {/* Title, Stats & Price */}
                        <motion.div variants={sectionVariants} className="mb-8 md:mb-10 px-4 md:px-0 flex flex-col md:flex-row md:justify-between md:items-center gap-6">
                            <div className="flex-1">
                                {property.status && property.status !== 'Available' && (
                                    <div className={`inline-flex items-center gap-1.5 mb-3 px-3 py-1.5 rounded-lg font-black text-xs uppercase tracking-widest border shadow-sm ${
                                        property.status === 'Let Agreed' 
                                            ? 'bg-rose-100 text-rose-600 border-rose-200 dark:bg-rose-500/20 dark:text-rose-400 dark:border-rose-500/30' 
                                            : property.status === 'Booked'
                                                ? 'bg-blue-100 text-blue-600 border-blue-200 dark:bg-blue-500/20 dark:text-blue-400 dark:border-blue-500/30'
                                                : 'bg-amber-100 text-amber-600 border-amber-200 dark:bg-amber-500/20 dark:text-amber-400 dark:border-amber-500/30'
                                    }`}>
                                        {property.status === 'Let Agreed' ? <CheckCircle2 size={14} strokeWidth={3} /> : property.status === 'Booked' ? <Lock size={14} strokeWidth={3} /> : <AlertTriangle size={14} strokeWidth={3} />}
                                        {property.status}
                                    </div>
                                )}
                                <h1 className="text-2xl md:text-4xl font-black text-slate-900 dark:text-white mb-4 leading-tight">
                                    {property.title}
                                </h1>
                                <div className="flex flex-wrap items-center gap-3 md:gap-6 text-sm md:text-base text-slate-500 font-bold">
                                    <span className="flex items-center gap-1.5 break-all md:break-normal"><MapPin size={18} className="text-primary dark:text-indigo-400 shrink-0" /> {property.addressDetails ? `${property.addressDetails}, ` : ''}{property.upazila}, {property.district}</span>
                                    
                                    <button 
                                        onClick={() => navigate('/map', { state: { centerProperty: property } })}
                                        className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-50 dark:bg-indigo-500/10 hover:bg-indigo-100 dark:hover:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 rounded-full text-xs font-black transition-colors border border-indigo-200 dark:border-indigo-500/30 shadow-sm"
                                    >
                                        <Map size={14} /> See on Map
                                    </button>

                                    {property.area && <span className="flex items-center gap-1.5"><Maximize size={18} className="shrink-0" /> {property.area} {t('sqft')}</span>}
                                    {property.isPropertyVerified && <span className="flex items-center gap-1.5 text-emerald-600 bg-emerald-50 dark:bg-emerald-500/10 px-3 py-1 rounded-lg text-xs font-black"><ShieldCheck size={14} className="text-emerald-600 shrink-0" /> AnyLet Verified</span>}
                                    {property.isVerified && <span className="flex items-center gap-1.5 text-indigo-600 bg-indigo-50 dark:bg-indigo-500/10 px-3 py-1 rounded-lg text-xs font-black"><ShieldCheck size={14} className="text-indigo-600 shrink-0" /> Verified Landlord</span>}
                                    {property.isOnsiteVerified && (
                                        <span className="flex items-center gap-1.5 bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 px-3 py-1 rounded-lg text-xs font-black">
                                            <Shield size={14} className="fill-blue-100 dark:fill-blue-500/20" /> Onsite Verified
                                        </span>
                                    )}
                                    {property.reviewCount > 0 && (
                                        <a href="#reviews" onClick={(e) => {
                                            e.preventDefault();
                                            document.getElementById('reviews')?.scrollIntoView({ behavior: 'smooth' });
                                        }} className="flex items-center gap-1.5 bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400 px-3 py-1 rounded-lg text-xs font-black hover:bg-amber-100 transition-colors cursor-pointer">
                                            <Star size={14} className="fill-amber-500" />
                                            {Number(property.reviewScore || 0).toFixed(1)} ({property.reviewCount} Reviews)
                                        </a>
                                    )}
                                </div>
                            </div>
                            
                            {/* Price Tag & Utilities */}
                            <div className="bg-primary/5 p-5 md:p-6 rounded-3xl border border-primary/10 shrink-0 flex flex-col md:items-end">
                                <p className="text-[10px] font-black uppercase tracking-widest text-primary dark:text-indigo-400/70 mb-1">{t('rent')}</p>
                                <div className="flex items-baseline gap-2 mb-2">
                                    <span className="text-3xl md:text-4xl font-black text-primary dark:text-indigo-400 hover:scale-105 transition-transform origin-left md:origin-right">৳{property.rent?.toLocaleString()}</span>
                                    <span className="text-lg font-bold text-slate-500">/{property.billingCycle}</span>
                                </div>
                                <div className="flex items-center gap-2 text-sm font-bold text-slate-600 dark:text-slate-400">
                                    <Zap size={14} className="text-amber-500" />
                                    {property.utilitiesCost ? `+ ৳${property.utilitiesCost?.toLocaleString()} monthly utilities` : 'Utilities included'}
                                </div>
                            </div>
                        </motion.div>

                        {/* Booking Banner (Escrow) */}
                        {!isOwner && property.securityDeposit > 0 && property.status === 'Available' && (
                            <div className="mb-6 md:mb-10 px-4 md:px-0">
                                <div className="bg-gradient-to-br from-primary to-indigo-900 rounded-[32px] p-6 md:p-8 flex flex-col md:flex-row items-center justify-between gap-6 relative overflow-hidden shadow-2xl shadow-primary/20">
                                    <div className="absolute -top-10 -right-10 p-8 opacity-10 pointer-events-none rotate-12">
                                        <Shield size={160} />
                                    </div>
                                    <div className="flex items-start gap-4 md:gap-6 relative z-10 w-full md:w-auto">
                                        <div className="size-14 md:size-16 rounded-2xl bg-white/10 flex items-center justify-center text-white shrink-0 border border-white/20">
                                            <Lock size={28} />
                                        </div>
                                        <div className="flex-1">
                                            <h3 className="text-xl md:text-2xl font-black text-white mb-2 leading-tight">Secure this property instantly</h3>
                                            <p className="text-sm md:text-base text-indigo-100 font-medium leading-relaxed max-w-md">
                                                Pay the <span className="text-white font-black">৳{property.securityDeposit.toLocaleString()}</span> security deposit via Any-Let Escrow. 
                                                Safe, secure, and <span className="text-white font-black border-b border-indigo-300">100% refundable</span> if you don't move in.
                                            </p>
                                        </div>
                                    </div>
                                    <button 
                                        onClick={() => {
                                            if (!currentUser) return navigate('/login');
                                            setBookModalOpen(true);
                                        }}
                                        className="w-full md:w-auto py-4 px-8 bg-white hover:bg-slate-50 text-primary dark:text-indigo-400 font-black text-base md:text-lg rounded-2xl shadow-xl shadow-black/10 active:scale-95 transition-all shrink-0 relative z-10 flex items-center justify-center gap-2"
                                    >
                                        <Shield size={20} className="fill-indigo-100" /> Book Now
                                    </button>
                                </div>
                            </div>
                        )}

                        {/* Rental History Trust Banner */}
                        {property.rentHistoryCount > 0 && (
                            <div className="mb-6 md:mb-10 px-4 md:px-0">
                                <div className="bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-emerald-900/20 dark:to-teal-900/20 border border-emerald-100 dark:border-emerald-800/50 rounded-3xl p-5 flex items-center gap-4 shadow-sm">
                                    <div className="size-12 rounded-full bg-emerald-100 dark:bg-emerald-800/50 flex items-center justify-center text-emerald-600 dark:text-emerald-400 shrink-0">
                                        <ShieldCheck size={24} />
                                    </div>
                                    <div>
                                        <h3 className="text-sm font-black text-emerald-800 dark:text-emerald-300">Trusted Property</h3>
                                        <p className="text-xs font-bold text-emerald-600 dark:text-emerald-500/80 mt-0.5">
                                            This property has been securely rented <span className="font-black text-emerald-700 dark:text-emerald-400">{property.rentHistoryCount} times</span> via AnyLet since {property.createdAt?.toDate ? property.createdAt.toDate().getFullYear() : '2023'}.
                                        </p>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Description */}
                        <motion.section variants={sectionVariants} className="bg-white dark:bg-[#1A1D24] p-6 md:p-10 md:rounded-[40px] border-y md:border border-slate-100 dark:border-slate-800/70 mb-6 md:mb-10">
                            <h2 className="text-xl md:text-2xl font-black mb-4 md:mb-6">{t('description')}</h2>
                            <p className="text-slate-600 dark:text-slate-400 leading-relaxed text-base md:text-lg font-medium whitespace-pre-wrap">
                                {property.description || 'No description provided.'}
                            </p>
                        </motion.section>

                        {/* BD Specific Specs */}
                        <motion.section variants={sectionVariants} className="bg-white dark:bg-[#1A1D24] p-6 md:p-10 md:rounded-[40px] border-y md:border border-slate-100 dark:border-slate-800/70 mb-6 md:mb-10">
                            <h2 className="text-xl md:text-2xl font-black mb-6 flex items-center gap-3">
                                <Building2 size={24} className="text-primary dark:text-indigo-400" /> Property Specifications
                            </h2>
                            <div className="grid grid-cols-2 md:grid-cols-3 gap-y-6 gap-x-4">
                                <SpecItem icon={<ArrowRight className="-rotate-45" />} label="Floor" value={property.floorNumber || 'Not Specified'} />
                                <SpecItem icon={<DoorOpen />} label="Verandas" value={property.verandas || '0'} />
                                <SpecItem icon={<Bed />} label="Rooms" value={property.beds || '0'} />
                                <SpecItem icon={<Bath />} label="Baths" value={property.baths || '0'} />
                            </div>
                            
                            {property.distances && (property.distances.mosque || property.distances.school || property.distances.market) && (
                                <div className="mt-8 pt-6 border-t border-slate-100 dark:border-slate-800">
                                    <h3 className="text-sm font-black text-slate-400 uppercase tracking-widest mb-4">Nearby Amenities</h3>
                                    <div className="flex flex-wrap gap-4">
                                        {property.distances.mosque && <DistanceBadge label="Mosque" value={property.distances.mosque} />}
                                        {property.distances.school && <DistanceBadge label="School" value={property.distances.school} />}
                                        {property.distances.market && <DistanceBadge label="Market" value={property.distances.market} />}
                                    </div>
                                </div>
                            )}
                        </motion.section>

                        {/* Features & Amenities */}
                        {(() => {
                            const processedFeatures = new Set(property.features || []);
                            if (property.parkingType && property.parkingType !== 'None') {
                                processedFeatures.delete('Car Parking');
                                processedFeatures.add(`Car Parking (${property.parkingType})`);
                            }
                            if (property.petPolicy && property.petPolicy !== 'Not Allowed') processedFeatures.add(`Pet Policy (${property.petPolicy})`);
                            if (property.bachelorPolicy && property.bachelorPolicy !== 'Not Allowed') processedFeatures.add(`Bachelor Policy (${property.bachelorPolicy})`);
                            if (property.familyPolicy && property.familyPolicy !== 'Any') processedFeatures.add(`Family Policy (${property.familyPolicy})`);
                            
                            const processedUtilities = new Set(property.utilities || []);
                            ['Prepaid Gas', 'Line Gas', 'Prepaid Electricity', 'Postpaid Electricity', 'Water (WASA)', 'Deep Tube-well Water'].forEach(u => processedUtilities.delete(u));
                            
                            if (property.waterSource) processedUtilities.add(`Water (${property.waterSource})`);
                            if (property.gasSupply) processedUtilities.add(`Gas (${property.gasSupply})`);
                            if (property.electricityBilling && property.electricityBilling !== 'Excluded') processedUtilities.add(`Electricity (${property.electricityBilling})`);
                            
                            const displayFeatures = Array.from(processedFeatures);
                            const displayUtilities = Array.from(processedUtilities);

                            return (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-10">
                                    <section className="bg-white dark:bg-[#1A1D24] p-6 md:p-8 md:rounded-[40px] border-y md:border border-slate-100 dark:border-slate-800/70">
                                        <h3 className="text-lg md:text-xl font-black mb-4 md:mb-6 flex items-center gap-3">
                                            <Zap size={20} className="text-primary dark:text-indigo-400 md:w-6 md:h-6" /> {t('amenities')}
                                        </h3>
                                        <div className="grid grid-cols-1 gap-4">
                                            {displayFeatures.length > 0 ? displayFeatures.map(f => (
                                                <div key={f} className="flex items-center gap-3 text-slate-600 dark:text-slate-300 font-bold text-sm">
                                                    <div className="size-6 rounded-lg bg-primary/10 flex items-center justify-center text-primary dark:text-indigo-400 shrink-0"><CheckCircle2 size={14} /></div>
                                                    {f}
                                                </div>
                                            )) : <div className="text-sm text-slate-400">None specified</div>}
                                        </div>
                                    </section>
                                    <section className="bg-white dark:bg-[#1A1D24] p-6 md:p-8 md:rounded-[40px] border-y md:border border-slate-100 dark:border-slate-800/70">
                                        <h3 className="text-lg md:text-xl font-black mb-4 md:mb-6 flex items-center gap-3">
                                            <Info size={20} className="text-primary dark:text-indigo-400 md:w-6 md:h-6" /> {t('inclusions')}
                                        </h3>
                                        <div className="grid grid-cols-1 gap-4">
                                            {displayUtilities.length > 0 ? displayUtilities.map(u => (
                                                <div key={u} className="flex items-center gap-3 text-slate-600 dark:text-slate-300 font-bold text-sm">
                                                    <div className="size-6 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-500 shrink-0"><CheckCircle2 size={14} /></div>
                                                    {u}
                                                </div>
                                            )) : <div className="text-sm text-slate-400">None specified</div>}
                                        </div>
                                    </section>
                                </div>
                            );
                        })()}
                    </div>

                    {/* Right: Sidebar (Sticky) */}
                    <div className="lg:w-[400px] px-4 md:px-0">
                        <div className="sticky top-28 space-y-6">
                            {/* Desktop Action Card (Hidden on Mobile) */}
                            {!isOwner ? (
                                <div className="hidden lg:block bg-white dark:bg-[#1A1D24] p-8 rounded-[40px] border border-slate-100 dark:border-slate-800/70 shadow-sm relative overflow-hidden">
                                    <h3 className="text-xs font-black uppercase tracking-widest text-slate-400 mb-6 text-center">{t('interested')}</h3>
                                    
                                    {property.status !== 'Let Agreed' && property.status !== 'Booked' ? (
                                        <>
                                            {property.instantBooking && property.securityDeposit > 0 && (
                                                <div className="mb-4 p-4 rounded-2xl bg-gradient-to-br from-primary to-indigo-900 text-white relative overflow-hidden">
                                                    <div className="absolute -top-6 -right-6 opacity-10 pointer-events-none">
                                                        <Shield size={80} />
                                                    </div>
                                                    <div className="relative z-10">
                                                        <div className="flex items-center gap-2 mb-1">
                                                            <Lock size={16} className="text-white/80" />
                                                            <span className="text-[10px] font-black uppercase tracking-widest text-indigo-100">Escrow Booking</span>
                                                        </div>
                                                        <p className="text-xs text-indigo-100 font-medium mb-3 leading-relaxed">
                                                            Pay ৳{property.securityDeposit?.toLocaleString()} deposit. <span className="text-white font-black">100% refundable</span> if you don't move in.
                                                        </p>
                                                        <button 
                                                            onClick={() => {
                                                                if (!currentUser) return navigate('/login');
                                                                setBookModalOpen(true);
                                                            }}
                                                            className="w-full py-3 bg-white text-primary dark:text-indigo-400 font-black rounded-xl shadow-lg active:scale-95 transition-all flex items-center justify-center gap-2"
                                                        >
                                                            <Shield size={16} className="fill-indigo-100" /> Book Now
                                                        </button>
                                                    </div>
                                                </div>
                                            )}
                                            {property.instantBooking && (!property.securityDeposit || property.securityDeposit === 0) && (
                                                <button 
                                                    onClick={() => {
                                                        if (!currentUser) return navigate('/login');
                                                        setBookModalOpen(true);
                                                    }}
                                                    className="w-full py-5 rounded-2xl bg-gradient-to-br from-primary to-indigo-900 text-white font-black text-lg hover:opacity-90 transition-opacity flex items-center justify-center gap-2 mb-4 shadow-xl shadow-primary/20"
                                                >
                                                    <Shield size={20} className="fill-indigo-100" /> Book Now
                                                </button>
                                            )}
                                            <motion.button 
                                                onClick={() => !requestSent && setIsModalOpen(true)}
                                                disabled={requestSent || requestSending}
                                                variants={!requestSent ? ctaVariants : {}}
                                                initial="idle"
                                                animate={!requestSent ? 'pulse' : 'idle'}
                                                whileHover={{ scale: 1.02 }}
                                                whileTap={{ scale: 0.96 }}
                                                className={`w-full py-5 rounded-2xl font-black text-lg transition-colors shadow-xl mb-4 ${requestSent ? 'bg-emerald-500 text-white' : 'bg-primary text-white'}`}
                                            >
                                                {requestSending ? 'Sending...' : requestSent ? 'Request Sent ✓' : t('request_viewing')}
                                            </motion.button>
                                            <button 
                                                onClick={() => {
                                                    if (!currentUser) return navigate('/login');
                                                    if (!currentUser.emailVerified) {
                                                        toast.warning("Please verify your email address to call the owner.");
                                                        return;
                                                    }
                                                    const phone = owner?.phone || property?.ownerPhone || '';
                                                    if (phone) {
                                                        setPhoneNumberToCall(phone);
                                                        setCallModalOpen(true);
                                                    } else {
                                                        toast.error("Phone number not available");
                                                    }
                                                }}
                                                className={`w-full py-5 rounded-2xl bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-200 font-bold text-lg hover:bg-slate-200 transition-colors flex items-center justify-center gap-2`}
                                            >
                                                <Phone size={20} /> {t('call_owner')}
                                            </button>
                                        </>
                                    ) : (
                                        <div className={`${property.status === 'Booked' ? 'bg-blue-50 dark:bg-blue-500/10 border-blue-100 dark:border-blue-500/20 text-blue-600 dark:text-blue-400' : 'bg-rose-50 dark:bg-rose-500/10 border-rose-100 dark:border-rose-500/20 text-rose-600 dark:text-rose-400'} border p-4 rounded-2xl text-center font-bold text-sm mb-4`}>
                                            This property has been {property.status} and is no longer available for viewings.
                                        </div>
                                    )}

                                    {waUrl && (
                                        <div className="flex justify-center mt-4">
                                            <a
                                                href={waUrl}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-500 hover:text-emerald-700 dark:hover:text-emerald-400 font-bold text-sm transition-colors"
                                            >
                                                <MessageCircle size={16} /> Contact on WhatsApp
                                            </a>
                                        </div>
                                    )}
                                </div>
                            ) : (
                                <div className="hidden lg:block bg-primary/5 p-8 rounded-[40px] border border-primary/20 text-center space-y-4">
                                    <h3 className="text-sm font-black uppercase tracking-widest text-primary dark:text-indigo-400 mb-2">Your Property</h3>
                                    <p className="text-slate-600 dark:text-slate-400 text-sm font-medium">You are viewing your own listing.</p>
                                </div>
                            ) }

                            {/* Owner Card */}
                            <div className="bg-white dark:bg-[#1A1D24] p-6 md:p-8 rounded-3xl md:rounded-[40px] border border-slate-100 dark:border-slate-800/70 shadow-sm">
                                <h3 className="text-xs font-black uppercase tracking-widest text-slate-400 mb-6">{t('owner_contact')}</h3>
                                <Link to={`/owner/${property.ownerId || property.userId}`} className="flex items-center gap-4 group cursor-pointer">
                                    <div className="size-16 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-primary dark:text-indigo-400 shadow-inner group-hover:bg-primary group-hover:text-white transition-colors">
                                        <User size={32} />
                                    </div>
                                    <div className="flex-1">
                                        <p className="text-lg font-black text-slate-900 dark:text-white leading-none mb-1 group-hover:text-primary dark:text-indigo-400 transition-colors">{owner?.displayName || owner?.name || property?.ownerName || 'Owner / Agent'}</p>
                                        <p className="text-sm font-bold text-slate-500">Tap to view profile &amp; ads &gt;</p>
                                    </div>
                                </Link>
                            </div>

                            {/* Scam protection removed per request */}
                            
                            {/* Report Ad Option */}
                            <div className="pt-4 border-t border-slate-100 dark:border-slate-800">
                                <Link to={`/report-property/${id}`} 
                                    state={{ property }}
                                    className="flex items-center justify-center gap-2 text-slate-400 hover:text-rose-500 font-bold text-sm transition-colors py-2 group"
                                >
                                    <Flag size={16} className="group-hover:fill-rose-500" /> Report this ad
                                </Link>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Property Reviews Section (Bottom full width) */}
                {property.reviewCount > 0 && (
                    <div className="mt-8 mb-6 px-4 md:px-0">
                        <div className="bg-white dark:bg-[#1A1D24] rounded-[32px] md:rounded-[40px] p-6 md:p-10 border border-slate-100 dark:border-slate-800/70 shadow-sm flex flex-col md:flex-row items-center justify-between gap-6">
                            <div className="flex items-center gap-6 w-full md:w-auto">
                                <div className="size-16 rounded-3xl bg-amber-50 dark:bg-amber-500/10 flex items-center justify-center text-amber-500 shrink-0">
                                    <Star size={28} className="fill-amber-500" />
                                </div>
                                <div>
                                    <h3 className="text-xl md:text-2xl font-black text-slate-900 dark:text-white mb-1">Guest Reviews</h3>
                                    <div className="flex items-center gap-2 text-sm font-bold text-slate-500">
                                        <span className="text-slate-900 dark:text-white text-base">{property.reviewScore?.toFixed(1)} overall rating</span>
                                        <span className="w-1 h-1 rounded-full bg-slate-300 dark:bg-slate-600"></span>
                                        <span>Based on {property.reviewCount} reviews</span>
                                    </div>
                                </div>
                            </div>
                            <Link to={`/property/${property.id}/reviews`}
                                className="w-full md:w-auto px-8 py-4 bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white font-black rounded-2xl hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors flex items-center justify-center gap-2 shrink-0"
                            >
                                Read all reviews <ChevronRight size={18} />
                            </Link>
                        </div>
                    </div>
                )}

                {/* Dynamic Bottom Action Bar (Scroll flow) */}
                {!isOwner && (
                    <motion.div variants={bottomBarVariants} initial="hidden" animate="visible" className="mt-10 pt-8 border-t border-slate-200 dark:border-slate-800 px-4">
                        <h3 className="text-xl font-black mb-6 text-slate-900 dark:text-white text-center">{t('interested')}</h3>
                        
                        {property.status !== 'Let Agreed' && property.status !== 'Booked' ? (
                            <div className="flex flex-col sm:flex-row items-center gap-4">
                                {property.instantBooking && (
                                    <motion.button 
                                        onClick={() => {
                                            if (!currentUser) return navigate('/login');
                                            setBookModalOpen(true);
                                        }}
                                        whileHover={{ scale: 1.02 }}
                                        whileTap={{ scale: 0.96 }}
                                        className="w-full h-14 rounded-2xl bg-gradient-to-br from-primary to-indigo-900 text-white font-black text-lg hover:opacity-90 transition-opacity flex items-center justify-center gap-2 shadow-xl shadow-primary/20"
                                    >
                                        <Shield size={20} className="fill-indigo-100" /> Book Now
                                    </motion.button>
                                )}
                                <motion.button 
                                    onClick={() => !requestSent && setIsModalOpen(true)}
                                    disabled={requestSent || requestSending}
                                    variants={!requestSent ? ctaVariants : {}}
                                    initial="idle"
                                    animate={!requestSent ? 'pulse' : 'idle'}
                                    whileHover={{ scale: 1.02 }}
                                    whileTap={{ scale: 0.96 }}
                                    className={`w-full flex justify-center items-center h-14 rounded-2xl font-black text-lg transition-colors shadow-xl ${requestSent ? 'bg-emerald-500 text-white' : 'bg-primary text-white'}`}
                                >
                                    {requestSending ? 'Sending...' : requestSent ? 'Request Sent ✓' : t('request_viewing')}
                                </motion.button>
                                <motion.button 
                                    whileHover={{ scale: 1.02 }}
                                    whileTap={{ scale: 0.96 }}
                                    onClick={() => {
                                        if (!currentUser) return navigate('/login');
                                        if (!currentUser.emailVerified) {
                                            toast.warning("Please verify your email address to call the owner.");
                                            return;
                                        }
                                        const phone = owner?.phone || property?.ownerPhone || '';
                                        if (phone) {
                                            setPhoneNumberToCall(phone);
                                            setCallModalOpen(true);
                                        } else {
                                            toast.error("Phone number not available");
                                        }
                                    }}
                                    className="w-full h-14 rounded-2xl bg-slate-200 dark:bg-slate-800 text-slate-800 dark:text-slate-200 font-bold hover:bg-slate-300 transition-colors flex items-center justify-center gap-3"
                                >
                                    <Phone size={20} /> {t('call_owner')}
                                </motion.button>
                            </div>
                        ) : (
                            <div className={`${property.status === 'Booked' ? 'bg-blue-50 dark:bg-blue-500/10 border-blue-100 dark:border-blue-500/20 text-blue-600 dark:text-blue-400' : 'bg-rose-50 dark:bg-rose-500/10 border-rose-100 dark:border-rose-500/20 text-rose-600 dark:text-rose-400'} border p-4 rounded-2xl text-center font-bold text-sm mb-2`}>
                                This property has been {property.status} and is no longer available for viewings.
                            </div>
                        )}

                        {waUrl && (
                            <div className="flex justify-center mt-4">
                                <a
                                    href={waUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-500 hover:text-emerald-700 dark:hover:text-emerald-400 font-bold text-sm transition-colors"
                                >
                                    <MessageCircle size={16} /> Contact on WhatsApp
                                </a>
                            </div>
                        )}
                        <div className="mt-8 flex justify-center">
                            <Link to={`/report-property/${id}`} 
                                state={{ property }}
                                className="flex items-center gap-2 text-slate-400 hover:text-rose-500 font-bold text-sm transition-colors py-4 px-8"
                            >
                                <Flag size={16} /> Report this ad
                            </Link>
                        </div>
                    </motion.div>
                )}
            </div>

            <ViewingRequestModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onSubmit={handleSendRequest}
                propertyTitle={property.title}
            />

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

            <ShareModal
                isOpen={shareModalOpen}
                onClose={() => setShareModalOpen(false)}
                property={property}
            />

            <BookPropertyModal
                isOpen={bookModalOpen}
                onClose={() => setBookModalOpen(false)}
                property={property}
            />
        </div>
    );
}

import { useRef } from 'react';
import logger from '../utils/logger';

// ── Spec card variants (decoupled per framer-motion-expert skill rules) ──
const specCardVariants = {
    rest: { scale: 1, y: 0 },
    hover: {
        scale: 1.04,
        y: -3,
        transition: { type: 'spring', stiffness: 320, damping: 22 },
    },
};

function SpecItem({ icon, label, value }) {
    return (
        <motion.div
            variants={specCardVariants}
            initial="rest"
            whileHover="hover"
            className="flex items-start gap-3 bg-white dark:bg-[#1A1D24] p-3 rounded-2xl border border-slate-100 dark:border-slate-800/70 will-change-transform"
        >
            <div className="size-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary dark:text-indigo-400 shrink-0">
                {icon}
            </div>
            <div>
                <p className="text-[10px] uppercase font-black tracking-widest text-slate-400">{label}</p>
                <p className="text-sm font-bold text-slate-900 dark:text-white">{value}</p>
            </div>
        </motion.div>
    );
}


function DistanceBadge({ label, value }) {
    return (
        <div className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-4 py-2 rounded-xl flex items-center gap-2">
            <MapPin size={14} className="text-primary dark:text-indigo-400" />
            <span className="text-xs font-black text-slate-500 uppercase tracking-wider">{label}:</span>
            <span className="text-sm font-bold text-slate-900 dark:text-white">{value}</span>
        </div>
    );
}
