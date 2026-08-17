import { useState, useEffect, useRef, useMemo } from 'react';
import { Search, MapPin, History, X, SlidersHorizontal, Check } from 'lucide-react';
import { upazilaCoords, districtCoords, divisionCoords } from '../../data/locationCoords';
import { motion, AnimatePresence } from 'framer-motion';
import { Input } from '../ui';

// ── All searchable locations ────────────────────────────────────────────────
const ALL_LOCATIONS = [
    ...Object.entries(upazilaCoords).map(([name, coords]) => ({ name, type: 'Area / Upazila', ...coords })),
    ...Object.entries(districtCoords).map(([name, coords]) => ({ name, type: 'City / District', ...coords })),
    ...Object.entries(divisionCoords).map(([name, coords]) => ({ name, type: 'Division', ...coords })),
];

const MAX_HISTORY = 5;
const STORAGE_KEY = 'anylet_map_search_history';

const TYPE_OPTIONS   = [{ label: 'All', value: 'all' }, { label: 'Apartment', value: 'apartment' }, { label: 'House', value: 'house' }, { label: 'Office', value: 'office' }];
const BED_OPTIONS    = [0, 1, 2, 3, '4+'];
const LAYER_OPTIONS  = [{ label: 'Street', value: 'street' }, { label: 'Satellite', value: 'satellite' }, { label: 'Hybrid', value: 'hybrid' }];

// ── Reusable toggle chip ────────────────────────────────────────────────────
function Chip({ active, label, onClick }) {
    return (
        <button
            type="button"
            onClick={onClick}
            className={`shrink-0 rounded-full px-4 py-1.5 text-body-sm font-bold shadow-sm transition-all active:scale-95 ${
                active
                    ? 'bg-primary text-white shadow-primary/20'
                    : 'border border-white/50 bg-white/80 text-content backdrop-blur-sm'
            }`}
        >
            {label}
        </button>
    );
}

// ── Premium bottom sheet filter panel ──────────────────────────────────────
function FilterSheet({ open, onClose, filters, setFilters, activeLayer, setActiveLayer }) {
    const hasActive = filters.type !== 'all' || filters.minPrice || filters.maxPrice || filters.beds !== 0 || activeLayer !== 'street';

    return (
        <AnimatePresence>
            {open && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="fixed inset-0 z-[3000] bg-black/30 backdrop-blur-[2px]"
                        onClick={onClose}
                    />
                    {/* Sheet */}
                    <motion.div
                        initial={{ y: '100%' }}
                        animate={{ y: 0 }}
                        exit={{ y: '100%' }}
                        transition={{ type: 'spring', damping: 28, stiffness: 280 }}
                        className="fixed inset-x-0 bottom-0 z-[3001] rounded-t-[28px] bg-surface shadow-[0_-12px_48px_rgba(0,0,0,0.18)] overflow-hidden"
                    >
                        {/* Handle */}
                        <div className="flex justify-center pt-3 pb-1">
                            <div className="h-1 w-10 rounded-full bg-surface-raised border border-border" />
                        </div>

                        {/* Header */}
                        <div className="flex items-center justify-between px-5 py-3 border-b border-border">
                            <h3 className="text-title-sm text-content">Filters</h3>
                            <div className="flex items-center gap-3">
                                {hasActive && (
                                    <button
                                        onClick={() => {
                                            setFilters(f => ({ ...f, type: 'all', minPrice: '', maxPrice: '', beds: 0 }));
                                            setActiveLayer('street');
                                        }}
                                        className="text-caption font-bold text-primary"
                                    >
                                        Reset all
                                    </button>
                                )}
                                <button
                                    onClick={onClose}
                                    className="flex h-7 w-7 items-center justify-center rounded-full bg-surface-raised text-muted border border-border"
                                    aria-label="Close filters"
                                >
                                    <X size={15} />
                                </button>
                            </div>
                        </div>

                        {/* Content */}
                        <div className="px-5 py-4 space-y-5 pb-[calc(1.25rem+env(safe-area-inset-bottom))]">

                            {/* Property Type */}
                            <div>
                                <p className="text-[11px] font-bold text-muted uppercase tracking-widest mb-2.5">Property Type</p>
                                <div className="grid grid-cols-4 gap-2">
                                    {TYPE_OPTIONS.map(opt => (
                                        <button
                                            key={opt.value}
                                            onClick={() => setFilters(f => ({ ...f, type: opt.value }))}
                                            className={`py-2 rounded-control text-body-sm font-bold transition-all active:scale-95 ${
                                                filters.type === opt.value
                                                    ? 'bg-primary text-white shadow-sm shadow-primary/20'
                                                    : 'bg-surface-raised text-content border border-border'
                                            }`}
                                        >
                                            {opt.label}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Bedrooms */}
                            <div>
                                <p className="text-[11px] font-bold text-muted uppercase tracking-widest mb-2.5">Bedrooms</p>
                                <div className="flex gap-2">
                                    {BED_OPTIONS.map(opt => (
                                        <button
                                            key={opt}
                                            onClick={() => setFilters(f => ({ ...f, beds: opt }))}
                                            className={`flex-1 py-2 rounded-control text-body-sm font-bold transition-all active:scale-95 ${
                                                filters.beds === opt
                                                    ? 'bg-primary text-white shadow-sm shadow-primary/20'
                                                    : 'bg-surface-raised text-content border border-border'
                                            }`}
                                        >
                                            {opt === 0 ? 'Any' : opt}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Price Range */}
                            <div>
                                <p className="text-[11px] font-bold text-muted uppercase tracking-widest mb-2.5">Price Range (৳ / month)</p>
                                <div className="grid grid-cols-2 gap-3">
                                    <Input
                                        type="number"
                                        inputMode="numeric"
                                        placeholder="Min rent"
                                        value={filters.minPrice}
                                        onChange={e => setFilters(f => ({ ...f, minPrice: e.target.value }))}
                                    />
                                    <Input
                                        type="number"
                                        inputMode="numeric"
                                        placeholder="Max rent"
                                        value={filters.maxPrice}
                                        onChange={e => setFilters(f => ({ ...f, maxPrice: e.target.value }))}
                                    />
                                </div>
                            </div>

                            {/* Map Layer */}
                            <div>
                                <p className="text-[11px] font-bold text-muted uppercase tracking-widest mb-2.5">Map Layer</p>
                                <div className="flex gap-2">
                                    {LAYER_OPTIONS.map(opt => (
                                        <button
                                            key={opt.value}
                                            onClick={() => setActiveLayer(opt.value)}
                                            className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-control text-body-sm font-bold transition-all active:scale-95 ${
                                                activeLayer === opt.value
                                                    ? 'bg-primary text-white shadow-sm shadow-primary/20'
                                                    : 'bg-surface-raised text-content border border-border'
                                            }`}
                                        >
                                            {activeLayer === opt.value && <Check size={12} />}
                                            {opt.label}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
}

// ── Main MobileMapTopBar ────────────────────────────────────────────────────
export default function MobileMapTopBar({ value, onChange, onLocationSelect, filters, setFilters, activeLayer, setActiveLayer }) {
    const [isFocused, setIsFocused]     = useState(false);
    const [sheetOpen, setSheetOpen]     = useState(false);
    const [history, setHistory]         = useState(() => {
        try {
            const saved = localStorage.getItem(STORAGE_KEY);
            return saved ? JSON.parse(saved) : [];
        } catch {
            return [];
        }
    });

    const containerRef = useRef(null);
    const hasFilterActive = filters.type !== 'all' || filters.minPrice || filters.maxPrice || filters.beds !== 0 || activeLayer !== 'street';

    // Load history
    useEffect(() => {
        try {
            const saved = localStorage.getItem(STORAGE_KEY);
            if (saved) setHistory(JSON.parse(saved));
        } catch { /* ignore */ }
    }, []);

    // Close dropdown on outside click
    useEffect(() => {
        function handleOut(e) {
            if (containerRef.current && !containerRef.current.contains(e.target)) setIsFocused(false);
        }
        document.addEventListener('mousedown', handleOut);
        document.addEventListener('touchstart', handleOut, { passive: true });
        return () => {
            document.removeEventListener('mousedown', handleOut);
            document.removeEventListener('touchstart', handleOut);
        };
    }, []);

    const suggestions = useMemo(() => {
        if (!value || value.trim().length === 0) return [];
        const term = value.toLowerCase().trim();
        return ALL_LOCATIONS.filter(loc => loc.name.toLowerCase().includes(term)).slice(0, 6);
    }, [value]);

    const handleSelect = (location) => {
        onChange(location.name);
        const newHistory = [location, ...history.filter(h => h.name !== location.name)].slice(0, MAX_HISTORY);
        setHistory(newHistory);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(newHistory));
        if (onLocationSelect) onLocationSelect({ lat: location.lat, lng: location.lng });
        setIsFocused(false);
    };

    const clearHistory = (e) => {
        e.stopPropagation();
        setHistory([]);
        localStorage.removeItem(STORAGE_KEY);
    };

    const showDropdown = isFocused && (value?.trim().length > 0 ? suggestions.length > 0 : history.length > 0);

    return (
        <>
            {/* ── Top bar ─────────────────────────────────────────────────── */}
            <div
                ref={containerRef}
                className="absolute inset-x-3 top-3 z-[1000] md:hidden"
                style={{ top: 'max(0.75rem, env(safe-area-inset-top))' }}
            >
                {/* Search + Filter pill */}
                <div className="flex items-center gap-2">
                    {/* Search pill */}
                    <div className="relative flex-1">
                        <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-subtle pointer-events-none" />
                        <input
                            type="text"
                            inputMode="search"
                            placeholder="Search area, city or division…"
                            value={value || ''}
                            onChange={e => { onChange(e.target.value); setIsFocused(true); }}
                            onFocus={() => setIsFocused(true)}
                            className="w-full h-11 pl-9 pr-8 rounded-[18px] bg-surface/90 backdrop-blur-xl border border-border text-body-sm font-bold text-content placeholder:text-subtle placeholder:font-normal outline-none focus:ring-2 focus:ring-primary/30 shadow-lg shadow-black/10 transition-all"
                        />
                        <AnimatePresence>
                            {value && (
                                <motion.button
                                    initial={{ opacity: 0, scale: 0.7 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    exit={{ opacity: 0, scale: 0.7 }}
                                    transition={{ duration: 0.12 }}
                                    onClick={() => onChange('')}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-subtle hover:text-muted transition-colors"
                                    aria-label="Clear search"
                                >
                                    <X size={14} />
                                </motion.button>
                            )}
                        </AnimatePresence>
                    </div>

                    {/* Filter button */}
                    <button
                        onClick={() => setSheetOpen(true)}
                        aria-label="Open filters"
                        className={`relative h-11 w-11 shrink-0 flex items-center justify-center rounded-[18px] shadow-lg shadow-black/10 backdrop-blur-xl border transition-all active:scale-95 ${
                            hasFilterActive
                                ? 'bg-primary text-white border-primary/20 shadow-primary/30'
                                : 'bg-surface/90 text-muted border-border'
                        }`}
                    >
                        <SlidersHorizontal size={16} />
                        {hasFilterActive && (
                            <span className="absolute -top-1 -right-1 h-2.5 w-2.5 rounded-full bg-danger border-2 border-surface" />
                        )}
                    </button>
                </div>

                {/* Dropdown (suggestions / history) */}
                <AnimatePresence>
                    {showDropdown && (
                        <motion.div
                            initial={{ opacity: 0, y: -6, scale: 0.97 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: -6, scale: 0.97 }}
                            transition={{ type: 'spring', damping: 22, stiffness: 280 }}
                            className="mt-2 rounded-card bg-surface/95 backdrop-blur-xl shadow-xl shadow-black/10 border border-border overflow-hidden"
                        >
                            {/* Suggestions */}
                            {value?.trim().length > 0 && (
                                <div className="py-1.5">
                                    <div className="px-4 pt-1 pb-1.5 text-[10px] font-bold text-subtle uppercase tracking-widest">Suggestions</div>
                                    {suggestions.map((loc, idx) => (
                                        <button
                                            key={idx}
                                            onMouseDown={(e) => { e.preventDefault(); handleSelect(loc); }}
                                            className="w-full text-left px-4 py-2.5 flex items-center gap-3 active:bg-surface-raised transition-colors group"
                                        >
                                            <div className="h-8 w-8 shrink-0 flex items-center justify-center bg-surface-raised text-subtle rounded-control group-active:bg-primary group-active:text-white transition-colors">
                                                <MapPin size={14} />
                                            </div>
                                            <div className="flex flex-col min-w-0">
                                                <span className="text-body-sm font-bold text-content truncate">{loc.name}</span>
                                                <span className="text-caption font-medium text-subtle">{loc.type}</span>
                                            </div>
                                        </button>
                                    ))}
                                </div>
                            )}

                            {/* Recent history */}
                            {(!value || value.trim().length === 0) && history.length > 0 && (
                                <div className="py-1.5">
                                    <div className="px-4 pt-1 pb-1.5 flex items-center justify-between">
                                        <span className="text-[10px] font-bold text-subtle uppercase tracking-widest">Recent</span>
                                        <button onMouseDown={clearHistory} className="text-[11px] font-bold text-primary">Clear</button>
                                    </div>
                                    {history.map((loc, idx) => (
                                        <button
                                            key={idx}
                                            onMouseDown={(e) => { e.preventDefault(); handleSelect(loc); }}
                                            className="w-full text-left px-4 py-2.5 flex items-center gap-3 active:bg-surface-raised transition-colors group"
                                        >
                                            <div className="h-8 w-8 shrink-0 flex items-center justify-center bg-surface-raised text-subtle rounded-control group-active:bg-primary group-active:text-white transition-colors">
                                                <History size={14} />
                                            </div>
                                            <div className="flex flex-col min-w-0">
                                                <span className="text-body-sm font-bold text-content truncate">{loc.name}</span>
                                                <span className="text-caption font-medium text-subtle">{loc.type}</span>
                                            </div>
                                        </button>
                                    ))}
                                </div>
                            )}
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            {/* ── Filter Bottom Sheet ──────────────────────────────────────── */}
            <FilterSheet
                open={sheetOpen}
                onClose={() => setSheetOpen(false)}
                filters={filters}
                setFilters={setFilters}
                activeLayer={activeLayer}
                setActiveLayer={setActiveLayer}
            />
        </>
    );
}
