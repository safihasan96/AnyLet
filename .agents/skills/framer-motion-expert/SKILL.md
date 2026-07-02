---
name: Framer Motion Expert
description: Expert guidance on implementing beautiful, performant animations with Framer Motion in React applications.
---

# Framer Motion Expert

This skill provides specialized instructions for using `framer-motion` in React to create dynamic, buttery-smooth user interfaces.

> **Note on MCP**: Framer Motion is a React animation **library** that runs inside your app's JavaScript bundle — it is not a standalone server and therefore does not have an MCP server endpoint. This skill works by providing the AI agent with deep expert knowledge and rules to write correct, high-performance Framer Motion code.

## Core Expertise
- **AnimatePresence & Exit Animations**: Wrap conditional renders so components transition gracefully as they mount and unmount.
- **Layout Animations**: Use the `layout` prop for automatic FLIP animations and `layoutId` for shared element transitions.
- **Variants & Orchestration**: Organize complex, staggered animations across parents and children using the `variants` prop.
- **Gestures**: Handle interaction animations via `whileHover`, `whileTap`, and `whileDrag`.
- **Scroll & Position Effects**: Leverage `useScroll`, `useTransform`, and `useSpring` for parallax and dynamic scrolling.

## Strict Engineering Rules
1. **Zero inline animation objects in JSX.** All motion config must be decoupled into named `Variants` objects defined outside the component.
2. **Always prioritize transform properties** (`x`, `y`, `scale`, `opacity`) over layout properties (`width`, `height`, `margin`) to guarantee 60fps animations.
3. **Prepend `'use client'`** to every interactive file in Next.js (App Router).
4. **Use `transform-gpu` or `will-change-transform`** in Tailwind for GPU-accelerated moving elements.
5. **Proper AnimatePresence Usage**: Always provide a unique, stable `key` to direct children of `<AnimatePresence>` for `exit` animations to fire correctly.
6. **Accessibility**: Check `useReducedMotion()` and default to instant transitions when true.
7. **No heavy JS-driven mousemove loops on large elements** — use `whileHover` spring scales instead for performance.

## Trigger Phrase
Activate whenever the user asks for "animations", "transitions", "motion", or explicitly mentions "Framer Motion".
