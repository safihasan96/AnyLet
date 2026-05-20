import { AnimatePresence, motion } from 'framer-motion';

/**
 * Shared 3D modal wrapper.
 *  - Backdrop: fades in, blurred
 *  - Card: springs up from below with a 3D perspective tilt on enter,
 *          shrinks + fades on exit.
 *
 * Usage:
 *   <Modal3D isOpen={isOpen} onClose={onClose}>
 *     <div>...your content...</div>
 *   </Modal3D>
 *
 * Props:
 *   isOpen    {boolean}
 *   onClose   {function}
 *   className {string}   extra classes on the card
 *   zIndex    {number}   default 50
 */
export default function Modal3D({ isOpen, onClose, children, className = '', zIndex = 50 }) {
    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    key="modal-backdrop"
                    className="fixed inset-0 flex items-center justify-center p-4 sm:p-6"
                    style={{ zIndex, perspective: '1200px' }}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.22, ease: 'easeOut' }}
                    onClick={onClose}
                >
                    {/* Blurred dark backdrop */}
                    <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" />

                    {/* 3D card */}
                    <motion.div
                        key="modal-card"
                        className={`relative w-full ${className}`}
                        onClick={(e) => e.stopPropagation()}
                        initial={{
                            opacity: 0,
                            scale: 0.85,
                            y: 40,
                            rotateX: 14,
                        }}
                        animate={{
                            opacity: 1,
                            scale: 1,
                            y: 0,
                            rotateX: 0,
                        }}
                        exit={{
                            opacity: 0,
                            scale: 0.88,
                            y: 24,
                            rotateX: -8,
                        }}
                        transition={{
                            type: 'spring',
                            stiffness: 380,
                            damping: 30,
                            mass: 0.9,
                        }}
                        style={{ transformOrigin: 'center bottom', willChange: 'transform, opacity' }}
                    >
                        {children}
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}

/**
 * Bottom-sheet variant — slides up from the bottom on mobile.
 * Use this for sheet-style modals.
 */
export function BottomSheet3D({ isOpen, onClose, children, className = '', zIndex = 50 }) {
    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    key="sheet-backdrop"
                    className="fixed inset-0 flex items-center justify-center p-4 sm:p-6"
                    style={{ zIndex }}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.2, ease: 'easeOut' }}
                    onClick={onClose}
                >
                    <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" />

                    <motion.div
                        key="sheet-card"
                        className={`relative w-full ${className}`}
                        onClick={(e) => e.stopPropagation()}
                        initial={{ opacity: 0, y: '100%' }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: '100%' }}
                        transition={{
                            type: 'spring',
                            stiffness: 360,
                            damping: 32,
                            mass: 1,
                        }}
                        style={{ willChange: 'transform, opacity' }}
                    >
                        {children}
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
