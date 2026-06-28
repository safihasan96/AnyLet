import { useState } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { collection, addDoc, serverTimestamp, query, where, getDocs } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import { createPortal } from 'react-dom';
import { X, Home, CheckCircle2, Star, ArrowRight, Loader2, Building2 } from 'lucide-react';
import { createNotification } from '../utils/notificationService';
import logger from '../utils/logger';

/* ═══════════════════════════════════════════
   VARIANTS — decoupled per FM engineering rules
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

const heroV = {
    hidden:  { scale: 0, rotate: -30, opacity: 0 },
    visible: { scale: 1, rotate: 0,   opacity: 1, transition: { type: 'spring', stiffness: 480, damping: 18, delay: 0.08 } },
};

const badgeV = {
    hidden:  { scale: 0, opacity: 0 },
    visible: { scale: 1, opacity: 1, transition: { type: 'spring', stiffness: 600, damping: 18, delay: 0.22 } },
};

const listItemV = {
    hidden:  { opacity: 0, x: -14 },
    visible: (i) => ({
        opacity: 1, x: 0,
        transition: { type: 'spring', stiffness: 360, damping: 28, delay: i * 0.07 },
    }),
};

const textFadeV = {
    hidden:  { opacity: 0, y: 10 },
    visible: (d) => ({ opacity: 1, y: 0, transition: { delay: d ?? 0.12 } }),
};

/* Orbiting star variant */
const orbitStarV = (i) => ({
    hidden:  { opacity: 0, scale: 0 },
    visible: {
        opacity: 1, scale: 1,
        transition: { delay: 0.18 + i * 0.06, type: 'spring', stiffness: 480, damping: 18 },
    },
});

export default function MoveInModal({ isOpen, onClose, request, onMoveInSuccess }) {
    const { currentUser } = useAuth();
    const toast    = useToast();
    const reduced  = useReducedMotion();

    const [step,    setStep]    = useState(0); // 0=confirm, 1=success
    const [dir,     setDir]     = useState(1);
    const [loading, setLoading] = useState(false);

    const propertyName  = request?.propertyName  || 'this property';
    const propertyImage = request?.propertyImage  || null;

    const handleConfirm = async () => {
        if (!currentUser || !request) return;
        setLoading(true);
        try {
            const existing = await getDocs(
                query(
                    collection(db, 'tenantMoveIns'),
                    where('viewingRequestId', '==', request.id),
                    where('tenantId', '==', currentUser.uid)
                )
            );
            if (!existing.empty) {
                toast.warning('You have already marked this property as moved in.');
                onClose(); return;
            }
            await addDoc(collection(db, 'tenantMoveIns'), {
                tenantId:         currentUser.uid,
                ownerId:          request.ownerId,
                propertyId:       request.propertyId,
                propertyName:     request.propertyName,
                propertyImage:    request.propertyImage || null,
                viewingRequestId: request.id,
                movedInAt:        serverTimestamp(),
                paymentStatus:    'pending',
                hasReviewed:      false,
            });
            if (request.ownerId) {
                await createNotification(
                    request.ownerId, 'system', 'Tenant Moved In',
                    `A tenant confirmed they moved into ${request.propertyName || 'your property'}.`,
                    '/requests'
                );
            }
            setDir(1); setStep(1);
            if (onMoveInSuccess) onMoveInSuccess();
        } catch (err) {
            logger.error('Move-in error:', err);
            toast.error('Something went wrong. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const handleClose = () => { setStep(0); setDir(1); onClose(); };
    const handleWriteReview = () => { handleClose(); if (onMoveInSuccess) onMoveInSuccess('writeReview'); };

    if (typeof document === 'undefined') return null;

    const bV = reduced ? { hidden: { opacity: 0 }, visible: { opacity: 1 }, exit: { opacity: 0 } } : backdropV;
    const cV = reduced ? { hidden: { opacity: 0 }, visible: { opacity: 1 }, exit: { opacity: 0 } } : cardV;
    const sV = reduced
        ? { enter: () => ({ opacity: 0 }), center: { opacity: 1, x: 0, scale: 1 }, exit: () => ({ opacity: 0 }) }
        : stepV;

    return createPortal(
        <AnimatePresence mode="wait">
            {isOpen && (
                <motion.div
                    key="movein-backdrop"
                    variants={bV} initial="hidden" animate="visible" exit="exit"
                    className="fixed inset-0 z-[60] flex items-center justify-center p-4"
                    onClick={handleClose}
                >
                    <div className="absolute inset-0 bg-slate-900/75 backdrop-blur-xl" />

                    <motion.div
                        key="movein-card"
                        variants={cV} initial="hidden" animate="visible" exit="exit"
                        className="relative w-full max-w-md bg-white dark:bg-slate-900 rounded-[40px] shadow-2xl max-h-[90dvh] overflow-y-auto transform-gpu will-change-transform"
                        onClick={e => e.stopPropagation()}
                    >
                        {/* Accent stripe */}
                        <div className="h-1 w-full rounded-t-[40px] bg-gradient-to-r from-primary via-indigo-500 to-purple-500" />
                        <div className="w-10 h-1 bg-slate-200 dark:bg-slate-700 rounded-full mx-auto mt-3 mb-2" />

                        {/* Close button */}
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

                                {/* ── STEP 0: Confirm ── */}
                                {step === 0 && (
                                    <motion.div
                                        key="mi-s0" custom={dir}
                                        variants={sV} initial="enter" animate="center" exit="exit"
                                        className="p-8 pt-10"
                                    >
                                        {/* Property preview */}
                                        <motion.div
                                            className="relative w-full h-44 rounded-3xl overflow-hidden mb-8 bg-slate-100 dark:bg-slate-800"
                                            initial={{ opacity: 0, scale: 0.94 }} animate={{ opacity: 1, scale: 1 }}
                                            transition={{ type: 'spring', stiffness: 360, damping: 28 }}
                                        >
                                            {propertyImage
                                                ? <img loading="lazy" src={propertyImage} alt={propertyName} className="w-full h-full object-cover" />
                                                : <div className="w-full h-full flex items-center justify-center">
                                                    <Building2 size={48} className="text-slate-300 dark:text-slate-600" />
                                                  </div>
                                            }
                                            <div className="absolute inset-0 bg-gradient-to-t from-slate-900/60 via-transparent to-transparent" />
                                            <div className="absolute bottom-4 left-4 right-4">
                                                <p className="text-white font-black text-lg leading-tight truncate drop-shadow-lg">{propertyName}</p>
                                            </div>
                                        </motion.div>

                                        <motion.div
                                            className="text-center mb-8"
                                            custom={0.14} variants={textFadeV} initial="hidden" animate="visible"
                                        >
                                            <div className="inline-flex items-center gap-2 bg-primary/10 text-primary dark:text-indigo-400 px-4 py-2 rounded-full text-xs font-black uppercase tracking-widest mb-4">
                                                <Home size={14} /> Move-In Declaration
                                            </div>
                                            <h2 className="text-2xl font-black text-slate-900 dark:text-white mb-3 leading-tight">
                                                Did you move into this property?
                                            </h2>
                                            <p className="text-slate-500 dark:text-slate-400 font-medium text-sm leading-relaxed">
                                                Marking as moved in lets you leave a verified review — helping thousands of future renters.
                                            </p>
                                        </motion.div>

                                        <motion.div
                                            className="space-y-3"
                                            custom={0.26} variants={textFadeV} initial="hidden" animate="visible"
                                        >
                                            <motion.button
                                                onClick={handleConfirm}
                                                disabled={loading}
                                                className="w-full py-5 bg-primary text-white font-black text-base rounded-[20px] shadow-xl shadow-primary/25 flex items-center justify-center gap-2 disabled:opacity-70"
                                                whileHover={{ scale: 1.025, y: -2 }}
                                                whileTap={{ scale: 0.96 }}
                                                transition={{ type: 'spring', stiffness: 460, damping: 22 }}
                                            >
                                                {loading
                                                    ? <><Loader2 size={20} className="animate-spin" /> Confirming…</>
                                                    : <><CheckCircle2 size={20} /> Yes, I Moved In</>}
                                            </motion.button>
                                            <motion.button
                                                onClick={handleClose}
                                                className="w-full py-4 text-slate-500 dark:text-slate-400 font-bold text-sm hover:text-slate-700 dark:hover:text-slate-200 transition-colors"
                                                whileTap={{ scale: 0.97 }}
                                            >
                                                Not yet
                                            </motion.button>
                                        </motion.div>
                                    </motion.div>
                                )}

                                {/* ── STEP 1: Success ── */}
                                {step === 1 && (
                                    <motion.div
                                        key="mi-s1" custom={dir}
                                        variants={sV} initial="enter" animate="center" exit="exit"
                                        className="p-8 pt-12 pb-10"
                                    >
                                        <div className="flex flex-col items-center text-center mb-10">
                                            {/* Animated icon with orbiting stars */}
                                            <motion.div
                                                className="relative mb-6 transform-gpu"
                                                variants={heroV} initial="hidden" animate="visible"
                                            >
                                                <div className="size-28 rounded-[32px] bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center shadow-2xl shadow-emerald-500/30">
                                                    <Home size={52} className="text-white drop-shadow-lg" />
                                                </div>
                                                {[0, 60, 120, 180, 240, 300].map((deg, i) => (
                                                    <motion.div
                                                        key={i}
                                                        variants={orbitStarV(i)} initial="hidden" animate="visible"
                                                        className="absolute"
                                                        style={{
                                                            top: '50%', left: '50%',
                                                            transform: `rotate(${deg}deg) translateX(62px) translateY(-50%)`,
                                                        }}
                                                    >
                                                        <Star size={10} className="text-amber-400 fill-amber-400" />
                                                    </motion.div>
                                                ))}
                                            </motion.div>

                                            <motion.div
                                                initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
                                                transition={{ delay: 0.3 }}
                                            >
                                                <div className="inline-flex items-center gap-1.5 bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 px-3 py-1.5 rounded-full text-xs font-black uppercase tracking-widest mb-4">
                                                    <CheckCircle2 size={12} strokeWidth={3} /> Move-In Recorded
                                                </div>
                                                <h2 className="text-2xl font-black text-slate-900 dark:text-white mb-3">
                                                    Welcome to your new home! 🎉
                                                </h2>
                                                <p className="text-slate-500 dark:text-slate-400 font-medium text-sm max-w-xs mx-auto leading-relaxed">
                                                    Your move-in is confirmed. Share your experience with future renters — your review makes a real difference.
                                                </p>
                                            </motion.div>
                                        </div>

                                        <motion.div
                                            className="space-y-3"
                                            initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
                                            transition={{ delay: 0.46 }}
                                        >
                                            <motion.button
                                                onClick={handleWriteReview}
                                                className="w-full py-5 bg-gradient-to-r from-primary to-indigo-600 text-white font-black text-base rounded-[20px] shadow-xl shadow-primary/25 flex items-center justify-center gap-2"
                                                whileHover={{ scale: 1.025, y: -2 }}
                                                whileTap={{ scale: 0.96 }}
                                                transition={{ type: 'spring', stiffness: 460, damping: 22 }}
                                            >
                                                <Star size={20} className="fill-white" /> Write a Review <ArrowRight size={18} />
                                            </motion.button>
                                            <motion.button
                                                onClick={handleClose}
                                                className="w-full py-4 text-slate-500 dark:text-slate-400 font-bold text-sm hover:text-slate-700 dark:hover:text-slate-200 transition-colors"
                                                whileTap={{ scale: 0.97 }}
                                            >
                                                I'll do it later
                                            </motion.button>
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
