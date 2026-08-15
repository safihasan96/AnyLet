/* eslint-disable react-refresh/only-export-components -- dev-only preview entry (side-effect render, no exports). */
/**
 * Firebase-free preview of the Property "Golden Page" — composes the real
 * property/* components with mock data so the flagship layout can be visually
 * QA'd without a backend. Visit /property-preview.html. Not shipped.
 */
import { StrictMode, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { ThemeProvider, useTheme } from './contexts/ThemeContext';
import Container from './components/layout/Container';
import Section from './components/layout/Section';
import { Button, IconButton, Badge, Card, Icon, ExpandableText } from './components/ui';
import { cn } from './lib/cn';
import PropertyGallery from './components/property/PropertyGallery';
import BookingPanel from './components/property/BookingPanel';
import MobileBookingBar from './components/property/MobileBookingBar';
import SpecsGrid from './components/property/SpecsGrid';
import AmenitiesGrid from './components/property/AmenitiesGrid';
import PropertyLocationMap from './components/property/PropertyLocationMap';
import OwnerCard from './components/property/OwnerCard';
import ReviewsSummary from './components/property/ReviewsSummary';
import './index.css';

const ph = (hue, label) =>
  `data:image/svg+xml;utf8,${encodeURIComponent(
    `<svg xmlns='http://www.w3.org/2000/svg' width='1200' height='900'><defs><linearGradient id='g' x1='0' y1='0' x2='1' y2='1'><stop offset='0' stop-color='hsl(${hue},68%,60%)'/><stop offset='1' stop-color='hsl(${hue + 35},60%,42%)'/></linearGradient></defs><rect width='1200' height='900' fill='url(%23g)'/><text x='50%' y='50%' fill='rgba(255,255,255,0.8)' font-family='sans-serif' font-size='72' font-weight='700' text-anchor='middle' dominant-baseline='middle'>${label}</text></svg>`
  )}`;

const property = {
  id: 'demo', title: 'Sunlit 3-Bed Apartment with Lake View', rent: 42000, billingCycle: 'Month',
  utilitiesCost: 3500, securityDeposit: 84000, instantBooking: true,
  beds: 3, baths: 2, area: 1450, furnishing: 'Semi-furnished',
  addressDetails: 'Road 11, Block C', upazila: 'Gulshan', district: 'Dhaka', division: 'Dhaka',
  images: [ph(224, '01'), ph(200, '02'), ph(160, '03'), ph(30, '04'), ph(320, '05'), ph(120, '06')],
  isPropertyVerified: true, isVerified: true, reviewScore: 4.8, reviewCount: 24, rentHistoryCount: 3,
  features: ['Lift/Elevator', 'CCTV Security', 'Balcony', 'Rooftop Access', 'Car Parking', 'Fire Exit'],
  utilities: ['Prepaid Gas', 'Central WiFi', 'Deep Tube-well Water', 'Generator/IPS Backup'],
  description: 'A bright, airy 3-bedroom apartment on the 8th floor with uninterrupted views over Gulshan Lake. Freshly renovated with premium tiling, a spacious drawing–dining, and a modern kitchen. The building offers 24/7 security, a backup generator, and dedicated car parking. Walking distance to Gulshan-2 circle, international schools, and hospitals. Ideal for a small family or professionals looking for a calm, well-connected home in the heart of the city.',
  status: 'Available',
};
const owner = { name: 'Ayesha Rahman', photoURL: ph(280, 'AR'), verified: true, responseRate: 98, createdAt: new Date('2021-03-01') };
const reviews = [
  { id: 'r1', reviewerName: 'Karim Hossain', rating: 5, body: 'Fantastic place, exactly as pictured. The host was responsive and the move-in was smooth.', createdAt: { seconds: 1710000000 } },
  { id: 'r2', reviewerName: 'Nabila Islam', rating: 5, body: 'Great location and very secure building. Highly recommend.', createdAt: { seconds: 1700000000 } },
  { id: 'r3', reviewerName: 'Rafiq Ahmed', rating: 4, body: 'Comfortable and clean. Lift was occasionally slow but overall a lovely home.', createdAt: { seconds: 1690000000 } },
];

const t = (k) => ({
  request_viewing: 'Request viewing', call_owner: 'Call owner', back_to_discovery: 'Back',
  description: 'Description', amenities: 'Amenities', inclusions: 'Included', sqft: 'sqft',
  bedrooms: 'Bedrooms', bathrooms: 'Bathrooms',
}[k] || k);

function GoldenPage() {
  const { theme, toggleTheme } = useTheme();
  const [saved, setSaved] = useState(false);
  const noop = () => {};

  return (
    <div className="min-h-screen bg-bg pb-28 lg:pb-12">
      <Container size="wide" className="py-4 md:py-8">
        <div className="mb-4 flex items-center justify-between">
          <Button variant="ghost" size="sm" leftIcon={<Icon name="back" />} className="-ml-2"><span className="hidden sm:inline">Back</span></Button>
          <div className="flex items-center gap-2">
            <IconButton label="Toggle theme" variant="surface" onClick={toggleTheme}><Icon name={theme === 'dark' ? 'themeLight' : 'themeDark'} /></IconButton>
            <IconButton label="Share" variant="surface"><Icon name="share" /></IconButton>
            <IconButton label={saved ? 'Unsave' : 'Save'} aria-pressed={saved} variant="surface" onClick={() => setSaved((s) => !s)}>
              <Icon name="favorite" className={cn(saved && 'fill-danger text-danger')} />
            </IconButton>
          </div>
        </div>

        <PropertyGallery images={property.images} alt={property.title} />

        <div className="mt-6 flex flex-col gap-3">
          <h1 className="font-display text-display-md text-content lg:text-display-lg">{property.title}</h1>
          <p className="inline-flex items-center gap-1.5 text-body-sm text-muted">
            <Icon name="location" className="size-4 shrink-0 text-primary" /> Road 11, Block C, Gulshan, Dhaka
          </p>
          <div className="flex flex-wrap gap-2">
            <Badge tone="success" size="md" icon={<Icon name="verified" />}>AnyLet Verified</Badge>
            <Badge tone="primary" size="md" icon={<Icon name="verified" />}>Verified Landlord</Badge>
            <Badge tone="warning" size="md" icon={<Icon name="rating" className="fill-warning" />}>4.8 (24)</Badge>
          </div>
        </div>

        <div className="mt-8 grid grid-cols-1 gap-8 lg:grid-cols-[minmax(0,1fr)_380px] lg:gap-12">
          <div className="min-w-0 space-y-8">
            <SpecsGrid property={property} t={t} />
            <Card padding="md" className="flex items-center gap-4 border-success/20 bg-success-subtle">
              <span className="grid size-11 shrink-0 place-items-center rounded-full bg-success/15 text-success"><Icon name="verified" className="size-5" /></span>
              <p className="text-body-sm text-muted"><span className="font-semibold text-content">Trusted property</span> — securely rented 3 times via AnyLet.</p>
            </Card>
            <Section title="Description" spacing="none"><ExpandableText lines={4}>{property.description}</ExpandableText></Section>
            <Section title="Amenities" spacing="none"><AmenitiesGrid features={property.features} utilities={property.utilities} t={t} /></Section>
            <Section title="Where you’ll be" spacing="none"><PropertyLocationMap property={property} onOpenFullMap={noop} /></Section>
            <div className="lg:hidden"><OwnerCard owner={owner} ownerId="demo" onCall={noop} waUrl="#" /></div>
            <Section title="Ratings & reviews" spacing="none"><ReviewsSummary reviews={reviews} score={4.8} count={24} propertyId="demo" loading={false} /></Section>
          </div>

          <aside className="space-y-6">
            <div className="lg:sticky lg:top-6 lg:space-y-6">
              <BookingPanel property={property} isOwner={false} available requestSent={false} requestSending={false}
                onBook={noop} onRequest={noop} onCall={noop} waUrl="#" t={t} className="hidden lg:block" />
              <div className="hidden lg:block"><OwnerCard owner={owner} ownerId="demo" onCall={noop} waUrl="#" /></div>
            </div>
          </aside>
        </div>
      </Container>

      <MobileBookingBar property={property} available requestSent={false} requestSending={false} primaryLabel="Book now" onPrimary={noop} />
    </div>
  );
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ThemeProvider>
      <BrowserRouter>
        <GoldenPage />
      </BrowserRouter>
    </ThemeProvider>
  </StrictMode>
);
