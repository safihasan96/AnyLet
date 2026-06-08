import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { collection, query, where, onSnapshot, doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../contexts/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Home, Star, CheckCircle2, Clock, ChevronRight, MapPin, User } from 'lucide-react';
import WriteReviewModal from '../components/WriteReviewModal';
import { Helmet } from 'react-helmet-async';

export default function MyMoveIns() {
    const { currentUser } = useAuth();
    const navigate = useNavigate();

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
        <div className="flex flex-col min-h-screen bg-[#f8fafc] dark:bg-slate-950 pb-28">
            <Helmet>
                <title>My Move-Ins | Any-Let</title>
            </Helmet>

            {/* Header */}
            <header className="flex items-center px-6 pt-10 pb-6 sticky top-0 bg-[#f8fafc]/95 dark:bg-slate-950/95 backdrop-blur-md z-20 border-b border-slate-100 dark:border-slate-800/50">
                <button
                    onClick={() => navigate(-1)}
                    className="p-2 -ml-2 text-slate-800 dark:text-white hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors"
                >
                    <ArrowLeft size={24} strokeWidth={2.5} />
                </button>
                <h1 className="flex-1 text-center text-[20px] font-[900] text-slate-900 dark:text-white tracking-tight">
                    My Move-Ins
                </h1>
                <div className="w-10" />
            </header>

            <main className="flex-1 px-6 pt-6">
                {loading ? (
                    <div className="flex flex-col gap-4">
                        {[1, 2, 3].map(n => (
                            <div key={n} className="animate-pulse h-[140px] w-full rounded-[28px] bg-slate-200 dark:bg-slate-800" />
                        ))}
                    </div>
                ) : moveIns.length === 0 ? (
                    <EmptyState />
                ) : (
                    <div className="flex flex-col gap-4">
                        <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1 mb-2">
                            {moveIns.length} {moveIns.length === 1 ? 'Property' : 'Properties'} Recorded
                        </p>
                        <AnimatePresence>
                            {moveIns.map((item, idx) => (
                                <motion.div
                                    key={item.id}
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: idx * 0.05 }}
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
                    </div>
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

function MoveInCard({ moveIn, ownerName, formatDate, onReview, onViewOwner }) {
    const hasImage = !!moveIn.propertyImage;
    const hasReviewed = !!moveIn.hasReviewed;

    return (
        <div className="bg-white dark:bg-slate-900 rounded-[28px] overflow-hidden border border-slate-100 dark:border-slate-800/80 shadow-sm hover:shadow-xl hover:shadow-slate-200/50 dark:hover:shadow-none transition-all">
            {/* Property Image */}
            <div className="relative w-full h-36 bg-slate-100 dark:bg-slate-800 overflow-hidden">
                {hasImage ? (
                    <img src={moveIn.propertyImage} alt={moveIn.propertyName} className="w-full h-full object-cover" />
                ) : (
                    <div className="w-full h-full flex items-center justify-center">
                        <Home size={36} className="text-slate-300 dark:text-slate-600" />
                    </div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-slate-900/70 via-slate-900/10 to-transparent" />
                
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
                    <button
                        onClick={onViewOwner}
                        className="flex items-center gap-2 group"
                    >
                        <div className="size-8 rounded-full bg-primary/10 flex items-center justify-center text-primary dark:text-indigo-400 text-sm font-black group-hover:bg-primary group-hover:text-white transition-colors">
                            {ownerName[0]?.toUpperCase()}
                        </div>
                        <div className="text-left">
                            <p className="text-xs font-black text-slate-700 dark:text-slate-200 group-hover:text-primary dark:text-indigo-400 transition-colors">{ownerName}</p>
                            <p className="text-[10px] text-slate-400 font-bold">Landlord · View Profile</p>
                        </div>
                    </button>
                    <div className="flex items-center gap-1 text-slate-400">
                        <Clock size={11} />
                        <span className="text-[10px] font-bold">{formatDate(moveIn.movedInAt)}</span>
                    </div>
                </div>

                {/* CTA */}
                {!hasReviewed ? (
                    <button
                        onClick={onReview}
                        className="w-full py-3.5 bg-gradient-to-r from-primary to-indigo-600 text-white font-black text-sm rounded-2xl shadow-lg shadow-primary/20 hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-2"
                    >
                        <Star size={16} className="fill-white" /> Write a Review
                        <ChevronRight size={16} />
                    </button>
                ) : (
                    <div className="w-full py-3.5 bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400 font-black text-sm rounded-2xl flex items-center justify-center gap-2 border border-amber-100 dark:border-amber-500/20">
                        <Star size={16} className="fill-amber-500 text-amber-500" /> Review Submitted
                    </div>
                )}
            </div>
        </div>
    );
}

function EmptyState() {
    const navigate = useNavigate();
    return (
        <div className="py-20 flex flex-col items-center justify-center text-center px-4">
            <div className="relative mb-8">
                <div className="size-24 bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-800 dark:to-slate-700 rounded-[28px] flex items-center justify-center shadow-inner">
                    <Home size={40} className="text-slate-400 dark:text-slate-500" />
                </div>
                <div className="absolute -bottom-2 -right-2 size-10 bg-gradient-to-br from-amber-400 to-amber-500 rounded-2xl flex items-center justify-center shadow-lg shadow-amber-500/30">
                    <Star size={20} className="text-white fill-white" />
                </div>
            </div>
            <h3 className="text-[20px] font-[900] text-slate-900 dark:text-white mb-3">No Move-Ins Yet</h3>
            <p className="text-[#64748b] text-[15px] font-medium leading-relaxed mb-8 max-w-[280px]">
                When you mark a viewing request as "Moved In", it will appear here. You can then leave a verified review.
            </p>
            <button
                onClick={() => navigate('/requests')}
                className="bg-primary text-white font-[800] text-[15px] py-4 px-8 rounded-full shadow-lg shadow-primary/20 transition-transform active:scale-95"
            >
                View My Requests
            </button>
        </div>
    );
}
