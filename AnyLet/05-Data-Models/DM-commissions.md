---
title: DM — Commissions
type: data-model
tags: [data-models, firestore, commissions, referrals]
status: stable
last-scanned: 2026-06-28
related: [Feature-Referral, DM-users]
---

# `commissions` Collection

Records of referral commissions earned by users who referred property owners to the platform.

## Fields (Inferred)
- `referrerId` (string) — The user who gets paid.
- `refereeId` (string) — The owner who was referred.
- `propertyId` (string) — The listing that generated the booking.
- `escrowDepositId` (string) — The specific booking transaction.
- `amount` (number) — Calculated as 2% (`COMMISSION_RATE` in SMS webhook) of the deposit.
- `status` (string) — `pending`, `paid`.
- `createdAt` (timestamp)

## Flow
Generated automatically inside the `sms-webhook.js` transaction block if the owner of the booked property has a `referredBy` field in their `users` document.
