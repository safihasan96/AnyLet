import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { collection, query, where, onSnapshot, doc, updateDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../contexts/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Shield, Lock, CheckCircle2, Clock, Home, ChevronRight, AlertTriangle, Banknote, Search } from 'lucide-react';
import PaymentStatusModal from '../components/PaymentStatusModal';
import { useToast } from '../contexts/ToastContext';
import { Helmet } from 'react-helmet-async';
import { createNotification } from '../utils/notificationService';
import logger from '../utils/logger';

const STATUS_MAP = {
    held: { label: 'Deposit Held', color: 'bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400 border-blue-100 dark:border-blue-500/20', icon: Lock },
    released: { label: 'Released', color: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400 border-emerald-100 dark:border-emerald-500/20', icon: CheckCircle2 },
    disputed: { label: 'Disputed', color: 'bg-amber-50 text-amber-600 dark:bg-amber-500/10 dark:text-amber-400 border-amber-100 dark:border-amber-500/20', icon: AlertTriangle },
    refunded: { label: 'Refunded', color: 'bg-slate-50 text-slate-600 dark:bg-slate-800 dark:text-slate-400 border-slate-100 dark:border-slate-700', icon: Banknote },
};

export default function MyBookings() {
    const { currentUser } = useAuth();
    const navigate = useNavigate();
    const toast = useToast();

    const [bookings, setBookings] = useState([]);
    const [loading, setLoading] = useState(true);
    const [confirmModal, setConfirmModal] = useState({ isOpen: false, bookingId: null });
    const [statusModal, setStatusModal] = useState({ isOpen: false, booking: null });
    const [confirming, setConfirming] = useState(false);

    useEffect(() => {
        if (!currentUser) { navigate('/login'); return; }

        const q = query(
            collection(db, 'escrowDeposits'),
            where('tenantId', '==', currentUser.uid)
        );
        const unsub = onSnapshot(q, (snap) => {
            const data = snap.docs.map(d => ({ firestoreId: d.id, ...d.data() }));
            data.sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));
            setBookings(data);
            setLoading(false);
        });
        return () => unsub();
    }, [currentUser, navigate]);

    const handleConfirmMoveIn = async () => {
        if (!confirmModal.bookingId) return;
        setConfirming(true);
        try {
            await updateDoc(doc(db, 'escrowDeposits', confirmModal.bookingId), {
                confirmedByTenant: true,
            });

            const booking = bookings.find(b => b.firestoreId === confirmModal.bookingId);
            if (booking && booking.ownerId) {
                await createNotification(
                    booking.ownerId,
                    'system',
                    'Move-in Confirmed',
                    `Tenant has confirmed move-in for ${booking.propertyName || 'the property'}. Please confirm from your side to release the deposit.`,
                    '/requests'
                );
            }

            toast.success('Move-in confirmed! The deposit will be released once the owner also confirms.');
            setConfirmModal({ isOpen: false, bookingId: null });
        } catch (err) {
            logger.error(err);
            toast.error('Failed to confirm. Please try again.');
        } finally {
            setConfirming(false);
        }
    };

    const formatDate = (ts) => {
        if (!ts) return 'Recently';
        const date = ts.toDate ? ts.toDate() : new Date(ts);
        return new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', year: 'numeric' }).format(date);
    };

    return (
        <div className="flex flex-col min-h-screen bg-[#f8fafc] dark:bg-slate-950 pb-28">
            <Helmet><title>My Bookings | Any-Let</title></Helmet>

            <header className="flex items-center px-6 pt-10 pb-6 sticky top-0 bg-[#f8fafc]/95 dark:bg-slate-950/95 backdrop-blur-md z-20 border-b border-slate-100 dark:border-slate-800/50">
                <button onClick={() => navigate(-1)} className="p-2 -ml-2 text-slate-800 dark:text-white hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors">
                    <ArrowLeft size={24} strokeWidth={2.5} />
                </button>
                <h1 className="flex-1 text-center text-[20px] font-[900] text-slate-900 dark:text-white tracking-tight">My Bookings</h1>
                <div className="w-10" />
            </header>

            <main className="flex-1 px-6 pt-6">
                {loading ? (
                    <div className="flex flex-col gap-4">
                        {[1,2,3].map(n => <div key={n} className="animate-pulse h-[180px] w-full rounded-[28px] bg-slate-200 dark:bg-slate-800" />)}
                    </div>
                ) : bookings.length === 0 ? (
                    <div className="py-20 flex flex-col items-center justify-center text-center px-4">
                        <div className="relative mb-8">
                            <div className="size-24 bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-800 dark:to-slate-700 rounded-[28px] flex items-center justify-center shadow-inner">
                                <Shield size={40} className="text-slate-400 dark:text-slate-500" />
                            </div>
                            <div className="absolute -bottom-2 -right-2 size-10 bg-gradient-to-br from-primary to-indigo-500 rounded-2xl flex items-center justify-center shadow-lg shadow-primary/30">
                                <Lock size={20} className="text-white" />
                            </div>
                        </div>
                        <h3 className="text-[20px] font-[900] text-slate-900 dark:text-white mb-3">No Bookings Yet</h3>
                        <p className="text-[#64748b] text-[15px] font-medium leading-relaxed mb-8 max-w-[280px]">
                            When you book a property with a security deposit, it will appear here. Your money stays safe with Any-Let.
                        </p>
                        <button onClick={() => navigate('/search')} className="bg-primary text-white font-[800] text-[15px] py-4 px-8 rounded-full shadow-lg shadow-primary/20 transition-transform active:scale-95">
                            Browse Properties
                        </button>
                    </div>
                ) : (
                    <div className="flex flex-col gap-4">
                        <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1 mb-2">
                            {bookings.length} {bookings.length === 1 ? 'Booking' : 'Bookings'}
                        </p>
                        <AnimatePresence>
                            {bookings.map((booking, idx) => {
                                const statusInfo = STATUS_MAP[booking.status] || STATUS_MAP.held;
                                const StatusIcon = statusInfo.icon;

                                return (
                                    <motion.div
                                        key={booking.firestoreId}
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: idx * 0.05 }}
                                        className="bg-white dark:bg-slate-900 rounded-[28px] overflow-hidden border border-slate-100 dark:border-slate-800/80 shadow-sm"
                                    >
                                        <div className="p-5">
                                            {/* Header: Property + Status */}
                                            <div className="flex items-start justify-between gap-3 mb-4">
                                                <div className="flex-1 min-w-0">
                                                    <h3 className="font-black text-base text-slate-900 dark:text-white truncate mb-1">
                                                        {booking.propertyName || 'Property'}
                                                    </h3>
                                                    <p className="text-xs text-slate-400 font-bold">
                                                        Booked on {formatDate(booking.createdAt)}
                                                    </p>
                                                </div>
                                                <button 
                                                    onClick={() => setStatusModal({ isOpen: true, booking })}
                                                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest border shrink-0 hover:scale-105 active:scale-95 transition-transform ${statusInfo.color}`}
                                                >
                                                    <StatusIcon size={12} strokeWidth={3} />
                                                    {statusInfo.label}
                                                </button>
                                            </div>

                                            {/* Financial Breakdown */}
                                            <div className="bg-slate-50 dark:bg-slate-800 rounded-2xl p-4 mb-4 space-y-2">
                                                <div className="flex justify-between text-sm">
                                                    <span className="text-slate-500 font-medium">Security Deposit</span>
                                                    <span className="font-black text-slate-900 dark:text-white">৳{booking.depositAmount?.toLocaleString()}</span>
                                                </div>
                                                <div className="flex justify-between text-sm">
                                                    <span className="text-slate-500 font-medium">Service Fee</span>
                                                    <span className="font-black text-slate-900 dark:text-white">৳{booking.serviceFee}</span>
                                                </div>
                                                <div className="border-t border-slate-200 dark:border-slate-700 pt-2 flex justify-between text-sm">
                                                    <span className="font-black text-slate-700 dark:text-slate-300">Total Paid</span>
                                                    <span className="font-black text-primary dark:text-indigo-400 text-base">৳{booking.totalPaid?.toLocaleString()}</span>
                                                </div>
                                            </div>

                                            {/* Confirmation Status */}
                                            {booking.status === 'held' && (
                                                <div className="space-y-3">
                                                    <div className="flex items-center gap-3">
                                                        <div className={`size-6 rounded-full flex items-center justify-center ${booking.confirmedByTenant ? 'bg-emerald-500 text-white' : 'bg-slate-200 dark:bg-slate-700 text-slate-400'}`}>
                                                            <CheckCircle2 size={14} strokeWidth={3} />
                                                        </div>
                                                        <span className={`text-xs font-bold ${booking.confirmedByTenant ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-400'}`}>
                                                            {booking.confirmedByTenant ? 'You confirmed move-in' : 'Your confirmation pending'}
                                                        </span>
                                                    </div>
                                                    <div className="flex items-center gap-3">
                                                        <div className={`size-6 rounded-full flex items-center justify-center ${booking.confirmedByOwner ? 'bg-emerald-500 text-white' : 'bg-slate-200 dark:bg-slate-700 text-slate-400'}`}>
                                                            <CheckCircle2 size={14} strokeWidth={3} />
                                                        </div>
                                                        <span className={`text-xs font-bold ${booking.confirmedByOwner ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-400'}`}>
                                                            {booking.confirmedByOwner ? 'Owner confirmed' : 'Owner confirmation pending'}
                                                        </span>
                                                    </div>

                                                    {!booking.confirmedByTenant && (
                                                        <button
                                                            onClick={() => setConfirmModal({ isOpen: true, bookingId: booking.firestoreId })}
                                                            className="w-full mt-2 py-3.5 bg-emerald-600 text-white font-black text-sm rounded-2xl shadow-lg shadow-emerald-600/20 hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-2"
                                                        >
                                                            <CheckCircle2 size={16} /> Confirm Move-In
                                                        </button>
                                                    )}
                                                </div>
                                            )}

                                            {booking.status === 'released' && (
                                                <div className="flex items-center gap-2 bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 p-3 rounded-2xl text-xs font-bold border border-emerald-100 dark:border-emerald-500/20">
                                                    <CheckCircle2 size={14} />
                                                    Deposit released to owner on {formatDate(booking.releasedAt)}
                                                </div>
                                            )}
                                        </div>
                                    </motion.div>
                                );
                            })}
                        </AnimatePresence>
                    </div>
                )}
            </main>

            <ConfirmationModal
                isOpen={confirmModal.isOpen}
                title="Confirm Move-In"
                message="By confirming, you're telling us you have moved into this property. The security deposit will be flagged for release to the owner after they also confirm. This action cannot be undone."
                confirmText="Confirm Move-In"
                confirmColor="#059669"
                variant="success"
                icon={CheckCircle2}
                isLoading={confirming}
                onConfirm={handleConfirmMoveIn}
                onCancel={() => setConfirmModal({ isOpen: false, bookingId: null })}
            />

            <PaymentStatusModal
                isOpen={statusModal.isOpen}
                onClose={() => setStatusModal({ isOpen: false, booking: null })}
                status={statusModal.booking?.status || 'held'}
                title={`Deposit ${STATUS_MAP[statusModal.booking?.status]?.label || 'Under Review'}`}
                message={
                    statusModal.booking?.status === 'released' 
                        ? 'The funds have been released to the owner.'
                        : statusModal.booking?.status === 'disputed'
                        ? 'There is a dispute regarding this deposit. Our team is reviewing.'
                        : 'Your security deposit is safely held by Any-Let. It will be released to the owner once you both confirm the move-in.'
                }
                transactionId={statusModal.booking?.paymentId}
            />
        </div>
    );
}
