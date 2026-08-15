import { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { doc, getDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { Helmet } from 'react-helmet-async';
import { db } from '../firebase';
import { useAuth } from '../contexts/AuthContext';
import useSavedProperties from '../hooks/useSavedProperties';
import { toggleHelpfulVote, submitLandlordReply } from '../utils/reviewService';
import logger from '../utils/logger';
import PropertyCard from '../components/patterns/PropertyCard';
import { OwnerProfileSkeleton } from '../components/Skeleton';
import WriteReviewModal from '../components/WriteReviewModal';
import Container from '../components/layout/Container';
import Grid from '../components/layout/Grid';
import {
  Button, Avatar, Badge, Card, Textarea, Icon, EmptyState, LoadingState, useToast,
} from '../components/ui';
import { cn } from '../lib/cn';

const CATEGORIES = [
  { key: 'communication', label: 'Communication' },
  { key: 'responsiveness', label: 'Responsiveness' },
  { key: 'cleanliness', label: 'Cleanliness' },
  { key: 'accuracy', label: 'Accuracy' },
];

function avg(arr) {
  if (!arr || arr.length === 0) return 0;
  return arr.reduce((a, b) => a + b, 0) / arr.length;
}

function StarDisplay({ rating, size = 'size-4' }) {
  return (
    <div className="flex items-center gap-0.5" aria-label={`${rating.toFixed(1)} out of 5`}>
      {[1, 2, 3, 4, 5].map((s) => (
        <Icon
          key={s}
          name="rating"
          className={cn(size, rating >= s ? 'fill-warning text-warning' : rating >= s - 0.5 ? 'fill-warning/40 text-warning' : 'fill-transparent text-border-strong')}
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
  const { toggleSaveProperty, isPropertySaved } = useSavedProperties();

  const [owner, setOwner] = useState(null);
  const [properties, setProperties] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [eligibleMoveIn, setEligibleMoveIn] = useState(null);
  const [loading, setLoading] = useState(true);
  const [reviewsLoading, setReviewsLoading] = useState(true);
  const [reviewModal, setReviewModal] = useState(false);

  useEffect(() => {
    const fetchAll = async () => {
      try {
        const ownerDoc = await getDoc(doc(db, 'users', id));
        if (ownerDoc.exists()) setOwner({ id: ownerDoc.id, ...ownerDoc.data() });

        const [snap1, snap2] = await Promise.all([
          getDocs(query(collection(db, 'properties'), where('ownerId', '==', id), where('isApproved', '==', true))),
          getDocs(query(collection(db, 'properties'), where('userId', '==', id), where('isApproved', '==', true))),
        ]);
        const propsMap = new Map();
        snap1.forEach((d) => propsMap.set(d.id, { id: d.id, ...d.data() }));
        snap2.forEach((d) => propsMap.set(d.id, { id: d.id, ...d.data() }));
        setProperties(Array.from(propsMap.values()));

        if (currentUser) {
          const miSnap = await getDocs(query(
            collection(db, 'tenantMoveIns'),
            where('tenantId', '==', currentUser.uid),
            where('ownerId', '==', id)
          ));
          const eligible = miSnap.docs.find((d) => !d.data().hasReviewed);
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
    getDocs(query(collection(db, 'ownerReviews'), where('ownerId', '==', id), where('isApproved', '==', true)))
      .then((snap) => {
        const data = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
        data.sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));
        setReviews(data);
      })
      .finally(() => setReviewsLoading(false));
  }, [id]);

  const handleHelpfulVote = async (reviewId) => {
    if (!currentUser) { navigate('/login'); return; }
    try {
      await toggleHelpfulVote('ownerReviews', reviewId, currentUser.uid);
      setReviews(reviews.map((r) => {
        if (r.id === reviewId) {
          const hasVoted = (r.helpfulUsers || []).includes(currentUser.uid);
          return {
            ...r,
            helpfulUsers: hasVoted ? r.helpfulUsers.filter((uid) => uid !== currentUser.uid) : [...(r.helpfulUsers || []), currentUser.uid],
            helpfulVotes: hasVoted ? Math.max(0, (r.helpfulVotes || 1) - 1) : (r.helpfulVotes || 0) + 1,
          };
        }
        return r;
      }));
    } catch (error) {
      logger.error(error);
      toast.error('Failed to register vote');
    }
  };

  const handleReply = async (reviewId, text) => {
    if (!currentUser || !text.trim()) return;
    try {
      const ownerName = currentUser.displayName || 'Property Owner';
      await submitLandlordReply('ownerReviews', reviewId, text, currentUser.uid, ownerName);
      setReviews(reviews.map((r) => (r.id === reviewId
        ? { ...r, landlordReply: { text, ownerId: currentUser.uid, ownerName, createdAt: new Date() } }
        : r)));
      toast.success('Reply posted!');
    } catch (error) {
      logger.error(error);
      toast.error('Failed to post reply');
    }
  };

  const stats = useMemo(() => {
    if (reviews.length === 0) return null;
    return {
      overallAvg: avg(reviews.map((r) => r.rating)),
      catAvgs: Object.fromEntries(CATEGORIES.map((c) => [c.key, avg(reviews.map((r) => r.categories?.[c.key] || 0))])),
    };
  }, [reviews]);

  const displayName = owner?.fullName || owner?.name || owner?.displayName || 'Property Owner';
  const memberYear = owner?.createdAt
    ? (owner.createdAt.toDate ? owner.createdAt.toDate().getFullYear() : new Date(owner.createdAt).getFullYear())
    : '2026';
  const isVerified = owner?.verified || owner?.role === 'admin';

  const shareProfile = () => {
    if (navigator.share) navigator.share({ title: `${displayName}'s Profile`, url: window.location.href });
    else { navigator.clipboard.writeText(window.location.href); toast.success('Profile link copied!'); }
  };

  if (loading) return <OwnerProfileSkeleton />;

  if (!owner) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-bg p-6">
        <EmptyState icon={<Icon name="user" />} title="User not found" description="This owner profile doesn’t exist or was removed." action={<Button onClick={() => navigate('/')}>Go home</Button>} />
      </div>
    );
  }

  const HOST_STATS = [
    { icon: 'calendar', tone: 'success', value: memberYear, label: 'Member since' },
    { icon: 'apartment', tone: 'primary', value: properties.length, label: 'Properties' },
    { icon: 'messages', tone: 'warning', value: owner.responseRate ? `${owner.responseRate}%` : 'N/A', label: 'Response rate' },
  ];

  return (
    <div className="min-h-screen bg-bg pb-24">
      <Helmet><title>{displayName} — Landlord Profile | Any-Let</title></Helmet>

      <Container size="default" className="space-y-8 py-8 md:py-12">
        <Button variant="ghost" size="sm" onClick={() => navigate(-1)} leftIcon={<Icon name="back" />} className="hidden md:inline-flex -ml-2">Back</Button>

        {/* Header */}
        <Card padding="none" className="overflow-hidden">
          <div className="relative h-40 w-full md:h-56">
            {owner.coverPhoto ? (
              <img src={owner.coverPhoto} alt="" className="size-full object-cover" />
            ) : (
              <div className="size-full bg-gradient-to-br from-brand-600 to-brand-900" />
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
          </div>
          <div className="relative z-10 -mt-16 flex flex-col items-center gap-5 px-6 pb-6 md:flex-row md:items-end md:px-10 md:pb-8">
            <div className="relative">
              <Avatar src={owner.photoURL} name={displayName} size="2xl" ring className="ring-4 ring-surface" />
              {isVerified && (
                <span className="absolute bottom-1 right-1 grid size-9 place-items-center rounded-full bg-success text-on-success ring-2 ring-surface" aria-label="Verified">
                  <Icon name="verified" className="size-5" />
                </span>
              )}
            </div>
            <div className="flex-1 text-center md:pb-1 md:text-left">
              <h1 className="font-display text-display-md text-content">{displayName}</h1>
              <p className="mt-1 flex items-center justify-center gap-1.5 text-body-sm text-muted md:justify-start">
                <Icon name="location" className="size-4 text-primary" />
                {owner.location || 'Bangladesh'} • {owner.role === 'admin' ? 'Platform Admin' : owner.membershipTier || 'Property Owner'}
              </p>
            </div>
            <div className="md:pb-1">
              <Button variant="secondary" onClick={shareProfile} leftIcon={<Icon name="share" />}>Share</Button>
            </div>
          </div>
        </Card>

        {/* Eligible-review CTA */}
        {eligibleMoveIn && (
          <Card className="flex items-center gap-4 border-primary-border bg-primary-subtle">
            <span className="grid size-12 shrink-0 place-items-center rounded-card bg-primary text-on-primary"><Icon name="badge" className="size-6" /></span>
            <div className="min-w-0 flex-1">
              <p className="text-title-sm text-content">You’re a verified ex-tenant</p>
              <p className="text-body-sm text-muted">Share your experience with future renters.</p>
            </div>
            <Button onClick={() => setReviewModal(true)} leftIcon={<Icon name="rating" />} className="shrink-0">Write review</Button>
          </Card>
        )}

        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          {/* Main column */}
          <div className="space-y-6 md:col-span-2">
            <Card padding="lg">
              <h2 className="mb-3 flex items-center gap-2 text-title-md text-content"><Icon name="messages" className="size-5 text-primary" /> About</h2>
              <p className="whitespace-pre-line text-body-sm leading-relaxed text-muted">{owner.bio || "This owner hasn't added a bio yet."}</p>
            </Card>

            <Card padding="lg">
              <h2 className="mb-5 flex items-center gap-2 text-title-md text-content"><Icon name="home" className="size-5 text-primary" /> Listings from this owner</h2>
              {properties.length > 0 ? (
                <Grid cols={2} gap="md">
                  {properties.map((p) => (
                    <PropertyCard key={p.id} property={p} saved={isPropertySaved(p.id)} onToggleSave={toggleSaveProperty} />
                  ))}
                </Grid>
              ) : (
                <EmptyState size="sm" icon={<Icon name="home" />} title="No active listings" description="This owner has no published properties right now." />
              )}
            </Card>
          </div>

          {/* Side column */}
          <div className="space-y-6">
            <Grid cols={1} gap="md" className="grid-cols-2 md:grid-cols-1">
              {HOST_STATS.map((s) => (
                <Card key={s.label} padding="md" className="flex flex-col items-center text-center">
                  <span className={cn('mb-3 grid size-12 place-items-center rounded-card',
                    s.tone === 'success' ? 'bg-success-subtle text-success' : s.tone === 'primary' ? 'bg-primary-subtle text-primary' : 'bg-warning-subtle text-warning')}>
                    <Icon name={s.icon} className="size-6" />
                  </span>
                  <span className="text-title-lg font-semibold text-content">{s.value}</span>
                  <span className="mt-0.5 text-caption text-subtle">{s.label}</span>
                </Card>
              ))}
            </Grid>

            <Card padding="lg">
              <h2 className="mb-5 flex items-center gap-2 text-title-md text-content"><Icon name="rating" className="size-5 text-primary" /> Reviews</h2>
              {reviewsLoading ? (
                <LoadingState label="Loading reviews…" size="md" />
              ) : reviews.length === 0 ? (
                <EmptyState size="sm" icon={<Icon name="rating" />} title="No reviews yet" description="Check back later for reviews." />
              ) : (
                <div className="space-y-5">
                  {stats && (
                    <div className="flex flex-col items-center rounded-card border border-border bg-surface-sunken p-4">
                      <p className="font-display text-display-md text-content">{stats.overallAvg.toFixed(1)}</p>
                      <StarDisplay rating={stats.overallAvg} />
                      <p className="mt-1 text-caption text-muted">{reviews.length} {reviews.length === 1 ? 'review' : 'reviews'}</p>
                    </div>
                  )}
                  <div className="space-y-4">
                    {reviews.map((review) => (
                      <ReviewCard
                        key={review.id}
                        review={review}
                        onHelpful={() => handleHelpfulVote(review.id)}
                        currentUserId={currentUser?.uid}
                        isOwner={currentUser?.uid === id}
                        onReply={(text) => handleReply(review.id, text)}
                      />
                    ))}
                  </div>
                </div>
              )}
            </Card>
          </div>
        </div>
      </Container>

      <WriteReviewModal isOpen={reviewModal} onClose={() => setReviewModal(false)} moveIn={eligibleMoveIn} ownerId={id} ownerName={displayName} />
    </div>
  );
}

function ReviewCard({ review, onHelpful, currentUserId, isOwner, onReply }) {
  const [replyText, setReplyText] = useState('');
  const [isReplying, setIsReplying] = useState(false);

  const formatDate = (ts) => {
    if (!ts) return '';
    const date = ts.toDate ? ts.toDate() : new Date(ts);
    return new Intl.DateTimeFormat('en-US', { month: 'short', year: 'numeric' }).format(date);
  };
  const hasVotedHelpful = (review.helpfulUsers || []).includes(currentUserId);

  return (
    <Card variant="outline" padding="md">
      <div className="mb-3 flex items-start gap-3">
        <Avatar src={review.reviewerAvatar} name={review.reviewerName || 'A'} size="md" />
        <div className="min-w-0 flex-1">
          <p className="truncate text-body-sm font-semibold text-content">{review.reviewerName || 'Anonymous'}</p>
          <div className="mt-0.5 flex flex-wrap items-center gap-2">
            <StarDisplay rating={review.rating || 0} size="size-3.5" />
            <span className="text-caption text-subtle">{formatDate(review.createdAt)}</span>
            {review.propertyName && <Badge tone="primary" size="sm" className="max-w-[140px] truncate">{review.propertyName}</Badge>}
          </div>
        </div>
        <Badge tone="success" size="sm" icon={<Icon name="verified" />}>Verified</Badge>
      </div>

      <p className="mb-4 whitespace-pre-wrap text-body-sm leading-relaxed text-muted">{review.body}</p>

      {review.categories && (
        <div className="mb-4 flex flex-wrap gap-2">
          {CATEGORIES.map((cat) => {
            const val = review.categories[cat.key];
            if (!val) return null;
            return <Badge key={cat.key} tone="neutral" size="md">{cat.label} · <span className="text-warning">{val}/5</span></Badge>;
          })}
        </div>
      )}

      <div className="flex flex-col gap-4 border-t border-border pt-4">
        <div className="flex items-center justify-between">
          <Button
            variant={hasVotedHelpful ? 'soft' : 'ghost'}
            size="sm"
            onClick={onHelpful}
            leftIcon={<Icon name="badge" className={hasVotedHelpful ? 'fill-primary/20' : ''} />}
          >
            Helpful ({review.helpfulVotes || 0})
          </Button>
          {isOwner && !review.landlordReply && !isReplying && (
            <Button variant="ghost" size="sm" onClick={() => setIsReplying(true)} leftIcon={<Icon name="messages" />}>Reply</Button>
          )}
        </div>

        {review.landlordReply && (
          <div className="ml-4 rounded-card border-l-2 border-primary bg-surface-sunken p-4 sm:ml-8">
            <div className="mb-1.5 flex items-center gap-2">
              <Avatar name={review.landlordReply.ownerName || 'O'} size="xs" />
              <span className="text-caption font-semibold text-content">Response from {review.landlordReply.ownerName || 'Owner'}</span>
              <span className="text-caption text-subtle">{formatDate(review.landlordReply.createdAt)}</span>
            </div>
            <p className="whitespace-pre-wrap pl-7 text-body-sm leading-relaxed text-muted">{review.landlordReply.text}</p>
          </div>
        )}

        {isOwner && !review.landlordReply && isReplying && (
          <div className="rounded-card bg-surface-sunken p-4">
            <Textarea value={replyText} onChange={(e) => setReplyText(e.target.value)} placeholder="Write a public response to this review…" rows={3} className="mb-3" />
            <div className="flex justify-end gap-2">
              <Button variant="ghost" size="sm" onClick={() => setIsReplying(false)}>Cancel</Button>
              <Button size="sm" disabled={!replyText.trim()} onClick={() => { onReply(replyText); setIsReplying(false); }}>Post reply</Button>
            </div>
          </div>
        )}
      </div>
    </Card>
  );
}
