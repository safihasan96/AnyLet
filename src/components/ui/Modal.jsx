import { useEffect, useRef, useId } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { cn } from '../../lib/cn';
import { Z } from '../../lib/tokens';
import { Icon } from '../../lib/icons';
import { useScrollLock, useFocusTrap } from './overlayUtils';
import IconButton from './IconButton';

/**
 * Modal — accessible centered dialog. Focus-trapped, Esc-to-close, scroll-locked,
 * scrim-dimmed, portalled to <body>. The panel materializes (scale + fade), and
 * under reduced motion it cross-fades only. role="dialog" + aria-modal + labelled
 * by the title.
 *
 *   <Modal open={open} onClose={close} title="Confirm">
 *     …body…
 *     <ModalFooter> …buttons… </ModalFooter>
 *   </Modal>
 */
const sizes = {
  sm: 'max-w-sm',
  md: 'max-w-md',
  lg: 'max-w-lg',
  xl: 'max-w-2xl',
  full: 'max-w-[calc(100vw-2rem)]',
};

export default function Modal({
  open,
  onClose,
  title,
  description,
  children,
  size = 'md',
  closeOnEsc = true,
  closeOnBackdrop = true,
  showClose = true,
  className,
}) {
  const panelRef = useRef(null);
  const titleId = useId();
  const descId = useId();
  const reduce = useReducedMotion();

  useScrollLock(open);
  useFocusTrap(panelRef, open);

  useEffect(() => {
    if (!open || !closeOnEsc) return;
    const onKey = (e) => e.key === 'Escape' && onClose?.();
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open, closeOnEsc, onClose]);

  if (typeof document === 'undefined') return null;

  return createPortal(
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 flex items-center justify-center p-4" style={{ zIndex: Z.modal }}>
          <motion.div
            className="absolute inset-0 bg-overlay backdrop-blur-[2px]"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18 }}
            onClick={closeOnBackdrop ? onClose : undefined}
          />
          <motion.div
            ref={panelRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby={title ? titleId : undefined}
            aria-describedby={description ? descId : undefined}
            tabIndex={-1}
            initial={reduce ? { opacity: 0 } : { opacity: 0, scale: 0.96, y: 8 }}
            animate={reduce ? { opacity: 1 } : { opacity: 1, scale: 1, y: 0 }}
            exit={reduce ? { opacity: 0 } : { opacity: 0, scale: 0.97, y: 8 }}
            transition={{ type: 'spring', bounce: 0, duration: 0.32 }}
            className={cn(
              'relative w-full bg-surface rounded-modal shadow-modal border border-border outline-none',
              'max-h-[calc(100dvh-2rem)] flex flex-col overflow-hidden',
              sizes[size] || sizes.md,
              className
            )}
          >
            {(title || showClose) && (
              <div className="flex items-start justify-between gap-4 px-6 pt-6">
                <div className="min-w-0">
                  {title && <h2 id={titleId} className="text-title-md text-content">{title}</h2>}
                  {description && <p id={descId} className="mt-1 text-body-sm text-muted">{description}</p>}
                </div>
                {showClose && (
                  <IconButton label="Close" variant="ghost" size="sm" onClick={onClose} className="-mr-2 -mt-1 shrink-0">
                    <Icon name="close" />
                  </IconButton>
                )}
              </div>
            )}
            <div className="px-6 py-5 overflow-y-auto">{children}</div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>,
    document.body
  );
}

export function ModalFooter({ className, children }) {
  // Bleeds past the body's px-6 py-5 so it sits flush to the panel edges.
  return (
    <div className={cn('-mx-6 -mb-5 mt-5 flex items-center justify-end gap-3 px-6 py-4 border-t border-border bg-surface-sunken/40', className)}>
      {children}
    </div>
  );
}
