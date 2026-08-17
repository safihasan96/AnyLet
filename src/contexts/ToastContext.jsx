/* eslint-disable react-refresh/only-export-components -- thin re-export shim (provider + hook). */
/**
 * Toast is now a single unified system living in the design-system layer.
 * This module re-exports it so the ~25 existing `import … from
 * '../contexts/ToastContext'` call sites keep working unchanged, all sharing the
 * one <ToastProvider> mounted in main.jsx. The API is identical:
 *   const toast = useToast(); toast.success('…'); toast.error('…');
 */
export { ToastProvider, useToast, default as Toast } from '../components/ui/Toast';
