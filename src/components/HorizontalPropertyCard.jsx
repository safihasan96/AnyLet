import { Link } from 'react-router-dom';
import { MapPin, Bed, DoorOpen, Building2, Heart } from 'lucide-react';
import useSavedProperties from '../hooks/useSavedProperties';

export default function HorizontalPropertyCard({ property }) {
    const { id, title, rent, beds, baths, sqft, image, type, utilitiesCost } = property;
    const { toggleSaveProperty, isPropertySaved } = useSavedProperties();
    const isSaved = isPropertySaved(id);

    // Fallbacks
    const displayRent = rent || property.price || 0;
    const displayImage = image || property.imageUrl || 'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=800&q=80';
    const displayLocation = property.upazila || property.area || property.district || 'Dhaka';

    return (
        <Link to={`/property/${id}`} className="group flex bg-white dark:bg-slate-800 rounded-[28px] overflow-hidden shadow-sm border border-slate-100 dark:border-slate-700 transition-all hover:shadow-xl hover:shadow-[#3730a3]/5 active:scale-[0.98] p-3 gap-4">
            {/* Image Container */}
            <div className="relative h-[120px] w-[120px] shrink-0 overflow-hidden rounded-[20px]">
                <img className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" src={displayImage} alt={title || 'Property'} />
                <div className="absolute top-2 right-2">
                    <button
                        className={`size-8 rounded-full bg-white/60 backdrop-blur-md flex items-center justify-center shadow-sm transition-colors hover:scale-110 active:scale-95 ${isSaved ? 'text-rose-500' : 'text-slate-400 hover:text-rose-500'}`}
                        onClick={(e) => toggleSaveProperty(id, e)}
                    >
                        <Heart size={16} fill={isSaved ? "currentColor" : "none"} strokeWidth={isSaved ? 0 : 2.5} />
                    </button>
                </div>
            </div>

            {/* Content Container */}
            <div className="flex flex-col justify-between py-1 pr-2 flex-1 min-w-0">
                <div>
                    <div className="flex justify-between items-start gap-2 mb-1">
                        <h4 className="font-[800] text-[15px] text-slate-900 dark:text-white leading-tight truncate">{title || 'Property Title'}</h4>
                        <div className="flex items-baseline gap-0.5 shrink-0">
                            <span className="font-[900] text-[15px] text-primary dark:text-indigo-400">৳ {displayRent.toLocaleString()}</span>
                            <span className="text-[10px] font-bold text-slate-400">/mo</span>
                        </div>
                    </div>

                    {utilitiesCost > 0 && (
                        <div className="text-[9px] font-black text-amber-600 dark:text-amber-400 uppercase tracking-widest mb-1">
                            + ৳{utilitiesCost.toLocaleString()} Service Charge
                        </div>
                    )}

                    <div className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400 text-[13px] mb-3 truncate">
                        <MapPin size={14} className="shrink-0" strokeWidth={2.5} />
                        <span className="font-semibold truncate">{displayLocation}</span>
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
    );
}
