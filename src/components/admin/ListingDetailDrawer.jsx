import { CheckCircle, Clock, ChevronRight, Building2, ShieldCheck } from 'lucide-react';

/**
 * ListingDetailDrawer — slide-over detail view for a property under admin review,
 * including resolved owner info and approve/reject/verify actions. Renders
 * nothing when `listing` is null.
 */
export default function ListingDetailDrawer({
    listing,
    owner,
    ownerLoading,
    onClose,
    onToggleVerification,
    onApprove,
    onReject,
}) {
    if (!listing) return null;

    return (
        <>
            {/* Backdrop */}
            <div
                className="fixed inset-0 bg-black/30 backdrop-blur-sm z-40"
                onClick={onClose}
            />
            {/* Drawer */}
            <aside className="fixed right-0 top-0 h-full w-full max-w-xl bg-white z-50 shadow-2xl flex flex-col overflow-hidden">
                {/* Drawer Header */}
                <div className="flex items-center justify-between px-8 py-6 border-b border-zinc-100">
                    <div>
                        <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest mb-1">Listing Detail</p>
                        <h3 className="text-xl font-black text-zinc-950 leading-tight">{listing.title || 'Untitled Listing'}</h3>
                    </div>
                    <div className="flex items-center gap-3">
                        {listing.isApproved ? (
                            <span className="inline-flex items-center gap-1.5 text-[10px] font-black px-3 py-1.5 rounded-full bg-emerald-50 text-emerald-600 uppercase tracking-widest">
                                <CheckCircle size={11} /> Verified
                            </span>
                        ) : (
                            <span className="inline-flex items-center gap-1.5 text-[10px] font-black px-3 py-1.5 rounded-full bg-amber-50 text-amber-600 uppercase tracking-widest">
                                <Clock size={11} /> Pending
                            </span>
                        )}
                        <button onClick={onClose} className="w-9 h-9 rounded-xl bg-zinc-50 flex items-center justify-center text-zinc-400 hover:text-zinc-900 hover:bg-zinc-100 transition-all">
                            <ChevronRight size={18} />
                        </button>
                    </div>
                </div>

                {/* Scrollable body */}
                <div className="flex-1 overflow-y-auto">
                    {/* Image */}
                    {listing.images?.[0] ? (
                        <img loading="lazy"
                            src={listing.images[0]}
                            alt="listing"
                            className="w-full h-56 object-cover"
                        />
                    ) : (
                        <div className="w-full h-40 bg-zinc-100 flex items-center justify-center">
                            <Building2 size={40} className="text-zinc-300" />
                        </div>
                    )}

                    <div className="p-8 space-y-6">
                        {/* Location grid */}
                        <div>
                            <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest mb-3">Location</p>
                            <div className="grid grid-cols-2 gap-3">
                                {[
                                    { label: 'Division', value: listing.division },
                                    { label: 'District', value: listing.district },
                                    { label: 'Area', value: listing.area || listing.upazila },
                                    { label: 'Address', value: listing.address || listing.location },
                                ].map(({ label, value }) => value ? (
                                    <div key={label} className="bg-zinc-50 rounded-2xl p-3">
                                        <p className="text-[9px] font-black text-zinc-400 uppercase tracking-widest">{label}</p>
                                        <p className="text-sm font-bold text-zinc-950 mt-0.5">{value}</p>
                                    </div>
                                ) : null)}
                            </div>
                        </div>

                        {/* Rent & Details */}
                        <div>
                            <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest mb-3">Pricing & Details</p>
                            <div className="grid grid-cols-2 gap-3">
                                {[
                                    { label: 'Monthly Rent', value: listing.rent ? `৳${Number(listing.rent).toLocaleString()}` : null },
                                    { label: 'Bedrooms', value: listing.bedrooms || listing.beds },
                                    { label: 'Bathrooms', value: listing.bathrooms },
                                    { label: 'Area (sq ft)', value: listing.area_sqft || listing.size },
                                ].map(({ label, value }) => value ? (
                                    <div key={label} className="bg-zinc-50 rounded-2xl p-3">
                                        <p className="text-[9px] font-black text-zinc-400 uppercase tracking-widest">{label}</p>
                                        <p className="text-sm font-bold text-zinc-950 mt-0.5">{value}</p>
                                    </div>
                                ) : null)}
                            </div>
                        </div>

                        {/* Features */}
                        {listing.features?.length > 0 && (
                            <div>
                                <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest mb-3">Features</p>
                                <div className="flex flex-wrap gap-2">
                                    {listing.features.map((f, i) => (
                                        <span key={i} className="px-3 py-1.5 bg-emerald-50 text-emerald-700 text-xs font-bold rounded-xl">{f}</span>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Description */}
                        {listing.description && (
                            <div>
                                <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest mb-2">Description</p>
                                <p className="text-sm text-zinc-600 font-medium leading-relaxed">{listing.description}</p>
                            </div>
                        )}

                        {/* Owner Info */}
                        <div className="border-t border-zinc-100 pt-6">
                            <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest mb-3">Owner / Landlord</p>
                            {ownerLoading ? (
                                <div className="flex items-center gap-3 p-4 bg-zinc-50 rounded-2xl">
                                    <div className="w-5 h-5 border-2 border-zinc-200 border-t-emerald-500 rounded-full animate-spin" />
                                    <p className="text-sm text-zinc-400 font-bold">Looking up owner...</p>
                                </div>
                            ) : owner ? (
                                <div className="bg-zinc-50 rounded-2xl p-4 flex items-start gap-4">
                                    <div className="w-11 h-11 bg-zinc-200 rounded-xl flex items-center justify-center font-black text-zinc-500 text-sm uppercase flex-shrink-0">
                                        {owner.email?.[0] || '?'}
                                    </div>
                                    <div className="space-y-0.5">
                                        <p className="font-black text-zinc-950">{owner.fullName || owner.name || 'No name'}</p>
                                        <p className="text-sm text-zinc-500 font-bold">{owner.email}</p>
                                        {(owner.phone || owner.contact) && (
                                            <p className="text-sm text-emerald-600 font-bold">{owner.phone || owner.contact}</p>
                                        )}
                                        <p className="text-[9px] font-black text-zinc-400 uppercase tracking-widest pt-1">{owner.role || 'user'} · ID: {owner.id?.slice(0, 10)}...</p>
                                    </div>
                                </div>
                            ) : (
                                <p className="text-sm text-zinc-400 font-bold p-4 bg-zinc-50 rounded-2xl">No owner ID linked to this listing.</p>
                            )}
                        </div>
                    </div>
                </div>

                {/* Drawer Footer */}
                <div className="flex-shrink-0 px-8 py-5 border-t border-zinc-100 bg-white flex flex-col gap-3">
                    <button
                        onClick={() => onToggleVerification(listing)}
                        className={`w-full py-3.5 font-black rounded-2xl transition-all text-sm active:scale-[0.98] flex items-center justify-center gap-2 ${listing.isVerified ? 'bg-amber-50 text-amber-600 hover:bg-amber-100' : 'bg-emerald-50 text-emerald-600 hover:bg-emerald-100 border border-emerald-100'}`}
                    >
                        <ShieldCheck size={18} />
                        {listing.isVerified ? 'Remove Verification' : 'Verify Landlord'}
                    </button>

                    {!listing.isApproved && (
                        <div className="flex gap-3">
                            <button
                                onClick={() => onApprove(listing)}
                                className="flex-1 py-3.5 bg-emerald-500 hover:bg-emerald-600 text-white font-black rounded-2xl transition-all text-sm shadow-lg shadow-emerald-500/20 active:scale-[0.98]"
                            >
                                ✓ Approve
                            </button>
                            {!listing.isRejected && (
                                <button
                                    onClick={() => onReject(listing)}
                                    className="flex-1 py-3.5 bg-rose-500 hover:bg-rose-600 text-white font-black rounded-2xl transition-all text-sm shadow-lg shadow-rose-500/20 active:scale-[0.98]"
                                >
                                    ✕ Reject
                                </button>
                            )}
                        </div>
                    )}
                </div>
            </aside>
        </>
    );
}
