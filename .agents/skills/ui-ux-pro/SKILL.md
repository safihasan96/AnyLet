---
name: UI/UX Pro
description: >
  Max-level UI/UX design guidance for building premium, accessible, and psychologically
  compelling interfaces. Activates for any design, layout, visual, interaction, or user
  experience task. Covers design systems, color, typography, spacing, motion, component
  patterns, accessibility, and mobile-first design engineering.
---

# UI/UX Pro Skill — Maximum Level

This skill transforms every design decision into a deliberate, premium experience. It combines
the discipline of a senior product designer with the precision of a front-end engineer. Every
rule below is non-negotiable when activated.

---

## 🎯 Core Design Philosophy

1. **Design for emotion first, function second.** A beautiful interface reduces cognitive friction and builds trust. Aesthetics ARE functionality.
2. **Hierarchy is everything.** Users never read — they scan. Every element must have a clear visual weight relative to its importance.
3. **Whitespace is not empty space.** Breathing room creates luxury. Never let elements feel crowded or cluttered.
4. **Consistency creates predictability.** Unpredictable interfaces cause anxiety. Every pattern must be reusable and systematic.
5. **Delight is in the details.** Micro-interactions, precise shadows, and perfect border radii separate good from unforgettable.

---

## 🎨 Color System

### Palette Construction Rules
- **Never use pure black (`#000`) or pure white (`#fff`) for text/backgrounds.** Always use near-blacks and off-whites (e.g., `#0F1117`, `#F8F9FA`) for warmth.
- **Primary color usage:** Reserve your brand primary for a maximum of 20% of any screen. It must pop against a neutral base.
- **Semantic color tokens:** Always define colors as semantic tokens, not raw hex values:
  - `--color-surface` / `--color-surface-raised` / `--color-surface-overlay`
  - `--color-text-primary` / `--color-text-secondary` / `--color-text-muted`
  - `--color-border` / `--color-border-subtle`
  - `--color-accent` / `--color-accent-soft` (10–15% opacity version)
- **Dark mode is not just inversion.** Dark surfaces use layered `hsl()` colors with increasing lightness: `hsl(240 12% 10%)` → `hsl(240 10% 14%)` → `hsl(240 8% 18%)`.
- **Glassmorphism:** Use `backdrop-filter: blur(12–20px)` with `background: rgba(255,255,255,0.06)` and `border: 1px solid rgba(255,255,255,0.1)` for floating elements. Never blur static backgrounds (GPU cost).

### Contrast Compliance
- Body text: minimum **4.5:1** contrast ratio (WCAG AA).
- Large headings: minimum **3:1** contrast ratio.
- Interactive elements (buttons, links): minimum **3:1** for focus states.

---

## 🔤 Typography System

### Font Hierarchy (React/Web)
- **Display (h1):** `clamp(2rem, 5vw, 3.5rem)` — `font-weight: 800–900` — tight `letter-spacing: -0.02em`
- **Heading (h2):** `clamp(1.5rem, 3.5vw, 2.25rem)` — `font-weight: 700–800`
- **Subheading (h3):** `1.25rem` — `font-weight: 600–700`
- **Body:** `1rem` (16px) — `font-weight: 400–500` — `line-height: 1.6–1.75`
- **Small/Caption:** `0.75–0.875rem` — `font-weight: 500–600` — `letter-spacing: 0.02em`
- **Labels/Tags:** `0.625–0.75rem` — `font-weight: 700–800` — `letter-spacing: 0.08–0.12em` — `text-transform: uppercase`

### Font Pairing Rules
- Use a **maximum of 2 typefaces** per project.
- Pair a geometric sans-serif (Inter, Outfit, Plus Jakarta Sans) with itself at different weights.
- Never mix serif and display fonts unless branding explicitly requires it.

### Recommended Google Fonts for Premium Feel
- **Inter** — system UI feel, extremely legible, great for data-heavy apps
- **Plus Jakarta Sans** — premium, slightly rounded, great for consumer apps
- **Outfit** — modern geometric, excellent for headings
- **DM Sans** — clean and approachable

---

## 📐 Spacing & Layout System

### 4px Base Grid
All spacing values must be multiples of 4px. Use an 8px base unit for most spacing.

```
4px  → micro gap (icon-text spacing, tag padding)
8px  → xs  (tight component padding)
12px → sm  (compact component padding)
16px → md  (standard padding, card inner spacing)
24px → lg  (section separation, card margin)
32px → xl  (major section gaps)
48px → 2xl (hero padding, large section margins)
64px → 3xl (page-level vertical rhythm)
```

### Card & Container Rules
- **Border radius scale:** `4px` (inputs) → `8px` (chips/badges) → `12px` (cards) → `16–20px` (modals, panels) → `9999px` (pills, avatars).
- **Shadow system (3 levels):**
  - `sm:` `0 1px 3px rgba(0,0,0,0.08)` — subtle lift
  - `md:` `0 4px 16px rgba(0,0,0,0.10)` — card elevation
  - `lg:` `0 12px 40px rgba(0,0,0,0.18)` — modal/floating panel
- **Never use box-shadow on dark backgrounds.** Use border `rgba(255,255,255,0.08)` instead for separation.

---

## 🖱️ Interaction Design & Micro-interactions

### The 5 Laws of Premium Micro-interactions
1. **Instant feedback** — every tap/click must respond within 100ms. Use optimistic UI.
2. **Spring physics over easing curves.** `spring(stiffness:300, damping:20)` feels alive. `ease-in-out` feels robotic.
3. **Scale interactions on the press axis** — buttons scale down on tap (`scale:0.97`), not just change color.
4. **Use exit animations** — elements that disappear should animate out, not vanish. Unmounting without animation feels broken.
5. **Animate the state change, not the element.** Transition between states (empty → filled, inactive → active) not just show/hide.

### Critical Hover States
- Buttons: subtle `translateY(-1px)` + shadow deepens on hover.
- Cards: `translateY(-4px)` + shadow from `md` to `lg` level on hover.
- Links: underline animates from left to right (not all at once).
- Icons: `scale(1.1)` with spring physics.

### Loading States
- **Skeleton screens** over spinners for content placeholders — match exact shape of content.
- **Shimmer effect** using CSS `@keyframes` background-position animation (not JS).
- Spinners only for actions (submitting forms, uploading files) — use brand color.

---

## ♿ Accessibility (A11y) — Non-negotiable

1. **All interactive elements must be keyboard navigable** — `Tab` order must be logical.
2. **Focus rings must be visible** — use `outline: 2px solid var(--color-accent)` with `outline-offset: 2px`. Never `outline: none` without a replacement.
3. **All images need `alt` text** — decorative images get `alt=""`.
4. **Touch targets minimum 44×44px** on mobile (Apple HIG & WCAG 2.5.5).
5. **ARIA roles** — use `role="dialog"` for modals, `aria-label` for icon-only buttons, `aria-live="polite"` for dynamic content.
6. **Respect `prefers-reduced-motion`** — wrap all Framer Motion animations with `useReducedMotion()` check and fallback to instant.
7. **Color is not the only indicator** — never use color alone to convey state (error, success). Always pair with icon or text.

---

## 📱 Mobile-First Design Rules

1. **Design for 375px width first**, then scale up. Never design desktop-first.
2. **Bottom navigation over top nav** on mobile — thumbs reach the bottom.
3. **Minimum 16px font size** for body text on mobile to prevent iOS auto-zoom on inputs.
4. **Sticky headers must be `position: sticky`**, not `fixed`, to avoid layout shift. Use `top: env(safe-area-inset-top)` for notch devices.
5. **Input fields** — always pair with visible labels (never rely on placeholder as label). Use `inputmode` attribute correctly:
   - `inputmode="numeric"` for number-only fields
   - `inputmode="email"` for email inputs
   - `inputmode="tel"` for phone numbers
6. **Gesture-friendly** — swipeable lists, pull-to-refresh, tap-to-dismiss modals. Never require precision clicking.
7. **iOS safe area** — always add `pb-[env(safe-area-inset-bottom)]` padding to bottom navigation bars.

---

## 🧩 Component Design Patterns

### Buttons
```
Primary   → solid brand color, white text, full shadow, 44px min height
Secondary → outlined (1.5px border), brand color text, no fill
Ghost     → no border, brand color text, subtle hover fill
Danger    → rose/red solid, only for destructive actions
Icon      → 40–44px square, rounded-xl, tooltip on hover
```

### Form Inputs
- Label always above the input, never inside (placeholder only as hint).
- Use `:focus-within` to highlight the full field group (label + input + hint).
- Error messages below the field, never as alerts or toasts.
- Use `user-valid` and `user-invalid` CSS pseudo-classes for inline validation.

### Modals & Sheets
- **Mobile:** Bottom sheet (slides up) — never centered modal on small screens.
- **Desktop:** Centered dialog with backdrop blur and `max-width: 560px`.
- Always trap focus inside open modals (`focus-trap`).
- Backdrop click closes the modal (except destructive confirmation dialogs).
- Animate in with `translateY(40px) → translateY(0)` + `opacity: 0 → 1`.

### Empty States
- Always include: illustration/icon + headline + body text + primary action.
- Never show a blank white box. Empty states are a chance to delight.

### Loading Skeletons
- Match the exact shape, height, and width of the content they represent.
- Use a subtle shimmer: `background: linear-gradient(90deg, #f0f0f0 25%, #e8e8e8 50%, #f0f0f0 75%)` animated via `background-size: 200% 100%`.

---

## 🏆 Premium Quality Checklist

Before any UI work is considered complete, verify:

- [ ] All interactive elements have hover, active, focus, and disabled states.
- [ ] Dark mode is fully implemented and tested.
- [ ] All text meets WCAG AA contrast ratios.
- [ ] No layout shifts on load (define width/height on images).
- [ ] Skeleton screens shown during all async data loading.
- [ ] Animations use only transform/opacity (no layout-triggering properties).
- [ ] Mobile tested at 375px, 390px, 414px viewport widths.
- [ ] Touch targets are all minimum 44×44px.
- [ ] No `outline: none` without a visible focus replacement.
- [ ] Typography uses a consistent, documented scale — no ad-hoc font sizes.
- [ ] Spacing follows the 4px/8px grid — no arbitrary pixel values.
- [ ] Error states are clearly designed for every form and async action.
- [ ] The page looks premium and intentional at first glance.

---

## 🚀 Trigger Phrases

Activate this skill when the user mentions any of:
- "design", "UI", "UX", "layout", "visual", "look and feel", "color", "typography"
- "spacing", "padding", "margin", "font", "icon", "button", "card", "modal"
- "mobile", "responsive", "accessible", "a11y", "contrast", "readable"
- "premium", "polished", "modern", "sleek", "professional", "beautiful"
- "component", "pattern", "design system", "style guide"
- "feels cheap", "looks bad", "improve the design", "make it better"
- "skeleton", "loading state", "empty state", "hover", "micro-interaction"
