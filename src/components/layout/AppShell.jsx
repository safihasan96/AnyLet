import { cn } from '../../lib/cn';

/**
 * AppShell — the page frame. Two arrangements:
 *  • variant="stacked"  → optional Navbar on top, content below (marketing /
 *    consumer pages).
 *  • variant="sidebar"  → fixed Sidebar on the left (desktop), content on the
 *    right with an optional Navbar above it (dashboard / admin). The sidebar is
 *    hidden below `lg`; pair with a Drawer for mobile navigation.
 *
 * Presentational only — it owns layout, not data or routing.
 */
export default function AppShell({ variant = 'stacked', navbar, sidebar, footer, children, contentClassName, className }) {
  if (variant === 'sidebar') {
    return (
      <div className={cn('min-h-screen bg-bg text-content flex', className)}>
        {sidebar && <div className="hidden lg:flex sticky top-0 h-screen">{sidebar}</div>}
        <div className="flex-1 min-w-0 flex flex-col">
          {navbar}
          <main className={cn('flex-1', contentClassName)}>{children}</main>
          {footer}
        </div>
      </div>
    );
  }

  return (
    <div className={cn('min-h-screen bg-bg text-content flex flex-col', className)}>
      {navbar}
      <main className={cn('flex-1', contentClassName)}>{children}</main>
      {footer}
    </div>
  );
}
