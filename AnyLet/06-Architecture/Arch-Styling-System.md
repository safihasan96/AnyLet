---
title: Arch — Styling System
type: architecture
tags: [architecture, tailwind, css]
status: stable
last-scanned: 2026-06-28
related: [Arch-Animation-System]
---

# Styling System

## Tailwind CSS v4
AnyLet uses the new Tailwind CSS v4 paradigm. **There is no `tailwind.config.js`.**

Instead, all configuration is handled via CSS variables and `@theme` directives in `src/index.css`.

### Theme Tokens (`src/index.css`)
- **Primary Colors:** `--color-primary` (`#1a227f`), `--color-primary-dark`, `--color-primary-light`
- **Backgrounds:** Light (`#F8F9FA`), Dark (`#0F1117`)
- **Fonts:** 
  - Sans: `Inter`, `Outfit`
  - Display: `Outfit`, `Inter`
- **Desktop Breakpoint Tokens:** `--spacing-desktop-gutter`, `--spacing-sidebar-w`, `--spacing-content`, `--spacing-content-xl`
- **Dark Mode Strategy:** Uses `.dark` class toggling via the `ThemeContext.jsx`. The `@custom-variant dark (&:is(.dark *));` directive is used to enable `dark:` utility classes.

## Glassmorphism
The platform makes heavy use of a premium glassmorphism aesthetic.
- Utility `.glass-panel` in `src/index.css` provides `backdrop-filter: blur(16px)` and subtle borders, adapting for both light and dark themes.

## The "Golden Rule" of Responsiveness
The codebase adheres strictly to a mobile-first approach. 
- Mobile classes (unprefixed) must **never** be touched. 
- Desktop responsiveness is achieved strictly through appending `md:`, `lg:`, and `xl:` prefixed classes to scale layouts out (e.g. 2-column dashboard splits on desktop).
