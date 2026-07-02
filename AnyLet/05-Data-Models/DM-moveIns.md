---
title: DM — Move Ins
type: data-model
tags: [data-models, firestore, moveIns, tenantMoveIns]
status: stable
last-scanned: 2026-06-28
related: [Feature-Payments, DM-escrowDeposits]
---

# `moveIns` and `tenantMoveIns` Collections

Tracks active and historical tenancies. 

## `moveIns` Fields (Inferred)
- `propertyId` (string)
- `tenantId` (string)
- `ownerId` (string)
- `status` (string) — `pending_confirmation`, `active`, `completed`, `cancelled`
- `moveInDate` (timestamp)
- `escrowDepositId` (string)
- `createdAt` (timestamp)

## `tenantMoveIns`
> [!caution] Inferred — verify
> This collection appears to be a denormalized projection of `moveIns`, optimized for tenant-side querying (e.g. `MyMoveIns.jsx`), or a legacy collection name. Security rules should be checked to see if writes to one trigger Cloud Functions to update the other.
