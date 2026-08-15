import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { cn } from '../../lib/cn';
import { Z } from '../../lib/tokens';
import Container from './Container';

/**
 * Navbar — translucent, sticky top app bar (Apple materials: content scrolls
 * underneath). A scroll-edge effect fades in the divider + elevation only once
 * the page is scrolled, instead of a permanent hard border.
 *
 * Slots: `start` (brand), `children` (center nav), `end` (actions).
 */
export default function Navbar({ start, end, children, containerSize = 'wide', elevateOnScroll = true, className }) {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    if (!elevateOnScroll) return;
    const onScroll = () => setScrolled(window.scrollY > 4);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, [elevateOnScroll]);

  return (
    <header
      style={{ zIndex: Z.nav }}
      className={cn(
        'sticky top-0 surface-blur transition-shadow duration-200',
        scrolled ? 'border-b border-border shadow-card' : 'border-b border-transparent',
        className
      )}
    >
      <Container size={containerSize}>
        <div className="flex h-16 items-center justify-between gap-4">
          {start && <div className="flex items-center gap-3 shrink-0">{start}</div>}
          {children && <nav className="hidden md:flex items-center gap-1 flex-1 justify-center">{children}</nav>}
          {end && <div className="flex items-center gap-2 shrink-0">{end}</div>}
        </div>
      </Container>
    </header>
  );
}

/** NavLink — a top-nav item with an active state. Pass `active` yourself
 *  (e.g. from useLocation) or `to` for routing. */
export function NavLink({ to, active, children, className, ...props }) {
  const Comp = to ? Link : 'button';
  return (
    <Comp
      to={to}
      aria-current={active ? 'page' : undefined}
      className={cn(
        'relative px-3.5 py-2 rounded-control text-body-sm font-medium transition-colors',
        'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring',
        active ? 'text-primary' : 'text-muted hover:text-content hover:bg-surface-sunken',
        className
      )}
      {...props}
    >
      {children}
    </Comp>
  );
}
