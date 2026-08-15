import { useState } from 'react';
import { Input } from '../ui';

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
            className={`shrink-0 rounded-full px-4 py-2 text-body-sm font-bold shadow-sm transition-all active:scale-95 ${
                active
                    ? 'bg-primary text-white shadow-primary/20'
                    : 'border border-border bg-surface/90 text-content hover:bg-surface-raised backdrop-blur-sm'
            }`}
        >
            {label}
        </button>
    );
}

function OptionChip({ active, label, onClick }) {
    return (
        <button
            type="button"
            onClick={onClick}
            className={`rounded-control px-3 py-2 text-body-sm font-bold text-left transition-all active:scale-95 ${
                active
                    ? 'bg-primary text-white shadow-sm shadow-primary/20'
                    : 'bg-surface-raised text-content border border-border hover:border-primary/40'
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
                <div className="pointer-events-auto w-[min(21rem,calc(100vw-2rem))] rounded-card border border-border bg-surface p-3 shadow-lg">
                    {openMenu === 'type' && (
                        <div className="grid grid-cols-2 gap-2">
                            {TYPE_OPTIONS.map((option) => (
                                <OptionChip
                                    key={option.value}
                                    active={filters.type === option.value}
                                    label={option.label}
                                    onClick={() => updateFilter('type', option.value)}
                                />
                            ))}
                        </div>
                    )}

                    {openMenu === 'price' && (
                        <div className="grid grid-cols-2 gap-3">
                            <Input
                                type="number"
                                inputMode="numeric"
                                placeholder="Min rent"
                                value={filters.minPrice}
                                onChange={(event) => updateFilter('minPrice', event.target.value)}
                            />
                            <Input
                                type="number"
                                inputMode="numeric"
                                placeholder="Max rent"
                                value={filters.maxPrice}
                                onChange={(event) => updateFilter('maxPrice', event.target.value)}
                            />
                        </div>
                    )}

                    {openMenu === 'beds' && (
                        <div className="flex gap-2">
                            {BED_OPTIONS.map((option) => (
                                <OptionChip
                                    key={option}
                                    active={filters.beds === option}
                                    label={option === 0 ? 'Any' : String(option)}
                                    onClick={() => updateFilter('beds', option)}
                                />
                            ))}
                        </div>
                    )}

                    {openMenu === 'layer' && (
                        <div className="grid grid-cols-1 gap-2">
                            {LAYER_OPTIONS.map((option) => (
                                <OptionChip
                                    key={option.value}
                                    active={activeLayer === option.value}
                                    label={option.label}
                                    onClick={() => setActiveLayer(option.value)}
                                />
                            ))}
                        </div>
                    )}

                    {openMenu === 'more' && (
                        <div className="space-y-3">
                            <p className="text-caption font-bold text-muted">
                                Filters apply instantly to the visible map area.
                            </p>
                            <button
                                type="button"
                                onClick={resetFilters}
                                className="w-full rounded-control bg-primary py-2.5 text-body-sm font-bold text-white shadow-lg shadow-primary/20 transition-transform active:scale-95"
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
