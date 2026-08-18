import { useState } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Phone, X, ArrowRight, AlertCircle, CheckCircle2 } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

const BD_PHONE_RE  = /^(?:\+880|0)1[3-9]\d{8}$/;
const INTL_PHONE_RE = /^\+?[1-9]\d{6,14}$/;

function isValidPhone(num) {
    const clean = num.replace(/\s|-/g, '');
    return BD_PHONE_RE.test(clean) || INTL_PHONE_RE.test(clean);
}

/* ═══════════════════════════════════════════
   VARIANTS — all decoupled from JSX
═══════════════════════════════════════════ */
const backdropV = {
    hidden:  { opacity: 0 },
    visible: { opacity: 1, transition: { duration: 0.22 } },
    exit:    { opacity: 0, transition: { duration: 0.18 } },
};

const cardV = {
    hidden:  { opacity: 0, scale: 0.86, y: 28 },
    visible: { opacity: 1, scale: 1,    y: 0,  transition: { type: 'spring', stiffness: 400, damping: 28, mass: 0.85 } },
    exit:    { opacity: 0, scale: 0.86, y: 28,  transition: { duration: 0.16 } },
};

const iconBounceV = {
    hidden:  { scale: 0, rotate: -25, opacity: 0 },
    visible: { scale: 1, rotate: 0,   opacity: 1, transition: { type: 'spring', stiffness: 520, damping: 18, delay: 0.1 } },
};

const textFadeV = {
    hidden:  { opacity: 0, y: 10 },
    visible: (d) => ({ opacity: 1, y: 0, transition: { delay: d ?? 0.15 } }),
};

const inputFocusV = {
    rest:  { borderColor: 'transparent' },
    focus: { borderColor: 'rgba(26,34,127,0.4)', transition: { duration: 0.18 } },
};

const errorV = {
    hidden:  { opacity: 0, height: 0, y: -4 },
    visible: { opacity: 1, height: 'auto', y: 0, transition: { type: 'spring', stiffness: 400, damping: 28 } },
    exit:    { opacity: 0, height: 0,      y: -4, transition: { duration: 0.14 } },
};

const successTickV = {
    hidden:  { scale: 0, opacity: 0 },
    visible: { scale: 1, opacity: 1, transition: { type: 'spring', stiffness: 600, damping: 18 } },
    exit:    { scale: 0, opacity: 0, transition: { duration: 0.12 } },
};

export default function PhoneVerifyModal({ isOpen, onClose, onSuccess }) {
    const { updateUserProfile } = useAuth();
    const navigate = useNavigate();
    const reduced  = useReducedMotion();

    const [phone,  setPhone]  = useState('');
    const [error,  setError]  = useState('');
    const [saving, setSaving] = useState(false);
    const [done,   setDone]   = useState(false);

    const isValid = phone.length > 0 && isValidPhone(phone.replace(/\s|-/g, ''));

    async function handleSubmit() {
        const clean = phone.replace(/\s|-/g, '');
        if (!clean)             { setError('Please enter your phone number.'); return; }
        if (!isValidPhone(clean)) {
            setError('Enter a valid BD number (01XXXXXXXXX) or international number with country code.');
            return;
        }
        setSaving(true);
        try {
            await updateUserProfile({
                'personalDetails.phoneNumber':    clean,
                'personalDetails.isPhoneVerified': true,
            });
            setDone(true);
            setTimeout(() => {
                setPhone(''); setError(''); setDone(false);
                onClose(); onSuccess?.();
            }, 900);
        } catch {
            setError('Failed to save. Please try again.');
        } finally {
            setSaving(false);
        }
    }

    const handleClose = () => { setPhone(''); setError(''); setDone(false); onClose(); };

    if (typeof document === 'undefined') return null;

    const bV = reduced ? { hidden: { opacity: 0 }, visible: { opacity: 1 }, exit: { opacity: 0 } } : backdropV;
    const cV = reduced ? { hidden: { opacity: 0 }, visible: { opacity: 1 }, exit: { opacity: 0 } } : cardV;

    return createPortal(
        <AnimatePresence mode="wait">
            {isOpen && (
                <motion.div
                    key="phone-backdrop"
                    variants={bV} initial="hidden" animate="visible" exit="exit"
                    className="fixed inset-0 z-[80] flex items-center justify-center p-4"
                    onClick={handleClose}
                >
                    <div className="absolute inset-0 bg-slate-900/75 backdrop-blur-xl" />

                    <motion.div
                        key="phone-card"
                        variants={cV} initial="hidden" animate="visible" exit="exit"
                        className="relative w-full max-w-sm bg-white dark:bg-slate-900 rounded-[36px] p-8 shadow-2xl transform-gpu will-change-transform"
                        onClick={e => e.stopPropagation()}
                    >
                        {/* Accent stripe */}
                        <div className="h-1 w-full absolute top-0 left-0 rounded-t-[36px] bg-gradient-to-r from-primary via-indigo-500 to-purple-500" />

                        {/* Close */}
                        <motion.button
                            onClick={handleClose}
                            className="absolute top-5 right-5 p-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-500"
                            whileHover={{ scale: 1.14, rotate: 90 }}
                            whileTap={{ scale: 0.82 }}
                            transition={{ type: 'spring', stiffness: 520, damping: 18 }}
                            aria-label="Close modal"
                        >
                            <X size={16} />
                        </motion.button>

                        {/* Icon */}
                        <motion.div
                            variants={iconBounceV} initial="hidden" animate="visible"
                            className="size-14 rounded-2xl bg-[#1a227f]/10 flex items-center justify-center mb-5 mt-2 transform-gpu"
                        >
                            <Phone size={24} className="text-[#1a227f] dark:text-indigo-400" />
                        </motion.div>

                        <motion.div custom={0.2} variants={textFadeV} initial="hidden" animate="visible">
                            <h2 className="text-xl font-black text-slate-900 dark:text-white mb-1">Add your phone number</h2>
                            <p className="text-sm font-medium text-slate-500 mb-6">
                                Hosts can only be contacted by verified tenants. Add your number to continue.
                            </p>
                        </motion.div>

                        {/* Input row */}
                        <motion.div
                            className="flex gap-2 mb-2"
                            initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.28 }}
                        >
                            <div className="flex items-center px-3 py-3.5 bg-slate-50 dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 rounded-xl font-bold text-slate-500 text-sm whitespace-nowrap">
                                🇧🇩 +880
                            </div>
                            <motion.input
                                type="tel"
                                inputMode="tel"
                                value={phone}
                                onChange={e => { setPhone(e.target.value); setError(''); }}
                                onKeyDown={e => e.key === 'Enter' && handleSubmit()}
                                placeholder="01712 345 678"
                                className="flex-1 px-4 py-3.5 bg-slate-50 dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 rounded-xl font-bold text-slate-900 dark:text-white focus:border-[#1a227f] focus:outline-none transition-colors text-sm"
                                animate={isValid ? { borderColor: '#10b981' } : {}}
                                transition={{ duration: 0.18 }}
                            />
                        </motion.div>

                        {/* Valid tick */}
                        <AnimatePresence>
                            {isValid && !error && (
                                <motion.div
                                    key="valid"
                                    variants={successTickV} initial="hidden" animate="visible" exit="exit"
                                    className="flex items-center gap-1.5 mb-3"
                                >
                                    <CheckCircle2 size={13} className="text-emerald-500" strokeWidth={3} />
                                    <span className="text-xs font-bold text-emerald-500">Looks good!</span>
                                </motion.div>
                            )}
                        </AnimatePresence>

                        {/* Error */}
                        <AnimatePresence>
                            {error && (
                                <motion.div
                                    key="err"
                                    variants={errorV} initial="hidden" animate="visible" exit="exit"
                                    className="flex items-center gap-1.5 mb-3 overflow-hidden"
                                >
                                    <AlertCircle size={13} className="text-rose-500 shrink-0" />
                                    <span className="text-xs font-bold text-rose-500">{error}</span>
                                </motion.div>
                            )}
                        </AnimatePresence>

                        {/* CTA */}
                        <motion.button
                            onClick={handleSubmit}
                            disabled={saving}
                            className="w-full flex items-center justify-center gap-2 py-4 bg-[#1a227f] text-white font-black rounded-2xl shadow-lg shadow-[#1a227f]/20 disabled:opacity-70 mb-3 mt-1"
                            initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.34 }}
                            whileHover={{ scale: 1.025, y: -2 }}
                            whileTap={{ scale: 0.96 }}
                            transition={{ type: 'spring', stiffness: 460, damping: 22 }}
                        >
                            <AnimatePresence mode="wait">
                                {done ? (
                                    <motion.div key="done" initial={{ scale: 0 }} animate={{ scale: 1 }} className="flex items-center gap-2">
                                        <CheckCircle2 size={16} strokeWidth={3} /> Saved!
                                    </motion.div>
                                ) : saving ? (
                                    <motion.span key="saving">Saving…</motion.span>
                                ) : (
                                    <motion.div key="idle" className="flex items-center gap-2">
                                        <ArrowRight size={16} /> Confirm & Continue
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </motion.button>

                        <motion.button
                            onClick={() => { handleClose(); navigate('/onboarding'); }}
                            className="w-full text-center text-xs text-slate-400 font-bold hover:text-slate-600 transition-colors"
                            initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }}
                            whileTap={{ scale: 0.97 }}
                        >
                            Complete full onboarding instead →
                        </motion.button>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>,
        document.body
    );
}
