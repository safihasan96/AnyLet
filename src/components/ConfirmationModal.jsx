import { useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';

const focusableSelector = [
  'a[href]',
  'button:not([disabled])',
  'textarea:not([disabled])',
  'input:not([disabled])',
  'select:not([disabled])',
  '[tabindex]:not([tabindex="-1"])',
].join(',');

export default function ConfirmationModal({
  isOpen,
  title,
  message,
  confirmLabel,
  cancelLabel = 'Cancel',
  onConfirm,
  onCancel,
  isDestructive = false,
  confirmText,
  confirmColor,
  isSuccess = false,
  isLoading = false,
  icon: Icon = null,
  variant = 'danger',
}) {
  const dialogRef = useRef(null);
  const cancelRef = useRef(null);
  const previousFocusRef = useRef(null);
  const resolvedConfirmLabel = confirmLabel || confirmText || 'Confirm';

  useEffect(() => {
    if (!isOpen) return undefined;

    previousFocusRef.current = document.activeElement;
    const timer = window.setTimeout(() => {
      cancelRef.current?.focus();
    }, 0);

    const handleKeyDown = (event) => {
      if (event.key === 'Escape' && !isLoading) {
        event.preventDefault();
        onCancel?.();
        return;
      }

      if (event.key !== 'Tab') return;

      const focusable = Array.from(dialogRef.current?.querySelectorAll(focusableSelector) || []);
      if (focusable.length === 0) {
        event.preventDefault();
        return;
      }

      const first = focusable[0];
      const last = focusable[focusable.length - 1];

      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    document.body.style.overflow = 'hidden';

    return () => {
      window.clearTimeout(timer);
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
      previousFocusRef.current?.focus?.();
    };
  }, [isOpen, isLoading, onCancel]);

  const variantStyles = {
    danger: 'bg-rose-100 text-rose-600 dark:bg-rose-500/20 dark:text-rose-300',
    warning: 'bg-amber-100 text-amber-600 dark:bg-amber-500/20 dark:text-amber-300',
    success: 'bg-emerald-100 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-300',
    info: 'bg-blue-100 text-blue-600 dark:bg-blue-500/20 dark:text-blue-300',
  };

  const confirmClass = isDestructive || variant === 'danger'
    ? 'bg-rose-600 hover:bg-rose-700 focus-visible:ring-rose-500'
    : 'bg-primary hover:bg-primary/90 focus-visible:ring-primary';

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-950/65 px-4 backdrop-blur-sm"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onMouseDown={(event) => {
            if (event.target === event.currentTarget && !isLoading) onCancel?.();
          }}
        >
          <motion.div
            ref={dialogRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby="confirmation-modal-title"
            aria-describedby="confirmation-modal-message"
            className="w-full max-w-sm overflow-hidden rounded-3xl border border-slate-100 bg-white shadow-2xl dark:border-slate-800 dark:bg-slate-900"
            initial={{ opacity: 0, scale: 0.92, y: 18 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.92, y: 18 }}
            transition={{ type: 'spring', stiffness: 420, damping: 32 }}
          >
            {isSuccess ? (
              <div className="p-8 text-center">
                <div className="mx-auto mb-4 flex size-16 items-center justify-center rounded-full bg-emerald-100 text-emerald-600 dark:bg-emerald-500/15 dark:text-emerald-300">
                  <span className="text-3xl font-black">✓</span>
                </div>
                <h2 className="text-lg font-black text-slate-900 dark:text-white">Success</h2>
              </div>
            ) : (
              <>
                <div className="flex items-start gap-4 p-6 pb-4">
                  {Icon && (
                    <div className={`flex size-12 shrink-0 items-center justify-center rounded-2xl ${variantStyles[variant] || variantStyles.info}`}>
                      <Icon size={24} strokeWidth={2.5} />
                    </div>
                  )}
                  <div className="min-w-0 flex-1">
                    <h2 id="confirmation-modal-title" className="text-lg font-black leading-tight text-slate-950 dark:text-white">
                      {title}
                    </h2>
                    {message && (
                      <p id="confirmation-modal-message" className="mt-2 text-sm font-medium leading-relaxed text-slate-500 dark:text-slate-400">
                        {message}
                      </p>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={onCancel}
                    disabled={isLoading}
                    aria-label="Close confirmation dialog"
                    className="rounded-xl p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary disabled:opacity-50 dark:hover:bg-slate-800 dark:hover:text-slate-200"
                  >
                    <X size={18} />
                  </button>
                </div>

                <div className="flex gap-3 border-t border-slate-100 p-5 dark:border-slate-800">
                  <button
                    ref={cancelRef}
                    type="button"
                    onClick={onCancel}
                    disabled={isLoading}
                    className="flex-1 rounded-2xl bg-slate-100 px-4 py-3 text-sm font-black text-slate-700 transition hover:bg-slate-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-400 disabled:opacity-50 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
                  >
                    {cancelLabel}
                  </button>
                  <button
                    type="button"
                    onClick={onConfirm}
                    disabled={isLoading}
                    className={`flex flex-1 items-center justify-center rounded-2xl px-4 py-3 text-sm font-black text-white shadow-lg transition active:scale-95 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:opacity-60 ${confirmClass}`}
                    style={confirmColor ? { backgroundColor: confirmColor } : undefined}
                  >
                    {isLoading ? 'Processing...' : resolvedConfirmLabel}
                  </button>
                </div>
              </>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
