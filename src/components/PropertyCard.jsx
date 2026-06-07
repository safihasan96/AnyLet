import { Link } from 'react-router-dom';
import { MapPin, Bed, DoorOpen, Building2, Star, Heart, Zap, CheckCircle2, Clock, Lock } from 'lucide-react';
import useSavedProperties from '../hooks/useSavedProperties';
import { motion } from 'framer-motion';
import { popIn } from '../utils/animations';

export default function PropertyCard({ property }) {
    const { id, title, rent, area, beds, baths, sqft, image, type, isVerified, utilitiesCost } = property;
    const { toggleSaveProperty, isPropertySaved } = useSavedProperties();
    const isSaved = isPropertySaved(id);

    // Fallbacks
    const displayRent = rent || property.price || 0;
    const displayImage = property?.images?.[0] || image || property.imageUrl || 'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=800&q=80';
    
    const locationParts = [
        property.addressDetails,
        property.upazila,
        property.district
    ].filter(Boolean);
    const displayLocation = locationParts.length > 0 ? locationParts.join(', ') : 'Dhaka, Bangladesh';

    const formatTimeAgo = (timestamp) => {
        if (!timestamp) return '';
        try {
            const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
            const now = new Date();
            const diffInSeconds = Math.floor((now - date) / 1000);
            
            if (diffInSeconds < 60) return `${Math.max(0, diffInSeconds)}s`;
            if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}min`;
            if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h`;
            if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}d`;
            if (diffInSeconds < 2592000) return `${Math.floor(diffInSeconds / 604800)}w`;
            if (diffInSeconds < 31536000) return `${Math.floor(diffInSeconds / 2592000)}mo`;
            return `${Math.floor(diffInSeconds / 31536000)}y`;
        } catch (e) {
            return '';
        }
    };

    return (
        <motion.div
            variants={popIn}
            whileHover={{ y: -4, transition: { type: 'spring', stiffness: 350, damping: 26 } }}
            whileTap={{ scale: 0.98, transition: { duration: 0.12 } }}
            style={{ willChange: 'transform' }}
            className="h-full"
        >
            <Link to={`/property/${id}`} className="h-full group flex flex-col bg-white dark:bg-slate-800 rounded-3xl overflow-hidden shadow-sm border border-slate-100 dark:border-slate-700 transition-shadow hover:shadow-xl hover:shadow-primary/8">
                <div className="relative h-56 w-full overflow-hidden">
                    <img className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" src={displayImage} alt={title} />
                    <div className="absolute top-4 right-4">
                        <motion.button
                            className={`size-10 rounded-xl bg-white/90 backdrop-blur flex items-center justify-center shadow-sm ${isSaved ? 'text-rose-500' : 'text-slate-400 hover:text-rose-500'}`}
                            onClick={(e) => toggleSaveProperty(id, e)}
                            whileTap={{ scale: 0.82 }}
                            whileHover={{ scale: 1.1 }}
                            transition={{ type: 'spring', stiffness: 500, damping: 22 }}
                        >
                            <Heart size={20} fill={isSaved ? "currentColor" : "none"} strokeWidth={isSaved ? 0 : 2} />
                        </motion.button>
                    </div>
                    <div className="absolute bottom-4 left-4 bg-primary text-white px-4 py-2 rounded-xl font-black text-sm shadow-lg shadow-primary/20">
                        ৳ {displayRent.toLocaleString()}<span className="text-[10px] opacity-80 ml-1 font-bold">/MO</span>
                    </div>
                    <div className="absolute top-4 left-4 flex flex-col gap-2 items-start">
                        {isVerified && (
                            <div className="bg-white/90 backdrop-blur text-emerald-600 px-3 py-1.5 rounded-lg font-black text-[10px] uppercase tracking-wider flex items-center gap-1 shadow-sm border border-emerald-100">
                                <Star size={12} className="fill-emerald-600" />
                                Verified Landlord
                            </div>
                        )}
                        {property.status && property.status !== 'Available' && (
                            <div className={`backdrop-blur-md px-3 py-1.5 rounded-lg font-black text-[10px] uppercase tracking-wider shadow-sm flex items-center gap-1.5 border ${
                                property.status === 'Let Agreed' 
                                    ? 'bg-rose-500/80 text-white border-rose-400/50' 
                                    : property.status === 'Booked'
                                        ? 'bg-blue-500/80 text-white border-blue-400/50'
                                        : 'bg-amber-500/80 text-white border-amber-400/50'
                            }`}>
                                {property.status === 'Let Agreed' ? <CheckCircle2 size={12} strokeWidth={3} /> : property.status === 'Booked' ? <Lock size={12} strokeWidth={3} /> : <Clock size={12} strokeWidth={3} />}
                                {property.status}
                            </div>
                        )}
                    </div>
                </div>
                <div className="p-5 flex flex-col flex-1">
                    <div className="flex justify-between items-start gap-3 mb-2">
                        <h4 className="font-black text-xl text-slate-900 dark:text-white leading-tight line-clamp-2 flex-1" title={title}>{title}</h4>
                        <span className="bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 px-2 py-1 rounded-md text-[10px] font-black uppercase tracking-widest shrink-0">{type}</span>
                    </div>
                    <div className="flex items-start gap-1.5 text-slate-500 dark:text-slate-400 text-sm mb-2">
                        <MapPin size={14} className="text-primary shrink-0 mt-0.5" />
                        <span className="font-semibold line-clamp-2" title={displayLocation}>{displayLocation}</span>
                    </div>

                    {utilitiesCost > 0 && (
                        <div className="flex items-center gap-1.5 text-amber-600 dark:text-amber-400 text-[10px] font-black uppercase tracking-wider mb-4">
                            <Zap size={12} strokeWidth={3} />
                            Service Charge: ৳{utilitiesCost.toLocaleString()}
                        </div>
                    )}

                    <div className="flex items-center justify-between border-t border-slate-50 dark:border-slate-700/50 pt-4 mt-auto">
                        <div className="flex gap-4">
                            <div className="flex items-center gap-1.5 text-slate-700 dark:text-slate-300">
                                <div className="bg-slate-100 dark:bg-slate-700 p-1.5 rounded-lg text-primary">
                                    <Bed size={16} />
                                </div>
                                <span className="text-xs font-black">{beds} Bed</span>
                            </div>
                            <div className="flex items-center gap-1.5 text-slate-700 dark:text-slate-300">
                                <div className="bg-slate-100 dark:bg-slate-700 p-1.5 rounded-lg text-primary">
                                    <DoorOpen size={16} />
                                </div>
                                <span className="text-xs font-black">{baths} Bath</span>
                            </div>
                        </div>
                        <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest bg-slate-50 dark:bg-slate-900/50 px-2 py-1 rounded-md">
                            {formatTimeAgo(property.createdAt)} ago
                        </div>
                    </div>
                </div>
            </Link>
        </motion.div>
    );
}
