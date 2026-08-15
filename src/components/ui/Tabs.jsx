import { createContext, useContext, useId, useRef } from 'react';
import { motion } from 'framer-motion';
import { cn } from '../../lib/cn';

/**
 * Tabs — accessible tablist with an animated active indicator.
 * Controlled (`value` + `onChange`). Arrow keys move between tabs (roving focus).
 * variant: underline | pill.
 *
 *   <Tabs value={tab} onChange={setTab}>
 *     <TabList aria-label="Sections">
 *       <Tab value="overview">Overview</Tab>
 *       <Tab value="reviews">Reviews</Tab>
 *     </TabList>
 *     <TabPanel value="overview">…</TabPanel>
 *   </Tabs>
 */
const TabsContext = createContext(null);

export function Tabs({ value, onChange, variant = 'underline', children, className }) {
  const layoutId = useId();
  return (
    <TabsContext.Provider value={{ value, onChange, layoutId, variant }}>
      <div className={className}>{children}</div>
    </TabsContext.Provider>
  );
}

export function TabList({ children, className, 'aria-label': ariaLabel }) {
  const { variant } = useContext(TabsContext);
  const ref = useRef(null);

  const onKeyDown = (e) => {
    if (!['ArrowRight', 'ArrowLeft', 'Home', 'End'].includes(e.key)) return;
    const tabs = Array.from(ref.current?.querySelectorAll('[role="tab"]:not([disabled])') || []);
    const idx = tabs.indexOf(document.activeElement);
    if (idx === -1) return;
    e.preventDefault();
    let next = idx;
    if (e.key === 'ArrowRight') next = (idx + 1) % tabs.length;
    else if (e.key === 'ArrowLeft') next = (idx - 1 + tabs.length) % tabs.length;
    else if (e.key === 'Home') next = 0;
    else if (e.key === 'End') next = tabs.length - 1;
    tabs[next]?.focus();
    tabs[next]?.click();
  };

  return (
    <div
      ref={ref}
      role="tablist"
      aria-label={ariaLabel}
      onKeyDown={onKeyDown}
      className={cn(
        variant === 'pill'
          ? 'inline-flex items-center gap-1 p-1 rounded-control bg-surface-sunken'
          : 'flex items-center gap-1 border-b border-border',
        className
      )}
    >
      {children}
    </div>
  );
}

export function Tab({ value, children, disabled, className }) {
  const { value: selectedValue, onChange, layoutId, variant } = useContext(TabsContext);
  const selected = selectedValue === value;
  const isPill = variant === 'pill';

  return (
    <button
      type="button"
      role="tab"
      aria-selected={selected}
      tabIndex={selected ? 0 : -1}
      disabled={disabled}
      onClick={() => onChange?.(value)}
      className={cn(
        'relative inline-flex items-center justify-center gap-2 text-body-sm font-medium whitespace-nowrap transition-colors rounded-control',
        'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring disabled:opacity-50',
        isPill ? 'px-4 py-2 z-10' : 'px-3.5 py-2.5',
        selected ? (isPill ? 'text-content' : 'text-primary') : 'text-muted hover:text-content',
        className
      )}
    >
      {isPill && selected && (
        <motion.span
          layoutId={`${layoutId}-indicator`}
          className="absolute inset-0 -z-10 rounded-[calc(var(--radius-control)-0.25rem)] bg-surface shadow-card"
          transition={{ type: 'spring', bounce: 0, duration: 0.3 }}
        />
      )}
      <span className="relative">{children}</span>
      {!isPill && selected && (
        <motion.span
          layoutId={`${layoutId}-indicator`}
          className="absolute -bottom-px left-2 right-2 h-0.5 rounded-full bg-primary"
          transition={{ type: 'spring', bounce: 0, duration: 0.3 }}
        />
      )}
    </button>
  );
}

export function TabPanel({ value, children, className }) {
  const { value: selectedValue } = useContext(TabsContext);
  if (selectedValue !== value) return null;
  return (
    <div role="tabpanel" tabIndex={0} className={cn('focus-visible:outline-none', className)}>
      {children}
    </div>
  );
}

export default Tabs;
