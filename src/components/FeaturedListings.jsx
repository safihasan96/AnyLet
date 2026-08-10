import { useState, useEffect } from 'react';
import { collection, query, getDocs, where, limit } from 'firebase/firestore';
import { db } from '../firebase';
import PropertyCard from './PropertyCard';
import { PropertyCardSkeleton } from './Skeleton';
import useInfiniteScroll from '../hooks/useInfiniteScroll';
import { motion, AnimatePresence } from 'framer-motion';
import logger from '../utils/logger';

const gridVariants = {
    hidden: { opacity: 0 },
    visible: {
        opacity: 1,
        transition: {
            staggerChildren: 0.1,
        },
    },
};

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

    const { sentinelRef } = useInfiniteScroll(() => {
        setDisplayCount(prev => prev + 12);
    });

    useEffect(() => {
        setDisplayCount(12);
    }, [category, division]);

    useEffect(() => {
        if (_cachedListings) {
            setAllListings(_cachedListings);
            setLoading(false);
            return;
        }
        setLoading(true);
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
            <div className="px-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-8">
                {[1, 2, 3].map(i => (
                    <PropertyCardSkeleton key={i} />
                ))}
            </div>
        );
    }

    if (listings.length === 0) {
        return (
            <div className="px-4 py-20 text-center flex flex-col items-center gap-4">
                <div className="bg-slate-100 dark:bg-slate-800 p-8 rounded-full">
                    <span className="text-4xl">🏠</span>
                </div>
                <div>
                    <h4 className="text-slate-900 dark:text-white font-black text-xl mb-1">No Properties Found</h4>
                    <p className="text-slate-500 text-sm max-w-[250px] mx-auto">Be the first one to post a rental requirement or listing in this area!</p>
                </div>
            </div>
        );
    }

    return (
        <div className="px-4 py-8">
            <div className="flex flex-col gap-2 mb-8">
                <div className="flex items-center justify-between">
                    <h3 className="font-black text-2xl text-slate-900 dark:text-white uppercase tracking-tight">
                        {category === 'All' ? 'Latest' : category} Properties
                        {division && <span className="text-primary dark:text-indigo-400 font-bold ml-2">in {division}</span>}
                    </h3>
                    <div className="hidden md:block h-1 bg-primary w-20 rounded-full"></div>
                </div>
                <p className="text-slate-500 text-sm font-medium">
                    Found {listings.length} {listings.length === 1 ? 'listing' : 'listings'} matching your criteria
                </p>
            </div>
            <motion.div
                variants={gridVariants}
                initial="hidden"
                animate="visible"
                className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
            >
                <AnimatePresence mode="popLayout">
                    {listings.slice(0, displayCount).map((listing) => (
                        <PropertyCard key={listing.id} property={listing} />
                    ))}
                </AnimatePresence>
            </motion.div>
            {listings.length > displayCount && (
                <div ref={sentinelRef} className="h-12 flex items-center justify-center mt-8">
                    <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
                </div>
            )}
        </div>
    );
}
