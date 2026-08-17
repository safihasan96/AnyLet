import { cn } from '../../lib/cn';

/**
 * Section — a titled content block with consistent vertical rhythm.
 * Renders a semantic <section> with an optional header (title / description /
 * action). `spacing` controls the block's vertical padding.
 */
const spacings = { none: '', sm: 'py-6', md: 'py-10', lg: 'py-14 lg:py-20' };

export default function Section({ title, description, action, headingLevel: H = 'h2', spacing = 'md', className, headerClassName, children, ...props }) {
  return (
    <section className={cn(spacings[spacing] ?? spacings.md, className)} {...props}>
      {(title || action) && (
        <div className={cn('flex items-end justify-between gap-4 mb-5', headerClassName)}>
          <div className="min-w-0">
            {title && <H className="text-title-lg text-content">{title}</H>}
            {description && <p className="mt-1 text-body-sm text-muted max-w-prose">{description}</p>}
          </div>
          {action && <div className="shrink-0">{action}</div>}
        </div>
      )}
      {children}
    </section>
  );
}
