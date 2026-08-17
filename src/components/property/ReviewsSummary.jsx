import { Link } from 'react-router-dom';
import { cn } from '../../lib/cn';
import { Icon } from '../../lib/icons';
import { Card, Avatar, Badge, Button, EmptyState } from '../ui';

function Stars({ rating, className = 'size-4' }) {
  return (
    <span className="inline-flex items-center gap-0.5" aria-label={`${Number(rating || 0).toFixed(1)} out of 5`}>
      {[1, 2, 3, 4, 5].map((s) => (
        <Icon key={s} name="rating" className={cn(className, rating >= s ? 'fill-warning text-warning' : rating >= s - 0.5 ? 'fill-warning/40 text-warning' : 'fill-transparent text-border-strong')} />
      ))}
    </span>
  );
}

function fmt(ts) {
  if (!ts) return '';
  const d = ts.toDate ? ts.toDate() : typeof ts.seconds === 'number' ? new Date(ts.seconds * 1000) : new Date(ts);
  return Number.isNaN(d?.getTime?.()) ? '' : new Intl.DateTimeFormat('en-US', { month: 'short', year: 'numeric' }).format(d);
}

/**
 * ReviewsSummary — score, a 5→1 star breakdown, and a preview of verified-tenant
 * ReviewCards. `reviews` powers the breakdown; falls back to the aggregate
 * score/count from the property doc when reviews aren't loaded.
 */
export default function ReviewsSummary({ reviews = [], score, count, propertyId, loading }) {
  const total = reviews.length || count || 0;
  const avg = reviews.length ? reviews.reduce((a, r) => a + (r.rating || 0), 0) / reviews.length : (score || 0);
  const dist = [5, 4, 3, 2, 1].map((star) => {
    const c = reviews.filter((r) => Math.round(r.rating) === star).length;
    return { star, c, pct: reviews.length ? (c / reviews.length) * 100 : 0 };
  });

  if (!loading && total === 0) {
    return <EmptyState size="sm" icon={<Icon name="rating" />} title="No reviews yet" description="Be the first to review after your stay." />;
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,240px)_1fr]">
      {/* Score + breakdown */}
      <div>
        <div className="flex items-end gap-3">
          <span className="font-display text-display-lg text-content">{avg.toFixed(1)}</span>
          <div className="pb-1.5">
            <Stars rating={avg} className="size-4" />
            <p className="mt-1 text-caption text-muted">{total} {total === 1 ? 'review' : 'reviews'}</p>
          </div>
        </div>
        {reviews.length > 0 && (
          <div className="mt-4 space-y-1.5">
            {dist.map((d) => (
              <div key={d.star} className="flex items-center gap-2">
                <span className="w-3 text-caption text-muted">{d.star}</span>
                <Icon name="rating" className="size-3 fill-warning text-warning" />
                <span className="h-2 flex-1 overflow-hidden rounded-pill bg-surface-sunken">
                  <span className="block h-full rounded-pill bg-warning transition-all" style={{ width: `${d.pct}%` }} />
                </span>
                <span className="w-6 text-right text-caption text-subtle">{d.c}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Review cards */}
      <div className="space-y-4">
        {reviews.slice(0, 3).map((r) => (
          <Card key={r.id} variant="outline" padding="md">
            <div className="mb-2 flex items-start gap-3">
              <Avatar src={r.reviewerAvatar} name={r.reviewerName || 'A'} size="md" />
              <div className="min-w-0 flex-1">
                <p className="truncate text-body-sm font-semibold text-content">{r.reviewerName || 'Anonymous'}</p>
                <div className="mt-0.5 flex items-center gap-2">
                  <Stars rating={r.rating || 0} className="size-3.5" />
                  <span className="text-caption text-subtle">{fmt(r.createdAt)}</span>
                </div>
              </div>
              <Badge tone="success" size="sm" icon={<Icon name="verified" />}>Verified</Badge>
            </div>
            <p className="whitespace-pre-wrap text-body-sm leading-relaxed text-muted">{r.body}</p>
          </Card>
        ))}
        {total > 3 && (
          <Button as={Link} to={`/property/${propertyId}/reviews`} variant="secondary" rightIcon={<Icon name="chevronRight" />}>
            Read all {total} reviews
          </Button>
        )}
      </div>
    </div>
  );
}
