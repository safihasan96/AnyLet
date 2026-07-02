---
title: AnyLet Knowledge Base — Home
type: architecture
tags: [home, moc, index]
status: stable
last-scanned: 2026-06-28
related: []
---

# AnyLet Knowledge Base

> Rental platform for Bangladesh. React 19 SPA + Firebase + Vercel serverless + Capacitor mobile wrapper.

## Quick Navigation

| Category | MOC |
|----------|-----|
| Pages & Routes | [[MOC-Pages]] |
| Components | [[MOC-Components]] |
| Features (end-to-end) | [[MOC-Features]] |
| Architecture & Build | [[MOC-Architecture]] |
| Services & Integrations | [[MOC-Services]] |
| Data Models (Firestore) | [[MOC-Data-Models]] |
| Agent Skills | [[MOC-Agent-Skills]] |
| Known Issues / Tech Debt | [[08-Known-Issues-and-Tech-Debt/Known-Issues-Index]] |

## Stack (verified against `package.json`)

- **Frontend:** React 19.2, React Router 7, Framer Motion 12, Tailwind CSS v4
- **Icons:** lucide-react 0.575
- **Maps:** Leaflet 1.9 + react-leaflet 5 + react-leaflet-cluster
- **Backend:** Firebase 12 (client SDK), Firebase Admin 14 (server-side only)
- **Hosting:** Vercel (web + serverless functions)
- **Mobile:** Capacitor 8 (Android + iOS)
- **Build:** Vite 7 + vite-plugin-pwa 1.2
- **Styling:** Tailwind v4 via `@tailwindcss/vite` plugin — no config file, all tokens in `src/index.css`

## Firestore Collections (ground truth — grep verified)

`commissions` · `conversations` · `enquiries` · `escrowDeposits` · `kycSubmissions` · `moveIns` · `notifications` · `ownerReviews` · `paymentIntents` · `payments` · `properties` · `propertyReviews` · `reports` · `requests` · `tenantMoveIns` · `users` · `viewing_requests`

## Key File Locations

| Thing | Path |
|-------|------|
| Router root | `src/App.jsx` |
| Theme tokens | `src/index.css` (`@theme {}` block) |
| Firebase init | `src/firebase.js` (inferred — not found at scan, imported as `../firebase`) |
| Auth context | `src/contexts/AuthContext.jsx` |
| Vite config | `vite.config.js` |
| Vercel config | `vercel.json` |
| Capacitor config | `capacitor.config.json` |
| SMS webhook | `api/sms-webhook.js` |

## Security Note

> [!caution]
> `package.json` line 64 contains a hardcoded GitHub PAT token in the `repository.url` field. Rotate immediately.
