import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { collection, query, where, onSnapshot, deleteDoc, doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../contexts/AuthContext';
import { sendListingExpiryEmail } from '../utils/emailService';
import { useFees } from '../hooks/useFees';
import logger from '../utils/logger';
import ConfirmationModal from '../components/ConfirmationModal';
import PaymentModal from '../components/PaymentModal';
import Container from '../components/layout/Container';
import Grid from '../components/layout/Grid';
import {
  Card, Badge, Button, IconButton, Input, Icon, EmptyState, Skeleton, useToast,
  Dropdown, DropdownItem, DropdownSeparator,
} from '../components/ui';

const FILTERS = ['All', 'Active', 'Pending', 'Rejected', 'Drafts'];

export default function MyListings() {
  const { currentUser: user } = useAuth();
  const navigate = useNavigate();
  const toast = useToast();
  const { fees } = useFees();

  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState('All');

  const [deleteModal, setDeleteModal] = useState({ isOpen: false, id: null, title: '' });
  const [isDeleting, setIsDeleting] = useState(false);
  const [statusModal, setStatusModal] = useState({ isOpen: false, id: null, title: '', newStatus: '' });
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
  const [bumpModal, setBumpModal] = useState({ isOpen: false, id: null, title: '' });
  const [isBumping, setIsBumping] = useState(false);
  const [verifyModal, setVerifyModal] = useState({ isOpen: false, id: null, title: '' });

  useEffect(() => {
    if (!user) { navigate('/login'); return; }
    const listingsQuery = query(collection(db, 'properties'), where('ownerId', '==', user.uid));
    const unsubscribe = onSnapshot(listingsQuery, (snapshot) => {
      const userListings = snapshot.docs
        .map((doc) => {
          const data = doc.data();
          return { id: doc.id, ...data, image: data.image || data.imageUrl || (data.images && data.images[0]) };
        })
        .sort((a, b) => {
          const timeA = a.createdAt?.seconds ? a.createdAt.seconds * 1000 : new Date(a.createdAt).getTime();
          const timeB = b.createdAt?.seconds ? b.createdAt.seconds * 1000 : new Date(b.createdAt).getTime();
          return timeB - timeA;
        });
      setListings(userListings);
      setLoading(false);
    }, (error) => {
      logger.error('Error fetching listings:', error);
      toast.error('Failed to load listings.');
      setLoading(false);
    });
    return () => unsubscribe();
  }, [user, navigate, toast]);

  useEffect(() => {
    if (!listings.length || !user) return;
    const checkExpiries = async () => {
      const yearAgo = new Date();
      yearAgo.setDate(yearAgo.getDate() - 365);
      for (const item of listings) {
        if (item.expiryEmailSent) continue;
        const propDate = item.updatedAt?.toDate() || item.createdAt?.toDate() || new Date(0);
        if (propDate < yearAgo) {
          try {
            await sendListingExpiryEmail(user.email, user.displayName || 'Landlord', item.title);
            await updateDoc(doc(db, 'properties', item.id), { expiryEmailSent: true });
          } catch (err) {
            logger.error('Failed to handle expiry for property', item.id, err);
          }
        }
      }
    };
    checkExpiries();
  }, [listings, user]);

  const confirmDelete = async () => {
    if (!deleteModal.id) return;
    setIsDeleting(true);
    try {
      await deleteDoc(doc(db, 'properties', deleteModal.id));
      setDeleteModal({ isOpen: false, id: null, title: '' });
      toast.success('Listing deleted');
    } catch (error) {
      logger.error('Error deleting property:', error);
      toast.error('Failed to delete property. Please try again.');
    } finally {
      setIsDeleting(false);
    }
  };

  const confirmStatusChange = async () => {
    if (!statusModal.id) return;
    setIsUpdatingStatus(true);
    try {
      await updateDoc(doc(db, 'properties', statusModal.id), { status: statusModal.newStatus, updatedAt: serverTimestamp(), expiryEmailSent: false });
      setStatusModal({ isOpen: false, id: null, title: '', newStatus: '' });
      toast.success(`Status updated to ${statusModal.newStatus}`);
    } catch (error) {
      logger.error('Error updating status:', error);
      toast.error('Failed to update status.');
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  const confirmBump = async () => {
    if (!bumpModal.id) return;
    setIsBumping(true);
    try {
      await updateDoc(doc(db, 'properties', bumpModal.id), { updatedAt: serverTimestamp(), expiryEmailSent: false });
      setBumpModal({ isOpen: false, id: null, title: '' });
      toast.success('Listing bumped successfully!');
    } catch (error) {
      logger.error('Error refreshing listing:', error);
      toast.error('Failed to refresh listing.');
    } finally {
      setIsBumping(false);
    }
  };

  const handleVerificationPaymentSubmitted = async (paymentDocId) => {
    if (!verifyModal.id) return;
    try {
      await updateDoc(doc(db, 'properties', verifyModal.id), { verificationPaymentId: paymentDocId, verificationStatus: 'pending' });
      toast.success('Verification requested! Our agent will contact you soon.');
      setVerifyModal({ isOpen: false, id: null, title: '' });
    } catch (error) {
      logger.error('Error requesting verification:', error);
      toast.error('Failed to request verification.');
    }
  };

  const filteredListings = listings.filter((item) => {
    const matchesSearch = (item.title || '').toLowerCase().includes(searchQuery.toLowerCase())
      || (item.area || item.upazila || item.district || '').toLowerCase().includes(searchQuery.toLowerCase());
    if (!matchesSearch) return false;
    const isDraftType = item.status === 'draft' || item.status === 'pending_payment';
    const isPendingApproval = !item.isApproved && !item.isRejected && !isDraftType;
    const isActive = item.isApproved && !item.isRejected;
    const isRejected = item.isRejected === true;
    if (activeFilter === 'Drafts') return isDraftType;
    if (activeFilter === 'Pending') return isPendingApproval;
    if (activeFilter === 'Active') return isActive;
    if (activeFilter === 'Rejected') return isRejected;
    if (activeFilter === 'All') return !isDraftType;
    return true;
  });

  const metrics = {
    total: listings.filter((l) => l.status !== 'draft' && l.status !== 'pending_payment').length,
    active: listings.filter((l) => l.isApproved && !l.isRejected).length,
    pending: listings.filter((l) => !l.isApproved && !l.isRejected && l.status !== 'draft' && l.status !== 'pending_payment').length,
    drafts: listings.filter((l) => l.status === 'draft' || l.status === 'pending_payment').length,
    rejected: listings.filter((l) => l.isRejected === true).length,
  };
  const filterCount = { Drafts: metrics.drafts, Pending: metrics.pending, Rejected: metrics.rejected };

  return (
    <div className="min-h-screen bg-bg pb-24">
      <Container size="wide" className="pt-[max(env(safe-area-inset-top),1.5rem)] md:pt-10">
        <header className="mb-6 flex flex-wrap items-end justify-between gap-3">
          <div>
            <h1 className="font-display text-display-md text-content">Manage listings</h1>
            <p className="mt-1 text-body-sm text-muted">Your posted properties, drafts, and their status.</p>
          </div>
          <Button as={Link} to="/post-ad" leftIcon={<Icon name="add" />}>Post new ad</Button>
        </header>

        {/* Metrics */}
        <Grid cols={3} gap="md" className="mb-6 sm:grid-cols-3">
          <MetricCard tone="primary" label="Total listings" value={metrics.total} />
          <MetricCard tone="info" label="Active" value={metrics.active} />
          <MetricCard tone="warning" label="Drafts" value={metrics.drafts} />
        </Grid>

        {/* Search + filters */}
        <div className="mb-4">
          <Input placeholder="Search your properties…" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} leftIcon={<Icon name="search" />} />
        </div>
        <div className="mb-6 flex gap-2 overflow-x-auto pb-1 no-scrollbar">
          {FILTERS.map((filter) => (
            <Button key={filter} size="sm" variant={activeFilter === filter ? 'primary' : 'secondary'} onClick={() => setActiveFilter(filter)} className="shrink-0">
              {filterCount[filter] > 0 ? `${filter} (${filterCount[filter]})` : filter}
            </Button>
          ))}
        </div>

        {/* List */}
        {loading ? (
          <div className="flex flex-col gap-4">{[0, 1, 2].map((i) => <Skeleton key={i} className="h-32 w-full" rounded="rounded-card" />)}</div>
        ) : filteredListings.length === 0 ? (
          <EmptyState
            icon={<Icon name="home" />}
            title="No properties found"
            description={searchQuery || activeFilter !== 'All' ? 'Try adjusting your search or filters.' : 'You haven’t posted any properties yet.'}
            action={!searchQuery && activeFilter === 'All' ? <Button as={Link} to="/post-ad" leftIcon={<Icon name="add" />}>Post your first ad</Button> : null}
          />
        ) : (
          <div className="flex flex-col gap-4">
            {filteredListings.map((property) => (
              <ListingCard
                key={property.id}
                property={property}
                onStatus={() => setStatusModal({ isOpen: true, id: property.id, title: property.title, newStatus: property.status === 'Available' ? 'Under Negotiation' : 'Available' })}
                onBump={() => setBumpModal({ isOpen: true, id: property.id, title: property.title })}
                onVerify={() => setVerifyModal({ isOpen: true, id: property.id, title: property.title })}
                onDelete={() => setDeleteModal({ isOpen: true, id: property.id, title: property.title })}
              />
            ))}
          </div>
        )}
      </Container>

      {/* Modals (logic preserved verbatim) */}
      <ConfirmationModal isOpen={deleteModal.isOpen} title="Delete Listing?" message={`Are you sure you want to delete "${deleteModal.title}"? This action cannot be undone.`} confirmText="Delete" confirmColor="#ef4444" icon={() => <Icon name="delete" />} variant="danger" isLoading={isDeleting} onConfirm={confirmDelete} onCancel={() => setDeleteModal({ isOpen: false, id: null, title: '' })} />
      <ConfirmationModal isOpen={statusModal.isOpen} title="Change Status?" message={`Change the status of "${statusModal.title}" to ${statusModal.newStatus}?`} confirmText="Update Status" confirmColor="#14147c" icon={() => <Icon name="info" />} variant="info" isLoading={isUpdatingStatus} onConfirm={confirmStatusChange} onCancel={() => setStatusModal({ isOpen: false, id: null, title: '', newStatus: '' })} />
      <ConfirmationModal isOpen={bumpModal.isOpen} title="Bump Listing?" message={`This will refresh the updated date for "${bumpModal.title}" keeping it active for another 365 days.`} confirmText="Bump Listing" confirmColor="#10b981" icon={() => <Icon name="refresh" />} variant="success" isLoading={isBumping} onConfirm={confirmBump} onCancel={() => setBumpModal({ isOpen: false, id: null, title: '' })} />
      <PaymentModal
        isOpen={verifyModal.isOpen}
        onClose={() => setVerifyModal({ isOpen: false, id: null, title: '' })}
        type="verification_fee" bookingType="verification"
        amount={Number(fees?.standaloneVerificationFee?.value) || 199}
        title="Onsite Verification" subtitle={`Verify: ${verifyModal.title}`}
        breakdownItems={[{ label: 'Agent Visit & Verification Fee', amount: Number(fees?.standaloneVerificationFee?.value) || 199 }]}
        propertyId={verifyModal.id} propertyName={verifyModal.title}
        onPaymentSubmitted={handleVerificationPaymentSubmitted}
      />
    </div>
  );
}

function MetricCard({ tone, label, value }) {
  const tones = { primary: 'bg-primary-subtle text-primary', info: 'bg-info-subtle text-info', warning: 'bg-warning-subtle text-warning' };
  return (
    <Card padding="md" className="flex flex-col gap-1">
      <span className="text-caption text-muted">{label}</span>
      <span className={`inline-flex w-fit items-center rounded-control px-2 py-0.5 font-display text-title-lg ${tones[tone]}`}>{value}</span>
    </Card>
  );
}

const STATUS = (p) => {
  if (p.status === 'draft') return { text: 'Draft', tone: 'warning' };
  if (p.status === 'pending_payment') return { text: 'Pending payment', tone: 'warning' };
  if (p.isRejected) return { text: 'Rejected', tone: 'danger' };
  if (!p.isApproved) return { text: 'Pending approval', tone: 'warning' };
  if (p.isApproved && p.status === 'Under Negotiation') return { text: 'Under Negotiation', tone: 'info' };
  if (p.isApproved && p.status === 'Booked') return { text: 'Booked', tone: 'info' };
  if (p.isApproved && p.status === 'Inactive') return { text: 'Inactive', tone: 'neutral' };
  return { text: 'Active', tone: 'success' };
};

function ListingCard({ property, onStatus, onBump, onVerify, onDelete }) {
  const { title, rent, area, district, upazila, image, status, id } = property;
  const displayRent = rent || property.price || 0;
  const displayLocation = upazila || area || district || 'City Area';
  const isDraftType = status === 'draft' || status === 'pending_payment';
  const to = status === 'draft' ? `/post-ad?draftId=${id}&step=2` : status === 'pending_payment' ? `/post-ad?draftId=${id}&step=3` : `/property/${id}`;
  const s = STATUS(property);
  const canVerify = !property.verificationStatus || property.verificationStatus === 'unverified';

  return (
    <Card padding="none" className="relative flex gap-4 overflow-hidden p-3">
      <Link to={to} className="flex min-w-0 flex-1 gap-4 rounded-card focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring">
        <div className="relative size-24 shrink-0 overflow-hidden rounded-card bg-surface-sunken">
          {image ? <img loading="lazy" className="size-full object-cover" src={image} alt={title || 'Listing'} /> : <div className="grid size-full place-items-center text-subtle"><Icon name="imageOff" className="size-7" /></div>}
        </div>
        <div className="flex min-w-0 flex-1 flex-col justify-center py-1 pr-8">
          <Badge tone={s.tone} size="sm" dot className="mb-1 w-fit">{s.text}</Badge>
          <h3 className="truncate text-title-sm text-content">{title || 'Untitled draft'}</h3>
          <p className="mt-0.5 flex items-center gap-1 truncate text-body-sm text-muted">
            <Icon name="location" className="size-3.5 shrink-0" /> {displayLocation}
          </p>
          <p className="mt-1.5">
            {displayRent > 0 ? (
              <span className="font-display text-title-sm text-primary">৳{displayRent.toLocaleString()}<span className="ml-0.5 text-caption font-medium text-subtle">/mo</span></span>
            ) : (
              <span className="text-body-sm font-medium text-warning">Draft incomplete</span>
            )}
          </p>
        </div>
      </Link>

      <div className="absolute right-2 top-2">
        <Dropdown align="end" trigger={<IconButton label="Listing actions" size="sm" variant="ghost"><Icon name="moreVertical" /></IconButton>}>
          {!isDraftType && (
            <>
              <DropdownItem icon={<Icon name="externalLink" />} onSelect={() => window.open(`/property/${id}`, '_self')}>View listing</DropdownItem>
              <DropdownItem icon={<Icon name="edit" />} onSelect={() => window.location.assign(`/edit-property/${id}`)}>Edit details</DropdownItem>
              {property.isApproved && !property.isRejected && (
                <>
                  <DropdownItem icon={<Icon name="refresh" />} onSelect={onStatus}>Change status</DropdownItem>
                  <DropdownItem icon={<Icon name="trending" />} onSelect={onBump}>Bump listing</DropdownItem>
                </>
              )}
              {canVerify && <DropdownItem icon={<Icon name="verified" />} onSelect={onVerify}>Request verification</DropdownItem>}
              <DropdownSeparator />
            </>
          )}
          <DropdownItem icon={<Icon name="delete" />} tone="danger" onSelect={onDelete}>Delete listing</DropdownItem>
        </Dropdown>
      </div>
    </Card>
  );
}
