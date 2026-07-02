---
title: Arch — Folder Structure
type: architecture
tags: [architecture, structure]
status: stable
last-scanned: 2026-06-28
related: [Arch-Tech-Stack]
---

# Folder Structure

## Repo Level
- `api/` — Vercel Serverless functions (Node.js backend)
- `android/` / `ios/` — Capacitor native app projects
- `graphify-out/` — Output artifacts for the knowledge graph agent
- `.agents/` — Agent skills, workflows, and prompts
- `src/` — React frontend application

## Frontend (`src/`)
- `assets/` — Images, svgs, lottie files
- `components/` — Shared reusable components
  - `layout/` — High-level wrappers (`PageWrapper`)
  - `listings/` — Property specific UI components
  - `map/` — Leaflet related maps and markers
  - `ui/` — Generic base UI elements
- `config/` — Hardcoded lists, constants, categories (e.g. Bangladesh divisions)
- `contexts/` — Global React state (`AuthContext`, `ThemeContext`, `ToastContext`, `LanguageContext`)
- `data/` — Static stub data (if any)
- `hooks/` — Custom React hooks (e.g. `useMediaQuery`)
- `lib/` — Third-party library wrappers (e.g., `motion.js`)
- `pages/` — The route-level container components (42+ files)
- `scripts/` — Client-side utility scripts
- `utils/` — Pure logic functions, helpers, formatters (`logger.js`, `referral.js`, `safeQuery.js`)
