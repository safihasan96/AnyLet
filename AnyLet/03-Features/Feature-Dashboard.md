---
title: Feature — Dashboard & Profile
type: feature
tags: [features, dashboard, profile]
status: stable
last-scanned: 2026-06-28
related: [DM-users, Arch-Auth-and-Security]
---

# Feature: Dashboard & Profile

The central hub for logged-in users to manage their account, view stats, and access settings.

## Files Involved
- `src/pages/Account.jsx` (Primary Hub)
- `src/pages/EditProfile.jsx`
- `src/pages/Settings.jsx`
- `src/pages/MyListings.jsx`, `MyMoveIns.jsx`, `MyBookings.jsx`

## Unified Interface
AnyLet does not have separate dashboard portals for tenants and owners. Instead, the UI dynamically displays sections based on the user's current context (`userRole` toggle state in `users` document) and their active data (e.g. if they have listings, the "Owner" stats card appears).

## Key Components
- **Stats Card**: Aggregates data based on role (Active Tenants, Total Earnings, Pending Escrows).
- **Quick Links**: Grids of action buttons to jump to sub-pages (My Listings, My Payments, Inbox).
- **Referral Widget**: Prompts users to share their code.
