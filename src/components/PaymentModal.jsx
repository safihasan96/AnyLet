import { useState, useCallback } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import logger from '../utils/logger';
import { getApiUrl } from '../utils/api';
import {
    X, ArrowLeft, ArrowRight, CreditCard, Loader2, CheckCircle2,
    XCircle, Shield, Copy, Smartphone, AlertTriangle, HelpCircle,
    Receipt, Building2, Clock, Zap
} from 'lucide-react';

// ── Merchant number is hardcoded and immutable ────────────────────────────────
// Cannot be changed via database, API, or any runtime mechanism.
// The ONLY way to change this is a new code commit to GitHub.
const MERCHANT_NUMBER = '01580632832';

const PAYMENT_METHODS = [
    { id: 'bkash',  name: 'bKash',  color: '#E2136E', bgLight: 'bg-[#E2136E]/10', textColor: 'text-[#E2136E]', borderColor: 'border-[#E2136E]/30', logo: '🅱' },
    { id: 'nagad',  name: 'Nagad',  color: '#F6921E', bgLight: 'bg-[#F6921E]/10', textColor: 'text-[#F6921E]', borderColor: 'border-[#F6921E]/30', logo: '🇳' },
    { id: 'rocket', name: 'Rocket', color: '#8C3494', bgLight: 'bg-[#8C3494]/10', textColor: 'text-[#8C3494]', borderColor: 'border-[#8C3494]/30', logo: '🚀' },
];

/* ════════════════════════════════════════════════════════════════════════════
   FRAMER MOTION VARIANTS — all decoupled from JSX (FM Rule #1)
   Only use transform/opacity properties for 60fps performance (FM Rule #2)
════════════════════════════════════════════════════════════════════════════ */
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

const listItemV = {
    hidden:  { opacity: 0, x: -14 },
    visible: (i) => ({
        opacity: 1, x: 0,
        transition: { type: 'spring', stiffness: 380, damping: 28, delay: i * 0.06 },
    }),
};

const invoiceLineV = {
    hidden:  { opacity: 0, y: 10 },
    visible: (i) => ({
        opacity: 1, y: 0,
        transition: { type: 'spring', stiffness: 300, damping: 28, delay: 0.2 + i * 0.07 },
    }),
};

const instructionRevealV = {
    hidden:  { opacity: 0, y: -8 },
    visible: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 300, damping: 30 } },
    exit:    { opacity: 0, y: -8, transition: { duration: 0.16 } },
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

const dotV = (i) => ({
    hidden:  { opacity: 0, scale: 0 },
    visible: {
        opacity: [0.4, 1, 0.4], scale: 1,
        transition: { delay: 0.25 + i * 0.08, duration: 2.4, repeat: Infinity, ease: 'easeInOut' },
    },
});

/* ════════════════════════════════════════════════════════════════════════════
   PAYMENT MODAL
════════════════════════════════════════════════════════════════════════════ */
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
    onSuccess,
}) {
    const { currentUser } = useAuth();
    const toast = useToast();
    const reduced = useReducedMotion();
    const navigate = useNavigate();

    // ── Step Machine ──────────────────────────────────────────────────────────
    // 0 = Order Summary
    // 1 = Choose Payment Method & Send Money
    // 2 = Enter Transaction ID
    // 3 = Verifying… (loading)
    // 4 = Success Invoice
    // 5 = Failed
    const [step,            setStep]           = useState(0);
    const [dir,             setDir]            = useState(1);
    const [selectedMethod,  setSelectedMethod] = useState(null);
    const [txnId,           setTxnId]          = useState('');
    const [loading,         setLoading]        = useState(false);
    const [copied,          setCopied]         = useState(false);
    const [verifyResult,    setVerifyResult]   = useState(null); // { success, paymentId, amount, verifiedAt, message, error }

    const normalizedBookingType = bookingType || (
        type === 'escrow_deposit'    ? 'deposit' :
        type === 'subscription'      ? 'subscription' :
        type === 'verification_fee'  ? 'verification' :
        type === 'listing_fee'       ? 'listing' :
        'booking'
    );

    // ── Navigation helpers ────────────────────────────────────────────────────
    const goNext = useCallback(() => { setDir(1);  setStep(s => s + 1); }, []);
    const goBack = useCallback(() => { setDir(-1); setStep(s => s - 1); }, []);

    const copyNumber = useCallback(async () => {
        try { await navigator.clipboard.writeText(MERCHANT_NUMBER); } catch { /* ignore */ }
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    }, []);

    // ── Secure Verification via /api/verify-payment ───────────────────────────
    const handleVerifyPayment = useCallback(async () => {
        if (!currentUser) { toast.warning('Please sign in to continue.'); return; }
        const trimmedId = txnId.trim().replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
        if (trimmedId.length < 6) {
            toast.warning('Please enter a valid Transaction ID (min 6 characters).');
            return;
        }

        setDir(1);
        setStep(3); // → Verifying…

        try {
            const token = await currentUser.getIdToken(/* forceRefresh */ true);
            const response = await fetch(getApiUrl('/api/verify-payment'), {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
                // Only send what the server needs. Never send amount/price from frontend.
                body: JSON.stringify({
                    transactionId: trimmedId,
                    bookingType: normalizedBookingType,
                    provider: selectedMethod || undefined,
                    propertyId: propertyId || undefined,
                    months,
                    onsiteVerification: metadata?.onsiteVerification === true,
                }),
            });

            const data = await response.json().catch(() => ({}));

            if (response.ok && data.success) {
                setVerifyResult({ success: true, ...data });
                if (onPaymentSubmitted) await onPaymentSubmitted(data.paymentId);
                setDir(1);
                setStep(4); // → Success Invoice
            } else {
                setVerifyResult({ success: false, error: data.error || 'Verification failed. Please try again.' });
                setDir(1);
                setStep(5); // → Failed
                logger.error('[PaymentModal] Verification failed:', data.error);
            }
        } catch (err) {
            logger.error('[PaymentModal] Network error during verification:', err);
            setVerifyResult({ success: false, error: 'Network error. Please check your connection and try again.' });
            setDir(1);
            setStep(5); // → Failed
        }
    }, [currentUser, txnId, normalizedBookingType, selectedMethod, propertyId, months, metadata, onPaymentSubmitted, toast]);

    // ── Reset & Close ─────────────────────────────────────────────────────────
    const handleClose = useCallback(() => {
        setStep(0); setDir(1); setSelectedMethod(null);
        setTxnId(''); setCopied(false); setVerifyResult(null); setLoading(false);
        onClose();
    }, [onClose]);

    // ── Success Done handler ──────────────────────────────────────────────────
    // For listing payments: navigate to /my-listings so user can see their ad.
    // For all other payment types: just close.
    const handleSuccessDone = useCallback(() => {
        handleClose();
        if (onSuccess) {
            onSuccess();
        } else if (normalizedBookingType === 'listing') {
            navigate('/my-listings');
        }
    }, [handleClose, onSuccess, normalizedBookingType, navigate]);

    const handleRetry = useCallback(() => {
        setVerifyResult(null);
        setDir(-1);
        setStep(2); // → Back to TxnID input
    }, []);

    if (typeof document === 'undefined') return null;

    const method      = PAYMENT_METHODS.find(m => m.id === selectedMethod);
    const totalSteps  = 3;
    const showProgress = step < 3;
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
                    <div className="absolute inset-0 bg-slate-900/90" />

                    <motion.div
                        key="pay-card"
                        variants={cV} initial="hidden" animate="visible" exit="exit"
                        className="relative w-full max-w-md bg-white dark:bg-slate-900 rounded-[40px] shadow-2xl max-h-[90dvh] overflow-y-auto"
                        style={{ willChange: 'transform', isolation: 'isolate' }}
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
                                            aria-label="Go back"
                                        >
                                            <ArrowLeft size={18} strokeWidth={2.5} />
                                        </motion.button>
                                    ) : <div className="size-9" />}
                                </AnimatePresence>

                                {showProgress && (
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
                                    aria-label="Close payment modal"
                                >
                                    <X size={18} strokeWidth={2.5} />
                                </motion.button>
                            </div>

                            {/* Progress bar */}
                            {showProgress && (
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

                                {/* ──────────────────── STEP 0: Order Summary ──────────────────── */}
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

                                        {/* Breakdown */}
                                        <motion.div
                                            className="bg-primary/5 dark:bg-primary/10 border border-primary/10 dark:border-primary/20 rounded-3xl p-6 mb-6"
                                            initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
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
                                                Secured by AnyLet. Your payment is verified automatically via your Transaction ID.
                                            </p>
                                        </motion.div>

                                        <motion.button
                                            onClick={amount === 0 ? handleClose : goNext}
                                            className="w-full py-5 bg-primary text-white font-black text-base rounded-[20px] shadow-xl shadow-primary/25 flex items-center justify-center gap-2 touch-manipulation"
                                            initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.22 }}
                                            whileTap={{ scale: 0.96 }}
                                        >
                                            {amount === 0 ? <>Claim Free Offer <ArrowRight size={18} /></> : <>Choose Payment Method <ArrowRight size={18} /></>}
                                        </motion.button>
                                    </motion.div>
                                )}

                                {/* ──────────────────── STEP 1: Payment Method + Send ──────────────────── */}
                                {step === 1 && (
                                    <motion.div
                                        key="pay-s1" custom={dir}
                                        variants={sV} initial="enter" animate="center" exit="exit"
                                        className="px-8 pb-8"
                                    >
                                        <div className="mb-6">
                                            <h2 className="text-xl font-black text-slate-900 dark:text-white mb-1">Payment Method</h2>
                                            <p className="text-sm text-slate-500 font-medium">Select your MFS provider and send the exact amount</p>
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
                                                    aria-pressed={selectedMethod === pm.id}
                                                >
                                                    <div className="size-12 rounded-2xl flex items-center justify-center text-white text-xl font-black shadow-lg" style={{ backgroundColor: pm.color }}>
                                                        {pm.logo}
                                                    </div>
                                                    <div className="flex-1 text-left">
                                                        <p className="font-black text-slate-900 dark:text-white text-base">{pm.name}</p>
                                                        <p className="text-xs font-medium text-slate-400">Mobile Financial Service</p>
                                                    </div>
                                                    <motion.div
                                                        className="size-6 rounded-full border-2 border-slate-300 dark:border-slate-600 flex items-center justify-center"
                                                        animate={selectedMethod === pm.id
                                                            ? { borderColor: pm.color, backgroundColor: pm.color }
                                                            : { borderColor: '', backgroundColor: 'transparent' }}
                                                        transition={{ duration: 0.18 }}
                                                    >
                                                        <AnimatePresence>
                                                            {selectedMethod === pm.id && (
                                                                <motion.div key="tick" initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }} transition={{ type: 'spring', stiffness: 600, damping: 18 }}>
                                                                    <CheckCircle2 size={16} className="text-white" strokeWidth={3} />
                                                                </motion.div>
                                                            )}
                                                        </AnimatePresence>
                                                    </motion.div>
                                                </motion.button>
                                            ))}
                                        </div>

                                        {/* Instructions panel */}
                                        <AnimatePresence>
                                            {selectedMethod && (
                                                <motion.div
                                                    key="instr"
                                                    variants={instructionRevealV}
                                                    initial="hidden" animate="visible" exit="exit"
                                                    className="mb-6"
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
                                                                <div className="size-6 rounded-full bg-primary/10 flex items-center justify-center text-primary dark:text-indigo-400 text-[10px] font-black shrink-0 mt-0.5">
                                                                    {idx + 1}
                                                                </div>
                                                                {row.custom ? (
                                                                    <div className="text-sm text-slate-600 dark:text-slate-300 font-medium flex-1">
                                                                        Send <span className="font-black text-slate-900 dark:text-white">৳{amount.toLocaleString()}</span> to:
                                                                        <div className="flex items-center gap-2 mt-2 bg-white dark:bg-slate-900 rounded-xl px-4 py-3 border border-slate-200 dark:border-slate-700">
                                                                            <Smartphone size={16} className="text-slate-400" />
                                                                            <span className="font-black text-lg text-slate-900 dark:text-white tracking-wider flex-1 select-all">
                                                                                {MERCHANT_NUMBER}
                                                                            </span>
                                                                            <motion.button
                                                                                onClick={copyNumber}
                                                                                whileTap={{ scale: 0.78 }}
                                                                                className="text-primary dark:text-indigo-400"
                                                                                aria-label="Copy merchant number"
                                                                            >
                                                                                <AnimatePresence mode="wait">
                                                                                    {copied
                                                                                        ? <motion.div key="ok" variants={copyIconV} initial="hidden" animate="visible" exit="exit"><CheckCircle2 size={16} className="text-emerald-500" /></motion.div>
                                                                                        : <motion.div key="cp" variants={copyIconV} initial="hidden" animate="visible" exit="exit"><Copy size={16} /></motion.div>
                                                                                    }
                                                                                </AnimatePresence>
                                                                            </motion.button>
                                                                        </div>
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
                                            className="w-full py-5 bg-primary text-white font-black text-base rounded-[20px] shadow-xl shadow-primary/25 flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed touch-manipulation"
                                            whileTap={selectedMethod ? { scale: 0.96 } : {}}
                                            transition={{ type: 'spring', stiffness: 460, damping: 22 }}
                                        >
                                            I&apos;ve Sent the Money <ArrowRight size={18} />
                                        </motion.button>
                                    </motion.div>
                                )}

                                {/* ──────────────────── STEP 2: Enter Transaction ID ──────────────────── */}
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
                                            <div className="size-5 rounded-full text-white text-[8px] font-black flex items-center justify-center" style={{ backgroundColor: method?.color }}>{method?.logo}</div>
                                            <span className={`text-xs font-black ${method?.textColor}`}>{method?.name} Payment</span>
                                        </motion.div>

                                        {/* TxnID input */}
                                        <div className="relative mb-2">
                                            <motion.input
                                                type="text"
                                                inputMode="text"
                                                value={txnId}
                                                onChange={e => setTxnId(e.target.value.replace(/[^a-zA-Z0-9]/g, '').toUpperCase().slice(0, 20))}
                                                placeholder="e.g. 9A7F3K2B1X"
                                                autoFocus={false}
                                                ref={el => { if (el) setTimeout(() => el.focus(), 350); }}
                                                autoComplete="off"
                                                spellCheck={false}
                                                className="w-full bg-slate-50 dark:bg-slate-800 border-2 border-transparent focus:border-primary/50 rounded-2xl py-5 px-5 text-center text-xl font-black text-slate-900 dark:text-white tracking-[0.15em] uppercase placeholder:text-slate-300 dark:placeholder:text-slate-600 placeholder:tracking-normal placeholder:text-base placeholder:normal-case outline-none transition-all"
                                                animate={txnId.length >= 6 ? { borderColor: '#10b981' } : {}}
                                                transition={{ duration: 0.2 }}
                                                aria-label="Transaction ID"
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
                                                Our system will instantly verify your Transaction ID against the actual payment received. Incorrect IDs will be rejected.
                                            </p>
                                        </motion.div>

                                        <motion.button
                                            onClick={handleVerifyPayment}
                                            disabled={txnId.trim().length < 6}
                                            className="w-full py-5 bg-primary text-white font-black text-base rounded-[20px] shadow-xl shadow-primary/25 flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed touch-manipulation"
                                            whileTap={txnId.length >= 6 ? { scale: 0.96 } : {}}
                                            transition={{ type: 'spring', stiffness: 460, damping: 22 }}
                                        >
                                            <Zap size={18} /> Verify Payment
                                        </motion.button>
                                    </motion.div>
                                )}

                                {/* ──────────────────── STEP 3: Verifying… (Loading) ──────────────────── */}
                                {step === 3 && (
                                    <motion.div
                                        key="pay-s3" custom={dir}
                                        variants={sV} initial="enter" animate="center" exit="exit"
                                        className="px-8 pb-10 pt-4 flex flex-col items-center text-center"
                                    >
                                        <motion.div
                                            className="relative mb-8 transform-gpu"
                                            variants={iconBounceV} initial="hidden" animate="visible"
                                        >
                                            <div className="size-28 rounded-[32px] bg-gradient-to-br from-primary to-indigo-700 flex items-center justify-center shadow-2xl shadow-primary/30">
                                                <Loader2 size={52} className="text-white drop-shadow-lg animate-spin" />
                                            </div>
                                        </motion.div>

                                        <div className="inline-flex items-center gap-1.5 bg-primary/10 text-primary dark:text-indigo-400 px-3 py-1.5 rounded-full text-xs font-black uppercase tracking-widest mb-4">
                                            <Clock size={12} strokeWidth={3} /> Verifying…
                                        </div>
                                        <h2 className="text-2xl font-black text-slate-900 dark:text-white mb-3">Checking Payment</h2>
                                        <p className="text-slate-500 dark:text-slate-400 font-medium text-sm max-w-xs mx-auto leading-relaxed">
                                            Matching your Transaction ID against our secure payment records. This takes just a moment.
                                        </p>
                                    </motion.div>
                                )}

                                {/* ──────────────────── STEP 4: SUCCESS INVOICE ──────────────────── */}
                                {step === 4 && (
                                    <motion.div
                                        key="pay-s4" custom={dir}
                                        variants={sV} initial="enter" animate="center" exit="exit"
                                        className="px-8 pb-10 pt-4"
                                    >
                                        {/* Success icon */}
                                        <div className="flex flex-col items-center text-center mb-8">
                                            <motion.div
                                                className="relative mb-6 transform-gpu"
                                                variants={iconBounceV} initial="hidden" animate="visible"
                                            >
                                                <div className="size-28 rounded-[32px] bg-gradient-to-br from-emerald-400 to-green-600 flex items-center justify-center shadow-2xl shadow-emerald-500/30">
                                                    <CheckCircle2 size={52} className="text-white drop-shadow-lg" />
                                                </div>
                                            </motion.div>
                                            <motion.div
                                                className="inline-flex items-center gap-1.5 bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 px-3 py-1.5 rounded-full text-xs font-black uppercase tracking-widest mb-3"
                                                initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.3 }}
                                            >
                                                <CheckCircle2 size={12} strokeWidth={3} /> Payment Verified
                                            </motion.div>
                                            <motion.h2
                                                className="text-2xl font-black text-slate-900 dark:text-white mb-2"
                                                initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}
                                            >
                                                {normalizedBookingType === 'listing' ? 'Listing Paid! Pending Approval' : 'Payment Confirmed! 🎉'}
                                            </motion.h2>
                                            <motion.p
                                                className="text-slate-500 dark:text-slate-400 text-sm font-medium"
                                                initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}
                                            >
                                                {verifyResult?.message || 'Your payment has been verified and recorded.'}
                                            </motion.p>
                                        </div>

                                        {/* Invoice Card */}
                                        <motion.div
                                            className="bg-slate-50 dark:bg-slate-800 rounded-3xl overflow-hidden mb-6"
                                            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35, type: 'spring', stiffness: 280, damping: 28 }}
                                        >
                                            {/* Invoice header */}
                                            <div className="bg-gradient-to-r from-primary to-indigo-600 px-6 py-4 flex items-center justify-between">
                                                <div className="flex items-center gap-2">
                                                    <Receipt size={18} className="text-white" />
                                                    <span className="text-white font-black text-sm uppercase tracking-wider">Payment Invoice</span>
                                                </div>
                                                <div className="flex items-center gap-1.5 bg-white/20 rounded-full px-2.5 py-1">
                                                    <div className="size-1.5 rounded-full bg-emerald-400" />
                                                    <span className="text-white text-[10px] font-black uppercase tracking-widest">Verified</span>
                                                </div>
                                            </div>

                                            {/* Invoice body */}
                                            <div className="px-6 py-5 space-y-3">
                                                {[
                                                    { label: 'Transaction ID', value: verifyResult?.transactionId || txnId, mono: true },
                                                    { label: 'Payment Method', value: method?.name || 'Mobile Banking' },
                                                    { label: 'Payment Type', value: (normalizedBookingType || 'listing').replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase()) },
                                                    propertyName ? { label: 'Property', value: propertyName } : null,
                                                    { label: 'Date', value: new Date(verifyResult?.verifiedAt || Date.now()).toLocaleString('en-BD', { dateStyle: 'medium', timeStyle: 'short' }) },
                                                ].filter(Boolean).map((row, i) => (
                                                    <motion.div
                                                        key={row.label} custom={i}
                                                        variants={invoiceLineV} initial="hidden" animate="visible"
                                                        className="flex items-center justify-between"
                                                    >
                                                        <span className="text-slate-500 dark:text-slate-400 text-sm">{row.label}</span>
                                                        <span className={`text-slate-900 dark:text-white text-sm font-black ${row.mono ? 'font-mono tracking-wider' : ''}`}>
                                                            {row.value}
                                                        </span>
                                                    </motion.div>
                                                ))}

                                                {/* Total divider */}
                                                <div className="border-t border-slate-200 dark:border-slate-700 pt-3 mt-1 flex items-center justify-between">
                                                    <span className="text-slate-900 dark:text-white font-black text-base">Amount Paid</span>
                                                    <motion.span
                                                        className="text-2xl font-black text-emerald-600 dark:text-emerald-400"
                                                        initial={{ opacity: 0, scale: 0.6 }} animate={{ opacity: 1, scale: 1 }}
                                                        transition={{ type: 'spring', stiffness: 460, damping: 20, delay: 0.6 }}
                                                    >
                                                        ৳{(verifyResult?.amount || amount).toLocaleString()}
                                                    </motion.span>
                                                </div>
                                            </div>

                                            {/* Admin approval notice for listings */}
                                            {normalizedBookingType === 'listing' && (
                                                <motion.div
                                                    className="mx-6 mb-6 flex items-start gap-3 bg-primary/5 dark:bg-primary/10 border border-primary/15 rounded-2xl p-4"
                                                    initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.7 }}
                                                >
                                                    <Building2 size={18} className="text-primary dark:text-indigo-400 shrink-0 mt-0.5" />
                                                    <p className="text-xs font-bold text-primary dark:text-indigo-400 leading-relaxed">
                                                        Payment verified. Your listing is now in the review queue and will be published after admin approval — usually within 24 hours.
                                                    </p>
                                                </motion.div>
                                            )}
                                        </motion.div>

                                        <motion.button
                                            onClick={handleSuccessDone}
                                            className="w-full py-5 bg-emerald-500 text-white font-black text-base rounded-[20px] shadow-xl shadow-emerald-500/25 flex items-center justify-center gap-2 touch-manipulation"
                                            initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                                            whileTap={{ scale: 0.96 }}
                                            transition={{ type: 'spring', stiffness: 460, damping: 22, delay: 0.5 }}
                                        >
                                            {normalizedBookingType === 'listing' ? 'View My Listings →' : 'Done'} <CheckCircle2 size={18} />
                                        </motion.button>
                                    </motion.div>
                                )}

                                {/* ──────────────────── STEP 5: FAILED ──────────────────── */}
                                {step === 5 && (
                                    <motion.div
                                        key="pay-s5" custom={dir}
                                        variants={sV} initial="enter" animate="center" exit="exit"
                                        className="px-8 pb-10 pt-4 flex flex-col items-center text-center"
                                    >
                                        <motion.div
                                            className="relative mb-8 transform-gpu"
                                            variants={iconBounceV} initial="hidden" animate="visible"
                                        >
                                            <div className="size-28 rounded-[32px] bg-gradient-to-br from-rose-400 to-red-600 flex items-center justify-center shadow-2xl shadow-rose-500/30">
                                                <XCircle size={52} className="text-white drop-shadow-lg" />
                                            </div>
                                        </motion.div>

                                        <motion.div
                                            className="inline-flex items-center gap-1.5 bg-rose-50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400 px-3 py-1.5 rounded-full text-xs font-black uppercase tracking-widest mb-4"
                                            initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.3 }}
                                        >
                                            <XCircle size={12} strokeWidth={3} /> Verification Failed
                                        </motion.div>

                                        <motion.h2
                                            className="text-2xl font-black text-slate-900 dark:text-white mb-3"
                                            initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}
                                        >
                                            Payment Not Found
                                        </motion.h2>

                                        <motion.div
                                            className="bg-rose-50 dark:bg-rose-500/10 border border-rose-100 dark:border-rose-500/20 rounded-2xl p-4 mb-8 text-left w-full"
                                            initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}
                                        >
                                            <div className="flex items-start gap-3">
                                                <AlertTriangle size={18} className="text-rose-500 shrink-0 mt-0.5" />
                                                <p className="text-sm font-bold text-rose-700 dark:text-rose-300 leading-relaxed">
                                                    {verifyResult?.error || 'We could not verify your payment. Please check your Transaction ID and try again.'}
                                                </p>
                                            </div>
                                        </motion.div>

                                        <motion.div
                                            className="w-full space-y-3"
                                            initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.55 }}
                                        >
                                            <motion.button
                                                onClick={handleRetry}
                                                className="w-full py-5 bg-primary text-white font-black text-base rounded-[20px] shadow-xl shadow-primary/25 flex items-center justify-center gap-2 touch-manipulation"
                                                whileTap={{ scale: 0.96 }}
                                                transition={{ type: 'spring', stiffness: 460, damping: 22 }}
                                            >
                                                Try Again
                                            </motion.button>
                                            <a href="/contact" className="w-full py-3 text-slate-400 hover:text-slate-600 font-bold text-sm flex items-center justify-center gap-2 transition-colors">
                                                <HelpCircle size={16} /> Contact Support
                                            </a>
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
