import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { collection, query, where, onSnapshot, doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../contexts/AuthContext';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { Key, Building2, Calendar, ShieldCheck, MapPin, CheckCircle2, User, Phone, ArrowLeft, Loader2, Home, Star, Clock, ChevronRight } from 'lucide-react';
import { Skeleton } from '../components/Skeleton';
import WriteReviewModal from '../components/WriteReviewModal';
import { Helmet } from 'react-helmet-async';

// ─── Animation variants (Framer Motion rule #1: defined OUTSIDE component) ───
const containerVariants = {
    hidden: {},
    visible: { transition: { staggerChildren: 0.06, delayChildren: 0.05 } },
};

const cardVariants = {
    hidden: { opacity: 0, y: 22 },
    visible: {
        opacity: 1,
        y: 0,
        transition: { type: 'spring', stiffness: 320, damping: 26 },
    },
    exit: { opacity: 0, y: -10, transition: { duration: 0.2 } },
};

const headerVariants = {
    hidden: { opacity: 0, y: -8 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: [0.22, 1, 0.36, 1] } },
};

export default function MyMoveIns() {
    const { currentUser } = useAuth();
    const navigate = useNavigate();
    const shouldReduceMotion = useReducedMotion();

    const [moveIns, setMoveIns] = useState([]);
    const [loading, setLoading] = useState(true);
    const [ownerNames, setOwnerNames] = useState({});

    const [reviewModal, setReviewModal] = useState({ isOpen: false, moveIn: null, ownerId: null, ownerName: '' });

    useEffect(() => {
        if (!currentUser) {
            navigate('/login');
            return;
        }

        const q = query(collection(db, 'tenantMoveIns'), where('tenantId', '==', currentUser.uid));
        const unsub = onSnapshot(q, async (snap) => {
            const data = snap.docs.map(d => ({ firestoreId: d.id, id: d.id, ...d.data() }));
            // Sort newest first
            data.sort((a, b) => {
                const ta = a.movedInAt?.seconds || 0;
                const tb = b.movedInAt?.seconds || 0;
                return tb - ta;
            });
            setMoveIns(data);
            setLoading(false);

            // Fetch owner names we don't have yet
            const uniqueOwnerIds = [...new Set(data.map(d => d.ownerId).filter(Boolean))];
            const missing = uniqueOwnerIds.filter(id => !ownerNames[id]);
            if (missing.length > 0) {
                const fetched = {};
                await Promise.all(
                    missing.map(async (ownerId) => {
                        try {
                            const snap = await getDoc(doc(db, 'users', ownerId));
                            if (snap.exists()) {
                                const d = snap.data();
                                fetched[ownerId] = d.fullName || d.name || d.displayName || 'Property Owner';
                            }
                        } catch { /* silent */ }
                    })
                );
                setOwnerNames(prev => ({ ...prev, ...fetched }));
            }
        });

        return () => unsub();
    }, [currentUser, navigate]);

    const formatDate = (ts) => {
        if (!ts) return 'Recently';
        const date = ts.toDate ? ts.toDate() : new Date(ts);
        return new Intl.DateTimeFormat('en-US', { month: 'long', day: 'numeric', year: 'numeric' }).format(date);
    };

    return (
        <div className="flex flex-col min-h-screen bg-[#F8F9FA] dark:bg-[#0F1117] pb-28">
            <Helmet>
                <title>My Move-Ins | Any-Let</title>
            </Helmet>

            {/* Header */}
            <motion.header
                variants={shouldReduceMotion ? {} : headerVariants}
                initial="hidden"
                animate="visible"
                className="flex items-center justify-center px-6 pt-6 pb-5 sticky top-14 bg-[#F8F9FA]/90 dark:bg-[#0F1117]/90 backdrop-blur-md z-20 border-b border-slate-200/60 dark:border-white/[0.06]"
            >
                <h1 className="text-[20px] font-[900] text-slate-900 dark:text-white tracking-tight">
                    My Move-Ins
                </h1>
            </motion.header>

            <main className="flex-1 px-4 md:px-6 pt-6 max-w-2xl mx-auto w-full">
                {loading ? (
                    <div className="flex flex-col gap-4">
                        {[1, 2, 3].map(n => (
                            <Skeleton key={n} className="h-[240px] w-full rounded-[28px]" />
                        ))}
                    </div>
                ) : moveIns.length === 0 ? (
                    <EmptyState />
                ) : (
                    <motion.div
                        variants={shouldReduceMotion ? {} : containerVariants}
                        initial="hidden"
                        animate="visible"
                        className="flex flex-col gap-4"
                    >
                        <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1 mb-1">
                            {moveIns.length} {moveIns.length === 1 ? 'Property' : 'Properties'} Recorded
                        </p>
                        <AnimatePresence>
                            {moveIns.map((item) => (
                                <motion.div
                                    key={item.id}
                                    variants={shouldReduceMotion ? {} : cardVariants}
                                    layout
                                >
                                    <MoveInCard
                                        moveIn={item}
                                        ownerName={ownerNames[item.ownerId] || 'Property Owner'}
                                        formatDate={formatDate}
                                        onReview={() => setReviewModal({
                                            isOpen: true,
                                            moveIn: item,
                                            ownerId: item.ownerId,
                                            ownerName: ownerNames[item.ownerId] || 'this landlord'
                                        })}
                                        onViewOwner={() => navigate(`/owner/${item.ownerId}`)}
                                    />
                                </motion.div>
                            ))}
                        </AnimatePresence>
                    </motion.div>
                )}
            </main>

            <WriteReviewModal
                isOpen={reviewModal.isOpen}
                onClose={() => setReviewModal({ isOpen: false, moveIn: null, ownerId: null, ownerName: '' })}
                moveIn={reviewModal.moveIn}
                ownerId={reviewModal.ownerId}
                ownerName={reviewModal.ownerName}
            />
        </div>
    );
}

// ─── Card hover variants (outside sub-component too) ─────────────────────────
const cardHoverVariants = {
    rest: { y: 0, boxShadow: '0 1px 3px rgba(0,0,0,0.08)' },
    hover: {
        y: -4,
        boxShadow: '0 12px 40px rgba(0,0,0,0.13)',
        transition: { type: 'spring', stiffness: 400, damping: 22 },
    },
};

function MoveInCard({ moveIn, ownerName, formatDate, onReview, onViewOwner }) {
    const hasImage = !!moveIn.propertyImage;
    const hasReviewed = !!moveIn.hasReviewed;

    return (
        <motion.div
            initial="rest"
            whileHover="hover"
            animate="rest"
            variants={cardHoverVariants}
            className="transform-gpu bg-white dark:bg-[#1A1D24] rounded-[28px] overflow-hidden border border-slate-100/80 dark:border-white/[0.06] shadow-sm"
        >
            {/* Property Image */}
            <div className="relative w-full h-40 bg-slate-100 dark:bg-[#222630] overflow-hidden">
                {hasImage ? (
                    <img
                        loading="lazy"
                        src={moveIn.propertyImage}
                        alt={moveIn.propertyName}
                        className="w-full h-full object-cover"
                    />
                ) : (
                    <div className="w-full h-full flex items-center justify-center">
                        <Home size={36} className="text-slate-300 dark:text-slate-600" />
                    </div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-slate-900/75 via-slate-900/10 to-transparent" />

                {/* Status Badge */}
                <div className={`absolute top-3 right-3 flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest backdrop-blur-sm ${
                    hasReviewed
                        ? 'bg-amber-500/90 text-white'
                        : 'bg-emerald-500/90 text-white'
                }`}>
                    {hasReviewed ? <><Star size={10} className="fill-white" /> Reviewed</> : <><CheckCircle2 size={10} strokeWidth={3} /> Moved In</>}
                </div>

                {/* Property Name Overlay */}
                <div className="absolute bottom-3 left-4 right-4">
                    <h3 className="text-white font-black text-base leading-tight truncate drop-shadow-lg">
                        {moveIn.propertyName || 'Property'}
                    </h3>
                </div>
            </div>

            <div className="p-4">
                {/* Owner & Date */}
                <div className="flex items-center justify-between mb-4">
                    <motion.button
                        onClick={onViewOwner}
                        whileTap={{ scale: 0.96 }}
                        className="flex items-center gap-2.5 group min-w-0"
                    >
                        <div className="size-9 rounded-full bg-primary/10 dark:bg-primary/20 flex items-center justify-center text-primary text-sm font-black group-hover:bg-primary group-hover:text-white transition-colors shrink-0">
                            {ownerName[0]?.toUpperCase()}
                        </div>
                        <div className="text-left min-w-0">
                            <p className="text-xs font-black text-slate-800 dark:text-slate-100 group-hover:text-primary transition-colors truncate">{ownerName}</p>
                            <p className="text-[10px] text-slate-400 font-bold">Landlord · View Profile</p>
                        </div>
                    </motion.button>
                    <div className="flex items-center gap-1 text-slate-400 shrink-0 ml-2">
                        <Clock size={11} />
                        <span className="text-[10px] font-bold">{formatDate(moveIn.movedInAt)}</span>
                    </div>
                </div>

                {/* CTA */}
                {!hasReviewed ? (
                    <motion.button
                        onClick={onReview}
                        whileHover={{ scale: 1.02, y: -1 }}
                        whileTap={{ scale: 0.97 }}
                        className="transform-gpu w-full py-3.5 bg-gradient-to-r from-primary to-indigo-600 text-white font-black text-sm rounded-2xl shadow-lg shadow-primary/25 flex items-center justify-center gap-2"
                    >
                        <Star size={15} className="fill-white" /> Write a Review
                        <ChevronRight size={15} />
                    </motion.button>
                ) : (
                    <div className="w-full py-3.5 bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400 font-black text-sm rounded-2xl flex items-center justify-center gap-2 border border-amber-100 dark:border-amber-500/20">
                        <Star size={15} className="fill-amber-500 text-amber-500" /> Review Submitted
                    </div>
                )}
            </div>
        </motion.div>
    );
}

// ─── Empty state variants ─────────────────────────────────────────────────────
const emptyIconVariants = {
    hidden: { scale: 0.85, opacity: 0 },
    visible: { scale: 1, opacity: 1, transition: { type: 'spring', stiffness: 260, damping: 20, delay: 0.1 } },
};

const emptyTextVariants = {
    hidden: { opacity: 0, y: 12 },
    visible: { opacity: 1, y: 0, transition: { delay: 0.22, duration: 0.4, ease: [0.22, 1, 0.36, 1] } },
};

function EmptyState() {
    const navigate = useNavigate();
    return (
        <motion.div
            initial="hidden"
            animate="visible"
            className="py-20 flex flex-col items-center justify-center text-center px-4"
        >
            <motion.div variants={emptyIconVariants} className="relative mb-8">
                <div className="size-24 bg-gradient-to-br from-slate-100 to-slate-200 dark:from-[#1A1D24] dark:to-[#222630] rounded-[28px] flex items-center justify-center shadow-inner border border-slate-200/60 dark:border-white/[0.06]">
                    <Home size={40} className="text-slate-400 dark:text-slate-500" />
                </div>
                <div className="absolute -bottom-2 -right-2 size-10 bg-gradient-to-br from-amber-400 to-amber-500 rounded-2xl flex items-center justify-center shadow-lg shadow-amber-500/30">
                    <Star size={20} className="text-white fill-white" />
                </div>
            </motion.div>
            <motion.div variants={emptyTextVariants}>
                <h3 className="text-[20px] font-[900] text-slate-900 dark:text-white mb-3">No Move-Ins Yet</h3>
                <p className="text-slate-500 dark:text-slate-400 text-[15px] font-medium leading-relaxed mb-8 max-w-[280px]">
                    When you mark a viewing request as "Moved In", it will appear here. You can then leave a verified review.
                </p>
                <motion.button
                    onClick={() => navigate('/requests')}
                    whileHover={{ scale: 1.03, y: -2 }}
                    whileTap={{ scale: 0.97 }}
                    className="transform-gpu bg-primary text-white font-[800] text-[15px] py-4 px-8 rounded-full shadow-lg shadow-primary/20 transition-shadow"
                >
                    View My Requests
                </motion.button>
            </motion.div>
        </motion.div>
    );
}
