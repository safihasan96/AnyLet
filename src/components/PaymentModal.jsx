import { useState, useCallback } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import { X, ArrowLeft } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import usePaymentVerification from '../hooks/usePaymentVerification';
import { PAYMENT_METHODS, MERCHANT_NUMBER } from './payment/paymentMethods';
import { backdropV, cardV, stepV, backBtnV } from './payment/motion';
import StepOrderSummary from './payment/StepOrderSummary';
import StepChooseMethod from './payment/StepChooseMethod';
import StepEnterTxnId from './payment/StepEnterTxnId';
import StepVerifying from './payment/StepVerifying';
import StepInvoice from './payment/StepInvoice';
import StepFailed from './payment/StepFailed';

/* ════════════════════════════════════════════════════════════════════════════
   PAYMENT MODAL — step machine + portal shell. Each step's UI lives in its own
   component under ./payment; the /api/verify-payment call lives in
   usePaymentVerification. Step machine:
     0 Order Summary · 1 Choose Method + Send · 2 Enter TxnID ·
     3 Verifying · 4 Success Invoice · 5 Failed
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

    const [step,            setStep]           = useState(0);
    const [dir,             setDir]            = useState(1);
    const [selectedMethod,  setSelectedMethod] = useState(null);
    const [txnId,           setTxnId]          = useState('');
    const [copied,          setCopied]         = useState(false);

    const normalizedBookingType = bookingType || (
        type === 'escrow_deposit'    ? 'deposit' :
        type === 'subscription'      ? 'subscription' :
        type === 'verification_fee'  ? 'verification' :
        type === 'listing_fee'       ? 'listing' :
        'booking'
    );

    const { verifyResult, setVerifyResult, verifyPayment } = usePaymentVerification({
        currentUser, normalizedBookingType, selectedMethod, propertyId, months, metadata, onPaymentSubmitted,
    });

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
        const ok = await verifyPayment(trimmedId);
        setDir(1);
        setStep(ok ? 4 : 5); // → Success Invoice / Failed
    }, [currentUser, txnId, verifyPayment, toast]);

    // ── Reset & Close ─────────────────────────────────────────────────────────
    const handleClose = useCallback(() => {
        setStep(0); setDir(1); setSelectedMethod(null);
        setTxnId(''); setCopied(false); setVerifyResult(null);
        onClose();
    }, [onClose, setVerifyResult]);

    // For listing payments: navigate to /my-listings. For others: just close.
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
    }, [setVerifyResult]);

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
                                {step === 0 && (
                                    <motion.div key="pay-s0" custom={dir} variants={sV} initial="enter" animate="center" exit="exit" className="px-8 pb-8">
                                        <StepOrderSummary
                                            title={title}
                                            subtitle={subtitle}
                                            breakdownItems={breakdownItems}
                                            amount={amount}
                                            onContinue={amount === 0 ? handleClose : goNext}
                                        />
                                    </motion.div>
                                )}

                                {step === 1 && (
                                    <motion.div key="pay-s1" custom={dir} variants={sV} initial="enter" animate="center" exit="exit" className="px-8 pb-8">
                                        <StepChooseMethod
                                            selectedMethod={selectedMethod}
                                            setSelectedMethod={setSelectedMethod}
                                            method={method}
                                            amount={amount}
                                            copied={copied}
                                            onCopyNumber={copyNumber}
                                            onNext={goNext}
                                        />
                                    </motion.div>
                                )}

                                {step === 2 && (
                                    <motion.div key="pay-s2" custom={dir} variants={sV} initial="enter" animate="center" exit="exit" className="px-8 pb-8">
                                        <StepEnterTxnId
                                            txnId={txnId}
                                            setTxnId={setTxnId}
                                            method={method}
                                            onVerify={handleVerifyPayment}
                                        />
                                    </motion.div>
                                )}

                                {step === 3 && (
                                    <motion.div key="pay-s3" custom={dir} variants={sV} initial="enter" animate="center" exit="exit" className="px-8 pb-10 pt-4 flex flex-col items-center text-center">
                                        <StepVerifying />
                                    </motion.div>
                                )}

                                {step === 4 && (
                                    <motion.div key="pay-s4" custom={dir} variants={sV} initial="enter" animate="center" exit="exit" className="px-8 pb-10 pt-4">
                                        <StepInvoice
                                            verifyResult={verifyResult}
                                            txnId={txnId}
                                            method={method}
                                            normalizedBookingType={normalizedBookingType}
                                            propertyName={propertyName}
                                            amount={amount}
                                            onDone={handleSuccessDone}
                                        />
                                    </motion.div>
                                )}

                                {step === 5 && (
                                    <motion.div key="pay-s5" custom={dir} variants={sV} initial="enter" animate="center" exit="exit" className="px-8 pb-10 pt-4 flex flex-col items-center text-center">
                                        <StepFailed verifyResult={verifyResult} onRetry={handleRetry} />
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
