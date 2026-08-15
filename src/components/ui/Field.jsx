import { useId, cloneElement, isValidElement } from 'react';
import { cn } from '../../lib/cn';

/**
 * Field — accessible wrapper for a single form control.
 * Renders a <label>, optional hint and error, and wires them to the control
 * via id / aria-describedby / aria-invalid so it works without extra props.
 *
 * Usage:
 *   <Field label="Email" hint="We never share it." error={errors.email} required>
 *     <Input type="email" />
 *   </Field>
 */
export default function Field({ label, hint, error, required, htmlFor, className, children, id: idProp }) {
  const generatedId = useId();
  const id = idProp || htmlFor || generatedId;
  const hintId = hint ? `${id}-hint` : undefined;
  const errorId = error ? `${id}-error` : undefined;
  const describedBy = [hintId, errorId].filter(Boolean).join(' ') || undefined;

  let control = children;
  if (isValidElement(children)) {
    control = cloneElement(children, {
      id: children.props.id || id,
      'aria-describedby': cn(children.props['aria-describedby'], describedBy) || undefined,
      'aria-invalid': error ? true : children.props['aria-invalid'],
      invalid: error ? true : children.props.invalid,
      required: required ?? children.props.required,
    });
  }

  return (
    <div className={cn('flex flex-col gap-1.5', className)}>
      {label && (
        <label htmlFor={id} className="text-label font-medium text-content">
          {label}
          {required && <span className="ml-0.5 text-danger" aria-hidden="true">*</span>}
        </label>
      )}
      {control}
      {hint && !error && <p id={hintId} className="text-caption text-muted">{hint}</p>}
      {error && (
        <p id={errorId} className="text-caption text-danger flex items-center gap-1" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
