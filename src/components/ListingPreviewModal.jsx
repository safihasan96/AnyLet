import { useState, useEffect } from 'react';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { X, Building2, MapPin, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import Modal3D from './Modal3D';
import PropertyLoader from './PropertyLoader';
import logger from '../utils/logger';

export default function ListingPreviewModal({ isOpen, request, onClose }) {
    const [property, setProperty] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!isOpen || !request?.propertyId) return;

        const fetchProperty = async () => {
            setLoading(true);
            try {
                const docRef = doc(db, 'properties', request.propertyId);
                const docSnap = await getDoc(docRef);
                if (docSnap.exists()) {
                    setProperty({ id: docSnap.id, ...docSnap.data() });
                }
            } catch (error) {
                logger.error("Error fetching property:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchProperty();
    }, [isOpen, request]);

    const displayImage = property?.images?.[0] || request?.propertyImage || null;
    const title = property?.title || request?.propertyName || 'Unknown Property';
    const price = property?.rent || property?.price || null;

    return (
        <Modal3D isOpen={isOpen && !!request} onClose={onClose} className="max-w-sm" zIndex={100}>
            <div className="bg-white dark:bg-slate-800 rounded-3xl overflow-hidden shadow-2xl">
                <div className="relative h-48 w-full bg-slate-100 dark:bg-slate-700 flex items-center justify-center overflow-hidden">
                    {displayImage ? (
                        <img src={displayImage} alt={title} className="w-full h-full object-cover" />
                    ) : (
                        <Building2 size={48} className="text-slate-300 dark:text-slate-600" />
                    )}
                    <button
                        onClick={onClose}
                        className="absolute top-3 right-3 w-8 h-8 flex items-center justify-center rounded-full bg-black/20 text-white backdrop-blur hover:bg-black/40 transition-colors"
                    >
                        <X size={18} />
                    </button>
                    {!loading && price && (
                        <div className="absolute bottom-3 left-3 bg-[#3E2B88] text-white px-3 py-1.5 rounded-xl font-black text-sm shadow-lg shadow-[#3E2B88]/20">
                            ৳ {price.toLocaleString()}<span className="opacity-80 ml-1 text-[10px]">/MO</span>
                        </div>
                    )}
                </div>

                <div className="p-5">
                    {loading ? (
                        <PropertyLoader />
                    ) : (
                        <>
                            <h3 className="font-black text-lg text-slate-900 dark:text-white leading-tight mb-2">
                                {title}
                            </h3>
                            {property && (
                                <div className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400 text-sm mb-5">
                                    <MapPin size={14} className="text-[#3E2B88]" />
                                    <span className="font-semibold">{property.location || property.upazila || property.district || 'Location unavailable'}</span>
                                </div>
                            )}

                            <Link
                                to={`/property/${request.propertyId}`}
                                onClick={onClose}
                                className="w-full flex items-center justify-center gap-2 bg-[#3E2B88] text-white font-bold py-3.5 rounded-2xl transition-transform active:scale-95 shadow-md shadow-[#3E2B88]/20"
                            >
                                View Listing <ArrowRight size={18} />
                            </Link>
                        </>
                    )}
                </div>
            </div>
        </Modal3D>
    );
}
