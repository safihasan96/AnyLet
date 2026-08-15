import { forwardRef } from 'react';
import { cn } from '../../lib/cn';

/**
 * Container — centers content and applies the standard responsive gutters.
 * size: prose (~640) | narrow (768) | default (1200) | wide (1400) | full
 * Uses the --spacing-content tokens so page widths stay consistent app-wide.
 */
const sizes = {
  prose: 'max-w-2xl',
  narrow: 'max-w-3xl',
  default: 'max-w-[var(--spacing-content)]',
  wide: 'max-w-[var(--spacing-content-xl)]',
  full: 'max-w-none',
};

const Container = forwardRef(function Container(
  { as: Comp = 'div', size = 'default', gutter = true, className, children, ...props },
  ref
) {
  return (
    <Comp
      ref={ref}
      className={cn('mx-auto w-full', sizes[size] || sizes.default, gutter && 'px-4 sm:px-6 lg:px-8', className)}
      {...props}
    >
      {children}
    </Comp>
  );
});

export default Container;
