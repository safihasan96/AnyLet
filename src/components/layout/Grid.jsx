import { cn } from '../../lib/cn';

/**
 * Grid — responsive layout grid.
 *  • cols (1–4): responsive ramp toward the target column count.
 *  • minItemWidth: overrides cols with an auto-fill track (`repeat(auto-fill,
 *    minmax(min, 1fr))`) — cards that reflow by available width.
 *  • gap: sm | md | lg
 */
const colClasses = {
  1: 'grid-cols-1',
  2: 'grid-cols-1 sm:grid-cols-2',
  3: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3',
  4: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4',
};
const gaps = { sm: 'gap-3', md: 'gap-5', lg: 'gap-6 lg:gap-8' };

export default function Grid({ cols = 3, minItemWidth, gap = 'md', className, style, children, ...props }) {
  const autoFill = minItemWidth
    ? { gridTemplateColumns: `repeat(auto-fill, minmax(min(${minItemWidth}, 100%), 1fr))` }
    : undefined;
  return (
    <div
      className={cn('grid', !minItemWidth && (colClasses[cols] || colClasses[3]), gaps[gap] || gaps.md, className)}
      style={{ ...autoFill, ...style }}
      {...props}
    >
      {children}
    </div>
  );
}
