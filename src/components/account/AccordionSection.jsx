import { useState } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { ChevronDown } from 'lucide-react';
import { sectionVariants, accordionVariants, chevronVariants } from './motion';

/**
 * AccordionSection — a collapsible titled section that staggers its children
 * (MenuItems) open/closed.
 */
export default function AccordionSection({ icon: Icon, title, badge, children, defaultOpen = false }) {
  const [open, setOpen] = useState(defaultOpen);
  const shouldReduceMotion = useReducedMotion();

  return (
    <motion.div
      variants={sectionVariants}
      className="bg-white dark:bg-[#1A1D24] rounded-2xl overflow-hidden border border-slate-100/80 dark:border-white/[0.06] shadow-sm"
    >
      <button
        onClick={() => setOpen(v => !v)}
        className="w-full flex items-center gap-3.5 px-5 py-4 hover:bg-slate-50/70 dark:hover:bg-white/[0.03] transition-colors"
        aria-expanded={open}
      >
        <div className="size-10 rounded-xl bg-primary/10 dark:bg-primary/[0.18] flex items-center justify-center shrink-0">
          <Icon size={18} strokeWidth={2} className="text-primary dark:text-indigo-400" />
        </div>
        <span className="flex-1 text-left text-[14.5px] font-bold text-slate-900 dark:text-white">{title}</span>
        {badge && (
          <span className="text-[10px] font-black uppercase tracking-widest text-white bg-primary rounded-full px-2.5 py-0.5 mr-1">
            {badge}
          </span>
        )}
        <motion.div
          variants={chevronVariants}
          animate={shouldReduceMotion ? undefined : (open ? 'open' : 'closed')}
          className="shrink-0"
        >
          <ChevronDown size={16} strokeWidth={2.5} className="text-slate-400 dark:text-slate-500" />
        </motion.div>
      </button>

      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            key="content"
            variants={accordionVariants}
            initial="closed"
            animate="open"
            exit="closed"
            className="overflow-hidden"
          >
            <div className="border-t border-slate-100 dark:border-white/[0.05]">
              {children}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
