import { useEffect, useRef, useId } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { cn } from '../../lib/cn';
import { Z } from '../../lib/tokens';
import { Icon } from '../../lib/icons';
import { useScrollLock, useFocusTrap } from './overlayUtils';
import IconButton from './IconButton';

/**
 * Drawer — edge-anchored sheet (right | left | bottom). Focus-trapped,
 * Esc-to-close, scroll-locked, scrim-dimmed. Enters and exits along the same
 * axis it lives on (Apple: things return the way they came). The bottom variant
 * shows a grab handle. Reduced motion → cross-fade.
 */
const sideConfig = {
  right: {
    className: 'top-0 right-0 h-full w-full max-w-md rounded-l-modal border-l',
    initial: { x: '100%' }, animate: { x: 0 }, exit: { x: '100%' },
  },
  left: {
    className: 'top-0 left-0 h-full w-full max-w-md rounded-r-modal border-r',
    initial: { x: '-100%' }, animate: { x: 0 }, exit: { x: '-100%' },
  },
  bottom: {
    className: 'bottom-0 left-0 right-0 w-full max-h-[92dvh] rounded-t-modal border-t',
    initial: { y: '100%' }, animate: { y: 0 }, exit: { y: '100%' },
  },
};

export default function Drawer({
  open,
  onClose,
  side = 'right',
  title,
  description,
  children,
  showClose = true,
  closeOnEsc = true,
  closeOnBackdrop = true,
  className,
}) {
  const panelRef = useRef(null);
  const titleId = useId();
  const descId = useId();
  const reduce = useReducedMotion();
  const cfg = sideConfig[side] || sideConfig.right;

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
        <div className="fixed inset-0" style={{ zIndex: Z.drawer }}>
          <motion.div
            className="absolute inset-0 bg-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={closeOnBackdrop ? onClose : undefined}
          />
          <motion.div
            ref={panelRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby={title ? titleId : undefined}
            aria-describedby={description ? descId : undefined}
            tabIndex={-1}
            initial={reduce ? { opacity: 0 } : cfg.initial}
            animate={reduce ? { opacity: 1 } : cfg.animate}
            exit={reduce ? { opacity: 0 } : cfg.exit}
            transition={{ type: 'spring', bounce: 0.12, duration: 0.4 }}
            className={cn(
              'absolute bg-surface shadow-modal border-border outline-none flex flex-col overflow-hidden',
              cfg.className,
              className
            )}
          >
            {side === 'bottom' && (
              <div className="flex justify-center pt-2.5 pb-1" aria-hidden="true">
                <span className="h-1.5 w-10 rounded-full bg-border-strong" />
              </div>
            )}
            {(title || showClose) && (
              <div className="flex items-start justify-between gap-4 px-6 pt-4 pb-3 border-b border-border">
                <div className="min-w-0">
                  {title && <h2 id={titleId} className="text-title-md text-content">{title}</h2>}
                  {description && <p id={descId} className="mt-0.5 text-body-sm text-muted">{description}</p>}
                </div>
                {showClose && (
                  <IconButton label="Close" variant="ghost" size="sm" onClick={onClose} className="-mr-2 shrink-0">
                    <Icon name="close" />
                  </IconButton>
                )}
              </div>
            )}
            <div className="flex-1 overflow-y-auto px-6 py-5">{children}</div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>,
    document.body
  );
}
