---
title: DM — Viewing Requests
type: data-model
tags: [data-models, firestore, viewing_requests]
status: stable
last-scanned: 2026-06-28
related: [Feature-Property-Detail, DM-requests]
---

# `viewing_requests` Collection

Records generated when a prospective tenant requests to view a property or expresses interest.

## Fields (Inferred)
- `propertyId` (string)
- `tenantId` (string)
- `ownerId` (string)
- `status` (string) — `pending`, `accepted`, `rejected`, `completed`
- `message` (string) — Optional note from tenant.
- `requestedDate` (string/timestamp)
- `createdAt` (timestamp)
- `updatedAt` (timestamp)

> [!caution] Inferred — verify
> It is highly likely the `requests` collection is a legacy alias for `viewing_requests` or vice versa. The codebase contains references to both. Look for deprecated usage in older components.
