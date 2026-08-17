import { cn } from '../../lib/cn';

/**
 * EmptyState — a calm, helpful "nothing here yet" for empty lists/searches.
 * Give it an `icon`, a short `title`, optional `description`, and an `action`
 * (usually a <Button/>). Direct, specific copy beats generic ("No saved homes
 * yet" not "Empty").
 */
export default function EmptyState({ icon, title, description, action, size = 'md', className, ...props }) {
  const iconWrap = size === 'sm' ? 'size-12 [&>svg]:size-6' : 'size-16 [&>svg]:size-8';
  return (
    <div
      className={cn('flex flex-col items-center justify-center text-center px-6', size === 'sm' ? 'py-8' : 'py-14', className)}
      {...props}
    >
      {icon && (
        <div className={cn('flex items-center justify-center rounded-2xl bg-surface-sunken text-subtle mb-4', iconWrap)} aria-hidden="true">
          {icon}
        </div>
      )}
      {title && <h3 className="text-title-sm text-content">{title}</h3>}
      {description && <p className="mt-1.5 text-body-sm text-muted max-w-sm">{description}</p>}
      {action && <div className="mt-5 flex items-center gap-3">{action}</div>}
    </div>
  );
}
