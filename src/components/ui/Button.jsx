import { forwardRef } from 'react';
import { cn } from '../../lib/cn';
import Spinner from './Spinner';

/**
 * Button — the single button primitive for the app.
 *
 * variant: primary | secondary | ghost | soft | danger | outline
 * size:    sm | md | lg
 * Props: loading, disabled, fullWidth, leftIcon, rightIcon, iconOnly, as.
 *
 * Motion: press feedback lives on :active (Apple — respond on pointer-down),
 * gated by motion-safe. Weight is 600, never black. Focus-visible ring always.
 * Pass `as={Link}` (+ router props) to render as a link with button styling.
 */
const base =
  'relative inline-flex items-center justify-center font-semibold select-none ' +
  'rounded-control whitespace-nowrap transition-[background-color,box-shadow,transform,opacity] duration-150 ease-[cubic-bezier(0.2,0,0,1)] ' +
  'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring ' +
  'motion-safe:active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none';

const variants = {
  primary: 'bg-primary text-on-primary shadow-card hover:bg-primary-hover active:bg-primary-active',
  secondary: 'bg-surface text-content border border-border shadow-card hover:bg-surface-sunken hover:border-border-strong',
  ghost: 'bg-transparent text-content hover:bg-surface-sunken',
  soft: 'bg-primary-subtle text-primary hover:brightness-95 dark:hover:brightness-125',
  danger: 'bg-danger text-on-danger shadow-card hover:brightness-105 active:brightness-95',
  outline: 'bg-transparent text-content border border-border-strong hover:bg-surface-sunken',
};

const sizes = {
  sm: 'h-9 px-3.5 text-body-sm gap-1.5',
  md: 'h-11 px-5 text-label gap-2',
  lg: 'h-[3.25rem] px-6 text-title-sm gap-2',
};

const iconSizes = { sm: 'size-9 px-0', md: 'size-11 px-0', lg: 'size-[3.25rem] px-0' };

const Button = forwardRef(function Button(
  {
    as: Comp = 'button',
    variant = 'primary',
    size = 'md',
    loading = false,
    disabled = false,
    fullWidth = false,
    iconOnly = false,
    leftIcon,
    rightIcon,
    className,
    children,
    type,
    ...props
  },
  ref
) {
  const isNative = Comp === 'button';
  return (
    <Comp
      ref={ref}
      type={isNative ? type || 'button' : undefined}
      disabled={isNative ? disabled || loading : undefined}
      aria-busy={loading || undefined}
      aria-disabled={!isNative && (disabled || loading) ? true : undefined}
      className={cn(
        base,
        variants[variant] || variants.primary,
        iconOnly ? iconSizes[size] : sizes[size],
        fullWidth && 'w-full',
        className
      )}
      {...props}
    >
      {loading && (
        <Spinner size={size === 'lg' ? 'md' : 'sm'} className={cn(!iconOnly && children && 'absolute')} />
      )}
      <span className={cn('inline-flex items-center', iconOnly ? '' : 'gap-2', loading && !iconOnly && 'opacity-0')}>
        {leftIcon && <span className="shrink-0 [&>svg]:size-[1.15em]" aria-hidden="true">{leftIcon}</span>}
        {children}
        {rightIcon && <span className="shrink-0 [&>svg]:size-[1.15em]" aria-hidden="true">{rightIcon}</span>}
      </span>
    </Comp>
  );
});

export default Button;
