import { Skeleton, SkeletonText } from '../ui';

export default function ListingSkeleton() {
    return (
        <article className="overflow-hidden rounded-card border border-border bg-surface shadow-sm">
            <Skeleton className="h-24 w-full rounded-none" />
            <div className="space-y-2.5 p-3">
                <SkeletonText lines={2} />
                <Skeleton className="h-3 w-1/2 rounded" />
            </div>
        </article>
    );
}
