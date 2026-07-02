import { useState } from 'react';

const TYPE_OPTIONS = [
    { label: 'All', value: 'all' },
    { label: 'Apartment', value: 'apartment' },
    { label: 'House', value: 'house' },
    { label: 'Office', value: 'office' },
];

const BED_OPTIONS = [0, 1, 2, 3, '4+'];

const LAYER_OPTIONS = [
    { label: 'Street', value: 'street' },
    { label: 'Satellite', value: 'satellite' },
    { label: 'Hybrid', value: 'hybrid' },
];

function FilterPill({ active, label, onClick }) {
    return (
        <button
            type="button"
            onClick={onClick}
            className={`shrink-0 rounded-full px-4 py-2 text-sm font-bold shadow-sm transition-all ${
                active
                    ? 'bg-primary text-white shadow-primary/20'
                    : 'border border-gray-200 bg-white text-gray-700 hover:bg-slate-50'
            }`}
        >
            {label}
        </button>
    );
}

export default function FilterBar({ filters, setFilters, activeLayer, setActiveLayer, topOffsetClass = 'top-4' }) {
    const [openMenu, setOpenMenu] = useState(null);
    const hasPrice = Boolean(filters.minPrice || filters.maxPrice);
    const hasBeds = filters.beds !== 0;
    const hasMore = filters.type !== 'all' || hasPrice || hasBeds;

    const updateFilter = (key, value) => {
        setFilters((current) => ({ ...current, [key]: value }));
    };

    const resetFilters = () => {
        setFilters({ type: 'all', minPrice: '', maxPrice: '', beds: 0, searchTerm: '' });
        setOpenMenu(null);
    };

    return (
        <div
            className={`pointer-events-none absolute left-1/2 z-[999] flex w-[calc(100vw-1.5rem)] max-w-[760px] -translate-x-1/2 flex-col items-center gap-2 md:w-auto ${topOffsetClass}`}
        >
            <div className="pointer-events-auto flex max-w-full gap-2 overflow-x-auto px-1 pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                <FilterPill
                    active={activeLayer !== 'street'}
                    label="Map Layer ▼"
                    onClick={() => setOpenMenu(openMenu === 'layer' ? null : 'layer')}
                />
                <FilterPill
                    active={filters.type !== 'all'}
                    label="All Types ▼"
                    onClick={() => setOpenMenu(openMenu === 'type' ? null : 'type')}
                />
                <FilterPill
                    active={hasPrice}
                    label="৳ Price ▼"
                    onClick={() => setOpenMenu(openMenu === 'price' ? null : 'price')}
                />
                <FilterPill
                    active={hasBeds}
                    label="Beds ▼"
                    onClick={() => setOpenMenu(openMenu === 'beds' ? null : 'beds')}
                />
                <FilterPill
                    active={hasMore}
                    label="More Filters"
                    onClick={() => setOpenMenu(openMenu === 'more' ? null : 'more')}
                />
            </div>

            {openMenu && (
                <div className="pointer-events-auto w-[min(21rem,calc(100vw-2rem))] rounded-xl border border-[#E5E7EB] bg-white p-3 shadow-lg">
                    {openMenu === 'type' && (
                        <div className="grid grid-cols-2 gap-2">
                            {TYPE_OPTIONS.map((option) => (
                                <button
                                    key={option.value}
                                    type="button"
                                    onClick={() => updateFilter('type', option.value)}
                                    className={`rounded-lg px-3 py-2 text-sm font-bold transition-colors ${
                                        filters.type === option.value
                                            ? 'bg-primary text-white'
                                            : 'bg-slate-50 text-slate-900 hover:bg-slate-100'
                                    }`}
                                >
                                    {option.label}
                                </button>
                            ))}
                        </div>
                    )}

                    {openMenu === 'price' && (
                        <div className="grid grid-cols-2 gap-3">
                            <input
                                type="number"
                                inputMode="numeric"
                                placeholder="Min"
                                value={filters.minPrice}
                                onChange={(event) => updateFilter('minPrice', event.target.value)}
                                className="rounded-lg border-2 border-transparent bg-slate-50 px-3 py-2 text-sm font-bold outline-none focus:border-primary/30"
                            />
                            <input
                                type="number"
                                inputMode="numeric"
                                placeholder="Max"
                                value={filters.maxPrice}
                                onChange={(event) => updateFilter('maxPrice', event.target.value)}
                                className="rounded-lg border-2 border-transparent bg-slate-50 px-3 py-2 text-sm font-bold outline-none focus:border-primary/30"
                            />
                        </div>
                    )}

                    {openMenu === 'beds' && (
                        <div className="flex gap-2">
                            {BED_OPTIONS.map((option) => (
                                <button
                                    key={option}
                                    type="button"
                                    onClick={() => updateFilter('beds', option)}
                                    className={`flex-1 rounded-lg px-3 py-2 text-sm font-bold transition-colors ${
                                        filters.beds === option
                                            ? 'bg-primary text-white'
                                            : 'bg-slate-50 text-slate-900 hover:bg-slate-100'
                                    }`}
                                >
                                    {option === 0 ? 'Any' : option}
                                </button>
                            ))}
                        </div>
                    )}

                    {openMenu === 'layer' && (
                        <div className="grid grid-cols-1 gap-2">
                            {LAYER_OPTIONS.map((option) => (
                                <button
                                    key={option.value}
                                    type="button"
                                    onClick={() => setActiveLayer(option.value)}
                                    className={`rounded-lg px-3 py-2 text-sm font-bold text-left transition-colors ${
                                        activeLayer === option.value
                                            ? 'bg-primary text-white'
                                            : 'bg-slate-50 text-slate-900 hover:bg-slate-100'
                                    }`}
                                >
                                    {option.label}
                                </button>
                            ))}
                        </div>
                    )}

                    {openMenu === 'more' && (
                        <div className="space-y-3">
                            <p className="text-xs font-bold text-slate-500">
                                Filters apply instantly to the visible map area.
                            </p>
                            <button
                                type="button"
                                onClick={resetFilters}
                                className="w-full rounded-lg bg-primary py-2.5 text-sm font-black text-white shadow-lg shadow-primary/20 transition-transform active:scale-95"
                            >
                                Reset filters
                            </button>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
