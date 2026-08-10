import React, { useState, useEffect } from 'react';
import { collection, onSnapshot, query, where, limit, orderBy } from 'firebase/firestore';
import { db } from '../../firebase';
import { TrendingUp, TrendingDown, AlertCircle, Building2, Search, ArrowRight } from 'lucide-react';

// Placeholder bar heights for the mock activity chart. Computed once at module
// load so they stay stable across renders (Math.random() during render is impure
// and made the bars jump on every re-render).
const MOCK_CHART_BARS = Array.from({ length: 30 }, () => ({
    success: Math.random() * 60 + 20,
    primary: Math.random() * 40 + 10,
}));

export default function AdminOverview() {
    const [stats, setStats] = useState({
        totalHeldBalance: 0,
        activeDisputes: 0,
        todayInflow: 0,
    });
    
    const [propertyHealth, setPropertyHealth] = useState([]);
    const [, setLoading] = useState(true);

    useEffect(() => {
        // Fetch escrow deposits for Held Balance
        const unsubEscrow = onSnapshot(collection(db, 'escrowDeposits'), (snap) => {
            let held = 0;
            snap.docs.forEach(doc => {
                const data = doc.data();
                if (data.status === 'held') {
                    held += Number(data.amount) || 0;
                }
            });
            setStats(prev => ({ ...prev, totalHeldBalance: held }));
        });

        // Fetch active disputes (from reports or enquiries marked as dispute)
        const unsubDisputes = onSnapshot(
            query(collection(db, 'reports'), where('status', '!=', 'resolved')),
            (snap) => {
                setStats(prev => ({ ...prev, activeDisputes: snap.size }));
            }
        );

        // Fetch today's inflow
        const startOfDay = new Date();
        startOfDay.setHours(0,0,0,0);
        
        const unsubPayments = onSnapshot(
            query(collection(db, 'payments'), where('status', '==', 'completed')),
            (snap) => {
                let today = 0;
                snap.docs.forEach(doc => {
                    const data = doc.data();
                    const createdAt = data.createdAt?.toDate() || new Date(0);
                    if (createdAt >= startOfDay) {
                        today += Number(data.amount) || 0;
                    }
                });
                setStats(prev => ({ ...prev, todayInflow: today }));
                setLoading(false);
            }
        );

        // Fetch some recent properties for health table
        const unsubProps = onSnapshot(
            query(collection(db, 'properties'), orderBy('createdAt', 'desc'), limit(5)),
            (snap) => {
                const props = snap.docs.map(d => ({ id: d.id, ...d.data() }));
                setPropertyHealth(props);
            }
        );

        return () => {
            unsubEscrow();
            unsubDisputes();
            unsubPayments();
            unsubProps();
        };
    }, []);

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'BDT' }).format(amount);
    };

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            <header className="mb-8">
                <h1 className="text-3xl font-bold tracking-tight">Overview Dashboard</h1>
                <p className="text-[hsl(var(--on-surface-variant))] mt-1 text-sm">Real-time operational command center.</p>
            </header>

            {/* Top Row: High-Level Platform Health */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="glass-panel glass-panel-interactive p-6 flex flex-col justify-between">
                    <div>
                        <p className="text-label-caps text-[hsl(var(--on-surface-variant))] mb-2">Total Held Balance</p>
                        <h2 className="text-metric-lg">{formatCurrency(stats.totalHeldBalance)}</h2>
                    </div>
                    <div className="mt-4 flex items-center justify-between">
                        <div className="flex items-center gap-1 text-[hsl(var(--success))] text-sm font-semibold">
                            <TrendingUp size={16} /> +12%
                        </div>
                        <div className="h-6 w-24 bg-[hsla(var(--success),0.2)] rounded-full overflow-hidden relative">
                            {/* Fake sparkline */}
                            <svg viewBox="0 0 100 24" className="absolute inset-0 w-full h-full stroke-[hsl(var(--success))] fill-none" strokeWidth="2" preserveAspectRatio="none">
                                <path d="M0,20 L20,15 L40,18 L60,10 L80,14 L100,4" />
                            </svg>
                        </div>
                    </div>
                </div>

                <div className="glass-panel glass-panel-interactive p-6 flex flex-col justify-between">
                    <div>
                        <p className="text-label-caps text-[hsl(var(--on-surface-variant))] mb-2">Active Disputes</p>
                        <h2 className="text-metric-lg">{stats.activeDisputes}</h2>
                    </div>
                    <div className="mt-4 flex items-center justify-between">
                        <div className="flex items-center gap-1 text-[hsl(var(--warning))] text-sm font-semibold">
                            <TrendingDown size={16} /> -5%
                        </div>
                        <span className="status-pill warning flex gap-1"><AlertCircle size={12} /> Needs Attention</span>
                    </div>
                </div>

                <div className="glass-panel glass-panel-interactive p-6 flex flex-col justify-between">
                    <div>
                        <p className="text-label-caps text-[hsl(var(--on-surface-variant))] mb-2">Today's Inflow</p>
                        <h2 className="text-metric-lg text-[hsl(var(--success))]">{formatCurrency(stats.todayInflow)}</h2>
                    </div>
                    <div className="mt-4 flex items-center justify-between">
                        <div className="flex items-center gap-1 text-[hsl(var(--success))] text-sm font-semibold">
                            <TrendingUp size={16} /> +8%
                        </div>
                        <div className="h-6 w-24 bg-[hsla(var(--success),0.2)] rounded-full overflow-hidden relative">
                            {/* Fake sparkline */}
                            <svg viewBox="0 0 100 24" className="absolute inset-0 w-full h-full stroke-[hsl(var(--success))] fill-none" strokeWidth="2" preserveAspectRatio="none">
                                <path d="M0,24 L20,12 L40,20 L60,10 L80,12 L100,2" />
                            </svg>
                        </div>
                    </div>
                </div>
            </div>

            {/* Middle Row: Operations Overview */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 glass-panel p-6 flex flex-col">
                    <div className="flex justify-between items-center mb-6">
                        <h3 className="font-semibold text-lg">Booking Inflow vs Outflow</h3>
                        <select className="glass-input px-3 py-1 text-sm bg-transparent border border-[hsla(0,0%,100%,0.1)]">
                            <option>Last 30 Days</option>
                            <option>This Week</option>
                        </select>
                    </div>
                    <div className="flex-1 min-h-[200px] flex items-end gap-2 pt-10 border-b border-[hsla(0,0%,100%,0.05)] relative">
                        {/* Mock Chart lines for now to simulate high density data */}
                        {MOCK_CHART_BARS.map((bar, i) => (
                            <div key={i} className="flex-1 flex flex-col justify-end gap-1 group relative">
                                <div
                                    className="w-full bg-[hsl(var(--success))] rounded-t-sm opacity-80 group-hover:opacity-100 transition-opacity"
                                    style={{height: `${bar.success}%`}}
                                />
                                <div
                                    className="w-full bg-[hsl(var(--primary))] rounded-t-sm opacity-80 group-hover:opacity-100 transition-opacity"
                                    style={{height: `${bar.primary}%`}}
                                />
                                {/* Tooltip mock */}
                                <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 bg-[hsl(var(--surface-container-highest))] p-2 rounded text-[10px] hidden group-hover:block whitespace-nowrap z-20 shadow-lg border border-[hsla(0,0%,100%,0.1)]">
                                    Inflow: +20% <br/> Outflow: -5%
                                </div>
                            </div>
                        ))}
                    </div>
                    <div className="flex gap-4 mt-4 text-xs font-medium text-[hsl(var(--on-surface-variant))]">
                        <div className="flex items-center gap-2"><div className="w-3 h-3 rounded bg-[hsl(var(--success))]"></div> Inflow</div>
                        <div className="flex items-center gap-2"><div className="w-3 h-3 rounded bg-[hsl(var(--primary))]"></div> Outflow</div>
                    </div>
                </div>

                <div className="glass-panel p-6">
                    <h3 className="font-semibold text-lg mb-4">Recent Activity</h3>
                    <div className="space-y-4">
                        {[1,2,3,4].map(i => (
                            <div key={i} className="flex gap-3 items-start p-3 rounded-lg hover:bg-[hsla(0,0%,100%,0.03)] transition-colors">
                                <div className="w-8 h-8 rounded-full bg-[hsla(var(--primary),0.2)] flex items-center justify-center shrink-0">
                                    <Building2 size={14} className="text-[hsl(var(--primary))]" />
                                </div>
                                <div>
                                    <p className="text-sm font-medium">New Booking Confirmed</p>
                                    <p className="text-xs text-[hsl(var(--on-surface-variant))]">Property ID: #PROP-{(9000-i)}</p>
                                    <p className="text-[10px] text-[hsl(var(--on-surface-variant))] mt-1">{i * 12} mins ago</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Bottom Row: Property Listings Health */}
            <div className="glass-panel p-6">
                <div className="flex justify-between items-center mb-6">
                    <h3 className="font-semibold text-lg">Property Listings Health</h3>
                    <div className="flex items-center gap-2">
                        <div className="relative">
                            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[hsl(var(--on-surface-variant))]" />
                            <input 
                                type="text" 
                                placeholder="Search listings..." 
                                className="glass-input pl-8 pr-4 py-1.5 text-sm"
                            />
                        </div>
                        <button className="glass-button-ghost px-4 py-1.5 text-sm">View All</button>
                    </div>
                </div>
                
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="border-b border-[hsla(0,0%,100%,0.05)] text-label-caps text-[hsl(var(--on-surface-variant))]">
                                <th className="pb-3 px-4 font-medium">Property</th>
                                <th className="pb-3 px-4 font-medium">Status</th>
                                <th className="pb-3 px-4 font-medium">Views</th>
                                <th className="pb-3 px-4 font-medium text-right">Action</th>
                            </tr>
                        </thead>
                        <tbody className="text-sm">
                            {propertyHealth.length === 0 && (
                                <tr>
                                    <td colSpan="4" className="py-8 text-center text-[hsl(var(--on-surface-variant))]">No recent properties found.</td>
                                </tr>
                            )}
                            {propertyHealth.map((prop) => (
                                <tr key={prop.id} className="border-b border-[hsla(0,0%,100%,0.05)] hover:bg-[hsla(0,0%,100%,0.02)] transition-colors group">
                                    <td className="py-4 px-4">
                                        <p className="font-medium truncate max-w-[200px]">{prop.title}</p>
                                        <p className="text-xs text-[hsl(var(--on-surface-variant))]">{prop.location}</p>
                                    </td>
                                    <td className="py-4 px-4">
                                        {prop.isApproved ? (
                                            <span className="status-pill success">Active</span>
                                        ) : prop.isRejected ? (
                                            <span className="status-pill error">Rejected</span>
                                        ) : (
                                            <span className="status-pill warning">Pending</span>
                                        )}
                                    </td>
                                    <td className="py-4 px-4">
                                        {prop.views || 0}
                                    </td>
                                    <td className="py-4 px-4 text-right">
                                        <button className="text-[hsl(var(--primary))] hover:text-[hsl(var(--primary-container))] opacity-0 group-hover:opacity-100 transition-all">
                                            <ArrowRight size={16} />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
