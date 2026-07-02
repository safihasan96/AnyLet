---
title: Arch — Animation System
type: architecture
tags: [architecture, animation, framer-motion]
status: stable
last-scanned: 2026-06-28
related: [Arch-Styling-System]
---

# Animation System

AnyLet heavily utilizes `framer-motion` to create native-feeling transitions, prioritizing spring physics over linear easings.

## Core Setup
- **`App.jsx`**: Wrapped entirely in `<MotionConfig reducedMotion="user">` for accessibility.
- **Route Transitions**: `<AnimatePresence mode="wait">` wraps the React Router `<Routes>` component. 
- **`PageWrapper.jsx`**: Every page route is encapsulated in this HOC to handle standardized page mounting/unmounting transitions without repeating code.

## Reusable Variants (`src/utils/motionVariants.js`)
All common motion variants are extracted to a central utility file to keep components DRY.

- **`pageVariants`**: Handles the fade + slide up animation for `PageWrapper`.
- **`fadeVariants`**: Standard opacity fades.
- **`slideUpVariants`**: For lists, cards, and bottom-sheet drawers.
- **`staggerContainer`**: Applied to parent `div`s so children stagger naturally using `delayChildren` and `staggerChildren`.

## Best Practices Observed
- Heavy animations respect `useAnimationSafe.js` checks to disable CPU-intensive animations on lower-end devices or users preferring reduced motion.
- Micro-interactions (hover, tap) on buttons and cards use `{ scale: 0.95 }` tap physics.
