import { Link } from 'react-router-dom';
import { cn } from '../../lib/cn';
import Badge from '../ui/Badge';

/**
 * Sidebar — vertical navigation rail for dashboards / admin. Width is driven by
 * the --spacing-sidebar-w token. Compose with SidebarSection + SidebarItem.
 * Presentational: AppShell handles where it sits and its responsive behavior.
 */
export default function Sidebar({ header, footer, children, className }) {
  return (
    <aside
      className={cn('flex flex-col w-[var(--spacing-sidebar-w)] shrink-0 h-full bg-surface border-r border-border', className)}
    >
      {header && <div className="px-4 h-16 flex items-center shrink-0 border-b border-border">{header}</div>}
      <nav className="flex-1 overflow-y-auto p-3 space-y-1">{children}</nav>
      {footer && <div className="p-3 border-t border-border shrink-0">{footer}</div>}
    </aside>
  );
}

export function SidebarSection({ label, children, className }) {
  return (
    <div className={cn('py-2', className)}>
      {label && <div className="px-3 pb-1.5 text-overline uppercase text-subtle">{label}</div>}
      <div className="space-y-1">{children}</div>
    </div>
  );
}

export function SidebarItem({ icon, label, active, badge, to, onClick, className, ...props }) {
  const Comp = to ? Link : 'button';
  return (
    <Comp
      to={to}
      onClick={onClick}
      aria-current={active ? 'page' : undefined}
      className={cn(
        'group w-full flex items-center gap-3 px-3 py-2.5 rounded-control text-body-sm font-medium text-left transition-colors',
        'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring',
        active ? 'bg-primary-subtle text-primary' : 'text-muted hover:bg-surface-sunken hover:text-content',
        className
      )}
      {...props}
    >
      {icon && <span className={cn('shrink-0 [&>svg]:size-[1.2rem]', active ? 'text-primary' : 'text-subtle group-hover:text-content')} aria-hidden="true">{icon}</span>}
      <span className="flex-1 truncate">{label}</span>
      {badge != null && <Badge tone={active ? 'primary' : 'neutral'} size="sm">{badge}</Badge>}
    </Comp>
  );
}
