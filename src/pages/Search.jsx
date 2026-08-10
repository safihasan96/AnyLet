import { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { collection, getDocs, query, limit, where, startAfter } from 'firebase/firestore';
import { db } from '../firebase';
import { 
  Search as SearchIcon, 
  X, 
  SlidersHorizontal, 
  ArrowLeft, 
  RotateCcw, 
  ChevronDown, 
  Minus, 
  Plus, 
  Check,
  Building2,
  MapPin,
  Zap,
  Bed,
  DoorOpen,
  Clock
} from 'lucide-react';
import { motion, AnimatePresence, useSpring, useMotionValue } from 'framer-motion';

// ── Variants (all decoupled from JSX) ──────────────────────────────────────
const sidebarVariants = {
    hidden: { opacity: 0, x: -32 },
    visible: { opacity: 1, x: 0, transition: { type: 'spring', stiffness: 80, damping: 18, delay: 0.1 } },
};

const historyChipVariants = {
    hidden: { opacity: 0, scale: 0.75 },
    visible: (i) => ({
        opacity: 1,
        scale: 1,
        transition: { type: 'spring', stiffness: 200, damping: 18, delay: i * 0.05 },
    }),
    exit: { opacity: 0, scale: 0.75, transition: { duration: 0.15 } },
};

const resultCountVariants = {
    initial: { opacity: 0, y: -6 },
    animate: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 200, damping: 20 } },
};
import HorizontalPropertyCard from '../components/HorizontalPropertyCard';
import { PropertyCardSkeleton } from '../components/Skeleton';
import { bdLocations } from '../data/locations';
import { Helmet } from 'react-helmet-async';
import useInfiniteScroll from '../hooks/useInfiniteScroll';
import logger from '../utils/logger';
import { staggerContainer, staggerItem, modalBackdrop, modalSheet } from '../utils/motionVariants';
import { useAnimationSafe } from '../hooks/useAnimationSafe';
import { useIsDesktop } from '../hooks/useMediaQuery';

// Constants
const BILLING_CYCLES = ["Day", "Week", "Month"];
const PROPERTY_TYPES = ["House", "Apartment", "Sublet", "Room", "Mess", "Cottage", "Resort", "Shop", "Others"];
const TENANT_TYPES = ["Any", "Family", "Bachelor (Male)", "Bachelor (Female)"];
const UTILITY_OPTIONS = ["Prepaid Gas", "Line Gas", "Prepaid Electricity", "Postpaid Electricity", "Water (WASA)", "Deep Tube-well Water", "Central WiFi", "Trash Collection", "Generator/IPS Backup"];
const FEATURE_OPTIONS = ["Lift/Elevator", "CCTV Security", "Fire Exit", "Emergency Stairs", "Intercom", "Roof Access", "Drawing & Dining Separate", "Geyser Connection", "Cabinet/Wall Cupboard", "Balcony", "Tiled Floor", "Car Parking", "Bike Parking"];

const HISTORY_KEY = 'anylet_search_history';
const MAX_HISTORY  = 5;

function loadHistory() {
    try { return JSON.parse(localStorage.getItem(HISTORY_KEY) || '[]'); }
    catch { return []; }
}

function saveHistory(term, prev) {
    const trimmed = term.trim();
    if (!trimmed) return prev;
    const deduped = [trimmed, ...prev.filter(h => h.toLowerCase() !== trimmed.toLowerCase())].slice(0, MAX_HISTORY);
    localStorage.setItem(HISTORY_KEY, JSON.stringify(deduped));
    return deduped;
}

export default function Search() {
    const navigate = useNavigate();
    const location = useLocation();
    const [properties, setProperties] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showFilters, setShowFilters] = useState(false);
    const [searchTerm, setSearchTerm] = useState(location.state?.searchTerm || '');
    const [searchHistory, setSearchHistory] = useState(loadHistory);
    const [inputFocused, setInputFocused] = useState(false);
    const isDesktop = useIsDesktop();
    const shouldAnimate = useAnimationSafe();

    // Save a term to history (called on Enter or when input blurs with a value)
    const commitSearch = (term) => {
        if (!term.trim()) return;
        setSearchHistory(prev => saveHistory(term, prev));
    };

    const removeHistoryItem = (item) => {
        setSearchHistory(prev => {
            const next = prev.filter(h => h !== item);
            localStorage.setItem(HISTORY_KEY, JSON.stringify(next));
            return next;
        });
    };

    const clearHistory = () => {
        localStorage.removeItem(HISTORY_KEY);
        setSearchHistory([]);
    };

    const [filterState, setFilterState] = useState({
        division: location.state?.division || '', district: '', upazila: '',
        type: location.state?.type || '', minPrice: '', maxPrice: '',
        billingCycle: 'Month', tenantType: 'Any',
        beds: 'Any', baths: 'Any',
        utilities: [], features: []
    });
    
    const [displayCount, setDisplayCount] = useState(12);
    const lastDocRef = useRef(null);   // Cursor for Firestore pagination
    const [hasMore, setHasMore] = useState(true);

    const { sentinelRef } = useInfiniteScroll(() => {
        setDisplayCount(prev => prev + 12);
    });

    useEffect(() => {
        setDisplayCount(12);
    }, [filterState, searchTerm]);

    useEffect(() => {
        if (location.state && (location.state.division !== undefined || location.state.type !== undefined)) {
            setFilterState(prev => ({
                ...prev,
                division: location.state.division !== undefined ? location.state.division : prev.division,
                type: location.state.type !== undefined ? location.state.type : prev.type,
                district: '',
                upazila: ''
            }));
            navigate(location.pathname, { replace: true, state: {} });
        }
    }, [location.state, navigate, location.pathname]);

    const resetFilters = () => {
        setFilterState({
            division: '', district: '', upazila: '',
            type: '', minPrice: '', maxPrice: '',
            billingCycle: 'Month', tenantType: 'Any',
            beds: 'Any', baths: 'Any',
            utilities: [], features: []
        });
        setSearchTerm('');
    };

    const buildServerQuery = useCallback((filters) => {
        // Equality-only server filters. Firestore serves multiple `==` filters
        // from single-field indexes (no composite index needed). We deliberately
        // do NOT add a server-side orderBy: pairing orderBy('updatedAt') with the
        // equality filters requires composite indexes AND silently drops any doc
        // that lacks an `updatedAt` field. Results are sorted client-side instead
        // (see filteredProperties), mirroring the home page (FeaturedListings).
        const constraints = [
            where('isApproved', '==', true),
        ];
        // Only add where() clauses for filters that are actively set
        if (filters.district) constraints.push(where('district', '==', filters.district));
        else if (filters.division) constraints.push(where('division', '==', filters.division));
        if (filters.type) constraints.push(where('type', '==', filters.type));
        if (filters.upazila) constraints.push(where('upazila', '==', filters.upazila));
        constraints.push(limit(200)); // Fetch the full approved set, then sort/paginate client-side
        return constraints;
    }, []);

    useEffect(() => {
        const fetchProperties = async () => {
            try {
                setLoading(true);
                lastDocRef.current = null;
                setHasMore(true);
                // Build a server-side filtered query to minimise data transfer.
                // CRITICAL: `where('isApproved', '==', true)` must always be present;
                // Firestore security rules reject reads where isApproved != true.
                const constraints = buildServerQuery(filterState);
                if (lastDocRef.current) constraints.splice(-1, 0, startAfter(lastDocRef.current));
                const q = query(collection(db, 'properties'), ...constraints);
                const querySnapshot = await getDocs(q);
                const docs = querySnapshot.docs;
                lastDocRef.current = docs[docs.length - 1] || null;
                if (docs.length < 60) setHasMore(false);
                const allListings = docs.map(d => ({ id: d.id, ...d.data() }));
                setProperties(allListings);
            } catch (error) {
                logger.error('Error fetching properties:', error);
            } finally {
                setLoading(false);
            }
        };
        fetchProperties();
    // Re-fetch whenever the server-filterable fields change
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [filterState.division, filterState.district, filterState.upazila, filterState.type, buildServerQuery]);

    const filteredProperties = useMemo(() => {
        const yearAgo = new Date();
        yearAgo.setDate(yearAgo.getDate() - 365);
        
        return properties.filter(p => {
            // isApproved is already guaranteed by the Firestore query

            const propDate = p.updatedAt?.toDate() || p.createdAt?.toDate() || null;
            // Only exclude listings that are demonstrably older than a year.
            // Listings with no timestamp at all are kept (were previously dropped).
            if (propDate && propDate < yearAgo) return false;

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
            if (filterState.utilities.length > 0 && !filterState.utilities.every(u => p.utilities?.includes(u))) return false;
            if (filterState.features.length > 0 && !filterState.features.every(f => p.features?.includes(f))) return false;
            
            if (searchTerm) {
                const term = searchTerm.toLowerCase();
                const matchesSearch = p.title?.toLowerCase().includes(term) || 
                                     p.addressDetails?.toLowerCase().includes(term) ||
                                     p.upazila?.toLowerCase().includes(term) ||
                                     p.district?.toLowerCase().includes(term);
                if (!matchesSearch) return false;
            }
            return true;
        }).sort((a, b) => {
            // Newest first — mirrors the home page ordering (updatedAt, then createdAt).
            const da = a.updatedAt?.toDate() || a.createdAt?.toDate() || new Date(0);
            const dbb = b.updatedAt?.toDate() || b.createdAt?.toDate() || new Date(0);
            return dbb - da;
        });
    }, [properties, filterState, searchTerm]);

    const districts = useMemo(() => filterState.division ? Object.keys(bdLocations[filterState.division] || {}) : [], [filterState.division]);
    const thanas = useMemo(() => (filterState.division && filterState.district) ? bdLocations[filterState.division][filterState.district] || [] : [], [filterState.division, filterState.district]);

    const toggleList = (key, val) => {
        setFilterState(prev => {
            const list = prev[key];
            const newList = list.includes(val) ? list.filter(i => i !== val) : [...list, val];
            return { ...prev, [key]: newList };
        });
    };

    return (
        <div className="flex flex-col min-h-screen bg-[#F8F9FA] dark:bg-[#0F1117]">
            <Helmet>
                <title>Search Properties | Any-Let</title>
                <meta name="description" content="Search thousands of verified apartments, flats, and commercial properties for rent across Bangladesh." />
            </Helmet>
            <div className="flex-1 max-w-7xl mx-auto w-full flex flex-col md:flex-row gap-8 px-4 md:px-6 pt-[calc(3.75rem+env(safe-area-inset-top))] pb-8 md:pt-8 lg:max-w-[1400px] lg:gap-10 lg:px-10">
                
                {/* Desktop Sidebar */}
                <motion.div
                    variants={shouldAnimate && isDesktop ? sidebarVariants : {}}
                    initial="hidden"
                    animate="visible"
                    className="hidden md:block w-80 shrink-0 lg:w-[280px]"
                >
                    <aside className="sticky top-28 self-start h-[calc(100vh-140px)] overflow-y-auto no-scrollbar pb-10">
                        <div className="bg-white dark:bg-[#1A1D24] rounded-[32px] border border-slate-100 dark:border-white/[0.06] p-8 shadow-sm">
                            <div className="flex items-center justify-between mb-8">
                                <h2 className="text-xl font-black text-slate-900 dark:text-white">Filters</h2>
                                <button onClick={resetFilters} className="text-primary dark:text-indigo-400 text-sm font-black hover:underline underline-offset-4">Reset</button>
                            </div>
                            <FilterContent 
                                filterState={filterState} setFilterState={setFilterState}
                                districts={districts} thanas={thanas}
                                PROPERTY_TYPES={PROPERTY_TYPES} BILLING_CYCLES={BILLING_CYCLES} TENANT_TYPES={TENANT_TYPES}
                                UTILITY_OPTIONS={UTILITY_OPTIONS} FEATURE_OPTIONS={FEATURE_OPTIONS}
                                toggleList={toggleList}
                            />
                        </div>
                    </aside>
                </motion.div>

                {/* Main Results */}
                <main className="flex-1 flex flex-col gap-6">
                    <div className="flex flex-col gap-4">
                        <div className="flex items-center gap-4">
                            {/* Mobile back button removed in favor of MobileNavBar */}
                            <div className="relative flex-1 group">
                                <div className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-primary dark:text-indigo-400 transition-colors pointer-events-none">
                                    <SearchIcon size={22} strokeWidth={2.5} />
                                </div>
                                <input
                                    type="text"
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    onFocus={() => setInputFocused(true)}
                                    onBlur={() => setTimeout(() => setInputFocused(false), 150)}
                                    onKeyDown={(e) => { if (e.key === 'Enter') commitSearch(searchTerm); }}
                                    placeholder="Search by title, area or details..."
                                    className="w-full bg-white dark:bg-[#1A1D24] border-2 border-transparent focus:border-primary/20 dark:focus:border-indigo-500/30 rounded-3xl py-4 pl-14 pr-14 font-bold text-slate-900 dark:text-white shadow-sm outline-none transition-all h-16 md:h-20"
                                />
                                {searchTerm && (
                                    <button
                                        onClick={() => setSearchTerm('')}
                                        className="absolute right-16 md:right-5 top-1/2 -translate-y-1/2 size-7 rounded-full bg-slate-100 dark:bg-slate-700 text-slate-500 flex items-center justify-center hover:bg-slate-200 transition-colors"
                                    >
                                        <X size={14} />
                                    </button>
                                )}
                                <button
                                    onClick={() => { commitSearch(searchTerm); setShowFilters(true); }}
                                    className="md:hidden absolute right-3 top-1/2 -translate-y-1/2 size-12 rounded-2xl bg-primary text-white flex items-center justify-center shadow-lg shadow-primary/20"
                                >
                                    <SlidersHorizontal size={22} />
                                </button>
                            </div>
                        </div>

                        {/* Search History */}
                        <AnimatePresence>
                            {inputFocused && searchHistory.length > 0 && (
                                <motion.div
                                    initial={{ opacity: 0, y: -6 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -6 }}
                                    transition={{ duration: 0.15 }}
                                    className="bg-white dark:bg-[#1A1D24] rounded-3xl shadow-xl border border-slate-100 dark:border-white/[0.06] px-5 py-4"
                                >
                                    <div className="flex items-center justify-between mb-3">
                                        <div className="flex items-center gap-2 text-slate-400">
                                            <Clock size={13} />
                                            <span className="text-[10px] font-black uppercase tracking-widest">Recent Searches</span>
                                        </div>
                                        <button
                                            onClick={clearHistory}
                                            className="text-[10px] font-black text-rose-400 hover:text-rose-500 uppercase tracking-widest transition-colors"
                                        >
                                            Clear all
                                        </button>
                                    </div>
                                    <div className="flex flex-wrap gap-2">
                                        <AnimatePresence>
                                            {searchHistory.map((item, i) => (
                                                <motion.div
                                                    key={item}
                                                    custom={i}
                                                    variants={historyChipVariants}
                                                    initial="hidden"
                                                    animate="visible"
                                                    exit="exit"
                                                    className="flex items-center gap-1.5 bg-slate-50 dark:bg-[#222630] border border-slate-200 dark:border-white/[0.04] rounded-2xl pl-3.5 pr-2 py-2 group"
                                                >
                                                    <button
                                                        className="text-xs font-bold text-slate-700 dark:text-slate-300 hover:text-primary dark:text-indigo-400 transition-colors"
                                                        onClick={() => { setSearchTerm(item); commitSearch(item); }}
                                                    >
                                                        {item}
                                                    </button>
                                                    <motion.button
                                                        whileHover={{ scale: 1.2 }} whileTap={{ scale: 0.8 }}
                                                        onClick={() => removeHistoryItem(item)}
                                                        className="size-4 rounded-full bg-slate-200 dark:bg-white/[0.06] text-slate-400 hover:bg-rose-100 hover:text-rose-500 dark:hover:bg-rose-900/40 dark:hover:text-rose-400 flex items-center justify-center transition-colors shrink-0"
                                                    >
                                                        <X size={9} strokeWidth={3} />
                                                    </motion.button>
                                                </motion.div>
                                            ))}
                                        </AnimatePresence>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>

                        <div className="flex items-center justify-between px-2">
                            <motion.h2
                                key={filteredProperties.length}
                                variants={resultCountVariants}
                                initial="initial"
                                animate="animate"
                                className="text-[12px] font-black text-slate-400 uppercase tracking-[0.2em]"
                            >
                                Found {filteredProperties.length} Properties
                            </motion.h2>
                        </div>
                    </div>

                    {loading ? (
                        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-2 gap-6">
                            {[1, 2, 3, 4].map(n => <PropertyCardSkeleton key={n} />)}
                        </div>
                    ) : (
                        <motion.div layout className="flex flex-col gap-6 pb-24 md:pb-10">
                            <AnimatePresence mode="popLayout">
                                {filteredProperties.length > 0 ? (
                                    <motion.div variants={staggerContainer} initial="hidden" animate="visible" className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                        {filteredProperties.slice(0, displayCount).map((p) => (
                                            <motion.div key={p.id} variants={staggerItem} exit="exit" className="h-full">
                                                <HorizontalPropertyCard property={p} />
                                            </motion.div>
                                        ))}
                                    </motion.div>
                                ) : (
                                    <div className="col-span-full py-20 text-center flex flex-col items-center gap-6">
                                        <div className="size-24 rounded-full bg-slate-100 dark:bg-[#1A1D24] flex items-center justify-center text-slate-300 dark:text-slate-600"><SearchIcon size={48} /></div>
                                        <div>
                                            <h3 className="text-xl font-black text-slate-900 dark:text-white">No properties found</h3>
                                            <p className="text-slate-500 font-medium">Try broadening your filters or location</p>
                                        </div>
                                        <button onClick={resetFilters} className="bg-primary text-white px-8 py-3 rounded-2xl font-black shadow-lg shadow-primary/20">Clear All Filters</button>
                                    </div>
                                )}
                            </AnimatePresence>
                            
                            {filteredProperties.length > displayCount && (
                                <div ref={sentinelRef} className="h-12 flex items-center justify-center mt-4">
                                    <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
                                </div>
                            )}
                        </motion.div>
                    )}
                </main>
            </div>

            {/* Mobile Filters Drawer */}
            <AnimatePresence>
                {showFilters && (
                    <div className="md:hidden fixed inset-0 z-[100] flex flex-col justify-end">
                        <motion.div variants={modalBackdrop} initial="hidden" animate="visible" exit="exit" onClick={() => setShowFilters(false)} className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" />
                        <motion.div variants={modalSheet} initial="hidden" animate="visible" exit="exit" className="bg-white dark:bg-[#1A1D24] w-full h-[90vh] rounded-t-[40px] flex flex-col shadow-2xl relative z-10 overflow-hidden">
                            <div className="w-12 h-1.5 bg-slate-200 dark:bg-white/[0.06] rounded-full mx-auto my-4 shrink-0" />
                            <header className="flex items-center justify-between px-8 pb-4 shrink-0">
                                <h2 className="text-2xl font-black text-slate-900 dark:text-white">Filters</h2>
                                <button onClick={resetFilters} className="text-primary dark:text-indigo-400 font-black">Reset</button>
                            </header>
                            <div className="flex-1 overflow-y-auto px-8 pb-32">
                                <FilterContent 
                                    filterState={filterState} setFilterState={setFilterState}
                                    districts={districts} thanas={thanas}
                                    PROPERTY_TYPES={PROPERTY_TYPES} BILLING_CYCLES={BILLING_CYCLES} TENANT_TYPES={TENANT_TYPES}
                                    UTILITY_OPTIONS={UTILITY_OPTIONS} FEATURE_OPTIONS={FEATURE_OPTIONS}
                                    toggleList={toggleList}
                                />
                            </div>
                            <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-white dark:from-[#1A1D24] pt-20">
                                <button onClick={() => setShowFilters(false)} className="w-full bg-primary text-white font-black text-lg py-5 rounded-[28px] shadow-2xl shadow-primary/30">Show {filteredProperties.length} Results</button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
}

function FilterContent({ filterState, setFilterState, districts, thanas, PROPERTY_TYPES, BILLING_CYCLES, TENANT_TYPES, UTILITY_OPTIONS, FEATURE_OPTIONS, toggleList }) {
    return (
        <div className="space-y-10">
            <section>
                <div className="flex items-center gap-2 mb-4 text-primary dark:text-indigo-400"><RotateCcw size={16} /><h3 className="text-[15px] font-black uppercase tracking-wider">Location Setup</h3></div>
                <div className="space-y-4">
                    <Select label="Division" value={filterState.division} onChange={(e) => setFilterState(prev => ({ ...prev, division: e.target.value, district: '', upazila: '' }))} options={Object.keys(bdLocations)} />
                    <div className="grid grid-cols-2 gap-4">
                        <Select label="District" value={filterState.district} onChange={(e) => setFilterState(prev => ({ ...prev, district: e.target.value, upazila: '' }))} options={districts} disabled={!filterState.division} />
                        <Select label="Upazila" value={filterState.upazila} onChange={(e) => setFilterState(prev => ({ ...prev, upazila: e.target.value }))} options={thanas} disabled={!filterState.district} />
                    </div>
                </div>
            </section>

            <section>
                <h3 className="text-sm font-black text-slate-400 uppercase tracking-widest mb-4">Property Type</h3>
                <div className="flex flex-wrap gap-2">
                    {PROPERTY_TYPES.map(type => (
                        <ToggleButton key={type} label={type} active={filterState.type === type} onClick={() => setFilterState(prev => ({ ...prev, type: prev.type === type ? '' : type }))} />
                    ))}
                </div>
            </section>

            <section>
                <h3 className="text-sm font-black text-slate-400 uppercase tracking-widest mb-4">Price Range</h3>
                <div className="flex items-center gap-4">
                    <div className="relative flex-1">
                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold">৳</span>
                        <input type="number" placeholder="Min" value={filterState.minPrice} onChange={(e) => setFilterState(prev => ({ ...prev, minPrice: e.target.value }))} className="w-full bg-slate-50 dark:bg-[#222630] border-2 border-transparent focus:border-primary/20 dark:focus:border-indigo-500/30 rounded-2xl py-3 pl-8 pr-4 font-bold outline-none text-slate-900 dark:text-white" />
                    </div>
                    <div className="relative flex-1">
                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold">৳</span>
                        <input type="number" placeholder="Max" value={filterState.maxPrice} onChange={(e) => setFilterState(prev => ({ ...prev, maxPrice: e.target.value }))} className="w-full bg-slate-50 dark:bg-[#222630] border-2 border-transparent focus:border-primary/20 dark:focus:border-indigo-500/30 rounded-2xl py-3 pl-8 pr-4 font-bold outline-none text-slate-900 dark:text-white" />
                    </div>
                </div>
            </section>

            <section>
                <h3 className="text-sm font-black text-slate-400 uppercase tracking-widest mb-4">Specifications</h3>
                <div className="space-y-4">
                    <Counter label="Bedrooms" value={filterState.beds} onChange={(val) => setFilterState(prev => ({ ...prev, beds: val }))} />
                    <Counter label="Bathrooms" value={filterState.baths} onChange={(val) => setFilterState(prev => ({ ...prev, baths: val }))} />
                </div>
            </section>

            <section>
                <h3 className="text-sm font-black text-slate-400 uppercase tracking-widest mb-4">Amenities</h3>
                <div className="flex flex-wrap gap-2">
                    {UTILITY_OPTIONS.map(u => (
                        <button key={u} onClick={() => toggleList('utilities', u)} className={`py-2 px-4 rounded-xl text-xs font-bold border-2 transition-all flex items-center gap-2 ${filterState.utilities.includes(u) ? 'bg-primary/10 border-primary text-primary dark:text-indigo-400' : 'bg-slate-50 dark:bg-[#222630] border-transparent text-slate-500'}`}>
                            {filterState.utilities.includes(u) && <Check size={12} strokeWidth={4} />}{u}
                        </button>
                    ))}
                </div>
            </section>
        </div>
    );
}

function Select({ label, value, onChange, options, disabled }) {
    return (
        <div className="space-y-1">
            <label className="text-[10px] font-black text-slate-400 uppercase ml-1">{label}</label>
            <div className="relative">
                <select value={value} onChange={onChange} disabled={disabled} className="w-full appearance-none bg-slate-50 dark:bg-[#222630] text-slate-900 dark:text-white rounded-2xl py-3 px-4 font-bold text-sm outline-none focus:ring-2 focus:ring-primary/20 dark:focus:ring-indigo-500/30 transition-all disabled:opacity-50">
                    <option value="">Select {label}</option>
                    {options.map(o => <option key={o} value={o}>{o}</option>)}
                </select>
                <ChevronDown size={16} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400" />
            </div>
        </div>
    );
}

function ToggleButton({ label, active, onClick }) {
    return (
        <motion.button
            onClick={onClick}
            whileHover={{ scale: 1.05, y: -1 }}
            whileTap={{ scale: 0.93 }}
            animate={active ? { scale: [1, 1.08, 1], transition: { duration: 0.25 } } : {}}
            transition={{ type: 'spring', stiffness: 400, damping: 20 }}
            className={`py-3 px-5 rounded-2xl font-black text-xs border-2 transition-colors flex items-center gap-1.5 will-change-transform ${
                active
                    ? 'bg-primary border-primary text-white shadow-lg shadow-primary/20'
                    : 'bg-slate-50 dark:bg-[#222630] border-transparent text-slate-500'
            }`}
        >
            <AnimatePresence mode="wait">
                {active && (
                    <motion.span
                        key="check"
                        initial={{ scale: 0, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1, transition: { type: 'spring', stiffness: 500, damping: 18 } }}
                        exit={{ scale: 0, opacity: 0, transition: { duration: 0.1 } }}
                        className="inline-flex"
                    >
                        <Check size={11} strokeWidth={3.5} />
                    </motion.span>
                )}
            </AnimatePresence>
            {label}
        </motion.button>
    );
}

function Counter({ label, value, onChange }) {
    return (
        <div className="flex items-center justify-between bg-slate-50 dark:bg-[#222630] p-4 rounded-2xl">
            <span className="font-bold text-sm text-slate-600 dark:text-slate-300">{label}</span>
            <div className="flex items-center gap-4">
                <motion.button
                    whileTap={{ scale: 0.75, rotate: -12 }}
                    whileHover={{ scale: 1.1 }}
                    transition={{ type: 'spring', stiffness: 500, damping: 18 }}
                    onClick={() => onChange(value === 'Any' || Number(value) <= 1 ? 'Any' : (Number(value) - 1).toString())}
                    className="size-8 rounded-lg bg-white dark:bg-[#1A1D24] flex items-center justify-center text-slate-400 shadow-sm will-change-transform"
                >
                    <Minus size={16} />
                </motion.button>
                <motion.span
                    key={value}
                    initial={{ opacity: 0, y: -8, scale: 0.7 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    transition={{ type: 'spring', stiffness: 400, damping: 18 }}
                    className="w-8 text-center font-black text-slate-900 dark:text-white inline-block"
                >
                    {value}
                </motion.span>
                <motion.button
                    whileTap={{ scale: 0.75, rotate: 12 }}
                    whileHover={{ scale: 1.1 }}
                    transition={{ type: 'spring', stiffness: 500, damping: 18 }}
                    onClick={() => onChange(value === 'Any' ? '1' : (Number(value) + 1).toString())}
                    className="size-8 rounded-lg bg-primary text-white flex items-center justify-center shadow-md will-change-transform"
                >
                    <Plus size={16} />
                </motion.button>
            </div>
        </div>
    );
}
