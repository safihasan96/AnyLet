import { motion } from 'framer-motion';
import { CreditCard, Shield, ArrowRight } from 'lucide-react';
import { listItemV } from './motion';

/**
 * StepOrderSummary — step 0: order breakdown, total, security note, and the
 * continue / claim-free CTA. Inner content only; the animated wrapper lives in
 * the PaymentModal shell.
 */
export default function StepOrderSummary({ title, subtitle, breakdownItems, amount, onContinue }) {
    return (
        <>
            <motion.div className="mb-6" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.06 }}>
                <h2 className="text-xl font-black text-slate-900 dark:text-white mb-1">{title}</h2>
                {subtitle && <p className="text-sm text-slate-500 font-medium">{subtitle}</p>}
            </motion.div>

            {/* Breakdown */}
            <motion.div
                className="bg-primary/5 dark:bg-primary/10 border border-primary/10 dark:border-primary/20 rounded-3xl p-6 mb-6"
                initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
            >
                <div className="flex items-center gap-2 mb-5">
                    <CreditCard size={15} className="text-primary dark:text-indigo-400" />
                    <p className="text-primary/60 dark:text-indigo-400/60 text-[10px] font-black uppercase tracking-widest">Order Summary</p>
                </div>
                <div className="space-y-3 mb-5">
                    {breakdownItems.map((item, i) => (
                        <motion.div
                            key={i} custom={i} variants={listItemV} initial="hidden" animate="visible"
                            className="flex items-center justify-between"
                        >
                            <span className="text-slate-600 dark:text-slate-400 text-sm font-medium">{item.label}</span>
                            <span className="text-slate-900 dark:text-white font-black text-sm">৳{item.amount.toLocaleString()}</span>
                        </motion.div>
                    ))}
                </div>
                <div className="border-t border-primary/10 dark:border-primary/20 pt-4 flex items-center justify-between">
                    <span className="text-slate-900 dark:text-white font-black text-sm">Total</span>
                    <motion.span
                        className="text-2xl font-black text-primary dark:text-indigo-400"
                        initial={{ opacity: 0, scale: 0.7 }} animate={{ opacity: 1, scale: 1 }}
                        transition={{ type: 'spring', stiffness: 460, damping: 20, delay: 0.18 }}
                    >
                        ৳{amount.toLocaleString()}
                    </motion.span>
                </div>
            </motion.div>

            {/* Security badge */}
            <motion.div
                className="flex items-center gap-3 bg-primary/5 dark:bg-primary/10 border border-primary/15 rounded-2xl p-4 mb-6"
                initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.18 }}
            >
                <Shield size={20} className="text-primary dark:text-indigo-400 shrink-0" />
                <p className="text-xs font-bold text-primary dark:text-indigo-400 leading-relaxed">
                    Secured by AnyLet. Your payment is verified automatically via your Transaction ID.
                </p>
            </motion.div>

            <motion.button
                onClick={onContinue}
                className="w-full py-5 bg-primary text-white font-black text-base rounded-[20px] shadow-xl shadow-primary/25 flex items-center justify-center gap-2 touch-manipulation"
                initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.22 }}
                whileTap={{ scale: 0.96 }}
            >
                {amount === 0 ? <>Claim Free Offer <ArrowRight size={18} /></> : <>Choose Payment Method <ArrowRight size={18} /></>}
            </motion.button>
        </>
    );
}
