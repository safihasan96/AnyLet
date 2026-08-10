import { useCallback, useEffect, useMemo, useState } from 'react';
import { collection, getDocs, limit, orderBy, query, where } from 'firebase/firestore';
import { db } from '../firebase';
import { Search, X, List } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import MapView from '../components/map/MapView';
import FilterBar from '../components/map/FilterBar';
import ListingCard from '../components/listings/ListingCard';
import ListingSkeleton from '../components/listings/ListingSkeleton';
import Toast from '../components/ui/Toast';
import logger from '../utils/logger';
import MapSearchBar from '../components/map/MapSearchBar';
import MobileMapTopBar from '../components/map/MobileMapTopBar';

const INITIAL_FILTERS = {
    type: 'all',
    minPrice: '',
    maxPrice: '',
    beds: 0,
    searchTerm: '',
};

function normalizeListing(doc) {
    const data = doc.data();
    const directLat = Number(data.lat ?? data.latitude);
    const directLng = Number(data.lng ?? data.longitude);

    if (!Number.isFinite(directLat) || !Number.isFinite(directLng)) {
        return null;
    }

    return {
        id: doc.id,
        ...data,
        lat: directLat,
        lng: directLng,
    };
}

function filterListings(listings, filters) {
    return listings.filter((listing) => {
        const type = String(listing.type || '').toLowerCase();
        const rent = Number(listing.rent || listing.price || 0);
        const beds = Number(listing.beds || 0);

        if (filters.type !== 'all' && type !== filters.type) return false;
        if (filters.minPrice && rent < Number(filters.minPrice)) return false;
        if (filters.maxPrice && rent > Number(filters.maxPrice)) return false;

        if (filters.beds === '4+') {
            if (beds < 4) return false;
        } else if (Number(filters.beds) > 0 && beds !== Number(filters.beds)) {
            return false;
        }

        if (filters.searchTerm) {
            const term = filters.searchTerm.toLowerCase().trim();
            const matchesSearch = listing.title?.toLowerCase().includes(term) || 
                                  listing.addressDetails?.toLowerCase().includes(term) ||
                                  listing.district?.toLowerCase().includes(term) ||
                                  listing.division?.toLowerCase().includes(term) ||
                                  listing.upazila?.toLowerCase().includes(term) ||
                                  listing.city?.toLowerCase().includes(term);
            if (!matchesSearch) return false;
        }

        return true;
    });
}

export default function MapPage() {
    const [allListings, setAllListings] = useState([]);
    const [visibleListings, setVisibleListings] = useState([]);
    const [selectedListingId, setSelectedListingId] = useState(null);
    const [hoveredListingId, setHoveredListingId] = useState(null);
    const [hasPanned, setHasPanned] = useState(false);
    const [currentBounds, setCurrentBounds] = useState(null);
    const [filters, setFilters] = useState(INITIAL_FILTERS);
    const [activeLayer, setActiveLayer] = useState('street');
    const [isLoading, setIsLoading] = useState(true);
    const [toastMessage, setToastMessage] = useState('');
    const [isMobileModalOpen, setIsMobileModalOpen] = useState(false);
    const [flyToTarget, setFlyToTarget] = useState(null);

    useEffect(() => {
        let isMounted = true;

        async function fetchListings() {
            try {
                setIsLoading(true);
                const listingsQuery = query(
                    collection(db, 'properties'),
                    where('isApproved', '==', true),
                    limit(200)
                );
                const snapshot = await getDocs(listingsQuery);
                const listings = snapshot.docs
                    .map(normalizeListing)
                    .filter(Boolean)
                    .filter((listing) => listing.isApproved !== false)
                    .sort((a, b) => {
                        const dateA = a.updatedAt?.toDate() || a.createdAt?.toDate() || new Date(0);
                        const dateB = b.updatedAt?.toDate() || b.createdAt?.toDate() || new Date(0);
                        return dateB - dateA;
                    });

                if (!isMounted) return;
                setAllListings(listings);
                setVisibleListings(listings);
            } catch (error) {
                logger.error('Map listings fetch failed', error);
                if (isMounted) setToastMessage('Could not load map listings');
            } finally {
                if (isMounted) setIsLoading(false);
            }
        }

        fetchListings();

        return () => {
            isMounted = false;
        };
    }, []);

    const filteredVisibleListings = useMemo(
        () => filterListings(visibleListings, filters),
        [visibleListings, filters]
    );

    useEffect(() => {
        if (!currentBounds) return;
        const nextVisible = allListings.filter((listing) =>
            currentBounds.contains([listing.lat, listing.lng])
        );
        setVisibleListings(nextVisible);
        setHasPanned(false);
    }, [currentBounds, allListings]);

    return (
        <div className="anylet-map-page fixed inset-0 z-10 bg-[#F9FAFB] md:relative md:inset-auto md:z-auto md:h-[calc(100vh-72px)]">
            <div className="flex h-full w-full flex-col md:flex-row">
                    <section className="relative h-full w-full md:w-[58%]">
                        {/* Premium unified top bar — mobile only */}
                        <MobileMapTopBar
                            value={filters.searchTerm}
                            onChange={(val) => setFilters({ ...filters, searchTerm: val })}
                            onLocationSelect={(coords) => setFlyToTarget(coords)}
                            filters={filters}
                            setFilters={setFilters}
                            activeLayer={activeLayer}
                            setActiveLayer={setActiveLayer}
                        />
                        <MapView
                            allListings={allListings}
                            listings={filteredVisibleListings}
                            isLoading={isLoading}
                            selectedListingId={selectedListingId}
                            hoveredListingId={hoveredListingId}
                            setSelectedListingId={setSelectedListingId}
                            setVisibleListings={setVisibleListings}
                            setHasPanned={setHasPanned}
                            setCurrentBounds={setCurrentBounds}
                            showToast={setToastMessage}
                            activeLayer={activeLayer}
                            flyToTarget={flyToTarget}
                        >
                            {/* Desktop-only filter pills inside map overlay */}
                            <div className="hidden md:block">
                                <FilterBar
                                    filters={filters}
                                    setFilters={setFilters}
                                    activeLayer={activeLayer}
                                    setActiveLayer={setActiveLayer}
                                    topOffsetClass="top-4"
                                />
                            </div>
                        </MapView>
                    </section>

                    <aside className="hidden h-full w-[42%] flex-col overflow-y-auto bg-[#F9FAFB] md:flex border-l border-slate-200">
                        <div className="sticky top-0 z-10 border-b border-[#E5E7EB] bg-[#F9FAFB]/95 px-5 py-4 backdrop-blur flex flex-col gap-3">
                            <MapSearchBar 
                                value={filters.searchTerm} 
                                onChange={(val) => setFilters({ ...filters, searchTerm: val })}
                                onLocationSelect={(coords) => setFlyToTarget(coords)}
                            />
                            <p className="text-sm font-semibold text-[#111827]">
                                {filteredVisibleListings.length} properties in this area
                            </p>
                        </div>
                        <div className="grid grid-cols-2 gap-3 p-4">
                            {isLoading
                                ? Array.from({ length: 6 }).map((_, index) => <ListingSkeleton key={index} />)
                                : filteredVisibleListings.map((listing) => (
                                    <ListingCard
                                        key={listing.id}
                                        listing={listing}
                                        compact={true}
                                        isActive={hoveredListingId === listing.id || selectedListingId === listing.id}
                                        onMouseEnter={() => setHoveredListingId(listing.id)}
                                        onMouseLeave={() => setHoveredListingId(null)}
                                    />
                                ))}
                        </div>
                    </aside>

                    {/* Floating Button (Mobile Only) */}
                    <div className="fixed bottom-[calc(4.5rem+max(env(safe-area-inset-bottom),0.5rem))] left-4 z-[1000] md:hidden">
                        <button
                            onClick={() => setIsMobileModalOpen(true)}
                            className="flex items-center gap-2 bg-primary px-6 py-3.5 rounded-2xl text-white font-black text-sm shadow-[0_8px_30px_rgb(26,34,127,0.3)] hover:scale-105 active:scale-95 transition-all"
                        >
                            <List size={18} />
                            {filteredVisibleListings.length} available
                        </button>
                    </div>

                    {/* Premium Listings Modal (Mobile Only) */}
                    <AnimatePresence>
                        {isMobileModalOpen && (
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                className="fixed inset-0 z-[2000] bg-slate-900/40 backdrop-blur-sm md:hidden"
                                onClick={() => setIsMobileModalOpen(false)}
                            >
                                <motion.div
                                    initial={{ y: '100%' }}
                                    animate={{ y: 0 }}
                                    exit={{ y: '100%' }}
                                    transition={{ type: 'spring', damping: 26, stiffness: 220 }}
                                    className="absolute inset-x-0 bottom-0 top-16 flex flex-col overflow-hidden rounded-t-[32px] bg-[#F9FAFB] shadow-[0_-20px_40px_rgba(0,0,0,0.2)]"
                                    onClick={(e) => e.stopPropagation()}
                                >
                                    <div className="sticky top-0 z-10 border-b border-[#E5E7EB] bg-[#F9FAFB]/95 px-5 py-4 backdrop-blur flex flex-col gap-4">
                                        <div className="flex items-center justify-between">
                                            <h2 className="text-lg font-black text-slate-900">
                                                {filteredVisibleListings.length} properties
                                            </h2>
                                            <button
                                                onClick={() => setIsMobileModalOpen(false)}
                                                className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-200 text-slate-600 transition-colors hover:bg-slate-300 active:scale-95"
                                            >
                                                <X size={18} />
                                            </button>
                                        </div>
                                        <MapSearchBar 
                                            value={filters.searchTerm} 
                                            onChange={(val) => setFilters({ ...filters, searchTerm: val })}
                                            onLocationSelect={(coords) => {
                                                setFlyToTarget(coords);
                                                setIsMobileModalOpen(false);
                                            }}
                                        />
                                    </div>
                                    <div className="flex-1 overflow-y-auto px-4 py-4 pb-8">
                                        <div className="grid grid-cols-2 gap-3">
                                            {isLoading
                                                ? Array.from({ length: 6 }).map((_, index) => <ListingSkeleton key={index} />)
                                                : filteredVisibleListings.map((listing) => (
                                                    <ListingCard
                                                        key={listing.id}
                                                        listing={listing}
                                                        compact={true}
                                                        isActive={hoveredListingId === listing.id || selectedListingId === listing.id}
                                                        onMouseEnter={() => setHoveredListingId(listing.id)}
                                                        onMouseLeave={() => setHoveredListingId(null)}
                                                    />
                                                ))}
                                        </div>
                                    </div>
                                </motion.div>
                            </motion.div>
                        )}
                    </AnimatePresence>
            </div>

            <Toast message={toastMessage} onClose={() => setToastMessage('')} />
        </div>
    );
}
