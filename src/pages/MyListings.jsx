import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { collection, query, where, onSnapshot, deleteDoc, doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../contexts/AuthContext';
import { ArrowLeft, MoreHorizontal, MapPin, ChevronRight, Home as HomeIcon, Trash2, RefreshCcw, Info, RefreshCw, Shield, CheckCircle2, Search, SlidersHorizontal, Eye, Edit, Activity, DoorOpen } from 'lucide-react';
import { Skeleton } from '../components/Skeleton';
import ConfirmationModal from '../components/ConfirmationModal';
import PaymentModal from '../components/PaymentModal';
import { sendListingExpiryEmail } from '../utils/emailService';
import { useToast } from '../contexts/ToastContext';
import { motion, AnimatePresence, useAnimation, useMotionValue } from 'framer-motion';
import logger from '../utils/logger';
import { useFees } from '../hooks/useFees';

export default function MyListings() {
    const { currentUser: user } = useAuth();
    const navigate = useNavigate();
    const toast = useToast();
    const { fees } = useFees();

    const [listings, setListings] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [activeFilter, setActiveFilter] = useState('All'); // All, Active, Pending, Drafts

    // Bottom sheet state
    const [bottomSheet, setBottomSheet] = useState({ isOpen: false, property: null });

    // Modal states
    const [deleteModal, setDeleteModal] = useState({ isOpen: false, id: null, title: '' });
    const [isDeleting, setIsDeleting] = useState(false);

    const [statusModal, setStatusModal] = useState({ isOpen: false, id: null, title: '', newStatus: '' });
    const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);

    const [bumpModal, setBumpModal] = useState({ isOpen: false, id: null, title: '' });
    const [isBumping, setIsBumping] = useState(false);

    const [verifyModal, setVerifyModal] = useState({ isOpen: false, id: null, title: '' });

    useEffect(() => {
        if (!user) {
            navigate('/login');
            return;
        }

        const listingsQuery = query(
            collection(db, 'properties'),
            where('ownerId', '==', user.uid)
        );
        const unsubscribe = onSnapshot(listingsQuery, (snapshot) => {
            const userListings = snapshot.docs
                .map(doc => {
                    const data = doc.data();
                    return {
                        id: doc.id,
                        ...data,
                        image: data.image || data.imageUrl || (data.images && data.images[0])
                    };
                })
                .sort((a, b) => {
                    const timeA = a.createdAt?.seconds ? a.createdAt.seconds * 1000 : new Date(a.createdAt).getTime();
                    const timeB = b.createdAt?.seconds ? b.createdAt.seconds * 1000 : new Date(b.createdAt).getTime();
                    return timeB - timeA;
                });
            setListings(userListings);
            setLoading(false);
        }, (error) => {
            logger.error('Error fetching listings:', error);
            toast.error('Failed to load listings.');
            setLoading(false);
        });

        return () => unsubscribe();
    }, [user, navigate, toast]);

    useEffect(() => {
        if (!listings.length || !user) return;
        
        const checkExpiries = async () => {
            const yearAgo = new Date();
            yearAgo.setDate(yearAgo.getDate() - 365);
            
            for (const item of listings) {
                if (item.expiryEmailSent) continue;
                
                const propDate = item.updatedAt?.toDate() || item.createdAt?.toDate() || new Date(0);
                if (propDate < yearAgo) {
                    try {
                        await sendListingExpiryEmail(user.email, user.displayName || 'Landlord', item.title);
                        await updateDoc(doc(db, 'properties', item.id), { expiryEmailSent: true });
                    } catch (err) {
                        logger.error('Failed to handle expiry for property', item.id, err);
                    }
                }
            }
        };
        checkExpiries();
    }, [listings, user]);

    const confirmDelete = async () => {
        if (!deleteModal.id) return;
        setIsDeleting(true);
        try {
            await deleteDoc(doc(db, 'properties', deleteModal.id));
            setDeleteModal({ isOpen: false, id: null, title: '' });
            toast.success(`Listing deleted`);
        } catch (error) {
            logger.error("Error deleting property:", error);
            toast.error("Failed to delete property. Please try again.");
        } finally {
            setIsDeleting(false);
        }
    };

    const confirmStatusChange = async () => {
        if (!statusModal.id) return;
        setIsUpdatingStatus(true);
        try {
            await updateDoc(doc(db, 'properties', statusModal.id), {
                status: statusModal.newStatus,
                updatedAt: serverTimestamp(),
                expiryEmailSent: false
            });
            setStatusModal({ isOpen: false, id: null, title: '', newStatus: '' });
            toast.success(`Status updated to ${statusModal.newStatus}`);
        } catch (error) {
            logger.error('Error updating status:', error);
            toast.error('Failed to update status.');
        } finally {
            setIsUpdatingStatus(false);
        }
    };

    const confirmBump = async () => {
        if (!bumpModal.id) return;
        setIsBumping(true);
        try {
            await updateDoc(doc(db, 'properties', bumpModal.id), {
                updatedAt: serverTimestamp(),
                expiryEmailSent: false
            });
            setBumpModal({ isOpen: false, id: null, title: '' });
            toast.success('Listing bumped successfully!');
        } catch (error) {
            logger.error('Error refreshing listing:', error);
            toast.error('Failed to refresh listing.');
        } finally {
            setIsBumping(false);
        }
    };

    const handleVerificationPaymentSubmitted = async (paymentDocId) => {
        if (!verifyModal.id) return;
        try {
            await updateDoc(doc(db, 'properties', verifyModal.id), {
                verificationPaymentId: paymentDocId,
                verificationStatus: 'pending',
            });
            toast.success('Verification requested! Our agent will contact you soon.');
            setVerifyModal({ isOpen: false, id: null, title: '' });
        } catch (error) {
            logger.error('Error requesting verification:', error);
            toast.error('Failed to request verification.');
        }
    };

    // Filter and search logic
    const filteredListings = listings.filter(item => {
        const matchesSearch = (item.title || '').toLowerCase().includes(searchQuery.toLowerCase()) || 
                              (item.area || item.upazila || item.district || '').toLowerCase().includes(searchQuery.toLowerCase());
        
        if (!matchesSearch) return false;
        
        // 'draft' and 'pending_payment' are true drafts (incomplete, no payment)
        const isDraftType = item.status === 'draft' || item.status === 'pending_payment';
        // 'Pending' = paid, awaiting admin approval
        const isPendingApproval = !isDraftType && (item.status === 'Pending' || (!item.isApproved && item.status !== 'draft' && item.status !== 'pending_payment'));
        // Active = approved and Available
        const isActive = item.isApproved && item.status === 'Available';
        // Rejected
        const isRejected = item.isRejected === true;
        
        if (activeFilter === 'Drafts') return isDraftType;
        if (activeFilter === 'Pending') return isPendingApproval;
        if (activeFilter === 'Active') return isActive;
        if (activeFilter === 'Rejected') return isRejected;
        // 'All' shows everything except raw drafts
        if (activeFilter === 'All') return !isDraftType;
        return true;
    });

    const metrics = {
        total: listings.filter(l => l.status !== 'draft' && l.status !== 'pending_payment').length,
        active: listings.filter(l => l.isApproved && l.status === 'Available').length,
        pending: listings.filter(l => !l.isApproved && l.status !== 'draft' && l.status !== 'pending_payment').length,
        drafts: listings.filter(l => l.status === 'draft' || l.status === 'pending_payment').length,
        rejected: listings.filter(l => l.isRejected === true).length,
    };

    const handleActionClick = (property) => {
        setBottomSheet({ isOpen: true, property });
    };

    return (
        <div className="flex flex-col min-h-screen pb-28 bg-[#F8F9FA] dark:bg-[#0F1117]">
            {/* Header */}
            <header className="sticky top-14 z-20 flex flex-col px-5 pt-4 pb-4 bg-[#F8F9FA]/90 dark:bg-[#0F1117]/90 backdrop-blur-md border-b border-slate-200/50 dark:border-slate-800/50">
                <div className="flex items-center justify-end mb-4">
                    <button className="p-2 -mr-2 rounded-full hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors">
                        <MoreHorizontal size={24} className="text-slate-900 dark:text-white" strokeWidth={2.5} />
                    </button>
                </div>
                <div>
                    <h1 className="text-[28px] font-black tracking-tight text-slate-900 dark:text-white leading-[1.2]">
                        Manage<br />Listings
                    </h1>
                </div>
            </header>

            <main className="flex-1 px-5 pt-4">
                {/* Metrics */}
                <div className="flex gap-3 overflow-x-auto pb-2 mb-4 scrollbar-hide no-scrollbar">
                    <MetricCard title="Total Listings" count={metrics.total} bg="bg-primary/10 dark:bg-indigo-500/10" color="text-primary dark:text-indigo-400" />
                    <MetricCard title="Active" count={metrics.active} bg="bg-blue-50 dark:bg-blue-500/10" color="text-blue-600 dark:text-blue-400" />
                    <MetricCard title="Drafts" count={metrics.drafts} bg="bg-amber-50 dark:bg-amber-500/10" color="text-amber-600 dark:text-amber-400" border="border-amber-200 dark:border-amber-800" />
                </div>

                {/* Search Bar */}
                <div className="flex gap-2 mb-6">
                    <div className="relative flex-1">
                        <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input
                            type="text"
                            placeholder="Search properties..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-11 pr-4 py-3.5 rounded-[16px] text-[15px] font-medium outline-none transition-shadow bg-white dark:bg-[#1A1D24] text-slate-900 dark:text-white border border-slate-200 dark:border-slate-800 shadow-sm"
                        />
                    </div>
                    <button className="flex items-center justify-center w-14 rounded-[16px] transition-colors active:scale-95 bg-primary text-white hover:bg-primary/90">
                        <SlidersHorizontal size={20} />
                    </button>
                </div>

                {/* Filter Chips */}
                <div className="flex gap-2 mb-6 overflow-x-auto pb-1 no-scrollbar">
                    {['All', 'Active', 'Pending', 'Rejected', 'Drafts'].map(filter => (
                        <button
                            key={filter}
                            onClick={() => setActiveFilter(filter)}
                            className={`px-5 py-2 rounded-full text-[14px] font-semibold whitespace-nowrap transition-all ${
                                activeFilter === filter 
                                    ? 'bg-primary text-white shadow-md'
                                    : 'bg-white dark:bg-[#1A1D24] text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-800'
                            }`}
                        >
                            {filter === 'Drafts' && metrics.drafts > 0 ? `Drafts (${metrics.drafts})` :
                             filter === 'Pending' && metrics.pending > 0 ? `Pending (${metrics.pending})` :
                             filter === 'Rejected' && metrics.rejected > 0 ? `Rejected (${metrics.rejected})` :
                             filter}
                        </button>
                    ))}
                </div>

                {/* Listings */}
                {loading ? (
                    <div className="flex flex-col gap-4">
                        {[1, 2, 3].map(n => <Skeleton key={n} className="h-[140px] w-full rounded-[20px]" />)}
                    </div>
                ) : filteredListings.length > 0 ? (
                    <div className="flex flex-col gap-4">
                        {filteredListings.map((property, i) => (
                            <motion.div
                                key={property.id}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: i * 0.05, duration: 0.3 }}
                            >
                                <ListingCard 
                                    property={property} 
                                    onClick={() => {
                                        if (property.status === 'draft') {
                                            navigate(`/post-ad?draftId=${property.id}&step=2`);
                                        } else if (property.status === 'pending_payment') {
                                            navigate(`/post-ad?draftId=${property.id}&step=3`);
                                        } else {
                                            navigate(`/property/${property.id}`);
                                        }
                                    }}
                                    onActionClick={(e) => {
                                        e.stopPropagation();
                                        handleActionClick(property);
                                    }}
                                    onDeleteRequest={() => {
                                        setDeleteModal({ isOpen: true, id: property.id, title: property.title });
                                    }}
                                />
                            </motion.div>
                        ))}
                    </div>
                ) : (
                    <div className="py-20 flex flex-col items-center justify-center text-center px-4">
                        <div className="w-20 h-20 rounded-full flex items-center justify-center mb-6 bg-primary/10 dark:bg-primary/20">
                            <HomeIcon size={32} className="text-primary dark:text-indigo-400" strokeWidth={2.5} />
                        </div>
                        <h3 className="text-[19px] font-black text-slate-900 dark:text-white mb-2">No Properties Found</h3>
                        <p className="text-[15px] font-medium leading-relaxed mb-8 max-w-[280px] text-slate-500">
                            {searchQuery || activeFilter !== 'All' 
                                ? "Try adjusting your search or filters." 
                                : "You haven't added any properties yet. Post your first ad to get started."}
                        </p>
                        {!searchQuery && activeFilter === 'All' && (
                            <button
                                onClick={() => navigate('/post-ad')}
                                className="font-black text-[15px] py-4 px-8 rounded-full shadow-xl shadow-primary/20 transition-transform active:scale-95 bg-primary text-white"
                            >
                                Post New Ad
                            </button>
                        )}
                    </div>
                )}
            </main>

            {/* Bottom Sheet Action Drawer */}
            <AnimatePresence>
                {bottomSheet.isOpen && bottomSheet.property && (
                    <>
                        <motion.div 
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setBottomSheet({ isOpen: false, property: null })}
                            className="fixed inset-0 z-40"
                            style={{ background: 'rgba(11,28,48,0.4)', backdropFilter: 'blur(4px)', WebkitBackdropFilter: 'blur(4px)' }}
                        />
                        <motion.div
                            initial={{ y: '100%' }}
                            animate={{ y: 0 }}
                            exit={{ y: '100%' }}
                            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                            className="fixed bottom-0 left-0 right-0 z-50 rounded-t-[32px] p-6 pb-10 bg-white dark:bg-[#1A1D24] shadow-[0_-10px_40px_rgba(0,0,0,0.1)] dark:shadow-[0_-10px_40px_rgba(0,0,0,0.3)]"
                        >
                            <div className="w-12 h-1.5 rounded-full mx-auto mb-6 bg-slate-200 dark:bg-slate-700" />
                            
                            <h3 className="text-[18px] font-black text-slate-900 dark:text-white mb-6 truncate">
                                {bottomSheet.property.title}
                            </h3>

                            <div className="flex flex-col gap-2">
                                <ActionItem 
                                    icon={<Eye size={20} />} 
                                    label="View Listing" 
                                    onClick={() => {
                                        navigate(`/property/${bottomSheet.property.id}`);
                                        setBottomSheet({ isOpen: false, property: null });
                                    }} 
                                />
                                <ActionItem 
                                    icon={<Edit size={20} />} 
                                    label="Edit Details" 
                                    onClick={() => {
                                        navigate(`/edit-property/${bottomSheet.property.id}`);
                                        setBottomSheet({ isOpen: false, property: null });
                                    }} 
                                />
                                <ActionItem 
                                    icon={<Activity size={20} />} 
                                    label="Change Status" 
                                    onClick={() => {
                                        const newStatus = bottomSheet.property.status === 'Available' ? 'Under Negotiation' : 'Available';
                                        setStatusModal({ isOpen: true, id: bottomSheet.property.id, title: bottomSheet.property.title, newStatus });
                                        setBottomSheet({ isOpen: false, property: null });
                                    }} 
                                />
                                <ActionItem 
                                    icon={<RefreshCcw size={20} />} 
                                    label="Bump Listing (Refresh Date)" 
                                    onClick={() => {
                                        setBumpModal({ isOpen: true, id: bottomSheet.property.id, title: bottomSheet.property.title });
                                        setBottomSheet({ isOpen: false, property: null });
                                    }} 
                                />
                                {(!bottomSheet.property.verificationStatus || bottomSheet.property.verificationStatus === 'unverified') && (
                                    <ActionItem 
                                        icon={<Shield size={20} />} 
                                        label="Request Verification" 
                                        onClick={() => {
                                            setVerifyModal({ isOpen: true, id: bottomSheet.property.id, title: bottomSheet.property.title });
                                            setBottomSheet({ isOpen: false, property: null });
                                        }} 
                                    />
                                )}
                                <div className="h-[1px] w-full my-2 bg-slate-100 dark:bg-slate-800" />
                                <ActionItem 
                                    icon={<Trash2 size={20} />} 
                                    label="Delete Listing" 
                                    danger 
                                    onClick={() => {
                                        setDeleteModal({ isOpen: true, id: bottomSheet.property.id, title: bottomSheet.property.title });
                                        setBottomSheet({ isOpen: false, property: null });
                                    }} 
                                />
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>

            {/* Modals */}
            <ConfirmationModal
                isOpen={deleteModal.isOpen}
                title="Delete Listing?"
                message={`Are you sure you want to delete "${deleteModal.title}"? This action cannot be undone.`}
                confirmText="Delete"
                confirmColor="#ef4444"
                icon={Trash2}
                variant="danger"
                isLoading={isDeleting}
                onConfirm={confirmDelete}
                onCancel={() => setDeleteModal({ isOpen: false, id: null, title: '' })}
            />

            <ConfirmationModal
                isOpen={statusModal.isOpen}
                title="Change Status?"
                message={`Change the status of "${statusModal.title}" to ${statusModal.newStatus}?`}
                confirmText="Update Status"
                confirmColor="#14147c"
                icon={Info}
                variant="info"
                isLoading={isUpdatingStatus}
                onConfirm={confirmStatusChange}
                onCancel={() => setStatusModal({ isOpen: false, id: null, title: '', newStatus: '' })}
            />

            <ConfirmationModal
                isOpen={bumpModal.isOpen}
                title="Bump Listing?"
                message={`This will refresh the updated date for "${bumpModal.title}" keeping it active for another 365 days.`}
                confirmText="Bump Listing"
                confirmColor="#10b981"
                icon={RefreshCw}
                variant="success"
                isLoading={isBumping}
                onConfirm={confirmBump}
                onCancel={() => setBumpModal({ isOpen: false, id: null, title: '' })}
            />

            <PaymentModal
                isOpen={verifyModal.isOpen}
                onClose={() => setVerifyModal({ isOpen: false, id: null, title: '' })}
                type="verification_fee"
                bookingType="verification"
                amount={Number(fees?.standaloneVerificationFee?.value) || 199}
                title="Onsite Verification"
                subtitle={`Verify: ${verifyModal.title}`}
                breakdownItems={[
                    { label: 'Agent Visit & Verification Fee', amount: Number(fees?.standaloneVerificationFee?.value) || 199 },
                ]}
                propertyId={verifyModal.id}
                propertyName={verifyModal.title}
                onPaymentSubmitted={handleVerificationPaymentSubmitted}
            />
        </div>
    );
}

function MetricCard({ title, count, color, bg, border }) {
    return (
        <div 
            className={`flex-shrink-0 min-w-[120px] rounded-[20px] p-4 flex flex-col justify-between ${bg} ${border ? `border ${border}` : ''}`}
        >
            <span className={`text-[13px] font-semibold mb-2 ${border ? 'text-slate-500' : color} opacity-80`}>
                {title}
            </span>
            <span className={`text-[28px] font-black tracking-tight ${color}`}>
                {count}
            </span>
        </div>
    );
}

function ActionItem({ icon, label, danger, onClick }) {
    return (
        <button 
            onClick={onClick}
            className={`flex items-center gap-4 w-full p-4 rounded-2xl active:bg-slate-50 dark:active:bg-slate-800 transition-colors ${danger ? 'text-rose-500' : 'text-slate-900 dark:text-white'}`}
        >
            <div className={`flex items-center justify-center w-10 h-10 rounded-full ${danger ? 'bg-rose-50 dark:bg-rose-500/10 text-rose-500' : 'bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-400'}`}>
                {icon}
            </div>
            <span className="text-[16px] font-bold">{label}</span>
        </button>
    );
}

function ListingCard({ property, onClick, onActionClick, onDeleteRequest }) {
    const { title, rent, area, district, upazila, image, status } = property;
    const [copied, setCopied] = useState(false);

    const x = useMotionValue(0);
    const controls = useAnimation();

    const displayRent = rent || property.price || 0;
    const displayImage = image || 'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=800&q=80';
    const displayLocation = upazila || area || district || 'City Area';
    const isDraftType = status === 'draft' || status === 'pending_payment';

    // ── Compute status info with dot color ─────────────────────────────────
    let statusDotColor = '';  // '' means no dot (draft)
    let badgeText = '';
    let badgeBg = '';
    let badgeTextColor = '';

    if (isDraftType) {
        badgeText = status === 'pending_payment' ? 'Pending Payment' : 'Draft';
        badgeBg = 'bg-amber-500/90';
        badgeTextColor = 'text-white';
    } else if (property.isRejected) {
        statusDotColor = 'bg-red-500';   // 🔴 rejected
        badgeText = 'Rejected';
        badgeBg = 'bg-red-500/90';
        badgeTextColor = 'text-white';
    } else if (!property.isApproved) {
        statusDotColor = 'bg-yellow-400'; // 🟡 pending
        badgeText = 'Pending Approval';
        badgeBg = 'bg-yellow-400/90';
        badgeTextColor = 'text-slate-900';
    } else if (property.isApproved && status === 'Available') {
        statusDotColor = 'bg-emerald-500'; // 🟢 active
        badgeText = 'Active';
        badgeBg = 'bg-emerald-500/90';
        badgeTextColor = 'text-white';
    } else {
        statusDotColor = 'bg-slate-400';
        badgeText = status || 'Active';
        badgeBg = 'bg-slate-700/80';
        badgeTextColor = 'text-white';
    }

    const isPendingOrRejected = !isDraftType && (!property.isApproved || property.isRejected);

    const shortId = property.id ? property.id.slice(0, 8).toUpperCase() : '';

    const handleCopyId = (e) => {
        e.stopPropagation();
        navigator.clipboard.writeText(property.id).then(() => {
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        });
    };

    const handleDragEnd = (event, info) => {
        if (info.offset.x < -60) {
            controls.start({ x: -80 });
        } else {
            controls.start({ x: 0 });
        }
    };

    const handleClick = (e) => {
        // If swiped open, close it instead of navigating
        if (x.get() < -10) {
            e.stopPropagation();
            controls.start({ x: 0 });
            return;
        }
        onClick();
    };

    return (
        <div className="relative w-full rounded-[24px] overflow-hidden mb-1">
            {/* Background Delete Button */}
            <div className="absolute right-0 top-0 bottom-0 w-[100px] bg-rose-500 flex items-center justify-end pr-6 rounded-[24px]">
                <button 
                    onClick={(e) => { e.stopPropagation(); controls.start({ x: 0 }); onDeleteRequest(); }} 
                    className="text-white flex flex-col items-center gap-1 active:scale-90 transition-transform"
                >
                    <Trash2 size={24} />
                    <span className="text-[10px] font-black uppercase tracking-wider">Delete</span>
                </button>
            </div>

            {/* Foreground Card */}
            <motion.div 
                drag="x"
                dragConstraints={{ left: -80, right: 0 }}
                dragElastic={0.1}
                onDragEnd={handleDragEnd}
                animate={controls}
                style={{ x }}
                onClick={handleClick}
                className="relative z-10 w-full bg-white dark:bg-[#1A1D24] rounded-[24px] overflow-hidden p-3 flex gap-4 cursor-pointer active:scale-[0.99] transition-transform border border-slate-100 dark:border-slate-800/70 shadow-sm"
            >
                <div className="w-[100px] h-[100px] shrink-0 overflow-hidden rounded-[16px] relative">
                    <img loading="lazy" className="w-full h-full object-cover" src={displayImage} alt={title || 'Listing'} />
                    <div className={`absolute top-2 left-2 flex items-center gap-1 px-2 py-1 rounded-full text-[10px] font-black shadow-sm backdrop-blur-md ${badgeBg} ${badgeTextColor}`}>
                        {statusDotColor && (
                            <span className={`inline-block w-1.5 h-1.5 rounded-full shrink-0 ${statusDotColor}`} />
                        )}
                        {badgeText}
                    </div>
                </div>

                <div className="flex-1 min-w-0 flex flex-col justify-center py-1 relative">
                    {!isDraftType && (
                        <button 
                            onClick={(e) => { e.stopPropagation(); onActionClick(e); }}
                            className="absolute top-0 right-0 p-2 rounded-full hover:bg-slate-50 dark:hover:bg-slate-800 active:scale-90 transition-all z-10 text-slate-500 dark:text-slate-400"
                        >
                            <MoreHorizontal size={20} />
                        </button>
                    )}

                    <h4 className="font-black text-[16px] leading-tight mb-1 truncate pr-8 text-slate-900 dark:text-white">
                        {title || 'Untitled Draft'}
                    </h4>

                    <div className="flex items-center gap-1 mb-2 truncate text-slate-500 dark:text-slate-400">
                        <MapPin size={13} className="shrink-0" />
                        <span className="text-[13px] font-bold truncate">{displayLocation}</span>
                    </div>

                    <div className="flex items-center justify-between mt-auto">
                        <div className="flex items-baseline gap-1">
                            {displayRent > 0 ? (
                                <>
                                    <span className="font-black text-[18px] text-primary dark:text-indigo-400">
                                        ৳{displayRent.toLocaleString()}
                                    </span>
                                    <span className="text-[12px] font-bold text-slate-400 dark:text-slate-500">
                                        / month
                                    </span>
                                </>
                            ) : (
                                <span className="font-black text-[14px] text-amber-500">Draft Incomplete</span>
                            )}
                        </div>

                        {!isDraftType && (
                            <button
                                onClick={handleCopyId}
                                title={copied ? 'Copied!' : `Copy full ID: ${property.id}`}
                                className={`flex items-center gap-1 px-2 py-0.5 rounded-lg transition-all active:scale-90 border ${copied ? 'bg-emerald-50 dark:bg-emerald-500/10 border-emerald-200 dark:border-emerald-500/30 text-emerald-600 dark:text-emerald-400' : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400'}`}
                            >
                                <span className="text-[10px] font-black tracking-widest uppercase font-mono">
                                    {copied ? '✓ Copied' : `#${shortId}`}
                                </span>
                            </button>
                        )}
                        {isDraftType && (
                            <span className="text-[11px] font-black text-primary bg-primary/10 px-3 py-1 rounded-full uppercase tracking-wider">
                                {status === 'draft' ? 'Continue' : 'Pay Now'}
                            </span>
                        )}
                    </div>
                </div>
            </motion.div>
        </div>
    );
}
