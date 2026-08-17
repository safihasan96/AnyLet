/**
 * tokens.js — JS-side design tokens.
 *
 * CSS owns colors/type/radius/shadow (see index.css). This file exposes the
 * values JS needs: z-index (for portals), motion springs, and durations.
 * Spring presets follow Apple's model (WWDC "Designing Fluid Interfaces"):
 * critically-damped by default (bounce 0), with overshoot reserved ONLY for
 * gesture/momentum-driven motion. Framer Motion's { bounce, duration } maps
 * closely to Apple's { damping, response }.
 */

// ── Z-index — must mirror the --z-* custom properties in index.css ──────────
export const Z = {
  base: 0,
  raised: 10,
  sticky: 100,
  nav: 1000,
  drawer: 2000,
  modal: 3000,
  toast: 4000,
  tooltip: 5000,
};

// ── Durations (seconds) ─────────────────────────────────────────────────────
export const DURATION = {
  fast: 0.12,
  base: 0.18,
  slow: 0.24,
  slower: 0.32,
};

// ── Easing (mirror of --ease-* in index.css), for JS-driven tween animations ─
export const EASE = {
  standard: [0.2, 0, 0, 1],
  out: [0.16, 1, 0.3, 1],
  inOut: [0.65, 0, 0.35, 1],
};

// ── Springs ─────────────────────────────────────────────────────────────────
// Default UI motion: no overshoot. Use for menus, dialogs, fades, layout.
export const SPRING = { type: 'spring', bounce: 0, duration: 0.4 };
// Snappier default for small, frequent transitions (indicators, chips).
export const SPRING_SNAPPY = { type: 'spring', bounce: 0, duration: 0.3 };
// Momentum: a little bounce — ONLY after a flick/drag release (Apple rule).
export const SPRING_MOMENTUM = { type: 'spring', bounce: 0.2, duration: 0.45 };
// Sheets/drawers — responsive with the faintest settle.
export const SPRING_SHEET = { type: 'spring', bounce: 0.12, duration: 0.4 };

// ── Reusable enter/exit transitions honoring reduced motion at call sites ────
export const fade = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  exit: { opacity: 0 },
  transition: { duration: DURATION.base, ease: EASE.standard },
};

export default { Z, DURATION, EASE, SPRING, SPRING_SNAPPY, SPRING_MOMENTUM, SPRING_SHEET, fade };
