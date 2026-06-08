import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import { createPortal } from 'react-dom';
import {
    X, ArrowLeft, ArrowRight, CreditCard, Loader2, CheckCircle2,
    Clock, Shield, Copy, Smartphone, ChevronRight, AlertTriangle, HelpCircle
} from 'lucide-react';

const MERCHANT_NUMBER = '01XXXXXXXXX'; // Replace with real bKash/Nagad number

const PAYMENT_METHODS = [
    {
        id: 'bkash',
        name: 'bKash',
        color: '#E2136E',
        bg: 'bg-[#E2136E]',
        bgLight: 'bg-[#E2136E]/10',
        textColor: 'text-[#E2136E]',
        borderColor: 'border-[#E2136E]/30',
        logo: '🅱',
    },
    {
        id: 'nagad',
        name: 'Nagad',
        color: '#F6921E',
        bg: 'bg-[#F6921E]',
        bgLight: 'bg-[#F6921E]/10',
        textColor: 'text-[#F6921E]',
        borderColor: 'border-[#F6921E]/30',
        logo: '🇳',
    },
];

const stepVariants = {
    enter: (dir) => ({ opacity: 0, x: dir > 0 ? 60 : -60 }),
    center: { opacity: 1, x: 0 },
    exit: (dir) => ({ opacity: 0, x: dir > 0 ? -60 : 60 }),
};

/**
 * PaymentModal — Reusable premium payment flow.
 *
 * Props:
 *   isOpen, onClose,
 *   type: 'listing_fee' | 'verification_fee' | 'escrow_deposit'
 *   amount: number (total the user pays)
 *   breakdownItems: [{ label, amount }]  — line items for the summary
 *   title: string — e.g. "Listing Fee"
 *   subtitle: string — e.g. "Publish your property"
 *   propertyId, propertyName — optional metadata
 *   metadata: {} — extra data to store in the payment doc
 *   onPaymentSubmitted: (paymentDocId) => void — callback after txn ID is saved
 */

const getTheme = (type) => {
    return {
        gradient: 'from-primary to-indigo-900',
        gradientBr: 'from-primary to-indigo-900',
        textLight: 'text-indigo-300',
        textDark: 'text-primary dark:text-indigo-400',
        bgMain: 'bg-primary',
        bgLight: 'bg-primary/10',
        borderLight: 'border-primary/20',
        iconBg: 'bg-primary/10',
        iconText: 'text-primary dark:text-indigo-400',
        shadowMain: 'shadow-primary/25',
        shadowLg: 'shadow-primary/30',
        dot: 'bg-indigo-400',
        ring: 'focus:border-primary/50',
        success: 'text-primary dark:text-indigo-400'
    };
};

export default function PaymentModal({
    isOpen,
    onClose,
    type = 'listing_fee',
    amount = 49,
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
    const theme = getTheme(type);

    const [step, setStep] = useState(0); // 0=summary, 1=method, 2=txnId, 3=done
    const [dir, setDir] = useState(1);
    const [selectedMethod, setSelectedMethod] = useState(null);
    const [txnId, setTxnId] = useState('');
    const [loading, setLoading] = useState(false);
    const [copied, setCopied] = useState(false);

    const goNext = () => { setDir(1); setStep(s => s + 1); };
    const goBack = () => { setDir(-1); setStep(s => s - 1); };

    const copyNumber = async () => {
        try {
            await navigator.clipboard.writeText(MERCHANT_NUMBER);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch { /* fallback */ }
    };

    const handleSubmitPayment = async () => {
        const isFree = amount === 0;
        if (!isFree && (!currentUser || !txnId.trim() || txnId.trim().length < 6)) {
            toast.warning('Please enter a valid transaction ID (min 6 characters).');
            return;
        }
        setLoading(true);
        try {
            const paymentDoc = await addDoc(collection(db, 'payments'), {
                userId: currentUser.uid,
                type,
                amount,
                serviceFee: type === 'escrow_deposit' ? 99 : 0,
                status: isFree ? 'verified' : 'pending',
                transactionId: isFree ? 'FREE_DISCOUNT' : txnId.trim(),
                paymentMethod: isFree ? 'discount' : selectedMethod,
                propertyId,
                propertyName,
                createdAt: serverTimestamp(),
                verifiedAt: isFree ? serverTimestamp() : null,
                verifiedBy: isFree ? 'system' : null,
                metadata: {
                    ...metadata,
                    userEmail: currentUser.email,
                },
            });

            if (onPaymentSubmitted) {
                await onPaymentSubmitted(paymentDoc.id);
            }

            if (isFree) {
                setTxnId('FREE_DISCOUNT');
            }
            setDir(1);
            setStep(3);
        } catch (err) {
            console.error('Payment submission error:', err);
            toast.error('Failed to submit payment. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const handleClose = () => {
        setStep(0);
        setDir(1);
        setSelectedMethod(null);
        setTxnId('');
        setCopied(false);
        onClose();
    };

    if (typeof document === 'undefined') return null;

    const method = PAYMENT_METHODS.find(m => m.id === selectedMethod);
    const totalSteps = 3;
    const progressWidth = step < 3 ? `${((step + 1) / totalSteps) * 100}%` : '100%';

    return createPortal(
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    key="payment-backdrop"
                    className="fixed inset-0 z-[80] flex items-end sm:items-center justify-center p-0 sm:p-4"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    onClick={step < 3 ? handleClose : undefined}
                >
                    <div className="absolute inset-0 bg-slate-900/80 backdrop-blur-lg" />

                    <motion.div
                        key="payment-card"
                        className="relative w-full sm:max-w-md bg-white dark:bg-slate-900 rounded-t-[40px] sm:rounded-[40px] overflow-hidden shadow-2xl"
                        onClick={(e) => e.stopPropagation()}
                        initial={{ opacity: 0, y: '100%' }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: '100%' }}
                        transition={{ type: 'spring', stiffness: 340, damping: 32, mass: 1 }}
                    >
                        {/* Drag handle mobile */}
                        <div className="w-10 h-1 bg-slate-200 dark:bg-slate-700 rounded-full mx-auto mt-4 sm:hidden" />

                        {/* Header */}
                        <div className="px-8 pt-6 pb-4">
                            <div className="flex items-center justify-between mb-4">
                                {step > 0 && step < 3 ? (
                                    <button onClick={goBack} className="size-9 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-600 dark:text-slate-300 hover:bg-slate-200 transition-colors">
                                        <ArrowLeft size={18} strokeWidth={2.5} />
                                    </button>
                                ) : <div className="size-9" />}

                                <div className="text-center">
                                    {step < 3 && (
                                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                                            Step {step + 1} of {totalSteps}
                                        </p>
                                    )}
                                </div>

                                <button
                                    onClick={handleClose}
                                    className="size-9 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors"
                                >
                                    <X size={18} strokeWidth={2.5} />
                                </button>
                            </div>

                            {step < 3 && (
                                <div className="h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                                    <motion.div
                                        className={`h-full bg-gradient-to-r ${theme.gradient} rounded-full`}
                                        initial={false}
                                        animate={{ width: progressWidth }}
                                        transition={{ duration: 0.4, ease: 'easeInOut' }}
                                    />
                                </div>
                            )}
                        </div>

                        {/* Step Content */}
                        <div className="overflow-hidden max-h-[70vh] overflow-y-auto">
                            <AnimatePresence mode="wait" custom={dir}>

                                {/* ─── STEP 0: Order Summary ─── */}
                                {step === 0 && (
                                    <motion.div
                                        key="pay-step-0"
                                        custom={dir}
                                        variants={stepVariants}
                                        initial="enter" animate="center" exit="exit"
                                        transition={{ type: 'spring', stiffness: 400, damping: 35 }}
                                        className="px-8 pb-8"
                                    >
                                        <div className="mb-6">
                                            <h2 className="text-xl font-black text-slate-900 dark:text-white mb-1">{title}</h2>
                                            {subtitle && <p className="text-sm text-slate-500 font-medium">{subtitle}</p>}
                                        </div>

                                        {/* Premium Order Card */}
                                        <div className="bg-primary/5 dark:bg-primary/10 border border-primary/10 dark:border-primary/20 rounded-3xl p-6 mb-6">
                                            <div className="flex items-center gap-2 mb-5">
                                                <CreditCard size={16} className="text-primary dark:text-indigo-400 dark:text-indigo-400" />
                                                <p className="text-primary dark:text-indigo-400/70 dark:text-primary dark:text-indigo-400/80 text-xs font-black uppercase tracking-widest">Order Summary</p>
                                            </div>

                                            <div className="space-y-3 mb-5">
                                                {breakdownItems.map((item, i) => (
                                                    <div key={i} className="flex items-center justify-between">
                                                        <span className="text-slate-600 dark:text-slate-400 text-sm font-medium">{item.label}</span>
                                                        <span className="text-slate-900 dark:text-white font-black text-sm">৳{item.amount.toLocaleString()}</span>
                                                    </div>
                                                ))}
                                            </div>

                                            <div className="border-t border-primary/10 dark:border-primary/20 pt-4 flex items-center justify-between">
                                                <span className="text-slate-900 dark:text-white font-black text-sm">Total</span>
                                                <span className="text-2xl font-black text-primary dark:text-indigo-400 dark:text-indigo-400">৳{amount.toLocaleString()}</span>
                                            </div>
                                        </div>

                                        {/* Trust indicators */}
                                        <div className={`flex items-center gap-3 ${theme.bgLight} border ${theme.borderLight} rounded-2xl p-4 mb-6`}>
                                            <Shield size={20} className={`${theme.iconText} shrink-0`} />
                                            <p className={`text-xs font-bold ${theme.textDark} leading-relaxed`}>
                                                Secured by Any-Let. Your payment is verified by our team within 30 minutes.
                                            </p>
                                        </div>

                                        <button
                                            onClick={amount === 0 ? handleSubmitPayment : goNext}
                                            disabled={loading}
                                            className={`w-full py-5 ${theme.bgMain} text-white font-black text-base rounded-[20px] shadow-xl ${theme.shadowMain} hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-2`}
                                        >
                                            {loading ? <Loader2 size={18} className="animate-spin" /> : amount === 0 ? (
                                                <>Claim Free Offer <ArrowRight size={18} /></>
                                            ) : (
                                                <>Choose Payment Method <ArrowRight size={18} /></>
                                            )}
                                        </button>
                                    </motion.div>
                                )}

                                {/* ─── STEP 1: Payment Method ─── */}
                                {step === 1 && (
                                    <motion.div
                                        key="pay-step-1"
                                        custom={dir}
                                        variants={stepVariants}
                                        initial="enter" animate="center" exit="exit"
                                        transition={{ type: 'spring', stiffness: 400, damping: 35 }}
                                        className="px-8 pb-8"
                                    >
                                        <div className="mb-6">
                                            <h2 className="text-xl font-black text-slate-900 dark:text-white mb-1">Payment Method</h2>
                                            <p className="text-sm text-slate-500 font-medium">Select how you'd like to pay</p>
                                        </div>

                                        <div className="space-y-3 mb-8">
                                            {PAYMENT_METHODS.map((pm) => (
                                                <button
                                                    key={pm.id}
                                                    onClick={() => setSelectedMethod(pm.id)}
                                                    className={`w-full flex items-center gap-4 p-5 rounded-2xl border-2 transition-all ${
                                                        selectedMethod === pm.id
                                                            ? `${pm.bgLight} ${pm.borderColor} scale-[1.02]`
                                                            : 'bg-slate-50 dark:bg-slate-800 border-transparent hover:border-slate-200 dark:hover:border-slate-700'
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
                                                    <div className={`size-6 rounded-full border-2 flex items-center justify-center transition-all ${
                                                        selectedMethod === pm.id
                                                            ? `border-transparent`
                                                            : 'border-slate-300 dark:border-slate-600'
                                                    }`}
                                                         style={selectedMethod === pm.id ? { backgroundColor: pm.color } : {}}
                                                    >
                                                        {selectedMethod === pm.id && (
                                                            <CheckCircle2 size={16} className="text-white" strokeWidth={3} />
                                                        )}
                                                    </div>
                                                </button>
                                            ))}
                                        </div>

                                        {/* Instructions appear after selection */}
                                        <AnimatePresence>
                                            {selectedMethod && (
                                                <motion.div
                                                    initial={{ opacity: 0, height: 0 }}
                                                    animate={{ opacity: 1, height: 'auto' }}
                                                    exit={{ opacity: 0, height: 0 }}
                                                    className="mb-6 overflow-hidden"
                                                >
                                                    <div className="bg-slate-50 dark:bg-slate-800 rounded-2xl p-5 space-y-4">
                                                        <p className="text-xs font-black text-slate-400 uppercase tracking-widest">Payment Instructions</p>

                                                        <div className="space-y-3">
                                                            <div className="flex items-start gap-3">
                                                                <div className={`size-6 rounded-full ${theme.iconBg} flex items-center justify-center ${theme.iconText} text-[10px] font-black shrink-0 mt-0.5`}>1</div>
                                                                <p className="text-sm text-slate-600 dark:text-slate-300 font-medium">
                                                                    Open your <span className="font-black" style={{ color: method?.color }}>{method?.name}</span> app
                                                                </p>
                                                            </div>
                                                            <div className="flex items-start gap-3">
                                                                <div className={`size-6 rounded-full ${theme.iconBg} flex items-center justify-center ${theme.iconText} text-[10px] font-black shrink-0 mt-0.5`}>2</div>
                                                                <div className="text-sm text-slate-600 dark:text-slate-300 font-medium">
                                                                    Send <span className="font-black text-slate-900 dark:text-white">৳{amount.toLocaleString()}</span> to:
                                                                    <div className="flex items-center gap-2 mt-2 bg-white dark:bg-slate-900 rounded-xl px-4 py-3 border border-slate-200 dark:border-slate-700">
                                                                        <Smartphone size={16} className="text-slate-400" />
                                                                        <span className="font-black text-lg text-slate-900 dark:text-white tracking-wider flex-1">
                                                                            {MERCHANT_NUMBER}
                                                                        </span>
                                                                        <button
                                                                            onClick={copyNumber}
                                                                            className="text-primary dark:text-indigo-400 hover:text-primary dark:text-indigo-400/80 transition-colors"
                                                                        >
                                                                            {copied ? <CheckCircle2 size={16} className={`${theme.success}`} /> : <Copy size={16} />}
                                                                        </button>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                            <div className="flex items-start gap-3">
                                                                <div className={`size-6 rounded-full ${theme.iconBg} flex items-center justify-center ${theme.iconText} text-[10px] font-black shrink-0 mt-0.5`}>3</div>
                                                                <p className="text-sm text-slate-600 dark:text-slate-300 font-medium">
                                                                    Copy the <span className="font-black">Transaction ID</span> from the confirmation message
                                                                </p>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </motion.div>
                                            )}
                                        </AnimatePresence>

                                        <button
                                            onClick={goNext}
                                            disabled={!selectedMethod}
                                            className={`w-full py-5 ${theme.bgMain} text-white font-black text-base rounded-[20px] shadow-xl ${theme.shadowMain} hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed disabled:scale-100`}
                                        >
                                            I've Sent the Money <ArrowRight size={18} />
                                        </button>
                                    </motion.div>
                                )}

                                {/* ─── STEP 2: Transaction ID ─── */}
                                {step === 2 && (
                                    <motion.div
                                        key="pay-step-2"
                                        custom={dir}
                                        variants={stepVariants}
                                        initial="enter" animate="center" exit="exit"
                                        transition={{ type: 'spring', stiffness: 400, damping: 35 }}
                                        className="px-8 pb-8"
                                    >
                                        <div className="mb-6">
                                            <h2 className="text-xl font-black text-slate-900 dark:text-white mb-1">Enter Transaction ID</h2>
                                            <p className="text-sm text-slate-500 font-medium">
                                                Paste the {method?.name} transaction ID from your confirmation SMS
                                            </p>
                                        </div>

                                        {/* Method badge */}
                                        <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full mb-6 ${method?.bgLight}`}>
                                            <div
                                                className="size-5 rounded-full text-white text-[8px] font-black flex items-center justify-center"
                                                style={{ backgroundColor: method?.color }}
                                            >
                                                {method?.logo}
                                            </div>
                                            <span className="text-xs font-black" style={{ color: method?.color }}>
                                                {method?.name} Payment
                                            </span>
                                        </div>

                                        <div className="relative mb-2">
                                            <input
                                                type="text"
                                                value={txnId}
                                                onChange={(e) => setTxnId(e.target.value.replace(/[^a-zA-Z0-9]/g, '').slice(0, 20))}
                                                placeholder="e.g. 9A7F3K2B1X"
                                                className={`w-full bg-slate-50 dark:bg-slate-800 border-2 border-transparent ${theme.ring} rounded-2xl py-5 px-5 text-center text-xl font-black text-slate-900 dark:text-white tracking-[0.15em] uppercase placeholder:text-slate-300 dark:placeholder:text-slate-600 placeholder:tracking-normal placeholder:text-base placeholder:normal-case outline-none transition-all`}
                                                autoFocus
                                            />
                                        </div>

                                        <p className={`text-xs font-bold mb-6 text-center transition-colors ${
                                            txnId.length > 0 && txnId.length < 6 ? 'text-amber-500' : 'text-slate-400'
                                        }`}>
                                            {txnId.length > 0 && txnId.length < 6
                                                ? `${6 - txnId.length} more characters needed`
                                                : 'Alphanumeric characters only'
                                            }
                                        </p>

                                        {/* Warning */}
                                        <div className="flex items-start gap-3 bg-amber-50 dark:bg-amber-500/10 border border-amber-100 dark:border-amber-500/20 rounded-2xl p-4 mb-6">
                                            <AlertTriangle size={18} className="text-amber-500 shrink-0 mt-0.5" />
                                            <p className="text-xs font-bold text-amber-700 dark:text-amber-300 leading-relaxed">
                                                Entering a fake or incorrect Transaction ID will result in payment rejection. Please double-check before submitting.
                                            </p>
                                        </div>

                                        <button
                                            onClick={handleSubmitPayment}
                                            disabled={loading || txnId.trim().length < 6}
                                            className={`w-full py-5 ${theme.bgMain} text-white font-black text-base rounded-[20px] shadow-xl ${theme.shadowMain} hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed disabled:scale-100`}
                                        >
                                            {loading ? (
                                                <><Loader2 size={20} className="animate-spin" /> Submitting...</>
                                            ) : (
                                                <>Submit for Verification <CheckCircle2 size={18} /></>
                                            )}
                                        </button>
                                    </motion.div>
                                )}

                                {/* ─── STEP 3: Done ─── */}
                                {step === 3 && (
                                    <motion.div
                                        key="pay-step-3"
                                        custom={dir}
                                        variants={stepVariants}
                                        initial="enter" animate="center" exit="exit"
                                        transition={{ type: 'spring', stiffness: 400, damping: 35 }}
                                        className="px-8 pb-10 pt-4 flex flex-col items-center text-center"
                                    >
                                        <motion.div
                                            initial={{ scale: 0, rotate: -30 }}
                                            animate={{ scale: 1, rotate: 0 }}
                                            transition={{ type: 'spring', stiffness: 400, damping: 18, delay: 0.1 }}
                                            className="relative mb-8"
                                        >
                                            <div className={`size-28 rounded-[32px] bg-gradient-to-br ${theme.gradient} flex items-center justify-center shadow-2xl ${theme.shadowLg}`}>
                                                <Clock size={52} className="text-white drop-shadow-lg" />
                                            </div>
                                            {/* Orbiting dots */}
                                            {[0, 72, 144, 216, 288].map((deg, i) => (
                                                <motion.div
                                                    key={i}
                                                    className={`absolute size-3 rounded-full ${theme.dot}`}
                                                    style={{
                                                        top: '50%', left: '50%',
                                                        transform: `rotate(${deg}deg) translateX(64px) translateY(-50%)`,
                                                    }}
                                                    initial={{ opacity: 0, scale: 0 }}
                                                    animate={{ opacity: [0.3, 1, 0.3], scale: 1 }}
                                                    transition={{ delay: 0.2 + i * 0.08, duration: 2, repeat: Infinity }}
                                                />
                                            ))}
                                        </motion.div>

                                        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
                                            <div className={`inline-flex items-center gap-1.5 ${amount === 0 ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400' : theme.bgLight + ' ' + theme.iconText} px-3 py-1.5 rounded-full text-xs font-black uppercase tracking-widest mb-4`}>
                                                {amount === 0 ? <CheckCircle2 size={12} strokeWidth={3} /> : <Clock size={12} strokeWidth={3} />} 
                                                {amount === 0 ? 'Approved' : 'Under Verification'}
                                            </div>
                                            <h2 className="text-2xl font-black text-slate-900 dark:text-white mb-3">
                                                {amount === 0 ? 'Payment Successful! 🎉' : 'Payment Submitted! 🎉'}
                                            </h2>
                                            <p className="text-slate-500 dark:text-slate-400 font-medium text-sm max-w-xs mx-auto leading-relaxed mb-2">
                                                {amount === 0 ? 'Your free listing has been instantly verified.' : `Our team will verify your ${method?.name} payment within `}
                                                {amount !== 0 && <span className="font-black text-slate-700 dark:text-slate-200">30 minutes</span>}
                                                {amount !== 0 && '.'}
                                            </p>
                                            {amount !== 0 && (
                                                <p className="text-slate-400 font-medium text-xs mb-10">
                                                    Transaction ID: <span className="font-black text-slate-600 dark:text-slate-300">{txnId}</span>
                                                </p>
                                            )}
                                            {amount === 0 && <div className="mb-10" />}
                                        </motion.div>

                                        <motion.div 
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ delay: 0.45 }}
                                            className="w-full space-y-3"
                                        >
                                            <button
                                                onClick={handleClose}
                                                className="w-full py-5 bg-primary text-white font-black rounded-[20px] shadow-xl shadow-primary/25 hover:scale-[1.02] active:scale-95 transition-all"
                                            >
                                                Done
                                            </button>
                                            <a
                                                href="/contact"
                                                className="w-full py-3 text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300 font-bold text-sm rounded-xl transition-all flex items-center justify-center gap-2"
                                            >
                                                <HelpCircle size={16} /> Need Help?
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
