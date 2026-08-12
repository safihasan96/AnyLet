import { motion } from 'framer-motion';
import { AlertTriangle, Zap } from 'lucide-react';

/**
 * StepEnterTxnId — step 2: transaction-ID entry + verify CTA. Inner content
 * only; the animated wrapper lives in the PaymentModal shell.
 */
export default function StepEnterTxnId({ txnId, setTxnId, method, onVerify }) {
    return (
        <>
            <div className="mb-6">
                <h2 className="text-xl font-black text-slate-900 dark:text-white mb-1">Enter Transaction ID</h2>
                <p className="text-sm text-slate-500 font-medium">
                    Paste the {method?.name} TxnID from your confirmation SMS
                </p>
            </div>

            {/* Method badge */}
            <motion.div
                className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full mb-6 ${method?.bgLight}`}
                initial={{ opacity: 0, scale: 0.75 }} animate={{ opacity: 1, scale: 1 }}
                transition={{ type: 'spring', stiffness: 440, damping: 22 }}
            >
                <div className="size-5 rounded-full text-white text-[8px] font-black flex items-center justify-center" style={{ backgroundColor: method?.color }}>{method?.logo}</div>
                <span className={`text-xs font-black ${method?.textColor}`}>{method?.name} Payment</span>
            </motion.div>

            {/* TxnID input */}
            <div className="relative mb-2">
                <motion.input
                    type="text"
                    inputMode="text"
                    value={txnId}
                    onChange={e => setTxnId(e.target.value.replace(/[^a-zA-Z0-9]/g, '').toUpperCase().slice(0, 20))}
                    placeholder="e.g. 9A7F3K2B1X"
                    autoFocus={false}
                    ref={el => { if (el) setTimeout(() => el.focus(), 350); }}
                    autoComplete="off"
                    spellCheck={false}
                    className="w-full bg-slate-50 dark:bg-slate-800 border-2 border-transparent focus:border-primary/50 rounded-2xl py-5 px-5 text-center text-xl font-black text-slate-900 dark:text-white tracking-[0.15em] uppercase placeholder:text-slate-300 dark:placeholder:text-slate-600 placeholder:tracking-normal placeholder:text-base placeholder:normal-case outline-none transition-all"
                    animate={txnId.length >= 6 ? { borderColor: '#10b981' } : {}}
                    transition={{ duration: 0.2 }}
                    aria-label="Transaction ID"
                />
            </div>
            <p className={`text-xs font-bold mb-6 text-center transition-colors ${txnId.length > 0 && txnId.length < 6 ? 'text-amber-500' : 'text-slate-400'}`}>
                {txnId.length > 0 && txnId.length < 6
                    ? `${6 - txnId.length} more characters needed`
                    : 'Alphanumeric only — found on your SMS confirmation'}
            </p>

            {/* Warning */}
            <motion.div
                className="flex items-start gap-3 bg-amber-50 dark:bg-amber-500/10 border border-amber-100 dark:border-amber-500/20 rounded-2xl p-4 mb-6"
                initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
            >
                <AlertTriangle size={18} className="text-amber-500 shrink-0 mt-0.5" />
                <p className="text-xs font-bold text-amber-700 dark:text-amber-300 leading-relaxed">
                    Our system will instantly verify your Transaction ID against the actual payment received. Incorrect IDs will be rejected.
                </p>
            </motion.div>

            <motion.button
                onClick={onVerify}
                disabled={txnId.trim().length < 6}
                className="w-full py-5 bg-primary text-white font-black text-base rounded-[20px] shadow-xl shadow-primary/25 flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed touch-manipulation"
                whileTap={txnId.length >= 6 ? { scale: 0.96 } : {}}
                transition={{ type: 'spring', stiffness: 460, damping: 22 }}
            >
                <Zap size={18} /> Verify Payment
            </motion.button>
        </>
    );
}
