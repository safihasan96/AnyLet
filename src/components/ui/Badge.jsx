import { cn } from '../../lib/cn';

/**
 * Badge — compact status / label pill. Tone-based, using subtle token backgrounds.
 * tone: neutral | primary | success | warning | danger | info | outline
 * size: sm | md
 */
const tones = {
  neutral: 'bg-surface-sunken text-muted',
  primary: 'bg-primary-subtle text-primary',
  success: 'bg-success-subtle text-success',
  warning: 'bg-warning-subtle text-warning',
  danger: 'bg-danger-subtle text-danger',
  info: 'bg-info-subtle text-info',
  outline: 'bg-transparent text-content border border-border-strong',
};

const sizes = { sm: 'h-5 px-2 text-caption gap-1', md: 'h-6 px-2.5 text-body-sm gap-1.5' };

const dotTones = {
  neutral: 'bg-subtle', primary: 'bg-primary', success: 'bg-success',
  warning: 'bg-warning', danger: 'bg-danger', info: 'bg-info', outline: 'bg-subtle',
};

export default function Badge({ tone = 'neutral', size = 'sm', dot = false, icon, className, children, ...props }) {
  return (
    <span
      className={cn('inline-flex items-center rounded-pill font-medium align-middle whitespace-nowrap', tones[tone] || tones.neutral, sizes[size] || sizes.sm, className)}
      {...props}
    >
      {dot && <span className={cn('size-1.5 rounded-full', dotTones[tone] || dotTones.neutral)} aria-hidden="true" />}
      {icon && <span className="[&>svg]:size-[1em]" aria-hidden="true">{icon}</span>}
      {children}
    </span>
  );
}
