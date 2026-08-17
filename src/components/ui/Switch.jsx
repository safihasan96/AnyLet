import { forwardRef, useId } from 'react';
import { cn } from '../../lib/cn';

/**
 * Switch — on/off toggle (role=switch). Use for immediate settings, not form
 * submission choices (use Checkbox for those). The knob transition is gated by
 * motion-safe; the track color change communicates state under reduced motion.
 */
const Switch = forwardRef(function Switch(
  { checked = false, onChange, label, description, disabled, className, id: idProp, ...props },
  ref
) {
  const generatedId = useId();
  const id = idProp || generatedId;
  const toggle = () => !disabled && onChange?.(!checked);

  const control = (
    <button
      ref={ref}
      id={id}
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={!label ? props['aria-label'] : undefined}
      disabled={disabled}
      onClick={toggle}
      className={cn(
        'relative inline-flex h-6 w-11 shrink-0 items-center rounded-pill border-2 border-transparent transition-colors duration-200 ease-[cubic-bezier(0.2,0,0,1)]',
        'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring disabled:opacity-55 disabled:cursor-not-allowed',
        checked ? 'bg-primary' : 'bg-border-strong',
        className
      )}
      {...props}
    >
      <span
        className={cn(
          'inline-block size-5 rounded-full bg-white shadow-card transition-transform duration-200 ease-[cubic-bezier(0.2,0,0,1)] motion-reduce:transition-none',
          checked ? 'translate-x-5' : 'translate-x-0'
        )}
      />
    </button>
  );

  if (!label && !description) return control;

  return (
    <div className={cn('flex items-center justify-between gap-4', disabled && 'opacity-55')}>
      <label htmlFor={id} className="cursor-pointer select-none">
        {label && <span className="block text-body-sm text-content">{label}</span>}
        {description && <span className="block text-caption text-muted">{description}</span>}
      </label>
      {control}
    </div>
  );
});

export default Switch;
