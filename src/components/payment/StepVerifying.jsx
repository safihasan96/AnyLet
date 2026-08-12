import { motion } from 'framer-motion';
import { Loader2, Clock } from 'lucide-react';
import { iconBounceV } from './motion';

/**
 * StepVerifying — step 3: loading state while the payment is verified. Inner
 * content only; the animated wrapper lives in the PaymentModal shell.
 */
export default function StepVerifying() {
    return (
        <>
            <motion.div
                className="relative mb-8 transform-gpu"
                variants={iconBounceV} initial="hidden" animate="visible"
            >
                <div className="size-28 rounded-[32px] bg-gradient-to-br from-primary to-indigo-700 flex items-center justify-center shadow-2xl shadow-primary/30">
                    <Loader2 size={52} className="text-white drop-shadow-lg animate-spin" />
                </div>
            </motion.div>

            <div className="inline-flex items-center gap-1.5 bg-primary/10 text-primary dark:text-indigo-400 px-3 py-1.5 rounded-full text-xs font-black uppercase tracking-widest mb-4">
                <Clock size={12} strokeWidth={3} /> Verifying…
            </div>
            <h2 className="text-2xl font-black text-slate-900 dark:text-white mb-3">Checking Payment</h2>
            <p className="text-slate-500 dark:text-slate-400 font-medium text-sm max-w-xs mx-auto leading-relaxed">
                Matching your Transaction ID against our secure payment records. This takes just a moment.
            </p>
        </>
    );
}
