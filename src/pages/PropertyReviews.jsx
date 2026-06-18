import { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { doc, getDoc, collection, query, where, getDocs, orderBy } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../contexts/AuthContext';
import { motion } from 'framer-motion';
import {
    ArrowLeft, Star, ShieldCheck, Loader2, MessageSquare, ThumbsUp
} from 'lucide-react';
import { toggleHelpfulVote, submitLandlordReply } from '../utils/reviewService';
import PropertyLoader from '../components/PropertyLoader';
import { Helmet } from 'react-helmet-async';
import { useToast } from '../contexts/ToastContext';
import logger from '../utils/logger';

const CATEGORIES = [
    { key: 'location', label: 'Location', emoji: '📍' },
    { key: 'value', label: 'Value', emoji: '💰' },
    { key: 'cleanliness', label: 'Cleanliness', emoji: '✨' },
    { key: 'accuracy', label: 'Accuracy', emoji: '🎯' },
    { key: 'communication', label: 'Communication', emoji: '💬' },
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

export default function PropertyReviews() {
    const { id } = useParams();
    const navigate = useNavigate();
    const { currentUser } = useAuth();
    const toast = useToast();

    const [property, setProperty] = useState(null);
    const [reviews, setReviews] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchAll = async () => {
            try {
                // Property
                const propDoc = await getDoc(doc(db, 'properties', id));
                if (propDoc.exists()) {
                    setProperty({ id: propDoc.id, ...propDoc.data() });
                }

                // Reviews
                const snap = await getDocs(
                    query(
                        collection(db, 'propertyReviews'),
                        where('propertyId', '==', id),
                        where('isApproved', '==', true)
                    )
                );
                const data = snap.docs.map(d => ({ id: d.id, ...d.data() }));
                data.sort((a, b) => {
                    const ta = a.createdAt?.seconds || 0;
                    const tb = b.createdAt?.seconds || 0;
                    return tb - ta;
                });
                setReviews(data);
            } catch (err) {
                logger.error(err);
            } finally {
                setLoading(false);
            }
        };
        if (id) fetchAll();
    }, [id]);

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

    const handleHelpfulVote = async (reviewId) => {
        if (!currentUser) {
            navigate('/login');
            return;
        }
        try {
            await toggleHelpfulVote('propertyReviews', reviewId, currentUser.uid);
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
             await submitLandlordReply('propertyReviews', reviewId, text, currentUser.uid, ownerName);
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

    if (loading) return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center">
            <PropertyLoader />
        </div>
    );

    if (!property) return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center p-6 text-center">
            <h1 className="text-2xl font-black">Property not found</h1>
        </div>
    );

    const isOwner = currentUser && (property.userId === currentUser.uid || property.ownerId === currentUser.uid);

    return (
        <div className="min-h-screen bg-[#f8fafc] dark:bg-slate-950 pb-24">
            <Helmet>
                <title>Reviews for {property.title} | Any-Let</title>
            </Helmet>

            {/* Back */}
            <div className="max-w-5xl mx-auto px-4 md:px-6 pt-6 mb-4">
                <button onClick={() => navigate(`/property/${id}`)} className="flex items-center gap-2 text-slate-500 hover:text-primary dark:text-indigo-400 transition-colors font-bold">
                    <ArrowLeft size={20} /> Back to Property
                </button>
            </div>

            <div className="max-w-5xl mx-auto px-4 md:px-6">
                 <h1 className="text-3xl font-black mb-2 text-slate-900 dark:text-white">Guest Reviews</h1>
                 <p className="text-slate-500 font-bold mb-8">{property.title}</p>
                 
                 {reviews.length === 0 ? (
                      <div className="py-16 text-center bg-white dark:bg-slate-900 rounded-3xl border border-slate-100 dark:border-slate-800">
                          <div className="size-16 rounded-3xl bg-amber-50 dark:bg-amber-500/10 flex items-center justify-center mx-auto mb-4">
                              <Star size={28} className="text-amber-400" />
                          </div>
                          <p className="text-lg font-black text-slate-700 dark:text-white mb-1">No reviews yet</p>
                          <p className="text-sm font-medium text-slate-400 max-w-xs mx-auto">
                              Be the first verified tenant to leave a review for this property.
                          </p>
                      </div>
                 ) : (
                     <div className="space-y-8">
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

                         {/* Reviews List */}
                         <div className="space-y-6">
                             {reviews.map((review, idx) => (
                                 <ReviewCard 
                                     key={review.id} 
                                     review={review} 
                                     idx={idx} 
                                     onHelpful={() => handleHelpfulVote(review.id)}
                                     currentUserId={currentUser?.uid}
                                     isOwner={isOwner}
                                     onReply={(text) => handleReply(review.id, text)}
                                 />
                             ))}
                         </div>
                     </div>
                 )}
            </div>
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
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.05 }}
            className="bg-white dark:bg-slate-900 rounded-[28px] border border-slate-100 dark:border-slate-800 p-6 shadow-sm"
        >
            {/* Reviewer header */}
            <div className="flex items-start gap-4 mb-4">
                <div className="size-11 rounded-full bg-primary/10 flex items-center justify-center text-primary dark:text-indigo-400 font-black text-base shrink-0 overflow-hidden">
                    {review.reviewerAvatar ? (
                        <img src={review.reviewerAvatar} alt={review.reviewerName} className="w-full h-full object-cover" />
                    ) : (
                        (review.reviewerName || 'A')[0].toUpperCase()
                    )}
                </div>
                <div className="flex-1 min-w-0">
                    <p className="font-black text-slate-900 dark:text-white text-[15px] truncate">{review.reviewerName || 'Anonymous'}</p>
                    <div className="flex items-center gap-2 flex-wrap">
                        <StarDisplay rating={review.rating} size={13} />
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{formatDate(review.createdAt)}</span>
                    </div>
                </div>
                <div className="shrink-0 flex items-center gap-1 text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-500/10 px-2 py-1 rounded-xl border border-emerald-100 dark:border-emerald-500/20">
                    <ShieldCheck size={11} strokeWidth={3} />
                    <span className="text-[9px] font-black uppercase tracking-wider">Verified Tenant</span>
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
            <div className="flex flex-col gap-4 mt-2 border-t border-slate-100 dark:border-slate-800 pt-4">
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
                     <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-2xl ml-4 sm:ml-8 border border-slate-100 dark:border-slate-700 relative">
                         <div className="absolute top-0 left-0 w-1 h-full bg-primary/30 rounded-l-2xl"></div>
                         <div className="flex items-center gap-2 mb-2">
                             <div className="size-6 bg-primary/20 text-primary rounded-full flex items-center justify-center font-bold text-xs">
                                 {review.landlordReply.ownerName?.[0] || 'O'}
                             </div>
                             <span className="text-xs font-black text-slate-900 dark:text-white">Response from {review.landlordReply.ownerName || 'Owner'}</span>
                             <span className="text-[10px] text-slate-400">{formatDate(review.landlordReply.createdAt)}</span>
                         </div>
                         <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed pl-8">
                             {review.landlordReply.text}
                         </p>
                     </div>
                )}

                {/* Reply Input Form */}
                {isOwner && !review.landlordReply && isReplying && (
                     <div className="bg-slate-50 dark:bg-slate-800 p-4 rounded-2xl border border-slate-200 dark:border-slate-700">
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
