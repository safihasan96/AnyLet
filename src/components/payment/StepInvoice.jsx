import { motion } from 'framer-motion';
import { CheckCircle2, Receipt, Building2 } from 'lucide-react';
import { iconBounceV, invoiceLineV } from './motion';

/**
 * StepInvoice — step 4: success state with a verified payment invoice. Inner
 * content only; the animated wrapper lives in the PaymentModal shell.
 */
export default function StepInvoice({ verifyResult, txnId, method, normalizedBookingType, propertyName, amount, onDone }) {
    return (
        <>
            {/* Success icon */}
            <div className="flex flex-col items-center text-center mb-8">
                <motion.div
                    className="relative mb-6 transform-gpu"
                    variants={iconBounceV} initial="hidden" animate="visible"
                >
                    <div className="size-28 rounded-[32px] bg-gradient-to-br from-emerald-400 to-green-600 flex items-center justify-center shadow-2xl shadow-emerald-500/30">
                        <CheckCircle2 size={52} className="text-white drop-shadow-lg" />
                    </div>
                </motion.div>
                <motion.div
                    className="inline-flex items-center gap-1.5 bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 px-3 py-1.5 rounded-full text-xs font-black uppercase tracking-widest mb-3"
                    initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.3 }}
                >
                    <CheckCircle2 size={12} strokeWidth={3} /> Payment Verified
                </motion.div>
                <motion.h2
                    className="text-2xl font-black text-slate-900 dark:text-white mb-2"
                    initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}
                >
                    {normalizedBookingType === 'listing' ? 'Listing Paid! Pending Approval' : 'Payment Confirmed! 🎉'}
                </motion.h2>
                <motion.p
                    className="text-slate-500 dark:text-slate-400 text-sm font-medium"
                    initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}
                >
                    {verifyResult?.message || 'Your payment has been verified and recorded.'}
                </motion.p>
            </div>

            {/* Invoice Card */}
            <motion.div
                className="bg-slate-50 dark:bg-slate-800 rounded-3xl overflow-hidden mb-6"
                initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35, type: 'spring', stiffness: 280, damping: 28 }}
            >
                {/* Invoice header */}
                <div className="bg-gradient-to-r from-primary to-indigo-600 px-6 py-4 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <Receipt size={18} className="text-white" />
                        <span className="text-white font-black text-sm uppercase tracking-wider">Payment Invoice</span>
                    </div>
                    <div className="flex items-center gap-1.5 bg-white/20 rounded-full px-2.5 py-1">
                        <div className="size-1.5 rounded-full bg-emerald-400" />
                        <span className="text-white text-[10px] font-black uppercase tracking-widest">Verified</span>
                    </div>
                </div>

                {/* Invoice body */}
                <div className="px-6 py-5 space-y-3">
                    {[
                        { label: 'Transaction ID', value: verifyResult?.transactionId || txnId, mono: true },
                        { label: 'Payment Method', value: method?.name || 'Mobile Banking' },
                        { label: 'Payment Type', value: (normalizedBookingType || 'listing').replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase()) },
                        propertyName ? { label: 'Property', value: propertyName } : null,
                        { label: 'Date', value: new Date(verifyResult?.verifiedAt || Date.now()).toLocaleString('en-BD', { dateStyle: 'medium', timeStyle: 'short' }) },
                    ].filter(Boolean).map((row, i) => (
                        <motion.div
                            key={row.label} custom={i}
                            variants={invoiceLineV} initial="hidden" animate="visible"
                            className="flex items-center justify-between"
                        >
                            <span className="text-slate-500 dark:text-slate-400 text-sm">{row.label}</span>
                            <span className={`text-slate-900 dark:text-white text-sm font-black ${row.mono ? 'font-mono tracking-wider' : ''}`}>
                                {row.value}
                            </span>
                        </motion.div>
                    ))}

                    {/* Total divider */}
                    <div className="border-t border-slate-200 dark:border-slate-700 pt-3 mt-1 flex items-center justify-between">
                        <span className="text-slate-900 dark:text-white font-black text-base">Amount Paid</span>
                        <motion.span
                            className="text-2xl font-black text-emerald-600 dark:text-emerald-400"
                            initial={{ opacity: 0, scale: 0.6 }} animate={{ opacity: 1, scale: 1 }}
                            transition={{ type: 'spring', stiffness: 460, damping: 20, delay: 0.6 }}
                        >
                            ৳{(verifyResult?.amount || amount).toLocaleString()}
                        </motion.span>
                    </div>
                </div>

                {/* Admin approval notice for listings */}
                {normalizedBookingType === 'listing' && (
                    <motion.div
                        className="mx-6 mb-6 flex items-start gap-3 bg-primary/5 dark:bg-primary/10 border border-primary/15 rounded-2xl p-4"
                        initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.7 }}
                    >
                        <Building2 size={18} className="text-primary dark:text-indigo-400 shrink-0 mt-0.5" />
                        <p className="text-xs font-bold text-primary dark:text-indigo-400 leading-relaxed">
                            Payment verified. Your listing is now in the review queue and will be published after admin approval — usually within 24 hours.
                        </p>
                    </motion.div>
                )}
            </motion.div>

            <motion.button
                onClick={onDone}
                className="w-full py-5 bg-emerald-500 text-white font-black text-base rounded-[20px] shadow-xl shadow-emerald-500/25 flex items-center justify-center gap-2 touch-manipulation"
                initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                whileTap={{ scale: 0.96 }}
                transition={{ type: 'spring', stiffness: 460, damping: 22, delay: 0.5 }}
            >
                {normalizedBookingType === 'listing' ? 'View My Listings →' : 'Done'} <CheckCircle2 size={18} />
            </motion.button>
        </>
    );
}
