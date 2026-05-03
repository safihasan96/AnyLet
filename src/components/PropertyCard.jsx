import { Link } from 'react-router-dom';
import { MapPin, Bed, DoorOpen, Building2, Star, Heart, Zap } from 'lucide-react';
import useSavedProperties from '../hooks/useSavedProperties';

export default function PropertyCard({ property }) {
    const { id, title, rent, area, beds, baths, sqft, image, type, verified, utilitiesCost } = property;
    const { toggleSaveProperty, isPropertySaved } = useSavedProperties();
    const isSaved = isPropertySaved(id);

    // Fallbacks
    const displayRent = rent || property.price || 0;
    const displayImage = image || property.imageUrl || 'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=800&q=80';
    const displayLocation = property.upazila || property.area || property.district || 'Dhaka';

    return (
        <Link to={`/property/${id}`} className="group flex flex-col bg-white dark:bg-slate-800 rounded-3xl overflow-hidden shadow-sm border border-slate-100 dark:border-slate-700 transition-all hover:shadow-xl hover:shadow-primary/5 active:scale-[0.98]">
            <div className="relative h-56 w-full overflow-hidden">
                <img className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" src={displayImage} alt={title} />
                <div className="absolute top-4 right-4">
                    <button
                        className={`size-10 rounded-xl bg-white/90 backdrop-blur flex items-center justify-center shadow-sm transition-transform hover:scale-110 active:scale-95 ${isSaved ? 'text-rose-500' : 'text-slate-400 hover:text-rose-500'}`}
                        onClick={(e) => toggleSaveProperty(id, e)}
                    >
                        <Heart size={20} fill={isSaved ? "currentColor" : "none"} strokeWidth={isSaved ? 0 : 2} />
                    </button>
                </div>
                <div className="absolute bottom-4 left-4 bg-primary text-white px-4 py-2 rounded-xl font-black text-sm shadow-lg shadow-primary/20">
                    ৳ {displayRent.toLocaleString()}<span className="text-[10px] opacity-80 ml-1 font-bold">/MO</span>
                </div>
                {verified && (
                    <div className="absolute top-4 left-4 bg-white/90 backdrop-blur text-emerald-600 px-3 py-1.5 rounded-lg font-black text-[10px] uppercase tracking-wider flex items-center gap-1 shadow-sm border border-emerald-100">
                        <Star size={12} className="fill-emerald-600" />
                        Verified
                    </div>
                )}
            </div>
            <div className="p-5">
                <div className="flex justify-between items-start mb-2">
                    <h4 className="font-black text-xl text-slate-900 dark:text-white leading-tight truncate">{title}</h4>
                    <span className="bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 px-2 py-1 rounded-md text-[10px] font-black uppercase tracking-widest">{type}</span>
                </div>
                <div className="flex items-center gap-1 text-slate-500 dark:text-slate-400 text-sm mb-1">
                    <MapPin size={14} className="text-primary" />
                    <span className="font-semibold">{displayLocation}{property.district ? `, ${property.district}` : ''}</span>
                </div>

                {utilitiesCost > 0 && (
                    <div className="flex items-center gap-1.5 text-amber-600 dark:text-amber-400 text-[10px] font-black uppercase tracking-wider mb-4">
                        <Zap size={12} strokeWidth={3} />
                        Service Charge: ৳{utilitiesCost.toLocaleString()}
                    </div>
                )}

                <div className="flex items-center justify-between border-t border-slate-50 dark:border-slate-700/50 pt-4">
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
                        <div className="flex items-center gap-1.5 text-slate-700 dark:text-slate-300">
                            <div className="bg-slate-100 dark:bg-slate-700 p-1.5 rounded-lg text-primary">
                                <Building2 size={16} />
                            </div>
                            <span className="text-xs font-black">{sqft || property.area || property.sqft || 'N/A'} {(sqft || property.area || property.sqft) ? 'sqft' : ''}</span>
                        </div>
                    </div>
                </div>
            </div>
        </Link>
    );
}
