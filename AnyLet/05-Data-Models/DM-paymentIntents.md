---
title: DM — Payment Intents
type: data-model
tags: [data-models, firestore, paymentIntents, escrow]
status: stable
last-scanned: 2026-06-28
related: [Feature-Payments, Service-SMS-Webhook]
---

# `paymentIntents` Collection

Temporary records tracking initiated but unconfirmed escrow deposits. Forms the bridge between the UI initiating a payment and the backend webhook confirming it via SMS.

## Fields (Inferred)
- `referenceCode` (string) — Short alphanumeric code (e.g. `ANYLET-XXXXXX`) shown to user.
- `tenantId` (string)
- `ownerId` (string)
- `propertyId` (string)
- `amount` (number)
- `status` (string) — `pending`, `completed`, `expired`, `failed`
- `provider` (string) — `bkash`, `nagad`, `rocket`
- `transactionId` (string) — The expected TrxID from the user.
- `createdAt` (timestamp)
- `expiresAt` (timestamp)

## Flow
1. UI creates intent → `status: pending`.
2. User sends SMS with `referenceCode` or `transactionId` to AnyLet phone number.
3. `/api/sms-webhook.js` parses SMS, finds matching `paymentIntents` document.
4. Webhook updates status to `completed`, creates corresponding `escrowDeposits` and `payments` records.
