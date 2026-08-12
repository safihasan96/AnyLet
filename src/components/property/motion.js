// Shared Framer Motion variants for the PropertyDetails page and its sections.
// Kept decoupled from JSX so the page shell and extracted section components can
// all reference the same animation definitions.

export const sectionVariants = {
    hidden: { opacity: 0, y: 28 },
    visible: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 80, damping: 18 } },
};

export const ctaVariants = {
    idle: { boxShadow: '0 4px 24px rgba(99,102,241,0.25)' },
    pulse: {
        boxShadow: ['0 4px 24px rgba(99,102,241,0.25)', '0 4px 40px rgba(99,102,241,0.6)', '0 4px 24px rgba(99,102,241,0.25)'],
        transition: { duration: 2, repeat: Infinity, repeatType: 'loop', ease: 'easeInOut' },
    },
};

export const bottomBarVariants = {
    hidden: { y: 80, opacity: 0 },
    visible: { y: 0, opacity: 1, transition: { type: 'spring', stiffness: 120, damping: 22, delay: 0.4 } },
};

export const specCardVariants = {
    rest: { scale: 1, y: 0 },
    hover: {
        scale: 1.04,
        y: -3,
        transition: { type: 'spring', stiffness: 320, damping: 22 },
    },
};
