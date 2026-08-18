import { useState } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { collection, addDoc, serverTimestamp, doc, updateDoc, query, where, getDocs } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import { createPortal } from 'react-dom';
import {
    X, Star, ArrowRight, ArrowLeft, Loader2, MessageSquare,
    Send, CheckCircle2, Eye
} from 'lucide-react';
import { createNotification } from '../utils/notificationService';
import { submitOwnerReview, submitPropertyReview } from '../utils/reviewService';
import logger from '../utils/logger';

const OWNER_CATEGORIES = [
    { key: 'communication',  label: 'Communication',  emoji: '💬' },
    { key: 'responsiveness', label: 'Responsiveness', emoji: '⚡' },
    { key: 'cleanliness',    label: 'Cleanliness',    emoji: '✨' },
    { key: 'accuracy',       label: 'Accuracy',       emoji: '🎯' },
];

const PROPERTY_CATEGORIES = [
    { key: 'location',      label: 'Location',      emoji: '📍' },
    { key: 'value',         label: 'Value',         emoji: '💰' },
    { key: 'cleanliness',   label: 'Cleanliness',   emoji: '✨' },
    { key: 'accuracy',      label: 'Accuracy',      emoji: '🎯' },
    { key: 'communication', label: 'Communication', emoji: '💬' },
];

const MIN_CHARS = 30;
const MAX_CHARS = 500;

/* ── StarRating sub-component ── */
function StarRating({ value, onChange, size = 32 }) {
    const [hover, setHover] = useState(0);
    return (
        <div className="flex items-center gap-1">
            {[1, 2, 3, 4, 5].map((star) => (
                <motion.button
                    key={star} type="button"
                    onMouseEnter={() => setHover(star)}
                    onMouseLeave={() => setHover(0)}
                    onClick={() => onChange(star)}
                    whileHover={{ scale: 1.22 }}
                    whileTap={{ scale: 0.82 }}
                    transition={{ type: 'spring', stiffness: 600, damping: 18 }}
                    className="focus:outline-none"
                >
                    <Star
                        size={size}
                        className={`transition-colors duration-100 ${(hover || value) >= star
                            ? 'text-amber-400 fill-amber-400'
                            : 'text-slate-200 dark:text-slate-700'
                        }`}
                        strokeWidth={1.5}
                    />
                </motion.button>
            ))}
        </div>
    );
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
    hidden:  { opacity: 0, scale: 0.86, y: 32 },
    visible: { opacity: 1, scale: 1,    y: 0,  transition: { type: 'spring', stiffness: 380, damping: 28, mass: 0.9 } },
    exit:    { opacity: 0, scale: 0.86, y: 32,  transition: { duration: 0.16 } },
};

const stepV = {
    enter:  (dir) => ({ opacity: 0, x: dir > 0 ? 72 : -72, scale: 0.96 }),
    center: { opacity: 1, x: 0, scale: 1, transition: { type: 'spring', stiffness: 420, damping: 36 } },
    exit:   (dir) => ({ opacity: 0, x: dir > 0 ? -72 : 72, scale: 0.96, transition: { duration: 0.14 } }),
};

const backBtnV = {
    hidden:  { opacity: 0, x: -10 },
    visible: { opacity: 1, x: 0, transition: { type: 'spring', stiffness: 400, damping: 28 } },
    exit:    { opacity: 0, x: -10, transition: { duration: 0.1 } },
};

const categoryRowV = {
    hidden:  { opacity: 0, x: -14 },
    visible: (i) => ({
        opacity: 1, x: 0,
        transition: { type: 'spring', stiffness: 360, damping: 28, delay: i * 0.055 },
    }),
};

const pillV = {
    hidden:  { opacity: 0, scale: 0.7 },
    visible: (i) => ({
        opacity: 1, scale: 1,
        transition: { type: 'spring', stiffness: 480, damping: 20, delay: i * 0.05 },
    }),
};

const heroIconV = {
    hidden:  { scale: 0, rotate: -30, opacity: 0 },
    visible: { scale: 1, rotate: 0,   opacity: 1, transition: { type: 'spring', stiffness: 500, damping: 18, delay: 0.1 } },
};

const textFadeUpV = {
    hidden:  { opacity: 0, y: 12 },
    visible: (d) => ({ opacity: 1, y: 0, transition: { delay: d ?? 0.12 } }),
};

export default function WriteReviewModal({ isOpen, onClose, moveIn, ownerId, ownerName, mode = 'owner' }) {
    const { currentUser, userData } = useAuth();
    const toast   = useToast();
    const reduced = useReducedMotion();

    const CATEGORIES = mode === 'property' ? PROPERTY_CATEGORIES : OWNER_CATEGORIES;

    const [step,    setStep]    = useState(0); // 0=ratings, 1=text, 2=preview, 3=done
    const [dir,     setDir]     = useState(1);
    const [loading, setLoading] = useState(false);

    const [ratings, setRatings] = useState({
        overall: 0, communication: 0, responsiveness: 0,
        cleanliness: 0, accuracy: 0, location: 0, value: 0,
    });
    const [body, setBody] = useState('');

    const goNext = () => { setDir(1);  setStep(s => s + 1); };
    const goBack = () => { setDir(-1); setStep(s => s - 1); };

    const canStep0 = ratings.overall > 0 && CATEGORIES.every(c => ratings[c.key] > 0);
    const canStep1 = body.trim().length >= MIN_CHARS;

    const handleSubmit = async () => {
        if (!currentUser || !moveIn) return;
        setLoading(true);
        try {
            const reviewCollection = mode === 'property' ? 'propertyReviews' : 'ownerReviews';
            const existing = await getDocs(
                query(collection(db, reviewCollection),
                    where('moveInId', '==', moveIn.id),
                    where('reviewerId', '==', currentUser.uid))
            );
            if (!existing.empty) {
                toast.warning(`You've already submitted a ${mode} review for this move-in.`);
                onClose(); return;
            }
            const reviewerName   = userData?.fullName || userData?.name || currentUser.displayName || 'Anonymous';
            const reviewerAvatar = currentUser.photoURL || null;
            const reviewData = {
                reviewerId: currentUser.uid, reviewerName, reviewerAvatar,
                moveInId: moveIn.id, propertyId: moveIn.propertyId, propertyName: moveIn.propertyName,
                rating: ratings.overall,
                categories: CATEGORIES.reduce((acc, cat) => { acc[cat.key] = ratings[cat.key]; return acc; }, {}),
                body: body.trim(),
            };
            if (mode === 'property') {
                reviewData.ownerId = ownerId;
                await submitPropertyReview(moveIn.propertyId, reviewData);
            } else {
                await submitOwnerReview(ownerId, reviewData);
            }
            if (moveIn.firestoreId && mode === 'owner') {
                await updateDoc(doc(db, 'tenantMoveIns', moveIn.firestoreId), { hasReviewed: true });
            } else if (moveIn.firestoreId && mode === 'property') {
                await updateDoc(doc(db, 'tenantMoveIns', moveIn.firestoreId), { hasReviewedProperty: true });
            }
            setDir(1); setStep(3);
        } catch (err) {
            logger.error('Review submit error:', err);
            toast.error('Failed to submit review. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const handleClose = () => {
        setStep(0); setDir(1);
        setRatings({ overall: 0, communication: 0, responsiveness: 0, cleanliness: 0, accuracy: 0, location: 0, value: 0 });
        setBody(''); onClose();
    };

    if (typeof document === 'undefined') return null;

    const totalSteps  = 3;
    const progressPct = step < 3 ? `${((step + 1) / totalSteps) * 100}%` : '100%';

    const bV = reduced ? { hidden: { opacity: 0 }, visible: { opacity: 1 }, exit: { opacity: 0 } } : backdropV;
    const cV = reduced ? { hidden: { opacity: 0 }, visible: { opacity: 1 }, exit: { opacity: 0 } } : cardV;
    const sV = reduced
        ? { enter: () => ({ opacity: 0 }), center: { opacity: 1, x: 0, scale: 1 }, exit: () => ({ opacity: 0 }) }
        : stepV;

    return createPortal(
        <AnimatePresence mode="wait">
            {isOpen && (
                <motion.div
                    key="review-backdrop"
                    variants={bV} initial="hidden" animate="visible" exit="exit"
                    className="fixed inset-0 z-[70] flex items-center justify-center p-4"
                    onClick={handleClose}
                >
                    <div className="absolute inset-0 bg-slate-900/75 backdrop-blur-xl" />

                    <motion.div
                        key="review-card"
                        variants={cV} initial="hidden" animate="visible" exit="exit"
                        className="relative w-full max-w-lg bg-white dark:bg-slate-900 rounded-[40px] shadow-2xl max-h-[90dvh] overflow-y-auto transform-gpu will-change-transform"
                        onClick={e => e.stopPropagation()}
                    >
                        {/* Accent stripe */}
                        <div className="h-1 w-full rounded-t-[40px] bg-gradient-to-r from-amber-400 via-primary to-indigo-500" />
                        <div className="w-10 h-1 bg-slate-200 dark:bg-slate-700 rounded-full mx-auto mt-3" />

                        {/* ── Header ── */}
                        <div className="px-8 pt-5 pb-4">
                            <div className="flex items-center justify-between mb-4">
                                <AnimatePresence mode="wait">
                                    {step > 0 && step < 3 ? (
                                        <motion.button
                                            key="back"
                                            variants={backBtnV} initial="hidden" animate="visible" exit="exit"
                                            onClick={goBack}
                                            className="size-9 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                                            whileTap={{ scale: 0.82 }}
                                        >
                                            <ArrowLeft size={18} strokeWidth={2.5} />
                                        </motion.button>
                                    ) : <div className="size-9" />}
                                </AnimatePresence>

                                <div className="text-center">
                                    {step < 3 && (
                                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                                            Step {step + 1} of {totalSteps}
                                        </p>
                                    )}
                                </div>

                                <motion.button
                                    onClick={handleClose}
                                    className="size-9 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-500"
                                    whileHover={{ scale: 1.14, rotate: 90 }}
                                    whileTap={{ scale: 0.82 }}
                                    transition={{ type: 'spring', stiffness: 520, damping: 18 }}
                                >
                                    <X size={18} strokeWidth={2.5} />
                                </motion.button>
                            </div>

                            {step < 3 && (
                                <div className="h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                                    <motion.div
                                        className="h-full bg-gradient-to-r from-amber-400 to-primary rounded-full"
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

                                {/* STEP 0 — Category Ratings */}
                                {step === 0 && (
                                    <motion.div
                                        key="rv-s0" custom={dir}
                                        variants={sV} initial="enter" animate="center" exit="exit"
                                        className="px-8 pb-8"
                                    >
                                        <motion.div className="mb-7" custom={0.06} variants={textFadeUpV} initial="hidden" animate="visible">
                                            <h2 className="text-xl font-black text-slate-900 dark:text-white mb-1">Rate your experience</h2>
                                            <p className="text-sm text-slate-500 font-medium">
                                                Reviewing <span className="font-bold text-primary dark:text-indigo-400">
                                                    {mode === 'property' ? moveIn?.propertyName : ownerName || 'this landlord'}
                                                </span>
                                            </p>
                                        </motion.div>

                                        {/* Overall star rating block */}
                                        <motion.div
                                            className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-3xl p-6 mb-6 flex flex-col items-center"
                                            initial={{ opacity: 0, y: 14, scale: 0.96 }} animate={{ opacity: 1, y: 0, scale: 1 }}
                                            transition={{ type: 'spring', stiffness: 360, damping: 28, delay: 0.1 }}
                                        >
                                            <p className="text-white/60 text-xs font-black uppercase tracking-widest mb-3">Overall Rating</p>
                                            <StarRating value={ratings.overall} onChange={v => setRatings(r => ({ ...r, overall: v }))} size={40} />
                                            <AnimatePresence mode="wait">
                                                {ratings.overall > 0 && (
                                                    <motion.p
                                                        key={ratings.overall}
                                                        initial={{ opacity: 0, y: 6, scale: 0.85 }}
                                                        animate={{ opacity: 1, y: 0, scale: 1 }}
                                                        exit={{ opacity: 0, y: -6 }}
                                                        transition={{ type: 'spring', stiffness: 500, damping: 22 }}
                                                        className="text-white font-black text-2xl mt-3"
                                                    >
                                                        {['', 'Terrible', 'Bad', 'OK', 'Great', 'Exceptional'][ratings.overall]}
                                                    </motion.p>
                                                )}
                                            </AnimatePresence>
                                        </motion.div>

                                        {/* Category ratings */}
                                        <div className="space-y-3 mb-7">
                                            {CATEGORIES.map((cat, i) => (
                                                <motion.div
                                                    key={cat.key}
                                                    custom={i} variants={categoryRowV} initial="hidden" animate="visible"
                                                    className="flex items-center justify-between bg-slate-50 dark:bg-slate-800 p-4 rounded-2xl"
                                                >
                                                    <div className="flex items-center gap-3">
                                                        <span className="text-xl">{cat.emoji}</span>
                                                        <span className="text-sm font-black text-slate-700 dark:text-slate-200">{cat.label}</span>
                                                    </div>
                                                    <StarRating
                                                        value={ratings[cat.key]}
                                                        onChange={v => setRatings(r => ({ ...r, [cat.key]: v }))}
                                                        size={22}
                                                    />
                                                </motion.div>
                                            ))}
                                        </div>

                                        <motion.button
                                            onClick={goNext} disabled={!canStep0}
                                            className="w-full py-5 bg-primary text-white font-black rounded-[20px] shadow-xl shadow-primary/25 flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed"
                                            whileHover={canStep0 ? { scale: 1.025, y: -2 } : {}}
                                            whileTap={canStep0 ? { scale: 0.96 } : {}}
                                            transition={{ type: 'spring', stiffness: 460, damping: 22 }}
                                            initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                                        >
                                            Continue <ArrowRight size={18} />
                                        </motion.button>
                                    </motion.div>
                                )}

                                {/* STEP 1 — Written Review */}
                                {step === 1 && (
                                    <motion.div
                                        key="rv-s1" custom={dir}
                                        variants={sV} initial="enter" animate="center" exit="exit"
                                        className="px-8 pb-8"
                                    >
                                        <motion.div className="mb-6" custom={0.06} variants={textFadeUpV} initial="hidden" animate="visible">
                                            <h2 className="text-xl font-black text-slate-900 dark:text-white mb-1">Describe your experience</h2>
                                            <p className="text-sm text-slate-500 font-medium">Be honest — future tenants rely on your review.</p>
                                        </motion.div>

                                        <motion.div
                                            className="relative"
                                            initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
                                        >
                                            <motion.textarea
                                                value={body}
                                                onChange={e => setBody(e.target.value.slice(0, MAX_CHARS))}
                                                placeholder={mode === 'property'
                                                    ? 'Tell future renters about this property — location, noise levels, what was great…'
                                                    : 'Tell future renters about this landlord — communication style, reliability, responsiveness…'}
                                                rows={7}
                                                className="w-full bg-slate-50 dark:bg-slate-800 border-2 border-transparent focus:border-primary/30 rounded-3xl p-5 text-sm text-slate-700 dark:text-slate-200 placeholder:text-slate-400 font-medium resize-none outline-none transition-all leading-relaxed"
                                                animate={body.length >= MIN_CHARS ? { borderColor: '#10b981' } : {}}
                                                transition={{ duration: 0.2 }}
                                            />
                                            <div className={`absolute bottom-4 right-5 text-xs font-bold transition-colors ${body.length < MIN_CHARS ? 'text-slate-400' : 'text-emerald-500'}`}>
                                                {body.length}/{MAX_CHARS}
                                            </div>
                                        </motion.div>

                                        <AnimatePresence>
                                            {body.length > 0 && body.length < MIN_CHARS && (
                                                <motion.p
                                                    initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
                                                    className="text-xs text-amber-500 font-bold mt-2 ml-1"
                                                >
                                                    {MIN_CHARS - body.length} more characters needed
                                                </motion.p>
                                            )}
                                        </AnimatePresence>

                                        <motion.button
                                            onClick={goNext} disabled={!canStep1}
                                            className="w-full mt-6 py-5 bg-primary text-white font-black rounded-[20px] shadow-xl shadow-primary/25 flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed"
                                            whileHover={canStep1 ? { scale: 1.025, y: -2 } : {}}
                                            whileTap={canStep1 ? { scale: 0.96 } : {}}
                                            transition={{ type: 'spring', stiffness: 460, damping: 22 }}
                                            initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} // delayed entrance
                                        >
                                            Preview Review <Eye size={18} />
                                        </motion.button>
                                    </motion.div>
                                )}

                                {/* STEP 2 — Preview */}
                                {step === 2 && (
                                    <motion.div
                                        key="rv-s2" custom={dir}
                                        variants={sV} initial="enter" animate="center" exit="exit"
                                        className="px-8 pb-8"
                                    >
                                        <motion.div className="mb-6" custom={0.06} variants={textFadeUpV} initial="hidden" animate="visible">
                                            <h2 className="text-xl font-black text-slate-900 dark:text-white mb-1">Review Preview</h2>
                                            <p className="text-sm text-slate-500 font-medium">This is how your review will appear publicly.</p>
                                        </motion.div>

                                        {/* Preview card */}
                                        <motion.div
                                            className="bg-slate-50 dark:bg-slate-800 rounded-3xl p-6 mb-6 space-y-5"
                                            initial={{ opacity: 0, y: 12, scale: 0.97 }} animate={{ opacity: 1, y: 0, scale: 1 }}
                                            transition={{ type: 'spring', stiffness: 360, damping: 28, delay: 0.08 }}
                                        >
                                            {/* Reviewer */}
                                            <div className="flex items-center gap-3">
                                                <motion.div
                                                    className="size-10 rounded-full bg-primary/10 flex items-center justify-center text-primary dark:text-indigo-400 font-black text-base"
                                                    initial={{ scale: 0 }} animate={{ scale: 1 }}
                                                    transition={{ type: 'spring', stiffness: 500, damping: 20, delay: 0.15 }}
                                                >
                                                    {(userData?.fullName || currentUser?.displayName || 'U')[0].toUpperCase()}
                                                </motion.div>
                                                <div>
                                                    <p className="font-black text-slate-900 dark:text-white text-sm">
                                                        {userData?.fullName || currentUser?.displayName || 'You'}
                                                    </p>
                                                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Verified Tenant</p>
                                                </div>
                                            </div>

                                            {/* Stars */}
                                            <div className="flex items-center gap-1">
                                                {[1, 2, 3, 4, 5].map((s, i) => (
                                                    <motion.div
                                                        key={s}
                                                        initial={{ opacity: 0, scale: 0 }} animate={{ opacity: 1, scale: 1 }}
                                                        transition={{ type: 'spring', stiffness: 500, damping: 18, delay: 0.1 + i * 0.04 }}
                                                    >
                                                        <Star
                                                            size={18}
                                                            className={ratings.overall >= s ? 'text-amber-400 fill-amber-400' : 'text-slate-200 dark:text-slate-700'}
                                                            strokeWidth={1.5}
                                                        />
                                                    </motion.div>
                                                ))}
                                                <span className="ml-2 text-sm font-black text-slate-600 dark:text-slate-300">{ratings.overall}.0</span>
                                            </div>

                                            {/* Body */}
                                            <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed font-medium">{body}</p>

                                            {/* Category pills */}
                                            <div className="flex flex-wrap gap-2">
                                                {CATEGORIES.map((cat, i) => (
                                                    <motion.div
                                                        key={cat.key}
                                                        custom={i} variants={pillV} initial="hidden" animate="visible"
                                                        className="flex items-center gap-1.5 bg-white dark:bg-slate-900 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700"
                                                    >
                                                        <span className="text-xs">{cat.emoji}</span>
                                                        <span className="text-[10px] font-black text-slate-600 dark:text-slate-300">{cat.label}</span>
                                                        <span className="text-[10px] font-black text-amber-500">{ratings[cat.key]}/5</span>
                                                    </motion.div>
                                                ))}
                                            </div>
                                        </motion.div>

                                        <motion.button
                                            onClick={handleSubmit} disabled={loading}
                                            className="w-full py-5 bg-gradient-to-r from-primary to-indigo-600 text-white font-black rounded-[20px] shadow-xl shadow-primary/25 flex items-center justify-center gap-2 disabled:opacity-70"
                                            whileHover={{ scale: 1.025, y: -2 }}
                                            whileTap={{ scale: 0.96 }}
                                            transition={{ type: 'spring', stiffness: 460, damping: 22 }}
                                            initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                                        >
                                            {loading
                                                ? <><Loader2 size={20} className="animate-spin" /> Submitting…</>
                                                : <><Send size={18} /> Publish Review</>}
                                        </motion.button>
                                    </motion.div>
                                )}

                                {/* STEP 3 — Done */}
                                {step === 3 && (
                                    <motion.div
                                        key="rv-s3" custom={dir}
                                        variants={sV} initial="enter" animate="center" exit="exit"
                                        className="px-8 pb-10 pt-4 flex flex-col items-center text-center"
                                    >
                                        {/* Hero icon */}
                                        <motion.div
                                            className="size-28 rounded-[32px] bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center shadow-2xl shadow-amber-500/30 mb-8 transform-gpu"
                                            variants={heroIconV} initial="hidden" animate="visible"
                                        >
                                            <Star size={52} className="text-white fill-white drop-shadow-lg" />
                                        </motion.div>

                                        <motion.div
                                            custom={0.3} variants={textFadeUpV} initial="hidden" animate="visible"
                                        >
                                            <h2 className="text-2xl font-black text-slate-900 dark:text-white mb-3">
                                                Review Published! ⭐
                                            </h2>
                                            <p className="text-slate-500 dark:text-slate-400 font-medium text-sm max-w-xs mx-auto leading-relaxed mb-10">
                                                Thank you for helping future tenants make better decisions. Your review is now live.
                                            </p>
                                        </motion.div>

                                        <motion.button
                                            onClick={handleClose}
                                            className="w-full py-5 bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-black rounded-[20px] shadow-xl"
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            whileHover={{ scale: 1.025, y: -2 }}
                                            whileTap={{ scale: 0.96 }}
                                            transition={{ type: 'spring', stiffness: 460, damping: 22, delay: 0.46 }}
                                        >
                                            Done
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
    );
}
