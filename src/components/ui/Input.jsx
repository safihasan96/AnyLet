import { forwardRef } from 'react';
import { cn } from '../../lib/cn';

/**
 * Input — text field. Supports leftIcon / rightIcon adornments, `invalid`
 * state, and sizes. Pairs with <Field/> for label/hint/error + aria wiring.
 */
const sizes = {
  sm: 'h-9 text-body-sm',
  md: 'h-11 text-body-sm',
  lg: 'h-[3.25rem] text-body',
};

const Input = forwardRef(function Input(
  { size = 'md', invalid = false, leftIcon, rightIcon, className, containerClassName, disabled, ...props },
  ref
) {
  const field = (
    <input
      ref={ref}
      disabled={disabled}
      aria-invalid={invalid || undefined}
      className={cn(
        'peer w-full bg-surface text-content placeholder:text-subtle rounded-field border transition-[border-color,box-shadow] duration-150',
        'outline-none focus:ring-4 focus:ring-primary/15 focus-visible:outline-none',
        sizes[size] || sizes.md,
        leftIcon ? 'pl-10' : 'pl-3.5',
        rightIcon ? 'pr-10' : 'pr-3.5',
        invalid
          ? 'border-danger focus:border-danger focus:ring-danger/15'
          : 'border-border hover:border-border-strong focus:border-primary',
        disabled && 'opacity-55 cursor-not-allowed bg-surface-sunken',
        className
      )}
      {...props}
    />
  );

  if (!leftIcon && !rightIcon) return field;

  return (
    <div className={cn('relative', containerClassName)}>
      {leftIcon && (
        <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-subtle peer-focus:text-primary [&>svg]:size-[1.15rem]" aria-hidden="true">
          {leftIcon}
        </span>
      )}
      {field}
      {rightIcon && (
        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-subtle [&>svg]:size-[1.15rem]" aria-hidden="true">
          {rightIcon}
        </span>
      )}
    </div>
  );
});

export default Input;
