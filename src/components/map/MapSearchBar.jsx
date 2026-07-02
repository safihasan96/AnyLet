import { useState, useEffect, useRef, useMemo } from 'react';
import { Search, MapPin, History, X } from 'lucide-react';
import { upazilaCoords, districtCoords, divisionCoords } from '../../data/locationCoords';
import { motion, AnimatePresence } from 'framer-motion';

// Aggregate all searchable locations
const ALL_LOCATIONS = [
    ...Object.entries(upazilaCoords).map(([name, coords]) => ({ name, type: 'Area/Upazila', ...coords })),
    ...Object.entries(districtCoords).map(([name, coords]) => ({ name, type: 'City/District', ...coords })),
    ...Object.entries(divisionCoords).map(([name, coords]) => ({ name, type: 'Division', ...coords })),
];

const MAX_HISTORY = 5;
const STORAGE_KEY = 'anylet_map_search_history';

export default function MapSearchBar({ value, onChange, onLocationSelect }) {
    const [isFocused, setIsFocused] = useState(false);
    const [history, setHistory] = useState([]);
    const containerRef = useRef(null);

    // Load history on mount
    useEffect(() => {
        try {
            const saved = localStorage.getItem(STORAGE_KEY);
            if (saved) setHistory(JSON.parse(saved));
        } catch (e) {
            console.error('Failed to load search history', e);
        }
    }, []);

    // Handle clicking outside to close suggestions
    useEffect(() => {
        function handleClickOutside(e) {
            if (containerRef.current && !containerRef.current.contains(e.target)) {
                setIsFocused(false);
            }
        }
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Filter suggestions based on input
    const suggestions = useMemo(() => {
        if (!value || value.trim().length === 0) return [];
        const term = value.toLowerCase().trim();
        return ALL_LOCATIONS.filter(loc => loc.name.toLowerCase().includes(term)).slice(0, 8);
    }, [value]);

    const handleSelect = (location) => {
        // Update input visually
        onChange(location.name);
        
        // Save to history
        const newHistory = [location, ...history.filter(h => h.name !== location.name)].slice(0, MAX_HISTORY);
        setHistory(newHistory);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(newHistory));

        // Pan map
        if (onLocationSelect) {
            onLocationSelect({ lat: location.lat, lng: location.lng });
        }

        setIsFocused(false);
    };

    const clearHistory = (e) => {
        e.stopPropagation();
        setHistory([]);
        localStorage.removeItem(STORAGE_KEY);
    };

    return (
        <div ref={containerRef} className="relative w-full">
            <div className="relative">
                <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                    type="text"
                    placeholder="Search area, city or division..."
                    value={value || ''}
                    onChange={(e) => {
                        onChange(e.target.value);
                        if (!isFocused) setIsFocused(true);
                    }}
                    onFocus={() => setIsFocused(true)}
                    className="w-full pl-9 pr-8 py-2.5 rounded-xl border border-slate-200 bg-white text-[13px] text-slate-900 placeholder:text-slate-400 outline-none focus:ring-2 focus:ring-primary transition-all shadow-sm"
                />
                {value && (
                    <button 
                        onClick={() => onChange('')}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                    >
                        <X size={14} />
                    </button>
                )}
            </div>

            <AnimatePresence>
                {isFocused && (value.trim().length > 0 ? suggestions.length > 0 : history.length > 0) && (
                    <motion.div 
                        initial={{ opacity: 0, y: 4, scale: 0.98 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 4, scale: 0.98 }}
                        transition={{ duration: 0.15 }}
                        className="absolute left-0 right-0 top-full mt-2 bg-white rounded-xl shadow-xl border border-slate-100 overflow-hidden z-[9999]"
                    >
                        {/* Suggestions mode */}
                        {value.trim().length > 0 && (
                            <div className="py-2">
                                <div className="px-4 py-1.5 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                                    Suggestions
                                </div>
                                {suggestions.map((loc, idx) => (
                                    <button
                                        key={idx}
                                        onClick={() => handleSelect(loc)}
                                        className="w-full text-left px-4 py-2.5 flex items-center gap-3 hover:bg-slate-50 transition-colors group"
                                    >
                                        <div className="bg-slate-100 text-slate-500 p-1.5 rounded-lg group-hover:bg-primary group-hover:text-white transition-colors">
                                            <MapPin size={14} />
                                        </div>
                                        <div className="flex flex-col">
                                            <span className="text-sm font-semibold text-slate-800">{loc.name}</span>
                                            <span className="text-[10px] font-medium text-slate-500">{loc.type}</span>
                                        </div>
                                    </button>
                                ))}
                            </div>
                        )}

                        {/* History mode */}
                        {value.trim().length === 0 && history.length > 0 && (
                            <div className="py-2">
                                <div className="px-4 py-1.5 flex items-center justify-between">
                                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Recent Searches</span>
                                    <button onClick={clearHistory} className="text-[10px] font-bold text-primary hover:underline">Clear</button>
                                </div>
                                {history.map((loc, idx) => (
                                    <button
                                        key={idx}
                                        onClick={() => handleSelect(loc)}
                                        className="w-full text-left px-4 py-2.5 flex items-center gap-3 hover:bg-slate-50 transition-colors group"
                                    >
                                        <div className="bg-slate-100 text-slate-500 p-1.5 rounded-lg group-hover:bg-primary group-hover:text-white transition-colors">
                                            <History size={14} />
                                        </div>
                                        <div className="flex flex-col">
                                            <span className="text-sm font-semibold text-slate-800">{loc.name}</span>
                                            <span className="text-[10px] font-medium text-slate-500">{loc.type}</span>
                                        </div>
                                    </button>
                                ))}
                            </div>
                        )}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
