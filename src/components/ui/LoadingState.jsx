import { cn } from '../../lib/cn';
import Spinner from './Spinner';

/**
 * LoadingState — a centered spinner with optional message for a region or the
 * whole page. For content-shaped waits prefer <Skeleton/> (less layout shift);
 * use LoadingState for actions and indeterminate waits.
 *
 * `fullPage` centers within the viewport min-height.
 */
export default function LoadingState({ label = 'Loading…', description, size = 'lg', fullPage = false, className }) {
  return (
    <div
      role="status"
      aria-live="polite"
      className={cn(
        'flex flex-col items-center justify-center gap-3 text-center',
        fullPage ? 'min-h-[60vh] w-full' : 'py-12',
        className
      )}
    >
      <Spinner size={size} className="text-primary" label={label} />
      {label && <p className="text-body-sm font-medium text-content">{label}</p>}
      {description && <p className="text-caption text-muted max-w-xs">{description}</p>}
    </div>
  );
}
