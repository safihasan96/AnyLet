---
title: DM — Escrow Deposits
type: data-model
tags: [data-models, firestore, escrowDeposits]
status: stable
last-scanned: 2026-06-28
related: [DM-paymentIntents, DM-moveIns]
---

# `escrowDeposits` Collection

Long-lived records of funds securely held in escrow between a tenant and an owner.

## Fields (Inferred)
- `tenantId` (string)
- `ownerId` (string)
- `propertyId` (string)
- `amount` (number)
- `status` (string) — `held`, `released`, `refunded`, `disputed`
- `paymentIntentId` (string) — Reference back to the original intent.
- `transactionId` (string) — Verified provider TrxID.
- `createdAt` (timestamp)
- `releasedAt` (timestamp) — Null until release.

## Lifecycle
1. Created via Webhook when payment intent succeeds.
2. Status remains `held` until move-in is confirmed.
3. Upon mutual confirmation (or via Admin intervention), funds are transferred to the owner's withdrawable balance and status becomes `released`.
