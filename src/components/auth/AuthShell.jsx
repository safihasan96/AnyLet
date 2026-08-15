import { Link, useNavigate } from 'react-router-dom';
import { cn } from '../../lib/cn';
import { IconButton, Icon } from '../ui';

/** Brand wordmark used across auth screens. */
export function BrandMark({ className }) {
  return (
    <Link to="/" className={cn('flex w-fit items-center gap-2.5 rounded-control focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring', className)}>
      <span className="grid size-9 place-items-center rounded-control bg-primary text-on-primary shadow-card">
        <Icon name="apartment" className="size-5" />
      </span>
      <span className="font-display text-title-md tracking-tight text-content">any<span className="italic text-primary">.let</span></span>
    </Link>
  );
}

/** Accessible inline alert for general/social auth errors (not field-specific). */
export function AuthAlert({ children, tone = 'danger' }) {
  if (!children) return null;
  const tones = {
    danger: 'bg-danger-subtle text-danger',
    warning: 'bg-warning-subtle text-warning',
    success: 'bg-success-subtle text-success',
  };
  return (
    <div role="alert" className={cn('mb-4 flex items-start gap-2.5 rounded-card p-3.5 text-body-sm', tones[tone] || tones.danger)}>
      <Icon name={tone === 'success' ? 'success' : tone === 'warning' ? 'warning' : 'error'} className="mt-0.5 size-4 shrink-0" />
      <span className="text-content">{children}</span>
    </div>
  );
}

/** "or" separator between social and email auth. */
export function AuthDivider({ label = 'or' }) {
  return (
    <div className="my-4 flex items-center gap-3">
      <span className="h-px flex-1 bg-border" />
      <span className="text-caption uppercase text-subtle">{label}</span>
      <span className="h-px flex-1 bg-border" />
    </div>
  );
}

/**
 * AuthShell — the two-column auth scaffold: a brand panel (desktop only) beside
 * a centered form column. Provides the back button, brand mark, and title.
 * Tokens only — adapts to light/dark automatically.
 */
export default function AuthShell({ title, subtitle, onBack, backTo = '/', children, footer }) {
  const navigate = useNavigate();
  const goBack = onBack || (() => navigate(backTo, { replace: true }));

  return (
    <div className="flex min-h-screen flex-col bg-bg lg:flex-row">
      {/* Brand panel — desktop */}
      <aside className="relative hidden flex-1 flex-col items-center justify-center overflow-hidden bg-gradient-to-br from-brand-700 to-brand-950 p-12 text-white lg:flex">
        <div aria-hidden className="absolute -right-24 -top-24 size-80 rounded-full bg-white/10 blur-3xl" />
        <div aria-hidden className="absolute -bottom-16 -left-16 size-64 rounded-full bg-white/5 blur-3xl" />
        <div className="relative z-10 max-w-sm text-center">
          <span className="mx-auto mb-8 grid size-20 place-items-center rounded-modal border border-white/20 bg-white/10"><Icon name="apartment" className="size-9" /></span>
          <h2 className="font-display text-display-lg tracking-tight">any<span className="italic text-brand-300">.let</span></h2>
          <p className="mx-auto mt-3 max-w-xs text-body-lg text-white/80">The smartest way to rent in Bangladesh. Verified landlords. Secure deals.</p>
          <div className="mt-10 flex items-center justify-center gap-3">
            {[['10k+', 'Listings'], ['BD', 'Nationwide'], ['100%', 'Verified']].map(([v, l]) => (
              <div key={l} className="flex flex-col items-center rounded-card border border-white/10 bg-white/10 px-5 py-3">
                <span className="font-display text-title-md text-white">{v}</span>
                <span className="text-caption uppercase text-white/70">{l}</span>
              </div>
            ))}
          </div>
        </div>
      </aside>

      {/* Form column */}
      <div className="flex w-full flex-col p-6 lg:w-[480px] lg:overflow-y-auto lg:p-12">
        <header className="mb-6">
          <IconButton label="Go back" variant="surface" onClick={goBack}><Icon name="back" /></IconButton>
        </header>
        <div className="mx-auto flex w-full max-w-sm flex-1 flex-col justify-center">
          <BrandMark className="mb-10" />
          <div className="mb-8">
            <h1 className="font-display text-display-md text-content">{title}</h1>
            {subtitle && <p className="mt-1.5 text-body-sm text-muted">{subtitle}</p>}
          </div>
          {children}
          {footer && <div className="mt-8 text-center text-body-sm text-muted">{footer}</div>}
        </div>
      </div>
    </div>
  );
}
