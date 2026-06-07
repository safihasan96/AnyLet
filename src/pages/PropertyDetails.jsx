import { useState, useEffect, useCallback, useMemo } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { doc, getDoc, collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase';
import { Helmet } from 'react-helmet-async';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import { 
  ArrowLeft, 
  MapPin, 
  Bed, 
  Bath, 
  Maximize, 
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
  Info,
  Flag,
  AlertTriangle,
  MessageCircle,
  Shield,
  Lock
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import ViewingRequestModal from '../components/ViewingRequestModal';
import ConfirmationModal from '../components/ConfirmationModal';
import PropertyLoader from '../components/PropertyLoader';
import ShareModal from '../components/ShareModal';
import BookPropertyModal from '../components/BookPropertyModal';
import { useToast } from '../contexts/ToastContext';

export default function PropertyDetails() {
    const { id } = useParams();
    const navigate = useNavigate();
    const { currentUser } = useAuth();
    const { t } = useLanguage();
    const toast = useToast();
    const [property, setProperty] = useState(null);
    const [loading, setLoading] = useState(true);
    const [activeImage, setActiveImage] = useState(0);
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
                    const ownerIdToFetch = propData.ownerId || propData.userId;
                    if (ownerIdToFetch) {
                        const ownerDoc = await getDoc(doc(db, 'users', ownerIdToFetch));
                        if (ownerDoc.exists()) {
                            setOwner({ id: ownerDoc.id, ...ownerDoc.data() });
                        }
                    }
                }
            } finally {
                setLoading(false);
            }
        };
        fetchProperty();
    }, [id]);

    const handleSendRequest = async (formData) => {
        if (!currentUser) return navigate('/login');
        if (!currentUser.emailVerified) {
            toast.warning("Please verify your email address to send viewing requests.");
            return;
        }
        try {
            setRequestSending(true);
            await addDoc(collection(db, 'viewing_requests'), {
                propertyId: id,
                propertyName: property.title,
                propertyImage: property.images?.[0] || null,
                ownerId: property.ownerId || property.userId,
                tenantId: currentUser.uid,
                tenantName: formData.name,
                status: 'pending',
                isRead: false,
                createdAt: serverTimestamp(),
                tenantDetails: formData
            });
            setRequestSent(true);
            setIsModalOpen(false);
        } catch (error) {
            console.error(error);
        } finally {
            setRequestSending(false);
        }
    };

    if (loading) return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center">
            <PropertyLoader />
        </div>
    );

    if (!property) return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center p-6 text-center">
            <div>
                <h1 className="text-2xl font-black mb-4">{t('no_properties')}</h1>
                <Link to="/search" className="text-primary font-bold">{t('search')}</Link>
            </div>
        </div>
    );

    const images = property.images || [];

    const isOwner = currentUser && (currentUser.uid === property.ownerId || currentUser.uid === property.userId);

    // Build WhatsApp deep-link if the owner has saved a whatsappNumber
    const waUrl = (() => {
        const raw = owner?.whatsappNumber;
        if (!raw) return null;
        // Normalise: strip non-digits, convert leading 0 → 880 (Bangladesh)
        const digits = raw.replace(/\D/g, '');
        const intl = digits.startsWith('880') ? digits : `880${digits.replace(/^0/, '')}`;
        const msg = encodeURIComponent(
            `Hi, I found your listing on Any-Let for ${property.title}. I am interested in renting. Could you please share more details?`
        );
        return `https://wa.me/${intl}?text=${msg}`;
    })();

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950 pb-32 lg:pb-12">
            <Helmet>
                <title>{property?.title ? `${property.title} | Any-Let` : 'Property Details | Any-Let'}</title>
                <meta name="description" content={property?.description?.substring(0, 160) || 'Find the best rental properties in Bangladesh with Any-Let.'} />
                <script type="application/ld+json">
                    {JSON.stringify({
                        "@context": "https://schema.org",
                        "@type": "Product",
                        "name": property?.title || 'Property',
                        "image": images[0] ? [images[0]] : [],
                        "description": property?.description || 'Property for rent',
                        "offers": {
                            "@type": "Offer",
                            "price": property?.price?.toString().replace(/\D/g, '') || "0",
                            "priceCurrency": "BDT"
                        }
                    })}
                </script>
            </Helmet>
            <div className="max-w-7xl mx-auto px-0 md:px-6 py-4 md:py-8">
                {/* Navigation Row with Back and Share */}
                <div className="flex items-center justify-between px-4 md:px-0 mb-4 md:mb-6">
                    <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-slate-500 hover:text-primary transition-colors font-bold">
                        <ArrowLeft size={20} /> {t('back_to_discovery')}
                    </button>
                    <button 
                        onClick={() => setShareModalOpen(true)}
                        className="flex items-center gap-2 px-4 py-2 rounded-full bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 hover:text-primary dark:hover:text-primary border border-slate-100 dark:border-slate-800 hover:border-primary/20 dark:hover:border-primary/20 transition-all font-bold text-sm shadow-sm hover:shadow-md"
                    >
                        <Share2 size={16} />
                        <span>Share</span>
                    </button>
                </div>

                <div className="flex flex-col lg:flex-row gap-6 md:gap-10">
                    {/* Left: Content (Gallery + Details) */}
                    <div className="flex-1 lg:max-w-[750px]">
                        {/* Image Gallery */}
                        <div className="relative md:rounded-[40px] overflow-hidden bg-slate-200 dark:bg-slate-900 group shadow-2xl shadow-slate-200/50 dark:shadow-none mb-6 md:mb-10">
                            {images.length > 0 ? (
                                <>
                                    <motion.img 
                                        key={activeImage}
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        src={images[activeImage]} 
                                        className="w-full aspect-[4/3] object-cover" 
                                    />
                                    <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-3 px-4 py-3 bg-black/20 backdrop-blur-md rounded-full border border-white/20">
                                        {images.map((_, idx) => (
                                            <button 
                                                key={idx} 
                                                onClick={() => setActiveImage(idx)}
                                                className={`size-2.5 rounded-full transition-all ${activeImage === idx ? 'bg-primary w-6' : 'bg-white/60 hover:bg-white'}`}
                                            />
                                        ))}
                                    </div>
                                </>
                            ) : (
                                <div className="aspect-[4/3] flex items-center justify-center text-slate-400">No Image Available</div>
                            )}
                        </div>

                        {/* Title, Stats & Price */}
                        <div className="mb-8 md:mb-10 px-4 md:px-0 flex flex-col md:flex-row md:justify-between md:items-center gap-6">
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
                                    <span className="flex items-center gap-1.5 break-all md:break-normal"><MapPin size={18} className="text-primary shrink-0" /> {property.addressDetails ? `${property.addressDetails}, ` : ''}{property.upazila}, {property.district}</span>
                                    {property.area && <span className="flex items-center gap-1.5"><Maximize size={18} className="shrink-0" /> {property.area} {t('sqft')}</span>}
                                    {property.isVerified && <span className="flex items-center gap-1.5 text-emerald-600"><ShieldCheck size={18} className="text-emerald-600 shrink-0" /> Verified Landlord</span>}
                                    {property.isOnsiteVerified && (
                                        <span className="flex items-center gap-1.5 bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 px-3 py-1 rounded-lg text-xs font-black">
                                            <Shield size={14} className="fill-blue-100 dark:fill-blue-500/20" /> Onsite Verified
                                        </span>
                                    )}
                                </div>
                            </div>
                            
                            {/* Price Tag & Utilities */}
                            <div className="bg-primary/5 p-5 md:p-6 rounded-3xl border border-primary/10 shrink-0 flex flex-col md:items-end">
                                <p className="text-[10px] font-black uppercase tracking-widest text-primary/70 mb-1">{t('rent')}</p>
                                <div className="flex items-baseline gap-2 mb-2">
                                    <span className="text-3xl md:text-4xl font-black text-primary hover:scale-105 transition-transform origin-left md:origin-right">৳{property.rent?.toLocaleString()}</span>
                                    <span className="text-lg font-bold text-slate-500">/{property.billingCycle}</span>
                                </div>
                                <div className="flex items-center gap-2 text-sm font-bold text-slate-600 dark:text-slate-400">
                                    <Zap size={14} className="text-amber-500" />
                                    {property.utilitiesCost ? `+ ৳${property.utilitiesCost?.toLocaleString()} monthly utilities` : 'Utilities included'}
                                </div>
                            </div>
                        </div>

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
                                        className="w-full md:w-auto py-4 px-8 bg-white hover:bg-slate-50 text-primary font-black text-base md:text-lg rounded-2xl shadow-xl shadow-black/10 active:scale-95 transition-all shrink-0 relative z-10 flex items-center justify-center gap-2"
                                    >
                                        <Shield size={20} className="fill-indigo-100" /> Book Now
                                    </button>
                                </div>
                            </div>
                        )}

                        {/* Description */}
                        <section className="bg-white dark:bg-slate-900 p-6 md:p-10 md:rounded-[40px] border-y md:border border-slate-100 dark:border-slate-800 mb-6 md:mb-10">
                            <h2 className="text-xl md:text-2xl font-black mb-4 md:mb-6">{t('description')}</h2>
                            <p className="text-slate-600 dark:text-slate-400 leading-relaxed text-base md:text-lg font-medium whitespace-pre-wrap">
                                {property.description || 'No description provided.'}
                            </p>
                        </section>

                        {/* Features & Amenities */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-10">
                            <section className="bg-white dark:bg-slate-900 p-6 md:p-8 md:rounded-[40px] border-y md:border border-slate-100 dark:border-slate-800">
                                <h3 className="text-lg md:text-xl font-black mb-4 md:mb-6 flex items-center gap-3">
                                    <Zap size={20} className="text-primary md:w-6 md:h-6" /> {t('amenities')}
                                </h3>
                                <div className="grid grid-cols-1 gap-4">
                                    {property.features?.length > 0 ? property.features.map(f => (
                                        <div key={f} className="flex items-center gap-3 text-slate-600 dark:text-slate-300 font-bold text-sm">
                                            <div className="size-6 rounded-lg bg-primary/10 flex items-center justify-center text-primary shrink-0"><CheckCircle2 size={14} /></div>
                                            {f}
                                        </div>
                                    )) : <div className="text-sm text-slate-400">None specified</div>}
                                </div>
                            </section>
                            <section className="bg-white dark:bg-slate-900 p-6 md:p-8 md:rounded-[40px] border-y md:border border-slate-100 dark:border-slate-800">
                                <h3 className="text-lg md:text-xl font-black mb-4 md:mb-6 flex items-center gap-3">
                                    <Info size={20} className="text-primary md:w-6 md:h-6" /> {t('inclusions')}
                                </h3>
                                <div className="grid grid-cols-1 gap-4">
                                    {property.utilities?.length > 0 ? property.utilities.map(u => (
                                        <div key={u} className="flex items-center gap-3 text-slate-600 dark:text-slate-300 font-bold text-sm">
                                            <div className="size-6 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-500 shrink-0"><CheckCircle2 size={14} /></div>
                                            {u}
                                        </div>
                                    )) : <div className="text-sm text-slate-400">None specified</div>}
                                </div>
                            </section>
                        </div>
                    </div>

                    {/* Right: Sidebar (Sticky) */}
                    <div className="lg:w-[400px] px-4 md:px-0">
                        <div className="sticky top-28 space-y-6">
                            {/* Desktop Action Card (Hidden on Mobile) */}
                            {!isOwner ? (
                                <div className="hidden lg:block bg-white dark:bg-slate-900 p-8 rounded-[40px] border border-slate-100 dark:border-slate-800 shadow-sm relative overflow-hidden">
                                    <h3 className="text-xs font-black uppercase tracking-widest text-slate-400 mb-6 text-center">{t('interested')}</h3>
                                    
                                    {property.status !== 'Let Agreed' && property.status !== 'Booked' ? (
                                        <>
                                            <button 
                                                onClick={() => !requestSent && setIsModalOpen(true)}
                                                disabled={requestSent || requestSending}
                                                className={`w-full py-5 rounded-2xl font-black text-lg transition-all shadow-xl mb-4 ${requestSent ? 'bg-emerald-500 text-white' : 'bg-primary text-white hover:scale-[1.02] active:scale-95'}`}
                                            >
                                                {requestSending ? 'Sending...' : requestSent ? 'Request Sent' : t('request_viewing')}
                                            </button>
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
                                    <h3 className="text-sm font-black uppercase tracking-widest text-primary mb-2">Your Property</h3>
                                    <p className="text-slate-600 dark:text-slate-400 text-sm font-medium">You are viewing your own listing.</p>
                                </div>
                            ) }

                            {/* Owner Card */}
                            <div className="bg-white dark:bg-slate-900 p-6 md:p-8 rounded-3xl md:rounded-[40px] border border-slate-100 dark:border-slate-800 shadow-sm">
                                <h3 className="text-xs font-black uppercase tracking-widest text-slate-400 mb-6">{t('owner_contact')}</h3>
                                <Link to={`/owner/${property.ownerId || property.userId}`} className="flex items-center gap-4 group cursor-pointer">
                                    <div className="size-16 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-primary shadow-inner group-hover:bg-primary group-hover:text-white transition-colors">
                                        <User size={32} />
                                    </div>
                                    <div className="flex-1">
                                        <p className="text-lg font-black text-slate-900 dark:text-white leading-none mb-1 group-hover:text-primary transition-colors">{owner?.name || 'Owner / Agent'}</p>
                                        <p className="text-sm font-bold text-slate-500">Tap to view profile &amp; ads &gt;</p>
                                    </div>
                                </Link>
                            </div>

                            {/* Scam protection removed per request */}
                            
                            {/* Report Ad Option */}
                            <div className="pt-4 border-t border-slate-100 dark:border-slate-800">
                                <Link 
                                    to={`/report-property/${id}`} 
                                    state={{ property }}
                                    className="flex items-center justify-center gap-2 text-slate-400 hover:text-rose-500 font-bold text-sm transition-colors py-2 group"
                                >
                                    <Flag size={16} className="group-hover:fill-rose-500" /> Report this ad
                                </Link>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Dynamic Bottom Action Bar (Scroll flow) */}
                {!isOwner && (
                    <div className="mt-10 pt-8 border-t border-slate-200 dark:border-slate-800 px-4">
                        <h3 className="text-xl font-black mb-6 text-slate-900 dark:text-white text-center">{t('interested')}</h3>
                        
                        {property.status !== 'Let Agreed' && property.status !== 'Booked' ? (
                            <div className="flex flex-col sm:flex-row items-center gap-4">
                                <button 
                                    onClick={() => !requestSent && setIsModalOpen(true)}
                                    disabled={requestSent || requestSending}
                                    className={`w-full flex justify-center items-center h-14 rounded-2xl font-black text-lg transition-all shadow-xl ${requestSent ? 'bg-emerald-500 text-white' : 'bg-primary text-white active:scale-95'}`}
                                >
                                    {requestSending ? 'Sending...' : requestSent ? 'Request Sent' : t('request_viewing')}
                                </button>
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
                                    className="w-full h-14 rounded-2xl bg-slate-200 dark:bg-slate-800 text-slate-800 dark:text-slate-200 font-bold hover:bg-slate-300 transition-colors flex items-center justify-center gap-3"
                                >
                                    <Phone size={20} /> {t('call_owner')}
                                </button>
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
                            <Link 
                                to={`/report-property/${id}`} 
                                state={{ property }}
                                className="flex items-center gap-2 text-slate-400 hover:text-rose-500 font-bold text-sm transition-colors py-4 px-8"
                            >
                                <Flag size={16} /> Report this ad
                            </Link>
                        </div>
                    </div>
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
