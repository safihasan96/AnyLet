import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { collection, query, where, documentId, getDocs } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../contexts/AuthContext';
import { Heart, ArrowLeft, Building2 } from 'lucide-react';
import PropertyCard from '../components/PropertyCard';
import useSavedProperties from '../hooks/useSavedProperties';

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
                // Determine batches of 10 for 'in' query limitations
                const batches = [];
                for (let i = 0; i < savedProperties.length; i += 10) {
                    batches.push(savedProperties.slice(i, i + 10));
                }

                let fetchedProperties = [];

                for (const batch of batches) {
                    const q = query(
                        collection(db, "properties"),
                        where(documentId(), 'in', batch)
                    );
                    console.log("Executing query for batch:", batch);
                    const querySnapshot = await getDocs(q);
                    console.log("Query snapshot size:", querySnapshot.size);
                    const props = querySnapshot.docs.map(doc => ({
                        id: doc.id,
                        ...doc.data()
                    }));
                    fetchedProperties = [...fetchedProperties, ...props];
                }

                console.log("Total fetched favorites:", fetchedProperties.length);
                setFavorites(fetchedProperties);
            } catch (error) {
                console.error("Error fetching favorite properties:", error);
            } finally {
                setLoading(false);
            }
        }

        fetchFavorites();
    }, [currentUser, hookLoading, savedProperties]);

    if (loading || hookLoading) return <div className="p-20 text-center animate-pulse text-primary dark:text-indigo-400">Loading favorites...</div>;

    return (
        <div className="flex flex-col min-h-screen bg-background-light dark:bg-background-dark pb-32">
            <header className="p-6 bg-white dark:bg-slate-900 border-b border-slate-100 dark:border-slate-800 flex items-center gap-4">
                <button onClick={() => navigate(-1)} className="text-slate-700 dark:text-slate-300">
                    <ArrowLeft size={24} />
                </button>
                <h1 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-tight">Saved Properties</h1>
            </header>

            <div className="p-5 flex-1 flex flex-col">
                <div className="bg-slate-100 p-2 text-xs font-mono break-all text-slate-800">
                    DEBUG: savedProperties array = {JSON.stringify(savedProperties)} <br />
                    loading: {loading ? 'true' : 'false'},
                    hookLoading: {hookLoading ? 'true' : 'false'}
                </div>
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
