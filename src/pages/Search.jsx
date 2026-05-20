import { useState, useEffect, useMemo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { collection, getDocs } from 'firebase/firestore';
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
import { motion, AnimatePresence } from 'framer-motion';
import HorizontalPropertyCard from '../components/HorizontalPropertyCard';
import { bdLocations } from '../data/locations';
import { Helmet } from 'react-helmet-async';

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
    const [searchTerm, setSearchTerm] = useState('');
    const [searchHistory, setSearchHistory] = useState(loadHistory);
    const [inputFocused, setInputFocused] = useState(false);

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

    useEffect(() => {
        const fetchProperties = async () => {
            try {
                setLoading(true);
                const querySnapshot = await getDocs(collection(db, "properties"));
                const allListings = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
                setProperties(allListings);
            } catch (error) {
                console.error("Error fetching properties:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchProperties();
    }, []);

    const filteredProperties = useMemo(() => {
        return properties.filter(p => {
            if (p.isApproved === false) return false;
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
        <div className="flex flex-col min-h-screen bg-slate-50 dark:bg-slate-950">
            <Helmet>
                <title>Search Properties | Any-Let</title>
                <meta name="description" content="Search thousands of verified apartments, flats, and commercial properties for rent across Bangladesh." />
            </Helmet>
            <div className="flex-1 max-w-7xl mx-auto w-full flex flex-col md:flex-row gap-8 px-6 py-8">
                
                {/* Desktop Sidebar */}
                <div className="hidden md:block w-80 shrink-0">
                    <aside className="sticky top-28 self-start h-[calc(100vh-140px)] overflow-y-auto no-scrollbar pb-10">
                        <div className="bg-white dark:bg-slate-900 rounded-[32px] border border-slate-100 dark:border-slate-800 p-8 shadow-sm">
                            <div className="flex items-center justify-between mb-8">
                                <h2 className="text-xl font-black text-slate-900 dark:text-white">Filters</h2>
                                <button onClick={resetFilters} className="text-primary text-sm font-black hover:underline underline-offset-4">Reset</button>
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
                </div>

                {/* Main Results */}
                <main className="flex-1 flex flex-col gap-6">
                    <div className="flex flex-col gap-4">
                        <div className="flex items-center gap-4">
                            <button onClick={() => navigate(-1)} className="md:hidden size-12 rounded-2xl bg-white dark:bg-slate-800 flex items-center justify-center text-slate-900 dark:text-white shadow-sm shrink-0">
                                <ArrowLeft size={20} strokeWidth={2.5} />
                            </button>
                            <div className="relative flex-1 group">
                                <div className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-primary transition-colors pointer-events-none">
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
                                    className="w-full bg-white dark:bg-slate-900 border-2 border-transparent focus:border-primary/20 rounded-3xl py-4 pl-14 pr-14 font-bold text-slate-900 dark:text-white shadow-sm outline-none transition-all h-16 md:h-20"
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
                                    className="bg-white dark:bg-slate-900 rounded-3xl shadow-xl border border-slate-100 dark:border-slate-800 px-5 py-4"
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
                                        {searchHistory.map((item) => (
                                            <div
                                                key={item}
                                                className="flex items-center gap-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl pl-3.5 pr-2 py-2 group"
                                            >
                                                <button
                                                    className="text-xs font-bold text-slate-700 dark:text-slate-300 hover:text-primary transition-colors"
                                                    onClick={() => { setSearchTerm(item); commitSearch(item); }}
                                                >
                                                    {item}
                                                </button>
                                                <button
                                                    onClick={() => removeHistoryItem(item)}
                                                    className="size-4 rounded-full bg-slate-200 dark:bg-slate-700 text-slate-400 hover:bg-rose-100 hover:text-rose-500 dark:hover:bg-rose-900/40 dark:hover:text-rose-400 flex items-center justify-center transition-colors shrink-0"
                                                >
                                                    <X size={9} strokeWidth={3} />
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>

                        <div className="flex items-center justify-between px-2">
                            <h2 className="text-[12px] font-black text-slate-400 uppercase tracking-[0.2em]">
                                Found {filteredProperties.length} Properties
                            </h2>
                        </div>
                    </div>

                    {loading ? (
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            {[1, 2, 3, 4].map(n => <div key={n} className="animate-pulse h-48 w-full rounded-3xl bg-white dark:bg-slate-900" />)}
                        </div>
                    ) : (
                        <motion.div layout className="grid grid-cols-1 lg:grid-cols-2 gap-6 pb-24 md:pb-10">
                            <AnimatePresence mode="popLayout">
                                {filteredProperties.length > 0 ? (
                                    filteredProperties.map((p, idx) => (
                                        <motion.div key={p.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95 }} transition={{ delay: idx * 0.05 }} className="h-full">
                                            <HorizontalPropertyCard property={p} />
                                        </motion.div>
                                    ))
                                ) : (
                                    <div className="col-span-full py-20 text-center flex flex-col items-center gap-6">
                                        <div className="size-24 rounded-full bg-slate-100 dark:bg-slate-900 flex items-center justify-center text-slate-300"><SearchIcon size={48} /></div>
                                        <div>
                                            <h3 className="text-xl font-black text-slate-900 dark:text-white">No properties found</h3>
                                            <p className="text-slate-500 font-medium">Try broadening your filters or location</p>
                                        </div>
                                        <button onClick={resetFilters} className="bg-primary text-white px-8 py-3 rounded-2xl font-black shadow-lg shadow-primary/20">Clear All Filters</button>
                                    </div>
                                )}
                            </AnimatePresence>
                        </motion.div>
                    )}
                </main>
            </div>

            {/* Mobile Filters Drawer */}
            <AnimatePresence>
                {showFilters && (
                    <div className="md:hidden fixed inset-0 z-[100] flex flex-col justify-end">
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowFilters(false)} className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" />
                        <motion.div initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }} transition={{ type: "spring", damping: 25, stiffness: 200 }} className="bg-white dark:bg-slate-950 w-full h-[90vh] rounded-t-[40px] flex flex-col shadow-2xl relative z-10 overflow-hidden">
                            <div className="w-12 h-1.5 bg-slate-200 dark:bg-slate-800 rounded-full mx-auto my-4 shrink-0" />
                            <header className="flex items-center justify-between px-8 pb-4 shrink-0">
                                <h2 className="text-2xl font-black text-slate-900 dark:text-white">Filters</h2>
                                <button onClick={resetFilters} className="text-primary font-black">Reset</button>
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
                            <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-white dark:from-slate-950 pt-20">
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
                <div className="flex items-center gap-2 mb-4 text-primary"><RotateCcw size={16} /><h3 className="text-[15px] font-black uppercase tracking-wider">Location Setup</h3></div>
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
                        <input type="number" placeholder="Min" value={filterState.minPrice} onChange={(e) => setFilterState(prev => ({ ...prev, minPrice: e.target.value }))} className="w-full bg-slate-50 dark:bg-slate-800 border-2 border-transparent focus:border-primary/20 rounded-2xl py-3 pl-8 pr-4 font-bold outline-none" />
                    </div>
                    <div className="relative flex-1">
                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold">৳</span>
                        <input type="number" placeholder="Max" value={filterState.maxPrice} onChange={(e) => setFilterState(prev => ({ ...prev, maxPrice: e.target.value }))} className="w-full bg-slate-50 dark:bg-slate-800 border-2 border-transparent focus:border-primary/20 rounded-2xl py-3 pl-8 pr-4 font-bold outline-none" />
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
                        <button key={u} onClick={() => toggleList('utilities', u)} className={`py-2 px-4 rounded-xl text-xs font-bold border-2 transition-all flex items-center gap-2 ${filterState.utilities.includes(u) ? 'bg-primary/10 border-primary text-primary' : 'bg-slate-50 dark:bg-slate-800 border-transparent text-slate-500'}`}>
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
                <select value={value} onChange={onChange} disabled={disabled} className="w-full appearance-none bg-slate-50 dark:bg-slate-800 rounded-2xl py-3 px-4 font-bold text-sm outline-none focus:ring-2 focus:ring-primary/20 transition-all disabled:opacity-50">
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
        <button onClick={onClick} className={`py-3 px-5 rounded-2xl font-black text-xs border-2 transition-all ${active ? 'bg-primary border-primary text-white shadow-lg shadow-primary/20' : 'bg-slate-50 dark:bg-slate-800 border-transparent text-slate-500'}`}>
            {label}
        </button>
    );
}

function Counter({ label, value, onChange }) {
    return (
        <div className="flex items-center justify-between bg-slate-50 dark:bg-slate-800 p-4 rounded-2xl">
            <span className="font-bold text-sm text-slate-600 dark:text-slate-300">{label}</span>
            <div className="flex items-center gap-4">
                <button onClick={() => onChange(value === 'Any' || Number(value) <= 1 ? 'Any' : (Number(value) - 1).toString())} className="size-8 rounded-lg bg-white dark:bg-slate-900 flex items-center justify-center text-slate-400 shadow-sm"><Minus size={16} /></button>
                <span className="w-8 text-center font-black text-slate-900 dark:text-white">{value}</span>
                <button onClick={() => onChange(value === 'Any' ? '1' : (Number(value) + 1).toString())} className="size-8 rounded-lg bg-primary text-white flex items-center justify-center shadow-md"><Plus size={16} /></button>
            </div>
        </div>
    );
}
