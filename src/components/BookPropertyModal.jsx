import { useState } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import PaymentModal from './PaymentModal';
import ConfirmationModal from './ConfirmationModal';
import { createPortal } from 'react-dom';
import { X, Shield, Lock, ArrowRight, CheckCircle2, Home, CreditCard, Banknote } from 'lucide-react';

const SERVICE_FEE = 99;

/* ═══════════════════════════════════════════
   VARIANTS — all decoupled from JSX
═══════════════════════════════════════════ */
const backdropV = {
    hidden:  { opacity: 0 },
    visible: { opacity: 1, transition: { duration: 0.22 } },
    exit:    { opacity: 0, transition: { duration: 0.18 } },
};

const cardV = {
    hidden:  { opacity: 0, scale: 0.86, y: 32 },
    visible: { opacity: 1, scale: 1,    y: 0,  transition: { type: 'spring', stiffness: 380, damping: 28, mass: 0.9 } },
    exit:    { opacity: 0, scale: 0.86, y: 32,  transition: { duration: 0.16 } },
};

const stepV = {
    enter:  (dir) => ({ opacity: 0, x: dir > 0 ? 72 : -72, scale: 0.96 }),
    center: { opacity: 1, x: 0, scale: 1, transition: { type: 'spring', stiffness: 420, damping: 36 } },
    exit:   (dir) => ({ opacity: 0, x: dir > 0 ? -72 : 72, scale: 0.96, transition: { duration: 0.14 } }),
};

const heroIconV = {
    hidden:  { scale: 0, rotate: -30, opacity: 0 },
    visible: { scale: 1, rotate: 0,   opacity: 1, transition: { type: 'spring', stiffness: 500, damping: 18, delay: 0.08 } },
};

const badgeV = {
    hidden:  { scale: 0, opacity: 0 },
    visible: { scale: 1, opacity: 1, transition: { type: 'spring', stiffness: 600, damping: 18, delay: 0.22 } },
};

const listItemV = {
    hidden:  { opacity: 0, x: -16 },
    visible: (i) => ({
        opacity: 1, x: 0,
        transition: { type: 'spring', stiffness: 360, damping: 28, delay: i * 0.07 },
    }),
};

const rowV = {
    hidden:  { opacity: 0, y: 8 },
    visible: (i) => ({
        opacity: 1, y: 0,
        transition: { type: 'spring', stiffness: 380, damping: 28, delay: 0.1 + i * 0.06 },
    }),
};

const totalV = {
    hidden:  { opacity: 0, scale: 0.7 },
    visible: { opacity: 1, scale: 1, transition: { type: 'spring', stiffness: 480, damping: 18, delay: 0.28 } },
};

export default function BookPropertyModal({ isOpen, onClose, property }) {
    const { currentUser } = useAuth();
    const toast = useToast();
    const reduced = useReducedMotion();

    const [step,            setStep]            = useState(0);
    const [dir,             setDir]             = useState(1);
    const [paymentModalOpen, setPaymentModalOpen] = useState(false);
    const [confirmOpen,     setConfirmOpen]     = useState(false);

    const depositAmount = property?.securityDeposit || 0;
    const totalAmount   = depositAmount + SERVICE_FEE;

    const goNext = () => { setDir(1); setStep(s => s + 1); };

    const handleProceed = () => setConfirmOpen(true);

    const handlePaymentSubmitted = async () => {
        toast.success('Payment submitted. Booking will activate after SMS verification.');
    };

    const handleClose = () => {
        setStep(0); setDir(1);
        setPaymentModalOpen(false); setConfirmOpen(false);
        onClose();
    };

    if (typeof document === 'undefined') return null;

    /* Reduced-motion fallbacks */
    const bV = reduced ? { hidden: { opacity: 0 }, visible: { opacity: 1 }, exit: { opacity: 0 } } : backdropV;
    const cV = reduced ? { hidden: { opacity: 0 }, visible: { opacity: 1 }, exit: { opacity: 0 } } : cardV;
    const sV = reduced
        ? { enter: () => ({ opacity: 0 }), center: { opacity: 1, x: 0, scale: 1 }, exit: () => ({ opacity: 0 }) }
        : stepV;

    const HOW_IT_WORKS = [
        { icon: <Banknote size={18} />,     title: 'You pay the deposit',     desc: `Security deposit + ৳${SERVICE_FEE} service fee` },
        { icon: <Lock size={18} />,         title: 'We hold it securely',     desc: 'Money stays with Any-Let, not the owner' },
        { icon: <Home size={18} />,         title: 'You move in & confirm',   desc: 'Both you and the owner confirm the move-in' },
        { icon: <CheckCircle2 size={18} />, title: 'Funds released to owner', desc: 'Only after your confirmation' },
    ];

    return (
        <>
            {createPortal(
                <AnimatePresence mode="wait">
                    {isOpen && !paymentModalOpen && (
                        <motion.div
                            key="book-backdrop"
                            variants={bV} initial="hidden" animate="visible" exit="exit"
                            className="fixed inset-0 z-[60] flex items-center justify-center p-4"
                            onClick={handleClose}
                        >
                            <div className="absolute inset-0 bg-slate-900/75 backdrop-blur-xl" />

                            <motion.div
                                key="book-card"
                                variants={cV} initial="hidden" animate="visible" exit="exit"
                                className="relative w-full max-w-md bg-white dark:bg-slate-900 rounded-[40px] shadow-2xl max-h-[90dvh] overflow-y-auto transform-gpu will-change-transform"
                                onClick={e => e.stopPropagation()}
                            >
                                {/* Accent stripe */}
                                <div className="h-1 w-full rounded-t-[40px] bg-gradient-to-r from-primary via-indigo-500 to-purple-500" />
                                <div className="w-10 h-1 bg-slate-200 dark:bg-slate-700 rounded-full mx-auto mt-3" />

                                {/* Close */}
                                <motion.button
                                    onClick={handleClose}
                                    className="absolute top-5 right-5 z-10 size-9 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-500"
                                    whileHover={{ scale: 1.14, rotate: 90 }}
                                    whileTap={{ scale: 0.82 }}
                                    transition={{ type: 'spring', stiffness: 520, damping: 18 }}
                                >
                                    <X size={18} strokeWidth={2.5} />
                                </motion.button>

                                <div className="overflow-hidden">
                                    <AnimatePresence mode="wait" custom={dir}>

                                        {/* ── STEP 0: Escrow Explainer ── */}
                                        {step === 0 && (
                                            <motion.div
                                                key="book-s0" custom={dir}
                                                variants={sV} initial="enter" animate="center" exit="exit"
                                                className="p-8 pt-10"
                                            >
                                                {/* Hero icon */}
                                                <div className="flex justify-center mb-8">
                                                    <div className="relative">
                                                        <motion.div
                                                            variants={heroIconV} initial="hidden" animate="visible"
                                                            className="size-24 rounded-[28px] bg-gradient-to-br from-primary to-indigo-600 flex items-center justify-center shadow-2xl shadow-primary/30 transform-gpu"
                                                        >
                                                            <Shield size={44} className="text-white drop-shadow-lg" />
                                                        </motion.div>
                                                        <motion.div
                                                            variants={badgeV} initial="hidden" animate="visible"
                                                            className="absolute -bottom-2 -right-2 size-10 bg-emerald-500 rounded-xl flex items-center justify-center shadow-lg shadow-emerald-500/30 ring-2 ring-white dark:ring-slate-900"
                                                        >
                                                            <Lock size={18} className="text-white" />
                                                        </motion.div>
                                                    </div>
                                                </div>

                                                <motion.div
                                                    className="text-center mb-8"
                                                    initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                                                    transition={{ delay: 0.18 }}
                                                >
                                                    <div className="inline-flex items-center gap-1.5 bg-primary/10 text-primary dark:text-indigo-400 px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest mb-4">
                                                        <Shield size={12} /> Secure Booking
                                                    </div>
                                                    <h2 className="text-2xl font-black text-slate-900 dark:text-white mb-3 leading-tight">
                                                        Book this property<br />with confidence
                                                    </h2>
                                                    <p className="text-slate-500 dark:text-slate-400 font-medium text-sm leading-relaxed max-w-xs mx-auto">
                                                        Your security deposit is safely held by Any-Let until you move in and confirm. The owner cannot touch it.
                                                    </p>
                                                </motion.div>

                                                {/* How it works list */}
                                                <div className="space-y-4 mb-8">
                                                    {HOW_IT_WORKS.map((item, i) => (
                                                        <motion.div
                                                            key={i} custom={i} variants={listItemV} initial="hidden" animate="visible"
                                                            className="flex items-start gap-4"
                                                        >
                                                            <div className="size-10 rounded-2xl bg-primary/10 flex items-center justify-center text-primary dark:text-indigo-400 shrink-0 mt-0.5">
                                                                {item.icon}
                                                            </div>
                                                            <div>
                                                                <p className="text-sm font-black text-slate-900 dark:text-white">{item.title}</p>
                                                                <p className="text-xs font-medium text-slate-400">{item.desc}</p>
                                                            </div>
                                                        </motion.div>
                                                    ))}
                                                </div>

                                                <motion.button
                                                    onClick={goNext}
                                                    className="w-full py-5 bg-primary text-white font-black text-base rounded-[20px] shadow-xl shadow-primary/25 flex items-center justify-center gap-2"
                                                    initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                                                    transition={{ delay: 0.4 }}
                                                    whileHover={{ scale: 1.025, y: -2 }}
                                                    whileTap={{ scale: 0.96 }}
                                                >
                                                    View Payment Breakdown <ArrowRight size={18} />
                                                </motion.button>
                                            </motion.div>
                                        )}

                                        {/* ── STEP 1: Payment Breakdown ── */}
                                        {step === 1 && (
                                            <motion.div
                                                key="book-s1" custom={dir}
                                                variants={sV} initial="enter" animate="center" exit="exit"
                                                className="p-8"
                                            >
                                                {/* Property preview */}
                                                <motion.div
                                                    className="relative w-full h-36 rounded-3xl overflow-hidden mb-6 bg-slate-100 dark:bg-slate-800"
                                                    initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
                                                    transition={{ type: 'spring', stiffness: 360, damping: 28 }}
                                                >
                                                    {property?.images?.[0]
                                                        ? <img loading="lazy" src={property.images[0]} alt={property.title} className="w-full h-full object-cover" />
                                                        : <div className="w-full h-full flex items-center justify-center"><Home size={36} className="text-slate-300" /></div>
                                                    }
                                                    <div className="absolute inset-0 bg-gradient-to-t from-slate-900/60 via-transparent to-transparent" />
                                                    <div className="absolute bottom-3 left-4 right-4">
                                                        <p className="text-white font-black text-sm leading-tight truncate drop-shadow-lg">{property?.title}</p>
                                                    </div>
                                                </motion.div>

                                                <motion.h2
                                                    className="text-xl font-black text-slate-900 dark:text-white mb-6"
                                                    initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.06 }}
                                                >
                                                    Payment Breakdown
                                                </motion.h2>

                                                {/* Breakdown card */}
                                                <div className="bg-primary/5 dark:bg-primary/10 border border-primary/10 dark:border-primary/20 rounded-3xl p-6 mb-6">
                                                    <div className="space-y-4 mb-5">
                                                        {[
                                                            { label: 'Security Deposit', icon: <Shield size={14} />, amount: depositAmount },
                                                            { label: 'Any-Let Service Fee', icon: <CreditCard size={14} />, amount: SERVICE_FEE },
                                                        ].map((row, i) => (
                                                            <motion.div
                                                                key={i} custom={i} variants={rowV} initial="hidden" animate="visible"
                                                                className="flex items-center justify-between"
                                                            >
                                                                <div className="flex items-center gap-2">
                                                                    <span className="text-primary dark:text-indigo-400">{row.icon}</span>
                                                                    <span className="text-slate-600 dark:text-slate-400 text-sm font-medium">{row.label}</span>
                                                                </div>
                                                                <span className="text-slate-900 dark:text-white font-black text-sm">৳{row.amount.toLocaleString()}</span>
                                                            </motion.div>
                                                        ))}
                                                    </div>
                                                    <div className="border-t border-primary/10 dark:border-primary/20 pt-4 flex items-center justify-between">
                                                        <span className="text-slate-900 dark:text-white font-black text-sm">Total</span>
                                                        <motion.span
                                                            variants={totalV} initial="hidden" animate="visible"
                                                            className="text-2xl font-black text-primary dark:text-indigo-400"
                                                        >
                                                            ৳{totalAmount.toLocaleString()}
                                                        </motion.span>
                                                    </div>
                                                </div>

                                                {/* Trust banner */}
                                                <motion.div
                                                    className="flex items-start gap-3 bg-primary/5 dark:bg-primary/10 border border-primary/20 rounded-2xl p-4 mb-6"
                                                    initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.28 }}
                                                >
                                                    <Lock size={18} className="text-primary dark:text-indigo-400 shrink-0 mt-0.5" />
                                                    <p className="text-xs font-bold text-primary dark:text-indigo-400 leading-relaxed">
                                                        The deposit (৳{depositAmount.toLocaleString()}) is held by Any-Let and only released after you confirm move-in.
                                                    </p>
                                                </motion.div>

                                                <motion.button
                                                    onClick={handleProceed}
                                                    className="w-full py-5 bg-primary text-white font-black text-base rounded-[20px] shadow-xl shadow-primary/25 flex items-center justify-center gap-2"
                                                    initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.34 }}
                                                    whileHover={{ scale: 1.025, y: -2 }}
                                                    whileTap={{ scale: 0.96 }}
                                                >
                                                    <CreditCard size={18} /> Proceed to Payment
                                                </motion.button>

                                                <motion.button
                                                    onClick={() => { setDir(-1); setStep(0); }}
                                                    className="w-full mt-3 py-3 text-slate-400 font-bold text-sm hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
                                                    whileTap={{ scale: 0.96 }}
                                                    initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }}
                                                >
                                                    Back
                                                </motion.button>
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
                message={`You are about to pay ৳${totalAmount.toLocaleString()} to secure "${property?.title}". The deposit is held safely until you confirm move-in.`}
                confirmText={`Pay ৳${totalAmount.toLocaleString()}`}
                confirmColor="#1a227f"
                variant="info"
                icon={Shield}
                onConfirm={() => { setConfirmOpen(false); setPaymentModalOpen(true); }}
                onCancel={() => setConfirmOpen(false)}
            />

            <PaymentModal
                isOpen={paymentModalOpen}
                onClose={() => { setPaymentModalOpen(false); handleClose(); }}
                type="escrow_deposit"
                bookingType="deposit"
                amount={totalAmount}
                title="Secure Booking"
                subtitle={property?.title || ''}
                breakdownItems={[
                    { label: 'Security Deposit (Refundable)', amount: depositAmount },
                    { label: 'Any-Let Service Fee',           amount: SERVICE_FEE },
                ]}
                propertyId={property?.id}
                propertyName={property?.title || ''}
                metadata={{
                    tenantId: currentUser?.uid,
                    ownerId: property?.ownerId || property?.userId,
                    depositAmount, serviceFee: SERVICE_FEE,
                }}
                onPaymentSubmitted={handlePaymentSubmitted}
            />
        </>
    );
}
