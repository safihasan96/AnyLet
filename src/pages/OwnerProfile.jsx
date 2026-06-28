import { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { doc, getDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../contexts/AuthContext';
import { motion, useReducedMotion } from 'framer-motion';
import {
    ArrowLeft, Star, ShieldCheck, Calendar, Home, MessageSquare,
    Award, Building2, Loader2, ThumbsUp, MapPin
} from 'lucide-react';
import PropertyCard from '../components/PropertyCard';
import { OwnerProfileSkeleton } from '../components/Skeleton';
import WriteReviewModal from '../components/WriteReviewModal';
import { Helmet } from 'react-helmet-async';
import { useToast } from '../contexts/ToastContext';
import { toggleHelpfulVote, submitLandlordReply } from '../utils/reviewService';
import logger from '../utils/logger';

// ── Named variants (Framer Motion rule #1 — all motion config OUTSIDE the component) ──
const fadeUp = {
    hidden: { opacity: 0, y: 10 },
    visible: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 300, damping: 26 } },
};

const reviewCardVariants = {
    hidden: { opacity: 0, y: 16 },
    visible: (i) => ({
        opacity: 1,
        y: 0,
        transition: { delay: i * 0.05, type: 'spring', stiffness: 320, damping: 26 },
    }),
};

const ctaBannerVariants = {
    hidden: { opacity: 0, y: 8 },
    visible: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 300, damping: 24 } },
};

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
    const toast = useToast();

    const [owner, setOwner] = useState(null);
    const [properties, setProperties] = useState([]);
    const [reviews, setReviews] = useState([]);
    const [eligibleMoveIn, setEligibleMoveIn] = useState(null); // the tenantMoveIn record that unlocks review
    const [loading, setLoading] = useState(true);
    const [reviewsLoading, setReviewsLoading] = useState(true);

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
                logger.error(err);
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

    const handleHelpfulVote = async (reviewId) => {
        if (!currentUser) {
            navigate('/login');
            return;
        }
        try {
            await toggleHelpfulVote('ownerReviews', reviewId, currentUser.uid);
            // Optimistic update
            setReviews(reviews.map(r => {
                if (r.id === reviewId) {
                    const hasVoted = (r.helpfulUsers || []).includes(currentUser.uid);
                    return {
                        ...r,
                        helpfulUsers: hasVoted ? r.helpfulUsers.filter(uid => uid !== currentUser.uid) : [...(r.helpfulUsers || []), currentUser.uid],
                        helpfulVotes: hasVoted ? Math.max(0, (r.helpfulVotes || 1) - 1) : (r.helpfulVotes || 0) + 1
                    };
                }
                return r;
            }));
        } catch (error) {
            logger.error(error);
            toast.error("Failed to register vote");
        }
    };

    const handleReply = async (reviewId, text) => {
        if (!currentUser || !text.trim()) return;
        try {
             const ownerName = currentUser.displayName || 'Property Owner';
             await submitLandlordReply('ownerReviews', reviewId, text, currentUser.uid, ownerName);
             setReviews(reviews.map(r => {
                 if (r.id === reviewId) {
                     return {
                         ...r,
                         landlordReply: {
                             text,
                             ownerId: currentUser.uid,
                             ownerName: ownerName,
                             createdAt: new Date()
                         }
                     };
                 }
                 return r;
             }));
             toast.success("Reply posted!");
        } catch (error) {
             logger.error(error);
             toast.error("Failed to post reply");
        }
    };

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

    if (loading) return <OwnerProfileSkeleton />;

    if (!owner) return (
        <div className="min-h-screen bg-[#F8F9FA] dark:bg-[#0F1117] flex items-center justify-center p-6 text-center">
            <h1 className="text-2xl font-black">User not found</h1>
        </div>
    );

    return (
        <div className="flex flex-col min-h-screen bg-[#F8F9FA] dark:bg-[#0F1117] pb-24">
            <Helmet>
                <title>{displayName} — Landlord Profile | Any-Let</title>
            </Helmet>

            <main className="flex-1 w-full max-w-5xl mx-auto px-4 md:px-8 py-8 md:py-12 space-y-8">
                
                {/* Back button */}
                <button onClick={() => navigate(-1)} className="hidden md:flex items-center gap-2 text-slate-500 hover:text-primary dark:text-indigo-400 transition-colors font-bold -mt-4">
                    <ArrowLeft size={20} /> Back
                </button>
                
                {/* Profile Header Card */}
                <section className="relative bg-white dark:bg-[#1A1D24] rounded-[32px] shadow-sm border border-slate-100/80 dark:border-white/[0.06] overflow-hidden">
                    {/* Cover Photo Area */}
                    <div className="h-48 md:h-72 w-full relative">
                        <div 
                            className="bg-cover bg-center w-full h-full"
                            style={{ backgroundImage: `url(${owner.coverPhoto || 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?ixlib=rb-4.0.3&auto=format&fit=crop&w=2000&q=80'})` }}
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-slate-900/60 to-transparent" />
                    </div>

                    {/* Profile Info */}
                    <div className="relative px-6 md:px-10 pb-8 md:pb-10 -mt-20 md:-mt-24 flex flex-col md:flex-row items-center md:items-end gap-6 md:gap-8 z-10">
                        <div className="relative">
                            <img 
                                src={owner.photoURL || `https://ui-avatars.com/api/?name=${encodeURIComponent(displayName)}&background=1a227f&color=fff`}
                                alt="Profile" 
                                className="w-32 h-32 md:w-40 md:h-40 rounded-full object-cover border-4 border-white dark:border-[#1A1D24] shadow-md bg-white"
                            />
                            {(owner.verified || owner.role === 'admin') && (
                                <div className="absolute bottom-2 right-2 bg-emerald-500 text-white w-10 h-10 rounded-full flex items-center justify-center shadow-lg border-2 border-white dark:border-[#1A1D24]">
                                    <ShieldCheck size={20} strokeWidth={2.5} />
                                </div>
                            )}
                        </div>
                        
                        <div className="text-center md:text-left flex-1 mb-2">
                            <h1 className="text-3xl md:text-4xl font-black text-slate-900 dark:text-white tracking-tight">
                                {displayName}
                            </h1>
                            <p className="text-slate-500 font-bold flex items-center justify-center md:justify-start gap-1.5 mt-2">
                                <MapPin size={16} className="text-[#1a227f] dark:text-indigo-400" />
                                {owner.location || 'Bangladesh'} • {owner.role === 'admin' ? 'Platform Admin' : owner.membershipTier || 'Property Owner'}
                            </p>
                        </div>
                        
                        <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto mt-2 md:mt-0 mb-2">
                            <button 
                                onClick={() => {
                                    if(navigator.share) {
                                        navigator.share({
                                            title: `${displayName}'s Profile`,
                                            url: window.location.href
                                        });
                                    } else {
                                        navigator.clipboard.writeText(window.location.href);
                                        toast.success("Profile link copied!");
                                    }
                                }}
                                className="bg-slate-100 dark:bg-slate-800 text-[#1a227f] dark:text-indigo-400 px-6 py-3.5 rounded-2xl font-black hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors flex items-center justify-center gap-2"
                            >
                                Share Profile
                            </button>
                        </div>
                    </div>
                </section>

                {/* Eligible Review CTA */}
                {eligibleMoveIn && (
                    <motion.div
                        variants={ctaBannerVariants}
                        initial="hidden"
                        animate="visible"
                        className="bg-gradient-to-r from-primary/5 to-indigo-500/5 border border-primary/20 dark:border-indigo-500/30 rounded-[32px] p-6 flex items-center gap-4"
                    >
                        <div className="size-14 rounded-2xl bg-[#1a227f]/10 flex items-center justify-center text-[#1a227f] dark:text-indigo-400 shrink-0">
                            <Award size={28} />
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-base font-black text-slate-900 dark:text-white">You're a verified ex-tenant!</p>
                            <p className="text-sm font-medium text-slate-500">Share your experience with future renters.</p>
                        </div>
                        <button
                            onClick={() => setReviewModal(true)}
                            className="shrink-0 flex items-center gap-2 bg-[#1a227f] text-white font-black text-sm px-6 py-3 rounded-2xl shadow-lg shadow-[#1a227f]/20 hover:scale-105 active:scale-95 transition-all"
                        >
                            <Star size={16} className="fill-white" /> Write Review
                        </button>
                    </motion.div>
                )}

                {/* Bento Grid Content */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8">
                    
                    {/* Main Column (About Me + Listings) */}
                    <div className="md:col-span-2 space-y-6 md:space-y-8">
                        {/* Bio */}
                        <div className="bg-white dark:bg-[#1A1D24] p-8 rounded-[32px] shadow-sm border border-slate-100/80 dark:border-white/[0.06]">
                            <h3 className="text-xl font-black text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                                <MessageSquare size={20} className="text-[#1a227f] dark:text-indigo-400" />
                                About Me
                            </h3>
                            <p className="text-[15px] font-medium text-slate-600 dark:text-slate-400 leading-relaxed whitespace-pre-line">
                                {owner.bio || "This owner hasn't added a bio yet."}
                            </p>
                        </div>

                        {/* Listings */}
                        <div className="bg-white dark:bg-[#1A1D24] p-8 rounded-[32px] shadow-sm border border-slate-100/80 dark:border-white/[0.06]">
                            <h3 className="text-xl font-black text-slate-900 dark:text-white mb-6 flex items-center gap-2">
                                <Home size={20} className="text-[#1a227f] dark:text-indigo-400" />
                                Listings from this owner
                            </h3>
                            
                            {properties.length > 0 ? (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    {properties.map(p => <PropertyCard key={p.id} property={p} />)}
                                </div>
                            ) : (
                                <div className="py-12 text-center bg-slate-50 dark:bg-[#222630] rounded-3xl border border-slate-100/80 dark:border-white/[0.04]">
                                    <Home size={40} className="text-slate-300 dark:text-slate-600 mx-auto mb-4" />
                                    <p className="text-lg font-bold text-slate-400 dark:text-slate-500">No active listings</p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Side Column (Quick Stats + Reviews) */}
                    <div className="space-y-6">
                        
                        {/* Stats Group */}
                        <div className="grid grid-cols-2 md:grid-cols-1 gap-6">
                            <div className="bg-white dark:bg-[#1A1D24] p-6 rounded-[32px] shadow-sm border border-slate-100/80 dark:border-white/[0.06] flex flex-col items-center text-center">
                                <div className="w-14 h-14 bg-emerald-50 dark:bg-emerald-500/10 text-emerald-500 rounded-2xl flex items-center justify-center mb-4">
                                    <Calendar size={28} strokeWidth={2.5} />
                                </div>
                                <span className="text-2xl font-black text-slate-900 dark:text-white mb-1">{memberYear}</span>
                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Member Since</span>
                            </div>
                            
                            <div className="bg-white dark:bg-[#1A1D24] p-6 rounded-[32px] shadow-sm border border-slate-100/80 dark:border-white/[0.06] flex flex-col items-center text-center">
                                <div className="w-14 h-14 bg-indigo-50 dark:bg-indigo-500/10 text-primary dark:text-indigo-400 rounded-2xl flex items-center justify-center mb-4">
                                    <Building2 size={28} strokeWidth={2.5} />
                                </div>
                                <span className="text-2xl font-black text-slate-900 dark:text-white mb-1">{properties.length}</span>
                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Properties Managed</span>
                            </div>

                            <div className="bg-white dark:bg-[#1A1D24] p-6 rounded-[32px] shadow-sm border border-slate-100/80 dark:border-white/[0.06] flex flex-col items-center text-center col-span-2 md:col-span-1">
                                <div className="w-14 h-14 bg-amber-50 dark:bg-amber-500/10 text-amber-500 rounded-2xl flex items-center justify-center mb-4">
                                    <MessageSquare size={28} strokeWidth={2.5} />
                                </div>
                                <span className="text-2xl font-black text-slate-900 dark:text-white mb-1">
                                    {owner.responseRate ? `${owner.responseRate}%` : 'N/A'}
                                </span>
                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Response Rate</span>
                            </div>
                        </div>

                        {/* Reviews Section */}
                        <div className="bg-white dark:bg-[#1A1D24] p-6 md:p-8 rounded-[32px] shadow-sm border border-slate-100/80 dark:border-white/[0.06]">
                            <h3 className="text-xl font-black text-slate-900 dark:text-white mb-6 flex items-center gap-2">
                                <Star size={20} className="text-[#1a227f] dark:text-indigo-400" />
                                Reviews
                            </h3>
                            
                            {reviewsLoading ? (
                                <div className="flex justify-center py-8">
                                    <Loader2 size={32} className="animate-spin text-[#1a227f] dark:text-indigo-400" />
                                </div>
                            ) : reviews.length === 0 ? (
                                <div className="py-8 text-center">
                                    <div className="size-16 rounded-3xl bg-amber-50 dark:bg-amber-500/10 flex items-center justify-center mx-auto mb-4">
                                        <Star size={28} className="text-amber-400" />
                                    </div>
                                    <p className="text-base font-black text-slate-700 dark:text-white mb-1">No reviews yet</p>
                                    <p className="text-xs font-medium text-slate-400">
                                        Check back later for reviews.
                                    </p>
                                </div>
                            ) : (
                                <div className="space-y-6">
                                    {/* Small Rating Summary */}
                                    {stats && (
                                        <div className="bg-slate-50 dark:bg-[#222630] rounded-2xl p-4 flex flex-col items-center mb-6 border border-slate-100/80 dark:border-white/[0.04]">
                                            <p className="text-4xl font-black text-slate-900 dark:text-white">
                                                {stats.overallAvg.toFixed(1)}
                                            </p>
                                            <StarDisplay rating={stats.overallAvg} size={16} />
                                            <p className="text-xs font-bold text-slate-400 mt-1">{reviews.length} {reviews.length === 1 ? 'review' : 'reviews'}</p>
                                        </div>
                                    )}

                                    {/* Review Cards */}
                                    <div className="space-y-4">
                                        {reviews.map((review, idx) => (
                                            <ReviewCard 
                                                key={review.id} 
                                                review={review} 
                                                idx={idx} 
                                                onHelpful={() => handleHelpfulVote(review.id)}
                                                currentUserId={currentUser?.uid}
                                                isOwner={currentUser?.uid === id}
                                                onReply={(text) => handleReply(review.id, text)}
                                            />
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>

                    </div>
                </div>
            </main>

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

function ReviewCard({ review, idx, onHelpful, currentUserId, isOwner, onReply }) {
    const [replyText, setReplyText] = useState('');
    const [isReplying, setIsReplying] = useState(false);

    const formatDate = (ts) => {
        if (!ts) return '';
        const date = ts.toDate ? ts.toDate() : new Date(ts);
        return new Intl.DateTimeFormat('en-US', { month: 'short', year: 'numeric' }).format(date);
    };

    const hasVotedHelpful = (review.helpfulUsers || []).includes(currentUserId);

    return (
        <motion.div
            custom={idx}
            variants={reviewCardVariants}
            initial="hidden"
            animate="visible"
            className="bg-white dark:bg-[#1A1D24] rounded-[28px] border border-slate-100/80 dark:border-white/[0.06] p-6 shadow-sm"
        >
            {/* Reviewer header */}
            <div className="flex items-start gap-4 mb-4">
                <div className="size-11 rounded-full bg-primary/10 flex items-center justify-center text-primary dark:text-indigo-400 font-black text-base shrink-0 overflow-hidden">
                    {review.reviewerAvatar ? (
                        <img loading="lazy" src={review.reviewerAvatar} alt={review.reviewerName} className="w-full h-full object-cover" />
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
                            <span className="text-[10px] font-bold text-primary dark:text-indigo-400 bg-primary/10 px-2 py-0.5 rounded-full truncate max-w-[140px]">
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
            <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed font-medium mb-4 whitespace-pre-wrap">
                {review.body}
            </p>

            {/* Category pills */}
            {review.categories && (
                <div className="flex flex-wrap gap-2 mb-4">
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

            {/* Actions & Replies */}
            <div className="flex flex-col gap-4 mt-2 border-t border-slate-100 dark:border-white/[0.06] pt-4">
                <div className="flex items-center justify-between">
                    <button 
                        onClick={onHelpful}
                        className={`flex items-center gap-1.5 text-xs font-bold transition-colors px-3 py-1.5 rounded-full ${hasVotedHelpful ? 'bg-primary/10 text-primary dark:text-indigo-400' : 'hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500'}`}
                    >
                        <ThumbsUp size={14} className={hasVotedHelpful ? 'fill-primary dark:fill-indigo-400' : ''} /> 
                        Helpful ({review.helpfulVotes || 0})
                    </button>
                    
                    {isOwner && !review.landlordReply && !isReplying && (
                        <button 
                            onClick={() => setIsReplying(true)}
                            className="flex items-center gap-1.5 text-xs font-bold text-primary dark:text-indigo-400 hover:text-indigo-600 transition-colors"
                        >
                            <MessageSquare size={14} /> Reply
                        </button>
                    )}
                </div>

                {/* Landlord Reply Box */}
                {review.landlordReply && (
                     <div className="bg-slate-50 dark:bg-[#222630] p-4 rounded-2xl ml-4 sm:ml-8 border border-slate-100/80 dark:border-white/[0.04] relative">
                         <div className="absolute top-0 left-0 w-1 h-full bg-primary/30 rounded-l-2xl"></div>
                         <div className="flex items-center gap-2 mb-2">
                             <div className="size-6 bg-primary/20 text-primary rounded-full flex items-center justify-center font-bold text-xs">
                                 {review.landlordReply.ownerName?.[0] || 'O'}
                             </div>
                             <span className="text-xs font-black text-slate-900 dark:text-white">Response from {review.landlordReply.ownerName || 'Owner'}</span>
                             <span className="text-[10px] text-slate-400">{formatDate(review.landlordReply.createdAt)}</span>
                         </div>
                         <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed pl-8 whitespace-pre-wrap">
                             {review.landlordReply.text}
                         </p>
                     </div>
                )}

                {/* Reply Input Form */}
                {isOwner && !review.landlordReply && isReplying && (
                     <div className="bg-slate-50 dark:bg-[#222630] p-4 rounded-2xl border border-slate-200 dark:border-white/[0.06]">
                         <textarea
                             value={replyText}
                             onChange={e => setReplyText(e.target.value)}
                             placeholder="Write a public response to this review..."
                             className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 resize-none min-h-[80px] mb-3"
                         />
                         <div className="flex justify-end gap-2">
                             <button onClick={() => setIsReplying(false)} className="px-4 py-2 text-xs font-bold text-slate-500 hover:text-slate-700">Cancel</button>
                             <button 
                                onClick={() => { onReply(replyText); setIsReplying(false); }}
                                disabled={!replyText.trim()}
                                className="px-4 py-2 bg-primary text-white text-xs font-bold rounded-lg disabled:opacity-50"
                             >
                                 Post Reply
                             </button>
                         </div>
                     </div>
                )}
            </div>
        </motion.div>
    );
}
