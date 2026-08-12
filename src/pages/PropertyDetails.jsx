'use client';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { useState } from 'react';

import { doc, getDoc, collection, addDoc, serverTimestamp, query, where, getDocs, limit, updateDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import { getOrCreateConversation } from '../utils/messageService';
import logger from '../utils/logger';
import usePropertyDetails from '../hooks/usePropertyDetails';
import PropertyGallery from '../components/property/PropertyGallery';
import PropertySpecs from '../components/property/PropertySpecs';
import PropertyFeatures from '../components/property/PropertyFeatures';
import PropertyBookingCard from '../components/property/PropertyBookingCard';
import OwnerContactCard from '../components/property/OwnerContactCard';
import PropertyReviewsSummary from '../components/property/PropertyReviewsSummary';
import MobileActionBar from '../components/property/MobileActionBar';
import PropertyHeader from '../components/property/PropertyHeader';
import { ArrowLeft, Phone, Share2 } from 'lucide-react';
import { motion } from 'framer-motion';

import { sectionVariants } from '../components/property/motion';
import ViewingRequestModal from '../components/ViewingRequestModal';
import ConfirmationModal from '../components/ConfirmationModal';
import { PropertyDetailSkeleton } from '../components/Skeleton';
import ShareModal from '../components/ShareModal';
import BookPropertyModal from '../components/BookPropertyModal';
import { useToast } from '../contexts/ToastContext';
import { createNotification } from '../utils/notificationService';
import { Helmet } from 'react-helmet-async';


export default function PropertyDetails() {
    const { id } = useParams();
    const navigate = useNavigate();
    const { currentUser } = useAuth();
    const { t } = useLanguage();
    const toast = useToast();
    const { property, loading, owner, requestSent, setRequestSent } = usePropertyDetails(id, currentUser);
    const [requestSending, setRequestSending] = useState(false);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [callModalOpen, setCallModalOpen] = useState(false);
    const [phoneNumberToCall, setPhoneNumberToCall] = useState('');
    const [shareModalOpen, setShareModalOpen] = useState(false);
    const [bookModalOpen, setBookModalOpen] = useState(false);

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

    const isOwner = currentUser && (currentUser.uid === property.ownerId || currentUser.uid === property.userId);

    // Shared action handlers — used by both the desktop booking card and the
    // mobile action bar (previously duplicated inline in both).
    const handleBookNow = () => {
        if (!currentUser) return navigate('/login');
        setBookModalOpen(true);
    };

    const handleRequestViewing = () => {
        if (!requestSent) setIsModalOpen(true);
    };

    const handleCallOwner = () => {
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
    };

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
                        className="flex items-center gap-2 px-4 py-2 rounded-full bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 hover:text-primary dark:text-indigo-400 dark:hover:text-primary border border-slate-100 dark:border-slate-800 hover:border-primary/20 dark:hover:border-primary/20 transition-all font-bold text-sm shadow-sm hover:shadow-md"
                    >
                        <Share2 size={16} />
                        <span>Share</span>
                    </button>
                </div>

                <div className="flex flex-col lg:flex-row lg:justify-center gap-6 md:gap-10">
                    {/* Left: Content (Gallery + Details) */}
                    <div className="flex-1 lg:max-w-[750px]">
                        {/* Image Gallery */}
                        <PropertyGallery images={images} onShare={() => setShareModalOpen(true)} />

                        {/* Title, price & trust banners */}
                        <PropertyHeader
                            property={property}
                            isOwner={isOwner}
                            onBook={handleBookNow}
                            onSeeOnMap={() => navigate('/map', { state: { centerProperty: property } })}
                        />

                        {/* Description */}
                        <motion.section variants={sectionVariants} className="bg-white dark:bg-[#1A1D24] p-6 md:p-10 md:rounded-[40px] border-y md:border border-slate-100 dark:border-slate-800/70 mb-6 md:mb-10">
                            <h2 className="text-xl md:text-2xl font-black mb-4 md:mb-6">{t('description')}</h2>
                            <p className="text-slate-600 dark:text-slate-400 leading-relaxed text-base md:text-lg font-medium whitespace-pre-wrap">
                                {property.description || 'No description provided.'}
                            </p>
                        </motion.section>

                        {/* BD Specific Specs */}
                        <PropertySpecs property={property} />

                        {/* Features & Amenities */}
                        <PropertyFeatures property={property} />
                    </div>

                    {/* Right: Sidebar (Sticky) */}
                    <div className="lg:w-[400px] px-4 md:px-0">
                        <div className="sticky top-28 space-y-6">
                            <PropertyBookingCard
                                property={property}
                                isOwner={isOwner}
                                requestSent={requestSent}
                                requestSending={requestSending}
                                waUrl={waUrl}
                                onBook={handleBookNow}
                                onRequestViewing={handleRequestViewing}
                                onCall={handleCallOwner}
                            />

                            <OwnerContactCard property={property} id={id} owner={owner} />
                        </div>
                    </div>
                </div>

                {/* Property Reviews Section (Bottom full width) */}
                <PropertyReviewsSummary property={property} />

                {/* Dynamic Bottom Action Bar (Scroll flow) */}
                <MobileActionBar
                    property={property}
                    isOwner={isOwner}
                    id={id}
                    requestSent={requestSent}
                    requestSending={requestSending}
                    waUrl={waUrl}
                    onBook={handleBookNow}
                    onRequestViewing={handleRequestViewing}
                    onCall={handleCallOwner}
                />
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
