import { Search, Building2, CheckCircle, X, Clock } from 'lucide-react';

/**
 * AdminPropertiesTab — property approval queue with status filter tabs, search,
 * and per-row approve/reject actions. Presentational; `filteredListings` is the
 * already-filtered list and all handlers come from the AdminPanel shell.
 */
export default function AdminPropertiesTab({
    listings,
    filteredListings,
    pendingListings,
    propertiesTab,
    onPropertiesTabChange,
    listingSearch,
    onSearchChange,
    onOpenDetail,
    onApprove,
    onReject,
    propertiesLimit,
    onLoadMore,
}) {
    return (
        <div className="space-y-6">
            <div className="bg-white rounded-3xl border border-zinc-100 shadow-sm overflow-hidden">
                <div className="px-8 py-8 flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 border-b border-zinc-50">
                    <div>
                        <h3 className="text-2xl font-black text-zinc-950">Property Approvals</h3>
                        <p className="text-sm text-zinc-400 font-bold mt-1">
                            {listings.length} total · <span className="text-amber-500">{pendingListings} pending approval</span>
                        </p>
                    </div>
                    <div className="flex flex-col sm:flex-row w-full lg:w-auto items-center gap-4">
                        <div className="bg-zinc-100 p-1 rounded-xl flex items-center w-full sm:w-auto">
                            <button onClick={() => onPropertiesTabChange('pending')} className={`flex-1 sm:flex-none px-4 py-2 rounded-lg text-xs font-black transition-all ${propertiesTab === 'pending' ? 'bg-white shadow-sm text-amber-500' : 'text-zinc-400 hover:text-zinc-600'}`}>Pending ({pendingListings})</button>
                            <button onClick={() => onPropertiesTabChange('approved')} className={`flex-1 sm:flex-none px-4 py-2 rounded-lg text-xs font-black transition-all ${propertiesTab === 'approved' ? 'bg-white shadow-sm text-emerald-500' : 'text-zinc-400 hover:text-zinc-600'}`}>Approved</button>
                            <button onClick={() => onPropertiesTabChange('rejected')} className={`flex-1 sm:flex-none px-4 py-2 rounded-lg text-xs font-black transition-all ${propertiesTab === 'rejected' ? 'bg-white shadow-sm text-rose-500' : 'text-zinc-400 hover:text-zinc-600'}`}>Rejected</button>
                            <button onClick={() => onPropertiesTabChange('all')} className={`flex-1 sm:flex-none px-4 py-2 rounded-lg text-xs font-black transition-all ${propertiesTab === 'all' ? 'bg-white shadow-sm text-zinc-900' : 'text-zinc-400 hover:text-zinc-600'}`}>All</button>
                        </div>
                        <div className="relative w-full sm:w-64">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400" size={16} />
                            <input
                                type="text" placeholder="Search..."
                                value={listingSearch} onChange={e => onSearchChange(e.target.value)}
                                className="w-full pl-10 pr-4 py-2.5 bg-zinc-50 rounded-xl text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-500/20 placeholder:text-zinc-300"
                            />
                        </div>
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="text-zinc-400 text-[10px] font-black uppercase tracking-widest border-b border-zinc-50">
                                <th className="px-8 py-5">Property</th>
                                <th className="px-8 py-5 text-center">Approval Status</th>
                                <th className="px-8 py-5 text-center">Action</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-zinc-50">
                            {filteredListings.length === 0 ? (
                                <tr>
                                    <td colSpan={3} className="px-8 py-16 text-center text-zinc-400 font-bold">
                                        No listings found.
                                    </td>
                                </tr>
                            ) : filteredListings.map(listing => (
                                <tr
                                    key={listing.id}
                                    onClick={() => onOpenDetail(listing)}
                                    className="group hover:bg-zinc-50/80 transition-colors cursor-pointer"
                                >
                                    <td className="px-8 py-5">
                                        <div className="flex items-center gap-4">
                                            {listing.images?.[0] ? (
                                                <img loading="lazy" src={listing.images[0]} alt="listing" className="w-14 h-14 rounded-2xl object-cover flex-shrink-0 border border-zinc-100" />
                                            ) : (
                                                <div className="w-14 h-14 bg-zinc-100 rounded-2xl flex items-center justify-center flex-shrink-0">
                                                    <Building2 size={20} className="text-zinc-300" />
                                                </div>
                                            )}
                                            <div>
                                                <div className="flex items-center gap-2">
                                                    <p className="font-black text-zinc-950 group-hover:text-emerald-600 transition-colors">
                                                        {listing.title || 'Untitled Listing'}
                                                    </p>
                                                    <span className="text-[10px] font-mono font-black text-zinc-400 bg-zinc-100 px-1.5 py-0.5 rounded uppercase">
                                                        #{listing.id ? listing.id.slice(0, 8) : 'N/A'}
                                                    </span>
                                                </div>
                                                <p className="text-xs font-bold text-zinc-400 mt-0.5">
                                                    {listing.upazila || listing.location || listing.address || 'No location set'}
                                                </p>
                                                {listing.rent && (
                                                    <p className="text-xs font-black text-emerald-600 mt-0.5">৳{Number(listing.rent).toLocaleString()}/mo</p>
                                                )}
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-8 py-5 text-center">
                                        {listing.isApproved ? (
                                            <span className="inline-flex items-center gap-1.5 text-[10px] font-black px-3 py-1.5 rounded-full bg-emerald-50 text-emerald-600 uppercase tracking-widest">
                                                <CheckCircle size={11} /> Verified
                                            </span>
                                        ) : listing.isRejected ? (
                                            <span className="inline-flex items-center gap-1.5 text-[10px] font-black px-3 py-1.5 rounded-full bg-rose-50 text-rose-600 uppercase tracking-widest">
                                                <X size={11} /> Rejected
                                            </span>
                                        ) : (
                                            <span className="inline-flex items-center gap-1.5 text-[10px] font-black px-3 py-1.5 rounded-full bg-amber-50 text-amber-600 uppercase tracking-widest">
                                                <Clock size={11} /> Pending
                                            </span>
                                        )}
                                    </td>
                                    <td className="px-8 py-5 text-center">
                                        {listing.isApproved ? (
                                            <span className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Live ✓</span>
                                        ) : (
                                            <div className="flex items-center justify-center gap-2">
                                                <button
                                                    onClick={e => { e.stopPropagation(); onApprove(listing); }}
                                                    className="px-3 py-1.5 bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-black rounded-xl transition-all shadow-sm active:scale-95 flex items-center gap-1"
                                                >
                                                    Approve
                                                </button>
                                                {!listing.isRejected && (
                                                    <button
                                                        onClick={e => { e.stopPropagation(); onReject(listing); }}
                                                        className="px-3 py-1.5 bg-rose-500 hover:bg-rose-600 text-white text-xs font-black rounded-xl transition-all shadow-sm active:scale-95 flex items-center gap-1"
                                                    >
                                                        Reject
                                                    </button>
                                                )}
                                            </div>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
                {listings.length >= propertiesLimit && (
                    <div className="p-6 border-t border-zinc-50 flex justify-center bg-zinc-50/30">
                        <button
                            onClick={onLoadMore}
                            className="px-6 py-2.5 bg-white border border-zinc-200 text-zinc-600 font-black text-xs uppercase tracking-widest rounded-xl shadow-sm hover:bg-zinc-50 transition-all active:scale-95"
                        >
                            Load More
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}
