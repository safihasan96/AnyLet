import { motion } from 'framer-motion';
import { XCircle, AlertTriangle, HelpCircle } from 'lucide-react';
import { iconBounceV } from './motion';

/**
 * StepFailed — step 5: verification-failure state with retry + support. Inner
 * content only; the animated wrapper lives in the PaymentModal shell.
 */
export default function StepFailed({ verifyResult, onRetry }) {
    return (
        <>
            <motion.div
                className="relative mb-8 transform-gpu"
                variants={iconBounceV} initial="hidden" animate="visible"
            >
                <div className="size-28 rounded-[32px] bg-gradient-to-br from-rose-400 to-red-600 flex items-center justify-center shadow-2xl shadow-rose-500/30">
                    <XCircle size={52} className="text-white drop-shadow-lg" />
                </div>
            </motion.div>

            <motion.div
                className="inline-flex items-center gap-1.5 bg-rose-50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400 px-3 py-1.5 rounded-full text-xs font-black uppercase tracking-widest mb-4"
                initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.3 }}
            >
                <XCircle size={12} strokeWidth={3} /> Verification Failed
            </motion.div>

            <motion.h2
                className="text-2xl font-black text-slate-900 dark:text-white mb-3"
                initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}
            >
                Payment Not Found
            </motion.h2>

            <motion.div
                className="bg-rose-50 dark:bg-rose-500/10 border border-rose-100 dark:border-rose-500/20 rounded-2xl p-4 mb-8 text-left w-full"
                initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}
            >
                <div className="flex items-start gap-3">
                    <AlertTriangle size={18} className="text-rose-500 shrink-0 mt-0.5" />
                    <p className="text-sm font-bold text-rose-700 dark:text-rose-300 leading-relaxed">
                        {verifyResult?.error || 'We could not verify your payment. Please check your Transaction ID and try again.'}
                    </p>
                </div>
            </motion.div>

            <motion.div
                className="w-full space-y-3"
                initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.55 }}
            >
                <motion.button
                    onClick={onRetry}
                    className="w-full py-5 bg-primary text-white font-black text-base rounded-[20px] shadow-xl shadow-primary/25 flex items-center justify-center gap-2 touch-manipulation"
                    whileTap={{ scale: 0.96 }}
                    transition={{ type: 'spring', stiffness: 460, damping: 22 }}
                >
                    Try Again
                </motion.button>
                <a href="/contact" className="w-full py-3 text-slate-400 hover:text-slate-600 font-bold text-sm flex items-center justify-center gap-2 transition-colors">
                    <HelpCircle size={16} /> Contact Support
                </a>
            </motion.div>
        </>
    );
}
