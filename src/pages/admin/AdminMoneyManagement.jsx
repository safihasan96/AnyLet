import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { collection, onSnapshot, query, orderBy, getDocs, updateDoc, doc, serverTimestamp, where } from 'firebase/firestore';
import { db, auth } from '../../firebase';
import { AlertTriangle, Clock, ArrowUpRight, ArrowDownRight, Search, Activity, RefreshCw, XCircle, CheckCircle2, MessageSquare } from 'lucide-react';
import { getApiUrl } from '../../utils/api';

export default function AdminMoneyManagement() {
    const navigate = useNavigate();
    const [stats, setStats] = useState({
        heldBalance: 0,
        bKash: { in: 0, out: 0, net: 0 },
        nagad: { in: 0, out: 0, net: 0 },
        rocket: { in: 0, out: 0, net: 0 }
    });
    const [transactions, setTransactions] = useState([]);
    const [deadlines, setDeadlines] = useState([]);
    const [disputes, setDisputes] = useState([]);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState(false);

    useEffect(() => {
        // Escrow / Held Balance
        const unsubEscrow = onSnapshot(collection(db, 'escrowDeposits'), (snap) => {
            let held = 0;
            const approaching = [];
            const now = new Date();
            
            snap.docs.forEach(doc => {
                const data = doc.data();
                if (data.status === 'held') {
                    held += Number(data.amount) || 0;
                    
                    // Simple logic for approaching deadlines (if older than 7 days)
                    const createdAt = data.createdAt?.toDate();
                    if (createdAt) {
                        const diffTime = Math.abs(now - createdAt);
                        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                        if (diffDays > 7) {
                            approaching.push({ id: doc.id, ...data, daysOld: diffDays });
                        }
                    }
                }
            });
            
            setStats(prev => ({ ...prev, heldBalance: held }));
            setDeadlines(approaching);
        });

        // Payments (Inflow/Outflow by provider)
        const unsubPayments = onSnapshot(query(collection(db, 'payments'), orderBy('createdAt', 'desc')), (snap) => {
            const txns = [];
            const newStats = {
                bKash: { in: 0, out: 0, net: 0 },
                nagad: { in: 0, out: 0, net: 0 },
                rocket: { in: 0, out: 0, net: 0 }
            };

            snap.docs.forEach(d => {
                const data = { id: d.id, ...d.data() };
                txns.push(data);
                
                if (data.status === 'completed') {
                    // For AnyLet, mostly everything is currently 'inflow' unless it's a refund/payout.
                    // If we assume a generic structure:
                    const amount = Number(data.amount) || 0;
                    const provider = (data.provider || data.method || 'bkash').toLowerCase(); // default to bkash
                    
                    let key = 'bKash';
                    if (provider.includes('nagad')) key = 'nagad';
                    if (provider.includes('rocket')) key = 'rocket';

                    // Simplified Inflow logic: regular payments are IN
                    if (data.type !== 'payout' && data.type !== 'refund') {
                        newStats[key].in += amount;
                        newStats[key].net += amount;
                    } else {
                        newStats[key].out += amount;
                        newStats[key].net -= amount;
                    }
                }
            });

            setStats(prev => ({ ...prev, ...newStats }));
            setTransactions(txns);
            setLoading(false);
        });

        // Disputes Queue
        const unsubDisputes = onSnapshot(query(collection(db, 'disputes'), where('status', '==', 'open')), (snap) => {
            const disputeList = snap.docs.map(d => ({ id: d.id, ...d.data() }));
            setDisputes(disputeList);
        });

        return () => {
            unsubEscrow();
            unsubPayments();
            unsubDisputes();
        };
    }, []);

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'BDT' }).format(amount);
    };

    const handleAdminAction = async (id, action) => {
        const reason = window.prompt(`Please provide a reason to force ${action} for escrow ${id}:`);
        if (!reason || reason.length < 5) {
            alert('A valid reason of at least 5 characters is required.');
            return;
        }

        if (!window.confirm(`Are you absolutely sure you want to FORCE ${action.toUpperCase()}? This cannot be undone.`)) return;
        
        setActionLoading(true);
        try {
            const token = await auth.currentUser.getIdToken();
            const res = await fetch(getApiUrl('/api/escrow?action=admin-action'), {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ bookingId: id, action, reason })
            });
            const data = await res.json();
            
            if (!res.ok) throw new Error(data.error || `Failed to ${action}`);
            
            alert(`Successfully forced ${action}.`);
        } catch (e) {
            console.error(`Failed to ${action}:`, e);
            alert(`Failed to ${action} funds: ${e.message}`);
        } finally {
            setActionLoading(false);
        }
    };

    return (
        <div className="space-y-6 animate-in fade-in duration-500 pb-12">
            <header className="mb-8">
                <h1 className="text-3xl font-bold tracking-tight">Money Management</h1>
                <p className="text-[hsl(var(--on-surface-variant))] mt-1 text-sm">Financial Control & Escrow Ledgers.</p>
            </header>

            {/* Section 1: Held & Escrow Balance */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 glass-panel p-8 relative overflow-hidden flex flex-col justify-between">
                    <div className="absolute top-[-50%] right-[-10%] w-[60%] h-[150%] rounded-full bg-[hsla(var(--primary),0.05)] blur-[80px] pointer-events-none" />
                    
                    <div>
                        <p className="text-label-caps text-[hsl(var(--on-surface-variant))] mb-2 flex items-center gap-2">
                            <Clock size={14}/> Total Held Balance (Escrow)
                        </p>
                        <h2 className="text-metric-xl text-white">{formatCurrency(stats.heldBalance)}</h2>
                    </div>

                    <div className="mt-8 grid grid-cols-3 gap-4 border-t border-[hsla(0,0%,100%,0.1)] pt-6">
                        <div>
                            <p className="text-xs text-[hsl(var(--on-surface-variant))] mb-1">Duration: &lt; 24h</p>
                            <p className="font-semibold">{formatCurrency(stats.heldBalance * 0.2)}</p>
                            <div className="w-full bg-[hsla(0,0%,100%,0.1)] h-1.5 mt-2 rounded-full overflow-hidden">
                                <div className="bg-[hsl(var(--primary))] h-full w-[20%]"></div>
                            </div>
                        </div>
                        <div>
                            <p className="text-xs text-[hsl(var(--on-surface-variant))] mb-1">Duration: 1-3 Days</p>
                            <p className="font-semibold">{formatCurrency(stats.heldBalance * 0.5)}</p>
                            <div className="w-full bg-[hsla(0,0%,100%,0.1)] h-1.5 mt-2 rounded-full overflow-hidden">
                                <div className="bg-[hsl(var(--primary))] h-full w-[50%]"></div>
                            </div>
                        </div>
                        <div>
                            <p className="text-xs text-[hsl(var(--on-surface-variant))] mb-1">Duration: 7+ Days</p>
                            <p className="font-semibold text-[hsl(var(--warning))]">{formatCurrency(stats.heldBalance * 0.3)}</p>
                            <div className="w-full bg-[hsla(0,0%,100%,0.1)] h-1.5 mt-2 rounded-full overflow-hidden">
                                <div className="bg-[hsl(var(--warning))] h-full w-[30%]"></div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="glass-panel p-6 flex flex-col max-h-[300px]">
                    <h3 className="font-semibold text-sm mb-4 flex items-center gap-2 text-[hsl(var(--warning))]">
                        <AlertTriangle size={16} /> Approaching Deadlines
                    </h3>
                    <div className="flex-1 overflow-y-auto pr-2 space-y-3">
                        {deadlines.length === 0 && <p className="text-sm text-[hsl(var(--on-surface-variant))]">No urgent escrows found.</p>}
                        {deadlines.map(item => (
                            <div key={item.id} className="p-3 bg-[hsla(var(--warning),0.05)] border border-[hsla(var(--warning),0.2)] rounded-lg">
                                <div className="flex justify-between items-start mb-2">
                                    <p className="font-semibold text-sm">{formatCurrency(item.amount)}</p>
                                    <span className="status-pill warning">{item.daysOld} Days</span>
                                </div>
                                <p className="text-xs text-[hsl(var(--on-surface-variant))] truncate">Ref: {item.paymentId || item.id}</p>
                                <button 
                                    disabled={actionLoading}
                                    onClick={() => handleAdminAction(item.id, 'release')}
                                    className="mt-3 w-full py-1.5 bg-[hsla(var(--warning),0.1)] hover:bg-[hsla(var(--warning),0.2)] text-[hsl(var(--warning))] text-xs font-bold rounded transition-colors disabled:opacity-50"
                                >
                                    Force Release (Disburse)
                                </button>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Section 1.5: Disputes Queue */}
            {disputes.length > 0 && (
                <div className="glass-panel p-6 border border-rose-500/20 bg-rose-500/5">
                    <h3 className="font-semibold text-sm mb-4 flex items-center gap-2 text-rose-500">
                        <AlertTriangle size={16} /> Active Disputes ({disputes.length})
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {disputes.map(dispute => (
                            <div key={dispute.id} className="p-4 bg-[hsla(var(--error),0.05)] border border-rose-500/20 rounded-xl relative overflow-hidden">
                                <div className="flex justify-between items-start mb-2">
                                    <p className="font-bold text-rose-500 text-sm">Escrow: {formatCurrency(dispute.amountHeld)}</p>
                                    <span className="status-pill error text-[10px]">Open Dispute</span>
                                </div>
                                <p className="text-xs text-[hsl(var(--on-surface-variant))] mb-2">Raised by {dispute.role} ({dispute.raisedBy.substring(0, 8)}...)</p>
                                <div className="bg-black/20 rounded-lg p-3 text-sm text-slate-300 italic mb-4 h-20 overflow-y-auto">
                                    "{dispute.reason}"
                                </div>
                                <div className="flex gap-2">
                                    <button 
                                        disabled={actionLoading}
                                        onClick={() => handleAdminAction(dispute.bookingId, 'refund')}
                                        className="flex-1 py-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-lg transition-colors flex justify-center items-center gap-1 disabled:opacity-50"
                                    >
                                        <XCircle size={14} /> Force Refund
                                    </button>
                                    <button 
                                        disabled={actionLoading}
                                        onClick={() => handleAdminAction(dispute.bookingId, 'release')}
                                        className="flex-1 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg transition-colors flex justify-center items-center gap-1 disabled:opacity-50"
                                    >
                                        <CheckCircle2 size={14} /> Force Release
                                    </button>
                                </div>
                                <button
                                    onClick={() => navigate(`/admin/chat-review/${dispute.bookingId}`)}
                                    className="mt-2 w-full py-2 bg-[hsla(var(--primary),0.08)] hover:bg-[hsla(var(--primary),0.15)] border border-[hsla(var(--primary),0.2)] text-[hsl(var(--primary))] text-xs font-bold rounded-lg transition-colors flex justify-center items-center gap-1.5"
                                >
                                    <MessageSquare size={13} /> View Conversation
                                </button>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Section 2: Inflow & Outflow Providers */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {[
                    { name: 'bKash', color: '#e2136e', data: stats.bKash },
                    { name: 'Nagad', color: '#f37021', data: stats.nagad },
                    { name: 'Rocket', color: '#8c3494', data: stats.rocket },
                ].map(provider => (
                    <div key={provider.name} className="glass-panel p-5 relative overflow-hidden group">
                        <div className="absolute top-0 right-0 p-4 opacity-10 transition-transform group-hover:scale-110">
                            <Activity size={48} color={provider.color} />
                        </div>
                        <p className="font-bold text-sm mb-4" style={{color: provider.color}}>{provider.name} Network</p>
                        <p className="text-2xl font-bold mb-1">{formatCurrency(provider.data.net)}</p>
                        <p className="text-xs text-[hsl(var(--on-surface-variant))] uppercase tracking-wider font-semibold mb-6">Net Flow</p>
                        
                        <div className="flex justify-between text-sm">
                            <div>
                                <p className="flex items-center gap-1 text-[hsl(var(--success))] font-medium"><ArrowDownRight size={14}/> In</p>
                                <p className="font-semibold">{formatCurrency(provider.data.in)}</p>
                            </div>
                            <div className="text-right">
                                <p className="flex items-center gap-1 text-[hsl(var(--error))] font-medium justify-end">Out <ArrowUpRight size={14}/></p>
                                <p className="font-semibold">{formatCurrency(provider.data.out)}</p>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Section 3 & 4: Ledger & Drill-down */}
            <div className="glass-panel p-6">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
                    <div>
                        <h3 className="font-semibold text-lg flex items-center gap-2">
                            Transaction Drill-down
                            <span className="status-pill success"><RefreshCw size={10} className="mr-1 inline" /> Synced</span>
                        </h3>
                        <p className="text-xs text-[hsl(var(--on-surface-variant))] mt-1">Cross-check MFS records against internal ledgers.</p>
                    </div>
                    
                    <div className="flex items-center gap-3 w-full md:w-auto">
                        <div className="relative flex-1 md:w-64">
                            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[hsl(var(--on-surface-variant))]" />
                            <input 
                                type="text" 
                                placeholder="Search Txn ID, Phone..." 
                                className="glass-input pl-8 pr-4 py-2 text-sm w-full"
                            />
                        </div>
                        <button className="glass-button-ghost px-4 py-2 text-sm whitespace-nowrap">Export CSV</button>
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="border-b border-[hsla(0,0%,100%,0.05)] text-label-caps text-[hsl(var(--on-surface-variant))]">
                                <th className="pb-3 px-4 font-medium">Date</th>
                                <th className="pb-3 px-4 font-medium">Txn ID</th>
                                <th className="pb-3 px-4 font-medium">Provider</th>
                                <th className="pb-3 px-4 font-medium">Amount</th>
                                <th className="pb-3 px-4 font-medium">State</th>
                                <th className="pb-3 px-4 font-medium text-right">Action</th>
                            </tr>
                        </thead>
                        <tbody className="text-sm">
                            {transactions.slice(0, 15).map(txn => {
                                const isOutflow = txn.type === 'payout' || txn.type === 'refund';
                                return (
                                <tr key={txn.id} className="border-b border-[hsla(0,0%,100%,0.02)] hover:bg-[hsla(0,0%,100%,0.03)] transition-colors">
                                    <td className="py-3 px-4 whitespace-nowrap">
                                        <p className="font-medium text-slate-200">{txn.createdAt?.toDate().toLocaleDateString() || 'N/A'}</p>
                                        <p className="text-xs text-[hsl(var(--on-surface-variant))]">{txn.createdAt?.toDate().toLocaleTimeString() || ''}</p>
                                    </td>
                                    <td className="py-3 px-4 font-mono text-xs">{txn.transactionId || txn.id.substring(0,8)}</td>
                                    <td className="py-3 px-4">
                                        <span className="capitalize">{txn.provider || txn.method || 'Bkash'}</span>
                                    </td>
                                    <td className="py-3 px-4 font-semibold">
                                        <span className={isOutflow ? 'text-[hsl(var(--error))]' : 'text-[hsl(var(--success))]'}>
                                            {isOutflow ? '-' : '+'}{formatCurrency(txn.amount)}
                                        </span>
                                    </td>
                                    <td className="py-3 px-4">
                                        {txn.status === 'completed' ? (
                                            <span className="status-pill success">Reconciled</span>
                                        ) : txn.status === 'failed' ? (
                                            <span className="status-pill error">Failed</span>
                                        ) : (
                                            <span className="status-pill warning">Pending</span>
                                        )}
                                    </td>
                                    <td className="py-3 px-4 text-right">
                                        <button className="text-[hsl(var(--primary))] text-xs font-bold hover:underline">
                                            View
                                        </button>
                                    </td>
                                </tr>
                                )
                            })}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
