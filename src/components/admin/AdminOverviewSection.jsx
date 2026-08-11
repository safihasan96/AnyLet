import {
    Users, Building2, ShieldCheck, CheckCircle, ClipboardList, Home, Banknote,
    TrendingUp, Activity, Lock, Database,
} from 'lucide-react';

/**
 * AdminOverviewSection — the dashboard landing view: KPI stat cards, a recent
 * activity feed, and the security/system-cleanup panel. Presentational; data +
 * the cleanup handler come from the AdminPanel shell.
 */
export default function AdminOverviewSection({ loadingStats, stats, pendingListings, users, onSystemCleanup }) {
    if (loadingStats) {
        return (
            <div className="h-[50vh] flex flex-col items-center justify-center gap-4">
                <div className="w-12 h-12 border-4 border-zinc-100 border-t-emerald-500 rounded-full animate-spin" />
                <p className="text-zinc-400 font-black text-xs uppercase tracking-widest animate-pulse">Syncing data...</p>
            </div>
        );
    }

    return (
        <div className="space-y-8">
            {/* Stat Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {[
                    { label: 'Platform Users', value: stats.totalUsers, icon: Users, growth: 'Live' },
                    { label: 'Total Properties', value: stats.totalListings, icon: Building2, growth: `${pendingListings} pending` },
                    { label: 'Verified Listings', value: stats.verifiedListings, icon: ShieldCheck, growth: 'Moat' },
                    { label: 'Verified Landlords', value: stats.verifiedLandlords, icon: CheckCircle, growth: 'Moat' },
                    { label: 'Pipeline Queue', value: stats.pendingRequests, icon: ClipboardList, growth: 'Live' },
                    { label: 'Move-Ins (Escrow)', value: stats.successfulMoveIns, icon: Home, growth: 'Scale' },
                    { label: 'Est. Revenue', value: `৳${stats.monthlyRevenue.toLocaleString()}`, icon: Banknote, growth: 'Total' },
                ].map((s, i) => (
                    <div key={i} className="group bg-white p-8 rounded-3xl shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all duration-500 border border-zinc-100">
                        <div className="flex justify-between items-start mb-6">
                            <div className="p-3 bg-emerald-50 text-emerald-500 rounded-2xl group-hover:bg-emerald-500 group-hover:text-white transition-all duration-400">
                                <s.icon size={20} />
                            </div>
                            <div className="flex items-center gap-1 text-[10px] font-black text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full">
                                <TrendingUp size={10} />
                                <span>{s.growth}</span>
                            </div>
                        </div>
                        <p className="text-zinc-400 text-[10px] font-black uppercase tracking-widest mb-1">{s.label}</p>
                        <div className="text-4xl font-black text-zinc-950 tabular-nums group-hover:text-emerald-600 transition-colors duration-400">{s.value}</div>
                    </div>
                ))}
            </div>

            {/* Activity + Security */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 bg-white rounded-3xl border border-zinc-100 shadow-sm overflow-hidden">
                    <div className="px-8 py-6 border-b border-zinc-50 flex items-center justify-between">
                        <h3 className="font-black text-zinc-950 flex items-center gap-2">
                            <Activity size={18} className="text-emerald-500" /> Active Events
                        </h3>
                        <span className="text-[10px] font-black text-zinc-400 uppercase tracking-widest px-2.5 py-1 bg-zinc-50 rounded-lg">Live</span>
                    </div>
                    <div className="divide-y divide-zinc-50">
                        {users.slice(0, 5).map((user, i) => (
                            <div key={i} className="flex items-center justify-between px-8 py-4 hover:bg-zinc-50/50 transition-colors">
                                <div className="flex items-center gap-4">
                                    <div className="w-9 h-9 bg-zinc-100 rounded-xl flex items-center justify-center font-black text-zinc-400 text-xs uppercase">{user.email?.[0]}</div>
                                    <div>
                                        <p className="text-sm font-bold text-zinc-900">{user.email}</p>
                                        <p className="text-[10px] text-zinc-400 font-bold uppercase tracking-widest">Authenticated</p>
                                    </div>
                                </div>
                                <span className="text-[10px] font-black text-zinc-400 tracking-widest">LIVE</span>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="bg-zinc-950 rounded-3xl p-8 text-white shadow-xl relative overflow-hidden group">
                    <div className="absolute -top-16 -right-16 w-64 h-64 bg-emerald-500/10 rounded-full blur-[80px] group-hover:bg-emerald-500/20 transition-all duration-700" />
                    <div className="relative z-10 space-y-6">
                        <div>
                            <p className="text-emerald-400 text-[9px] font-black uppercase tracking-widest mb-3 flex items-center gap-2">
                                <Lock size={10} /> Security Status
                            </p>
                            <div className="flex items-baseline gap-2">
                                <span className="text-4xl font-black">AES-256</span>
                                <span className="text-emerald-500 text-[9px] font-black animate-pulse uppercase tracking-widest">Active</span>
                            </div>
                        </div>
                        <button
                            onClick={onSystemCleanup}
                            className="w-full py-4 bg-emerald-500 hover:bg-emerald-600 text-white font-black rounded-2xl transition-all text-[10px] uppercase tracking-[0.2em] shadow-lg shadow-emerald-500/20 active:scale-[0.98] flex items-center justify-center gap-2"
                        >
                            <Database size={14} /> Synchronize & Cleanup Data
                        </button>
                        <div>
                            <div className="flex justify-between text-[9px] font-black uppercase tracking-widest mb-2">
                                <span className="text-zinc-500">Firewall</span>
                                <span className="text-emerald-500">100%</span>
                            </div>
                            <div className="w-full h-1 bg-zinc-800 rounded-full overflow-hidden">
                                <div className="w-full h-full bg-emerald-500 rounded-full" />
                            </div>
                        </div>
                        <div className="p-4 bg-zinc-900/60 rounded-2xl border border-white/5 flex items-start gap-3">
                            <ShieldCheck size={16} className="text-emerald-500 flex-shrink-0 mt-0.5" />
                            <p className="text-[11px] text-zinc-400 font-bold leading-relaxed">All operations encrypted and audited.</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
