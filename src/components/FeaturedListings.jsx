import { useState, useEffect } from 'react';
import { collection, query, getDocs, where, limit } from 'firebase/firestore';
import { db } from '../firebase';
import useSavedProperties from '../hooks/useSavedProperties';
import useInfiniteScroll from '../hooks/useInfiniteScroll';
import logger from '../utils/logger';
import PropertyCard, { PropertyCardSkeleton } from './patterns/PropertyCard';
import Grid from './layout/Grid';
import { EmptyState, Spinner, Icon } from './ui';

// Module-level cache so we don't re-fetch on re-mount
let _cachedListings = null;
let _cachePromise = null;

async function fetchAllApprovedListings() {
    if (_cachedListings) return _cachedListings;
    if (_cachePromise) return _cachePromise;

    _cachePromise = getDocs(
        query(collection(db, 'properties'), where('isApproved', '==', true), limit(200))
    ).then(snapshot => {
        _cachedListings = snapshot.docs.map(doc => {
            const data = doc.data();
            return {
                id: doc.id,
                ...data,
                image: data.image || data.imageUrl || data.image_url || (data.images && data.images[0]),
            };
        });
        return _cachedListings;
    }).catch(err => {
        _cachePromise = null; // allow retry on error
        throw err;
    });

    return _cachePromise;
}

export default function FeaturedListings({ category = 'All', division = '' }) {
    const [allListings, setAllListings] = useState(_cachedListings || []);
    const [loading, setLoading] = useState(!_cachedListings);
    const [displayCount, setDisplayCount] = useState(12);
    const { toggleSaveProperty, isPropertySaved } = useSavedProperties();

    const { sentinelRef } = useInfiniteScroll(() => {
        setDisplayCount(prev => prev + 12);
    });

    useEffect(() => {
        // Reset visible count when the active filter changes.
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setDisplayCount(12);
    }, [category, division]);

    useEffect(() => {
        // State is already hydrated from the module cache via the useState
        // initializers; only fetch when the cache is cold. setState here runs in
        // async callbacks, not synchronously in the effect body.
        if (_cachedListings) return;
        fetchAllApprovedListings()
            .then(listings => {
                setAllListings(listings);
                setLoading(false);
            })
            .catch(error => {
                logger.error("Error fetching featured listings:", error);
                setLoading(false);
            });
    }, []);

    const yearAgo = new Date();
    yearAgo.setDate(yearAgo.getDate() - 365);

    const listings = allListings
        .filter(item => {
            const propDate = item.updatedAt?.toDate() || item.createdAt?.toDate() || new Date(0);
            const isNotExpired = propDate >= yearAgo;
            const matchesCategory = category === 'All' || item.type === category;
            const matchesDivision = !division || item.division === division;
            return isNotExpired && matchesCategory && matchesDivision;
        })
        .sort((a, b) => {
            const dateA = a.updatedAt?.toDate() || a.createdAt?.toDate() || new Date(0);
            const dateB = b.updatedAt?.toDate() || b.createdAt?.toDate() || new Date(0);
            return dateB - dateA;
        });

    if (loading) {
        return (
            <Grid cols={3} gap="md" className="px-4 lg:px-0">
                {Array.from({ length: 6 }).map((_, i) => <PropertyCardSkeleton key={i} />)}
            </Grid>
        );
    }

    if (listings.length === 0) {
        return (
            <EmptyState
                icon={<Icon name="home" />}
                title="No properties found"
                description="Be the first to post a rental listing in this area."
            />
        );
    }

    return (
        <div className="px-4 lg:px-0">
            <div className="mb-6 flex items-end justify-between gap-4">
                <div>
                    <h2 className="text-title-lg text-content">
                        {category === 'All' ? 'Latest' : category} properties
                        {division && <span className="text-primary"> in {division}</span>}
                    </h2>
                    <p className="mt-1 text-body-sm text-muted">
                        {listings.length} {listings.length === 1 ? 'listing' : 'listings'} matching your criteria
                    </p>
                </div>
            </div>

            <Grid cols={3} gap="md">
                {listings.slice(0, displayCount).map((listing) => (
                    <PropertyCard
                        key={listing.id}
                        property={listing}
                        saved={isPropertySaved(listing.id)}
                        onToggleSave={toggleSaveProperty}
                    />
                ))}
            </Grid>

            {listings.length > displayCount && (
                <div ref={sentinelRef} className="mt-8 flex h-12 items-center justify-center">
                    <Spinner className="text-primary" />
                </div>
            )}
        </div>
    );
}
