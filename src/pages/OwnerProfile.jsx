import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { doc, getDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../firebase';
import { ArrowLeft, MapPin, Maximize, User2 } from 'lucide-react';
import PropertyCard from '../components/PropertyCard';
import PropertyLoader from '../components/PropertyLoader';

export default function OwnerProfile() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [owner, setOwner] = useState(null);
    const [properties, setProperties] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchOwnerAndProperties = async () => {
            try {
                const ownerDoc = await getDoc(doc(db, 'users', id));
                if (ownerDoc.exists()) {
                    setOwner({ id: ownerDoc.id, ...ownerDoc.data() });
                }

                // Fetch owner's properties
                // Sometimes the field is ownerId, sometimes userId
                const q1 = query(collection(db, 'properties'), where('ownerId', '==', id), where('isApproved', '==', true));
                const q2 = query(collection(db, 'properties'), where('userId', '==', id), where('isApproved', '==', true));
                
                const [snap1, snap2] = await Promise.all([getDocs(q1), getDocs(q2)]);
                const propsMap = new Map();
                
                snap1.forEach(doc => propsMap.set(doc.id, { id: doc.id, ...doc.data() }));
                snap2.forEach(doc => propsMap.set(doc.id, { id: doc.id, ...doc.data() }));
                
                setProperties(Array.from(propsMap.values()));
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        };

        if (id) fetchOwnerAndProperties();
    }, [id]);

    if (loading) return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center">
            <PropertyLoader />
        </div>
    );

    if (!owner) return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center p-6 text-center">
            <h1 className="text-2xl font-black">User not found</h1>
        </div>
    );

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950 pb-20">
            <div className="max-w-7xl mx-auto px-4 md:px-6 py-6 md:py-8">
                <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-slate-500 hover:text-primary transition-colors mb-8 font-bold">
                    <ArrowLeft size={20} /> Back
                </button>

                {/* Profile Header */}
                <div className="bg-white dark:bg-slate-900 rounded-[40px] p-8 md:p-12 mb-10 shadow-sm border border-slate-100 dark:border-slate-800 flex flex-col md:flex-row items-center gap-8">
                    <div className="size-32 rounded-full bg-[#1a227f] text-white flex items-center justify-center text-5xl font-black shrink-0 shadow-md">
                        {owner.fullName ? owner.fullName[0].toUpperCase() : (owner.name ? owner.name[0].toUpperCase() : 'O')}
                    </div>
                    <div className="text-center md:text-left">
                        <h1 className="text-3xl md:text-4xl font-black text-slate-900 dark:text-white mb-2">{owner.fullName || owner.name || 'Property Owner'}</h1>
                        <p className="text-lg font-bold text-slate-500 mb-4">{owner.role === 'admin' ? 'Platform Admin' : 'Property Owner / Agent'}</p>
                        <div className="inline-flex items-center gap-2 px-4 py-2 bg-slate-100 dark:bg-slate-800 rounded-xl font-bold text-sm text-slate-600 dark:text-slate-300">
                            Member since {
                                owner.createdAt 
                                ? (owner.createdAt.toDate ? owner.createdAt.toDate().getFullYear() : new Date(owner.createdAt).getFullYear())
                                : '2026'
                            }
                        </div>
                    </div>
                </div>

                {/* Owner's Listings */}
                <h2 className="text-2xl font-black mb-6 mt-12 px-2">Listings by {owner.fullName?.split(' ')[0] || owner.name?.split(' ')[0] || 'this owner'}</h2>
                {properties.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {properties.map(property => (
                            <PropertyCard key={property.id} property={property} />
                        ))}
                    </div>
                ) : (
                    <div className="p-12 text-center bg-white dark:bg-slate-900 rounded-3xl border border-slate-100 dark:border-slate-800">
                        <p className="text-lg font-bold text-slate-400">No active properties found.</p>
                    </div>
                )}
            </div>
        </div>
    );
}
