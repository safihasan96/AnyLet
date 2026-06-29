import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import { createPortal } from 'react-dom';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase';
import logger from '../utils/logger';
import { getApiUrl } from '../utils/api';
import {
    X, ArrowLeft, ArrowRight, CreditCard, Loader2, CheckCircle2,
    Clock, Shield, Copy, Smartphone, AlertTriangle, HelpCircle
} from 'lucide-react';

const MERCHANT_NUMBER = '01580632832';

const PAYMENT_METHODS = [
    { id: 'bkash',  name: 'bKash',  color: '#E2136E', bgLight: 'bg-[#E2136E]/10', textColor: 'text-[#E2136E]', borderColor: 'border-[#E2136E]/30', logo: '🅱' },
    { id: 'nagad',  name: 'Nagad',  color: '#F6921E', bgLight: 'bg-[#F6921E]/10', textColor: 'text-[#F6921E]', borderColor: 'border-[#F6921E]/30', logo: '🇳' },
    { id: 'rocket', name: 'Rocket', color: '#8C3494', bgLight: 'bg-[#8C3494]/10', textColor: 'text-[#8C3494]', borderColor: 'border-[#8C3494]/30', logo: '🚀' },
];

/* ═══════════════════════════════════════════════
   VARIANTS — all decoupled from JSX (FM rule #1)
═══════════════════════════════════════════════ */
const backdropV = {
    hidden:  { opacity: 0 },
    visible: { opacity: 1, transition: { duration: 0.22 } },
    exit:    { opacity: 0, transition: { duration: 0.18 } },
};

const cardV = {
    hidden:  { opacity: 0, scale: 0.88, y: 28 },
    visible: { opacity: 1, scale: 1,    y: 0,  transition: { type: 'spring', stiffness: 380, damping: 28, mass: 0.9 } },
    exit:    { opacity: 0, scale: 0.88, y: 28,  transition: { duration: 0.16 } },
};

const stepV = {
    enter:  (dir) => ({ opacity: 0, x: dir > 0 ? 72 : -72, scale: 0.97 }),
    center: { opacity: 1, x: 0, scale: 1, transition: { type: 'spring', stiffness: 420, damping: 36 } },
    exit:   (dir) => ({ opacity: 0, x: dir > 0 ? -72 : 72, scale: 0.97, transition: { duration: 0.14 } }),
};

const iconBounceV = {
    hidden:  { scale: 0, rotate: -25, opacity: 0 },
    visible: { scale: 1, rotate: 0,   opacity: 1, transition: { type: 'spring', stiffness: 500, damping: 18, delay: 0.1 } },
};

const dotV = (i) => ({
    hidden:  { opacity: 0, scale: 0 },
    visible: {
        opacity: [0.4, 1, 0.4], scale: 1,
        transition: { delay: 0.25 + i * 0.08, duration: 2.4, repeat: Infinity, ease: 'easeInOut' },
    },
});

const listItemV = {
    hidden:  { opacity: 0, x: -14 },
    visible: (i) => ({
        opacity: 1, x: 0,
        transition: { type: 'spring', stiffness: 380, damping: 28, delay: i * 0.06 },
    }),
};

const instructionRevealV = {
    hidden:  { opacity: 0, height: 0, y: -8 },
    visible: { opacity: 1, height: 'auto', y: 0, transition: { type: 'spring', stiffness: 300, damping: 30 } },
    exit:    { opacity: 0, height: 0,        y: -8, transition: { duration: 0.16 } },
};

const copyIconV = {
    hidden:  { scale: 0, opacity: 0 },
    visible: { scale: 1, opacity: 1, transition: { type: 'spring', stiffness: 600, damping: 18 } },
    exit:    { scale: 0, opacity: 0, transition: { duration: 0.1 } },
};

const backBtnV = {
    hidden:  { opacity: 0, x: -10 },
    visible: { opacity: 1, x: 0,   transition: { type: 'spring', stiffness: 400, damping: 28 } },
    exit:    { opacity: 0, x: -10, transition: { duration: 0.1 } },
};

export default function PaymentModal({
    isOpen, onClose,
    type = 'listing_fee',
    amount = 49,
    bookingType,
    months = 1,
    breakdownItems = [],
    title = 'Payment',
    subtitle = '',
    propertyId = null,
    propertyName = '',
    metadata = {},
    onPaymentSubmitted,
}) {
    const { currentUser } = useAuth();
    const toast = useToast();
    const reduced = useReducedMotion();

    const [step,             setStep]             = useState(0);
    const [dir,              setDir]              = useState(1);
    const [selectedMethod,   setSelectedMethod]   = useState(null);
    const [txnId,            setTxnId]            = useState('');
    const [loading,          setLoading]          = useState(false);
    const [copied,           setCopied]           = useState(false);
    const [paymentIntent,    setPaymentIntent]    = useState(null);
    const [paymentConfirmed, setPaymentConfirmed] = useState(false);
    const unsubscribeRef = useRef(null);

    // ── Real-time payment confirmation listener ───────────────────────────────
    // When step reaches 3 ("Under Verification") and we have a paymentIntentId,
    // subscribe to the Firestore document. When the sms-webhook flips status to
    // 'completed', auto-transition the UI to a ✅ confirmed state.
    useEffect(() => {
        const intentId = paymentIntent?.paymentIntentId || paymentIntent?.id;
        if (step !== 3 || !intentId) return;

        const unsub = onSnapshot(
            doc(db, 'paymentIntents', intentId),
            (snap) => {
                if (snap.exists() && snap.data()?.status === 'completed') {
                    setPaymentConfirmed(true);
                    if (unsubscribeRef.current) {
                        unsubscribeRef.current();
                        unsubscribeRef.current = null;
                    }
                }
            },
            (err) => logger.error('[PaymentModal] onSnapshot error:', err)
        );

        unsubscribeRef.current = unsub;
        return () => {
            if (unsubscribeRef.current) {
                unsubscribeRef.current();
                unsubscribeRef.current = null;
            }
        };
    }, [step, paymentIntent]);

    const normalizedBookingType = bookingType || (
        type === 'escrow_deposit' ? 'deposit' :
        type === 'subscription' ? 'subscription' :
        type === 'verification_fee' ? 'verification' :
        type === 'listing_fee' ? 'listing' :
        'booking'
    );

    const createPaymentIntent = async () => {
        if (!currentUser) {
            toast.warning('Please sign in to continue.');
            return null;
        }

        const token = await currentUser.getIdToken();
        const response = await fetch(getApiUrl('/api/create-payment-intent'), {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                propertyId,
                bookingType: normalizedBookingType,
                months,
                onsiteVerification: metadata?.onsiteVerification === true,
            }),
        });

        const data = await response.json().catch(() => ({}));
        if (!response.ok) {
            throw new Error(data.error || 'Unable to create payment intent');
        }

        setPaymentIntent(data);
        return data;
    };

    const proceedToMethods = async () => {
        if (amount === 0) {
            if (onPaymentSubmitted) await onPaymentSubmitted(null);
            setDir(1);
            setStep(3);
            return;
        }

        setLoading(true);
        try {
            await createPaymentIntent();
            setDir(1);
            setStep(1);
        } catch (err) {
            logger.error('Payment intent creation error:', err);
            toast.error(err.message || 'Failed to prepare secure payment.');
        } finally {
            setLoading(false);
        }
    };

    const goNext = () => { setDir(1);  setStep(s => s + 1); };
    const goBack = () => { setDir(-1); setStep(s => s - 1); };

    const copyNumber = async () => {
        try { await navigator.clipboard.writeText(MERCHANT_NUMBER); }
        catch { /* fallback */ }
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const handleSubmitPayment = async () => {
        const isFree = amount === 0;
        if (!isFree && (!currentUser || !txnId.trim() || txnId.trim().length < 6)) {
            toast.warning('Please enter a valid transaction ID (min 6 characters).');
            return;
        }
        setLoading(true);
        try {
            if (!isFree && !paymentIntent?.paymentIntentId) {
                throw new Error('Payment intent is missing. Please restart the payment.');
            }
            if (onPaymentSubmitted) await onPaymentSubmitted(paymentIntent?.paymentIntentId || null);
            setDir(1); setStep(3);
        } catch (err) {
            logger.error('Payment submission error:', err);
            toast.error('Failed to submit payment. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const handleClose = () => {
        if (unsubscribeRef.current) {
            unsubscribeRef.current();
            unsubscribeRef.current = null;
        }
        setStep(0); setDir(1); setSelectedMethod(null);
        setTxnId(''); setCopied(false); setPaymentIntent(null);
        setPaymentConfirmed(false);
        onClose();
    };

    if (typeof document === 'undefined') return null;

    const method      = PAYMENT_METHODS.find(m => m.id === selectedMethod);
    const totalSteps  = 3;
    const progressPct = step < 3 ? `${((step + 1) / totalSteps) * 100}%` : '100%';

    /* Reduced-motion fallbacks */
    const bV = reduced ? { hidden: { opacity: 0 }, visible: { opacity: 1 }, exit: { opacity: 0 } } : backdropV;
    const cV = reduced ? { hidden: { opacity: 0 }, visible: { opacity: 1 }, exit: { opacity: 0 } } : cardV;
    const sV = reduced ? {
        enter:  () => ({ opacity: 0 }),
        center: { opacity: 1, x: 0, scale: 1 },
        exit:   () => ({ opacity: 0 }),
    } : stepV;

    return createPortal(
        <AnimatePresence mode="wait">
            {isOpen && (
                <motion.div
                    key="pay-backdrop"
                    variants={bV} initial="hidden" animate="visible" exit="exit"
                    className="fixed inset-0 z-[80] flex items-center justify-center p-4"
                    onClick={step < 3 ? handleClose : undefined}
                >
                    {/* blurred scrim */}
                    <div className="absolute inset-0 bg-slate-900/80 backdrop-blur-xl" />

                    <motion.div
                        key="pay-card"
                        variants={cV} initial="hidden" animate="visible" exit="exit"
                        className="relative w-full max-w-md bg-white dark:bg-slate-900 rounded-[40px] shadow-2xl max-h-[90dvh] overflow-y-auto transform-gpu will-change-transform"
                        onClick={e => e.stopPropagation()}
                    >
                        {/* Accent stripe */}
                        <div className="h-1 w-full rounded-t-[40px] bg-gradient-to-r from-primary via-indigo-500 to-purple-600" />
                        <div className="w-10 h-1 bg-slate-200 dark:bg-slate-700 rounded-full mx-auto mt-3" />

                        {/* ── Header ── */}
                        <div className="px-8 pt-5 pb-4">
                            <div className="flex items-center justify-between mb-4">
                                <AnimatePresence mode="wait">
                                    {step > 0 && step < 3 ? (
                                        <motion.button
                                            key="back-btn"
                                            variants={backBtnV} initial="hidden" animate="visible" exit="exit"
                                            onClick={goBack}
                                            className="size-9 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                                            whileTap={{ scale: 0.82 }}
                                        >
                                            <ArrowLeft size={18} strokeWidth={2.5} />
                                        </motion.button>
                                    ) : <div className="size-9" />}
                                </AnimatePresence>

                                {step < 3 && (
                                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                                        Step {step + 1} of {totalSteps}
                                    </p>
                                )}

                                <motion.button
                                    onClick={handleClose}
                                    className="size-9 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors"
                                    whileHover={{ scale: 1.14, rotate: 90 }}
                                    whileTap={{ scale: 0.82 }}
                                    transition={{ type: 'spring', stiffness: 520, damping: 18 }}
                                >
                                    <X size={18} strokeWidth={2.5} />
                                </motion.button>
                            </div>

                            {/* Progress bar */}
                            {step < 3 && (
                                <div className="h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                                    <motion.div
                                        className="h-full bg-gradient-to-r from-primary to-indigo-500 rounded-full"
                                        initial={false}
                                        animate={{ width: progressPct }}
                                        transition={{ duration: 0.44, ease: [0.22, 1, 0.36, 1] }}
                                    />
                                </div>
                            )}
                        </div>

                        {/* ── Step Content ── */}
                        <div className="overflow-hidden">
                            <AnimatePresence mode="wait" custom={dir}>

                                {/* STEP 0 — Order Summary */}
                                {step === 0 && (
                                    <motion.div
                                        key="pay-s0" custom={dir}
                                        variants={sV} initial="enter" animate="center" exit="exit"
                                        className="px-8 pb-8"
                                    >
                                        <motion.div className="mb-6" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.06 }}>
                                            <h2 className="text-xl font-black text-slate-900 dark:text-white mb-1">{title}</h2>
                                            {subtitle && <p className="text-sm text-slate-500 font-medium">{subtitle}</p>}
                                        </motion.div>

                                        {/* Breakdown card */}
                                        <motion.div
                                            className="bg-primary/5 dark:bg-primary/10 border border-primary/10 dark:border-primary/20 rounded-3xl p-6 mb-6"
                                            initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }}
                                            transition={{ delay: 0.1 }}
                                        >
                                            <div className="flex items-center gap-2 mb-5">
                                                <CreditCard size={15} className="text-primary dark:text-indigo-400" />
                                                <p className="text-primary/60 dark:text-indigo-400/60 text-[10px] font-black uppercase tracking-widest">Order Summary</p>
                                            </div>
                                            <div className="space-y-3 mb-5">
                                                {breakdownItems.map((item, i) => (
                                                    <motion.div
                                                        key={i} custom={i} variants={listItemV} initial="hidden" animate="visible"
                                                        className="flex items-center justify-between"
                                                    >
                                                        <span className="text-slate-600 dark:text-slate-400 text-sm font-medium">{item.label}</span>
                                                        <span className="text-slate-900 dark:text-white font-black text-sm">৳{item.amount.toLocaleString()}</span>
                                                    </motion.div>
                                                ))}
                                            </div>
                                            <div className="border-t border-primary/10 dark:border-primary/20 pt-4 flex items-center justify-between">
                                                <span className="text-slate-900 dark:text-white font-black text-sm">Total</span>
                                                <motion.span
                                                    className="text-2xl font-black text-primary dark:text-indigo-400"
                                                    initial={{ opacity: 0, scale: 0.7 }} animate={{ opacity: 1, scale: 1 }}
                                                    transition={{ type: 'spring', stiffness: 460, damping: 20, delay: 0.18 }}
                                                >
                                                    ৳{amount.toLocaleString()}
                                                </motion.span>
                                            </div>
                                        </motion.div>

                                        {/* Security badge */}
                                        <motion.div
                                            className="flex items-center gap-3 bg-primary/5 dark:bg-primary/10 border border-primary/15 rounded-2xl p-4 mb-6"
                                            initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.18 }}
                                        >
                                            <Shield size={20} className="text-primary dark:text-indigo-400 shrink-0" />
                                            <p className="text-xs font-bold text-primary dark:text-indigo-400 leading-relaxed">
                                                Secured by Any-Let. Your payment is verified within 30 minutes.
                                            </p>
                                        </motion.div>

                                        <motion.button
                                            onClick={proceedToMethods}
                                            disabled={loading}
                                            className="w-full py-5 bg-primary text-white font-black text-base rounded-[20px] shadow-xl shadow-primary/25 flex items-center justify-center gap-2 disabled:opacity-50"
                                            initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.22 }}
                                            whileHover={{ scale: 1.025, y: -2 }}
                                            whileTap={{ scale: 0.96 }}
                                        >
                                            {loading ? <Loader2 size={18} className="animate-spin" />
                                                : amount === 0 ? <>Claim Free Offer <ArrowRight size={18} /></>
                                                : <>Choose Payment Method <ArrowRight size={18} /></>}
                                        </motion.button>
                                    </motion.div>
                                )}

                                {/* STEP 1 — Payment Method */}
                                {step === 1 && (
                                    <motion.div
                                        key="pay-s1" custom={dir}
                                        variants={sV} initial="enter" animate="center" exit="exit"
                                        className="px-8 pb-8"
                                    >
                                        <div className="mb-6">
                                            <h2 className="text-xl font-black text-slate-900 dark:text-white mb-1">Payment Method</h2>
                                            <p className="text-sm text-slate-500 font-medium">Select how you'd like to pay</p>
                                        </div>

                                        <div className="space-y-3 mb-6">
                                            {PAYMENT_METHODS.map((pm, i) => (
                                                <motion.button
                                                    key={pm.id}
                                                    custom={i} variants={listItemV} initial="hidden" animate="visible"
                                                    onClick={() => setSelectedMethod(pm.id)}
                                                    whileHover={{ scale: 1.02, x: 3 }}
                                                    whileTap={{ scale: 0.97 }}
                                                    transition={{ type: 'spring', stiffness: 440, damping: 24 }}
                                                    className={`w-full flex items-center gap-4 p-5 rounded-2xl border-2 transition-colors ${
                                                        selectedMethod === pm.id
                                                            ? `${pm.bgLight} ${pm.borderColor}`
                                                            : 'bg-slate-50 dark:bg-slate-800 border-transparent'
                                                    }`}
                                                >
                                                    <div
                                                        className="size-12 rounded-2xl flex items-center justify-center text-white text-xl font-black shadow-lg"
                                                        style={{ backgroundColor: pm.color }}
                                                    >
                                                        {pm.logo}
                                                    </div>
                                                    <div className="flex-1 text-left">
                                                        <p className="font-black text-slate-900 dark:text-white text-base">{pm.name}</p>
                                                        <p className="text-xs font-medium text-slate-400">Mobile Banking</p>
                                                    </div>
                                                    {/* Animated radio */}
                                                    <motion.div
                                                        className="size-6 rounded-full border-2 border-slate-300 dark:border-slate-600 flex items-center justify-center"
                                                        animate={selectedMethod === pm.id
                                                            ? { borderColor: pm.color, backgroundColor: pm.color }
                                                            : { borderColor: '', backgroundColor: 'transparent' }}
                                                        transition={{ duration: 0.18 }}
                                                    >
                                                        <AnimatePresence>
                                                            {selectedMethod === pm.id && (
                                                                <motion.div
                                                                    key="tick"
                                                                    initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }}
                                                                    transition={{ type: 'spring', stiffness: 600, damping: 18 }}
                                                                >
                                                                    <CheckCircle2 size={16} className="text-white" strokeWidth={3} />
                                                                </motion.div>
                                                            )}
                                                        </AnimatePresence>
                                                    </motion.div>
                                                </motion.button>
                                            ))}
                                        </div>

                                        {/* Instruction panel — animates open when method picked */}
                                        <AnimatePresence>
                                            {selectedMethod && (
                                                <motion.div
                                                    key="instr"
                                                    variants={instructionRevealV}
                                                    initial="hidden" animate="visible" exit="exit"
                                                    className="mb-6 overflow-hidden"
                                                >
                                                    <div className="bg-slate-50 dark:bg-slate-800 rounded-2xl p-5 space-y-4">
                                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">How to pay</p>
                                                        {[
                                                            { text: `Open your ${method?.name} app` },
                                                            { custom: true },
                                                            { text: 'Copy the Transaction ID from the confirmation SMS' },
                                                        ].map((row, idx) => (
                                                            <motion.div
                                                                key={idx} custom={idx} variants={listItemV} initial="hidden" animate="visible"
                                                                className="flex items-start gap-3"
                                                            >
                                                                <div
                                                                    className="size-6 rounded-full bg-primary/10 flex items-center justify-center text-primary dark:text-indigo-400 text-[10px] font-black shrink-0 mt-0.5"
                                                                >
                                                                    {idx + 1}
                                                                </div>
                                                                {row.custom ? (
                                                                    <div className="text-sm text-slate-600 dark:text-slate-300 font-medium flex-1">
                                                                        Send <span className="font-black text-slate-900 dark:text-white">৳{(paymentIntent?.expectedAmount || amount).toLocaleString()}</span> to:
                                                                        <div className="flex items-center gap-2 mt-2 bg-white dark:bg-slate-900 rounded-xl px-4 py-3 border border-slate-200 dark:border-slate-700">
                                                                            <Smartphone size={16} className="text-slate-400" />
                                                                            <span className="font-black text-lg text-slate-900 dark:text-white tracking-wider flex-1">
                                                                                {MERCHANT_NUMBER}
                                                                            </span>
                                                                            <motion.button
                                                                                onClick={copyNumber}
                                                                                whileTap={{ scale: 0.78 }}
                                                                                className="text-primary dark:text-indigo-400"
                                                                                aria-label="Copy number"
                                                                            >
                                                                                <AnimatePresence mode="wait">
                                                                                    {copied
                                                                                        ? <motion.div key="ok" variants={copyIconV} initial="hidden" animate="visible" exit="exit">
                                                                                            <CheckCircle2 size={16} className="text-emerald-500" />
                                                                                          </motion.div>
                                                                                        : <motion.div key="cp" variants={copyIconV} initial="hidden" animate="visible" exit="exit">
                                                                                            <Copy size={16} />
                                                                                          </motion.div>
                                                                                    }
                                                                                </AnimatePresence>
                                                                            </motion.button>
                                                                        </div>
                                                                        {paymentIntent?.referenceCode && (
                                                                            <div className="mt-2 rounded-xl bg-primary/5 border border-primary/10 px-4 py-3">
                                                                                <p className="text-[10px] font-black uppercase tracking-widest text-primary/70 mb-1">Payment Reference</p>
                                                                                <p className="font-black text-primary dark:text-indigo-300 tracking-wider">{paymentIntent.referenceCode}</p>
                                                                            </div>
                                                                        )}
                                                                    </div>
                                                                ) : (
                                                                    <p className="text-sm text-slate-600 dark:text-slate-300 font-medium">{row.text}</p>
                                                                )}
                                                            </motion.div>
                                                        ))}
                                                    </div>
                                                </motion.div>
                                            )}
                                        </AnimatePresence>

                                        <motion.button
                                            onClick={goNext}
                                            disabled={!selectedMethod}
                                            className="w-full py-5 bg-primary text-white font-black text-base rounded-[20px] shadow-xl shadow-primary/25 flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed"
                                            whileHover={selectedMethod ? { scale: 1.025, y: -2 } : {}}
                                            whileTap={selectedMethod ? { scale: 0.96 } : {}}
                                            transition={{ type: 'spring', stiffness: 460, damping: 22 }}
                                        >
                                            I've Sent the Money <ArrowRight size={18} />
                                        </motion.button>
                                    </motion.div>
                                )}

                                {/* STEP 2 — Transaction ID */}
                                {step === 2 && (
                                    <motion.div
                                        key="pay-s2" custom={dir}
                                        variants={sV} initial="enter" animate="center" exit="exit"
                                        className="px-8 pb-8"
                                    >
                                        <div className="mb-6">
                                            <h2 className="text-xl font-black text-slate-900 dark:text-white mb-1">Enter Transaction ID</h2>
                                            <p className="text-sm text-slate-500 font-medium">
                                                Paste the {method?.name} TxnID from your confirmation SMS
                                            </p>
                                        </div>

                                        {/* Method badge */}
                                        <motion.div
                                            className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full mb-6 ${method?.bgLight}`}
                                            initial={{ opacity: 0, scale: 0.75 }} animate={{ opacity: 1, scale: 1 }}
                                            transition={{ type: 'spring', stiffness: 440, damping: 22 }}
                                        >
                                            <div className="size-5 rounded-full text-white text-[8px] font-black flex items-center justify-center"
                                                style={{ backgroundColor: method?.color }}>{method?.logo}</div>
                                            <span className={`text-xs font-black ${method?.textColor}`}>{method?.name} Payment</span>
                                        </motion.div>

                                        {/* TxnID input */}
                                        <div className="relative mb-2">
                                            <motion.input
                                                type="text"
                                                value={txnId}
                                                onChange={e => setTxnId(e.target.value.replace(/[^a-zA-Z0-9]/g, '').toUpperCase().slice(0, 20))}
                                                placeholder="e.g. 9A7F3K2B1X"
                                                autoFocus
                                                className="w-full bg-slate-50 dark:bg-slate-800 border-2 border-transparent focus:border-primary/50 rounded-2xl py-5 px-5 text-center text-xl font-black text-slate-900 dark:text-white tracking-[0.15em] uppercase placeholder:text-slate-300 dark:placeholder:text-slate-600 placeholder:tracking-normal placeholder:text-base placeholder:normal-case outline-none transition-all"
                                                animate={txnId.length >= 6 ? { borderColor: '#10b981' } : {}}
                                                transition={{ duration: 0.2 }}
                                            />
                                        </div>
                                        <p className={`text-xs font-bold mb-6 text-center transition-colors ${txnId.length > 0 && txnId.length < 6 ? 'text-amber-500' : 'text-slate-400'}`}>
                                            {txnId.length > 0 && txnId.length < 6
                                                ? `${6 - txnId.length} more characters needed`
                                                : 'Alphanumeric only — found on your SMS confirmation'}
                                        </p>

                                        {/* Warning */}
                                        <motion.div
                                            className="flex items-start gap-3 bg-amber-50 dark:bg-amber-500/10 border border-amber-100 dark:border-amber-500/20 rounded-2xl p-4 mb-6"
                                            initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
                                        >
                                            <AlertTriangle size={18} className="text-amber-500 shrink-0 mt-0.5" />
                                            <p className="text-xs font-bold text-amber-700 dark:text-amber-300 leading-relaxed">
                                                Incorrect Transaction IDs will be rejected and may delay your submission.
                                            </p>
                                        </motion.div>

                                        <motion.button
                                            onClick={handleSubmitPayment}
                                            disabled={loading || txnId.trim().length < 6}
                                            className="w-full py-5 bg-primary text-white font-black text-base rounded-[20px] shadow-xl shadow-primary/25 flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed"
                                            whileHover={txnId.length >= 6 ? { scale: 1.025, y: -2 } : {}}
                                            whileTap={txnId.length >= 6 ? { scale: 0.96 } : {}}
                                            transition={{ type: 'spring', stiffness: 460, damping: 22 }}
                                        >
                                            {loading
                                                ? <><Loader2 size={20} className="animate-spin" /> Submitting…</>
                                                : <>Submit for Verification <CheckCircle2 size={18} /></>}
                                        </motion.button>
                                    </motion.div>
                                )}

                                {/* STEP 3 — Success / Real-time Verification */}
                                {step === 3 && (
                                    <motion.div
                                        key="pay-s3" custom={dir}
                                        variants={sV} initial="enter" animate="center" exit="exit"
                                        className="px-8 pb-10 pt-4 flex flex-col items-center text-center"
                                    >
                                        {/* Animated icon — switches from Clock to CheckCircle on confirmation */}
                                        <motion.div className="relative mb-8 transform-gpu" variants={iconBounceV} initial="hidden" animate="visible">
                                            <AnimatePresence mode="wait">
                                                {paymentConfirmed ? (
                                                    <motion.div
                                                        key="confirmed-icon"
                                                        initial={{ scale: 0, rotate: -25, opacity: 0 }}
                                                        animate={{ scale: 1, rotate: 0, opacity: 1 }}
                                                        transition={{ type: 'spring', stiffness: 500, damping: 18 }}
                                                        className="size-28 rounded-[32px] bg-gradient-to-br from-emerald-400 to-green-600 flex items-center justify-center shadow-2xl shadow-emerald-500/30"
                                                    >
                                                        <CheckCircle2 size={52} className="text-white drop-shadow-lg" />
                                                    </motion.div>
                                                ) : (
                                                    <motion.div
                                                        key="pending-icon"
                                                        className="size-28 rounded-[32px] bg-gradient-to-br from-primary to-indigo-700 flex items-center justify-center shadow-2xl shadow-primary/30"
                                                    >
                                                        <Clock size={52} className="text-white drop-shadow-lg" />
                                                    </motion.div>
                                                )}
                                            </AnimatePresence>
                                            {!paymentConfirmed && [0, 72, 144, 216, 288].map((deg, i) => (
                                                <motion.div
                                                    key={i} variants={dotV(i)} initial="hidden" animate="visible"
                                                    className="absolute size-3 rounded-full bg-indigo-400"
                                                    style={{ top: '50%', left: '50%', transform: `rotate(${deg}deg) translateX(66px) translateY(-50%)` }}
                                                />
                                            ))}
                                        </motion.div>

                                        <AnimatePresence mode="wait">
                                            {paymentConfirmed ? (
                                                <motion.div
                                                    key="confirmed-text"
                                                    initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }}
                                                    transition={{ type: 'spring', stiffness: 300, damping: 28 }}
                                                >
                                                    <div className="inline-flex items-center gap-1.5 bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 px-3 py-1.5 rounded-full text-xs font-black uppercase tracking-widest mb-4">
                                                        <CheckCircle2 size={12} strokeWidth={3} /> Payment Confirmed
                                                    </div>
                                                    <h2 className="text-2xl font-black text-slate-900 dark:text-white mb-3">You're all set! ✅</h2>
                                                    <p className="text-slate-500 dark:text-slate-400 font-medium text-sm max-w-xs mx-auto leading-relaxed mb-8">
                                                        Your {method?.name || 'mobile banking'} payment has been <span className="font-black text-emerald-600 dark:text-emerald-400">verified automatically</span>. Your booking is now confirmed.
                                                    </p>
                                                </motion.div>
                                            ) : (
                                                <motion.div key="pending-text" initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.32 }}>
                                                    <div className="inline-flex items-center gap-1.5 bg-primary/10 text-primary dark:text-indigo-400 px-3 py-1.5 rounded-full text-xs font-black uppercase tracking-widest mb-4">
                                                        <Clock size={12} strokeWidth={3} /> Under Verification
                                                    </div>
                                                    <h2 className="text-2xl font-black text-slate-900 dark:text-white mb-3">Payment Submitted! 🎉</h2>
                                                    <p className="text-slate-500 dark:text-slate-400 font-medium text-sm max-w-xs mx-auto leading-relaxed mb-2">
                                                        Waiting for payment confirmation. This page will <span className="font-black text-slate-700 dark:text-slate-200">update automatically</span> once verified.
                                                    </p>
                                                    <p className="text-slate-400 font-medium text-xs mb-8">
                                                        Transaction ID: <span className="font-black text-slate-600 dark:text-slate-300">{txnId || 'Pending'}</span>
                                                    </p>
                                                </motion.div>
                                            )}
                                        </AnimatePresence>

                                        <motion.div
                                            className="w-full space-y-3"
                                            initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.46 }}
                                        >
                                            <motion.button
                                                onClick={handleClose}
                                                className={`w-full py-5 font-black rounded-[20px] shadow-xl text-white ${
                                                    paymentConfirmed
                                                        ? 'bg-emerald-500 shadow-emerald-500/25'
                                                        : 'bg-primary shadow-primary/25'
                                                }`}
                                                whileHover={{ scale: 1.025, y: -2 }} whileTap={{ scale: 0.96 }}
                                                transition={{ type: 'spring', stiffness: 460, damping: 22 }}
                                            >
                                                {paymentConfirmed ? 'View My Bookings →' : 'Done'}
                                            </motion.button>
                                            {!paymentConfirmed && (
                                                <a href="/contact" className="w-full py-3 text-slate-400 hover:text-slate-600 font-bold text-sm flex items-center justify-center gap-2 transition-colors">
                                                    <HelpCircle size={16} /> Need Help?
                                                </a>
                                            )}
                                        </motion.div>
                                    </motion.div>
                                )}

                            </AnimatePresence>
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>,
        document.body
    );
}
