import { useState } from 'react';
import {
  Plus, Search, Trash2, Download, ArrowRight, Heart, Bell, User, Settings, LogOut,
  MoreVertical, Home, Inbox, CreditCard, Star, MapPin, SlidersHorizontal, Moon, Sun,
} from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';
import { Container, Section, Grid } from '../components/layout';
import {
  Button, IconButton, Input, Textarea, Select, Checkbox, Radio, RadioGroup, Switch, Field,
  Badge, Avatar, Card, CardHeader, CardTitle, CardDescription, CardFooter,
  Skeleton, SkeletonText, LoadingState, EmptyState, ErrorState,
  Modal, ModalFooter, Drawer, Tabs, TabList, Tab, TabPanel,
  Dropdown, DropdownItem, DropdownLabel, DropdownSeparator,
  ToastProvider, useToast,
  Icon, Icons,
} from '../components/ui';
import PropertyCard from '../components/patterns/PropertyCard';
import ImageGallery from '../components/patterns/ImageGallery';

// ── Data-URI placeholder images so the gallery/cards are demonstrable offline ─
const ph = (hue, label) =>
  `data:image/svg+xml;utf8,${encodeURIComponent(
    `<svg xmlns='http://www.w3.org/2000/svg' width='800' height='600'><defs><linearGradient id='g' x1='0' y1='0' x2='1' y2='1'><stop offset='0' stop-color='hsl(${hue},70%,62%)'/><stop offset='1' stop-color='hsl(${hue + 40},65%,45%)'/></linearGradient></defs><rect width='800' height='600' fill='url(%23g)'/><text x='50%' y='50%' fill='rgba(255,255,255,0.85)' font-family='sans-serif' font-size='40' font-weight='700' text-anchor='middle' dominant-baseline='middle'>${label}</text></svg>`
  )}`;

const galleryImages = [ph(224, '01'), ph(150, '02'), ph(30, '03'), ph(330, '04')];

const mockProperties = [
  { id: 'a', title: 'Sunlit 2-Bed near Gulshan Lake', images: [ph(224, 'A1'), ph(200, 'A2')], rent: 42000, beds: 2, baths: 2, type: 'Apartment', isVerified: true, reviewCount: 18, reviewScore: 4.8, district: 'Gulshan, Dhaka' },
  { id: 'b', title: 'Cozy Studio, Dhanmondi', images: [ph(150, 'B1')], rent: 18500, beds: 1, baths: 1, type: 'Studio', reviewCount: 0, status: 'Booked', district: 'Dhanmondi, Dhaka' },
  { id: 'c', title: 'Family Home with Garden', images: [], rent: 65000, beds: 4, baths: 3, type: 'House', isVerified: true, reviewCount: 7, reviewScore: 4.6, district: 'Uttara, Dhaka' },
];

function Swatch({ name, className }) {
  return (
    <div className="flex flex-col gap-1.5">
      <div className={`h-14 rounded-card border border-border ${className}`} />
      <code className="text-caption text-muted">{name}</code>
    </div>
  );
}

function Row({ children, className = '' }) {
  return <div className={`flex flex-wrap items-center gap-3 ${className}`}>{children}</div>;
}

function Showcase() {
  const { theme, toggleTheme } = useTheme();
  const toast = useToast();
  const [modal, setModal] = useState(false);
  const [drawerR, setDrawerR] = useState(false);
  const [drawerB, setDrawerB] = useState(false);
  const [tab, setTab] = useState('overview');
  const [ptab, setPtab] = useState('day');
  const [checked, setChecked] = useState(true);
  const [radio, setRadio] = useState('pro');
  const [sw, setSw] = useState(true);
  const [saved, setSaved] = useState({});

  return (
    <div className="min-h-screen bg-bg text-content pb-24">
      {/* Header */}
      <header className="surface-blur sticky top-0 z-10 border-b border-border">
        <Container size="wide">
          <div className="flex h-16 items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="grid size-9 place-items-center rounded-control bg-primary text-on-primary font-display text-title-sm">A</div>
              <div>
                <p className="text-title-sm">AnyLet Design System</p>
                <p className="text-caption text-muted">Tokens · Components · Layouts</p>
              </div>
            </div>
            <IconButton label="Toggle theme" variant="surface" onClick={toggleTheme}>
              {theme === 'dark' ? <Sun /> : <Moon />}
            </IconButton>
          </div>
        </Container>
      </header>

      <Container size="wide">
        {/* Colors */}
        <Section title="Color — semantic tokens" description="Every token flips automatically between light and dark. Toggle the theme to see it.">
          <Grid cols={4} gap="md">
            <Swatch name="bg" className="bg-bg" />
            <Swatch name="surface" className="bg-surface" />
            <Swatch name="surface-raised" className="bg-surface-raised" />
            <Swatch name="surface-sunken" className="bg-surface-sunken" />
            <Swatch name="primary" className="bg-primary" />
            <Swatch name="primary-subtle" className="bg-primary-subtle" />
            <Swatch name="success" className="bg-success" />
            <Swatch name="warning" className="bg-warning" />
            <Swatch name="danger" className="bg-danger" />
            <Swatch name="info" className="bg-info" />
            <Swatch name="border-strong" className="bg-border-strong" />
            <Swatch name="content" className="bg-content" />
          </Grid>
          <p className="mt-6 mb-2 text-label font-medium text-muted">Brand ramp</p>
          <div className="grid grid-cols-11 gap-1 overflow-hidden rounded-card border border-border">
            {/* Explicit classes so the Tailwind scanner emits them (no dynamic strings). */}
            {[
              ['brand-50', 'bg-brand-50'], ['brand-100', 'bg-brand-100'], ['brand-200', 'bg-brand-200'],
              ['brand-300', 'bg-brand-300'], ['brand-400', 'bg-brand-400'], ['brand-500', 'bg-brand-500'],
              ['brand-600', 'bg-brand-600'], ['brand-700', 'bg-brand-700'], ['brand-800', 'bg-brand-800'],
              ['brand-900', 'bg-brand-900'], ['brand-950', 'bg-brand-950'],
            ].map(([name, cls]) => (
              <div key={name} className={`h-12 ${cls}`} title={name} />
            ))}
          </div>
        </Section>

        {/* Typography */}
        <Section title="Typography" description="Outfit (display) + Inter (text). Size-specific tracking; weight discipline — black reserved for hero display only.">
          <div className="space-y-3">
            <p className="font-display text-display-2xl">Display 2XL</p>
            <p className="font-display text-display-xl">Display XL</p>
            <p className="font-display text-display-lg">Display LG</p>
            <p className="font-display text-display-md">Display MD</p>
            <p className="text-title-lg">Title LG — section headings</p>
            <p className="text-title-md">Title MD</p>
            <p className="text-title-sm">Title SM</p>
            <p className="text-body-lg text-muted">Body LG — comfortable reading size for lead paragraphs and intros.</p>
            <p className="text-body text-muted">Body — the default paragraph size used across the product for descriptions and content.</p>
            <p className="text-body-sm text-muted">Body SM — secondary text, metadata, and supporting copy.</p>
            <p className="text-caption text-subtle">Caption — timestamps, hints, and the smallest supporting labels.</p>
            <p className="text-overline uppercase text-subtle">Overline — tasteful eyebrow</p>
          </div>
        </Section>

        {/* Radius & Elevation */}
        <Section title="Radius & Elevation">
          <div className="grid grid-cols-2 gap-8 sm:grid-cols-4">
            {[['rounded-control', 'control'], ['rounded-card', 'card'], ['rounded-card-lg', 'card-lg'], ['rounded-modal', 'modal']].map(([cls, name]) => (
              <div key={name} className="flex flex-col gap-1.5">
                <div className={`h-16 bg-surface border border-border ${cls}`} />
                <code className="text-caption text-muted">{name}</code>
              </div>
            ))}
          </div>
          <div className="mt-8 grid grid-cols-2 gap-6 sm:grid-cols-4">
            {[['shadow-card', 'card'], ['shadow-raised', 'raised'], ['shadow-overlay', 'overlay'], ['shadow-modal', 'modal']].map(([cls, name]) => (
              <div key={name} className="flex flex-col gap-1.5">
                <div className={`h-16 rounded-card bg-surface ${cls}`} />
                <code className="text-caption text-muted">{name}</code>
              </div>
            ))}
          </div>
        </Section>

        {/* Iconography */}
        <Section title="Iconography" description="One curated registry (src/lib/icons). Feature code imports concepts via <Icon name=…/>, never random icons from lucide-react — a lint rule enforces this in the design-system layer. Uniform 1.75 stroke.">
          <div className="mb-6 flex items-end gap-6">
            {['xs', 'sm', 'md', 'lg', 'xl'].map((s) => (
              <div key={s} className="flex flex-col items-center gap-1.5 text-muted">
                <Icon name="home" size={s} />
                <code className="text-caption text-subtle">{s}</code>
              </div>
            ))}
          </div>
          <div className="grid grid-cols-3 gap-1 sm:grid-cols-5 lg:grid-cols-8">
            {Object.keys(Icons).map((key) => (
              <div key={key} className="flex flex-col items-center gap-1.5 rounded-card border border-border bg-surface px-2 py-3 text-center">
                <Icon name={key} className="text-content" />
                <code className="text-[0.625rem] leading-tight text-subtle break-all">{key}</code>
              </div>
            ))}
          </div>
        </Section>

        {/* Buttons */}
        <Section title="Button" description="Six variants · three sizes · loading / disabled / icons. Press feedback on pointer-down; focus-visible ring.">
          <div className="space-y-4">
            <Row>
              <Button variant="primary">Primary</Button>
              <Button variant="secondary">Secondary</Button>
              <Button variant="soft">Soft</Button>
              <Button variant="outline">Outline</Button>
              <Button variant="ghost">Ghost</Button>
              <Button variant="danger">Danger</Button>
            </Row>
            <Row>
              <Button size="sm" leftIcon={<Plus />}>Small</Button>
              <Button size="md" leftIcon={<Plus />}>Medium</Button>
              <Button size="lg" leftIcon={<Plus />}>Large</Button>
              <Button rightIcon={<ArrowRight />}>Continue</Button>
            </Row>
            <Row>
              <Button loading>Saving…</Button>
              <Button disabled>Disabled</Button>
              <Button variant="secondary" loading>Loading</Button>
              <Button variant="primary" fullWidth className="sm:max-w-xs">Full width</Button>
            </Row>
            <Row>
              <IconButton label="Search"><Search /></IconButton>
              <IconButton label="Notifications" variant="surface"><Bell /></IconButton>
              <IconButton label="Save" variant="soft"><Heart /></IconButton>
              <IconButton label="Delete" variant="danger"><Trash2 /></IconButton>
              <IconButton label="Download" variant="primary" shape="pill"><Download /></IconButton>
            </Row>
          </div>
        </Section>

        {/* Forms */}
        <Section title="Inputs & Forms" description="Field wires label, hint, error and aria automatically.">
          <Grid cols={2} gap="lg">
            <div className="space-y-4">
              <Field label="Full name" hint="As it appears on your NID.">
                <Input placeholder="e.g. Ayesha Rahman" />
              </Field>
              <Field label="Email" error="Enter a valid email address." required>
                <Input type="email" defaultValue="ayesha@" leftIcon={<User />} />
              </Field>
              <Field label="Search listings">
                <Input placeholder="Search area, price…" leftIcon={<Search />} rightIcon={<SlidersHorizontal />} />
              </Field>
              <Field label="Division">
                <Select placeholder="Select a division" options={[{ value: 'dhaka', label: 'Dhaka' }, { value: 'ctg', label: 'Chattogram' }, { value: 'syl', label: 'Sylhet' }]} />
              </Field>
            </div>
            <div className="space-y-4">
              <Field label="About the property">
                <Textarea placeholder="Describe the home, neighbourhood, and amenities…" />
              </Field>
              <div className="space-y-3 rounded-card border border-border bg-surface p-4">
                <Checkbox label="Furnished" description="Includes basic furniture" checked={checked} onChange={(e) => setChecked(e.target.checked)} />
                <RadioGroup name="plan" value={radio} onChange={setRadio} label="Plan">
                  <Radio value="basic" label="Basic" description="List up to 3 properties" />
                  <Radio value="pro" label="Pro" description="Unlimited + featured placement" />
                </RadioGroup>
                <Switch label="Instant booking" description="Let tenants book without approval" checked={sw} onChange={setSw} />
              </div>
            </div>
          </Grid>
        </Section>

        {/* Badges & Avatars */}
        <Section title="Badge & Avatar">
          <Row className="mb-6">
            <Badge>Neutral</Badge>
            <Badge tone="primary" dot>Primary</Badge>
            <Badge tone="success" icon={<Star />}>Verified</Badge>
            <Badge tone="warning">Pending</Badge>
            <Badge tone="danger" dot>Overdue</Badge>
            <Badge tone="info">New</Badge>
            <Badge tone="outline">Outline</Badge>
          </Row>
          <Row>
            <Avatar name="Ayesha Rahman" size="xs" />
            <Avatar name="Karim" size="sm" status="online" />
            <Avatar src={ph(224, 'AR')} name="Ayesha Rahman" size="md" />
            <Avatar name="Nabila Islam" size="lg" status="busy" />
            <Avatar src={ph(150, 'MH')} name="Mahmud" size="xl" ring />
            <Avatar name="Square Shape" shape="square" size="lg" />
          </Row>
        </Section>

        {/* Cards */}
        <Section title="Card">
          <Grid cols={3} gap="md">
            <Card>
              <CardHeader>
                <CardTitle>Surface card</CardTitle>
                <CardDescription>The default container for grouped content.</CardDescription>
              </CardHeader>
              <CardFooter><Button size="sm">Action</Button><Button size="sm" variant="ghost">Cancel</Button></CardFooter>
            </Card>
            <Card variant="raised">
              <CardHeader><CardTitle>Raised card</CardTitle><CardDescription>Higher elevation for emphasis.</CardDescription></CardHeader>
              <CardFooter><Badge tone="success">Active</Badge></CardFooter>
            </Card>
            <Card interactive as="a" href="#card">
              <CardHeader><CardTitle>Interactive</CardTitle><CardDescription>Hover to lift. Whole card is a link.</CardDescription></CardHeader>
              <CardFooter><span className="inline-flex items-center gap-1 text-body-sm text-primary">Open <ArrowRight className="size-4" /></span></CardFooter>
            </Card>
          </Grid>
        </Section>

        {/* Tabs */}
        <Section title="Tabs">
          <div className="grid gap-8 lg:grid-cols-2">
            <div>
              <Tabs value={tab} onChange={setTab}>
                <TabList aria-label="Property sections">
                  <Tab value="overview">Overview</Tab>
                  <Tab value="reviews">Reviews</Tab>
                  <Tab value="location">Location</Tab>
                </TabList>
                <div className="pt-4 text-body-sm text-muted">
                  <TabPanel value="overview">Overview content — spacious, sunlit, and recently renovated.</TabPanel>
                  <TabPanel value="reviews">Reviews content — 4.8 average across 18 verified stays.</TabPanel>
                  <TabPanel value="location">Location content — 5 min walk to Gulshan Lake.</TabPanel>
                </div>
              </Tabs>
            </div>
            <div>
              <Tabs value={ptab} onChange={setPtab} variant="pill">
                <TabList aria-label="Range">
                  <Tab value="day">Day</Tab>
                  <Tab value="week">Week</Tab>
                  <Tab value="month">Month</Tab>
                </TabList>
              </Tabs>
            </div>
          </div>
        </Section>

        {/* Overlays */}
        <Section title="Overlays — Modal · Drawer · Dropdown · Toast">
          <Row>
            <Button onClick={() => setModal(true)}>Open modal</Button>
            <Button variant="secondary" onClick={() => setDrawerR(true)}>Right drawer</Button>
            <Button variant="secondary" onClick={() => setDrawerB(true)}>Bottom sheet</Button>
            <Dropdown
              align="start"
              trigger={<Button variant="outline" rightIcon={<MoreVertical />}>Menu</Button>}
            >
              <DropdownLabel>Account</DropdownLabel>
              <DropdownItem icon={<User />} onSelect={() => toast.info('Profile')}>Profile</DropdownItem>
              <DropdownItem icon={<Settings />} onSelect={() => toast.info('Settings')}>Settings</DropdownItem>
              <DropdownSeparator />
              <DropdownItem icon={<LogOut />} tone="danger" onSelect={() => toast.warning('Signed out')}>Log out</DropdownItem>
            </Dropdown>
          </Row>
          <Row className="mt-3">
            <Button variant="soft" onClick={() => toast.success('Property saved to favourites')}>Toast · success</Button>
            <Button variant="soft" onClick={() => toast.error('Payment could not be processed')}>error</Button>
            <Button variant="soft" onClick={() => toast.info('New message from a landlord')}>info</Button>
            <Button variant="soft" onClick={() => toast.warning('Your listing expires in 2 days')}>warning</Button>
          </Row>
        </Section>

        {/* States */}
        <Section title="Loading · Empty · Error states">
          <Grid cols={3} gap="md">
            <Card padding="none" className="overflow-hidden">
              <div className="p-4">
                <div className="flex items-center gap-3">
                  <Skeleton rounded="rounded-full" className="size-11" />
                  <div className="flex-1"><SkeletonText lines={2} /></div>
                </div>
                <Skeleton className="mt-4 h-32 w-full" rounded="rounded-card" />
              </div>
            </Card>
            <Card><EmptyState size="sm" icon={<Inbox />} title="No saved homes yet" description="Tap the heart on any listing to save it here." action={<Button size="sm">Explore</Button>} /></Card>
            <Card><ErrorState title="Couldn’t load listings" description="Check your connection and try again." onRetry={() => toast.info('Retrying…')} /></Card>
          </Grid>
          <Card className="mt-4"><LoadingState label="Loading your dashboard…" description="Fetching the latest bookings and messages." /></Card>
        </Section>

        {/* Patterns */}
        <Section title="Pattern — PropertyCard">
          <Grid cols={3} gap="md">
            {mockProperties.map((p) => (
              <PropertyCard key={p.id} property={p} saved={!!saved[p.id]} onToggleSave={(id) => setSaved((s) => ({ ...s, [id]: !s[id] }))} />
            ))}
          </Grid>
        </Section>

        <Section title="Pattern — ImageGallery">
          <div className="max-w-2xl">
            <ImageGallery images={galleryImages} alt="Sample property" />
          </div>
        </Section>
      </Container>

      {/* Overlay instances */}
      <Modal open={modal} onClose={() => setModal(false)} title="Confirm booking" description="You’re about to request this property for 12 months.">
        <p className="text-body-sm text-muted">The landlord will review your request and respond within 24 hours. You won’t be charged until they accept.</p>
        <div className="mt-4 flex items-center gap-3 rounded-card bg-surface-sunken p-3">
          <MapPin className="size-5 text-primary" />
          <div className="text-body-sm"><p className="font-medium text-content">Sunlit 2-Bed near Gulshan Lake</p><p className="text-muted">৳42,000 / month</p></div>
        </div>
        <ModalFooter>
          <Button variant="ghost" onClick={() => setModal(false)}>Cancel</Button>
          <Button onClick={() => { setModal(false); toast.success('Booking request sent'); }}>Send request</Button>
        </ModalFooter>
      </Modal>

      <Drawer open={drawerR} onClose={() => setDrawerR(false)} side="right" title="Filters" description="Refine your search">
        <div className="space-y-4">
          <Field label="Max rent"><Input type="number" defaultValue={50000} leftIcon={<CreditCard />} /></Field>
          <Field label="Property type"><Select options={[{ value: 'apt', label: 'Apartment' }, { value: 'house', label: 'House' }, { value: 'studio', label: 'Studio' }]} /></Field>
          <Checkbox label="Verified landlords only" defaultChecked />
          <Button fullWidth onClick={() => setDrawerR(false)}>Apply filters</Button>
        </div>
      </Drawer>

      <Drawer open={drawerB} onClose={() => setDrawerB(false)} side="bottom" title="Quick actions">
        <div className="grid grid-cols-2 gap-3 pb-2">
          <Button variant="secondary" leftIcon={<Home />}>Book viewing</Button>
          <Button variant="secondary" leftIcon={<Heart />}>Save</Button>
          <Button variant="secondary" leftIcon={<Bell />}>Set alert</Button>
          <Button variant="secondary" leftIcon={<User />}>Contact</Button>
        </div>
      </Drawer>
    </div>
  );
}

export default function DesignSystem() {
  // Uses the design-system ToastProvider so useToast() resolves here.
  return (
    <ToastProvider>
      <Showcase />
    </ToastProvider>
  );
}
