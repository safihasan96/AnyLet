import { forwardRef } from 'react';
import { cn } from '../../lib/cn';

/** Textarea — multi-line input. Pairs with <Field/>. */
const Textarea = forwardRef(function Textarea({ invalid = false, rows = 4, className, disabled, ...props }, ref) {
  return (
    <textarea
      ref={ref}
      rows={rows}
      disabled={disabled}
      aria-invalid={invalid || undefined}
      className={cn(
        'w-full bg-surface text-content placeholder:text-subtle rounded-field border px-3.5 py-2.5 text-body-sm resize-y min-h-[5rem]',
        'transition-[border-color,box-shadow] duration-150 outline-none focus:ring-4 focus:ring-primary/15',
        invalid ? 'border-danger focus:border-danger focus:ring-danger/15' : 'border-border hover:border-border-strong focus:border-primary',
        disabled && 'opacity-55 cursor-not-allowed bg-surface-sunken',
        className
      )}
      {...props}
    />
  );
});

export default Textarea;
