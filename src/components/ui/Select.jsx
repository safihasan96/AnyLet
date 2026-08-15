import { forwardRef } from 'react';
import { cn } from '../../lib/cn';
import { Icon } from '../../lib/icons';

/**
 * Select — styled native <select>. Native keeps mobile UX and accessibility for
 * free (the platform picker). A custom chevron replaces the OS arrow.
 * Provide options via `options=[{value,label}]` or children <option>s.
 */
const sizes = { sm: 'h-9 text-body-sm', md: 'h-11 text-body-sm', lg: 'h-[3.25rem] text-body' };

const Select = forwardRef(function Select(
  { size = 'md', invalid = false, options, placeholder, className, containerClassName, disabled, children, ...props },
  ref
) {
  return (
    <div className={cn('relative', containerClassName)}>
      <select
        ref={ref}
        disabled={disabled}
        aria-invalid={invalid || undefined}
        className={cn(
          'w-full appearance-none bg-surface text-content rounded-field border pl-3.5 pr-10 cursor-pointer',
          'transition-[border-color,box-shadow] duration-150 outline-none focus:ring-4 focus:ring-primary/15',
          sizes[size] || sizes.md,
          invalid ? 'border-danger focus:border-danger focus:ring-danger/15' : 'border-border hover:border-border-strong focus:border-primary',
          disabled && 'opacity-55 cursor-not-allowed bg-surface-sunken',
          className
        )}
        {...props}
      >
        {placeholder && <option value="" disabled>{placeholder}</option>}
        {options
          ? options.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))
          : children}
      </select>
      <Icon name="chevronDown" className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 size-[18px] text-subtle" />
    </div>
  );
});

export default Select;
