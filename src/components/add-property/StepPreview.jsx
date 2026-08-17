import { CheckCircle, Send } from 'lucide-react';
import { Section, PreviewInfo } from './FormControls';

/**
 * StepPreview — wizard step 3: listing preview and the free publish button.
 * Posting is now free — no payment flow. Presentational; form state and
 * the onPublish handler come from the AddProperty shell.
 */
export default function StepPreview({
    formData,
    setFormData,
    loading,
    onPublish,
    onBack,
}) {
    return (
        <div className="space-y-6 fade-in">
            <div className="space-y-4">
                <div className="relative h-64 rounded-3xl overflow-hidden shadow-xl">
                    <img loading="lazy" src={formData.imageUrl} className="w-full h-full object-cover" alt="Preview" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
                    <div className="absolute bottom-6 left-6 right-6">
                        <span className="bg-primary px-3 py-1 rounded-full text-[10px] font-black text-white uppercase tracking-widest mb-2 inline-block shadow-lg">
                            {formData.type}
                        </span>
                        <h2 className="text-xl font-black text-white uppercase truncate">{formData.title}</h2>
                    </div>
                </div>

                {formData.images.length > 1 && (
                    <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
                        {formData.images.map((url, idx) => (
                            <div
                                key={idx}
                                className={`size-16 rounded-xl overflow-hidden shrink-0 border-2 transition-all cursor-pointer ${formData.imageUrl === url ? 'border-primary scale-105' : 'border-transparent opacity-60'}`}
                                onClick={() => setFormData(prev => ({ ...prev, imageUrl: url, image_url: url }))}
                            >
                                <img loading="lazy" src={url} className="w-full h-full object-cover" alt="Thumb" />
                            </div>
                        ))}
                    </div>
                )}
            </div>

            <Section title="Everything Looks Good?" icon={<CheckCircle size={20} />}>
                <div className="grid grid-cols-2 gap-y-4 text-sm">
                    <PreviewInfo label="Rent" value={`৳${formData.rent}/${formData.billingCycle}`} />
                    <PreviewInfo label="Location" value={`${formData.upazila}, ${formData.district}`} />
                    <PreviewInfo label="Specs" value={`${formData.beds}B / ${formData.baths}Bath`} />
                    <PreviewInfo label="Size" value={formData.area ? `${formData.area} Sqft` : 'N/A'} />
                    <PreviewInfo label="Utilities Cost" value={`৳${formData.utilitiesCost || 0}`} />
                    <PreviewInfo label="Security" value={`৳${formData.securityDeposit || 0}`} />
                </div>
                <div className="pt-4 border-t border-slate-50 dark:border-white/[0.06]">
                    <p className="text-[9px] font-black text-zinc-400 uppercase tracking-widest mb-1 leading-none">Full Address</p>
                    <p className="text-sm font-black text-slate-800 dark:text-slate-200 mb-3">{formData.addressDetails || 'Not specified'}, {formData.upazila}, {formData.district}, {formData.division}</p>
                    <p className="text-xs text-slate-400 font-bold leading-relaxed">{formData.description}</p>
                </div>
            </Section>

            {/* Free posting banner */}
            <div className="flex items-center gap-3 p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-100 dark:border-emerald-500/20">
                <CheckCircle size={20} className="text-emerald-600 shrink-0" />
                <div>
                    <p className="font-black text-emerald-700 dark:text-emerald-400 text-sm">Posting is Free!</p>
                    <p className="text-xs font-medium text-emerald-600/80">Submit your listing for review — our team verifies it in under 30 minutes.</p>
                </div>
            </div>

            <button
                type="button"
                disabled={loading}
                onClick={onPublish}
                className="w-full bg-primary text-white font-black py-4 rounded-2xl shadow-xl shadow-primary/20 flex items-center justify-center gap-2 transition-all active:scale-95 disabled:opacity-70"
            >
                <Send size={20} />
                {loading ? 'Submitting...' : 'Publish Property'}
            </button>

            <button
                onClick={onBack}
                className="w-full text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 hover:text-primary dark:text-indigo-400 transition-colors mt-2"
            >
                Wait, go back and edit
            </button>
        </div>
    );
}
