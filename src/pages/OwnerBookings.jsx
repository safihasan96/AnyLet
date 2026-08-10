import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { db, auth } from '../firebase';
import { useAuth } from '../contexts/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import { Lock, CheckCircle2, AlertTriangle, Banknote, Shield, Loader2 } from 'lucide-react';
import { Skeleton } from '../components/Skeleton';
import PaymentStatusModal from '../components/PaymentStatusModal';
import ConfirmationModal from '../components/ConfirmationModal';
import { useToast } from '../contexts/ToastContext';
import { Helmet } from 'react-helmet-async';
import { createNotification } from '../utils/notificationService';
import logger from '../utils/logger';
import { getApiUrl } from '../utils/api';

const STATUS_MAP = {
    held: { label: 'Deposit Held', color: 'bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400 border-blue-100 dark:border-blue-500/20', icon: Lock },
    released: { label: 'Released', color: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400 border-emerald-100 dark:border-emerald-500/20', icon: CheckCircle2 },
    disputed: { label: 'Disputed', color: 'bg-amber-50 text-amber-600 dark:bg-amber-500/10 dark:text-amber-400 border-amber-100 dark:border-amber-500/20', icon: AlertTriangle },
    refunded: { label: 'Refunded', color: 'bg-slate-50 text-slate-600 dark:bg-slate-800 dark:text-slate-400 border-slate-100 dark:border-slate-700', icon: Banknote },
};

export default function OwnerBookings() {
    const { currentUser } = useAuth();
    const navigate = useNavigate();
    const toast = useToast();

    const [bookings, setBookings] = useState([]);
    const [loading, setLoading] = useState(true);
    const [confirmModal, setConfirmModal] = useState({ isOpen: false, bookingId: null });
    const [statusModal, setStatusModal] = useState({ isOpen: false, booking: null });
    const [disputeModal, setDisputeModal] = useState({ isOpen: false, bookingId: null });
    const [confirming, setConfirming] = useState(false);
    const [disputing, setDisputing] = useState(false);
    const [disputeReason, setDisputeReason] = useState('');

    useEffect(() => {
        if (!currentUser) { navigate('/login'); return; }

        const q = query(
            collection(db, 'escrowDeposits'),
            where('ownerId', '==', currentUser.uid)
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
            const token = await auth.currentUser.getIdToken();
            const res = await fetch(getApiUrl('/api/escrow?action=confirm'), {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ bookingId: confirmModal.bookingId })
            });
            const data = await res.json();
            
            if (!res.ok) throw new Error(data.error || 'Failed to confirm');

            const booking = bookings.find(b => b.firestoreId === confirmModal.bookingId);
            if (booking && booking.tenantId) {
                await createNotification(
                    booking.tenantId,
                    'system',
                    'Owner Confirmed Move-in',
                    `The property owner has confirmed your move-in for ${booking.propertyName || 'the property'}.`,
                    '/my-bookings'
                );
            }

            toast.success(data.message || 'Confirmation successful. Funds released to your wallet if both parties confirmed.');
            setConfirmModal({ isOpen: false, bookingId: null });
        } catch (err) {
            logger.error(err);
            toast.error(err.message || 'Failed to confirm. Please try again.');
        } finally {
            setConfirming(false);
        }
    };

    const handleRaiseDispute = async () => {
        if (!disputeModal.bookingId || disputeReason.length < 10) {
            toast.error('Please provide a valid reason (at least 10 characters).');
            return;
        }
        setDisputing(true);
        try {
            const token = await auth.currentUser.getIdToken();
            const res = await fetch(getApiUrl('/api/escrow?action=dispute'), {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ bookingId: disputeModal.bookingId, reason: disputeReason })
            });
            const data = await res.json();
            
            if (!res.ok) throw new Error(data.error || 'Failed to raise dispute');

            toast.success('Dispute raised. The funds have been frozen and our support team will contact you.');
            setDisputeModal({ isOpen: false, bookingId: null });
            setDisputeReason('');
        } catch (err) {
            logger.error(err);
            toast.error(err.message || 'Failed to raise dispute.');
        } finally {
            setDisputing(false);
        }
    };

    const formatDate = (ts) => {
        if (!ts) return 'Recently';
        const date = ts.toDate ? ts.toDate() : new Date(ts);
        return new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', year: 'numeric' }).format(date);
    };

    return (
        <div className="flex flex-col min-h-screen bg-[#f8fafc] dark:bg-slate-950 pb-28">
            <Helmet><title>Guest Bookings | Any-Let</title></Helmet>

            <header className="flex items-center justify-center px-6 pt-6 pb-4 sticky top-14 bg-[#f8fafc]/95 dark:bg-slate-950/95 backdrop-blur-md z-20 border-b border-slate-100 dark:border-slate-800/50">
                <h1 className="text-[20px] font-[900] text-slate-900 dark:text-white tracking-tight">Guest Bookings</h1>
            </header>

            <main className="flex-1 px-6 pt-6 max-w-3xl mx-auto w-full">
                {loading ? (
                    <div className="flex flex-col gap-4">
                        {[1,2,3].map(n => <Skeleton key={n} className="h-[180px] w-full rounded-[28px]" />)}
                    </div>
                ) : bookings.length === 0 ? (
                    <div className="py-20 flex flex-col items-center justify-center text-center px-4">
                        <div className="relative mb-8">
                            <div className="size-24 bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-800 dark:to-slate-700 rounded-[28px] flex items-center justify-center shadow-inner">
                                <Shield size={40} className="text-slate-400 dark:text-slate-500" />
                            </div>
                            <div className="absolute -bottom-2 -right-2 size-10 bg-gradient-to-br from-primary to-indigo-500 rounded-2xl flex items-center justify-center shadow-lg shadow-primary/30">
                                <CheckCircle2 size={20} className="text-white" />
                            </div>
                        </div>
                        <h3 className="text-[20px] font-[900] text-slate-900 dark:text-white mb-3">No Incoming Bookings</h3>
                        <p className="text-[#64748b] text-[15px] font-medium leading-relaxed mb-8 max-w-[280px]">
                            When guests book your properties and pay the deposit, their escrowed funds will appear here.
                        </p>
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
                                            {/* Header */}
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

                                            {/* Escrow Display */}
                                            <div className="bg-slate-50 dark:bg-slate-800 rounded-2xl p-4 mb-4 space-y-2">
                                                <div className="flex justify-between text-sm">
                                                    <span className="text-slate-500 font-medium">Escrowed Deposit</span>
                                                    <span className="font-black text-slate-900 dark:text-white">৳{booking.depositAmount?.toLocaleString()}</span>
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
                                                            {booking.confirmedByTenant ? 'Tenant confirmed move-in' : 'Pending tenant confirmation'}
                                                        </span>
                                                    </div>
                                                    <div className="flex items-center gap-3">
                                                        <div className={`size-6 rounded-full flex items-center justify-center ${booking.confirmedByOwner ? 'bg-emerald-500 text-white' : 'bg-slate-200 dark:bg-slate-700 text-slate-400'}`}>
                                                            <CheckCircle2 size={14} strokeWidth={3} />
                                                        </div>
                                                        <span className={`text-xs font-bold ${booking.confirmedByOwner ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-400'}`}>
                                                            {booking.confirmedByOwner ? 'You confirmed move-in' : 'Your confirmation pending'}
                                                        </span>
                                                    </div>

                                                    {!booking.confirmedByOwner && (
                                                        <div className="flex gap-2 w-full mt-2">
                                                            <button
                                                                onClick={() => setConfirmModal({ isOpen: true, bookingId: booking.firestoreId })}
                                                                className="flex-1 py-3.5 bg-emerald-600 text-white font-black text-sm rounded-2xl shadow-lg shadow-emerald-600/20 hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-2"
                                                            >
                                                                <CheckCircle2 size={16} /> Confirm Move-In
                                                            </button>
                                                            <button
                                                                onClick={() => setDisputeModal({ isOpen: true, bookingId: booking.firestoreId })}
                                                                className="py-3.5 px-4 bg-rose-50 text-rose-600 dark:bg-rose-500/10 dark:text-rose-400 font-black text-sm rounded-2xl border border-rose-100 dark:border-rose-500/20 hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center"
                                                                title="Raise a Dispute"
                                                            >
                                                                <AlertTriangle size={16} />
                                                            </button>
                                                        </div>
                                                    )}
                                                </div>
                                            )}

                                            {booking.status === 'released' && (
                                                <div className="flex items-center gap-2 bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 p-3 rounded-2xl text-xs font-bold border border-emerald-100 dark:border-emerald-500/20">
                                                    <CheckCircle2 size={14} />
                                                    Funds released to your wallet on {formatDate(booking.releasedAt)}
                                                </div>
                                            )}
                                            {booking.status === 'disputed' && (
                                                <div className="flex items-center gap-2 bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400 p-3 rounded-2xl text-xs font-bold border border-amber-100 dark:border-amber-500/20 mt-3">
                                                    <AlertTriangle size={14} />
                                                    This deposit is currently disputed and frozen.
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
                title="Confirm Guest Move-In"
                message="By confirming, you verify that the tenant has moved in. If the tenant has also confirmed, the deposit will be released to your wallet instantly. This action cannot be undone."
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
                        ? 'The funds have been released to your wallet.'
                        : statusModal.booking?.status === 'disputed'
                        ? 'There is a dispute regarding this deposit. Our team is reviewing.'
                        : 'The security deposit is safely held by Any-Let. It will be released to you once both you and the tenant confirm the move-in.'
                }
                transactionId={statusModal.booking?.paymentId}
            />

            {/* Dispute Modal */}
            <AnimatePresence>
                {disputeModal.isOpen && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4 backdrop-blur-sm"
                    >
                        <motion.div
                            initial={{ scale: 0.95, opacity: 0, y: 20 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            exit={{ scale: 0.95, opacity: 0, y: 20 }}
                            className="bg-white dark:bg-slate-900 rounded-[28px] w-full max-w-md p-6 shadow-2xl border border-slate-100 dark:border-slate-800"
                        >
                            <div className="flex items-center gap-3 mb-4 text-rose-600 dark:text-rose-400">
                                <div className="p-2 bg-rose-50 dark:bg-rose-500/10 rounded-2xl">
                                    <AlertTriangle size={24} />
                                </div>
                                <h2 className="text-xl font-black">Raise Dispute</h2>
                            </div>
                            
                            <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mb-4">
                                If the tenant was a no-show or there is an issue with the booking, you can raise a dispute. This freezes the funds for manual review.
                            </p>

                            <textarea
                                value={disputeReason}
                                onChange={(e) => setDisputeReason(e.target.value)}
                                placeholder="Explain the issue in detail..."
                                className="w-full bg-slate-50 dark:bg-slate-800 border-none rounded-2xl p-4 text-[15px] font-medium text-slate-900 dark:text-white focus:ring-2 focus:ring-rose-500/50 mb-6 min-h-[120px] resize-none"
                            />

                            <div className="flex gap-3">
                                <button
                                    onClick={() => {
                                        setDisputeModal({ isOpen: false, bookingId: null });
                                        setDisputeReason('');
                                    }}
                                    className="flex-1 py-3.5 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-bold text-sm rounded-xl hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleRaiseDispute}
                                    disabled={disputing || disputeReason.length < 10}
                                    className="flex-1 py-3.5 bg-rose-600 text-white font-black text-sm rounded-xl hover:bg-rose-700 disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
                                >
                                    {disputing ? <Loader2 size={16} className="animate-spin" /> : 'Submit Dispute'}
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
