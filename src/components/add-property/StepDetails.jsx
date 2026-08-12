import { Info, Building2, ArrowRight } from 'lucide-react';
import { Section, Input, Select } from './FormControls';
import { UTILITY_OPTIONS, FEATURE_OPTIONS } from './constants';

/**
 * StepDetails — wizard step 2: utilities/features toggles and BD-specific
 * policies, amenities, and nearby distances. Presentational; form state +
 * handlers come from the AddProperty shell.
 */
export default function StepDetails({ formData, onChange, onDistanceChange, toggleItem, onNext }) {
    return (
        <div className="space-y-6 fade-in">
            <Section title="Utilities & Features" icon={<Info size={20} />}>
                <div className="space-y-6">
                    <div>
                        <label className="text-[10px] uppercase font-black text-slate-400 ml-1 tracking-widest">Included Utilities</label>
                        <div className="grid grid-cols-2 gap-2 mt-2">
                            {UTILITY_OPTIONS.map(opt => (
                                <button
                                    key={opt.id}
                                    type="button"
                                    onClick={() => toggleItem('utilities', opt.id)}
                                    className={`flex items-center gap-2 p-3 rounded-xl border text-xs font-bold transition-all text-left ${formData.utilities.includes(opt.id) ? 'bg-primary/10 border-primary text-primary dark:text-indigo-400' : 'bg-slate-50 dark:bg-[#222630] border-transparent text-slate-500'}`}
                                >
                                    {opt.icon}
                                    <span className="truncate">{opt.id}</span>
                                </button>
                            ))}
                        </div>
                    </div>

                    <Input label="Monthly Utilities Cost (৳)" name="utilitiesCost" type="number" value={formData.utilitiesCost} onChange={onChange} placeholder="e.g. 2000" />

                    <div>
                        <label className="text-[10px] uppercase font-black text-slate-400 ml-1 tracking-widest">Property Features</label>
                        <div className="grid grid-cols-2 gap-2 mt-2">
                            {FEATURE_OPTIONS.map(opt => (
                                <button
                                    key={opt.id}
                                    type="button"
                                    onClick={() => toggleItem('features', opt.id)}
                                    className={`flex items-center gap-2 p-3 rounded-xl border text-xs font-bold transition-all text-left ${formData.features.includes(opt.id) ? 'bg-primary/10 border-primary text-primary dark:text-indigo-400' : 'bg-slate-50 dark:bg-[#222630] border-transparent text-slate-500'}`}
                                >
                                    {opt.icon}
                                    <span className="truncate">{opt.id}</span>
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            </Section>

            <Section title="BD Specific Policies & Amenities" icon={<Building2 size={20} />}>
                <div className="grid grid-cols-2 gap-4">
                    <Select label="Gas Supply" name="gasSupply" value={formData.gasSupply} onChange={onChange}>
                        <option value="Line Gas">Line Gas</option>
                        <option value="Prepaid Gas">Prepaid Gas</option>
                        <option value="Cylinder">Cylinder</option>
                    </Select>
                    <Select label="Electricity Bill" name="electricityBilling" value={formData.electricityBilling} onChange={onChange}>
                        <option value="Excluded">Excluded (Standard)</option>
                        <option value="Included">Included in Rent</option>
                        <option value="Sub-meter">Sub-meter</option>
                    </Select>
                </div>
                <div className="grid grid-cols-2 gap-4">
                    <Select label="Water Source" name="waterSource" value={formData.waterSource} onChange={onChange}>
                        <option value="WASA">WASA</option>
                        <option value="Deep Tube-well">Deep Tube-well</option>
                        <option value="Tank">Tank Delivery</option>
                    </Select>
                    <Select label="Facing Direction" name="facing" value={formData.facing} onChange={onChange}>
                        <option value="">Select Direction</option>
                        <option value="South">South Facing</option>
                        <option value="North">North Facing</option>
                        <option value="East">East Facing</option>
                        <option value="West">West Facing</option>
                    </Select>
                </div>
                <div className="grid grid-cols-2 gap-4">
                    <Input label="Floor Number" name="floorNumber" value={formData.floorNumber} onChange={onChange} placeholder="e.g. 5th Floor" />
                    <Select label="Parking Type" name="parkingType" value={formData.parkingType} onChange={onChange}>
                        <option value="None">None</option>
                        <option value="Covered">Covered Garage</option>
                        <option value="Open">Open Parking</option>
                    </Select>
                </div>

                <div className="grid grid-cols-3 gap-4">
                    <Select label="Pet Policy" name="petPolicy" value={formData.petPolicy} onChange={onChange}>
                        <option value="Not Allowed">Not Allowed</option>
                        <option value="Allowed">Allowed</option>
                    </Select>
                    <Select label="Bachelor Policy" name="bachelorPolicy" value={formData.bachelorPolicy} onChange={onChange}>
                        <option value="Not Allowed">Not Allowed</option>
                        <option value="Allowed">Allowed</option>
                    </Select>
                    <Select label="Family Policy" name="familyPolicy" value={formData.familyPolicy} onChange={onChange}>
                        <option value="Family Only">Family Only</option>
                        <option value="Any">Any</option>
                    </Select>
                </div>

                <div>
                    <label className="text-[10px] uppercase font-black text-slate-400 ml-1 tracking-widest block mb-2">Nearby Distances (in km/meters)</label>
                    <div className="grid grid-cols-3 gap-4">
                        <Input label="Mosque" name="mosque" value={formData.distances.mosque} onChange={onDistanceChange} placeholder="e.g. 0.5km" />
                        <Input label="School" name="school" value={formData.distances.school} onChange={onDistanceChange} placeholder="e.g. 1km" />
                        <Input label="Market" name="market" value={formData.distances.market} onChange={onDistanceChange} placeholder="e.g. 200m" />
                    </div>
                </div>
            </Section>

            <button
                type="button"
                onClick={onNext}
                className="w-full bg-primary text-white font-black py-4 rounded-2xl shadow-xl shadow-primary/20 flex items-center justify-center gap-2 transition-all active:scale-95"
            >
                Preview Details
                <ArrowRight size={20} />
            </button>
        </div>
    );
}
