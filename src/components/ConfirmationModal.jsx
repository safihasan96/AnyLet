import Modal3D from './Modal3D';
import { motion } from 'framer-motion';

const ConfirmationModal = ({
    isOpen,
    title,
    message,
    confirmText = 'Proceed',
    confirmColor = '#ef4444',
    onConfirm,
    onCancel,
    isSuccess = false,
    isLoading = false,
    icon: Icon = null,
    variant = 'danger' // danger, warning, success, info
}) => {
    const variantStyles = {
        danger: 'bg-rose-100 text-rose-600 dark:bg-rose-500/20 dark:text-rose-400',
        warning: 'bg-amber-100 text-amber-600 dark:bg-amber-500/20 dark:text-amber-400',
        success: 'bg-emerald-100 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-400',
        info: 'bg-blue-100 text-blue-600 dark:bg-blue-500/20 dark:text-blue-400'
    };

    return (
        <Modal3D isOpen={isOpen} onClose={(!isSuccess && !isLoading) ? onCancel : undefined} className="max-w-sm" zIndex={200}>
            <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl overflow-hidden border border-slate-100 dark:border-slate-800/80">
                {isSuccess ? (
                    <div className="flex flex-col items-center p-10">
                        {/* Success checkmark */}
                        <motion.div 
                            initial={{ scale: 0 }} 
                            animate={{ scale: 1 }} 
                            transition={{ type: "spring", stiffness: 300, damping: 20 }}
                            className="w-20 h-20 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center mb-4 shadow-lg shadow-emerald-200 dark:shadow-emerald-900/20"
                        >
                            <svg className="w-10 h-10 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                            </svg>
                        </motion.div>
                        <h3 className="text-xl font-black text-emerald-600 dark:text-emerald-400">Success!</h3>
                    </div>
                ) : (
                    <>
                        {/* Header & Body combined for layout */}
                        <div className="px-6 pt-6 pb-2 flex items-start gap-4">
                            {Icon && (
                                <div className={`p-3 rounded-2xl shrink-0 ${variantStyles[variant] || variantStyles.info}`}>
                                    <Icon size={24} strokeWidth={2.5} />
                                </div>
                            )}
                            <div className={Icon ? "pt-1" : ""}>
                                <h3 className="text-lg font-black text-slate-900 dark:text-white leading-tight mb-2">{title}</h3>
                                <p className="text-sm text-slate-500 dark:text-slate-400 font-medium leading-relaxed">{message}</p>
                            </div>
                        </div>

                        {/* Footer */}
                        <div className="flex gap-3 px-6 pb-6 pt-4 mt-2 border-t border-slate-100 dark:border-slate-800/50">
                            <button
                                onClick={onCancel}
                                disabled={isLoading}
                                className="flex-1 py-3 px-4 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-sm hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors disabled:opacity-50"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={onConfirm}
                                disabled={isLoading}
                                className="flex-1 py-3 px-4 rounded-2xl text-white font-bold text-sm transition-all disabled:opacity-70 flex items-center justify-center gap-2 shadow-lg active:scale-95"
                                style={{ backgroundColor: confirmColor }}
                            >
                                {isLoading ? (
                                    <>
                                        <div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                                        Processing...
                                    </>
                                ) : confirmText}
                            </button>
                        </div>
                    </>
                )}
            </div>
        </Modal3D>
    );
};

export default ConfirmationModal;
