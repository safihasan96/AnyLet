import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { collection, query, where, onSnapshot, doc, updateDoc } from 'firebase/firestore';
import { Helmet } from 'react-helmet-async';
import { db } from '../firebase';
import { useAuth } from '../contexts/AuthContext';
import { createNotification } from '../utils/notificationService';
import logger from '../utils/logger';
import PaymentStatusModal from '../components/PaymentStatusModal';
import ConfirmationModal from '../components/ConfirmationModal';
import Container from '../components/layout/Container';
import { Card, Badge, Button, IconButton, Icon, EmptyState, Skeleton, useToast } from '../components/ui';

const STATUS_MAP = {
  held: { label: 'Deposit held', tone: 'info', icon: 'locked' },
  released: { label: 'Released', tone: 'success', icon: 'success' },
  disputed: { label: 'Disputed', tone: 'warning', icon: 'warning' },
  refunded: { label: 'Refunded', tone: 'neutral', icon: 'payments' },
};

export default function MyBookings() {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const toast = useToast();

  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [confirmModal, setConfirmModal] = useState({ isOpen: false, bookingId: null });
  const [statusModal, setStatusModal] = useState({ isOpen: false, booking: null });
  const [confirming, setConfirming] = useState(false);

  useEffect(() => {
    if (!currentUser) { navigate('/login'); return; }
    const q = query(collection(db, 'escrowDeposits'), where('tenantId', '==', currentUser.uid));
    const unsub = onSnapshot(q, (snap) => {
      const data = snap.docs.map((d) => ({ firestoreId: d.id, ...d.data() }));
      data.sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));
      setBookings(data);
      setLoading(false);
    });
    return () => unsub();
  }, [currentUser, navigate]);

  const handleConfirmMoveIn = async () => {
    if (!confirmModal.bookingId) return;
    setConfirming(true);
    try {
      await updateDoc(doc(db, 'escrowDeposits', confirmModal.bookingId), { confirmedByTenant: true });
      const booking = bookings.find((b) => b.firestoreId === confirmModal.bookingId);
      if (booking && booking.ownerId) {
        await createNotification(
          booking.ownerId, 'system', 'Move-in Confirmed',
          `Tenant has confirmed move-in for ${booking.propertyName || 'the property'}. Please confirm from your side to release the deposit.`,
          '/requests'
        );
      }
      toast.success('Move-in confirmed! The deposit will be released once the owner also confirms.');
      setConfirmModal({ isOpen: false, bookingId: null });
    } catch (err) {
      logger.error(err);
      toast.error('Failed to confirm. Please try again.');
    } finally {
      setConfirming(false);
    }
  };

  const formatDate = (ts) => {
    if (!ts) return 'Recently';
    const date = ts.toDate ? ts.toDate() : new Date(ts);
    return new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', year: 'numeric' }).format(date);
  };

  return (
    <div className="min-h-screen bg-bg pb-24">
      <Helmet><title>My Bookings | Any-Let</title></Helmet>
      <Container size="narrow" className="pt-[max(env(safe-area-inset-top),1.5rem)] md:pt-10">
        <header className="mb-6">
          <h1 className="font-display text-display-md text-content">My bookings</h1>
          <p className="mt-1 text-body-sm text-muted">Escrow deposits held securely by Any-Let.</p>
        </header>

        {loading ? (
          <div className="flex flex-col gap-4">{[0, 1, 2].map((i) => <Skeleton key={i} className="h-44 w-full" rounded="rounded-card" />)}</div>
        ) : bookings.length === 0 ? (
          <EmptyState
            icon={<Icon name="locked" />}
            title="No bookings yet"
            description="When you book a property with a security deposit, it appears here — your money stays safe with Any-Let."
            action={<Button onClick={() => navigate('/search')} leftIcon={<Icon name="search" />}>Browse properties</Button>}
          />
        ) : (
          <div className="flex flex-col gap-4">
            <p className="text-overline uppercase text-subtle">{bookings.length} {bookings.length === 1 ? 'booking' : 'bookings'}</p>
            {bookings.map((booking) => {
              const status = STATUS_MAP[booking.status] || STATUS_MAP.held;
              return (
                <Card key={booking.firestoreId} padding="md">
                  <div className="mb-4 flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <h3 className="truncate text-title-sm text-content">{booking.propertyName || 'Property'}</h3>
                      <p className="mt-0.5 text-caption text-muted">Booked on {formatDate(booking.createdAt)}</p>
                    </div>
                    <div className="flex shrink-0 items-center gap-1">
                      <Badge tone={status.tone} size="md" icon={<Icon name={status.icon} />}>{status.label}</Badge>
                      <IconButton label="Deposit details" size="sm" variant="ghost" onClick={() => setStatusModal({ isOpen: true, booking })}><Icon name="info" /></IconButton>
                    </div>
                  </div>

                  <div className="mb-4 space-y-2 rounded-card bg-surface-sunken p-4">
                    <div className="flex justify-between text-body-sm">
                      <span className="text-muted">Security deposit</span>
                      <span className="font-semibold text-content">৳{booking.depositAmount?.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between text-body-sm">
                      <span className="text-muted">Service fee</span>
                      <span className="font-semibold text-content">৳{booking.serviceFee}</span>
                    </div>
                    <div className="flex justify-between border-t border-border pt-2 text-body-sm">
                      <span className="font-semibold text-content">Total paid</span>
                      <span className="font-semibold text-primary">৳{booking.totalPaid?.toLocaleString()}</span>
                    </div>
                  </div>

                  {booking.status === 'held' && (
                    <div className="space-y-3">
                      <ConfirmRow done={booking.confirmedByTenant} label={booking.confirmedByTenant ? 'You confirmed move-in' : 'Your confirmation pending'} />
                      <ConfirmRow done={booking.confirmedByOwner} label={booking.confirmedByOwner ? 'Owner confirmed' : 'Owner confirmation pending'} />
                      {!booking.confirmedByTenant && (
                        <Button variant="primary" fullWidth className="mt-2 bg-success text-on-success hover:brightness-105"
                          leftIcon={<Icon name="success" />}
                          onClick={() => setConfirmModal({ isOpen: true, bookingId: booking.firestoreId })}>
                          Confirm move-in
                        </Button>
                      )}
                    </div>
                  )}

                  {booking.status === 'released' && (
                    <div className="flex items-center gap-2 rounded-card border border-success/20 bg-success-subtle p-3 text-body-sm text-success">
                      <Icon name="success" className="size-4 shrink-0" /> Deposit released to owner on {formatDate(booking.releasedAt)}
                    </div>
                  )}
                </Card>
              );
            })}
          </div>
        )}
      </Container>

      <ConfirmationModal
        isOpen={confirmModal.isOpen}
        title="Confirm Move-In"
        message="By confirming, you're telling us you have moved into this property. The security deposit will be flagged for release to the owner after they also confirm. This action cannot be undone."
        confirmText="Confirm Move-In"
        confirmColor="#059669"
        variant="success"
        icon={() => <Icon name="success" />}
        isLoading={confirming}
        onConfirm={handleConfirmMoveIn}
        onCancel={() => setConfirmModal({ isOpen: false, bookingId: null })}
      />
      <PaymentStatusModal
        isOpen={statusModal.isOpen}
        onClose={() => setStatusModal({ isOpen: false, booking: null })}
        status={statusModal.booking?.status || 'held'}
        title={`Deposit ${STATUS_MAP[statusModal.booking?.status]?.label || 'Under Review'}`}
        message={
          statusModal.booking?.status === 'released' ? 'The funds have been released to the owner.'
            : statusModal.booking?.status === 'disputed' ? 'There is a dispute regarding this deposit. Our team is reviewing.'
            : 'Your security deposit is safely held by Any-Let. It will be released to the owner once you both confirm the move-in.'
        }
        transactionId={statusModal.booking?.paymentId}
      />
    </div>
  );
}

function ConfirmRow({ done, label }) {
  return (
    <div className="flex items-center gap-3">
      <span className={`grid size-6 place-items-center rounded-full ${done ? 'bg-success text-on-success' : 'bg-surface-sunken text-subtle'}`}>
        <Icon name="check" className="size-3.5" strokeWidth={3} />
      </span>
      <span className={`text-body-sm ${done ? 'font-medium text-success' : 'text-muted'}`}>{label}</span>
    </div>
  );
}
