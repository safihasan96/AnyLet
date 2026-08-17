import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { collection, query, where, onSnapshot, doc, getDoc } from 'firebase/firestore';
import { Helmet } from 'react-helmet-async';
import { db } from '../firebase';
import { useAuth } from '../contexts/AuthContext';
import WriteReviewModal from '../components/WriteReviewModal';
import Container from '../components/layout/Container';
import { Card, Badge, Button, Avatar, Icon, EmptyState, Skeleton } from '../components/ui';

export default function MyMoveIns() {
  const { currentUser } = useAuth();
  const navigate = useNavigate();

  const [moveIns, setMoveIns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [ownerNames, setOwnerNames] = useState({});
  const [reviewModal, setReviewModal] = useState({ isOpen: false, moveIn: null, ownerId: null, ownerName: '' });

  useEffect(() => {
    if (!currentUser) { navigate('/login'); return; }
    const q = query(collection(db, 'tenantMoveIns'), where('tenantId', '==', currentUser.uid));
    const unsub = onSnapshot(q, async (snap) => {
      const data = snap.docs.map((d) => ({ firestoreId: d.id, id: d.id, ...d.data() }));
      data.sort((a, b) => (b.movedInAt?.seconds || 0) - (a.movedInAt?.seconds || 0));
      setMoveIns(data);
      setLoading(false);

      const uniqueOwnerIds = [...new Set(data.map((d) => d.ownerId).filter(Boolean))];
      const missing = uniqueOwnerIds.filter((id) => !ownerNames[id]);
      if (missing.length > 0) {
        const fetched = {};
        await Promise.all(missing.map(async (ownerId) => {
          try {
            const s = await getDoc(doc(db, 'users', ownerId));
            if (s.exists()) { const d = s.data(); fetched[ownerId] = d.fullName || d.name || d.displayName || 'Property Owner'; }
          } catch { /* silent */ }
        }));
        setOwnerNames((prev) => ({ ...prev, ...fetched }));
      }
    });
    return () => unsub();
    // ownerNames intentionally omitted — re-subscribing on name cache updates is undesirable.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentUser, navigate]);

  const formatDate = (ts) => {
    if (!ts) return 'Recently';
    const date = ts.toDate ? ts.toDate() : new Date(ts);
    return new Intl.DateTimeFormat('en-US', { month: 'long', day: 'numeric', year: 'numeric' }).format(date);
  };

  return (
    <div className="min-h-screen bg-bg pb-24">
      <Helmet><title>My Move-Ins | Any-Let</title></Helmet>
      <Container size="narrow" className="pt-[max(env(safe-area-inset-top),1.5rem)] md:pt-10">
        <header className="mb-6">
          <h1 className="font-display text-display-md text-content">My move-ins</h1>
          <p className="mt-1 text-body-sm text-muted">Properties you’ve moved into — leave a verified review.</p>
        </header>

        {loading ? (
          <div className="flex flex-col gap-4">{[0, 1, 2].map((i) => <Skeleton key={i} className="h-64 w-full" rounded="rounded-card" />)}</div>
        ) : moveIns.length === 0 ? (
          <EmptyState
            icon={<Icon name="home" />}
            title="No move-ins yet"
            description="When you mark a viewing as moved-in, it appears here — then you can leave a verified review."
            action={<Button onClick={() => navigate('/messages')} leftIcon={<Icon name="messages" />}>View my requests</Button>}
          />
        ) : (
          <div className="flex flex-col gap-4">
            <p className="text-overline uppercase text-subtle">{moveIns.length} {moveIns.length === 1 ? 'property' : 'properties'} recorded</p>
            {moveIns.map((item) => (
              <MoveInCard
                key={item.id}
                moveIn={item}
                ownerName={ownerNames[item.ownerId] || 'Property Owner'}
                formatDate={formatDate}
                onReview={() => setReviewModal({ isOpen: true, moveIn: item, ownerId: item.ownerId, ownerName: ownerNames[item.ownerId] || 'this landlord' })}
              />
            ))}
          </div>
        )}
      </Container>

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

function MoveInCard({ moveIn, ownerName, formatDate, onReview }) {
  const hasReviewed = !!moveIn.hasReviewed;
  return (
    <Card padding="none" className="overflow-hidden">
      <div className="relative h-40 w-full overflow-hidden bg-surface-sunken">
        {moveIn.propertyImage ? (
          <img loading="lazy" src={moveIn.propertyImage} alt={moveIn.propertyName} className="size-full object-cover" />
        ) : (
          <div className="grid size-full place-items-center text-subtle"><Icon name="home" className="size-9" /></div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />
        <Badge tone={hasReviewed ? 'warning' : 'success'} size="md" icon={<Icon name={hasReviewed ? 'rating' : 'success'} />} className="absolute right-3 top-3 shadow-card">
          {hasReviewed ? 'Reviewed' : 'Moved in'}
        </Badge>
        <h3 className="absolute inset-x-4 bottom-3 truncate text-title-sm text-white drop-shadow">{moveIn.propertyName || 'Property'}</h3>
      </div>

      <div className="p-4">
        <div className="mb-4 flex items-center justify-between gap-2">
          <Button as={Link} to={`/owner/${moveIn.ownerId}`} variant="ghost" size="sm" className="h-auto min-w-0 justify-start px-2 py-1.5">
            <Avatar name={ownerName} size="sm" />
            <span className="flex min-w-0 flex-col text-left">
              <span className="truncate text-body-sm font-medium text-content">{ownerName}</span>
              <span className="text-caption text-subtle">Landlord · View profile</span>
            </span>
          </Button>
          <span className="inline-flex shrink-0 items-center gap-1 text-caption text-subtle">
            <Icon name="time" className="size-3.5" /> {formatDate(moveIn.movedInAt)}
          </span>
        </div>

        {!hasReviewed ? (
          <Button fullWidth onClick={onReview} leftIcon={<Icon name="rating" />} rightIcon={<Icon name="chevronRight" />}>Write a review</Button>
        ) : (
          <div className="flex w-full items-center justify-center gap-2 rounded-control border border-warning/20 bg-warning-subtle py-3 text-body-sm font-medium text-warning">
            <Icon name="rating" className="size-4 fill-warning" /> Review submitted
          </div>
        )}
      </div>
    </Card>
  );
}
