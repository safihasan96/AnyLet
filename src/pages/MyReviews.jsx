import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { db } from '../firebase';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { useAuth } from '../contexts/AuthContext';
import logger from '../utils/logger';
import { cn } from '../lib/cn';
import Container from '../components/layout/Container';
import Grid from '../components/layout/Grid';
import { Card, Badge, Button, Icon, EmptyState, Skeleton } from '../components/ui';

function Stars({ rating }) {
  return (
    <span className="inline-flex items-center gap-0.5" aria-label={`${rating} out of 5`}>
      {[1, 2, 3, 4, 5].map((s) => (
        <Icon key={s} name="rating" className={cn('size-3.5', s <= rating ? 'fill-warning text-warning' : 'fill-transparent text-border-strong')} />
      ))}
    </span>
  );
}

function ReviewCard({ review, onClick }) {
  const isProperty = review.type === 'property';
  const targetName = isProperty ? (review.propertyName || 'Property') : (review.ownerName || 'Owner');
  const date = new Date(review.createdAt?.seconds * 1000 || Date.now()).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });

  return (
    <Card as="button" type="button" onClick={onClick} className="flex w-full flex-col text-left">
      <div className="mb-4 flex items-center gap-3">
        <span className={cn('grid size-10 shrink-0 place-items-center rounded-control', isProperty ? 'bg-primary-subtle text-primary' : 'bg-success-subtle text-success')}>
          <Icon name={isProperty ? 'apartment' : 'user'} className="size-5" />
        </span>
        <div className="min-w-0">
          <h3 className="truncate text-title-sm text-content">{targetName}</h3>
          <div className="mt-0.5 flex items-center gap-2">
            <Badge tone={isProperty ? 'primary' : 'success'} size="sm">{isProperty ? 'Property' : 'Owner'}</Badge>
            <span className="inline-flex items-center gap-1 text-caption text-subtle"><Icon name="calendar" className="size-3" /> {date}</span>
          </div>
        </div>
      </div>

      <div className="mb-3"><Stars rating={review.rating} /></div>

      {review.reviewText && (
        <div className="rounded-card border border-border bg-surface-sunken p-3.5">
          <p className="line-clamp-3 text-body-sm leading-relaxed text-muted">“{review.reviewText}”</p>
        </div>
      )}

      {review.landlordReply && (
        <div className="mt-3 flex items-start gap-2 rounded-card border border-success/15 bg-success-subtle p-3 text-caption text-muted">
          <Icon name="messages" className="mt-0.5 size-3.5 shrink-0 text-success" />
          <p><span className="font-semibold text-content">Reply:</span> “{review.landlordReply}”</p>
        </div>
      )}
    </Card>
  );
}

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
        const propertyReviewsSnap = await getDocs(query(collection(db, 'propertyReviews'), where('reviewerId', '==', currentUser.uid)));
        const propertyData = propertyReviewsSnap.docs.map((d) => ({ id: d.id, type: 'property', ...d.data() }));

        const ownerReviewsSnap = await getDocs(query(collection(db, 'ownerReviews'), where('reviewerId', '==', currentUser.uid)));
        const ownerData = ownerReviewsSnap.docs.map((d) => ({ id: d.id, type: 'owner', ...d.data() }));

        const combined = [...propertyData, ...ownerData].sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));
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
    if (review.type === 'property' && review.propertyId) navigate(`/property/${review.propertyId}`);
    else if (review.type === 'owner' && review.ownerId) navigate(`/owner/${review.ownerId}`);
  };

  return (
    <div className="min-h-screen bg-bg pb-24">
      <Container size="default" className="pt-[max(env(safe-area-inset-top),1.5rem)] md:pt-10">
        <header className="mb-6">
          <h1 className="font-display text-display-md text-content">My reviews</h1>
          <p className="mt-1 text-body-sm text-muted">Feedback you’ve written for properties and owners.</p>
        </header>

        {loading ? (
          <Grid cols={2} gap="md">{Array.from({ length: 4 }).map((_, i) => (
            <Card key={i} className="flex flex-col gap-3">
              <div className="flex items-center gap-3"><Skeleton className="size-10" rounded="rounded-control" /><div className="flex-1 space-y-2"><Skeleton className="h-4 w-1/3" /><Skeleton className="h-3 w-1/4" /></div></div>
              <Skeleton className="h-4 w-24" /><Skeleton className="h-16 w-full" rounded="rounded-card" />
            </Card>
          ))}</Grid>
        ) : reviews.length === 0 ? (
          <EmptyState
            icon={<Icon name="rating" />}
            title="No reviews written yet"
            description="When you review a property or an owner, it appears here so you can track your feedback."
            action={<Button onClick={() => navigate('/search')} leftIcon={<Icon name="search" />}>Explore properties</Button>}
          />
        ) : (
          <Grid cols={2} gap="md">
            {reviews.map((review) => <ReviewCard key={review.id} review={review} onClick={() => handleReviewClick(review)} />)}
          </Grid>
        )}
      </Container>
    </div>
  );
}
