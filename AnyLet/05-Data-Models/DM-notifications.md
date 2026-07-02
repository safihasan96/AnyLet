---
title: DM — Notifications
type: data-model
tags: [data-models, firestore, notifications]
status: stable
last-scanned: 2026-06-28
related: [Feature-Notifications]
---

# `notifications` Collection

In-app notifications feed for users.

## Fields (Inferred)
- `userId` (string) — The recipient.
- `title` (string)
- `body` (string)
- `type` (string) — e.g. `payment_received`, `viewing_requested`, `booking_confirmed`.
- `link` (string) — Internal route to navigate to (e.g. `/my-bookings`).
- `read` (boolean) — Defaults to `false`.
- `createdAt` (timestamp)

## Flow
Generated server-side (via Webhook, Cron) or via Firestore triggers when state changes occur (e.g. a `viewing_request` changes from `pending` to `accepted`).
