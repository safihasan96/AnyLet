# ADR-003: Tailwind CSS v4 via Vite Plugin

### 1. The Problem (Context & constraints)
The traditional Tailwind CSS v3 setup relies heavily on PostCSS pipelines and a massive `tailwind.config.js` file to manage design tokens, colors, and breakpoints. As the AnyLet design system grew to include dynamic themes (dark mode), custom desktop breakpoint variables (`--spacing-desktop-gutter`), and premium UI tokens (glassmorphism), maintaining sync between the JS config file and the actual CSS files became cumbersome. Furthermore, PostCSS parsing added slight overhead to the Vite HMR (Hot Module Replacement) cycle.

### 2. The Decision (The exact technical implementation chosen)
We adopted the bleeding-edge Tailwind CSS v4, utilizing the `@tailwindcss/vite` plugin exclusively. We completely eliminated `tailwind.config.js` and `postcss.config.js`. The entire design system is now orchestrated natively in CSS using the `@theme` directive inside `src/index.css`. We map our UI tokens to raw CSS variables (e.g., `--color-primary`) and use the `@custom-variant dark` directive to handle dark mode toggling seamlessly across the DOM.

### 3. The Catch (The resulting engineering trade-offs, technical debt, or operational costs)
Tailwind v4 is a significant paradigm shift. It breaks compatibility with many older Tailwind v3 plugins and third-party UI component libraries (like older versions of Headless UI or Shadcn) that expect a `tailwind.config.js` file to exist for token extraction. Additionally, writing complex dynamic class concatenations in React becomes slightly riskier because the utility generator is aggressively optimized and might not catch dynamically constructed class names if they aren't explicitly statically analyzable in the JSX.
