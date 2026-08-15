import { cn } from '../../lib/cn';

/**
 * Skeleton — shimmer placeholder built on design tokens. Compose freely.
 * The `shimmer` keyframe is defined once in index.css. Under reduced motion the
 * sweep is dropped and a soft pulse conveys loading instead.
 *
 *   <Skeleton className="h-5 w-40" />
 *   <SkeletonText lines={3} />
 *   <SkeletonCircle className="size-12" />
 */
export function Skeleton({ className, rounded = 'rounded-md', ...props }) {
  return (
    <div
      className={cn(
        'relative overflow-hidden bg-surface-sunken',
        rounded,
        'motion-reduce:animate-pulse',
        className
      )}
      aria-hidden="true"
      {...props}
    >
      <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-black/[0.06] to-transparent dark:via-white/[0.06] animate-[shimmer_1.5s_infinite] motion-reduce:hidden" />
    </div>
  );
}

export function SkeletonText({ lines = 3, className, lastWidth = 'w-2/3' }) {
  return (
    <div className={cn('flex flex-col gap-2', className)}>
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton key={i} className={cn('h-3.5', i === lines - 1 ? lastWidth : 'w-full')} />
      ))}
    </div>
  );
}

export function SkeletonCircle({ className }) {
  return <Skeleton rounded="rounded-full" className={className} />;
}

export default Skeleton;
