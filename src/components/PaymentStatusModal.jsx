import { motion, AnimatePresence } from 'framer-motion';
import { createPortal } from 'react-dom';
import {
    X, CheckCircle2, Clock, AlertTriangle, Shield, HelpCircle
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

/**
 * PaymentStatusModal — Reusable modal to show payment/escrow status
 *
 * Props:
 *   isOpen, onClose
 *   status: 'pending' | 'verified' | 'completed' | 'failed' | 'held' | 'released' | 'disputed'
 *   title: string
 *   message: string
 *   transactionId: string
 */
export default function PaymentStatusModal({
    isOpen,
    onClose,
    status = 'pending',
    title = 'Payment Status',
    message = '',
    transactionId = '',
}) {
    const navigate = useNavigate();

    if (typeof document === 'undefined') return null;

    let icon = Clock;
    let colorClass = 'text-amber-500';
    let bgClass = 'bg-amber-500/10';
    let borderClass = 'border-amber-500/20';
    let gradient = 'from-amber-400 to-amber-600';
    let statusText = 'Processing';

    switch (status) {
        case 'verified':
        case 'completed':
        case 'released':
            icon = CheckCircle2;
            colorClass = 'text-emerald-500';
            bgClass = 'bg-emerald-500/10';
            borderClass = 'border-emerald-500/20';
            gradient = 'from-emerald-400 to-emerald-600';
            statusText = 'Successful';
            break;
        case 'failed':
        case 'disputed':
            icon = AlertTriangle;
            colorClass = 'text-rose-500';
            bgClass = 'bg-rose-500/10';
            borderClass = 'border-rose-500/20';
            gradient = 'from-rose-400 to-rose-600';
            statusText = 'Failed';
            break;
        case 'pending':
        case 'held':
        default:
            icon = Clock;
            colorClass = 'text-amber-500';
            bgClass = 'bg-amber-500/10';
            borderClass = 'border-amber-500/20';
            gradient = 'from-amber-400 to-amber-600';
            statusText = 'Under Review';
            break;
    }

    const Icon = icon;

    return createPortal(
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    key="payment-status-backdrop"
                    className="fixed inset-0 z-[100] flex items-center justify-center p-4"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    onClick={onClose}
                >
                    <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" />

                    <motion.div
                        key="payment-status-card"
                        className="relative w-full max-w-sm bg-white dark:bg-slate-900 rounded-[32px] overflow-hidden shadow-2xl"
                        onClick={(e) => e.stopPropagation()}
                        initial={{ opacity: 0, scale: 0.95, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 20 }}
                        transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                    >
                        <button
                            onClick={onClose}
                            className="absolute top-4 right-4 z-10 size-8 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors"
                        >
                            <X size={16} strokeWidth={2.5} />
                        </button>

                        <div className="p-8 pt-10 flex flex-col items-center text-center">
                            <motion.div
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                transition={{ type: 'spring', stiffness: 400, damping: 18, delay: 0.1 }}
                                className="relative mb-6"
                            >
                                <div className={`size-24 rounded-3xl bg-gradient-to-br ${gradient} flex items-center justify-center shadow-xl shadow-${colorClass.split('-')[1]}-500/30`}>
                                    <Icon size={44} className="text-white drop-shadow-md" />
                                </div>
                            </motion.div>

                            <div className={`inline-flex items-center gap-1.5 ${bgClass} ${colorClass} px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest mb-3 border ${borderClass}`}>
                                {statusText}
                            </div>

                            <h2 className="text-xl font-black text-slate-900 dark:text-white mb-2">
                                {title}
                            </h2>

                            <p className="text-slate-500 dark:text-slate-400 font-medium text-sm leading-relaxed mb-6">
                                {message}
                            </p>

                            {transactionId && (
                                <div className="w-full bg-slate-50 dark:bg-slate-800 rounded-2xl p-4 mb-6 border border-slate-100 dark:border-slate-700">
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Transaction ID</p>
                                    <p className="font-black text-slate-900 dark:text-white tracking-widest">{transactionId}</p>
                                </div>
                            )}

                            <div className="w-full space-y-3">
                                <button
                                    onClick={onClose}
                                    className="w-full py-4 bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-black rounded-2xl shadow-lg active:scale-95 transition-all"
                                >
                                    Close
                                </button>
                                <button
                                    onClick={() => {
                                        onClose();
                                        navigate('/contact');
                                    }}
                                    className="w-full py-3 text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300 font-bold text-sm rounded-xl transition-all flex items-center justify-center gap-2"
                                >
                                    <HelpCircle size={16} /> Need Help?
                                </button>
                            </div>
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>,
        document.body
    );
}
