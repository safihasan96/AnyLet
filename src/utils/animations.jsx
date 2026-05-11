import { motion } from 'framer-motion';

// Reusable animation variants
export const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { duration: 0.4, ease: [0.22, 1, 0.36, 1] } }
};

export const fadeIn = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { duration: 0.35, ease: 'easeOut' } }
};

// Subtle pop-in — less aggressive scale to avoid layout jumps
export const popIn = {
  hidden: { opacity: 0, scale: 0.95, y: 10 },
  show: { 
    opacity: 1, scale: 1, y: 0, 
    transition: { duration: 0.35, ease: [0.22, 1, 0.36, 1] } 
  }
};

export const staggerContainer = {
  hidden: {},
  show: {
    transition: {
      staggerChildren: 0.06,
      delayChildren: 0.04,
    }
  }
};

// Section wrapper — triggers once on mount (not scroll), so it doesn't 
// conflict with page transition and cause double-animation flashes.
export function PopInSection({ children, className = '', delay = 0 }) {
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1], delay }}
      style={{ willChange: 'opacity, transform' }}
    >
      {children}
    </motion.div>
  );
}

// Grid container with staggered children — uses animate (not whileInView)
// to avoid re-triggering on route changes which causes flash bugs.
export function StaggerGrid({ children, className = '' }) {
  return (
    <motion.div
      className={className}
      variants={staggerContainer}
      initial="hidden"
      animate="show"
    >
      {children}
    </motion.div>
  );
}

// A card item that pops in as part of a stagger
export function CardPopItem({ children, className = '' }) {
  return (
    <motion.div
      className={className}
      variants={popIn}
      style={{ willChange: 'opacity, transform' }}
    >
      {children}
    </motion.div>
  );
}

// Animated press button
export function PressButton({ children, className = '', onClick, disabled = false, type = 'button' }) {
  return (
    <motion.button
      type={type}
      className={className}
      onClick={onClick}
      disabled={disabled}
      whileTap={{ scale: disabled ? 1 : 0.94 }}
      whileHover={{ scale: disabled ? 1 : 1.02 }}
      transition={{ type: 'spring', stiffness: 500, damping: 25 }}
    >
      {children}
    </motion.button>
  );
}
