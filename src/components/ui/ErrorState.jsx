import { cn } from '../../lib/cn';
import { Icon } from '../../lib/icons';
import Button from './Button';

/**
 * ErrorState — something failed. Distinct from EmptyState (that's "nothing
 * here"; this is "we couldn't load it"). Offers a retry by default when
 * `onRetry` is provided. Keep copy honest and non-alarming.
 */
export default function ErrorState({
  title = 'Something went wrong',
  description = 'We couldn’t load this right now. Please try again.',
  icon,
  onRetry,
  retryLabel = 'Try again',
  action,
  className,
  ...props
}) {
  return (
    <div
      role="alert"
      className={cn('flex flex-col items-center justify-center text-center px-6 py-14', className)}
      {...props}
    >
      <div className="flex items-center justify-center size-16 rounded-2xl bg-danger-subtle text-danger mb-4 [&>svg]:size-8" aria-hidden="true">
        {icon || <Icon name="warning" />}
      </div>
      <h3 className="text-title-sm text-content">{title}</h3>
      {description && <p className="mt-1.5 text-body-sm text-muted max-w-sm">{description}</p>}
      {(onRetry || action) && (
        <div className="mt-5 flex items-center gap-3">
          {onRetry && <Button variant="secondary" onClick={onRetry}>{retryLabel}</Button>}
          {action}
        </div>
      )}
    </div>
  );
}
