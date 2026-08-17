import { cn } from '../../lib/cn';

const SIZES = { xs: 'size-3.5', sm: 'size-4', md: 'size-5', lg: 'size-6', xl: 'size-8' };

/**
 * Spinner — indeterminate progress ring. Respects reduced motion (the spin is
 * a status indicator, so it stays, but slows). aria-label for screen readers.
 */
export default function Spinner({ size = 'md', className, label = 'Loading', ...props }) {
  return (
    <span
      role="status"
      aria-label={label}
      className={cn('inline-block animate-spin text-current motion-reduce:[animation-duration:1.6s]', SIZES[size] || SIZES.md, className)}
      {...props}
    >
      <svg viewBox="0 0 24 24" fill="none" className="size-full">
        <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="2.5" className="opacity-20" />
        <path d="M21 12a9 9 0 0 0-9-9" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
      </svg>
    </span>
  );
}
