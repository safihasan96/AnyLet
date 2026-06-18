import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import PaymentModal from './PaymentModal';
import ConfirmationModal from './ConfirmationModal';
import { createNotification } from '../utils/notificationService';
import { createPortal } from 'react-dom';
import {
import logger from '../utils/logger';
    X, Shield, Lock, ArrowRight, CheckCircle2, Home,
    CreditCard, Users, Banknote
} from 'lucide-react';

const SERVICE_FEE = 99;

const stepVariants = {
    enter: (dir) => ({ opacity: 0, x: dir > 0 ? 60 : -60 }),
    center: { opacity: 1, x: 0 },
    exit: (dir) => ({ opacity: 0, x: dir > 0 ? -60 : 60 }),
};

/**
 * BookPropertyModal — Escrow booking flow for remote tenants.
 *
 * Props:
 *   isOpen, onClose
 *   property — the property doc (needs .id, .title, .securityDeposit, .ownerId, .images)
 */
export default function BookPropertyModal({ isOpen, onClose, property }) {
    const { currentUser } = useAuth();
    const toast = useToast();

    const [step, setStep] = useState(0); // 0=explainer, 1=breakdown → opens PaymentModal
    const [dir, setDir] = useState(1);
    const [paymentModalOpen, setPaymentModalOpen] = useState(false);
    const [confirmOpen, setConfirmOpen] = useState(false);

    const depositAmount = property?.securityDeposit || 0;
    const totalAmount = depositAmount + SERVICE_FEE;

    const goNext = () => { setDir(1); setStep(s => s + 1); };

    const handleProceed = () => {
        setConfirmOpen(true);
    };

    const handlePaymentSubmitted = async (paymentDocId) => {
        if (!currentUser || !property) return;
        try {
            await addDoc(collection(db, 'escrowDeposits'), {
                tenantId: currentUser.uid,
                ownerId: property.ownerId || property.userId,
                propertyId: property.id,
                propertyName: property.title,
                depositAmount,
                serviceFee: SERVICE_FEE,
                totalPaid: totalAmount,
                paymentId: paymentDocId,
                status: 'held',
                createdAt: serverTimestamp(),
                releasedAt: null,
                confirmedByTenant: false,
                confirmedByOwner: false,
                releaseRequested: false,
            });

            // Notify Owner
            const targetOwnerId = property.ownerId || property.userId;
            if (targetOwnerId) {
                await createNotification(
                    targetOwnerId,
                    'booking_confirmed',
                    'Booking Deposit Received',
                    `A tenant has paid the booking deposit for ${property.title}. The funds are securely held in escrow.`,
                    '/requests',
                    { propertyId: property.id }
                );
            }

            toast.success('Booking submitted! The owner will be notified.');
        } catch (err) {
            logger.error('Escrow creation error:', err);
            toast.error('Failed to create booking. Please contact support.');
        }
    };

    const handleClose = () => {
        setStep(0);
        setDir(1);
        setPaymentModalOpen(false);
        setConfirmOpen(false);
        onClose();
    };

    if (typeof document === 'undefined') return null;

    return (
        <>
            {createPortal(
                <AnimatePresence>
                    {isOpen && !paymentModalOpen && (
                        <motion.div
                            key="book-backdrop"
                            className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center p-0 sm:p-4"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            transition={{ duration: 0.2 }}
                            onClick={handleClose}
                        >
                            <div className="absolute inset-0 bg-slate-900/70 backdrop-blur-md" />

                            <motion.div
                                key="book-card"
                                className="relative w-full sm:max-w-md bg-white dark:bg-slate-900 rounded-t-[40px] sm:rounded-[40px] overflow-hidden shadow-2xl"
                                onClick={(e) => e.stopPropagation()}
                                initial={{ opacity: 0, y: '100%' }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: '100%' }}
                                transition={{ type: 'spring', stiffness: 360, damping: 34, mass: 1 }}
                            >
                                <div className="w-10 h-1 bg-slate-200 dark:bg-slate-700 rounded-full mx-auto mt-4 sm:hidden" />

                                <button
                                    onClick={handleClose}
                                    className="absolute top-5 right-5 z-10 size-9 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors"
                                >
                                    <X size={18} strokeWidth={2.5} />
                                </button>

                                <div className="overflow-hidden max-h-[80vh] overflow-y-auto">
                                    <AnimatePresence mode="wait" custom={dir}>
                                        {/* ─── STEP 0: Escrow Explainer ─── */}
                                        {step === 0 && (
                                            <motion.div
                                                key="book-step-0"
                                                custom={dir}
                                                variants={stepVariants}
                                                initial="enter" animate="center" exit="exit"
                                                transition={{ type: 'spring', stiffness: 400, damping: 35 }}
                                                className="p-8 pt-10"
                                            >
                                                {/* Hero illustration */}
                                                <div className="flex justify-center mb-8">
                                                    <div className="relative">
                                                        <div className="size-24 rounded-[28px] bg-gradient-to-br from-primary to-indigo-600 flex items-center justify-center shadow-2xl shadow-primary/30">
                                                            <Shield size={44} className="text-white drop-shadow-lg" />
                                                        </div>
                                                        <div className="absolute -bottom-2 -right-2 size-10 bg-emerald-500 rounded-xl flex items-center justify-center shadow-lg shadow-emerald-500/30 ring-2 ring-white dark:ring-slate-900">
                                                            <Lock size={18} className="text-white" />
                                                        </div>
                                                    </div>
                                                </div>

                                                <div className="text-center mb-8">
                                                    <div className="inline-flex items-center gap-1.5 bg-primary/10 text-primary dark:text-indigo-400 px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest mb-4">
                                                        <Shield size={12} /> Secure Booking
                                                    </div>
                                                    <h2 className="text-2xl font-black text-slate-900 dark:text-white mb-3 leading-tight">
                                                        Book this property <br />with confidence
                                                    </h2>
                                                    <p className="text-slate-500 dark:text-slate-400 font-medium text-sm leading-relaxed max-w-xs mx-auto">
                                                        Your security deposit is safely held by Any-Let until you move in and confirm. The owner cannot touch it.
                                                    </p>
                                                </div>

                                                {/* How it works */}
                                                <div className="space-y-4 mb-8">
                                                    {[
                                                        { icon: <Banknote size={18} />, title: 'You pay the deposit', desc: 'Security deposit + ৳99 service fee' },
                                                        { icon: <Lock size={18} />, title: 'We hold it securely', desc: 'Money stays with Any-Let, not the owner' },
                                                        { icon: <Home size={18} />, title: 'You move in & confirm', desc: 'Both you and the owner confirm the move-in' },
                                                        { icon: <CheckCircle2 size={18} />, title: 'Funds released to owner', desc: 'Only after your confirmation' },
                                                    ].map((item, i) => (
                                                        <div key={i} className="flex items-start gap-4">
                                                            <div className="size-10 rounded-2xl bg-primary/10 flex items-center justify-center text-primary dark:text-indigo-400 shrink-0 mt-0.5">
                                                                {item.icon}
                                                            </div>
                                                            <div>
                                                                <p className="text-sm font-black text-slate-900 dark:text-white">{item.title}</p>
                                                                <p className="text-xs font-medium text-slate-400">{item.desc}</p>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>

                                                <button
                                                    onClick={goNext}
                                                    className="w-full py-5 bg-primary text-white font-black text-base rounded-[20px] shadow-xl shadow-primary/25 hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-2"
                                                >
                                                    View Payment Breakdown <ArrowRight size={18} />
                                                </button>
                                            </motion.div>
                                        )}

                                        {/* ─── STEP 1: Payment Breakdown ─── */}
                                        {step === 1 && (
                                            <motion.div
                                                key="book-step-1"
                                                custom={dir}
                                                variants={stepVariants}
                                                initial="enter" animate="center" exit="exit"
                                                transition={{ type: 'spring', stiffness: 400, damping: 35 }}
                                                className="p-8"
                                            >
                                                {/* Property preview */}
                                                <div className="relative w-full h-36 rounded-3xl overflow-hidden mb-6 bg-slate-100 dark:bg-slate-800">
                                                    {property?.images?.[0] ? (
                                                        <img src={property.images[0]} alt={property.title} className="w-full h-full object-cover" />
                                                    ) : (
                                                        <div className="w-full h-full flex items-center justify-center">
                                                            <Home size={36} className="text-slate-300" />
                                                        </div>
                                                    )}
                                                    <div className="absolute inset-0 bg-gradient-to-t from-slate-900/60 via-transparent to-transparent" />
                                                    <div className="absolute bottom-3 left-4 right-4">
                                                        <p className="text-white font-black text-sm leading-tight truncate drop-shadow-lg">
                                                            {property?.title}
                                                        </p>
                                                    </div>
                                                </div>

                                                <h2 className="text-xl font-black text-slate-900 dark:text-white mb-6">Payment Breakdown</h2>

                                                {/* Premium breakdown card */}
                                                <div className="bg-primary/5 dark:bg-primary/10 border border-primary/10 dark:border-primary/20 rounded-3xl p-6 mb-6">
                                                    <div className="space-y-4 mb-5">
                                                        <div className="flex items-center justify-between">
                                                            <div className="flex items-center gap-2">
                                                                <Shield size={14} className="text-primary dark:text-indigo-400" />
                                                                <span className="text-slate-600 dark:text-slate-400 text-sm font-medium">Security Deposit</span>
                                                            </div>
                                                            <span className="text-slate-900 dark:text-white font-black text-sm">৳{depositAmount.toLocaleString()}</span>
                                                        </div>
                                                        <div className="flex items-center justify-between">
                                                            <div className="flex items-center gap-2">
                                                                <CreditCard size={14} className="text-primary dark:text-indigo-400" />
                                                                <span className="text-slate-600 dark:text-slate-400 text-sm font-medium">Any-Let Service Fee</span>
                                                            </div>
                                                            <span className="text-slate-900 dark:text-white font-black text-sm">৳{SERVICE_FEE}</span>
                                                        </div>
                                                    </div>
                                                    <div className="border-t border-primary/10 dark:border-primary/20 pt-4 flex items-center justify-between">
                                                        <span className="text-slate-900 dark:text-white font-black text-sm">Total</span>
                                                        <span className="text-2xl font-black text-primary dark:text-indigo-400">৳{totalAmount.toLocaleString()}</span>
                                                    </div>
                                                </div>

                                                {/* Trust banner */}
                                                <div className="flex items-start gap-3 bg-primary/5 dark:bg-primary/10 border border-primary/20 dark:border-primary/20 rounded-2xl p-4 mb-6">
                                                    <Lock size={18} className="text-primary dark:text-indigo-400 shrink-0 mt-0.5" />
                                                    <div>
                                                        <p className="text-xs font-black text-primary dark:text-indigo-400 mb-1">Your money is protected</p>
                                                        <p className="text-[11px] font-medium text-primary dark:text-indigo-400/80 dark:text-indigo-400/80 leading-relaxed">
                                                            The security deposit (৳{depositAmount.toLocaleString()}) is held by Any-Let and only released to the owner after you confirm your move-in. The ৳{SERVICE_FEE} service fee is non-refundable.
                                                        </p>
                                                    </div>
                                                </div>

                                                <button
                                                    onClick={handleProceed}
                                                    className="w-full py-5 bg-primary text-white font-black text-base rounded-[20px] shadow-xl shadow-primary/25 hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-2"
                                                >
                                                    <CreditCard size={18} /> Proceed to Payment
                                                </button>

                                                <button
                                                    onClick={() => { setDir(-1); setStep(0); }}
                                                    className="w-full mt-3 py-3 text-slate-400 font-bold text-sm hover:text-slate-600 transition-colors"
                                                >
                                                    Back
                                                </button>
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </div>
                            </motion.div>
                        </motion.div>
                    )}
                </AnimatePresence>,
                document.body
            )}

            <ConfirmationModal
                isOpen={confirmOpen}
                title="Confirm Booking Payment"
                message={`You are about to pay ৳${totalAmount.toLocaleString()} (৳${depositAmount.toLocaleString()} deposit + ৳${SERVICE_FEE} service fee) to secure "${property?.title}". The deposit will be held safely until you confirm move-in.`}
                confirmText={`Pay ৳${totalAmount.toLocaleString()}`}
                confirmColor="#1a227f"
                variant="info"
                icon={Shield}
                onConfirm={() => {
                    setConfirmOpen(false);
                    setPaymentModalOpen(true);
                }}
                onCancel={() => setConfirmOpen(false)}
            />

            <PaymentModal
                isOpen={paymentModalOpen}
                onClose={() => {
                    setPaymentModalOpen(false);
                    handleClose();
                }}
                type="escrow_deposit"
                amount={totalAmount}
                title="Secure Booking"
                subtitle={property?.title || ''}
                breakdownItems={[
                    { label: 'Security Deposit (Refundable)', amount: depositAmount },
                    { label: 'Any-Let Service Fee', amount: SERVICE_FEE },
                ]}
                propertyId={property?.id}
                propertyName={property?.title || ''}
                metadata={{
                    tenantId: currentUser?.uid,
                    ownerId: property?.ownerId || property?.userId,
                    depositAmount,
                    serviceFee: SERVICE_FEE,
                }}
                onPaymentSubmitted={handlePaymentSubmitted}
            />
        </>
    );
}
