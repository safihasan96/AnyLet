import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useReducedMotion } from 'framer-motion';
import { cn } from '../../lib/cn';
import { Icon } from '../../lib/icons';
import Badge from '../ui/Badge';
import IconButton from '../ui/IconButton';
import { Skeleton } from '../ui/Skeleton';

/**
 * PropertyCard (pattern) — the premium listing card, composed from tokens only
 * (no `dark:` classes, one radius family, restrained weights, real placeholder
 * instead of a stock photo). Motion is limited to a gentle hover lift + a soft
 * image scale, both motion-safe.
 *
 * Save is optional & injected (`saved` + `onToggleSave`) so the card stays a
 * pure, reusable pattern. Currency defaults to BDT (৳).
 */
export default function PropertyCard({
  property = {},
  saved = false,
  onToggleSave,
  currency = '৳',
  className,
}) {
  const {
    id, title, rent, price, images = [], image,
    beds, baths, type, isVerified, reviewCount, reviewScore, status,
  } = property;

  const pics = (images.length ? images : [image].filter(Boolean)).slice(0, 5);
  const [idx, setIdx] = useState(0);
  const reduce = useReducedMotion();
  const displayRent = (rent ?? price ?? 0).toLocaleString();

  const loc = [property.addressDetails, property.upazila, property.district].filter(Boolean).join(', ') || 'Bangladesh';
  const hasMany = pics.length > 1;
  const step = (dir) => (e) => {
    e.preventDefault(); e.stopPropagation();
    setIdx((p) => (p + dir + pics.length) % pics.length);
  };

  return (
    <div className={cn('group relative h-full', className)}>
      <Link
        to={id ? `/property/${id}` : '#'}
        className="flex h-full flex-col overflow-hidden rounded-card bg-surface border border-border shadow-card
                   transition-[box-shadow,transform,border-color] duration-200 ease-[cubic-bezier(0.2,0,0,1)]
                   hover:shadow-overlay hover:border-border-strong motion-safe:hover:-translate-y-1
                   focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
      >
        {/* Media */}
        <div className="relative aspect-[4/3] w-full overflow-hidden bg-surface-sunken">
          {pics.length ? (
            <img
              key={idx}
              src={pics[idx]}
              alt={title || 'Property photo'}
              loading="lazy"
              className={cn(
                'absolute inset-0 size-full object-cover transition-transform duration-500 ease-[cubic-bezier(0.2,0,0,1)]',
                !reduce && 'motion-safe:group-hover:scale-[1.04]'
              )}
            />
          ) : (
            <div className="absolute inset-0 grid place-items-center text-subtle">
              <Icon name="imageOff" className="size-8" />
            </div>
          )}

          {/* Top-left status/verification */}
          <div className="absolute left-3 top-3 flex flex-col items-start gap-1.5">
            {isVerified && (
              <Badge tone="success" size="sm" icon={<Icon name="verified" />} className="bg-surface/90 backdrop-blur-sm shadow-card">
                Verified
              </Badge>
            )}
            {status && status !== 'Available' && (
              <Badge tone={status === 'Booked' ? 'info' : 'warning'} size="sm" className="shadow-card">{status}</Badge>
            )}
          </div>

          {/* Save */}
          {onToggleSave && (
            <IconButton
              label={saved ? 'Remove from saved' : 'Save property'}
              aria-pressed={saved}
              shape="pill"
              onClick={(e) => { e.preventDefault(); e.stopPropagation(); onToggleSave(id, e); }}
              className="absolute right-3 top-3 size-9 bg-surface/90 backdrop-blur-sm shadow-card hover:bg-surface"
            >
              <Icon name="favorite" className={cn('transition-colors', saved ? 'fill-danger text-danger' : 'text-muted')} />
            </IconButton>
          )}

          {/* Carousel controls (desktop hover) */}
          {hasMany && (
            <>
              <IconButton label="Previous photo" size="sm" shape="pill" onClick={step(-1)}
                className="absolute left-2 top-1/2 -translate-y-1/2 bg-surface/85 backdrop-blur-sm shadow-card opacity-0 transition-opacity group-hover:opacity-100 focus-visible:opacity-100">
                <Icon name="chevronLeft" />
              </IconButton>
              <IconButton label="Next photo" size="sm" shape="pill" onClick={step(1)}
                className="absolute right-2 top-1/2 -translate-y-1/2 bg-surface/85 backdrop-blur-sm shadow-card opacity-0 transition-opacity group-hover:opacity-100 focus-visible:opacity-100">
                <Icon name="chevronRight" />
              </IconButton>
              <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5" aria-hidden="true">
                {pics.map((_, i) => (
                  <span key={i} className={cn('h-1.5 rounded-full bg-white transition-all', i === idx ? 'w-4 opacity-100' : 'w-1.5 opacity-60')} />
                ))}
              </div>
            </>
          )}
        </div>

        {/* Body */}
        <div className="flex flex-1 flex-col p-4">
          <div className="flex items-start justify-between gap-2">
            <h3 className="text-title-sm text-content line-clamp-1" title={title}>{title || 'Untitled listing'}</h3>
            {type && <Badge tone="neutral" size="sm" className="shrink-0">{type}</Badge>}
          </div>

          <p className="mt-1 flex items-center gap-1 text-body-sm text-muted line-clamp-1">
            <Icon name="location" className="size-3.5 shrink-0 text-subtle" />
            <span className="truncate">{loc}</span>
          </p>

          <div className="mt-3 flex items-end justify-between gap-3 pt-3 border-t border-border">
            <div className="flex items-center gap-4 text-body-sm text-muted">
              {beds != null && <span className="inline-flex items-center gap-1.5"><Icon name="bed" className="size-4 text-subtle" />{beds}</span>}
              {baths != null && <span className="inline-flex items-center gap-1.5"><Icon name="bath" className="size-4 text-subtle" />{baths}</span>}
              {reviewCount > 0 && (
                <span className="inline-flex items-center gap-1"><Icon name="rating" className="size-4 fill-warning text-warning" />{Number(reviewScore || 0).toFixed(1)}</span>
              )}
            </div>
            <p className="text-title-sm font-semibold text-content whitespace-nowrap">
              {currency}{displayRent}<span className="ml-0.5 text-caption font-medium text-subtle">/mo</span>
            </p>
          </div>
        </div>
      </Link>
    </div>
  );
}

/**
 * PropertyCardSkeleton — matches PropertyCard's shape 1:1 (aspect-[4/3] media +
 * p-4 body) so grids don't shift when data resolves.
 */
export function PropertyCardSkeleton() {
  return (
    <div className="overflow-hidden rounded-card border border-border bg-surface shadow-card">
      <Skeleton className="aspect-[4/3] w-full" rounded="rounded-none" />
      <div className="flex flex-col gap-3 p-4">
        <div className="flex items-center justify-between gap-2">
          <Skeleton className="h-4 w-2/3" />
          <Skeleton className="h-5 w-14 rounded-pill" />
        </div>
        <Skeleton className="h-3.5 w-1/2" />
        <div className="mt-1 flex items-center justify-between border-t border-border pt-3">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-4 w-16" />
        </div>
      </div>
    </div>
  );
}
