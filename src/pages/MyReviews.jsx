import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { db } from '../firebase';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { useAuth } from '../contexts/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Star, Building2, User, Calendar, MessageCircle, Info } from 'lucide-react';
import { Skeleton } from '../components/Skeleton';
import logger from '../utils/logger';

// ─────────────────────────────────────────────────────────────
// ANIMATION VARIANTS (UI/UX Pro / Framer Motion Expert)
// ─────────────────────────────────────────────────────────────
const pageVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.08 } },
  exit: { opacity: 0, transition: { duration: 0.15 } }
};

const headerVariants = {
  hidden: { opacity: 0, y: -20 },
  visible: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 300, damping: 24 } }
};

const itemVariants = {
  hidden: { opacity: 0, y: 20, scale: 0.96 },
  visible: { opacity: 1, y: 0, scale: 1, transition: { type: 'spring', stiffness: 320, damping: 24 } }
};

const starContainerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.05 } }
};

const starVariants = {
  hidden: { opacity: 0, scale: 0, rotate: -30 },
  visible: { opacity: 1, scale: 1, rotate: 0, transition: { type: 'spring', stiffness: 400, damping: 20 } }
};

// ─────────────────────────────────────────────────────────────
// HELPER COMPONENTS
// ─────────────────────────────────────────────────────────────
function StarRating({ rating }) {
  return (
    <motion.div variants={starContainerVariants} initial="hidden" animate="visible" className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map(star => (
        <motion.div key={star} variants={starVariants}>
          <Star
            size={14}
            className={`${star <= rating ? 'fill-amber-400 text-amber-400' : 'fill-slate-100 text-slate-200 dark:fill-slate-800 dark:text-slate-800'}`}
          />
        </motion.div>
      ))}
    </motion.div>
  );
}

function ReviewCard({ review, onClick }) {
  const isProperty = review.type === 'property';
  const Icon = isProperty ? Building2 : User;
  const targetName = isProperty ? (review.propertyName || 'Property') : (review.ownerName || 'Owner');
  const date = new Date(review.createdAt?.seconds * 1000 || Date.now()).toLocaleDateString('en-GB', {
    day: 'numeric', month: 'short', year: 'numeric'
  });

  return (
    <motion.div
      variants={itemVariants}
      whileHover={{ scale: 1.01, y: -2 }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className="bg-white dark:bg-[#25243B] p-5 rounded-[22px] border border-slate-100 dark:border-white/[0.06] shadow-sm hover:shadow-md cursor-pointer transform-gpu will-change-transform transition-shadow duration-300"
    >
      <div className="flex justify-between items-start mb-4">
        <div className="flex items-center gap-3">
          <div className={`size-10 rounded-xl flex items-center justify-center shrink-0 ${isProperty ? 'bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400' : 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'}`}>
            <Icon size={18} strokeWidth={2.2} />
          </div>
          <div>
            <h3 className="text-[15px] font-black text-slate-900 dark:text-white leading-tight">
              {targetName}
            </h3>
            <div className="flex items-center gap-2 mt-0.5 text-[11px] font-bold text-slate-400">
              <span className="uppercase tracking-widest">{isProperty ? 'Property Review' : 'Owner Review'}</span>
              <span className="size-1 rounded-full bg-slate-300 dark:bg-slate-700" />
              <span className="flex items-center gap-1"><Calendar size={11} /> {date}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="mb-3">
        <StarRating rating={review.rating} />
      </div>

      {review.reviewText && (
        <div className="bg-slate-50 dark:bg-slate-900/50 rounded-xl p-3.5 border border-slate-100 dark:border-slate-800">
          <p className="text-[13px] font-medium text-slate-600 dark:text-slate-300 leading-relaxed line-clamp-3">
            "{review.reviewText}"
          </p>
        </div>
      )}

      {review.landlordReply && (
        <div className="mt-3 flex items-start gap-2 text-[12px] font-medium text-slate-500 dark:text-slate-400 bg-emerald-50/50 dark:bg-emerald-500/5 p-3 rounded-xl border border-emerald-100 dark:border-emerald-500/10">
          <MessageCircle size={14} className="text-emerald-500 mt-0.5 shrink-0" />
          <p><span className="font-bold text-slate-700 dark:text-slate-300">Reply:</span> "{review.landlordReply}"</p>
        </div>
      )}
    </motion.div>
  );
}

function SkeletonCard() {
  return (
    <div className="bg-white dark:bg-[#25243B] p-5 rounded-[22px] border border-slate-100 dark:border-slate-800">
      <div className="flex items-center gap-3 mb-4">
        <Skeleton className="size-10 rounded-xl shrink-0" />
        <div className="space-y-2 flex-1">
          <Skeleton className="h-4 w-1/3" />
          <Skeleton className="h-3 w-1/4" />
        </div>
      </div>
      <Skeleton className="h-4 w-24 mb-3" />
      <Skeleton className="h-16 rounded-xl w-full" />
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// MAIN COMPONENT
// ─────────────────────────────────────────────────────────────
export default function MyReviews() {
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!currentUser) return;

    const fetchMyReviews = async () => {
      try {
        setLoading(true);

        // Fetch Property Reviews
        const propertyReviewsSnap = await getDocs(
          query(collection(db, 'propertyReviews'), where('reviewerId', '==', currentUser.uid))
        );
        const propertyData = propertyReviewsSnap.docs.map(d => ({
          id: d.id,
          type: 'property',
          ...d.data()
        }));

        // Fetch Owner Reviews
        const ownerReviewsSnap = await getDocs(
          query(collection(db, 'ownerReviews'), where('reviewerId', '==', currentUser.uid))
        );
        const ownerData = ownerReviewsSnap.docs.map(d => ({
          id: d.id,
          type: 'owner',
          ...d.data()
        }));

        // Combine and sort by date descending
        const combined = [...propertyData, ...ownerData].sort((a, b) => {
          const aTime = a.createdAt?.seconds || 0;
          const bTime = b.createdAt?.seconds || 0;
          return bTime - aTime;
        });

        setReviews(combined);
      } catch (err) {
        logger.error('Error fetching my reviews:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchMyReviews();
  }, [currentUser]);

  const handleReviewClick = (review) => {
    if (review.type === 'property' && review.propertyId) {
      navigate(`/property/${review.propertyId}`);
    } else if (review.type === 'owner' && review.ownerId) {
      navigate(`/owner/${review.ownerId}`);
    }
  };

  return (
    <div className="min-h-screen bg-[#f6f6f8] dark:bg-[#161626] pb-24 md:pb-12">
      {/* HEADER */}
      <motion.div
        variants={headerVariants}
        initial="hidden"
        animate="visible"
        className="sticky top-14 z-40 bg-white/80 dark:bg-[#161626]/80 backdrop-blur-xl border-b border-slate-200/50 dark:border-white/[0.04]"
      >
        <div className="max-w-3xl mx-auto px-5 h-16 flex items-center justify-center">
          <h1 className="text-[17px] font-black text-slate-900 dark:text-white tracking-tight">My Reviews</h1>
        </div>
      </motion.div>

      {/* CONTENT */}
      <div className="max-w-3xl mx-auto px-5 pt-8">
        {loading ? (
          <div className="space-y-4">
            <SkeletonCard />
            <SkeletonCard />
            <SkeletonCard />
          </div>
        ) : (
          <AnimatePresence mode="popLayout">
            {reviews.length > 0 ? (
              <motion.div
                variants={pageVariants}
                initial="hidden"
                animate="visible"
                exit="exit"
                className="grid grid-cols-1 md:grid-cols-2 gap-4"
              >
                {reviews.map(review => (
                  <ReviewCard key={review.id} review={review} onClick={() => handleReviewClick(review)} />
                ))}
              </motion.div>
            ) : (
              <motion.div
                key="empty"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ type: 'spring', stiffness: 300, damping: 25 }}
                className="bg-white dark:bg-[#25243B] p-10 rounded-[28px] border border-slate-100 dark:border-white/[0.06] flex flex-col items-center justify-center text-center shadow-sm"
              >
                <div className="size-20 bg-indigo-50 dark:bg-indigo-500/10 rounded-full flex items-center justify-center mb-5">
                  <Star size={32} className="text-indigo-400 dark:text-indigo-500" />
                </div>
                <h2 className="text-xl font-black text-slate-900 dark:text-white mb-2 tracking-tight">No reviews written yet</h2>
                <p className="text-sm font-medium text-slate-500 dark:text-slate-400 max-w-xs leading-relaxed">
                  When you write a review for a property or an owner, it will appear here so you can easily track and manage your feedback.
                </p>
                <button
                  onClick={() => navigate('/')}
                  className="mt-8 bg-slate-900 dark:bg-white text-white dark:text-slate-900 px-6 py-3 rounded-xl font-black text-sm hover:scale-105 active:scale-95 transition-transform"
                >
                  Explore Properties
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        )}
      </div>
    </div>
  );
}
