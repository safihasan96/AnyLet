import { motion } from 'framer-motion';
import { Building2, ArrowRight, DoorOpen, Bed, Bath, MapPin } from 'lucide-react';
import { sectionVariants, specCardVariants } from './motion';

function SpecItem({ icon, label, value }) {
    return (
        <motion.div
            variants={specCardVariants}
            initial="rest"
            whileHover="hover"
            className="flex items-start gap-3 bg-white dark:bg-[#1A1D24] p-3 rounded-2xl border border-slate-100 dark:border-slate-800/70 will-change-transform"
        >
            <div className="size-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary dark:text-indigo-400 shrink-0">
                {icon}
            </div>
            <div>
                <p className="text-[10px] uppercase font-black tracking-widest text-slate-400">{label}</p>
                <p className="text-sm font-bold text-slate-900 dark:text-white">{value}</p>
            </div>
        </motion.div>
    );
}

function DistanceBadge({ label, value }) {
    return (
        <div className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-4 py-2 rounded-xl flex items-center gap-2">
            <MapPin size={14} className="text-primary dark:text-indigo-400" />
            <span className="text-xs font-black text-slate-500 uppercase tracking-wider">{label}:</span>
            <span className="text-sm font-bold text-slate-900 dark:text-white">{value}</span>
        </div>
    );
}

/**
 * PropertySpecs — the property specification grid (floor/verandas/rooms/baths)
 * plus a nearby-amenities row. Presentational; `property` comes from the shell.
 */
export default function PropertySpecs({ property }) {
    return (
        <motion.section variants={sectionVariants} className="bg-white dark:bg-[#1A1D24] p-6 md:p-10 md:rounded-[40px] border-y md:border border-slate-100 dark:border-slate-800/70 mb-6 md:mb-10">
            <h2 className="text-xl md:text-2xl font-black mb-6 flex items-center gap-3">
                <Building2 size={24} className="text-primary dark:text-indigo-400" /> Property Specifications
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-y-6 gap-x-4">
                <SpecItem icon={<ArrowRight className="-rotate-45" />} label="Floor" value={property.floorNumber || 'Not Specified'} />
                <SpecItem icon={<DoorOpen />} label="Verandas" value={property.verandas || '0'} />
                <SpecItem icon={<Bed />} label="Rooms" value={property.beds || '0'} />
                <SpecItem icon={<Bath />} label="Baths" value={property.baths || '0'} />
            </div>

            {property.distances && (property.distances.mosque || property.distances.school || property.distances.market) && (
                <div className="mt-8 pt-6 border-t border-slate-100 dark:border-slate-800">
                    <h3 className="text-sm font-black text-slate-400 uppercase tracking-widest mb-4">Nearby Amenities</h3>
                    <div className="flex flex-wrap gap-4">
                        {property.distances.mosque && <DistanceBadge label="Mosque" value={property.distances.mosque} />}
                        {property.distances.school && <DistanceBadge label="School" value={property.distances.school} />}
                        {property.distances.market && <DistanceBadge label="Market" value={property.distances.market} />}
                    </div>
                </div>
            )}
        </motion.section>
    );
}
