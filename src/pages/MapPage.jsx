import { useState, useEffect, useMemo, Suspense, lazy } from 'react';
import { useNavigate } from 'react-router-dom';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../firebase';
import { Map as MapIcon, Search, SlidersHorizontal, X, ChevronDown, RotateCcw, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { bdLocations } from '../data/locations';
import { Helmet } from 'react-helmet-async';

const PropertyMap = lazy(() => import('../components/PropertyMap'));

const PROPERTY_TYPES = ['House', 'Apartment', 'Sublet', 'Room', 'Mess', 'Cottage', 'Resort', 'Shop', 'Others'];
const BILLING_CYCLES = ['Day', 'Week', 'Month'];

export default function MapPage() {
    const navigate = useNavigate();
    const [properties, setProperties] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showFilters, setShowFilters] = useState(false);

    const [filters, setFilters] = useState({
        division: '',
        district: '',
        upazila: '',
        type: '',
        minPrice: '',
        maxPrice: '',
        billingCycle: 'Month',
    });

    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        const fetch = async () => {
            try {
                setLoading(true);
                const snap = await getDocs(collection(db, 'properties'));
                setProperties(snap.docs.map(d => ({ id: d.id, ...d.data() })));
            } catch (e) {
                console.error(e);
            } finally {
                setLoading(false);
            }
        };
        fetch();
    }, []);

    const districts = useMemo(() =>
        filters.division ? Object.keys(bdLocations[filters.division] || {}) : [],
        [filters.division]
    );
    const thanas = useMemo(() =>
        (filters.division && filters.district)
            ? bdLocations[filters.division][filters.district] || []
            : [],
        [filters.division, filters.district]
    );

    const filtered = useMemo(() => {
        return properties.filter(p => {
            if (p.isApproved === false) return false;
            if (filters.division && p.division !== filters.division) return false;
            if (filters.district && p.district !== filters.district) return false;
            if (filters.upazila && p.upazila !== filters.upazila) return false;
            if (filters.type && p.type !== filters.type) return false;
            if (filters.minPrice && p.rent < Number(filters.minPrice)) return false;
            if (filters.maxPrice && p.rent > Number(filters.maxPrice)) return false;
            if (filters.billingCycle && p.billingCycle !== filters.billingCycle) return false;
            if (searchTerm) {
                const t = searchTerm.toLowerCase();
                return (
                    p.title?.toLowerCase().includes(t) ||
                    p.upazila?.toLowerCase().includes(t) ||
                    p.district?.toLowerCase().includes(t)
                );
            }
            return true;
        });
    }, [properties, filters, searchTerm]);

    const activeFilterCount = [
        filters.division, filters.district, filters.upazila,
        filters.type, filters.minPrice, filters.maxPrice,
    ].filter(Boolean).length;

    const resetFilters = () => {
        setFilters({ division: '', district: '', upazila: '', type: '', minPrice: '', maxPrice: '', billingCycle: 'Month' });
        setSearchTerm('');
    };

    return (
        <div className="fixed inset-0 bg-slate-900 flex flex-col" style={{ zIndex: 10, bottom: '5rem' }}>
            <Helmet>
                <title>Map Search | Any-Let</title>
                <meta name="description" content="Browse rental properties on an interactive map across Bangladesh." />
            </Helmet>

            {/* ── Top bar ── */}
            <div className="absolute top-0 left-0 right-0 z-[1100] px-4 pt-4 pb-3 flex items-center gap-3">
                {/* Search pill */}
                <div className="flex-1 flex items-center bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-slate-100 dark:border-slate-700 overflow-hidden">
                    <Search size={16} className="ml-4 text-slate-400 shrink-0" />
                    <input
                        type="text"
                        placeholder="Search by area, district…"
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                        className="flex-1 bg-transparent py-3 px-3 text-sm font-semibold text-slate-900 dark:text-white placeholder:text-slate-400 outline-none"
                    />
                    {searchTerm && (
                        <button onClick={() => setSearchTerm('')} className="mr-3 text-slate-400 hover:text-slate-600">
                            <X size={14} />
                        </button>
                    )}
                </div>

                {/* Filter trigger */}
                <button
                    onClick={() => setShowFilters(true)}
                    className="relative size-12 rounded-2xl bg-white dark:bg-slate-900 shadow-xl border border-slate-100 dark:border-slate-700 flex items-center justify-center text-slate-700 dark:text-slate-300 shrink-0"
                >
                    <SlidersHorizontal size={18} />
                    {activeFilterCount > 0 && (
                        <span className="absolute -top-1 -right-1 size-5 rounded-full bg-primary text-white text-[9px] font-black flex items-center justify-center">
                            {activeFilterCount}
                        </span>
                    )}
                </button>
            </div>

            {/* ── Full-screen map ── */}
            <div className="flex-1 w-full">
                {loading ? (
                    <div className="w-full h-full flex flex-col items-center justify-center bg-slate-100 dark:bg-slate-950 gap-4">
                        <div className="size-16 rounded-full bg-primary/10 flex items-center justify-center">
                            <MapIcon size={32} className="text-primary animate-pulse" />
                        </div>
                        <p className="text-sm font-black text-slate-500 uppercase tracking-widest">Loading Map…</p>
                    </div>
                ) : (
                    <Suspense fallback={
                        <div className="w-full h-full flex flex-col items-center justify-center bg-slate-100 dark:bg-slate-950 gap-4">
                            <MapIcon size={32} className="text-primary animate-pulse" />
                            <p className="text-sm font-black text-slate-500 uppercase tracking-widest">Loading Map…</p>
                        </div>
                    }>
                        <PropertyMap
                            properties={filtered}
                            defaultLayer="street"
                            showLayerControl={true}
                        />
                    </Suspense>
                )}
            </div>

            {/* ── Filter Drawer ── */}
            <AnimatePresence>
                {showFilters && (
                    <div className="fixed inset-0 z-[2000] flex flex-col justify-end">
                        <motion.div
                            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                            onClick={() => setShowFilters(false)}
                            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
                        />
                        <motion.div
                            initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
                            transition={{ type: 'spring', damping: 28, stiffness: 240 }}
                            className="relative bg-white dark:bg-slate-950 rounded-t-[36px] shadow-2xl overflow-hidden flex flex-col"
                            style={{ maxHeight: '88vh' }}
                        >
                            {/* Handle */}
                            <div className="w-10 h-1 bg-slate-200 dark:bg-slate-800 rounded-full mx-auto mt-4 mb-1 shrink-0" />

                            {/* Header */}
                            <div className="flex items-center justify-between px-6 py-4 shrink-0 border-b border-slate-100 dark:border-slate-800">
                                <h2 className="text-xl font-black text-slate-900 dark:text-white">Filter Map</h2>
                                <button onClick={resetFilters} className="text-sm font-black text-primary">Reset all</button>
                            </div>

                            {/* Scrollable body */}
                            <div className="flex-1 overflow-y-auto px-6 py-6 space-y-8 pb-36">

                                {/* Location */}
                                <section className="space-y-4">
                                    <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest">Location</h3>
                                    <FilterSelect
                                        label="Division"
                                        value={filters.division}
                                        onChange={v => setFilters(p => ({ ...p, division: v, district: '', upazila: '' }))}
                                        options={Object.keys(bdLocations)}
                                    />
                                    <div className="grid grid-cols-2 gap-3">
                                        <FilterSelect
                                            label="District"
                                            value={filters.district}
                                            onChange={v => setFilters(p => ({ ...p, district: v, upazila: '' }))}
                                            options={districts}
                                            disabled={!filters.division}
                                        />
                                        <FilterSelect
                                            label="Upazila"
                                            value={filters.upazila}
                                            onChange={v => setFilters(p => ({ ...p, upazila: v }))}
                                            options={thanas}
                                            disabled={!filters.district}
                                        />
                                    </div>
                                </section>

                                {/* Property type */}
                                <section className="space-y-3">
                                    <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest">Property Type</h3>
                                    <div className="flex flex-wrap gap-2">
                                        {PROPERTY_TYPES.map(type => (
                                            <button
                                                key={type}
                                                onClick={() => setFilters(p => ({ ...p, type: p.type === type ? '' : type }))}
                                                className={`py-2.5 px-4 rounded-2xl text-xs font-black border-2 transition-all ${
                                                    filters.type === type
                                                        ? 'bg-primary border-primary text-white shadow-lg shadow-primary/20'
                                                        : 'bg-slate-50 dark:bg-slate-800 border-transparent text-slate-500'
                                                }`}
                                            >
                                                {type}
                                            </button>
                                        ))}
                                    </div>
                                </section>

                                {/* Billing cycle */}
                                <section className="space-y-3">
                                    <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest">Billing Cycle</h3>
                                    <div className="flex gap-2">
                                        {BILLING_CYCLES.map(c => (
                                            <button
                                                key={c}
                                                onClick={() => setFilters(p => ({ ...p, billingCycle: c }))}
                                                className={`flex-1 py-3 rounded-2xl text-xs font-black border-2 transition-all ${
                                                    filters.billingCycle === c
                                                        ? 'bg-primary border-primary text-white'
                                                        : 'bg-slate-50 dark:bg-slate-800 border-transparent text-slate-500'
                                                }`}
                                            >
                                                /{c}
                                            </button>
                                        ))}
                                    </div>
                                </section>

                                {/* Price range */}
                                <section className="space-y-3">
                                    <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest">Price Range</h3>
                                    <div className="flex gap-3">
                                        <div className="relative flex-1">
                                            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-black text-sm">৳</span>
                                            <input
                                                type="number"
                                                placeholder="Min"
                                                value={filters.minPrice}
                                                onChange={e => setFilters(p => ({ ...p, minPrice: e.target.value }))}
                                                className="w-full bg-slate-50 dark:bg-slate-800 rounded-2xl py-3.5 pl-9 pr-4 font-bold text-sm outline-none focus:ring-2 focus:ring-primary/20"
                                            />
                                        </div>
                                        <div className="relative flex-1">
                                            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-black text-sm">৳</span>
                                            <input
                                                type="number"
                                                placeholder="Max"
                                                value={filters.maxPrice}
                                                onChange={e => setFilters(p => ({ ...p, maxPrice: e.target.value }))}
                                                className="w-full bg-slate-50 dark:bg-slate-800 rounded-2xl py-3.5 pl-9 pr-4 font-bold text-sm outline-none focus:ring-2 focus:ring-primary/20"
                                            />
                                        </div>
                                    </div>
                                </section>
                            </div>

                            {/* Apply button */}
                            <div className="absolute bottom-0 left-0 right-0 p-5 pt-16 bg-gradient-to-t from-white dark:from-slate-950">
                                <button
                                    onClick={() => setShowFilters(false)}
                                    className="w-full bg-primary text-white font-black text-base py-5 rounded-[24px] shadow-2xl shadow-primary/30"
                                >
                                    Show {filtered.length} Properties on Map
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
}

function FilterSelect({ label, value, onChange, options, disabled }) {
    return (
        <div className="space-y-1">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">{label}</label>
            <div className="relative">
                <select
                    value={value}
                    onChange={e => onChange(e.target.value)}
                    disabled={disabled}
                    className="w-full appearance-none bg-slate-50 dark:bg-slate-800 rounded-2xl py-3.5 px-4 font-bold text-sm text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-primary/20 transition-all disabled:opacity-50"
                >
                    <option value="">All {label}s</option>
                    {options.map(o => <option key={o} value={o}>{o}</option>)}
                </select>
                <ChevronDown size={15} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
            </div>
        </div>
    );
}
