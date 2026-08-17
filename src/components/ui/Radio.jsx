import { forwardRef, useId, createContext, useContext } from 'react';
import { cn } from '../../lib/cn';

/**
 * RadioGroup + Radio — accessible single-choice group.
 *
 *   <RadioGroup name="plan" value={v} onChange={setV} label="Plan">
 *     <Radio value="basic" label="Basic" />
 *     <Radio value="pro" label="Pro" description="Best value" />
 *   </RadioGroup>
 */
const RadioGroupContext = createContext(null);

export function RadioGroup({ name, value, onChange, label, className, children }) {
  const generatedName = useId();
  return (
    <RadioGroupContext.Provider value={{ name: name || generatedName, value, onChange }}>
      <div role="radiogroup" aria-label={label} className={cn('flex flex-col gap-2', className)}>
        {children}
      </div>
    </RadioGroupContext.Provider>
  );
}

export const Radio = forwardRef(function Radio(
  { value, label, description, className, id: idProp, disabled, checked: checkedProp, onChange: onChangeProp, name: nameProp, ...props },
  ref
) {
  const group = useContext(RadioGroupContext);
  const generatedId = useId();
  const id = idProp || generatedId;
  const name = nameProp || group?.name;
  const checked = group ? group.value === value : checkedProp;
  const handleChange = (e) => {
    group?.onChange?.(value, e);
    onChangeProp?.(e);
  };

  return (
    <div className={cn('flex items-start gap-2.5', disabled && 'opacity-55', className)}>
      <span className="relative inline-flex shrink-0 mt-0.5">
        <input
          ref={ref}
          id={id}
          type="radio"
          name={name}
          value={value}
          checked={checked}
          onChange={handleChange}
          disabled={disabled}
          className="peer size-5 appearance-none rounded-full border border-border-strong bg-surface cursor-pointer transition-colors duration-150
                     checked:border-primary checked:border-[6px] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring disabled:cursor-not-allowed"
          {...props}
        />
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

export default Radio;
