import { Zap, Info, CheckCircle2 } from 'lucide-react';
import { useLanguage } from '../../contexts/LanguageContext';

/**
 * PropertyFeatures — the features/amenities and inclusions/utilities columns.
 * Derives the display lists from the raw property fields (parking/pet/bachelor/
 * family policies, water/gas/electricity). Presentational; `property` comes from
 * the shell.
 */
export default function PropertyFeatures({ property }) {
    const { t } = useLanguage();

    const processedFeatures = new Set(property.features || []);
    if (property.parkingType && property.parkingType !== 'None') {
        processedFeatures.delete('Car Parking');
        processedFeatures.add(`Car Parking (${property.parkingType})`);
    }
    if (property.petPolicy && property.petPolicy !== 'Not Allowed') processedFeatures.add(`Pet Policy (${property.petPolicy})`);
    if (property.bachelorPolicy && property.bachelorPolicy !== 'Not Allowed') processedFeatures.add(`Bachelor Policy (${property.bachelorPolicy})`);
    if (property.familyPolicy && property.familyPolicy !== 'Any') processedFeatures.add(`Family Policy (${property.familyPolicy})`);

    const processedUtilities = new Set(property.utilities || []);
    ['Prepaid Gas', 'Line Gas', 'Prepaid Electricity', 'Postpaid Electricity', 'Water (WASA)', 'Deep Tube-well Water'].forEach(u => processedUtilities.delete(u));

    if (property.waterSource) processedUtilities.add(`Water (${property.waterSource})`);
    if (property.gasSupply) processedUtilities.add(`Gas (${property.gasSupply})`);
    if (property.electricityBilling && property.electricityBilling !== 'Excluded') processedUtilities.add(`Electricity (${property.electricityBilling})`);

    const displayFeatures = Array.from(processedFeatures);
    const displayUtilities = Array.from(processedUtilities);

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-10">
                <section className="bg-white dark:bg-[#1A1D24] p-6 md:p-8 md:rounded-[40px] border-y md:border border-slate-100 dark:border-slate-800/70">
                    <h3 className="text-lg md:text-xl font-black mb-4 md:mb-6 flex items-center gap-3">
                        <Zap size={20} className="text-primary dark:text-indigo-400 md:w-6 md:h-6" /> {t('amenities')}
                    </h3>
                    <div className="grid grid-cols-1 gap-4">
                        {displayFeatures.length > 0 ? displayFeatures.map(f => (
                            <div key={f} className="flex items-center gap-3 text-slate-600 dark:text-slate-300 font-bold text-sm">
                                <div className="size-6 rounded-lg bg-primary/10 flex items-center justify-center text-primary dark:text-indigo-400 shrink-0"><CheckCircle2 size={14} /></div>
                                {f}
                            </div>
                        )) : <div className="text-sm text-slate-400">None specified</div>}
                    </div>
                </section>
                <section className="bg-white dark:bg-[#1A1D24] p-6 md:p-8 md:rounded-[40px] border-y md:border border-slate-100 dark:border-slate-800/70">
                    <h3 className="text-lg md:text-xl font-black mb-4 md:mb-6 flex items-center gap-3">
                        <Info size={20} className="text-primary dark:text-indigo-400 md:w-6 md:h-6" /> {t('inclusions')}
                    </h3>
                    <div className="grid grid-cols-1 gap-4">
                        {displayUtilities.length > 0 ? displayUtilities.map(u => (
                            <div key={u} className="flex items-center gap-3 text-slate-600 dark:text-slate-300 font-bold text-sm">
                                <div className="size-6 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-500 shrink-0"><CheckCircle2 size={14} /></div>
                                {u}
                            </div>
                        )) : <div className="text-sm text-slate-400">None specified</div>}
                    </div>
                </section>
        </div>
    );
}
