import { useState } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import PaymentModal from './PaymentModal';
import ConfirmationModal from './ConfirmationModal';
import Modal, { ModalFooter } from './ui/Modal';
import { Button, Card, Icon } from './ui';
import { Shield, Lock, ArrowRight, CheckCircle2, Home, CreditCard, Banknote } from 'lucide-react';

const SERVICE_FEE = 99;

/* ═══════════════════════════════════════════
   VARIANTS — all decoupled from JSX
═══════════════════════════════════════════ */
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

    const sV = reduced
        ? { enter: () => ({ opacity: 0 }), center: { opacity: 1, x: 0, scale: 1 }, exit: () => ({ opacity: 0 }) }
        : stepV;

    const HOW_IT_WORKS = [
        { icon: <Banknote size={18} />,     title: 'You pay the deposit',     desc: `Security deposit + ৳${SERVICE_FEE} service fee` },
        { icon: <Lock size={18} />,         title: 'We hold it securely',     desc: 'Money stays with Any-Let, not the owner' },
        { icon: <Home size={18} />,         title: 'You move in & confirm',   desc: 'Both you and the owner confirm the move-in' },
        { icon: <CheckCircle2 size={18} />, title: 'Funds released to owner', desc: 'Only after your confirmation' },
    ];

    // Note: PaymentModal manages its own Modal primitive and state.
    // When paymentModalOpen is true, we visually hide this Modal's content
    // but Modal component handles the portal.

    return (
        <>
            <Modal open={isOpen && !paymentModalOpen} onClose={handleClose} showClose={true} size="md" className="p-0">
                {/* Accent stripe */}
                <div className="h-1 w-full bg-gradient-to-r from-primary via-indigo-500 to-purple-500" />

                <div className="overflow-hidden">
                    <AnimatePresence mode="wait" custom={dir}>
                        {/* ── STEP 0: Escrow Explainer ── */}
                        {step === 0 && (
                            <motion.div
                                key="book-s0" custom={dir}
                                variants={sV} initial="enter" animate="center" exit="exit"
                                className="p-6 pt-8"
                            >
                                {/* Hero icon */}
                                <div className="flex justify-center mb-8">
                                    <div className="relative">
                                        <motion.div
                                            variants={heroIconV} initial="hidden" animate="visible"
                                            className="size-20 rounded-2xl bg-gradient-to-br from-primary to-indigo-600 flex items-center justify-center shadow-2xl shadow-primary/30 transform-gpu"
                                        >
                                            <Shield size={36} className="text-white drop-shadow-lg" />
                                        </motion.div>
                                        <motion.div
                                            variants={badgeV} initial="hidden" animate="visible"
                                            className="absolute -bottom-2 -right-2 size-8 bg-success rounded-xl flex items-center justify-center shadow-lg shadow-success/30 ring-2 ring-surface"
                                        >
                                            <Lock size={14} className="text-on-primary" />
                                        </motion.div>
                                    </div>
                                </div>

                                <motion.div
                                    className="text-center mb-8"
                                    initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.18 }}
                                >
                                    <div className="inline-flex items-center gap-1.5 bg-primary-subtle text-primary px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest mb-4">
                                        <Shield size={12} /> Secure Booking
                                    </div>
                                    <h2 className="text-title-lg text-content mb-3 leading-tight">
                                        Book this property<br />with confidence
                                    </h2>
                                    <p className="text-muted font-medium text-body-sm leading-relaxed max-w-xs mx-auto">
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
                                            <div className="size-10 rounded-2xl bg-primary-subtle flex items-center justify-center text-primary shrink-0 mt-0.5">
                                                {item.icon}
                                            </div>
                                            <div>
                                                <p className="text-body-sm font-semibold text-content">{item.title}</p>
                                                <p className="text-caption text-muted">{item.desc}</p>
                                            </div>
                                        </motion.div>
                                    ))}
                                </div>

                                <Button size="lg" fullWidth onClick={goNext} rightIcon={<ArrowRight size={18} />}>
                                    View Payment Breakdown
                                </Button>
                            </motion.div>
                        )}

                        {/* ── STEP 1: Payment Breakdown ── */}
                        {step === 1 && (
                            <motion.div
                                key="book-s1" custom={dir}
                                variants={sV} initial="enter" animate="center" exit="exit"
                                className="p-6"
                            >
                                {/* Property preview */}
                                <motion.div
                                    className="relative w-full h-32 rounded-card overflow-hidden mb-6 bg-surface-raised"
                                    initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
                                    transition={{ type: 'spring', stiffness: 360, damping: 28 }}
                                >
                                    {property?.images?.[0]
                                        ? <img loading="lazy" src={property.images[0]} alt={property.title} className="w-full h-full object-cover" />
                                        : <div className="w-full h-full flex items-center justify-center"><Home size={32} className="text-subtle" /></div>
                                    }
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                                    <div className="absolute bottom-3 left-4 right-4">
                                        <p className="text-white font-bold text-body-sm leading-tight truncate drop-shadow-lg">{property?.title}</p>
                                    </div>
                                </motion.div>

                                <motion.h2
                                    className="text-title-md text-content mb-6"
                                    initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.06 }}
                                >
                                    Payment Breakdown
                                </motion.h2>

                                {/* Breakdown card */}
                                <Card variant="sunken" className="mb-6 border border-primary/20 bg-primary-subtle/50">
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
                                                    <span className="text-primary">{row.icon}</span>
                                                    <span className="text-muted text-body-sm font-medium">{row.label}</span>
                                                </div>
                                                <span className="text-content font-semibold text-body-sm">৳{row.amount.toLocaleString()}</span>
                                            </motion.div>
                                        ))}
                                    </div>
                                    <div className="border-t border-border pt-4 flex items-center justify-between">
                                        <span className="text-content font-bold text-body-sm">Total</span>
                                        <motion.span
                                            variants={totalV} initial="hidden" animate="visible"
                                            className="text-title-lg text-primary"
                                        >
                                            ৳{totalAmount.toLocaleString()}
                                        </motion.span>
                                    </div>
                                </Card>

                                {/* Trust banner */}
                                <motion.div
                                    className="flex items-start gap-3 bg-primary-subtle border border-primary/20 rounded-control p-4 mb-6"
                                    initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.28 }}
                                >
                                    <Lock size={18} className="text-primary shrink-0 mt-0.5" />
                                    <p className="text-caption font-semibold text-primary leading-relaxed">
                                        The deposit (৳{depositAmount.toLocaleString()}) is held by Any-Let and only released after you confirm move-in.
                                    </p>
                                </motion.div>

                                <Button fullWidth size="lg" onClick={handleProceed} leftIcon={<CreditCard size={18} />}>
                                    Proceed to Payment
                                </Button>

                                <Button fullWidth variant="ghost" className="mt-2 text-muted" onClick={() => { setDir(-1); setStep(0); }}>
                                    Back
                                </Button>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </Modal>

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
