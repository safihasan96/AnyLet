import { CheckCircle, CreditCard } from 'lucide-react';
import { Section, PreviewInfo } from './FormControls';

/**
 * StepPreview — wizard step 3: listing preview, on-site verification opt-in,
 * and the publish / pay button. Presentational; form state, fee figures, and
 * handlers come from the AddProperty shell.
 */
export default function StepPreview({
    formData,
    setFormData,
    hasActiveSubscription,
    subscriptionPlan,
    wantOnsiteVerify,
    setWantOnsiteVerify,
    onsiteFee,
    listingFee,
    totalAmount,
    loading,
    onProceedToPayment,
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
                                className={`size-16 rounded-xl overflow-hidden shrink-0 border-2 transition-all ${formData.imageUrl === url ? 'border-primary scale-105' : 'border-transparent opacity-60'}`}
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

            {hasActiveSubscription && (
                <div className="flex items-center gap-3 p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-100 dark:border-emerald-500/20 mb-3">
                    <CheckCircle size={20} className="text-emerald-600 shrink-0" />
                    <div>
                        <p className="font-black text-emerald-700 dark:text-emerald-400 text-sm">{subscriptionPlan} Plan Active</p>
                        <p className="text-xs font-medium text-emerald-600/80">Listing fee included in your subscription — post for free!</p>
                    </div>
                </div>
            )}

            <div
                onClick={() => setWantOnsiteVerify(v => !v)}
                className={`flex items-start gap-4 p-5 rounded-2xl border-2 cursor-pointer transition-all mb-3 ${
                    wantOnsiteVerify
                        ? 'border-primary bg-primary/5 dark:bg-primary/10'
                        : 'border-slate-100 dark:border-white/[0.06] hover:border-primary/40'
                }`}
            >
                <div className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center shrink-0 mt-0.5 transition-all ${
                    wantOnsiteVerify ? 'bg-primary border-primary' : 'border-slate-300 dark:border-slate-600'
                }`}>
                    {wantOnsiteVerify && <CheckCircle size={14} className="text-white" strokeWidth={3} />}
                </div>
                <div className="flex-1">
                    <div className="flex items-center justify-between">
                        <p className="font-black text-slate-900 dark:text-white text-sm">Add On-Site Verification</p>
                        <span className="text-xs font-black text-primary dark:text-indigo-400">+ ৳{onsiteFee}</span>
                    </div>
                    <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                        Our team visits your property, verifies it, and adds a <span className="font-black text-emerald-600">Verified ✅</span> badge — boosting trust with tenants.
                    </p>
                </div>
            </div>

            <button
                type="button"
                disabled={loading}
                onClick={onProceedToPayment}
                className="w-full bg-primary text-white font-black py-4 rounded-2xl shadow-xl shadow-primary/20 flex items-center justify-center gap-2 transition-all active:scale-95 disabled:opacity-70"
            >
                <CreditCard size={20} />
                {totalAmount === 0 ? 'Publish Ad — Free with Subscription' : `Publish Ad — ৳${totalAmount}`}
            </button>

            <p className="text-center text-[10px] font-bold text-slate-400 mt-2">
                {hasActiveSubscription
                    ? `${subscriptionPlan} subscription · Listing: Free${wantOnsiteVerify ? ` · On-Site Verify: ৳${onsiteFee}` : ''}`
                    : `Listing Fee: ৳${listingFee}${wantOnsiteVerify ? ` · On-Site Verify: ৳${onsiteFee}` : ' · or get a subscription plan to post free'}`
                }
            </p>

            <button
                onClick={onBack}
                className="w-full text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 hover:text-primary dark:text-indigo-400 transition-colors mt-2"
            >
                Wait, go back and edit
            </button>
        </div>
    );
}
