import { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { collection, getDocs, query, limit, where, orderBy, startAfter } from 'firebase/firestore';
import { Helmet } from 'react-helmet-async';
import { db } from '../firebase';
import { bdLocations } from '../data/locations';
import useInfiniteScroll from '../hooks/useInfiniteScroll';
import useSavedProperties from '../hooks/useSavedProperties';
import logger from '../utils/logger';
import Container from '../components/layout/Container';
import Grid from '../components/layout/Grid';
import PropertyCard, { PropertyCardSkeleton } from '../components/patterns/PropertyCard';
import {
  Button, IconButton, Input, Select, Field, Badge, Spinner, Icon,
  Card, Drawer, EmptyState, ErrorState,
  Dropdown, DropdownItem, DropdownLabel,
} from '../components/ui';

// ── Constants ───────────────────────────────────────────────────────────────
const BILLING_CYCLES = ['Day', 'Week', 'Month'];
const PROPERTY_TYPES = ['House', 'Apartment', 'Sublet', 'Room', 'Mess', 'Cottage', 'Resort', 'Shop', 'Others'];
const TENANT_TYPES = ['Any', 'Family', 'Bachelor (Male)', 'Bachelor (Female)'];
const UTILITY_OPTIONS = ['Prepaid Gas', 'Line Gas', 'Prepaid Electricity', 'Postpaid Electricity', 'Water (WASA)', 'Deep Tube-well Water', 'Central WiFi', 'Trash Collection', 'Generator/IPS Backup'];
const FEATURE_OPTIONS = ['Lift/Elevator', 'CCTV Security', 'Fire Exit', 'Emergency Stairs', 'Intercom', 'Roof Access', 'Drawing & Dining Separate', 'Geyser Connection', 'Cabinet/Wall Cupboard', 'Balcony', 'Tiled Floor', 'Car Parking', 'Bike Parking'];

const SORTS = [
  { value: 'newest', label: 'Newest' },
  { value: 'price_asc', label: 'Price: Low to High' },
  { value: 'price_desc', label: 'Price: High to Low' },
];

const HISTORY_KEY = 'anylet_search_history';
const MAX_HISTORY = 5;

function loadHistory() {
  try { return JSON.parse(localStorage.getItem(HISTORY_KEY) || '[]'); } catch { return []; }
}
function saveHistory(term, prev) {
  const trimmed = term.trim();
  if (!trimmed) return prev;
  const deduped = [trimmed, ...prev.filter((h) => h.toLowerCase() !== trimmed.toLowerCase())].slice(0, MAX_HISTORY);
  localStorage.setItem(HISTORY_KEY, JSON.stringify(deduped));
  return deduped;
}
const asOptions = (arr) => arr.map((o) => ({ value: o, label: o }));

export default function Search() {
  const navigate = useNavigate();
  const location = useLocation();
  const { toggleSaveProperty, isPropertySaved } = useSavedProperties();

  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [searchHistory, setSearchHistory] = useState(loadHistory);
  const [inputFocused, setInputFocused] = useState(false);
  const [sort, setSort] = useState('newest');

  const commitSearch = (term) => {
    if (!term.trim()) return;
    setSearchHistory((prev) => saveHistory(term, prev));
  };
  const removeHistoryItem = (item) => {
    setSearchHistory((prev) => {
      const next = prev.filter((h) => h !== item);
      localStorage.setItem(HISTORY_KEY, JSON.stringify(next));
      return next;
    });
  };
  const clearHistory = () => { localStorage.removeItem(HISTORY_KEY); setSearchHistory([]); };

  const [filterState, setFilterState] = useState({
    division: location.state?.division || '', district: '', upazila: '',
    type: location.state?.type || '', minPrice: '', maxPrice: '',
    billingCycle: 'Month', tenantType: 'Any', beds: 'Any', baths: 'Any',
    utilities: [], features: [],
  });

  const [displayCount, setDisplayCount] = useState(12);
  const lastDocRef = useRef(null);
  const { sentinelRef } = useInfiniteScroll(() => setDisplayCount((p) => p + 12));

  // Reset visible count when the query changes.
  useEffect(() => { setDisplayCount(12); }, [filterState, searchTerm, sort]);

  useEffect(() => {
    if (location.state && (location.state.division !== undefined || location.state.type !== undefined)) {
      setFilterState((prev) => ({
        ...prev,
        division: location.state.division !== undefined ? location.state.division : prev.division,
        type: location.state.type !== undefined ? location.state.type : prev.type,
        district: '', upazila: '',
      }));
      navigate(location.pathname, { replace: true, state: {} });
    }
  }, [location.state, navigate, location.pathname]);

  const resetFilters = () => {
    setFilterState({
      division: '', district: '', upazila: '', type: '', minPrice: '', maxPrice: '',
      billingCycle: 'Month', tenantType: 'Any', beds: 'Any', baths: 'Any', utilities: [], features: [],
    });
    setSearchTerm('');
  };

  const buildServerQuery = useCallback((filters) => {
    const constraints = [where('isApproved', '==', true), orderBy('updatedAt', 'desc')];
    if (filters.district) constraints.push(where('district', '==', filters.district));
    else if (filters.division) constraints.push(where('division', '==', filters.division));
    if (filters.type) constraints.push(where('type', '==', filters.type));
    if (filters.upazila) constraints.push(where('upazila', '==', filters.upazila));
    constraints.push(limit(60));
    return constraints;
  }, []);

  const fetchProperties = useCallback(async () => {
    try {
      setLoading(true);
      setError(false);
      lastDocRef.current = null;
      const constraints = buildServerQuery(filterState);
      if (lastDocRef.current) constraints.splice(-1, 0, startAfter(lastDocRef.current));
      const q = query(collection(db, 'properties'), ...constraints);
      const snap = await getDocs(q);
      const docs = snap.docs;
      lastDocRef.current = docs[docs.length - 1] || null;
      setProperties(docs.map((d) => ({ id: d.id, ...d.data() })));
    } catch (err) {
      logger.error('Error fetching properties:', err);
      setError(true);
    } finally {
      setLoading(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filterState.division, filterState.district, filterState.upazila, filterState.type, buildServerQuery]);

  useEffect(() => { fetchProperties(); }, [fetchProperties]);

  const filteredProperties = useMemo(() => {
    const yearAgo = new Date();
    yearAgo.setDate(yearAgo.getDate() - 365);
    const list = properties.filter((p) => {
      const propDate = p.updatedAt?.toDate() || p.createdAt?.toDate() || new Date(0);
      if (propDate < yearAgo) return false;
      if (filterState.division && p.division !== filterState.division) return false;
      if (filterState.district && p.district !== filterState.district) return false;
      if (filterState.upazila && p.upazila !== filterState.upazila) return false;
      if (filterState.type && p.type !== filterState.type) return false;
      if (filterState.minPrice && p.rent < Number(filterState.minPrice)) return false;
      if (filterState.maxPrice && p.rent > Number(filterState.maxPrice)) return false;
      if (filterState.billingCycle && p.billingCycle !== filterState.billingCycle) return false;
      if (filterState.tenantType !== 'Any' && p.tenantType !== filterState.tenantType) return false;
      if (filterState.beds !== 'Any' && Number(p.beds) !== Number(filterState.beds)) return false;
      if (filterState.baths !== 'Any' && Number(p.baths) !== Number(filterState.baths)) return false;
      if (filterState.utilities.length > 0 && !filterState.utilities.every((u) => p.utilities?.includes(u))) return false;
      if (filterState.features.length > 0 && !filterState.features.every((f) => p.features?.includes(f))) return false;
      if (searchTerm) {
        const term = searchTerm.toLowerCase();
        const match = p.title?.toLowerCase().includes(term) || p.addressDetails?.toLowerCase().includes(term)
          || p.upazila?.toLowerCase().includes(term) || p.district?.toLowerCase().includes(term);
        if (!match) return false;
      }
      return true;
    });
    if (sort === 'price_asc') list.sort((a, b) => (a.rent || 0) - (b.rent || 0));
    else if (sort === 'price_desc') list.sort((a, b) => (b.rent || 0) - (a.rent || 0));
    return list;
  }, [properties, filterState, searchTerm, sort]);

  const districts = useMemo(() => (filterState.division ? Object.keys(bdLocations[filterState.division] || {}) : []), [filterState.division]);
  const thanas = useMemo(() => ((filterState.division && filterState.district) ? bdLocations[filterState.division][filterState.district] || [] : []), [filterState.division, filterState.district]);

  const toggleList = (key, val) => setFilterState((prev) => {
    const list = prev[key];
    return { ...prev, [key]: list.includes(val) ? list.filter((i) => i !== val) : [...list, val] };
  });

  const activeSort = SORTS.find((s) => s.value === sort) || SORTS[0];

  const filters = (
    <FilterContent
      filterState={filterState} setFilterState={setFilterState}
      districts={districts} thanas={thanas} toggleList={toggleList}
    />
  );

  return (
    <div className="min-h-screen bg-bg pt-[calc(3.75rem+env(safe-area-inset-top))] md:pt-8">
      <Helmet>
        <title>Search Properties | Any-Let</title>
        <meta name="description" content="Search thousands of verified apartments, flats, and commercial properties for rent across Bangladesh." />
      </Helmet>

      <Container size="wide" className="flex flex-col gap-8 pb-16 md:flex-row md:gap-10">
        {/* Desktop sidebar */}
        <aside className="hidden w-72 shrink-0 md:block">
          <div className="sticky top-24">
            <Card padding="lg" className="max-h-[calc(100vh-8rem)] overflow-y-auto no-scrollbar">
              <div className="mb-6 flex items-center justify-between">
                <h2 className="text-title-md text-content">Filters</h2>
                <Button variant="ghost" size="sm" onClick={resetFilters}>Reset</Button>
              </div>
              {filters}
            </Card>
          </div>
        </aside>

        {/* Results */}
        <main className="flex min-w-0 flex-1 flex-col gap-5">
          {/* Search row */}
          <div className="relative">
            <div className="flex items-center gap-2">
              <div className="relative flex-1">
                <Input
                  size="lg"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  onFocus={() => setInputFocused(true)}
                  onBlur={() => setTimeout(() => setInputFocused(false), 150)}
                  onKeyDown={(e) => { if (e.key === 'Enter') commitSearch(searchTerm); }}
                  placeholder="Search by title, area or details…"
                  leftIcon={<Icon name="search" />}
                  className={searchTerm ? 'pr-11' : undefined}
                />
                {searchTerm && (
                  <IconButton label="Clear search" size="sm" variant="ghost" onClick={() => setSearchTerm('')}
                    className="absolute right-1.5 top-1/2 -translate-y-1/2"><Icon name="close" /></IconButton>
                )}
              </div>
              <Button className="md:hidden" variant="secondary" size="lg" iconOnly
                onClick={() => { commitSearch(searchTerm); setShowFilters(true); }} aria-label="Filters">
                <Icon name="filter" />
              </Button>
            </div>

            {/* Recent searches */}
            {inputFocused && searchHistory.length > 0 && (
              <div className="absolute inset-x-0 top-full z-20 mt-2">
                <Card variant="raised" padding="sm">
                  <div className="mb-2 flex items-center justify-between px-1">
                    <span className="flex items-center gap-1.5 text-overline uppercase text-subtle"><Icon name="time" className="size-3.5" /> Recent</span>
                    <Button variant="ghost" size="sm" className="h-7 px-2 text-danger hover:bg-danger-subtle" onMouseDown={(e) => { e.preventDefault(); clearHistory(); }}>Clear all</Button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {searchHistory.map((item) => (
                      <span key={item} className="inline-flex items-center rounded-pill bg-surface-sunken pr-1">
                        <Button variant="ghost" size="sm" className="h-8 rounded-pill px-3 hover:bg-transparent hover:text-primary"
                          onMouseDown={(e) => { e.preventDefault(); setSearchTerm(item); commitSearch(item); }}>{item}</Button>
                        <IconButton label={`Remove ${item}`} size="sm" variant="ghost" className="size-6" onMouseDown={(e) => { e.preventDefault(); removeHistoryItem(item); }}><Icon name="close" className="size-3.5" /></IconButton>
                      </span>
                    ))}
                  </div>
                </Card>
              </div>
            )}
          </div>

          {/* Count + sort */}
          <div className="flex items-center justify-between gap-3">
            <p className="text-body-sm text-muted">
              {loading ? 'Searching…' : <><span className="font-semibold text-content">{filteredProperties.length}</span> {filteredProperties.length === 1 ? 'property' : 'properties'}</>}
            </p>
            <Dropdown align="end" trigger={
              <Button variant="outline" size="sm" rightIcon={<Icon name="chevronDown" />}>
                <span className="text-muted">Sort:</span>&nbsp;{activeSort.label}
              </Button>
            }>
              <DropdownLabel>Sort by</DropdownLabel>
              {SORTS.map((s) => (
                <DropdownItem key={s.value} onSelect={() => setSort(s.value)}
                  trailing={sort === s.value ? <Icon name="check" className="size-4 text-primary" /> : null}>
                  {s.label}
                </DropdownItem>
              ))}
            </Dropdown>
          </div>

          {/* Results / states */}
          {loading ? (
            <Grid cols={2} gap="md">{Array.from({ length: 6 }).map((_, i) => <PropertyCardSkeleton key={i} />)}</Grid>
          ) : error ? (
            <ErrorState title="Couldn’t load properties" description="Check your connection and try again." onRetry={fetchProperties} />
          ) : filteredProperties.length === 0 ? (
            <EmptyState
              icon={<Icon name="search" />}
              title="No properties found"
              description="Try broadening your filters or location."
              action={<Button onClick={resetFilters}>Clear all filters</Button>}
            />
          ) : (
            <>
              <Grid cols={2} gap="md">
                {filteredProperties.slice(0, displayCount).map((p) => (
                  <PropertyCard key={p.id} property={p} saved={isPropertySaved(p.id)} onToggleSave={toggleSaveProperty} />
                ))}
              </Grid>
              {filteredProperties.length > displayCount && (
                <div ref={sentinelRef} className="mt-4 flex h-12 items-center justify-center"><Spinner className="text-primary" /></div>
              )}
            </>
          )}
        </main>
      </Container>

      {/* Mobile filters */}
      <Drawer open={showFilters} onClose={() => setShowFilters(false)} side="bottom" title="Filters"
        description={`${filteredProperties.length} matching`}>
        {filters}
        <div className="sticky bottom-0 -mx-6 mt-6 border-t border-border bg-surface px-6 pt-4">
          <div className="flex gap-3">
            <Button variant="secondary" onClick={resetFilters}>Reset</Button>
            <Button fullWidth onClick={() => setShowFilters(false)}>Show {filteredProperties.length} results</Button>
          </div>
        </div>
      </Drawer>
    </div>
  );
}

// ── Filter panel ──────────────────────────────────────────────────────────────
function FilterContent({ filterState, setFilterState, districts, thanas, toggleList }) {
  return (
    <div className="space-y-8">
      <section className="space-y-3">
        <h3 className="text-overline uppercase text-subtle">Location</h3>
        <Field label="Division">
          <Select value={filterState.division} placeholder="Any division"
            onChange={(e) => setFilterState((p) => ({ ...p, division: e.target.value, district: '', upazila: '' }))}
            options={asOptions(Object.keys(bdLocations))} />
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="District">
            <Select value={filterState.district} placeholder="Any" disabled={!filterState.division}
              onChange={(e) => setFilterState((p) => ({ ...p, district: e.target.value, upazila: '' }))}
              options={asOptions(districts)} />
          </Field>
          <Field label="Upazila">
            <Select value={filterState.upazila} placeholder="Any" disabled={!filterState.district}
              onChange={(e) => setFilterState((p) => ({ ...p, upazila: e.target.value }))}
              options={asOptions(thanas)} />
          </Field>
        </div>
      </section>

      <section className="space-y-3">
        <h3 className="text-overline uppercase text-subtle">Property type</h3>
        <div className="flex flex-wrap gap-2">
          {PROPERTY_TYPES.map((type) => (
            <ChipToggle key={type} label={type} active={filterState.type === type}
              onClick={() => setFilterState((p) => ({ ...p, type: p.type === type ? '' : type }))} />
          ))}
        </div>
      </section>

      <section className="space-y-3">
        <h3 className="text-overline uppercase text-subtle">Price range (৳)</h3>
        <div className="grid grid-cols-2 gap-3">
          <Input type="number" inputMode="numeric" placeholder="Min" value={filterState.minPrice}
            onChange={(e) => setFilterState((p) => ({ ...p, minPrice: e.target.value }))}
            leftIcon={<span className="text-body-sm text-subtle">৳</span>} />
          <Input type="number" inputMode="numeric" placeholder="Max" value={filterState.maxPrice}
            onChange={(e) => setFilterState((p) => ({ ...p, maxPrice: e.target.value }))}
            leftIcon={<span className="text-body-sm text-subtle">৳</span>} />
        </div>
      </section>

      <section className="space-y-3">
        <h3 className="text-overline uppercase text-subtle">Rooms</h3>
        <Counter label="Bedrooms" value={filterState.beds} onChange={(v) => setFilterState((p) => ({ ...p, beds: v }))} />
        <Counter label="Bathrooms" value={filterState.baths} onChange={(v) => setFilterState((p) => ({ ...p, baths: v }))} />
      </section>

      <section className="space-y-3">
        <h3 className="text-overline uppercase text-subtle">Amenities</h3>
        <div className="flex flex-wrap gap-2">
          {UTILITY_OPTIONS.map((u) => (
            <ChipToggle key={u} label={u} active={filterState.utilities.includes(u)} onClick={() => toggleList('utilities', u)} />
          ))}
        </div>
      </section>

      <section className="space-y-3">
        <h3 className="text-overline uppercase text-subtle">Features</h3>
        <div className="flex flex-wrap gap-2">
          {FEATURE_OPTIONS.map((f) => (
            <ChipToggle key={f} label={f} active={filterState.features.includes(f)} onClick={() => toggleList('features', f)} />
          ))}
        </div>
      </section>
    </div>
  );
}

function ChipToggle({ label, active, onClick }) {
  return (
    <Button size="sm" variant={active ? 'primary' : 'secondary'} onClick={onClick}
      leftIcon={active ? <Icon name="check" /> : undefined}>
      {label}
    </Button>
  );
}

function Counter({ label, value, onChange }) {
  const num = value === 'Any' ? 0 : Number(value);
  const dec = () => onChange(num <= 1 ? 'Any' : String(num - 1));
  const inc = () => onChange(value === 'Any' ? '1' : String(num + 1));
  return (
    <div className="flex items-center justify-between rounded-card bg-surface-sunken px-4 py-2.5">
      <span className="text-body-sm text-content">{label}</span>
      <div className="flex items-center gap-3">
        <IconButton label={`Decrease ${label}`} size="sm" variant="surface" onClick={dec} disabled={value === 'Any'}><Icon name="minus" /></IconButton>
        <span className="w-8 text-center text-body-sm font-semibold text-content">{value}</span>
        <IconButton label={`Increase ${label}`} size="sm" variant="primary" onClick={inc}><Icon name="add" /></IconButton>
      </div>
    </div>
  );
}
