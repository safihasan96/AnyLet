import { motion } from 'framer-motion';
import { itemVariants } from './motion';

/**
 * MenuItem — a single navigable row inside an AccordionSection.
 */
export default function MenuItem({ icon: Icon, label, sub, onClick, danger = false }) {
  return (
    <motion.button
      variants={itemVariants}
      whileTap={{ scale: 0.97 }}
      onClick={onClick}
      className={`transform-gpu will-change-transform w-full flex items-center gap-3.5 px-5 py-3.5 transition-colors
        border-b border-slate-100/70 dark:border-white/[0.04] last:border-b-0
        ${danger
          ? 'hover:bg-rose-50/80 dark:hover:bg-rose-500/[0.08]'
          : 'hover:bg-primary/[0.04] dark:hover:bg-primary/[0.08]'
        }`}
    >
      <div className={`size-9 rounded-xl flex items-center justify-center shrink-0
        ${danger ? 'bg-rose-50 dark:bg-rose-500/10' : 'bg-primary/10 dark:bg-primary/[0.18]'}`}>
        <Icon size={16} strokeWidth={2.1}
          className={danger ? 'text-rose-500' : 'text-primary dark:text-indigo-400'} />
      </div>
      <div className="text-left flex-1 min-w-0">
        <p className={`text-[13.5px] font-semibold leading-snug truncate
          ${danger ? 'text-rose-500' : 'text-slate-800 dark:text-slate-100'}`}>{label}</p>
        {sub && <p className="text-[11px] font-medium text-slate-400 dark:text-slate-500 mt-0.5 truncate">{sub}</p>}
      </div>
    </motion.button>
  );
}
