import { useState } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { collection, addDoc, serverTimestamp, query, where, getDocs } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import Modal, { ModalFooter } from './ui/Modal';
import { Button, Card, Icon } from './ui';
import { Home, CheckCircle2, Star, ArrowRight, Loader2, Building2 } from 'lucide-react';
import { createNotification } from '../utils/notificationService';
import logger from '../utils/logger';

/* ═══════════════════════════════════════════
   VARIANTS — decoupled per FM engineering rules
═══════════════════════════════════════════ */
const stepV = {
    enter:  (dir) => ({ opacity: 0, x: dir > 0 ? 72 : -72, scale: 0.96 }),
    center: { opacity: 1, x: 0, scale: 1, transition: { type: 'spring', stiffness: 420, damping: 36 } },
    exit:   (dir) => ({ opacity: 0, x: dir > 0 ? -72 : 72, scale: 0.96, transition: { duration: 0.14 } }),
};

const heroV = {
    hidden:  { scale: 0, rotate: -30, opacity: 0 },
    visible: { scale: 1, rotate: 0,   opacity: 1, transition: { type: 'spring', stiffness: 480, damping: 18, delay: 0.08 } },
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

    const sV = reduced
        ? { enter: () => ({ opacity: 0 }), center: { opacity: 1, x: 0, scale: 1 }, exit: () => ({ opacity: 0 }) }
        : stepV;

    return (
        <Modal open={isOpen} onClose={handleClose} showClose={true} size="md" className="p-0">
            {/* Accent stripe */}
            <div className="h-1 w-full bg-gradient-to-r from-primary via-indigo-500 to-purple-500" />
            
            <div className="overflow-hidden">
                <AnimatePresence mode="wait" custom={dir}>
                    {/* ── STEP 0: Confirm ── */}
                    {step === 0 && (
                        <motion.div
                            key="mi-s0" custom={dir}
                            variants={sV} initial="enter" animate="center" exit="exit"
                            className="p-6 pt-8"
                        >
                            {/* Property preview */}
                            <motion.div
                                className="relative w-full h-40 rounded-card overflow-hidden mb-8 bg-surface-raised"
                                initial={{ opacity: 0, scale: 0.94 }} animate={{ opacity: 1, scale: 1 }}
                                transition={{ type: 'spring', stiffness: 360, damping: 28 }}
                            >
                                {propertyImage
                                    ? <img loading="lazy" src={propertyImage} alt={propertyName} className="w-full h-full object-cover" />
                                    : <div className="w-full h-full flex items-center justify-center">
                                        <Building2 size={48} className="text-subtle" />
                                        </div>
                                }
                                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                                <div className="absolute bottom-4 left-4 right-4">
                                    <p className="text-white font-bold text-title-sm leading-tight truncate drop-shadow-lg">{propertyName}</p>
                                </div>
                            </motion.div>

                            <motion.div
                                className="text-center mb-8"
                                custom={0.14} variants={textFadeV} initial="hidden" animate="visible"
                            >
                                <div className="inline-flex items-center gap-2 bg-primary-subtle text-primary px-4 py-2 rounded-full text-caption font-bold uppercase tracking-widest mb-4">
                                    <Home size={14} /> Move-In Declaration
                                </div>
                                <h2 className="text-title-lg text-content mb-3 leading-tight">
                                    Did you move into this property?
                                </h2>
                                <p className="text-muted font-medium text-body-sm leading-relaxed">
                                    Marking as moved in lets you leave a verified review — helping thousands of future renters.
                                </p>
                            </motion.div>

                            <motion.div
                                className="space-y-3"
                                custom={0.26} variants={textFadeV} initial="hidden" animate="visible"
                            >
                                <Button
                                    size="lg"
                                    fullWidth
                                    onClick={handleConfirm}
                                    loading={loading}
                                    leftIcon={!loading && <CheckCircle2 size={20} />}
                                >
                                    {loading ? 'Confirming…' : 'Yes, I Moved In'}
                                </Button>
                                <Button
                                    variant="ghost"
                                    size="lg"
                                    fullWidth
                                    className="text-muted"
                                    onClick={handleClose}
                                >
                                    Not yet
                                </Button>
                            </motion.div>
                        </motion.div>
                    )}

                    {/* ── STEP 1: Success ── */}
                    {step === 1 && (
                        <motion.div
                            key="mi-s1" custom={dir}
                            variants={sV} initial="enter" animate="center" exit="exit"
                            className="p-6 pt-10 pb-8"
                        >
                            <div className="flex flex-col items-center text-center mb-10">
                                {/* Animated icon with orbiting stars */}
                                <motion.div
                                    className="relative mb-6 transform-gpu"
                                    variants={heroV} initial="hidden" animate="visible"
                                >
                                    <div className="size-24 rounded-2xl bg-gradient-to-br from-success to-emerald-600 flex items-center justify-center shadow-2xl shadow-success/30">
                                        <Home size={42} className="text-on-primary drop-shadow-lg" />
                                    </div>
                                    {[0, 60, 120, 180, 240, 300].map((deg, i) => (
                                        <motion.div
                                            key={i}
                                            variants={orbitStarV(i)} initial="hidden" animate="visible"
                                            className="absolute"
                                            style={{
                                                top: '50%', left: '50%',
                                                transform: `rotate(${deg}deg) translateX(56px) translateY(-50%)`,
                                            }}
                                        >
                                            <Star size={10} className="text-warning fill-warning" />
                                        </motion.div>
                                    ))}
                                </motion.div>

                                <motion.div
                                    initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.3 }}
                                >
                                    <div className="inline-flex items-center gap-1.5 bg-success/10 text-success px-3 py-1.5 rounded-full text-caption font-bold uppercase tracking-widest mb-4">
                                        <CheckCircle2 size={12} strokeWidth={3} /> Move-In Recorded
                                    </div>
                                    <h2 className="text-title-lg text-content mb-3">
                                        Welcome to your new home! 🎉
                                    </h2>
                                    <p className="text-muted font-medium text-body-sm max-w-xs mx-auto leading-relaxed">
                                        Your move-in is confirmed. Share your experience with future renters — your review makes a real difference.
                                    </p>
                                </motion.div>
                            </div>

                            <motion.div
                                className="space-y-3"
                                initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.46 }}
                            >
                                <Button
                                    size="lg"
                                    fullWidth
                                    onClick={handleWriteReview}
                                    leftIcon={<Star size={20} className="fill-on-primary" />}
                                    rightIcon={<ArrowRight size={18} />}
                                >
                                    Write a Review
                                </Button>
                                <Button
                                    variant="ghost"
                                    size="lg"
                                    fullWidth
                                    className="text-muted"
                                    onClick={handleClose}
                                >
                                    I'll do it later
                                </Button>
                            </motion.div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </Modal>
    );
}
