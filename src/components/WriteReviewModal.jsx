import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { collection, addDoc, serverTimestamp, doc, updateDoc, query, where, getDocs } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import { createPortal } from 'react-dom';
import {
    X, Star, ArrowRight, ArrowLeft, Loader2, MessageSquare,
    Send, CheckCircle2, Eye
} from 'lucide-react';

const CATEGORIES = [
    { key: 'communication', label: 'Communication', emoji: '💬' },
    { key: 'responsiveness', label: 'Responsiveness', emoji: '⚡' },
    { key: 'cleanliness', label: 'Cleanliness', emoji: '✨' },
    { key: 'accuracy', label: 'Accuracy', emoji: '🎯' },
];

const MIN_CHARS = 30;
const MAX_CHARS = 500;

function StarRating({ value, onChange, size = 32 }) {
    const [hover, setHover] = useState(0);
    return (
        <div className="flex items-center gap-1">
            {[1, 2, 3, 4, 5].map((star) => (
                <button
                    key={star}
                    type="button"
                    onMouseEnter={() => setHover(star)}
                    onMouseLeave={() => setHover(0)}
                    onClick={() => onChange(star)}
                    className="transition-transform active:scale-90 hover:scale-110"
                >
                    <Star
                        size={size}
                        className={`transition-colors ${(hover || value) >= star
                            ? 'text-amber-400 fill-amber-400'
                            : 'text-slate-200 dark:text-slate-700'
                            }`}
                        strokeWidth={1.5}
                    />
                </button>
            ))}
        </div>
    );
}

const stepVariants = {
    enter: (dir) => ({ opacity: 0, x: dir > 0 ? 60 : -60 }),
    center: { opacity: 1, x: 0 },
    exit: (dir) => ({ opacity: 0, x: dir > 0 ? -60 : 60 }),
};

export default function WriteReviewModal({ isOpen, onClose, moveIn, ownerId, ownerName }) {
    const { currentUser, userData } = useAuth();
    const toast = useToast();

    const [step, setStep] = useState(0); // 0=ratings, 1=text, 2=preview, 3=done
    const [dir, setDir] = useState(1);
    const [loading, setLoading] = useState(false);

    const [ratings, setRatings] = useState({
        overall: 0,
        communication: 0,
        responsiveness: 0,
        cleanliness: 0,
        accuracy: 0,
    });
    const [body, setBody] = useState('');

    const goNext = () => {
        setDir(1);
        setStep((s) => s + 1);
    };
    const goBack = () => {
        setDir(-1);
        setStep((s) => s - 1);
    };

    const canProceedStep0 = ratings.overall > 0 && CATEGORIES.every((c) => ratings[c.key] > 0);
    const canProceedStep1 = body.trim().length >= MIN_CHARS;

    const handleSubmit = async () => {
        if (!currentUser || !moveIn) return;
        setLoading(true);
        try {
            // Guard: one review per moveIn
            const existing = await getDocs(
                query(
                    collection(db, 'ownerReviews'),
                    where('moveInId', '==', moveIn.id),
                    where('reviewerId', '==', currentUser.uid)
                )
            );
            if (!existing.empty) {
                toast.warning('You have already submitted a review for this move-in.');
                onClose();
                return;
            }

            const reviewerName = userData?.fullName || userData?.name || currentUser.displayName || 'Anonymous';
            const reviewerAvatar = currentUser.photoURL || null;

            await addDoc(collection(db, 'ownerReviews'), {
                ownerId,
                reviewerId: currentUser.uid,
                reviewerName,
                reviewerAvatar,
                moveInId: moveIn.id,
                propertyId: moveIn.propertyId,
                propertyName: moveIn.propertyName,
                rating: ratings.overall,
                categories: {
                    communication: ratings.communication,
                    responsiveness: ratings.responsiveness,
                    cleanliness: ratings.cleanliness,
                    accuracy: ratings.accuracy,
                },
                body: body.trim(),
                createdAt: serverTimestamp(),
                isApproved: true,
            });

            // Mark move-in as reviewed
            if (moveIn.firestoreId) {
                await updateDoc(doc(db, 'tenantMoveIns', moveIn.firestoreId), { hasReviewed: true });
            }

            setDir(1);
            setStep(3);
        } catch (err) {
            console.error('Review submit error:', err);
            toast.error('Failed to submit review. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const handleClose = () => {
        setStep(0);
        setDir(1);
        setRatings({ overall: 0, communication: 0, responsiveness: 0, cleanliness: 0, accuracy: 0 });
        setBody('');
        onClose();
    };

    const avgCategoryRating = CATEGORIES.reduce((sum, c) => sum + (ratings[c.key] || 0), 0) / CATEGORIES.length;

    if (typeof document === 'undefined') return null;

    const totalSteps = 3;
    const progressWidth = step < 3 ? `${((step + 1) / totalSteps) * 100}%` : '100%';

    return createPortal(
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    key="review-backdrop"
                    className="fixed inset-0 z-[70] flex items-end sm:items-center justify-center p-0 sm:p-4"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    onClick={handleClose}
                >
                    <div className="absolute inset-0 bg-slate-900/70 backdrop-blur-md" />

                    <motion.div
                        key="review-card"
                        className="relative w-full sm:max-w-lg bg-white dark:bg-slate-900 rounded-t-[40px] sm:rounded-[40px] overflow-hidden shadow-2xl"
                        onClick={(e) => e.stopPropagation()}
                        initial={{ opacity: 0, y: '100%' }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: '100%' }}
                        transition={{ type: 'spring', stiffness: 360, damping: 34, mass: 1 }}
                    >
                        {/* Drag handle */}
                        <div className="w-10 h-1 bg-slate-200 dark:bg-slate-700 rounded-full mx-auto mt-4 sm:hidden" />

                        {/* Header */}
                        <div className="px-8 pt-6 pb-4">
                            <div className="flex items-center justify-between mb-4">
                                {step > 0 && step < 3 ? (
                                    <button onClick={goBack} className="size-9 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors">
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

                            {/* Progress Bar */}
                            {step < 3 && (
                                <div className="h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                                    <motion.div
                                        className="h-full bg-gradient-to-r from-primary to-indigo-500 rounded-full"
                                        initial={false}
                                        animate={{ width: progressWidth }}
                                        transition={{ duration: 0.4, ease: 'easeInOut' }}
                                    />
                                </div>
                            )}
                        </div>

                        {/* Step Content */}
                        <div className="overflow-hidden">
                            <AnimatePresence mode="wait" custom={dir}>
                                {/* ─── STEP 0: Category Ratings ─── */}
                                {step === 0 && (
                                    <motion.div
                                        key="step-0"
                                        custom={dir}
                                        variants={stepVariants}
                                        initial="enter"
                                        animate="center"
                                        exit="exit"
                                        transition={{ type: 'spring', stiffness: 400, damping: 35 }}
                                        className="px-8 pb-8"
                                    >
                                        <div className="mb-7">
                                            <h2 className="text-xl font-black text-slate-900 dark:text-white mb-1">
                                                Rate your experience
                                            </h2>
                                            <p className="text-sm text-slate-500 font-medium">
                                                Reviewing <span className="font-bold text-primary">{ownerName || 'this landlord'}</span>
                                            </p>
                                        </div>

                                        {/* Overall Star Rating */}
                                        <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-3xl p-6 mb-6 flex flex-col items-center">
                                            <p className="text-white/60 text-xs font-black uppercase tracking-widest mb-3">Overall Rating</p>
                                            <StarRating value={ratings.overall} onChange={(v) => setRatings((r) => ({ ...r, overall: v }))} size={40} />
                                            {ratings.overall > 0 && (
                                                <motion.p
                                                    initial={{ opacity: 0, y: 4 }}
                                                    animate={{ opacity: 1, y: 0 }}
                                                    className="text-white font-black text-2xl mt-3"
                                                >
                                                    {['', 'Terrible', 'Bad', 'OK', 'Great', 'Exceptional'][ratings.overall]}
                                                </motion.p>
                                            )}
                                        </div>

                                        {/* Category Ratings */}
                                        <div className="space-y-4">
                                            {CATEGORIES.map((cat) => (
                                                <div key={cat.key} className="flex items-center justify-between bg-slate-50 dark:bg-slate-800 p-4 rounded-2xl">
                                                    <div className="flex items-center gap-3">
                                                        <span className="text-xl">{cat.emoji}</span>
                                                        <span className="text-sm font-black text-slate-700 dark:text-slate-200">{cat.label}</span>
                                                    </div>
                                                    <StarRating value={ratings[cat.key]} onChange={(v) => setRatings((r) => ({ ...r, [cat.key]: v }))} size={22} />
                                                </div>
                                            ))}
                                        </div>

                                        <button
                                            onClick={goNext}
                                            disabled={!canProceedStep0}
                                            className="w-full mt-7 py-5 bg-primary text-white font-black rounded-[20px] shadow-xl shadow-primary/25 hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed disabled:scale-100"
                                        >
                                            Continue <ArrowRight size={18} />
                                        </button>
                                    </motion.div>
                                )}

                                {/* ─── STEP 1: Written Review ─── */}
                                {step === 1 && (
                                    <motion.div
                                        key="step-1"
                                        custom={dir}
                                        variants={stepVariants}
                                        initial="enter"
                                        animate="center"
                                        exit="exit"
                                        transition={{ type: 'spring', stiffness: 400, damping: 35 }}
                                        className="px-8 pb-8"
                                    >
                                        <div className="mb-6">
                                            <h2 className="text-xl font-black text-slate-900 dark:text-white mb-1">
                                                Describe your experience
                                            </h2>
                                            <p className="text-sm text-slate-500 font-medium">
                                                Be honest — future tenants rely on your experience.
                                            </p>
                                        </div>

                                        <div className="relative">
                                            <textarea
                                                value={body}
                                                onChange={(e) => setBody(e.target.value.slice(0, MAX_CHARS))}
                                                placeholder="Tell future renters about your experience with this landlord — their communication style, reliability, how they handled issues..."
                                                rows={7}
                                                className="w-full bg-slate-50 dark:bg-slate-800 border-2 border-transparent focus:border-primary/30 rounded-3xl p-5 text-sm text-slate-700 dark:text-slate-200 placeholder:text-slate-400 font-medium resize-none outline-none transition-all leading-relaxed"
                                            />
                                            <div className={`absolute bottom-4 right-5 text-xs font-bold transition-colors ${body.length < MIN_CHARS ? 'text-slate-400' : 'text-emerald-500'}`}>
                                                {body.length}/{MAX_CHARS}
                                            </div>
                                        </div>

                                        {body.length > 0 && body.length < MIN_CHARS && (
                                            <p className="text-xs text-amber-500 font-bold mt-2 ml-1">
                                                {MIN_CHARS - body.length} more characters needed
                                            </p>
                                        )}

                                        <button
                                            onClick={goNext}
                                            disabled={!canProceedStep1}
                                            className="w-full mt-6 py-5 bg-primary text-white font-black rounded-[20px] shadow-xl shadow-primary/25 hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed disabled:scale-100"
                                        >
                                            Preview Review <Eye size={18} />
                                        </button>
                                    </motion.div>
                                )}

                                {/* ─── STEP 2: Preview ─── */}
                                {step === 2 && (
                                    <motion.div
                                        key="step-2"
                                        custom={dir}
                                        variants={stepVariants}
                                        initial="enter"
                                        animate="center"
                                        exit="exit"
                                        transition={{ type: 'spring', stiffness: 400, damping: 35 }}
                                        className="px-8 pb-8"
                                    >
                                        <div className="mb-6">
                                            <h2 className="text-xl font-black text-slate-900 dark:text-white mb-1">Review Preview</h2>
                                            <p className="text-sm text-slate-500 font-medium">This is how your review will look publicly.</p>
                                        </div>

                                        {/* Preview Card */}
                                        <div className="bg-slate-50 dark:bg-slate-800 rounded-3xl p-6 mb-6 space-y-5">
                                            {/* Reviewer */}
                                            <div className="flex items-center gap-3">
                                                <div className="size-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-black text-base">
                                                    {(userData?.fullName || currentUser?.displayName || 'U')[0].toUpperCase()}
                                                </div>
                                                <div>
                                                    <p className="font-black text-slate-900 dark:text-white text-sm">
                                                        {userData?.fullName || currentUser?.displayName || 'You'}
                                                    </p>
                                                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Verified Tenant</p>
                                                </div>
                                            </div>

                                            {/* Stars */}
                                            <div className="flex items-center gap-1">
                                                {[1, 2, 3, 4, 5].map((s) => (
                                                    <Star
                                                        key={s}
                                                        size={18}
                                                        className={`${ratings.overall >= s ? 'text-amber-400 fill-amber-400' : 'text-slate-200 dark:text-slate-700'}`}
                                                        strokeWidth={1.5}
                                                    />
                                                ))}
                                                <span className="ml-2 text-sm font-black text-slate-600 dark:text-slate-300">{ratings.overall}.0</span>
                                            </div>

                                            {/* Body */}
                                            <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed font-medium">
                                                {body}
                                            </p>

                                            {/* Category Pills */}
                                            <div className="flex flex-wrap gap-2">
                                                {CATEGORIES.map((cat) => (
                                                    <div key={cat.key} className="flex items-center gap-1.5 bg-white dark:bg-slate-900 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700">
                                                        <span className="text-xs">{cat.emoji}</span>
                                                        <span className="text-[10px] font-black text-slate-600 dark:text-slate-300">{cat.label}</span>
                                                        <span className="text-[10px] font-black text-amber-500">{ratings[cat.key]}/5</span>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>

                                        <button
                                            onClick={handleSubmit}
                                            disabled={loading}
                                            className="w-full py-5 bg-gradient-to-r from-primary to-indigo-600 text-white font-black rounded-[20px] shadow-xl shadow-primary/25 hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-2 disabled:opacity-70 disabled:scale-100"
                                        >
                                            {loading ? (
                                                <><Loader2 size={20} className="animate-spin" /> Submitting...</>
                                            ) : (
                                                <><Send size={18} /> Publish Review</>
                                            )}
                                        </button>
                                    </motion.div>
                                )}

                                {/* ─── STEP 3: Done ─── */}
                                {step === 3 && (
                                    <motion.div
                                        key="step-3"
                                        custom={dir}
                                        variants={stepVariants}
                                        initial="enter"
                                        animate="center"
                                        exit="exit"
                                        transition={{ type: 'spring', stiffness: 400, damping: 35 }}
                                        className="px-8 pb-10 pt-4 flex flex-col items-center text-center"
                                    >
                                        <motion.div
                                            initial={{ scale: 0, rotate: -30 }}
                                            animate={{ scale: 1, rotate: 0 }}
                                            transition={{ type: 'spring', stiffness: 400, damping: 18, delay: 0.1 }}
                                            className="size-28 rounded-[32px] bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center shadow-2xl shadow-amber-500/30 mb-8"
                                        >
                                            <Star size={52} className="text-white fill-white drop-shadow-lg" />
                                        </motion.div>
                                        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
                                            <h2 className="text-2xl font-black text-slate-900 dark:text-white mb-3">
                                                Review Published! ⭐
                                            </h2>
                                            <p className="text-slate-500 dark:text-slate-400 font-medium text-sm max-w-xs mx-auto leading-relaxed mb-10">
                                                Thank you for helping future tenants make better decisions. Your review is now live on the landlord's profile.
                                            </p>
                                        </motion.div>
                                        <motion.button
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ delay: 0.45 }}
                                            onClick={handleClose}
                                            className="w-full py-5 bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-black rounded-[20px] shadow-xl active:scale-95 transition-all"
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
