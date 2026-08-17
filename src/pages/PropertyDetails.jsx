import { useNavigate, useParams, Link } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { doc, getDoc, collection, addDoc, serverTimestamp, query, where, getDocs, limit, updateDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import { getOrCreateConversation } from '../utils/messageService';
import { createNotification } from '../utils/notificationService';
import { getOptimizedImageUrl } from '../utils/imageUtils';
import useSavedProperties from '../hooks/useSavedProperties';
import QUERY_LIMITS from '../config/queryLimits';
import logger from '../utils/logger';
import ViewingRequestModal from '../components/ViewingRequestModal';
import ConfirmationModal from '../components/ConfirmationModal';
import ShareModal from '../components/ShareModal';
import BookPropertyModal from '../components/BookPropertyModal';
import { PropertyDetailSkeleton } from '../components/Skeleton';
import Container from '../components/layout/Container';
import Section from '../components/layout/Section';
import { Button, IconButton, Badge, Card, Icon, EmptyState, ExpandableText, useToast } from '../components/ui';
import { cn } from '../lib/cn';
import PropertyGallery from '../components/property/PropertyGallery';
import BookingPanel from '../components/property/BookingPanel';
import MobileBookingBar from '../components/property/MobileBookingBar';
import SpecsGrid from '../components/property/SpecsGrid';
import AmenitiesGrid from '../components/property/AmenitiesGrid';
import PropertyLocationMap from '../components/property/PropertyLocationMap';
import OwnerCard from '../components/property/OwnerCard';
import ReviewsSummary from '../components/property/ReviewsSummary';

const STATUS_TONE = { 'Let Agreed': 'danger', Booked: 'info' };

export default function PropertyDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const { t } = useLanguage();
  const toast = useToast();
  const { toggleSaveProperty, isPropertySaved } = useSavedProperties();

  const [property, setProperty] = useState(null);
  const [loading, setLoading] = useState(true);
  const [requestSending, setRequestSending] = useState(false);
  const [requestSent, setRequestSent] = useState(false);
  const [owner, setOwner] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [reviewsLoading, setReviewsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [callModalOpen, setCallModalOpen] = useState(false);
  const [phoneNumberToCall, setPhoneNumberToCall] = useState('');
  const [shareModalOpen, setShareModalOpen] = useState(false);
  const [bookModalOpen, setBookModalOpen] = useState(false);

  useEffect(() => {
    const fetchProperty = async () => {
      try {
        const docRef = doc(db, 'properties', id);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          const propData = { id: docSnap.id, ...docSnap.data() };
          setProperty(propData);

          const ownerIdToFetch = propData.ownerId || propData.userId;
          if (ownerIdToFetch) {
            const ownerDoc = await getDoc(doc(db, 'users', ownerIdToFetch));
            if (ownerDoc.exists()) setOwner({ id: ownerDoc.id, ...ownerDoc.data() });
          }

          try {
            const moveInsQ = query(
              collection(db, 'tenantMoveIns'),
              where('propertyId', '==', id),
              where('status', '==', 'active'),
              limit(QUERY_LIMITS.HARD_CAP)
            );
            const moveInsSnap = await getDocs(moveInsQ);
            propData.rentHistoryCount = moveInsSnap.size;
          } catch {
            propData.rentHistoryCount = 0;
          }

          if (currentUser) {
            try {
              const reqQ = query(collection(db, 'viewing_requests'), where('tenantId', '==', currentUser.uid), limit(50));
              const reqSnap = await getDocs(reqQ);
              const fortyEightHoursAgoMs = Date.now() - 48 * 60 * 60 * 1000;
              const hasRecentRequest = reqSnap.docs.some((d) => {
                const data = d.data();
                if (data.propertyId !== id) return false;
                let createdMs = 0;
                if (data.createdAt) {
                  if (typeof data.createdAt.toMillis === 'function') createdMs = data.createdAt.toMillis();
                  else if (data.createdAt instanceof Date) createdMs = data.createdAt.getTime();
                  else if (typeof data.createdAt.seconds === 'number') createdMs = data.createdAt.seconds * 1000;
                }
                if (createdMs === 0) return false;
                return createdMs >= fortyEightHoursAgoMs;
              });
              if (hasRecentRequest) setRequestSent(true);
            } catch { /* non-critical */ }
          }
        }
      } finally {
        setLoading(false);
      }
    };
    fetchProperty();
  }, [id, currentUser]);

  useEffect(() => {
    if (!id) return;
    getDocs(query(collection(db, 'propertyReviews'), where('propertyId', '==', id), where('isApproved', '==', true)))
      .then((snap) => {
        const data = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
        data.sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));
        setReviews(data);
      })
      .catch(() => {})
      .finally(() => setReviewsLoading(false));
  }, [id]);

  const handleSendRequest = async (formData) => {
    if (!currentUser) return navigate('/login');
    if (!currentUser.emailVerified) {
      toast.warning('Please verify your email address to send viewing requests.');
      return;
    }
    const targetOwnerId = property.ownerId || property.userId;
    if (targetOwnerId === currentUser.uid) {
      toast.error('You cannot request your own property.');
      return;
    }
    try {
      setRequestSending(true);
      const dupQ = query(collection(db, 'viewing_requests'), where('tenantId', '==', currentUser.uid), limit(50));
      const dupSnap = await getDocs(dupQ);
      const fortyEightHoursAgoMs = Date.now() - 48 * 60 * 60 * 1000;
      const duplicate = dupSnap.docs.find((d) => {
        const data = d.data();
        if (data.propertyId !== id) return false;
        let createdMs = 0;
        if (data.createdAt) {
          if (typeof data.createdAt.toMillis === 'function') createdMs = data.createdAt.toMillis();
          else if (data.createdAt instanceof Date) createdMs = data.createdAt.getTime();
          else if (typeof data.createdAt.seconds === 'number') createdMs = data.createdAt.seconds * 1000;
        }
        if (createdMs === 0) return false;
        return createdMs >= fortyEightHoursAgoMs;
      });
      if (duplicate) {
        toast.error('You already sent a request for this property. Please wait 48 hours before trying again.');
        return;
      }

      const reqRef = await addDoc(collection(db, 'viewing_requests'), {
        propertyId: id,
        propertyName: property.title,
        propertyImage: property.images?.[0] || null,
        propertyPrice: property.rent || property.price || null,
        ownerId: targetOwnerId,
        tenantId: currentUser.uid,
        tenantName: currentUser.displayName ?? formData.name,
        status: 'pending',
        isRead: false,
        conversationId: null,
        createdAt: serverTimestamp(),
        tenantDetails: {
          name: formData.name,
          email: formData.email,
          phone: formData.phone,
          profession: formData.profession,
          numberOfOccupants: Number(formData.numberOfOccupants || 1),
          preferredDate: formData.preferredDate || '',
          message: formData.message || '',
        },
      });

      const ownerDoc = await getDoc(doc(db, 'users', targetOwnerId));
      const ownerData = ownerDoc.exists() ? ownerDoc.data() : {};

      const convId = await getOrCreateConversation({
        ownerId: targetOwnerId,
        tenantId: currentUser.uid,
        propertyId: id,
        propertyTitle: property.title,
        propertyImage: property.images?.[0] || null,
        propertyPrice: property.rent || property.price || null,
        requestId: reqRef.id,
        ownerInfo: { name: ownerData.displayName ?? 'Owner', photo: ownerData.photoURL ?? null, phone: ownerData.phone ?? null },
        tenantInfo: { name: currentUser.displayName ?? formData.name, photo: currentUser.photoURL ?? null, phone: formData.phone ?? null },
        initialOwnerUnread: 1,
      });

      await updateDoc(reqRef, { conversationId: convId });

      if (targetOwnerId) {
        await createNotification(
          targetOwnerId,
          'request_received',
          'New Viewing Request',
          `${formData.name} wants to view ${property.title}`,
          `/messages/${convId}`,
          { propertyId: id }
        );
      }

      setRequestSent(true);
      setIsModalOpen(false);
      toast.success('Request sent successfully! Check your Messages to start chatting.');
    } catch (error) {
      logger.error(error);
      toast.error('Failed to send request. Please try again.');
    } finally {
      setRequestSending(false);
    }
  };

  if (loading) return <PropertyDetailSkeleton />;

  if (!property) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-bg p-6">
        <EmptyState icon={<Icon name="home" />} title={t('no_properties')} action={<Button as={Link} to="/search">{t('search')}</Button>} />
      </div>
    );
  }

  const images = (property.images || []).map((src) => getOptimizedImageUrl(src, 1600));
  const isOwner = currentUser && (currentUser.uid === property.ownerId || currentUser.uid === property.userId);
  const available = property.status !== 'Let Agreed' && property.status !== 'Booked';
  const saved = isPropertySaved(id);
  const ownerId = property.ownerId || property.userId;

  const waUrl = (() => {
    const raw = owner?.whatsappNumber || owner?.phone || property?.ownerPhone;
    if (!raw) return null;
    const digits = raw.replace(/\D/g, '');
    const intl = digits.startsWith('880') ? digits : `880${digits.replace(/^0/, '')}`;
    const msg = encodeURIComponent(
      `হ্যালো, আমি Any-Let এ আপনার "${property.title}" প্রপার্টি দেখেছি (https://anylet.com/property/${id})। আমি এটি সম্পর্কে আরও বিস্তারিত জানতে আগ্রহী।`
    );
    return `https://wa.me/${intl}?text=${msg}`;
  })();

  const handleBook = () => { if (!currentUser) return navigate('/login'); setBookModalOpen(true); };
  const handleRequest = () => { if (!requestSent) setIsModalOpen(true); };
  const handleCall = () => {
    if (!currentUser) return navigate('/login');
    if (!currentUser.emailVerified) { toast.warning('Please verify your email address to call the owner.'); return; }
    const phone = owner?.phone || property?.ownerPhone || '';
    if (phone) { setPhoneNumberToCall(phone); setCallModalOpen(true); }
    else toast.error('Phone number not available');
  };

  const primaryIsBook = property.instantBooking || property.securityDeposit > 0;
  const onPrimary = primaryIsBook ? handleBook : handleRequest;
  const primaryLabel = primaryIsBook ? 'Book now' : t('request_viewing');

  const verificationBadges = (
    <div className="flex flex-wrap items-center gap-2">
      {property.isPropertyVerified && <Badge tone="success" size="md" icon={<Icon name="verified" />}>AnyLet Verified</Badge>}
      {property.isVerified && <Badge tone="primary" size="md" icon={<Icon name="verified" />}>Verified Landlord</Badge>}
      {property.isOnsiteVerified && <Badge tone="info" size="md" icon={<Icon name="verified" />}>Onsite Verified</Badge>}
      {reviews.length > 0 && (
        <Badge tone="warning" size="md" icon={<Icon name="rating" className="fill-warning" />}>
          {(reviews.reduce((a, r) => a + (r.rating || 0), 0) / reviews.length).toFixed(1)} ({reviews.length})
        </Badge>
      )}
    </div>
  );

  return (
    <div className="min-h-screen bg-bg pb-28 lg:pb-12">
      <Container size="wide" className="py-4 md:py-8">
        {/* Top bar */}
        <div className="mb-4 flex items-center justify-between">
          <Button variant="ghost" size="sm" onClick={() => navigate(-1)} leftIcon={<Icon name="back" />} className="-ml-2">
            <span className="hidden sm:inline">{t('back_to_discovery')}</span>
          </Button>
          <div className="flex items-center gap-2">
            <IconButton label="Share property" variant="surface" onClick={() => setShareModalOpen(true)}><Icon name="share" /></IconButton>
            <IconButton
              label={saved ? 'Remove from saved' : 'Save property'}
              aria-pressed={saved}
              variant="surface"
              onClick={() => toggleSaveProperty(id)}
            >
              <Icon name="favorite" className={cn(saved && 'fill-danger text-danger')} />
            </IconButton>
          </div>
        </div>

        {/* Hero */}
        <PropertyGallery images={images} alt={property.title} />

        {/* Title */}
        <div className="mt-6 flex flex-col gap-3">
          {property.status && property.status !== 'Available' && (
            <Badge tone={STATUS_TONE[property.status] || 'warning'} size="md" className="w-fit">{property.status}</Badge>
          )}
          <h1 className="font-display text-display-md text-content lg:text-display-lg">{property.title}</h1>
          <p className="inline-flex items-center gap-1.5 text-body-sm text-muted">
            <Icon name="location" className="size-4 shrink-0 text-primary" />
            {property.addressDetails ? `${property.addressDetails}, ` : ''}{property.upazila}, {property.district}
          </p>
          {verificationBadges}
        </div>

        {/* Body */}
        <div className="mt-8 grid grid-cols-1 gap-8 lg:grid-cols-[minmax(0,1fr)_380px] lg:gap-12">
          {/* Main content */}
          <div className="min-w-0 space-y-8">
            <SpecsGrid property={property} t={t} />

            {property.rentHistoryCount > 0 && (
              <Card padding="md" className="flex items-center gap-4 border-success/20 bg-success-subtle">
                <span className="grid size-11 shrink-0 place-items-center rounded-full bg-success/15 text-success"><Icon name="verified" className="size-5" /></span>
                <p className="text-body-sm text-muted">
                  <span className="font-semibold text-content">Trusted property</span> — securely rented {property.rentHistoryCount} times via AnyLet.
                </p>
              </Card>
            )}

            <Section title={t('description')} spacing="none">
              <ExpandableText lines={6}>{property.description || 'No description provided.'}</ExpandableText>
            </Section>

            <Section title={t('amenities')} spacing="none">
              <AmenitiesGrid features={property.features} utilities={property.utilities} t={t} />
            </Section>

            <Section title="Where you’ll be" spacing="none">
              <PropertyLocationMap property={property} onOpenFullMap={() => navigate('/map', { state: { centerProperty: property } })} />
            </Section>

            {/* Owner (mobile position within flow) */}
            <div className="lg:hidden">
              <OwnerCard owner={owner} ownerId={ownerId} onCall={handleCall} waUrl={waUrl} />
            </div>

            <Section title="Ratings & reviews" spacing="none" id="reviews">
              <ReviewsSummary reviews={reviews} score={property.reviewScore} count={property.reviewCount} propertyId={property.id} loading={reviewsLoading} />
            </Section>

            <Link to={`/report-property/${id}`} state={{ property }}
              className="inline-flex items-center gap-2 py-2 text-body-sm font-medium text-subtle transition-colors hover:text-danger">
              <Icon name="warning" className="size-4" /> Report this listing
            </Link>
          </div>

          {/* Sticky sidebar (desktop) */}
          <aside className="space-y-6">
            <div className="lg:sticky lg:top-24 lg:space-y-6">
              <BookingPanel
                property={property} isOwner={isOwner} available={available}
                requestSent={requestSent} requestSending={requestSending}
                onBook={handleBook} onRequest={handleRequest} onCall={handleCall}
                waUrl={waUrl} t={t} className="hidden lg:block"
              />
              <div className="hidden lg:block">
                <OwnerCard owner={owner} ownerId={ownerId} onCall={handleCall} waUrl={waUrl} />
              </div>
            </div>
          </aside>
        </div>
      </Container>

      {/* Mobile floating bar */}
      {!isOwner && (
        <MobileBookingBar
          property={property} available={available}
          requestSent={requestSent} requestSending={requestSending}
          primaryLabel={primaryLabel} onPrimary={onPrimary}
        />
      )}

      <ViewingRequestModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} onSubmit={handleSendRequest} propertyTitle={property.title} />
      <ConfirmationModal
        isOpen={callModalOpen}
        title="Make a Call to Owner"
        message="Are you sure you want to call the property owner? Your phone dialer will be launched."
        confirmText="Call"
        confirmColor="#16a34a"
        icon={() => <Icon name="phone" />}
        variant="success"
        onConfirm={() => { window.location.href = `tel:${phoneNumberToCall}`; setCallModalOpen(false); }}
        onCancel={() => setCallModalOpen(false)}
      />
      <ShareModal isOpen={shareModalOpen} onClose={() => setShareModalOpen(false)} property={property} />
      <BookPropertyModal isOpen={bookModalOpen} onClose={() => setBookModalOpen(false)} property={property} />
    </div>
  );
}
