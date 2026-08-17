import { useState, useEffect, useRef, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { motion, AnimatePresence, useScroll, useMotionValueEvent, useReducedMotion } from 'framer-motion';
import { db } from '../firebase';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import { useIsDesktop } from '../hooks/useMediaQuery';
import { bdLocations } from '../data/locations';
import FeaturedListings from '../components/FeaturedListings';
import Container from '../components/layout/Container';
import Section from '../components/layout/Section';
import { Button, IconButton, Select, Icon } from '../components/ui';

const CATEGORIES = [
  { label: 'All', icon: 'dashboard' },
  { label: 'Apartment', icon: 'apartment' },
  { label: 'Room', icon: 'room' },
  { label: 'Sublet', icon: 'users' },
  { label: 'Mess', icon: 'bed' },
  { label: 'House', icon: 'home' },
  { label: 'Cottage', icon: 'land' },
  { label: 'Hotel', icon: 'hotel' },
  { label: 'Resort', icon: 'resort' },
  { label: 'Commercial Space', icon: 'commercial' },
  { label: 'Land', icon: 'map' },
  { label: 'Shop', icon: 'shop' },
  { label: 'Others', icon: 'moreHorizontal' },
];

export default function Home() {
  const { currentUser } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();
  const isDesktop = useIsDesktop();
  const reduce = useReducedMotion();

  const [hasUnread, setHasUnread] = useState(false);
  const [division, setDivision] = useState('');
  const [category, setCategory] = useState('All');

  // Sticky search bar (appears once the inline bar scrolls out of view)
  const searchBarRef = useRef(null);
  const [isSticky, setIsSticky] = useState(false);
  const { scrollY } = useScroll();
  useMotionValueEvent(scrollY, 'change', useCallback((latest) => {
    if (!searchBarRef.current) return;
    const threshold = isDesktop ? 80 : 0;
    setIsSticky(latest > searchBarRef.current.offsetTop - threshold);
  }, [isDesktop]));

  useEffect(() => {
    if (!currentUser) return;
    const q = query(
      collection(db, 'notifications'),
      where('userId', '==', currentUser.uid),
      where('isRead', '==', false)
    );
    const unsub = onSnapshot(q, (snap) => setHasUnread(!snap.empty));
    return () => unsub();
  }, [currentUser]);

  const showUnread = !!currentUser && hasUnread;
  const goSearch = () => navigate('/search', { state: { division } });

  const divisionOptions = Object.keys(bdLocations).map((d) => ({ value: d, label: d }));

  return (
    <div className="min-h-screen bg-bg pb-24">
      <Helmet>
        <title>Any-Let | The Smartest Way to Rent in Bangladesh</title>
        <meta name="description" content="Discover verified properties for rent in Dhaka, Chittagong, and across Bangladesh. Connect with trusted landlords securely on Any-Let." />
      </Helmet>

      {/* ── Mobile header ── */}
      <header className="flex items-center justify-between gap-3 px-4 pb-3 pt-3 md:hidden">
        <div className="flex min-w-0 items-center gap-2">
          <span className="grid size-9 shrink-0 place-items-center rounded-control bg-primary text-on-primary">
            <Icon name="location" className="size-5" />
          </span>
          <div className="min-w-0">
            <p className="text-overline uppercase text-subtle">Location</p>
            <Select
              size="sm"
              value={division}
              onChange={(e) => setDivision(e.target.value)}
              options={[{ value: '', label: 'All Bangladesh' }, ...divisionOptions]}
              className="h-auto border-0 bg-transparent px-0 pr-6 text-body-sm font-semibold focus:ring-0"
              containerClassName="w-[9.5rem]"
            />
          </div>
        </div>
        <div className="relative">
          <IconButton label="Notifications" variant="surface" as={Link} to="/notifications">
            <Icon name="notifications" />
          </IconButton>
          {showUnread && <span className="absolute right-1.5 top-1.5 size-2 rounded-full bg-danger ring-2 ring-surface" aria-hidden="true" />}
        </div>
      </header>

      {/* ── Sticky search (fades in on scroll) ── */}
      <AnimatePresence>
        {isSticky && (
          <motion.div
            key="sticky"
            initial={reduce ? { opacity: 0 } : { opacity: 0, y: -12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={reduce ? { opacity: 0 } : { opacity: 0, y: -12 }}
            transition={{ duration: 0.18, ease: [0.2, 0, 0, 1] }}
            className="fixed inset-x-0 z-40 surface-blur border-b border-border"
            style={{ top: isDesktop ? '64px' : 'env(safe-area-inset-top, 0px)' }}
          >
            <Container size="wide" className="py-2.5">
              <Link
                to="/search"
                state={{ division }}
                className="flex h-11 items-center gap-2 rounded-control border border-border bg-surface px-3 text-body-sm text-subtle transition-colors hover:border-primary/40 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
              >
                <Icon name="search" className="size-5 text-subtle" />
                <span className="flex-1 truncate">{t('search_placeholder')}</span>
                <span className="hidden items-center gap-1.5 text-caption text-muted sm:flex">
                  <Icon name="location" className="size-4 text-primary" /> {division || 'All Bangladesh'}
                </span>
              </Link>
            </Container>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Hero ── */}
      <Container size="wide">
        <div className="grid grid-cols-1 items-center gap-10 py-6 md:py-12 lg:grid-cols-2 lg:py-16">
          <div className="flex flex-col gap-6 md:gap-8">
            <h1 className="max-w-xl font-display text-display-md text-content text-balance sm:text-display-lg md:text-display-xl">
              Find your <span className="italic text-primary">perfect</span> space in seconds.
            </h1>

            {/* Inline search bar (tracked for the sticky trigger) */}
            <div ref={searchBarRef} className="flex w-full max-w-2xl items-center gap-2 rounded-card-lg border border-border bg-surface p-2 shadow-card">
              <div className="hidden items-center border-r border-border pl-2 pr-1 md:flex">
                <Icon name="location" className="mr-1 size-5 text-primary" />
                <Select
                  value={division}
                  onChange={(e) => setDivision(e.target.value)}
                  options={[{ value: '', label: 'Anywhere' }, ...divisionOptions]}
                  className="h-auto border-0 bg-transparent px-0 pr-6 font-semibold focus:ring-0"
                  containerClassName="w-36"
                />
              </div>
              <Link
                to="/search"
                state={{ division }}
                className="flex min-w-0 flex-1 items-center gap-2 rounded-control px-2 py-2 text-body text-subtle transition-colors hover:bg-surface-sunken"
              >
                <Icon name="search" className="size-5 shrink-0 text-subtle" />
                <span className="truncate">{t('search_placeholder')}</span>
              </Link>
              <Button onClick={goSearch} leftIcon={<Icon name="filter" />} className="shrink-0">
                <span className="hidden sm:inline">{t('search')}</span>
              </Button>
            </div>
          </div>

          {/* Hero illustration (desktop) */}
          <div className="hidden lg:block">
            <img
              src="/hero-illustration.png"
              alt="Property listings in Bangladesh"
              className="mx-auto w-full max-w-lg"
              loading="eager"
              fetchPriority="high"
            />
          </div>
        </div>

        {/* ── Category chips ── */}
        <Section title="Browse by category" spacing="sm" headingLevel="h2">
          <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-2 no-scrollbar lg:mx-0 lg:flex-wrap lg:px-0">
            {CATEGORIES.map((c) => (
              <Button
                key={c.label}
                size="sm"
                variant={category === c.label ? 'primary' : 'secondary'}
                leftIcon={<Icon name={c.icon} />}
                onClick={() => setCategory(c.label)}
                className="shrink-0"
              >
                {c.label}
              </Button>
            ))}
          </div>
        </Section>

        {/* ── Featured ── */}
        <Section spacing="sm">
          <FeaturedListings category={category} division={division} />
        </Section>
      </Container>
    </div>
  );
}
