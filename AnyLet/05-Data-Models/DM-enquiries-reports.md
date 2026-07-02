---
title: DM — Enquiries and Reports
type: data-model
tags: [data-models, firestore, enquiries, reports]
status: stable
last-scanned: 2026-06-28
related: [Feature-Property-Detail]
---

# `enquiries` and `reports` Collections

Collections for user-generated support and moderation tickets.

## `enquiries` Fields (Inferred)
- `userId` (string)
- `type` (string) — e.g. `general`, `billing`, `technical`.
- `message` (string)
- `status` (string) — `open`, `closed`.
- `createdAt` (timestamp)

## `reports` Fields (Inferred)
- `reporterId` (string)
- `propertyId` (string) — Or `ownerId`, depending on target.
- `reason` (string) — e.g. `scam`, `inaccurate`, `inappropriate`.
- `description` (string)
- `status` (string) — `pending_review`, `action_taken`, `dismissed`.
- `createdAt` (timestamp)
