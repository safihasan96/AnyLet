import { CheckCircle, Trash2 } from 'lucide-react';

/**
 * AdminPaymentsTab — three finance tables: manual payment verification, escrow
 * deposit management, and unclaimed webhook (SMS) transactions. Presentational;
 * data + handlers come from the AdminPanel shell.
 */
export default function AdminPaymentsTab({
    payments,
    escrowDeposits,
    webhookTxns,
    onApprovePayment,
    onRejectPayment,
    onReleaseEscrow,
    onApproveWebhookTxn,
}) {
    return (
        <div className="space-y-8">
            <div className="bg-white rounded-3xl border border-zinc-100 shadow-sm overflow-hidden">
                <div className="px-8 py-8 border-b border-zinc-50">
                    <h3 className="text-2xl font-black text-zinc-950">Payment Verification</h3>
                    <p className="text-sm text-zinc-400 font-bold mt-1">
                        {payments.filter(p => p.status === 'pending').length} pending verifications
                    </p>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="text-zinc-400 text-[10px] font-black uppercase tracking-widest border-b border-zinc-50">
                                <th className="px-8 py-5">Payment Type & Package</th>
                                <th className="px-8 py-5">Amount & Method</th>
                                <th className="px-8 py-5">Transaction ID</th>
                                <th className="px-8 py-5 text-center">Status</th>
                                <th className="px-8 py-5 text-center">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-zinc-50">
                            {payments.length === 0 ? (
                                <tr><td colSpan="5" className="text-center py-8 text-zinc-400">No payments found.</td></tr>
                            ) : payments.map(payment => (
                                <tr key={payment.id} className="group hover:bg-zinc-50/50 transition-colors">
                                    <td className="px-8 py-6">
                                        <p className="font-black text-zinc-950 tracking-tight">{(payment.type || '').replace('_', ' ').toUpperCase()}</p>
                                        {payment.type === 'subscription' && payment.metadata?.plan ? (
                                            <p className="text-[10px] font-black text-emerald-600 uppercase tracking-widest mt-1">Package: {payment.metadata.plan}</p>
                                        ) : (
                                            <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest mt-1">Prop: {payment.propertyName || 'N/A'}</p>
                                        )}
                                    </td>
                                    <td className="px-8 py-6">
                                        <span className="font-black text-emerald-600">৳{payment.amount?.toLocaleString()}</span>
                                        <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest mt-0.5">{payment.paymentMethod || payment.method || 'Unknown'}</p>
                                    </td>
                                    <td className="px-8 py-6">
                                        <p className="text-sm font-bold text-zinc-950 tracking-wider font-mono">{payment.transactionId}</p>
                                        {payment.metadata?.userEmail && <p className="text-[10px] text-zinc-400 font-bold mt-1">{payment.metadata.userEmail}</p>}
                                        {payment.verifiedBy === 'sms-watcher' && (
                                            <div className="mt-2 p-1.5 bg-emerald-50 rounded-md border border-emerald-100 inline-block">
                                                <span className="text-[9px] font-black uppercase tracking-widest text-emerald-600 flex items-center gap-1">
                                                    <CheckCircle size={10} /> Auto-Verified ({payment.smsProvider || 'SMS'})
                                                </span>
                                                <span className="text-[10px] font-bold text-emerald-600/70 mt-0.5 block">
                                                    Sender: {payment.smsSenderNumber || 'Unknown'}
                                                </span>
                                            </div>
                                        )}
                                    </td>
                                    <td className="px-8 py-6 text-center">
                                        <span className={`text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-widest ${payment.status === 'completed' ? 'bg-emerald-50 text-emerald-600' : payment.status === 'failed' ? 'bg-red-50 text-red-600' : 'bg-amber-50 text-amber-600'}`}>
                                            {payment.status}
                                        </span>
                                    </td>
                                    <td className="px-8 py-6">
                                        {payment.status === 'pending' && (
                                            <div className="flex justify-center gap-2">
                                                <button onClick={() => onApprovePayment(payment)} className="p-2 bg-emerald-50 text-emerald-600 rounded-xl hover:bg-emerald-500 hover:text-white transition-colors" title="Approve">
                                                    <CheckCircle size={16} />
                                                </button>
                                                <button onClick={() => onRejectPayment(payment)} className="p-2 bg-red-50 text-red-600 rounded-xl hover:bg-red-500 hover:text-white transition-colors" title="Reject">
                                                    <Trash2 size={16} />
                                                </button>
                                            </div>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            <div className="bg-white rounded-3xl border border-zinc-100 shadow-sm overflow-hidden">
                <div className="px-8 py-8 border-b border-zinc-50">
                    <h3 className="text-2xl font-black text-zinc-950">Escrow Management</h3>
                    <p className="text-sm text-zinc-400 font-bold mt-1">
                        {escrowDeposits.filter(e => e.status === 'held').length} deposits currently held
                    </p>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="text-zinc-400 text-[10px] font-black uppercase tracking-widest border-b border-zinc-50">
                                <th className="px-8 py-5">Property & Tenant</th>
                                <th className="px-8 py-5">Deposit</th>
                                <th className="px-8 py-5 text-center">Status</th>
                                <th className="px-8 py-5 text-center">Confirmations</th>
                                <th className="px-8 py-5 text-center">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-zinc-50">
                            {escrowDeposits.length === 0 ? (
                                <tr><td colSpan="5" className="text-center py-8 text-zinc-400">No escrow deposits.</td></tr>
                            ) : escrowDeposits.map(escrow => (
                                <tr key={escrow.id} className="group hover:bg-zinc-50/50 transition-colors">
                                    <td className="px-8 py-6">
                                        <p className="font-black text-zinc-950 tracking-tight">{escrow.propertyName}</p>
                                        <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest mt-1">Tenant ID: {escrow.tenantId?.slice(0,6)}...</p>
                                    </td>
                                    <td className="px-8 py-6">
                                        <span className="font-black text-emerald-600">৳{escrow.depositAmount?.toLocaleString()}</span>
                                    </td>
                                    <td className="px-8 py-6 text-center">
                                        <span className={`text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-widest ${escrow.status === 'released' ? 'bg-emerald-50 text-emerald-600' : 'bg-blue-50 text-blue-600 dark:text-blue-400'}`}>
                                            {escrow.status}
                                        </span>
                                    </td>
                                    <td className="px-8 py-6 text-center">
                                        <div className="flex flex-col gap-1 items-center">
                                            <span className={`text-[9px] font-black uppercase tracking-widest ${escrow.confirmedByTenant ? 'text-emerald-500' : 'text-zinc-400'}`}>
                                                Tenant: {escrow.confirmedByTenant ? 'Yes' : 'No'}
                                            </span>
                                            <span className={`text-[9px] font-black uppercase tracking-widest ${escrow.confirmedByOwner ? 'text-emerald-500' : 'text-zinc-400'}`}>
                                                Owner: {escrow.confirmedByOwner ? 'Yes' : 'No'}
                                            </span>
                                        </div>
                                    </td>
                                    <td className="px-8 py-6">
                                        {escrow.status === 'held' && escrow.confirmedByTenant && escrow.confirmedByOwner && (
                                            <div className="flex justify-center">
                                                <button onClick={() => onReleaseEscrow(escrow.id)} className="px-4 py-2 bg-emerald-500 text-white font-black text-[10px] uppercase tracking-widest rounded-xl hover:bg-emerald-600 transition-colors shadow-lg shadow-emerald-500/20">
                                                    Release Funds
                                                </button>
                                            </div>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            <div className="bg-white rounded-3xl border border-zinc-100 shadow-sm overflow-hidden">
                <div className="px-8 py-8 border-b border-zinc-50">
                    <h3 className="text-2xl font-black text-zinc-950">Webhook SMS Transactions</h3>
                    <p className="text-sm text-zinc-400 font-bold mt-1">
                        {webhookTxns.filter(t => t.status === 'unclaimed').length} unclaimed transactions
                    </p>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="text-zinc-400 text-[10px] font-black uppercase tracking-widest border-b border-zinc-50">
                                <th className="px-8 py-5">Transaction ID</th>
                                <th className="px-8 py-5">Amount & Provider</th>
                                <th className="px-8 py-5">Sender Number</th>
                                <th className="px-8 py-5">Date & Time</th>
                                <th className="px-8 py-5 text-center">Status</th>
                                <th className="px-8 py-5 text-center">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-zinc-50">
                            {webhookTxns.length === 0 ? (
                                <tr><td colSpan="6" className="text-center py-8 text-zinc-400">No webhook transactions.</td></tr>
                            ) : webhookTxns.map(txn => (
                                <tr key={txn.id} className="group hover:bg-zinc-50/50 transition-colors">
                                    <td className="px-8 py-6">
                                        <p className="text-sm font-bold text-zinc-950 tracking-wider font-mono">{txn.transactionId}</p>
                                    </td>
                                    <td className="px-8 py-6">
                                        <span className="font-black text-emerald-600">৳{txn.amount?.toLocaleString()}</span>
                                        <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest mt-0.5">{txn.provider || 'Unknown'}</p>
                                    </td>
                                    <td className="px-8 py-6">
                                        <p className="text-sm font-bold text-zinc-950 tracking-tight">{txn.senderNumber || 'N/A'}</p>
                                    </td>
                                    <td className="px-8 py-6">
                                        <p className="text-xs font-bold text-zinc-500">
                                            {txn.receivedAt?.toDate ? txn.receivedAt.toDate().toLocaleString() : 'N/A'}
                                        </p>
                                    </td>
                                    <td className="px-8 py-6 text-center">
                                        <span className={`text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-widest ${txn.status === 'claimed' ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'}`}>
                                            {txn.status}
                                        </span>
                                    </td>
                                    <td className="px-8 py-6">
                                        {txn.status === 'unclaimed' && (
                                            <div className="flex justify-center">
                                                <button onClick={() => onApproveWebhookTxn(txn)} className="px-4 py-2 bg-emerald-50 text-emerald-600 font-black text-[10px] uppercase tracking-widest rounded-xl hover:bg-emerald-500 hover:text-white transition-colors">
                                                    Approve
                                                </button>
                                            </div>
                                        )}
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
