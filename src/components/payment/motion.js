/* Framer Motion variants for the PaymentModal wizard — decoupled from JSX and
   restricted to transform/opacity for 60fps. Shared by the modal shell and its
   step components. */

export const backdropV = {
    hidden:  { opacity: 0 },
    visible: { opacity: 1, transition: { duration: 0.22 } },
    exit:    { opacity: 0, transition: { duration: 0.18 } },
};

export const cardV = {
    hidden:  { opacity: 0, scale: 0.88, y: 28 },
    visible: { opacity: 1, scale: 1,    y: 0,  transition: { type: 'spring', stiffness: 380, damping: 28, mass: 0.9 } },
    exit:    { opacity: 0, scale: 0.88, y: 28,  transition: { duration: 0.16 } },
};

export const stepV = {
    enter:  (dir) => ({ opacity: 0, x: dir > 0 ? 72 : -72, scale: 0.97 }),
    center: { opacity: 1, x: 0, scale: 1, transition: { type: 'spring', stiffness: 420, damping: 36 } },
    exit:   (dir) => ({ opacity: 0, x: dir > 0 ? -72 : 72, scale: 0.97, transition: { duration: 0.14 } }),
};

export const iconBounceV = {
    hidden:  { scale: 0, rotate: -25, opacity: 0 },
    visible: { scale: 1, rotate: 0,   opacity: 1, transition: { type: 'spring', stiffness: 500, damping: 18, delay: 0.1 } },
};

export const listItemV = {
    hidden:  { opacity: 0, x: -14 },
    visible: (i) => ({
        opacity: 1, x: 0,
        transition: { type: 'spring', stiffness: 380, damping: 28, delay: i * 0.06 },
    }),
};

export const invoiceLineV = {
    hidden:  { opacity: 0, y: 10 },
    visible: (i) => ({
        opacity: 1, y: 0,
        transition: { type: 'spring', stiffness: 300, damping: 28, delay: 0.2 + i * 0.07 },
    }),
};

export const instructionRevealV = {
    hidden:  { opacity: 0, y: -8 },
    visible: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 300, damping: 30 } },
    exit:    { opacity: 0, y: -8, transition: { duration: 0.16 } },
};

export const copyIconV = {
    hidden:  { scale: 0, opacity: 0 },
    visible: { scale: 1, opacity: 1, transition: { type: 'spring', stiffness: 600, damping: 18 } },
    exit:    { scale: 0, opacity: 0, transition: { duration: 0.1 } },
};

export const backBtnV = {
    hidden:  { opacity: 0, x: -10 },
    visible: { opacity: 1, x: 0,   transition: { type: 'spring', stiffness: 400, damping: 28 } },
    exit:    { opacity: 0, x: -10, transition: { duration: 0.1 } },
};
