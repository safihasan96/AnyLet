/**
 * Shared Framer Motion Variants
 * ─────────────────────────────
 * All motion config decoupled from JSX per the framer-motion-expert skill rules.
 * Import and use with: variants={fadeUp} initial="hidden" animate="visible"
 */

// ── Page / Section level ───────────────────────────────────────────────────

export const fadeIn = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { duration: 0.25 } },
    exit: { opacity: 0, transition: { duration: 0.15 } },
};

export const fadeUp = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 80, damping: 18 } },
    exit: { opacity: 0, y: -8, transition: { duration: 0.15 } },
};

export const fadeDown = {
    hidden: { opacity: 0, y: -8 },
    visible: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 100, damping: 20 } },
    exit: { opacity: 0, y: -8 },
};

export const scaleIn = {
    hidden: { opacity: 0, scale: 0.9 },
    visible: { opacity: 1, scale: 1, transition: { type: 'spring', stiffness: 200, damping: 22 } },
    exit: { opacity: 0, scale: 0.95 },
};

// ── Staggered list containers ──────────────────────────────────────────────

export const staggerContainer = {
    hidden: { opacity: 0 },
    visible: {
        opacity: 1,
        transition: { staggerChildren: 0.05, delayChildren: 0.1 },
    },
};

export const staggerItem = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 120, damping: 20 } },
    exit: { opacity: 0, scale: 0.95 },
};

// ── Modal / Overlay ────────────────────────────────────────────────────────

export const modalBackdrop = {
    hidden: { opacity: 0 },
    visible: { opacity: 1 },
    exit: { opacity: 0 },
};

export const modalSheet = {
    hidden: { opacity: 0, y: '100%' },
    visible: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 260, damping: 28 } },
    exit: { opacity: 0, y: '100%', transition: { duration: 0.2 } },
};

export const modalDialog = {
    hidden: { opacity: 0, scale: 0.95, y: 20 },
    visible: { opacity: 1, scale: 1, y: 0, transition: { type: 'spring', stiffness: 260, damping: 26 } },
    exit: { opacity: 0, scale: 0.95, transition: { duration: 0.15 } },
};

// ── Bottom bar / Sticky elements ───────────────────────────────────────────

export const slideUp = {
    hidden: { y: 80, opacity: 0 },
    visible: { y: 0, opacity: 1, transition: { type: 'spring', stiffness: 120, damping: 22, delay: 0.4 } },
};

// ── Card interactions ──────────────────────────────────────────────────────

export const cardHover = {
    rest: { scale: 1, y: 0 },
    hover: { scale: 1.03, y: -4, transition: { type: 'spring', stiffness: 300, damping: 22 } },
};

export const specCardHover = {
    rest: { scale: 1, y: 0 },
    hover: { scale: 1.04, y: -3, transition: { type: 'spring', stiffness: 320, damping: 22 } },
};

// ── Micro-interactions ────────────────────────────────────────────────────

export const popIn = {
    hidden: { scale: 0, rotate: -30 },
    visible: { scale: 1, rotate: 0, transition: { type: 'spring', stiffness: 260, damping: 18 } },
};

export const successBadge = {
    hidden: { scale: 0, rotate: -30 },
    visible: { scale: 1, rotate: 0, transition: { type: 'spring', stiffness: 280, damping: 20 } },
};
