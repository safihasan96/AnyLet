import { motion } from 'framer-motion';

/**
 * StatBlock — a tappable stat tile (icon + count + label) used in the profile
 * card. Shows a pulsing placeholder while counts are loading.
 */
export default function StatBlock({ icon: Icon, iconBg, iconColor, value, label, onClick, isLoading = false }) {
  return (
    <motion.button
      whileHover={{ scale: 1.06, y: -2 }}
      whileTap={{ scale: 0.95 }}
      onClick={onClick}
      transition={{ type: 'spring', stiffness: 420, damping: 22 }}
      className="transform-gpu flex flex-col items-center gap-2 px-3 py-1 cursor-pointer"
    >
      <div className={`size-11 rounded-2xl flex items-center justify-center ${iconBg}`}>
        <Icon size={20} strokeWidth={2} className={iconColor} />
      </div>
      <span className={`text-[15px] font-black text-slate-900 dark:text-white leading-none ${isLoading ? 'animate-pulse text-slate-300 dark:text-slate-500' : ''}`}>
        {isLoading ? '—' : value}
      </span>
      <span className="text-[10.5px] font-semibold uppercase tracking-widest text-slate-400 dark:text-slate-500">{label}</span>
    </motion.button>
  );
}
