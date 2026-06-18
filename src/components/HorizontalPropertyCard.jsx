import { Link } from 'react-router-dom';
import { MapPin, Bed, DoorOpen, Building2, Heart, Star, CheckCircle2, Clock, Lock, ShieldCheck } from 'lucide-react';
import useSavedProperties from '../hooks/useSavedProperties';
import { motion } from 'framer-motion';

// ── Variants (fully decoupled from JSX) ───────────────────────────────────────

const cardVariants = {
    hidden: { opacity: 0, x: 30, scale: 0.96 },
    visible: {
        opacity: 1,
        x: 0,
        scale: 1,
        transition: { type: 'spring', stiffness: 90, damping: 20 },
    },
    exit: {
        opacity: 0,
        x: -30,
        scale: 0.9,
        transition: { duration: 0.2 },
    },
};

const heartVariants = {
    unsaved: { scale: 1 },
    saved: { scale: [1, 1.4, 0.9, 1.1, 1], transition: { duration: 0.4 } },
};

export default function HorizontalPropertyCard({ property }) {
    const { id, title, rent, beds, baths, sqft, image, type, utilitiesCost, isVerified } = property;
    const { toggleSaveProperty, isPropertySaved } = useSavedProperties();
    const isSaved = isPropertySaved(id);

    // Fallbacks
    const displayRent = rent || property.price || 0;
    const displayImage = property?.images?.[0] || image || property.imageUrl || 'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=800&q=80';
    
    const locationParts = [
        property.streetAddress || property.address || property.location || property.area,
        property.upazila,
        property.district
    ].filter(Boolean);
    const displayLocation = locationParts.length > 0 ? locationParts.join(', ') : 'Dhaka, Bangladesh';

    return (
        <motion.div
            layout
            variants={cardVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.97 }}
            transition={{ type: 'spring', stiffness: 400, damping: 25 }}
            className="h-full will-change-transform"
        >
            <Link
                to={`/property/${id}`}
                className="h-full group flex bg-white dark:bg-slate-800 rounded-[28px] overflow-hidden shadow-sm border border-slate-100 dark:border-slate-700 hover:shadow-xl hover:shadow-indigo-500/5 p-3 gap-4 transition-shadow"
            >
                {/* Image Container with parallax depth */}
                <div className="relative h-[120px] w-[120px] shrink-0 overflow-hidden rounded-[20px]">
                    <img
                        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                        src={displayImage}
                        alt={title || 'Property'}
                    />
                    {property.status && property.status !== 'Available' && (
                        <div className={`absolute top-2 left-2 backdrop-blur-md px-2 py-1 rounded-lg font-black text-[8px] uppercase tracking-wider shadow-sm flex items-center gap-1 border ${
                            property.status === 'Let Agreed' 
                                ? 'bg-rose-500/80 text-white border-rose-400/50' 
                                : property.status === 'Booked'
                                    ? 'bg-blue-500/80 text-white border-blue-400/50'
                                    : 'bg-amber-500/80 text-white border-amber-400/50'
                        }`}>
                            {property.status === 'Let Agreed' ? <CheckCircle2 size={10} strokeWidth={3} /> : property.status === 'Booked' ? <Lock size={10} strokeWidth={3} /> : <Clock size={10} strokeWidth={3} />}
                            {property.status}
                        </div>
                    )}
                    <div className="absolute top-2 right-2">
                        <motion.button
                            animate={isSaved ? 'saved' : 'unsaved'}
                            variants={heartVariants}
                            whileHover={{ scale: 1.15 }}
                            whileTap={{ scale: 0.85 }}
                            className={`size-8 rounded-full bg-white/60 backdrop-blur-md flex items-center justify-center shadow-sm transition-colors ${isSaved ? 'text-rose-500' : 'text-slate-400 hover:text-rose-500'}`}
                            onClick={(e) => toggleSaveProperty(id, e)}
                        >
                            <Heart size={16} fill={isSaved ? "currentColor" : "none"} strokeWidth={isSaved ? 0 : 2.5} />
                        </motion.button>
                    </div>
                    {isVerified && (
                        <div className="absolute bottom-2 left-2 right-2 bg-white/90 backdrop-blur text-emerald-600 px-2 py-1.5 rounded-lg font-black text-[8px] uppercase tracking-wider flex items-center justify-center gap-1 shadow-sm border border-emerald-100">
                            <ShieldCheck size={10} className="fill-emerald-600 shrink-0" />
                            <span className="truncate">Verified Landlord</span>
                        </div>
                    )}
                    {property.reviewCount > 0 && !isVerified && (
                        <div className="absolute bottom-2 left-2 right-2 bg-white/90 backdrop-blur text-amber-600 px-2 py-1.5 rounded-lg font-black text-[8px] uppercase tracking-wider flex items-center justify-center gap-1 shadow-sm border border-amber-100">
                            <Star size={10} className="fill-amber-500 shrink-0" />
                            <span className="truncate">{Number(property.reviewScore || 0).toFixed(1)} ({property.reviewCount})</span>
                        </div>
                    )}
                </div>

                {/* Content Container */}
                <div className="flex flex-col justify-between py-1 pr-2 flex-1 min-w-0">
                    <div>
                        <div className="flex justify-between items-start gap-2 mb-1">
                            <h4 className="font-[800] text-[15px] text-slate-900 dark:text-white leading-tight line-clamp-2 flex-1" title={title || 'Property Title'}>{title || 'Property Title'}</h4>
                            <div className="flex flex-col items-end shrink-0 ml-2">
                                <div className="flex items-baseline gap-0.5">
                                    <motion.span
                                        className="font-[900] text-[15px] text-primary dark:text-indigo-400"
                                        whileHover={{ scale: 1.05 }}
                                        transition={{ type: 'spring', stiffness: 400 }}
                                    >
                                        ৳ {displayRent.toLocaleString()}
                                    </motion.span>
                                    <span className="text-[10px] font-bold text-slate-400">/mo</span>
                                </div>
                                {property.reviewCount > 0 && isVerified && (
                                    <div className="flex items-center gap-1 text-[10px] font-black text-amber-500 mt-1">
                                        <Star size={10} className="fill-amber-500" />
                                        {Number(property.reviewScore || 0).toFixed(1)} <span className="text-amber-500/60">({property.reviewCount})</span>
                                    </div>
                                )}
                            </div>
                        </div>

                        {utilitiesCost > 0 && (
                            <div className="text-[9px] font-black text-amber-600 dark:text-amber-400 uppercase tracking-widest mb-1">
                                + ৳{utilitiesCost.toLocaleString()} Service Charge
                            </div>
                        )}

                        <div className="flex items-start gap-1.5 text-slate-500 dark:text-slate-400 text-[13px] mb-3">
                            <MapPin size={14} className="shrink-0 mt-0.5" strokeWidth={2.5} />
                            <span className="font-semibold line-clamp-2" title={displayLocation}>{displayLocation}</span>
                        </div>
                    </div>

                    <div className="flex items-center gap-4 text-slate-600 dark:text-slate-300">
                        <div className="flex items-center gap-1.5">
                            <Bed size={14} strokeWidth={2.5} className="text-slate-400" />
                            <span className="text-xs font-[800]">{beds || 1} Bed</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                            <DoorOpen size={14} strokeWidth={2.5} className="text-slate-400" />
                            <span className="text-xs font-[800]">{baths || 1} Bath</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                            <Building2 size={14} strokeWidth={2.5} className="text-slate-400" />
                            <span className="text-xs font-[800]">{sqft || property.area || property.sqft || 'N/A'} ft²</span>
                        </div>
                    </div>
                </div>
            </Link>
        </motion.div>
    );
}
