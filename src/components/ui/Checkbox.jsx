import { forwardRef, useId } from 'react';
import { cn } from '../../lib/cn';
import { Icon } from '../../lib/icons';

/**
 * Checkbox — a real <input type="checkbox"> (peer) with a styled visual box, so
 * keyboard, form state, and screen readers all work natively. Supports
 * `indeterminate`, `label`, and `description`.
 */
const Checkbox = forwardRef(function Checkbox(
  { label, description, indeterminate = false, className, id: idProp, disabled, ...props },
  ref
) {
  const generatedId = useId();
  const id = idProp || generatedId;
  return (
    <div className={cn('flex items-start gap-2.5', disabled && 'opacity-55', className)}>
      <span className="relative inline-flex shrink-0 mt-0.5">
        <input
          ref={(node) => {
            if (node) node.indeterminate = indeterminate;
            if (typeof ref === 'function') ref(node);
            else if (ref) ref.current = node;
          }}
          id={id}
          type="checkbox"
          disabled={disabled}
          className="peer size-5 appearance-none rounded-[6px] border border-border-strong bg-surface cursor-pointer transition-colors duration-150
                     checked:bg-primary checked:border-primary indeterminate:bg-primary indeterminate:border-primary
                     focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring disabled:cursor-not-allowed"
          {...props}
        />
        <span className="pointer-events-none absolute inset-0 flex items-center justify-center text-on-primary opacity-0 peer-checked:opacity-100 peer-indeterminate:opacity-100" aria-hidden="true">
          <Icon name={indeterminate ? 'minus' : 'check'} className="size-3.5" strokeWidth={3.5} />
        </span>
      </span>
      {(label || description) && (
        <label htmlFor={id} className="cursor-pointer select-none">
          {label && <span className="block text-body-sm text-content">{label}</span>}
          {description && <span className="block text-caption text-muted">{description}</span>}
        </label>
      )}
    </div>
  );
});

export default Checkbox;
