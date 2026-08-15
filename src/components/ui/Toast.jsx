import { createContext, useContext, useState, useCallback, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '../../lib/cn';
import { Z } from '../../lib/tokens';
import { Icon } from '../../lib/icons';

/**
 * Toast — transient status feedback. Two parts:
 *   • <ToastProvider> + useToast() — the app-level system. API is intentionally
 *     identical to the legacy ToastContext (toast.success/error/info/warning),
 *     so adopting it is a one-line import swap in main.jsx.
 *   • <Toast> — the presentational card (also used directly in the showcase).
 *
 * Left accent + tone icon carry meaning without relying on color alone
 * (accessible). Enters/exits from the top; polite live region for SR users.
 */
const toneConfig = {
  success: { name: 'success', accent: 'bg-success', iconColor: 'text-success' },
  error: { name: 'error', accent: 'bg-danger', iconColor: 'text-danger' },
  warning: { name: 'warning', accent: 'bg-warning', iconColor: 'text-warning' },
  info: { name: 'info', accent: 'bg-info', iconColor: 'text-info' },
};

export function Toast({ message, type = 'info', title, onClose }) {
  const { name, accent, iconColor } = toneConfig[type] || toneConfig.info;
  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: -16, scale: 0.96 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -12, scale: 0.96 }}
      transition={{ type: 'spring', bounce: 0, duration: 0.32 }}
      className="pointer-events-auto relative w-full max-w-sm overflow-hidden rounded-card bg-surface-raised border border-border shadow-overlay"
      role="status"
    >
      <span className={cn('absolute inset-y-0 left-0 w-1', accent)} aria-hidden="true" />
      <div className="flex items-start gap-3 pl-4 pr-3 py-3">
        <span className={cn('mt-0.5 shrink-0', iconColor)} aria-hidden="true"><Icon name={name} className="size-[18px]" /></span>
        <div className="min-w-0 flex-1">
          {title && <p className="text-body-sm font-semibold text-content">{title}</p>}
          <p className="text-body-sm text-muted break-words">{message}</p>
        </div>
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            aria-label="Dismiss notification"
            className="shrink-0 -mr-1 -mt-0.5 grid place-items-center size-7 rounded-control text-subtle hover:text-content hover:bg-surface-sunken transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
          >
            <Icon name="close" className="size-[15px]" />
          </button>
        )}
      </div>
    </motion.div>
  );
}

const ToastContext = createContext(null);

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const removeToast = useCallback((id) => setToasts((prev) => prev.filter((t) => t.id !== id)), []);

  const addToast = useCallback((message, type = 'info', duration = 3500) => {
    const id = Math.random().toString(36).slice(2, 9);
    setToasts((prev) => [...prev, { id, message, type }]);
    if (duration) setTimeout(() => removeToast(id), duration);
    return id;
  }, [removeToast]);

  const toast = useMemo(() => ({
    success: (msg, duration) => addToast(msg, 'success', duration),
    error: (msg, duration) => addToast(msg, 'error', duration),
    info: (msg, duration) => addToast(msg, 'info', duration),
    warning: (msg, duration) => addToast(msg, 'warning', duration),
    dismiss: removeToast,
  }), [addToast, removeToast]);

  return (
    <ToastContext.Provider value={toast}>
      {children}
      {typeof document !== 'undefined' &&
        createPortal(
          <div
            className="fixed top-4 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 w-full max-w-sm px-4 pointer-events-none"
            style={{ zIndex: Z.toast }}
            aria-live="polite"
            aria-atomic="false"
          >
            <AnimatePresence mode="popLayout">
              {toasts.map((t) => (
                <Toast key={t.id} message={t.message} type={t.type} onClose={() => removeToast(t.id)} />
              ))}
            </AnimatePresence>
          </div>,
          document.body
        )}
    </ToastContext.Provider>
  );
}

// Provider + hook intentionally co-locate (same pattern as contexts/ToastContext).
// eslint-disable-next-line react-refresh/only-export-components
export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used within a <ToastProvider>');
  return ctx;
}

export default Toast;
