import { useState, useEffect } from 'react';
import { collection, query, onSnapshot, orderBy } from 'firebase/firestore';
import { db } from '../firebase';
import PropertyCard from './PropertyCard';

import { motion } from 'framer-motion';

export default function FeaturedListings() {
    const [listings, setListings] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const q = query(
            collection(db, 'properties'),
            orderBy('createdAt', 'desc')
        );

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const listingsData = snapshot.docs
                .map(doc => {
                    const data = doc.data();
                    return {
                        id: doc.id,
                        ...data,
                        image: data.image || data.imageUrl || (data.images && data.images[0]),
                        isApproved: data.isApproved !== false
                    };
                })
                .filter(item => item.isApproved);

            setListings(listingsData);
            setLoading(false);
        }, (error) => {
            console.error("Error fetching featured listings:", error);
            setLoading(false);
        });

        return () => unsubscribe();
    }, []);

    if (loading) {
        return (
            <div className="px-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-8">
                {[1, 2, 3].map(i => (
                    <div key={i} className="h-72 bg-slate-100 dark:bg-slate-800 rounded-3xl animate-pulse" />
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
            <div className="flex items-center justify-between mb-8">
                <h3 className="font-black text-2xl text-slate-900 dark:text-white uppercase tracking-tight">Latest Properties</h3>
                <div className="h-1 bg-primary w-20 rounded-full"></div>
            </div>
            <motion.div 
                layout 
                className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.5 }}
            >
                {listings.map((listing, index) => (
                    <motion.div
                        key={listing.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.1 }}
                    >
                        <PropertyCard property={listing} />
                    </motion.div>
                ))}
            </motion.div>
        </div>
    );
}
