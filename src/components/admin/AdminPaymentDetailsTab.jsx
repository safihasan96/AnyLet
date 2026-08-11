import { Receipt } from 'lucide-react';

/**
 * AdminPaymentDetailsTab — detailed view of inbound SMS-webhook transactions
 * (provider, sender, claim status). Presentational; data + handler come from the
 * AdminPanel shell.
 */
export default function AdminPaymentDetailsTab({ webhookTxns, onApproveWebhookTxn }) {
    return (
        <div className="space-y-8">
            <div className="bg-white rounded-3xl border border-zinc-100 shadow-sm overflow-hidden">
                <div className="px-8 py-8 border-b border-zinc-50">
                    <div className="flex items-center justify-between">
                        <div>
                            <h3 className="text-2xl font-black text-zinc-950">SMS Webhook Payment Details</h3>
                            <p className="text-sm text-zinc-400 font-bold mt-1">
                                {webhookTxns.filter(t => t.status === 'unclaimed').length} unclaimed · {webhookTxns.filter(t => t.status === 'claimed').length} claimed
                            </p>
                        </div>
                        <div className="flex items-center gap-2 px-4 py-2 bg-emerald-50 rounded-xl">
                            <div className={`w-2 h-2 rounded-full ${webhookTxns.length > 0 ? 'bg-emerald-500 animate-pulse' : 'bg-zinc-300'}`} />
                            <span className="text-[10px] font-black uppercase tracking-widest text-emerald-600">{webhookTxns.length > 0 ? 'Live' : 'Waiting'}</span>
                        </div>
                    </div>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="text-zinc-400 text-[10px] font-black uppercase tracking-widest border-b border-zinc-50">
                                <th className="px-8 py-5">Provider</th>
                                <th className="px-8 py-5">Sender Number</th>
                                <th className="px-8 py-5">Transaction ID</th>
                                <th className="px-8 py-5">Amount</th>
                                <th className="px-8 py-5">Date & Time</th>
                                <th className="px-8 py-5 text-center">Status</th>
                                <th className="px-8 py-5 text-center">Claimed By</th>
                                <th className="px-8 py-5 text-center">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-zinc-50">
                            {webhookTxns.length === 0 ? (
                                <tr><td colSpan="8" className="text-center py-16 text-zinc-400">
                                    <div className="flex flex-col items-center gap-3">
                                        <Receipt size={32} className="text-zinc-300" />
                                        <span className="font-bold">No webhook transactions yet.</span>
                                        <span className="text-xs text-zinc-400">SMS payments will appear here automatically.</span>
                                    </div>
                                </td></tr>
                            ) : webhookTxns.map(txn => (
                                <tr key={txn.id} className="group hover:bg-zinc-50/50 transition-colors">
                                    <td className="px-8 py-6">
                                        {txn.provider ? (
                                            <span className={`text-[10px] font-black px-3 py-1.5 rounded-full uppercase tracking-widest ${
                                                txn.provider === 'bkash' ? 'bg-pink-50 text-pink-600' :
                                                txn.provider === 'nagad' ? 'bg-orange-50 text-orange-600' :
                                                txn.provider === 'rocket' ? 'bg-purple-50 text-purple-600' :
                                                'bg-zinc-50 text-zinc-500'
                                            }`}>
                                                {txn.provider}
                                            </span>
                                        ) : (
                                            <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Unknown</span>
                                        )}
                                    </td>
                                    <td className="px-8 py-6">
                                        <p className="text-sm font-bold text-zinc-950 tracking-tight">{txn.senderNumber || 'N/A'}</p>
                                    </td>
                                    <td className="px-8 py-6">
                                        <p className="text-sm font-bold text-zinc-950 tracking-wider font-mono">{txn.transactionId}</p>
                                    </td>
                                    <td className="px-8 py-6">
                                        <span className="font-black text-emerald-600">৳{txn.amount?.toLocaleString()}</span>
                                    </td>
                                    <td className="px-8 py-6">
                                        <p className="text-xs font-bold text-zinc-500">
                                            {txn.receivedAt?.toDate ? txn.receivedAt.toDate().toLocaleString('en-GB', { dateStyle: 'medium', timeStyle: 'short' }) : 'N/A'}
                                        </p>
                                    </td>
                                    <td className="px-8 py-6 text-center">
                                        <span className={`text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-widest ${
                                            txn.status === 'claimed' ? 'bg-emerald-50 text-emerald-600' :
                                            txn.status === 'unclaimed' ? 'bg-amber-50 text-amber-600' :
                                            'bg-zinc-50 text-zinc-500'
                                        }`}>
                                            {txn.status}
                                        </span>
                                    </td>
                                    <td className="px-8 py-6 text-center">
                                        {txn.claimedBy ? (
                                            <div className="flex flex-col gap-1 items-center">
                                                <span className="text-[10px] font-bold text-zinc-600">{txn.claimedBy?.slice(0,8)}...</span>
                                                {txn.claimedAt?.toDate && (
                                                    <span className="text-[9px] text-zinc-400 font-medium">
                                                        {txn.claimedAt.toDate().toLocaleDateString('en-GB')}
                                                    </span>
                                                )}
                                                {txn.bookingType && (
                                                    <span className="text-[9px] font-black text-blue-500 uppercase tracking-widest">{txn.bookingType}</span>
                                                )}
                                            </div>
                                        ) : (
                                            <span className="text-[10px] font-bold text-zinc-300 uppercase tracking-widest">—</span>
                                        )}
                                    </td>
                                    <td className="px-8 py-6">
                                        {txn.status === 'unclaimed' && (
                                            <div className="flex justify-center">
                                                <button
                                                    onClick={() => onApproveWebhookTxn(txn)}
                                                    className="px-3 py-2 bg-amber-50 text-amber-600 font-black text-[10px] uppercase tracking-widest rounded-xl hover:bg-amber-500 hover:text-white transition-colors shadow-sm"
                                                    title="Manually claim this transaction"
                                                >
                                                    Mark Claimed
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
