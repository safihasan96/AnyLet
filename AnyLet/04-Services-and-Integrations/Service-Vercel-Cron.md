---
title: Service — Vercel Cron
type: service
tags: [services, cron, vercel, backend]
status: stable
last-scanned: 2026-06-28
related: [DM-moveIns, DM-notifications]
---

# Service: Vercel Cron

Handles automated recurring tasks.

## Configuration
- Defined in `vercel.json` under the `"crons"` key (inferred configuration pattern for Vercel).
- Targets `/api/cron-rent-reminders.js`.

## Rent Reminders (`cron-rent-reminders.js`)
- **Execution**: Triggered automatically by Vercel on a set schedule (e.g., daily at midnight).
- **Responsibility**: Scans the `moveIns` (or `tenantMoveIns`) collection for active tenancies where the next rent due date is approaching (e.g. within 3 days).
- **Action**: Injects a reminder into the `notifications` collection for the tenant and/or triggers an email via a transactional provider if configured.
