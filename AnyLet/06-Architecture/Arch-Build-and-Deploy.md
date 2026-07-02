---
title: Arch — Build & Deploy
type: architecture
tags: [architecture, build, deploy, vercel, vite, capacitor]
status: stable
last-scanned: 2026-06-28
related: [Arch-Tech-Stack]
---

# Build & Deploy Architecture

## Vite Bundling Strategy (`vite.config.js`)
AnyLet heavily relies on code-splitting and lazy loading to minimize the initial Time-To-Interactive for mobile users in Bangladesh.

- **Manual Chunks Configured:**
  - `vendor-react`: React, React DOM, React Router
  - `vendor-motion`: Framer Motion
  - `vendor-firebase-app`, `-auth`, `-firestore`: Firebase split by SDK
  - `vendor-icons`: Lucide React
  - `vendor-leaflet`: Map libraries (extremely heavy)
- **Lazy Routes (`src/App.jsx`):**
  - Almost every page is wrapped in `lazy()` and `Suspense`. The map is isolated completely to prevent loading mapping libraries on the home page.

## Vercel Deployment (`vercel.json`)
- **API Routing:** `/api/(.*)` maps directly to `/api/$1`.
- **Client Routing:** All other paths (`/(.*)`) map to `/index.html` (SPA fallback).
- **Headers:** Includes basic caching headers for static assets.

## PWA Configuration
- `vite-plugin-pwa` is active.
- `manifest` in `vite.config.js` defines icons and `standalone` display.
- Caches assets via service worker (`sw.js`).

## Capacitor (Mobile App)
The web build (`dist/`) is synchronized directly into native shells.
- Android: `android/`
- iOS: `ios/`
- Commands: `npm run cap:sync`, `npm run cap:android`.
- `capacitor.config.json` points the web directory to `dist`.
