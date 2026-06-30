/**
 * motion.js — AnyLet Framer Motion variant library
 * DESKTOP ONLY: Always guard with useIsDesktop() before applying
 */

// ── Easing curves ─────────────────────────────────────────────
export const EASE_OUT_QUART  = [0.25, 0.46, 0.45, 0.94];
export const EASE_IN_OUT     = [0.4, 0.0, 0.2, 1.0];
export const EASE_SPRING     = { type: 'spring', stiffness: 300, damping: 30 };

// ── Fade variants ─────────────────────────────────────────────
export const fadeIn = {
  hidden : { opacity: 0 },
  show   : { opacity: 1, transition: { duration: 0.3, ease: 'easeOut' } }
};

export const fadeUp = {
  hidden : { opacity: 0, y: 28 },
  show   : { opacity: 1, y: 0, transition: { duration: 0.45, ease: EASE_OUT_QUART } }
};

export const fadeDown = {
  hidden : { opacity: 0, y: -20 },
  show   : { opacity: 1, y: 0, transition: { duration: 0.35, ease: EASE_OUT_QUART } }
};

// ── Slide variants ────────────────────────────────────────────
export const slideFromLeft = {
  hidden : { opacity: 0, x: -48 },
  show   : { opacity: 1, x: 0, transition: { duration: 0.55, ease: EASE_OUT_QUART } }
};

export const slideFromRight = {
  hidden : { opacity: 0, x: 48 },
  show   : { opacity: 1, x: 0, transition: { duration: 0.55, delay: 0.1, ease: EASE_OUT_QUART } }
};

// ── Scale variants ────────────────────────────────────────────
export const scaleIn = {
  hidden : { opacity: 0, scale: 0.94 },
  show   : { opacity: 1, scale: 1, transition: { duration: 0.35, ease: EASE_IN_OUT } }
};

// ── Stagger container factory ─────────────────────────────────
export const staggerContainer = (stagger = 0.07, delay = 0.05) => ({
  hidden : {},
  show   : {
    transition: {
      staggerChildren : stagger,
      delayChildren   : delay
    }
  }
});

// ── Page transition wrapper ───────────────────────────────────
export const pageTransition = {
  hidden  : { opacity: 0, y: 12 },
  enter   : { opacity: 1, y: 0,  transition: { duration: 0.35, ease: EASE_OUT_QUART } },
  exit    : { opacity: 0, y: -8, transition: { duration: 0.2,  ease: 'easeIn' } }
};
