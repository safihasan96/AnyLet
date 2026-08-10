import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { collection, query, where, documentId, getDocs, limit } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../contexts/AuthContext';
import { Heart, ArrowLeft, Building2 } from 'lucide-react';
import PropertyCard from '../components/PropertyCard';
import { PropertyCardSkeleton } from '../components/Skeleton';
import useSavedProperties from '../hooks/useSavedProperties';
import logger from '../utils/logger';
import { Helmet } from 'react-helmet-async';

// ✅ F-08: max 10 per 'in' batch (Firestore limit) × up to 10 batches = 100 max favorites
const FAVORITES_BATCH_SIZE = 10;
const MAX_FAVORITES_BATCHES = 10;

export default function Favorites() {
    const { currentUser } = useAuth();
    const navigate = useNavigate();
    const [favorites, setFavorites] = useState([]);
    const [loading, setLoading] = useState(true);
    const { savedProperties, loading: hookLoading } = useSavedProperties();

    useEffect(() => {
        if (!currentUser || hookLoading) return;

        async function fetchFavorites() {
            if (savedProperties.length === 0) {
                setFavorites([]);
                setLoading(false);
                return;
            }

            try {
                // Batch into groups of 10 (Firestore 'in' query limit)
                const allIds = savedProperties.slice(0, FAVORITES_BATCH_SIZE * MAX_FAVORITES_BATCHES);
                const batches = [];
                for (let i = 0; i < allIds.length; i += FAVORITES_BATCH_SIZE) {
                    batches.push(allIds.slice(i, i + FAVORITES_BATCH_SIZE));
                }

                let fetchedProperties = [];

                for (const batch of batches) {
                    // ✅ F-08: each batch is inherently limited to 10 by Firestore 'in' constraint
                    const q = query(
                        collection(db, "properties"),
                        where(documentId(), 'in', batch),
                        limit(FAVORITES_BATCH_SIZE)
                    );
                    const querySnapshot = await getDocs(q);
                    const props = querySnapshot.docs.map(doc => ({
                        id: doc.id,
                        ...doc.data()
                    }));
                    fetchedProperties = [...fetchedProperties, ...props];
                }

                setFavorites(fetchedProperties);
            } catch (error) {
                logger.error("Error fetching favorite properties:", error);
            } finally {
                setLoading(false);
            }
        }

        fetchFavorites();
    }, [currentUser, hookLoading, savedProperties]);

    if (loading || hookLoading) return (
        <div className="flex flex-col min-h-screen bg-background-light dark:bg-background-dark pb-32">
            <header className="p-6 bg-white dark:bg-slate-900 border-b border-slate-100 dark:border-slate-800 flex items-center justify-center">
                <h1 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-tight">Saved Properties</h1>
            </header>
            <div className="p-5 flex-1 grid grid-cols-1 gap-6">
                <PropertyCardSkeleton />
                <PropertyCardSkeleton />
                <PropertyCardSkeleton />
            </div>
        </div>
    );

    return (
        <div className="flex flex-col min-h-screen bg-background-light dark:bg-background-dark pb-32">
            <Helmet><title>Saved Properties | Any-Let</title></Helmet>
            <header className="p-6 bg-white dark:bg-slate-900 border-b border-slate-100 dark:border-slate-800 flex items-center justify-center">
                <h1 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-tight">Saved Properties</h1>
            </header>

            <div className="p-5 flex-1 flex flex-col">
                {favorites.length > 0 ? (
                    <div className="grid grid-cols-1 gap-6">
                        {favorites.map(property => (
                            <PropertyCard key={property.id} property={property} />
                        ))}
                    </div>
                ) : (
                    <div className="flex-1 flex flex-col items-center justify-center text-center space-y-6 pt-20">
                        <div className="size-24 bg-rose-50 dark:bg-rose-950/30 rounded-full flex items-center justify-center text-rose-500 shadow-xl shadow-rose-500/10">
                            <Heart size={48} className="fill-rose-500" />
                        </div>
                        <div>
                            <h2 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-tight mb-2">Nothing Saved Yet</h2>
                            <p className="text-slate-400 font-bold text-xs uppercase tracking-widest px-10">Tap the heart on a property to save it for later review.</p>
                        </div>
                        <button
                            onClick={() => navigate('/search')}
                            className="bg-primary text-white font-black px-8 py-4 rounded-2xl shadow-xl shadow-primary/20 uppercase tracking-widest text-xs transition-transform active:scale-95"
                        >
                            Explore Properties
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}
