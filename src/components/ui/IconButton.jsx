import { forwardRef } from 'react';
import { cn } from '../../lib/cn';
import Spinner from './Spinner';

/**
 * IconButton — a square, icon-only control. `label` is REQUIRED and becomes the
 * accessible name (aria-label + title). Never ship an unlabeled icon button.
 */
const base =
  'inline-flex items-center justify-center shrink-0 transition-[background-color,transform,box-shadow] duration-150 ease-[cubic-bezier(0.2,0,0,1)] ' +
  'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring ' +
  'motion-safe:active:scale-[0.94] disabled:opacity-50 disabled:pointer-events-none';

const variants = {
  ghost: 'text-content hover:bg-surface-sunken',
  surface: 'bg-surface text-content border border-border shadow-card hover:bg-surface-sunken',
  soft: 'bg-primary-subtle text-primary hover:brightness-95 dark:hover:brightness-125',
  primary: 'bg-primary text-on-primary shadow-card hover:bg-primary-hover',
  danger: 'bg-danger-subtle text-danger hover:brightness-95 dark:hover:brightness-125',
};

const sizes = { sm: 'size-8 [&>svg]:size-4', md: 'size-10 [&>svg]:size-5', lg: 'size-12 [&>svg]:size-6' };

const IconButton = forwardRef(function IconButton(
  { as: Comp = 'button', label, variant = 'ghost', size = 'md', shape = 'control', loading = false, disabled = false, className, children, type, ...props },
  ref
) {
  const isNative = Comp === 'button';
  return (
    <Comp
      ref={ref}
      type={isNative ? type || 'button' : undefined}
      aria-label={label}
      title={label}
      disabled={isNative ? disabled || loading : undefined}
      aria-disabled={!isNative && (disabled || loading) ? true : undefined}
      aria-busy={loading || undefined}
      className={cn(base, variants[variant] || variants.ghost, sizes[size], shape === 'pill' ? 'rounded-pill' : 'rounded-control', className)}
      {...props}
    >
      {loading ? <Spinner size="sm" /> : children}
    </Comp>
  );
});

export default IconButton;
