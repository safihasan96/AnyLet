import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { collection, query, onSnapshot, deleteDoc, doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../contexts/AuthContext';
import { ArrowLeft, MoreHorizontal, MapPin, ChevronRight, Home as HomeIcon, Trash2, RefreshCcw, Info, RefreshCw, Shield, CheckCircle2 } from 'lucide-react';
import ConfirmationModal from '../components/ConfirmationModal';
import PaymentModal from '../components/PaymentModal';
import { sendListingExpiryEmail } from '../utils/emailService';
import { useToast } from '../contexts/ToastContext';
import { motion } from 'framer-motion';

export default function MyListings() {
    const { currentUser: user } = useAuth();
    const navigate = useNavigate();
    const toast = useToast();

    const [listings, setListings] = useState([]);
    const [loading, setLoading] = useState(true);
    
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

        const listingsQuery = query(collection(db, 'properties'));
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
                .filter(item => (
                    item.ownerId === user.uid ||
                    item.landlordId === user.uid ||
                    item.userId === user.uid ||
                    item.creatorId === user.uid
                ))
                .sort((a, b) => {
                    const timeA = a.createdAt?.seconds ? a.createdAt.seconds * 1000 : new Date(a.createdAt).getTime();
                    const timeB = b.createdAt?.seconds ? b.createdAt.seconds * 1000 : new Date(b.createdAt).getTime();
                    return timeB - timeA;
                });
            setListings(userListings);
            setLoading(false);
        });

        return () => unsubscribe();
    }, [user, navigate]);

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
                        console.error('Failed to handle expiry for property', item.id, err);
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
            console.error("Error deleting property:", error);
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
            console.error('Error updating status:', error);
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
            console.error('Error refreshing listing:', error);
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
            console.error('Error requesting verification:', error);
            toast.error('Failed to request verification.');
        }
    };

    return (
        <div className="flex flex-col min-h-screen bg-[#f8fafc] dark:bg-slate-950 pb-28">
            <header className="flex items-center px-6 pt-10 pb-6 sticky top-0 bg-[#f8fafc]/95 dark:bg-slate-950/95 backdrop-blur-md z-20 border-b border-slate-100 dark:border-slate-800/50">
                <button onClick={() => navigate(-1)} className="p-2 -ml-2 text-slate-800 dark:text-white hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors">
                    <ArrowLeft size={24} strokeWidth={2.5} />
                </button>
                <h1 className="flex-1 text-center text-[20px] font-[900] text-slate-900 dark:text-white tracking-tight">My Listings</h1>
                <button className="p-2 -mr-2 text-slate-800 dark:text-white hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors">
                    <MoreHorizontal size={24} strokeWidth={2.5} />
                </button>
            </header>

            <main className="flex-1 px-6 pt-6">
                {loading ? (
                    <div className="flex flex-col gap-5">
                        {[1, 2, 3].map(n => <div key={n} className="animate-pulse h-[110px] w-full rounded-[24px] bg-[#e2e8f0] dark:bg-slate-800" />)}
                    </div>
                ) : listings.length > 0 ? (
                    <div className="flex flex-col gap-4">
                        {listings.map(property => (
                                <ListingCard 
                                    key={property.id} 
                                    property={property} 
                                    onClick={() => navigate(`/property/${property.id}`)} 
                                    onDelete={(e) => {
                                        e.stopPropagation();
                                        setDeleteModal({ isOpen: true, id: property.id, title: property.title });
                                    }}
                                    onStatusChange={(newStatus) => {
                                        setStatusModal({ isOpen: true, id: property.id, title: property.title, newStatus });
                                    }}
                                    onRefresh={(e) => {
                                        e.stopPropagation();
                                        setBumpModal({ isOpen: true, id: property.id, title: property.title });
                                    }}
                                    onVerify={(e) => {
                                        e.stopPropagation();
                                        setVerifyModal({ isOpen: true, id: property.id, title: property.title });
                                    }}
                                />
                        ))}
                    </div>
                ) : (
                    <div className="py-20 flex flex-col items-center justify-center text-center px-4">
                        <div className="size-20 bg-[#e0e7ff] dark:bg-slate-800 rounded-full flex items-center justify-center text-[#3730a3] dark:text-indigo-400 mb-6 relative">
                            <HomeIcon size={32} strokeWidth={2.5} />
                            <div className="absolute -top-1 -right-1 size-6 bg-[#3730a3] text-white rounded-full flex items-center justify-center text-[10px] font-bold border-2 border-[#f8fafc] dark:border-slate-950">
                                0
                            </div>
                        </div>
                        <h3 className="text-[19px] font-[900] text-slate-900 dark:text-white mb-2">No Properties Listed</h3>
                        <p className="text-[#64748b] text-[15px] font-medium leading-relaxed mb-8 max-w-[280px]">
                            You haven't added any properties yet. Post your first ad to get started.
                        </p>
                        <button
                            onClick={() => navigate('/post-ad')}
                            className="bg-[#3730a3] text-white font-[800] text-[15px] py-4 px-8 rounded-full shadow-lg shadow-[#3730a3]/20 transition-transform active:scale-95"
                        >
                            Post New Ad
                        </button>
                    </div>
                )}
            </main>

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
                confirmColor="#3730a3"
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
                amount={199}
                title="Onsite Verification"
                subtitle={`Verify: ${verifyModal.title}`}
                breakdownItems={[
                    { label: 'Agent Visit & Verification Fee', amount: 199 },
                ]}
                propertyId={verifyModal.id}
                propertyName={verifyModal.title}
                onPaymentSubmitted={handleVerificationPaymentSubmitted}
            />
        </div>
    );
}

function ListingCard({ property, onClick, onDelete, onStatusChange, onRefresh, onVerify }) {
    const { title, rent, area, district, upazila, image, status, createdAt, updatedAt } = property;

    const displayRent = rent || property.price || 0;
    const displayImage = image || 'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=800&q=80';
    const displayLocation = upazila || area || district || 'City Area';
    const currentStatus = status || 'Available';

    const formatDaysAgo = (timestamp) => {
        if (!timestamp) return '';
        try {
            const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
            const diffInDays = Math.floor((new Date() - date) / (1000 * 60 * 60 * 24));
            return diffInDays === 0 ? 'Today' : `${diffInDays}d ago`;
        } catch {
            return '';
        }
    };

    const isAvailable = currentStatus === 'Available';
    const isNegotiating = currentStatus === 'Under Negotiation';
    const isLetAgreed = currentStatus === 'Let Agreed';
    const isBooked = currentStatus === 'Booked';

    const statusDotColor = isAvailable ? 'bg-emerald-500' : isNegotiating ? 'bg-amber-500' : isBooked ? 'bg-blue-500' : 'bg-rose-500';

    return (
        <div className="w-full bg-white dark:bg-slate-900 rounded-[28px] overflow-hidden shadow-sm border border-slate-100 dark:border-slate-800/80 transition-all hover:shadow-xl hover:shadow-[#3730a3]/5 p-4 flex flex-col gap-4">
            <div 
                onClick={onClick} 
                className="group flex gap-4 text-left cursor-pointer active:scale-[0.98] transition-transform"
            >
                <div className="size-[88px] shrink-0 overflow-hidden rounded-[20px] relative">
                    <img className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" src={displayImage} alt={title || 'Listing'} />
                </div>

                <div className="flex-1 min-w-0 flex flex-col justify-center">
                    <div className="flex items-center gap-2 mb-1">
                        <div className={`w-2 h-2 rounded-full ${statusDotColor} shrink-0`} />
                        <h4 className="font-[800] text-[16px] text-slate-900 dark:text-white leading-tight truncate">
                            {title || 'Property Title'}
                        </h4>
                    </div>

                    <div className="flex items-center gap-1.5 text-[#64748b] dark:text-slate-400 text-[13px] mb-2 truncate">
                        <MapPin size={14} className="shrink-0" strokeWidth={2.5} />
                        <span className="font-[600] truncate">{displayLocation}</span>
                    </div>

                    <div className="flex items-baseline gap-1">
                        <span className="font-[900] text-[17px] text-[#3730a3] dark:text-indigo-400">
                            ৳{displayRent.toLocaleString()}
                        </span>
                        <span className="text-[12px] font-bold text-[#64748b] dark:text-slate-400">
                            / month
                        </span>
                    </div>
                </div>

                <div className="flex flex-col items-end gap-1">
                    <button 
                        onClick={onDelete}
                        className="p-2.5 text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-500/10 rounded-xl transition-all mb-auto"
                    >
                        <Trash2 size={18} strokeWidth={2.5} />
                    </button>
                </div>
            </div>

            <div className="flex justify-between items-center px-1 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                <span>Listed: {formatDaysAgo(createdAt)}</span>
                <span>Updated: {formatDaysAgo(updatedAt || createdAt)}</span>
            </div>
            
            {/* Management Row */}
            <div className="flex flex-col sm:flex-row gap-3 border-t border-slate-100 dark:border-slate-800 pt-3">
                <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-xl flex-1 overflow-x-auto">
                    <button 
                        onClick={() => !isAvailable && onStatusChange('Available')}
                        className={`flex-1 min-w-fit whitespace-nowrap py-1.5 px-2 rounded-lg text-[11px] font-bold transition-colors ${isAvailable ? 'bg-white dark:bg-slate-700 text-emerald-600 shadow-sm' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}
                    >
                        Available
                    </button>
                    <button 
                        onClick={() => !isNegotiating && onStatusChange('Under Negotiation')}
                        className={`flex-1 min-w-fit whitespace-nowrap py-1.5 px-2 rounded-lg text-[11px] font-bold transition-colors ${isNegotiating ? 'bg-white dark:bg-slate-700 text-amber-600 shadow-sm' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}
                    >
                        Negotiating
                    </button>
                    <button 
                        onClick={() => !isBooked && onStatusChange('Booked')}
                        className={`flex-1 min-w-fit whitespace-nowrap py-1.5 px-2 rounded-lg text-[11px] font-bold transition-colors ${isBooked ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-sm' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}
                    >
                        Booked
                    </button>
                    <button 
                        onClick={() => !isLetAgreed && onStatusChange('Let Agreed')}
                        className={`flex-1 min-w-fit whitespace-nowrap py-1.5 px-2 rounded-lg text-[11px] font-bold transition-colors ${isLetAgreed ? 'bg-white dark:bg-slate-700 text-rose-600 shadow-sm' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}
                    >
                        Let Agreed
                    </button>
                </div>
                
                <motion.button 
                    whileTap={{ scale: 0.95 }}
                    onClick={onRefresh}
                    className="flex items-center justify-center gap-1.5 text-primary dark:text-indigo-400 bg-primary/10 hover:bg-primary/20 text-xs font-bold py-2 px-4 rounded-xl transition-colors shrink-0"
                >
                    <RefreshCcw size={14} /> Bump
                </motion.button>
                
                {property.verificationStatus === 'verified' || property.isOnsiteVerified ? (
                    <div className="flex items-center justify-center gap-1.5 text-emerald-600 bg-emerald-50 dark:bg-emerald-500/10 text-xs font-bold py-2 px-4 rounded-xl shrink-0">
                        <CheckCircle2 size={14} /> Verified
                    </div>
                ) : property.verificationStatus === 'pending' ? (
                    <div className="flex items-center justify-center gap-1.5 text-amber-600 bg-amber-50 dark:bg-amber-500/10 text-xs font-bold py-2 px-4 rounded-xl shrink-0">
                        <RefreshCw size={14} className="animate-spin" /> Pending
                    </div>
                ) : (
                    <motion.button 
                        whileTap={{ scale: 0.95 }}
                        onClick={onVerify}
                        className="flex items-center justify-center gap-1.5 text-white bg-gradient-to-r from-primary to-indigo-900 text-xs font-bold py-2 px-4 rounded-xl transition-all shadow-lg shadow-primary/20 shrink-0"
                    >
                        <Shield size={14} className="fill-indigo-300" /> Get Verified
                    </motion.button>
                )}
            </div>
        </div>
    );
}
