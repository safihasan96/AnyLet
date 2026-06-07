import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { collection, addDoc, serverTimestamp, query, where, getDocs } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import { createPortal } from 'react-dom';
import { X, Home, CheckCircle2, Star, ArrowRight, Loader2, Building2 } from 'lucide-react';

const stepVariants = {
    enter: (dir) => ({ opacity: 0, x: dir > 0 ? 60 : -60 }),
    center: { opacity: 1, x: 0 },
    exit: (dir) => ({ opacity: 0, x: dir > 0 ? -60 : 60 }),
};

export default function MoveInModal({ isOpen, onClose, request, onMoveInSuccess }) {
    const { currentUser } = useAuth();
    const toast = useToast();
    const [step, setStep] = useState(0); // 0 = confirm, 1 = success
    const [dir, setDir] = useState(1);
    const [loading, setLoading] = useState(false);

    const propertyName = request?.propertyName || 'this property';
    const propertyImage = request?.propertyImage || null;

    const handleConfirm = async () => {
        if (!currentUser || !request) return;
        setLoading(true);
        try {
            // Check if already moved in for this request
            const existing = await getDocs(
                query(
                    collection(db, 'tenantMoveIns'),
                    where('viewingRequestId', '==', request.id),
                    where('tenantId', '==', currentUser.uid)
                )
            );
            if (!existing.empty) {
                toast.warning('You have already marked this property as moved in.');
                onClose();
                return;
            }

            await addDoc(collection(db, 'tenantMoveIns'), {
                tenantId: currentUser.uid,
                ownerId: request.ownerId,
                propertyId: request.propertyId,
                propertyName: request.propertyName,
                propertyImage: request.propertyImage || null,
                viewingRequestId: request.id,
                movedInAt: serverTimestamp(),
                paymentStatus: 'pending', // Future Airbnb payment hook
                hasReviewed: false,
            });

            setDir(1);
            setStep(1);
            if (onMoveInSuccess) onMoveInSuccess();
        } catch (err) {
            console.error('Move-in error:', err);
            toast.error('Something went wrong. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const handleClose = () => {
        setStep(0);
        setDir(1);
        onClose();
    };

    const handleWriteReview = () => {
        handleClose();
        if (onMoveInSuccess) onMoveInSuccess('writeReview');
    };

    if (typeof document === 'undefined') return null;

    return createPortal(
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    key="movein-backdrop"
                    className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center p-0 sm:p-4"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    onClick={handleClose}
                >
                    <div className="absolute inset-0 bg-slate-900/70 backdrop-blur-md" />

                    <motion.div
                        key="movein-card"
                        className="relative w-full sm:max-w-md bg-white dark:bg-slate-900 rounded-t-[40px] sm:rounded-[40px] overflow-hidden shadow-2xl"
                        onClick={(e) => e.stopPropagation()}
                        initial={{ opacity: 0, y: '100%' }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: '100%' }}
                        transition={{ type: 'spring', stiffness: 360, damping: 34, mass: 1 }}
                    >
                        {/* Drag handle */}
                        <div className="w-10 h-1 bg-slate-200 dark:bg-slate-700 rounded-full mx-auto mt-4 mb-2 sm:hidden" />

                        <button
                            onClick={handleClose}
                            className="absolute top-5 right-5 z-10 size-9 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors"
                        >
                            <X size={18} strokeWidth={2.5} />
                        </button>

                        <div className="overflow-hidden">
                            <AnimatePresence mode="wait" custom={dir}>
                                {step === 0 && (
                                    <motion.div
                                        key="step-0"
                                        custom={dir}
                                        variants={stepVariants}
                                        initial="enter"
                                        animate="center"
                                        exit="exit"
                                        transition={{ type: 'spring', stiffness: 400, damping: 35 }}
                                        className="p-8 pt-10"
                                    >
                                        {/* Property Preview */}
                                        <div className="relative w-full h-44 rounded-3xl overflow-hidden mb-8 bg-slate-100 dark:bg-slate-800">
                                            {propertyImage ? (
                                                <img src={propertyImage} alt={propertyName} className="w-full h-full object-cover" />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center">
                                                    <Building2 size={48} className="text-slate-300 dark:text-slate-600" />
                                                </div>
                                            )}
                                            {/* Gradient overlay */}
                                            <div className="absolute inset-0 bg-gradient-to-t from-slate-900/60 via-transparent to-transparent" />
                                            <div className="absolute bottom-4 left-4 right-4">
                                                <p className="text-white font-black text-lg leading-tight truncate drop-shadow-lg">
                                                    {propertyName}
                                                </p>
                                            </div>
                                        </div>

                                        <div className="text-center mb-8">
                                            <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-4 py-2 rounded-full text-xs font-black uppercase tracking-widest mb-4">
                                                <Home size={14} /> Move-In Declaration
                                            </div>
                                            <h2 className="text-2xl font-black text-slate-900 dark:text-white mb-3 leading-tight">
                                                Did you move into this property?
                                            </h2>
                                            <p className="text-slate-500 dark:text-slate-400 font-medium text-sm leading-relaxed">
                                                Marking as moved in lets you leave a verified review — helping thousands of future renters make better decisions.
                                            </p>
                                        </div>

                                        <div className="space-y-3">
                                            <button
                                                onClick={handleConfirm}
                                                disabled={loading}
                                                className="w-full py-5 bg-primary text-white font-black text-base rounded-[20px] shadow-xl shadow-primary/25 hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-2 disabled:opacity-70"
                                            >
                                                {loading ? (
                                                    <><Loader2 size={20} className="animate-spin" /> Confirming...</>
                                                ) : (
                                                    <><CheckCircle2 size={20} /> Yes, I Moved In</>
                                                )}
                                            </button>
                                            <button
                                                onClick={handleClose}
                                                className="w-full py-4 text-slate-500 dark:text-slate-400 font-bold text-sm hover:text-slate-700 dark:hover:text-slate-200 transition-colors"
                                            >
                                                Not yet
                                            </button>
                                        </div>
                                    </motion.div>
                                )}

                                {step === 1 && (
                                    <motion.div
                                        key="step-1"
                                        custom={dir}
                                        variants={stepVariants}
                                        initial="enter"
                                        animate="center"
                                        exit="exit"
                                        transition={{ type: 'spring', stiffness: 400, damping: 35 }}
                                        className="p-8 pt-12 pb-10"
                                    >
                                        {/* Success Animation */}
                                        <div className="flex flex-col items-center text-center mb-10">
                                            <motion.div
                                                initial={{ scale: 0, rotate: -20 }}
                                                animate={{ scale: 1, rotate: 0 }}
                                                transition={{ type: 'spring', stiffness: 400, damping: 20, delay: 0.1 }}
                                                className="relative mb-6"
                                            >
                                                <div className="size-28 rounded-[32px] bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center shadow-2xl shadow-emerald-500/30">
                                                    <Home size={52} className="text-white drop-shadow-lg" />
                                                </div>
                                                {/* Orbiting stars */}
                                                {[0, 60, 120, 180, 240, 300].map((deg, i) => (
                                                    <motion.div
                                                        key={i}
                                                        className="absolute"
                                                        style={{
                                                            top: '50%',
                                                            left: '50%',
                                                            transform: `rotate(${deg}deg) translateX(60px) translateY(-50%)`,
                                                        }}
                                                        initial={{ opacity: 0, scale: 0 }}
                                                        animate={{ opacity: 1, scale: 1 }}
                                                        transition={{ delay: 0.2 + i * 0.05 }}
                                                    >
                                                        <Star size={10} className="text-amber-400 fill-amber-400" />
                                                    </motion.div>
                                                ))}
                                            </motion.div>

                                            <motion.div
                                                initial={{ opacity: 0, y: 10 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                transition={{ delay: 0.3 }}
                                            >
                                                <div className="inline-flex items-center gap-1.5 bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 px-3 py-1.5 rounded-full text-xs font-black uppercase tracking-widest mb-4">
                                                    <CheckCircle2 size={12} strokeWidth={3} /> Move-In Recorded
                                                </div>
                                                <h2 className="text-2xl font-black text-slate-900 dark:text-white mb-3">
                                                    Welcome to your new home! 🎉
                                                </h2>
                                                <p className="text-slate-500 dark:text-slate-400 font-medium text-sm max-w-xs mx-auto leading-relaxed">
                                                    Your move-in is confirmed. Share your experience with future renters — your honest review makes a real difference.
                                                </p>
                                            </motion.div>
                                        </div>

                                        <motion.div
                                            initial={{ opacity: 0, y: 12 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ delay: 0.45 }}
                                            className="space-y-3"
                                        >
                                            <button
                                                onClick={handleWriteReview}
                                                className="w-full py-5 bg-gradient-to-r from-primary to-indigo-600 text-white font-black text-base rounded-[20px] shadow-xl shadow-primary/25 hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-2"
                                            >
                                                <Star size={20} className="fill-white" /> Write a Review
                                                <ArrowRight size={18} />
                                            </button>
                                            <button
                                                onClick={handleClose}
                                                className="w-full py-4 text-slate-500 dark:text-slate-400 font-bold text-sm hover:text-slate-700 dark:hover:text-slate-200 transition-colors"
                                            >
                                                I'll do it later
                                            </button>
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
