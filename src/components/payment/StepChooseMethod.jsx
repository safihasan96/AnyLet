import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2, Smartphone, Copy, ArrowRight } from 'lucide-react';
import { PAYMENT_METHODS, MERCHANT_NUMBER } from './paymentMethods';
import { listItemV, instructionRevealV, copyIconV } from './motion';

/**
 * StepChooseMethod — step 1: MFS provider selection + "how to pay" instructions
 * (with copy-merchant-number). Inner content only; the animated wrapper lives in
 * the PaymentModal shell.
 */
export default function StepChooseMethod({ selectedMethod, setSelectedMethod, method, amount, copied, onCopyNumber, onNext }) {
    return (
        <>
            <div className="mb-6">
                <h2 className="text-xl font-black text-slate-900 dark:text-white mb-1">Payment Method</h2>
                <p className="text-sm text-slate-500 font-medium">Select your MFS provider and send the exact amount</p>
            </div>

            <div className="space-y-3 mb-6">
                {PAYMENT_METHODS.map((pm, i) => (
                    <motion.button
                        key={pm.id}
                        custom={i} variants={listItemV} initial="hidden" animate="visible"
                        onClick={() => setSelectedMethod(pm.id)}
                        whileHover={{ scale: 1.02, x: 3 }}
                        whileTap={{ scale: 0.97 }}
                        transition={{ type: 'spring', stiffness: 440, damping: 24 }}
                        className={`w-full flex items-center gap-4 p-5 rounded-2xl border-2 transition-colors ${
                            selectedMethod === pm.id
                                ? `${pm.bgLight} ${pm.borderColor}`
                                : 'bg-slate-50 dark:bg-slate-800 border-transparent'
                        }`}
                        aria-pressed={selectedMethod === pm.id}
                    >
                        <div className="size-12 rounded-2xl flex items-center justify-center text-white text-xl font-black shadow-lg" style={{ backgroundColor: pm.color }}>
                            {pm.logo}
                        </div>
                        <div className="flex-1 text-left">
                            <p className="font-black text-slate-900 dark:text-white text-base">{pm.name}</p>
                            <p className="text-xs font-medium text-slate-400">Mobile Financial Service</p>
                        </div>
                        <motion.div
                            className="size-6 rounded-full border-2 border-slate-300 dark:border-slate-600 flex items-center justify-center"
                            animate={selectedMethod === pm.id
                                ? { borderColor: pm.color, backgroundColor: pm.color }
                                : { borderColor: '', backgroundColor: 'transparent' }}
                            transition={{ duration: 0.18 }}
                        >
                            <AnimatePresence>
                                {selectedMethod === pm.id && (
                                    <motion.div key="tick" initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }} transition={{ type: 'spring', stiffness: 600, damping: 18 }}>
                                        <CheckCircle2 size={16} className="text-white" strokeWidth={3} />
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </motion.div>
                    </motion.button>
                ))}
            </div>

            {/* Instructions panel */}
            <AnimatePresence>
                {selectedMethod && (
                    <motion.div
                        key="instr"
                        variants={instructionRevealV}
                        initial="hidden" animate="visible" exit="exit"
                        className="mb-6"
                    >
                        <div className="bg-slate-50 dark:bg-slate-800 rounded-2xl p-5 space-y-4">
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">How to pay</p>
                            {[
                                { text: `Open your ${method?.name} app` },
                                { custom: true },
                                { text: 'Copy the Transaction ID from the confirmation SMS' },
                            ].map((row, idx) => (
                                <motion.div
                                    key={idx} custom={idx} variants={listItemV} initial="hidden" animate="visible"
                                    className="flex items-start gap-3"
                                >
                                    <div className="size-6 rounded-full bg-primary/10 flex items-center justify-center text-primary dark:text-indigo-400 text-[10px] font-black shrink-0 mt-0.5">
                                        {idx + 1}
                                    </div>
                                    {row.custom ? (
                                        <div className="text-sm text-slate-600 dark:text-slate-300 font-medium flex-1">
                                            Send <span className="font-black text-slate-900 dark:text-white">৳{amount.toLocaleString()}</span> to:
                                            <div className="flex items-center gap-2 mt-2 bg-white dark:bg-slate-900 rounded-xl px-4 py-3 border border-slate-200 dark:border-slate-700">
                                                <Smartphone size={16} className="text-slate-400" />
                                                <span className="font-black text-lg text-slate-900 dark:text-white tracking-wider flex-1 select-all">
                                                    {MERCHANT_NUMBER}
                                                </span>
                                                <motion.button
                                                    onClick={onCopyNumber}
                                                    whileTap={{ scale: 0.78 }}
                                                    className="text-primary dark:text-indigo-400"
                                                    aria-label="Copy merchant number"
                                                >
                                                    <AnimatePresence mode="wait">
                                                        {copied
                                                            ? <motion.div key="ok" variants={copyIconV} initial="hidden" animate="visible" exit="exit"><CheckCircle2 size={16} className="text-emerald-500" /></motion.div>
                                                            : <motion.div key="cp" variants={copyIconV} initial="hidden" animate="visible" exit="exit"><Copy size={16} /></motion.div>
                                                        }
                                                    </AnimatePresence>
                                                </motion.button>
                                            </div>
                                        </div>
                                    ) : (
                                        <p className="text-sm text-slate-600 dark:text-slate-300 font-medium">{row.text}</p>
                                    )}
                                </motion.div>
                            ))}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            <motion.button
                onClick={onNext}
                disabled={!selectedMethod}
                className="w-full py-5 bg-primary text-white font-black text-base rounded-[20px] shadow-xl shadow-primary/25 flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed touch-manipulation"
                whileTap={selectedMethod ? { scale: 0.96 } : {}}
                transition={{ type: 'spring', stiffness: 460, damping: 22 }}
            >
                I&apos;ve Sent the Money <ArrowRight size={18} />
            </motion.button>
        </>
    );
}
