import { useState, useEffect } from 'react';
import { collection, query, onSnapshot, limit, orderBy } from 'firebase/firestore';
import { db } from '../firebase';
import { Link } from 'react-router-dom';
import { Sparkles, MapPin } from 'lucide-react';
import './PromotedAds.css';

export default function PromotedAds() {
    const [ads, setAds] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Fetch properties to promote. Using latest properties as a fallback for now.
        const q = query(
            collection(db, 'properties'),
            orderBy('createdAt', 'desc'),
            limit(5)
        );

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const adsData = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data(),
                image: doc.data().image || doc.data().imageUrl || (doc.data().images && doc.data().images[0])
            })).filter(ad => ad.isApproved !== false);

            setAds(adsData);
            setLoading(false);
        });

        return () => unsubscribe();
    }, []);

    if (loading || ads.length === 0) return null;

    return (
        <section className="promoted-section">
            <div className="flex items-center justify-between px-4 mb-4">
                <div className="flex items-center gap-2">
                    <Sparkles size={18} className="text-amber-500 fill-amber-500" />
                    <h3 className="font-black text-lg text-slate-900 dark:text-white uppercase tracking-tight">Featured Hotspots</h3>
                </div>
                <span className="text-[10px] font-black bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 px-2 py-1 rounded-lg uppercase tracking-widest">Sponsored</span>
            </div>

            <div className="promoted-slider no-scrollbar">
                {ads.map(ad => (
                    <Link to={`/property/${ad.id}`} key={ad.id} className="promoted-card-wrapper">
                        <div className="promoted-card">
                            <div className="promoted-badge">HOT</div>
                            <img src={ad.image || 'https://images.unsplash.com/photo-1560518883-ce09059eeffa?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80'} alt={ad.title} className="promoted-img" />
                            <div className="promoted-overlay">
                                <div className="promoted-info">
                                    <h4 className="promoted-title truncate">{ad.title}</h4>
                                    <div className="promoted-meta">
                                        <div className="flex items-center gap-1">
                                            <MapPin size={10} />
                                            <span className="truncate">{ad.upazila || ad.location || 'Dhaka'}</span>
                                        </div>
                                        <span className="promoted-price">৳{Number(ad.rent).toLocaleString()}</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </Link>
                ))}
            </div>
        </section>
    );
}
