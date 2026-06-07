import { motion } from 'framer-motion';
import { CheckCircle2, XCircle, AlertTriangle, Info, X } from 'lucide-react';

export default function Toast({ message, type = 'info', onClose }) {
    const icons = {
        success: <CheckCircle2 className="text-emerald-500" size={20} />,
        error: <XCircle className="text-rose-500" size={20} />,
        warning: <AlertTriangle className="text-amber-500" size={20} />,
        info: <Info className="text-blue-500" size={20} />
    };

    const styles = {
        success: 'bg-emerald-50 border-emerald-200 text-emerald-800 dark:bg-emerald-950/60 dark:border-emerald-800/50 dark:text-emerald-200',
        error: 'bg-rose-50 border-rose-200 text-rose-800 dark:bg-rose-950/60 dark:border-rose-800/50 dark:text-rose-200',
        warning: 'bg-amber-50 border-amber-200 text-amber-800 dark:bg-amber-950/60 dark:border-amber-800/50 dark:text-amber-200',
        info: 'bg-blue-50 border-blue-200 text-blue-800 dark:bg-blue-950/60 dark:border-blue-800/50 dark:text-blue-200'
    };

    return (
        <motion.div
            layout
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95, transition: { duration: 0.15 } }}
            transition={{ duration: 0.25, type: 'spring', stiffness: 350, damping: 25 }}
            className={`pointer-events-auto flex items-center gap-3 px-4 py-3 rounded-2xl border shadow-xl w-full max-w-sm backdrop-blur-xl ${styles[type]}`}
        >
            <div className="shrink-0">{icons[type]}</div>
            <p className="flex-1 text-sm font-bold leading-tight">{message}</p>
            <button
                onClick={onClose}
                className="shrink-0 p-1 rounded-full hover:bg-black/5 dark:hover:bg-white/10 transition-colors opacity-70 hover:opacity-100"
            >
                <X size={16} />
            </button>
        </motion.div>
    );
}
