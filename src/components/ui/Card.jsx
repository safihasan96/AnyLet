import { forwardRef } from 'react';
import { cn } from '../../lib/cn';

/**
 * Card — the surface container primitive.
 * variant: surface | raised | outline | sunken
 * padding: none | sm | md | lg
 * interactive: adds hover elevation + press feedback (use when the whole card
 *              is a link/button). Pass `as={Link}` to make it navigable.
 */
const variants = {
  surface: 'bg-surface border border-border shadow-card',
  raised: 'bg-surface-raised border border-border shadow-raised',
  outline: 'bg-surface border border-border-strong',
  sunken: 'bg-surface-sunken border border-transparent',
};

const paddings = { none: '', sm: 'p-3', md: 'p-5', lg: 'p-6 sm:p-8' };

const Card = forwardRef(function Card(
  { as: Comp = 'div', variant = 'surface', padding = 'md', interactive = false, className, children, ...props },
  ref
) {
  return (
    <Comp
      ref={ref}
      className={cn(
        'rounded-card',
        variants[variant] || variants.surface,
        paddings[padding],
        interactive &&
          'transition-[box-shadow,transform,border-color] duration-200 ease-[cubic-bezier(0.2,0,0,1)] ' +
            'hover:shadow-overlay hover:border-border-strong motion-safe:hover:-translate-y-0.5 motion-safe:active:translate-y-0 ' +
            'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring cursor-pointer',
        className
      )}
      {...props}
    >
      {children}
    </Comp>
  );
});

export function CardHeader({ className, children, ...props }) {
  return <div className={cn('flex flex-col gap-1', className)} {...props}>{children}</div>;
}
export function CardTitle({ as: Comp = 'h3', className, children, ...props }) {
  return <Comp className={cn('text-title-sm text-content', className)} {...props}>{children}</Comp>;
}
export function CardDescription({ className, children, ...props }) {
  return <p className={cn('text-body-sm text-muted', className)} {...props}>{children}</p>;
}
export function CardFooter({ className, children, ...props }) {
  return <div className={cn('flex items-center gap-3 pt-4 mt-4 border-t border-border', className)} {...props}>{children}</div>;
}

export default Card;
