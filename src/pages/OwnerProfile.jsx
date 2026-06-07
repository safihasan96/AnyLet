import { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { doc, getDoc, collection, query, where, getDocs, orderBy } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../contexts/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import {
    ArrowLeft, Star, ShieldCheck, Calendar, Home, MessageSquare,
    ChevronRight, User2, Award, Building2, Loader2, ThumbsUp
} from 'lucide-react';
import PropertyCard from '../components/PropertyCard';
import PropertyLoader from '../components/PropertyLoader';
import WriteReviewModal from '../components/WriteReviewModal';
import { Helmet } from 'react-helmet-async';

const CATEGORIES = [
    { key: 'communication', label: 'Communication', emoji: '💬' },
    { key: 'responsiveness', label: 'Responsiveness', emoji: '⚡' },
    { key: 'cleanliness', label: 'Cleanliness', emoji: '✨' },
    { key: 'accuracy', label: 'Accuracy', emoji: '🎯' },
];

function avg(arr) {
    if (!arr || arr.length === 0) return 0;
    return arr.reduce((a, b) => a + b, 0) / arr.length;
}

function StarDisplay({ rating, size = 16 }) {
    return (
        <div className="flex items-center gap-0.5">
            {[1, 2, 3, 4, 5].map((s) => (
                <Star
                    key={s}
                    size={size}
                    strokeWidth={1.5}
                    className={`${rating >= s ? 'text-amber-400 fill-amber-400' : rating >= s - 0.5 ? 'text-amber-400 fill-amber-200' : 'text-slate-200 dark:text-slate-700'}`}
                />
            ))}
        </div>
    );
}

export default function OwnerProfile() {
    const { id } = useParams();
    const navigate = useNavigate();
    const { currentUser } = useAuth();

    const [owner, setOwner] = useState(null);
    const [properties, setProperties] = useState([]);
    const [reviews, setReviews] = useState([]);
    const [eligibleMoveIn, setEligibleMoveIn] = useState(null); // the tenantMoveIn record that unlocks review
    const [loading, setLoading] = useState(true);
    const [reviewsLoading, setReviewsLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('listings'); // 'listings' | 'reviews'

    const [reviewModal, setReviewModal] = useState(false);

    useEffect(() => {
        const fetchAll = async () => {
            try {
                // Owner profile
                const ownerDoc = await getDoc(doc(db, 'users', id));
                if (ownerDoc.exists()) setOwner({ id: ownerDoc.id, ...ownerDoc.data() });

                // Properties
                const [snap1, snap2] = await Promise.all([
                    getDocs(query(collection(db, 'properties'), where('ownerId', '==', id), where('isApproved', '==', true))),
                    getDocs(query(collection(db, 'properties'), where('userId', '==', id), where('isApproved', '==', true))),
                ]);
                const propsMap = new Map();
                snap1.forEach(d => propsMap.set(d.id, { id: d.id, ...d.data() }));
                snap2.forEach(d => propsMap.set(d.id, { id: d.id, ...d.data() }));
                setProperties(Array.from(propsMap.values()));

                // Check if current user has an eligible moveIn
                if (currentUser) {
                    const miSnap = await getDocs(
                        query(
                            collection(db, 'tenantMoveIns'),
                            where('tenantId', '==', currentUser.uid),
                            where('ownerId', '==', id)
                        )
                    );
                    const eligible = miSnap.docs.find(d => !d.data().hasReviewed);
                    if (eligible) setEligibleMoveIn({ firestoreId: eligible.id, ...eligible.data() });
                }
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        };
        if (id) fetchAll();
    }, [id, currentUser]);

    useEffect(() => {
        if (!id) return;
        setReviewsLoading(true);
        getDocs(
            query(
                collection(db, 'ownerReviews'),
                where('ownerId', '==', id),
                where('isApproved', '==', true)
            )
        ).then(snap => {
            const data = snap.docs.map(d => ({ id: d.id, ...d.data() }));
            data.sort((a, b) => {
                const ta = a.createdAt?.seconds || 0;
                const tb = b.createdAt?.seconds || 0;
                return tb - ta;
            });
            setReviews(data);
        }).finally(() => setReviewsLoading(false));
    }, [id]);

    // Computed stats
    const stats = useMemo(() => {
        if (reviews.length === 0) return null;
        const overallAvg = avg(reviews.map(r => r.rating));
        const catAvgs = Object.fromEntries(
            CATEGORIES.map(c => [c.key, avg(reviews.map(r => r.categories?.[c.key] || 0))])
        );
        const distribution = [5, 4, 3, 2, 1].map(star => ({
            star,
            count: reviews.filter(r => r.rating === star).length,
            pct: (reviews.filter(r => r.rating === star).length / reviews.length) * 100,
        }));
        return { overallAvg, catAvgs, distribution };
    }, [reviews]);

    const displayName = owner?.fullName || owner?.name || owner?.displayName || 'Property Owner';
    const memberYear = owner?.createdAt
        ? (owner.createdAt.toDate ? owner.createdAt.toDate().getFullYear() : new Date(owner.createdAt).getFullYear())
        : '2026';

    if (loading) return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center">
            <PropertyLoader />
        </div>
    );

    if (!owner) return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center p-6 text-center">
            <h1 className="text-2xl font-black">User not found</h1>
        </div>
    );

    return (
        <div className="min-h-screen bg-[#f8fafc] dark:bg-slate-950 pb-24">
            <Helmet>
                <title>{displayName} — Landlord Profile | Any-Let</title>
            </Helmet>

            {/* Back */}
            <div className="max-w-5xl mx-auto px-4 md:px-6 pt-6">
                <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-slate-500 hover:text-primary transition-colors font-bold mb-6">
                    <ArrowLeft size={20} /> Back
                </button>
            </div>

            {/* ─── HERO CARD ─── */}
            <div className="max-w-5xl mx-auto px-4 md:px-6 mb-8">
                <div className="relative bg-white dark:bg-slate-900 rounded-[40px] overflow-hidden shadow-sm border border-slate-100 dark:border-slate-800">
                    {/* Top gradient bar */}
                    <div className="h-28 bg-gradient-to-r from-primary via-indigo-600 to-violet-600" />

                    <div className="px-8 pb-8 -mt-14">
                        <div className="flex flex-col sm:flex-row sm:items-end gap-6">
                            {/* Avatar */}
                            <div className="relative">
                                <div className="size-28 rounded-[28px] bg-white dark:bg-slate-800 border-4 border-white dark:border-slate-900 shadow-xl flex items-center justify-center text-4xl font-black text-primary overflow-hidden">
                                    {owner.photoURL ? (
                                        <img src={owner.photoURL} alt={displayName} className="w-full h-full object-cover" />
                                    ) : (
                                        displayName[0].toUpperCase()
                                    )}
                                </div>
                                {(owner.verified || owner.role === 'admin') && (
                                    <div className="absolute -bottom-1 -right-1 bg-emerald-500 text-white p-1.5 rounded-xl shadow-lg shadow-emerald-500/30 ring-2 ring-white dark:ring-slate-900">
                                        <ShieldCheck size={14} strokeWidth={3} />
                                    </div>
                                )}
                            </div>

                            {/* Info */}
                            <div className="flex-1 min-w-0 pb-1">
                                <h1 className="text-2xl md:text-3xl font-black text-slate-900 dark:text-white leading-tight mb-1 truncate">
                                    {displayName}
                                </h1>
                                <p className="text-sm font-bold text-slate-500 mb-3">
                                    {owner.role === 'admin' ? 'Platform Admin' : 'Property Owner / Landlord'}
                                </p>

                                <div className="flex flex-wrap items-center gap-3">
                                    {stats ? (
                                        <div className="flex items-center gap-1.5 bg-amber-50 dark:bg-amber-500/10 px-3 py-1.5 rounded-xl">
                                            <Star size={14} className="text-amber-500 fill-amber-500" />
                                            <span className="text-sm font-black text-amber-700 dark:text-amber-400">
                                                {stats.overallAvg.toFixed(1)}
                                            </span>
                                            <span className="text-xs font-bold text-amber-600/70 dark:text-amber-400/70">
                                                ({reviews.length} {reviews.length === 1 ? 'review' : 'reviews'})
                                            </span>
                                        </div>
                                    ) : (
                                        <div className="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-800 px-3 py-1.5 rounded-xl">
                                            <Star size={14} className="text-slate-400" />
                                            <span className="text-xs font-bold text-slate-500">No reviews yet</span>
                                        </div>
                                    )}
                                    <div className="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-800 px-3 py-1.5 rounded-xl">
                                        <Calendar size={12} className="text-slate-400" />
                                        <span className="text-xs font-bold text-slate-500">Member since {memberYear}</span>
                                    </div>
                                    <div className="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-800 px-3 py-1.5 rounded-xl">
                                        <Building2 size={12} className="text-slate-400" />
                                        <span className="text-xs font-bold text-slate-500">{properties.length} active listing{properties.length !== 1 ? 's' : ''}</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Eligible Review CTA */}
                        {eligibleMoveIn && (
                            <motion.div
                                initial={{ opacity: 0, y: 8 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="mt-6 bg-gradient-to-r from-primary/5 to-indigo-500/5 border border-primary/20 dark:border-primary/30 rounded-3xl p-5 flex items-center gap-4"
                            >
                                <div className="size-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary shrink-0">
                                    <Award size={24} />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-black text-slate-900 dark:text-white">You're a verified ex-tenant!</p>
                                    <p className="text-xs font-medium text-slate-500">Share your experience with future renters.</p>
                                </div>
                                <button
                                    onClick={() => setReviewModal(true)}
                                    className="shrink-0 flex items-center gap-1.5 bg-primary text-white font-black text-xs px-4 py-2.5 rounded-2xl shadow-lg shadow-primary/20 hover:scale-105 active:scale-95 transition-all"
                                >
                                    <Star size={14} className="fill-white" /> Write Review
                                </button>
                            </motion.div>
                        )}
                    </div>
                </div>
            </div>

            {/* ─── TABS ─── */}
            <div className="max-w-5xl mx-auto px-4 md:px-6 mb-8">
                <div className="bg-white dark:bg-slate-900 rounded-[20px] p-1.5 flex border border-slate-100 dark:border-slate-800 shadow-sm">
                    {[
                        { key: 'listings', label: `Listings (${properties.length})`, icon: <Home size={16} /> },
                        { key: 'reviews', label: `Reviews (${reviews.length})`, icon: <Star size={16} /> },
                    ].map(tab => (
                        <button
                            key={tab.key}
                            onClick={() => setActiveTab(tab.key)}
                            className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-2xl font-black text-sm transition-all ${activeTab === tab.key
                                ? 'bg-primary text-white shadow-lg shadow-primary/20'
                                : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
                                }`}
                        >
                            {tab.icon} {tab.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* ─── TAB CONTENT ─── */}
            <div className="max-w-5xl mx-auto px-4 md:px-6">
                <AnimatePresence mode="wait">
                    {activeTab === 'listings' && (
                        <motion.div key="listings" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.2 }}>
                            {properties.length > 0 ? (
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                    {properties.map(p => <PropertyCard key={p.id} property={p} />)}
                                </div>
                            ) : (
                                <div className="py-16 text-center bg-white dark:bg-slate-900 rounded-3xl border border-slate-100 dark:border-slate-800">
                                    <Home size={40} className="text-slate-300 mx-auto mb-4" />
                                    <p className="text-lg font-bold text-slate-400">No active listings</p>
                                </div>
                            )}
                        </motion.div>
                    )}

                    {activeTab === 'reviews' && (
                        <motion.div key="reviews" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.2 }}>
                            {reviewsLoading ? (
                                <div className="flex justify-center py-16">
                                    <Loader2 size={32} className="animate-spin text-primary" />
                                </div>
                            ) : reviews.length === 0 ? (
                                <div className="py-16 text-center bg-white dark:bg-slate-900 rounded-3xl border border-slate-100 dark:border-slate-800">
                                    <div className="size-16 rounded-3xl bg-amber-50 dark:bg-amber-500/10 flex items-center justify-center mx-auto mb-4">
                                        <Star size={28} className="text-amber-400" />
                                    </div>
                                    <p className="text-lg font-black text-slate-700 dark:text-white mb-1">No reviews yet</p>
                                    <p className="text-sm font-medium text-slate-400 max-w-xs mx-auto">
                                        Be the first verified tenant to leave a review for this landlord.
                                    </p>
                                    {eligibleMoveIn && (
                                        <button
                                            onClick={() => setReviewModal(true)}
                                            className="mt-6 inline-flex items-center gap-2 bg-primary text-white font-black px-6 py-3.5 rounded-2xl shadow-lg shadow-primary/20 hover:scale-105 transition-all text-sm"
                                        >
                                            <Star size={16} className="fill-white" /> Write First Review
                                        </button>
                                    )}
                                </div>
                            ) : (
                                <div className="space-y-6">
                                    {/* Rating Summary */}
                                    {stats && (
                                        <div className="bg-white dark:bg-slate-900 rounded-[32px] border border-slate-100 dark:border-slate-800 p-6 md:p-8 shadow-sm">
                                            <div className="flex flex-col md:flex-row gap-8">
                                                {/* Big Score */}
                                                <div className="flex flex-col items-center justify-center shrink-0 min-w-[140px]">
                                                    <p className="text-6xl font-black text-slate-900 dark:text-white">
                                                        {stats.overallAvg.toFixed(1)}
                                                    </p>
                                                    <StarDisplay rating={stats.overallAvg} size={20} />
                                                    <p className="text-xs font-bold text-slate-400 mt-2">{reviews.length} {reviews.length === 1 ? 'review' : 'reviews'}</p>
                                                </div>

                                                {/* Star Distribution */}
                                                <div className="flex-1 space-y-2">
                                                    {stats.distribution.map(({ star, count, pct }) => (
                                                        <div key={star} className="flex items-center gap-3">
                                                            <span className="text-xs font-black text-slate-500 w-3">{star}</span>
                                                            <Star size={12} className="text-amber-400 fill-amber-400 shrink-0" />
                                                            <div className="flex-1 h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                                                                <motion.div
                                                                    className="h-full bg-amber-400 rounded-full"
                                                                    initial={{ width: 0 }}
                                                                    animate={{ width: `${pct}%` }}
                                                                    transition={{ delay: 0.1, duration: 0.5, ease: 'easeOut' }}
                                                                />
                                                            </div>
                                                            <span className="text-xs font-bold text-slate-400 w-4 text-right">{count}</span>
                                                        </div>
                                                    ))}
                                                </div>

                                                {/* Category Averages */}
                                                <div className="flex-1 grid grid-cols-2 gap-3">
                                                    {CATEGORIES.map((cat) => (
                                                        <div key={cat.key} className="bg-slate-50 dark:bg-slate-800 rounded-2xl p-3 text-center">
                                                            <p className="text-lg mb-1">{cat.emoji}</p>
                                                            <p className="text-xs font-black text-slate-500 dark:text-slate-400 mb-1">{cat.label}</p>
                                                            <p className="text-lg font-black text-slate-900 dark:text-white">{stats.catAvgs[cat.key].toFixed(1)}</p>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    {/* Write Review CTA (if eligible) */}
                                    {eligibleMoveIn && (
                                        <button
                                            onClick={() => setReviewModal(true)}
                                            className="w-full bg-gradient-to-r from-primary to-indigo-600 text-white font-black py-5 rounded-[24px] shadow-xl shadow-primary/20 hover:scale-[1.01] active:scale-98 transition-all flex items-center justify-center gap-2 text-base"
                                        >
                                            <Star size={20} className="fill-white" /> Write Your Review
                                            <ChevronRight size={20} />
                                        </button>
                                    )}

                                    {/* Reviews List */}
                                    <div className="space-y-4">
                                        {reviews.map((review, idx) => (
                                            <ReviewCard key={review.id} review={review} idx={idx} />
                                        ))}
                                    </div>
                                </div>
                            )}
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            {/* Write Review Modal */}
            <WriteReviewModal
                isOpen={reviewModal}
                onClose={() => setReviewModal(false)}
                moveIn={eligibleMoveIn}
                ownerId={id}
                ownerName={displayName}
            />
        </div>
    );
}

function ReviewCard({ review, idx }) {
    const formatDate = (ts) => {
        if (!ts) return '';
        const date = ts.toDate ? ts.toDate() : new Date(ts);
        return new Intl.DateTimeFormat('en-US', { month: 'short', year: 'numeric' }).format(date);
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.05 }}
            className="bg-white dark:bg-slate-900 rounded-[28px] border border-slate-100 dark:border-slate-800 p-6 shadow-sm"
        >
            {/* Reviewer header */}
            <div className="flex items-start gap-4 mb-4">
                <div className="size-11 rounded-full bg-primary/10 flex items-center justify-center text-primary font-black text-base shrink-0">
                    {review.reviewerAvatar ? (
                        <img src={review.reviewerAvatar} alt={review.reviewerName} className="w-full h-full rounded-full object-cover" />
                    ) : (
                        (review.reviewerName || 'A')[0].toUpperCase()
                    )}
                </div>
                <div className="flex-1 min-w-0">
                    <p className="font-black text-slate-900 dark:text-white text-[15px] truncate">{review.reviewerName || 'Anonymous'}</p>
                    <div className="flex items-center gap-2 flex-wrap">
                        <div className="flex items-center gap-0.5">
                            {[1,2,3,4,5].map(s => (
                                <Star key={s} size={13} strokeWidth={1.5} className={`${review.rating >= s ? 'text-amber-400 fill-amber-400' : 'text-slate-200 dark:text-slate-700'}`} />
                            ))}
                        </div>
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{formatDate(review.createdAt)}</span>
                        {review.propertyName && (
                            <span className="text-[10px] font-bold text-primary bg-primary/10 px-2 py-0.5 rounded-full truncate max-w-[140px]">
                                {review.propertyName}
                            </span>
                        )}
                    </div>
                </div>
                <div className="shrink-0 flex items-center gap-1 text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-500/10 px-2 py-1 rounded-xl border border-emerald-100 dark:border-emerald-500/20">
                    <ShieldCheck size={11} strokeWidth={3} />
                    <span className="text-[9px] font-black uppercase tracking-wider">Verified</span>
                </div>
            </div>

            {/* Body */}
            <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed font-medium mb-4">
                {review.body}
            </p>

            {/* Category pills */}
            {review.categories && (
                <div className="flex flex-wrap gap-2">
                    {CATEGORIES.map(cat => {
                        const val = review.categories[cat.key];
                        if (!val) return null;
                        return (
                            <div key={cat.key} className="flex items-center gap-1.5 bg-slate-50 dark:bg-slate-800 px-3 py-1.5 rounded-xl border border-slate-100 dark:border-slate-700">
                                <span className="text-xs">{cat.emoji}</span>
                                <span className="text-[10px] font-black text-slate-500 dark:text-slate-400">{cat.label}</span>
                                <span className="text-[10px] font-black text-amber-500">{val}/5</span>
                            </div>
                        );
                    })}
                </div>
            )}
        </motion.div>
    );
}
