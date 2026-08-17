import { Building2, MapPin, Info, Image as ImageIcon, Trash2, Camera, ArrowRight, Calendar, Users, GripVertical } from 'lucide-react';
import { Reorder } from 'framer-motion';
import LocationPickerMap from '../LocationPickerMap';
import { Section, Input, Select, Textarea } from './FormControls';
import { PROPERTY_TYPES, BILLING_CYCLES, TENANT_TYPES } from './constants';

/**
 * StepBasics — wizard step 1: basic details, location setup (+ map pin),
 * specifications, and media upload. Presentational; form state + handlers come
 * from the AddProperty shell.
 */
export default function StepBasics({
    formData,
    setFormData,
    onChange,
    onImageUpload,
    onRemoveImage,
    onReorderImages,
    uploading,
    onNext,
    divisions,
    districts,
    thanas,
}) {
    return (
        <div className="space-y-6 fade-in">
            <Section title="Basic Details" icon={<Building2 size={20} />}>
                <Input label="Property Title" name="title" value={formData.title} onChange={onChange} placeholder="e.g. Modern Flat in Gulshan" required />
                <div className="grid grid-cols-2 gap-4">
                    <Select label="Property Type" name="type" value={formData.type} onChange={onChange}>
                        {PROPERTY_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                    </Select>
                    <Input label="Rent (৳)" name="rent" type="number" value={formData.rent} onChange={onChange} placeholder="25000" required />
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                        <label className="text-[10px] uppercase font-black text-slate-400 ml-1 tracking-widest flex items-center gap-1">
                            <Calendar size={12} /> Billing Cycle
                        </label>
                        <Select name="billingCycle" value={formData.billingCycle} onChange={onChange}>
                            {BILLING_CYCLES.map(cycle => <option key={cycle} value={cycle}>{cycle}</option>)}
                        </Select>
                    </div>

                    <div className="space-y-1">
                        <label className="text-[10px] uppercase font-black text-slate-400 ml-1 tracking-widest flex items-center gap-1">
                            <Users size={12} /> Tenant Type
                        </label>
                        <Select name="tenantType" value={formData.tenantType} onChange={onChange}>
                            {TENANT_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                        </Select>
                    </div>
                </div>
            </Section>

            <Section title="Location Setup" icon={<MapPin size={20} />}>
                <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <Select label="Division" name="division" value={formData.division} onChange={onChange} required>
                            <option value="">Select Division</option>
                            {divisions.map(d => <option key={d} value={d}>{d}</option>)}
                        </Select>
                        <Select label="District" name="district" value={formData.district} onChange={onChange} disabled={!formData.division} required>
                            <option value="">Select District</option>
                            {districts.map(d => <option key={d} value={d}>{d}</option>)}
                        </Select>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <Select label="Thana / Upazila" name="upazila" value={formData.upazila} onChange={onChange} disabled={!formData.district} required>
                            <option value="">Select Thana</option>
                            {thanas.map(t => <option key={t} value={t}>{t}</option>)}
                        </Select>
                        <Input label="House/Road No. (Details)" name="addressDetails" value={formData.addressDetails} onChange={onChange} placeholder="e.g. House 5, Road 10" />
                    </div>

                    <div className="pt-2">
                        <label className="text-[10px] uppercase font-black text-slate-400 ml-1 tracking-widest block mb-2">Pin Exact Location on Map</label>
                        <LocationPickerMap
                            lat={formData.lat}
                            lng={formData.lng}
                            division={formData.division}
                            district={formData.district}
                            upazila={formData.upazila}
                            onLocationSelect={(coords) => setFormData(prev => ({ ...prev, lat: coords.lat, lng: coords.lng }))}
                        />
                    </div>
                </div>
            </Section>

            <Section title="Specifications & Utilities" icon={<Info size={20} />}>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                    <Input label="Beds" name="beds" type="number" value={formData.beds} onChange={onChange} />
                    <Input label="Baths" name="baths" type="number" value={formData.baths} onChange={onChange} />
                    <Input label="Verandas" name="verandas" type="number" value={formData.verandas} onChange={onChange} />
                    <Input label="SqFt (Optional)" name="area" type="number" value={formData.area} onChange={onChange} placeholder="N/A" />
                </div>

                <div className="pt-4 mt-4 border-t border-slate-100 dark:border-white/[0.06]">
                    <div className="flex items-center justify-between p-4 bg-indigo-50 dark:bg-indigo-500/10 rounded-2xl border border-indigo-100 dark:border-indigo-500/20">
                        <div className="flex-1 pr-4">
                            <h4 className="text-sm font-black text-indigo-900 dark:text-indigo-400">Instant Booking</h4>
                            <p className="text-[10px] font-bold text-indigo-700/70 dark:text-indigo-400/70 mt-1 leading-relaxed">If enabled, a "Book Now" button will appear on your listing. You can set up the required deposit amount in your dashboard later.</p>
                        </div>
                        <Select name="instantBooking" value={formData.instantBooking ? 'Yes' : 'No'} onChange={(e) => setFormData(prev => ({ ...prev, instantBooking: e.target.value === 'Yes' }))} className="w-24 bg-white dark:bg-[#222630] !py-2">
                            <option value="No">No</option>
                            <option value="Yes">Yes</option>
                        </Select>
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-4 mt-4">
                    <Input label="Security Deposit (Optional)" name="securityDeposit" type="number" value={formData.securityDeposit} onChange={onChange} placeholder="৳0" />
                    {/* <Input label="Agent Commission (if applicable)" name="agentCommission" value={formData.agentCommission} onChange={onChange} placeholder="e.g. 1 Month Rent or ৳10000" /> */}
                </div>
                <Textarea label="Description" name="description" value={formData.description} onChange={onChange} placeholder="Tell tenants about your space..." />
            </Section>

            <Section title="Media (Up to 5 images)" icon={<ImageIcon size={20} />}>
                <div className="space-y-4">
                    <div className="space-y-3">
                        {formData.images.length > 0 && (
                            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1 flex items-center gap-1">
                                <GripVertical size={11} /> Drag to reorder · First image is the cover
                            </p>
                        )}
                        <Reorder.Group
                            axis="x"
                            values={formData.images}
                            onReorder={onReorderImages}
                            className="grid grid-cols-2 sm:grid-cols-3 gap-3 list-none"
                        >
                        {formData.images.map((url, index) => (
                            <Reorder.Item
                                key={url}
                                value={url}
                                className="relative aspect-square rounded-2xl overflow-hidden group border border-slate-100 dark:border-white/[0.06] shadow-sm cursor-grab active:cursor-grabbing"
                                whileDrag={{ scale: 1.05, zIndex: 50, boxShadow: '0 20px 40px rgba(0,0,0,0.2)' }}
                            >
                                <img loading="lazy" src={url} alt={`Property ${index + 1}`} className="w-full h-full object-cover pointer-events-none" />
                                <button
                                    onClick={(e) => { e.stopPropagation(); onRemoveImage(index); }}
                                    className="absolute top-2 right-2 p-1.5 bg-rose-500 text-white rounded-lg opacity-0 group-hover:opacity-100 transition-opacity shadow-lg shadow-rose-500/20 z-10"
                                >
                                    <Trash2 size={14} />
                                </button>
                                {index === 0 && (
                                    <div className="absolute bottom-0 inset-x-0 bg-primary/80 backdrop-blur-sm py-1 text-[8px] font-black text-white text-center uppercase tracking-widest pointer-events-none">
                                        Main Cover
                                    </div>
                                )}
                            </Reorder.Item>
                        ))}
                        </Reorder.Group>

                        {formData.images.length < 5 && (
                            <div className="relative aspect-square flex flex-col gap-2">
                                <input
                                    type="file"
                                    accept="image/*"
                                    multiple
                                    onChange={onImageUpload}
                                    className="hidden"
                                    id="image-upload"
                                    disabled={uploading}
                                />
                                <input
                                    type="file"
                                    accept="image/*"
                                    capture="environment"
                                    onChange={onImageUpload}
                                    className="hidden"
                                    id="camera-upload"
                                    disabled={uploading}
                                />
                                <label
                                    htmlFor="image-upload"
                                    className="flex-1 flex flex-col items-center justify-center w-full border-2 border-dashed border-slate-200 dark:border-white/[0.06] rounded-xl cursor-pointer hover:bg-slate-50 dark:hover:bg-white/[0.04] transition-all"
                                >
                                    <div className="text-primary dark:text-indigo-400 mb-0.5">
                                        <ImageIcon size={18} />
                                    </div>
                                    <p className="text-[8px] font-black uppercase tracking-widest text-slate-400">
                                        {uploading ? "..." : "Gallery"}
                                    </p>
                                </label>
                                <label
                                    htmlFor="camera-upload"
                                    className="flex-1 flex flex-col items-center justify-center w-full border-2 border-dashed border-slate-200 dark:border-white/[0.06] rounded-xl cursor-pointer hover:bg-slate-50 dark:hover:bg-white/[0.04] transition-all"
                                >
                                    <div className="text-primary dark:text-indigo-400 mb-0.5">
                                        <Camera size={18} />
                                    </div>
                                    <p className="text-[8px] font-black uppercase tracking-widest text-slate-400">
                                        {uploading ? "..." : "Camera"}
                                    </p>
                                </label>
                            </div>
                        )}
                    </div>

                    {uploading && (
                        <div className="h-1 w-full bg-slate-100 dark:bg-white/[0.06] rounded-full overflow-hidden">
                            <div className="h-full bg-primary animate-progress" style={{ width: '100%' }} />
                        </div>
                    )}
                </div>
            </Section>

            <button
                type="button"
                onClick={onNext}
                disabled={!formData.title || !formData.rent || !formData.upazila || !formData.imageUrl}
                className="w-full bg-primary text-white font-black py-4 rounded-2xl shadow-xl shadow-primary/20 flex items-center justify-center gap-2 transition-all active:scale-95 disabled:opacity-50"
            >
                Continue: Amenities
                <ArrowRight size={20} />
            </button>
        </div>
    );
}
