import { Link } from 'react-router-dom';
import { MapPin, Bed, DoorOpen, Building2, Star, Heart, Zap, CheckCircle2, Clock, Lock, ShieldCheck, ChevronLeft, ChevronRight } from 'lucide-react';
import useSavedProperties from '../hooks/useSavedProperties';
import { motion, AnimatePresence } from 'framer-motion';
import { useState } from 'react';
import { getOptimizedImageUrl } from '../utils/imageUtils';

// ── Variants (all decoupled from JSX per framer-motion-expert skill) ──────────

const cardVariants = {
    hidden: { opacity: 0, scale: 0.9 },
    visible: { 
        opacity: 1, 
        scale: 1, 
        transition: { type: 'spring', stiffness: 80, damping: 20 } 
    },
    exit: { 
        opacity: 0, 
        scale: 0.9, 
        transition: { duration: 0.2 } 
    },
};

const heartVariants = {
    unsaved: { scale: 1, rotate: 0 },
    saved: { 
        scale: [1, 1.5, 0.85, 1.15, 1],
        rotate: [0, -15, 10, -5, 0],
        transition: { duration: 0.5, times: [0, 0.2, 0.5, 0.7, 1] },
    },
};

export default function PropertyCard({ property }) {
    const { id, title, rent, area, beds, baths, sqft, image, type, isVerified, utilitiesCost } = property;
    const { toggleSaveProperty, isPropertySaved } = useSavedProperties();
    const isSaved = isPropertySaved(id);
    const [activeImageIndex, setActiveImageIndex] = useState(0);

    // Get up to 3 images for the slider
    const allImages = property?.images?.length > 0 ? property.images : [image || property.imageUrl];
    const displayImages = allImages.filter(Boolean).slice(0, 3);
    const hasMultipleImages = displayImages.length > 1;

    const nextImage = (e) => {
        e.preventDefault(); // Prevent Link navigation
        e.stopPropagation();
        setActiveImageIndex((prev) => (prev === displayImages.length - 1 ? 0 : prev + 1));
    };

    const prevImage = (e) => {
        e.preventDefault(); // Prevent Link navigation
        e.stopPropagation();
        setActiveImageIndex((prev) => (prev === 0 ? displayImages.length - 1 : prev - 1));
    };

    // Fallbacks
    const displayRent = rent || property.price || 0;
    
    const locationParts = [property.addressDetails, property.upazila, property.district].filter(Boolean);
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
        } catch (e) { return ''; }
    };

    return (
        <motion.div
            layout
            variants={cardVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            whileHover={{ y: -5, scale: 1.01 }}
            whileTap={{ scale: 0.98 }}
            transition={{ type: 'spring', stiffness: 400, damping: 25 }}
            className="h-full will-change-transform"
        >
            <Link
                to={`/property/${id}`}
                className="h-full group flex flex-col bg-white dark:bg-[#1A1D24] rounded-3xl overflow-hidden shadow-sm border border-slate-100 dark:border-slate-800/70 hover:shadow-2xl hover:shadow-primary/10 transition-shadow lg:hover:border-primary/20"
            >
                {/* ── Image Slider ──────────────────────────────── */}
                <div className="relative h-56 w-full overflow-hidden group/slider bg-slate-100 dark:bg-slate-800 lg:h-52">
                    <AnimatePresence initial={false} mode="wait">
                        <motion.img
                            key={activeImageIndex}
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            transition={{ duration: 0.3 }}
                            loading="lazy"
                            className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                            src={getOptimizedImageUrl(displayImages[activeImageIndex] || 'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=800&q=80', 600)}
                            alt={title}
                        />
                    </AnimatePresence>

                    {hasMultipleImages && (
                        <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-black/40 to-transparent pointer-events-none z-10" />
                    )}

                    {/* Slider Controls */}
                    {hasMultipleImages && (
                        <>
                            <button
                                type="button"
                                onClick={prevImage}
                                aria-label="Previous photo"
                                className="absolute left-2 top-1/2 -translate-y-1/2 size-8 rounded-full bg-white/70 backdrop-blur-sm text-slate-700 flex items-center justify-center opacity-0 group-hover/slider:opacity-100 transition-opacity hover:bg-white shadow-sm z-20"
                            >
                                <ChevronLeft size={18} />
                            </button>
                            <button
                                type="button"
                                onClick={nextImage}
                                aria-label="Next photo"
                                className="absolute right-2 top-1/2 -translate-y-1/2 size-8 rounded-full bg-white/70 backdrop-blur-sm text-slate-700 flex items-center justify-center opacity-0 group-hover/slider:opacity-100 transition-opacity hover:bg-white shadow-sm z-20"
                            >
                                <ChevronRight size={18} />
                            </button>
                            {/* Pagination Dots */}
                            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-1.5 z-20">
                                {displayImages.map((_, idx) => (
                                    <div
                                        key={idx}
                                        className={`h-1.5 rounded-full transition-all ${
                                            idx === activeImageIndex ? 'bg-white w-4' : 'bg-white/60 w-1.5'
                                        }`}
                                    />
                                ))}
                            </div>
                        </>
                    )}

                    {/* Heart button */}
                    <div className="absolute top-4 right-4 z-20">
                        <motion.button
                            type="button"
                            aria-label={isSaved ? 'Remove from saved' : 'Save property'}
                            aria-pressed={isSaved}
                            animate={isSaved ? 'saved' : 'unsaved'}
                            variants={heartVariants}
                            whileHover={{ scale: 1.15 }}
                            whileTap={{ scale: 0.8 }}
                            className={`size-10 rounded-xl bg-white/95 flex items-center justify-center shadow-sm ${isSaved ? 'text-rose-500' : 'text-slate-400 hover:text-rose-500'}`}
                            onClick={(e) => toggleSaveProperty(id, e)}
                        >
                            <Heart size={20} fill={isSaved ? "currentColor" : "none"} strokeWidth={isSaved ? 0 : 2} />
                        </motion.button>
                    </div>

                    {/* Price */}
                    <motion.div
                        className="absolute bottom-4 left-4 bg-primary text-white px-4 py-2 rounded-xl font-black text-sm shadow-lg shadow-primary/20 z-20"
                        whileHover={{ scale: 1.05 }}
                        transition={{ type: 'spring', stiffness: 400 }}
                    >
                        ৳ {displayRent.toLocaleString()}<span className="text-[10px] opacity-80 ml-1 font-bold">/MO</span>
                    </motion.div>

                    {/* Badges */}
                    <div className="absolute top-4 left-4 flex flex-col gap-2 items-start z-20">
                        {isVerified && (
                            <div className="bg-white/95 text-emerald-600 px-3 py-1.5 rounded-lg font-black text-[10px] uppercase tracking-wider flex items-center gap-1 shadow-sm border border-emerald-100">
                                <ShieldCheck size={12} className="fill-emerald-600" /> Verified Landlord
                            </div>
                        )}
                        {property.reviewCount > 0 && (
                            <div className="bg-white/95 text-amber-600 px-3 py-1.5 rounded-lg font-black text-[10px] uppercase tracking-wider flex items-center gap-1 shadow-sm border border-amber-100">
                                <Star size={12} className="fill-amber-500" />
                                {Number(property.reviewScore || 0).toFixed(1)} ({property.reviewCount})
                            </div>
                        )}
                        {property.status && property.status !== 'Available' && (
                            <div className={`px-3 py-1.5 rounded-lg font-black text-[10px] uppercase tracking-wider shadow-sm flex items-center gap-1.5 border ${
                                property.status === 'Let Agreed' 
                                    ? 'bg-rose-500 text-white border-rose-400' 
                                    : property.status === 'Booked'
                                        ? 'bg-blue-500 text-white border-blue-400'
                                        : 'bg-amber-500 text-white border-amber-400'
                            }`}>
                                {property.status === 'Let Agreed' ? <CheckCircle2 size={12} strokeWidth={3} /> : property.status === 'Booked' ? <Lock size={12} strokeWidth={3} /> : <Clock size={12} strokeWidth={3} />}
                                {property.status}
                            </div>
                        )}
                    </div>
                </div>

                {/* ── Card content ───────────────────────────────────────────── */}
                <div className="p-5 flex flex-col flex-1">
                    <div className="flex justify-between items-start gap-3 mb-2">
                        <h4 className="font-black text-xl text-slate-900 dark:text-white leading-tight line-clamp-2 flex-1" title={title}>{title}</h4>
                        <span className="bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 px-2 py-1 rounded-md text-[10px] font-black uppercase tracking-widest shrink-0">{type}</span>
                    </div>
                    <div className="flex items-start gap-1.5 text-slate-500 dark:text-slate-400 text-sm mb-2">
                        <MapPin size={14} className="text-primary dark:text-indigo-400 shrink-0 mt-0.5" />
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
                                <div className="bg-slate-100 dark:bg-slate-700 p-1.5 rounded-lg text-primary dark:text-indigo-400">
                                    <Bed size={16} />
                                </div>
                                <span className="text-xs font-black">{beds} Bed</span>
                            </div>
                            <div className="flex items-center gap-1.5 text-slate-700 dark:text-slate-300">
                                <div className="bg-slate-100 dark:bg-slate-700 p-1.5 rounded-lg text-primary dark:text-indigo-400">
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
