/* Shared Framer Motion variants for the Account page and its components. */

export const pageVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.06, delayChildren: 0.04 }
  }
};

export const heroVariants = {
  hidden: { opacity: 0, x: -32 },
  visible: {
    opacity: 1, x: 0,
    transition: { type: 'spring', stiffness: 90, damping: 20 }
  }
};

export const avatarVariants = {
  hidden: { opacity: 0, scale: 0.72 },
  visible: {
    opacity: 1, scale: 1,
    transition: { type: 'spring', stiffness: 360, damping: 22, delay: 0.08 }
  }
};

export const textVariants = {
  hidden: { opacity: 0, x: -20 },
  visible: {
    opacity: 1, x: 0,
    transition: { type: 'spring', stiffness: 200, damping: 24 }
  }
};

export const sectionVariants = {
  hidden: { opacity: 0, x: -20 },
  visible: {
    opacity: 1, x: 0,
    transition: { type: 'spring', stiffness: 200, damping: 24 }
  }
};

// Accordion open/close
export const accordionVariants = {
  closed: {
    height: 0,
    opacity: 0,
    transition: { height: { type: 'spring', stiffness: 340, damping: 30 }, opacity: { duration: 0.15 } }
  },
  open: {
    height: 'auto',
    opacity: 1,
    transition: {
      height: { type: 'spring', stiffness: 340, damping: 30 },
      opacity: { duration: 0.2, delay: 0.05 },
      staggerChildren: 0.05,
      delayChildren: 0.06
    }
  }
};

// Stagger child items inside accordion
export const itemVariants = {
  closed: { opacity: 0, x: -10 },
  open: {
    opacity: 1, x: 0,
    transition: { type: 'spring', stiffness: 340, damping: 28 }
  }
};

export const chevronVariants = {
  closed: { rotate: 0 },
  open: { rotate: 180, transition: { type: 'spring', stiffness: 360, damping: 26 } }
};
