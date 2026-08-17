import {
  createContext, useContext, useState, useRef, useEffect, useCallback, cloneElement, isValidElement,
} from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { cn } from '../../lib/cn';
import { Z } from '../../lib/tokens';

/**
 * Dropdown — a menu anchored to its trigger. Opens from the trigger's edge
 * (transform-origin), closes on outside-click / Esc / select, and returns focus
 * to the trigger. Arrow keys, Home/End, Enter/Space navigate items (role=menu).
 *
 *   <Dropdown trigger={<IconButton label="Options"><MoreVertical/></IconButton>} align="end">
 *     <DropdownLabel>Account</DropdownLabel>
 *     <DropdownItem icon={<User/>} onSelect={goProfile}>Profile</DropdownItem>
 *     <DropdownSeparator/>
 *     <DropdownItem tone="danger" icon={<LogOut/>} onSelect={logout}>Log out</DropdownItem>
 *   </Dropdown>
 */
const DropdownContext = createContext(null);

export default function Dropdown({ trigger, children, align = 'start', className, menuClassName }) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef(null);
  const triggerRef = useRef(null);
  const menuRef = useRef(null);
  const reduce = useReducedMotion();

  const close = useCallback((returnFocus = true) => {
    setOpen(false);
    // triggerRef wraps the trigger; focus the actual control inside it.
    if (returnFocus) triggerRef.current?.querySelector('button, a, [role="button"]')?.focus?.();
  }, []);

  useEffect(() => {
    if (!open) return;
    const onDocClick = (e) => {
      if (rootRef.current && !rootRef.current.contains(e.target)) setOpen(false);
    };
    const onKey = (e) => {
      if (e.key === 'Escape') { e.stopPropagation(); close(); }
    };
    document.addEventListener('mousedown', onDocClick);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDocClick);
      document.removeEventListener('keydown', onKey);
    };
  }, [open, close]);

  // Focus first item when the menu opens.
  useEffect(() => {
    if (open && menuRef.current) {
      const first = menuRef.current.querySelector('[role="menuitem"]:not([disabled])');
      first?.focus();
    }
  }, [open]);

  const onMenuKeyDown = (e) => {
    const items = Array.from(menuRef.current?.querySelectorAll('[role="menuitem"]:not([disabled])') || []);
    if (!items.length) return;
    const idx = items.indexOf(document.activeElement);
    if (e.key === 'ArrowDown') { e.preventDefault(); items[(idx + 1) % items.length].focus(); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); items[(idx - 1 + items.length) % items.length].focus(); }
    else if (e.key === 'Home') { e.preventDefault(); items[0].focus(); }
    else if (e.key === 'End') { e.preventDefault(); items[items.length - 1].focus(); }
  };

  const triggerEl = isValidElement(trigger)
    ? cloneElement(trigger, {
        onClick: (e) => { trigger.props.onClick?.(e); setOpen((o) => !o); },
        'aria-haspopup': 'menu',
        'aria-expanded': open,
      })
    : trigger;

  return (
    <DropdownContext.Provider value={{ close }}>
      <div ref={rootRef} className={cn('relative inline-block', className)}>
        {/* Wrapper carries the ref (contents = layout-transparent) so we never
            pass a ref into the trigger element during render. */}
        <span ref={triggerRef} className="contents">{triggerEl}</span>
        <AnimatePresence>
          {open && (
            <motion.div
              ref={menuRef}
              role="menu"
              onKeyDown={onMenuKeyDown}
              initial={reduce ? { opacity: 0 } : { opacity: 0, scale: 0.95, y: -4 }}
              animate={reduce ? { opacity: 1 } : { opacity: 1, scale: 1, y: 0 }}
              exit={reduce ? { opacity: 0 } : { opacity: 0, scale: 0.97, y: -4 }}
              transition={{ type: 'spring', bounce: 0, duration: 0.2 }}
              style={{ zIndex: Z.nav, transformOrigin: align === 'end' ? 'top right' : 'top left' }}
              className={cn(
                'absolute mt-2 min-w-[12rem] p-1.5 rounded-card bg-surface-raised border border-border shadow-overlay',
                align === 'end' ? 'right-0' : 'left-0',
                menuClassName
              )}
            >
              {children}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </DropdownContext.Provider>
  );
}

export function DropdownItem({ icon, children, trailing, onSelect, tone = 'default', disabled, className, ...props }) {
  const { close } = useContext(DropdownContext);
  return (
    <button
      type="button"
      role="menuitem"
      disabled={disabled}
      onClick={(e) => { onSelect?.(e); close(false); }}
      className={cn(
        'w-full flex items-center gap-3 px-3 py-2 rounded-control text-body-sm font-medium text-left transition-colors',
        'focus-visible:outline-none focus:bg-surface-sunken disabled:opacity-50 disabled:pointer-events-none',
        tone === 'danger' ? 'text-danger hover:bg-danger-subtle focus:bg-danger-subtle' : 'text-content hover:bg-surface-sunken',
        className
      )}
      {...props}
    >
      {icon && <span className="shrink-0 [&>svg]:size-[1.15rem]" aria-hidden="true">{icon}</span>}
      <span className="flex-1 truncate">{children}</span>
      {trailing && <span className="shrink-0">{trailing}</span>}
    </button>
  );
}

export function DropdownLabel({ children, className }) {
  return <div className={cn('px-3 pt-2 pb-1 text-overline uppercase text-subtle', className)}>{children}</div>;
}

export function DropdownSeparator({ className }) {
  return <div role="separator" className={cn('my-1.5 h-px bg-border mx-1', className)} />;
}
