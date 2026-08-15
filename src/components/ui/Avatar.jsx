import { useState } from 'react';
import { cn } from '../../lib/cn';

/**
 * Avatar — image with graceful initials fallback (on missing src or load error).
 * size: xs | sm | md | lg | xl | 2xl. Optional `status` dot and `ring`.
 */
const sizes = {
  xs: 'size-6 text-[0.625rem]',
  sm: 'size-8 text-caption',
  md: 'size-10 text-body-sm',
  lg: 'size-12 text-body',
  xl: 'size-16 text-title-md',
  '2xl': 'size-24 text-display-md',
};

const statusColors = { online: 'bg-success', busy: 'bg-danger', away: 'bg-warning', offline: 'bg-subtle' };

function initialsFrom(name = '') {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return '?';
  if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
  return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
}

export default function Avatar({ src, name = '', alt, size = 'md', shape = 'circle', status, ring = false, className, ...props }) {
  const [errored, setErrored] = useState(false);
  const showImage = src && !errored;
  const radius = shape === 'square' ? 'rounded-card' : 'rounded-full';

  return (
    <span className={cn('relative inline-flex shrink-0', className)} {...props}>
      <span
        className={cn(
          'inline-flex items-center justify-center overflow-hidden font-semibold select-none',
          'bg-primary-subtle text-primary',
          sizes[size] || sizes.md,
          radius,
          ring && 'ring-2 ring-surface shadow-card'
        )}
      >
        {showImage ? (
          <img
            src={src}
            alt={alt || name || 'Avatar'}
            loading="lazy"
            className="size-full object-cover"
            onError={() => setErrored(true)}
          />
        ) : (
          <span aria-hidden={!!alt}>{initialsFrom(name)}</span>
        )}
      </span>
      {status && (
        <span
          className={cn('absolute bottom-0 right-0 block size-[28%] rounded-full ring-2 ring-surface', statusColors[status] || statusColors.offline)}
          aria-label={status}
        />
      )}
    </span>
  );
}
