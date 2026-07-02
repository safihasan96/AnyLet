---
title: DM — Payments
type: data-model
tags: [data-models, firestore, payments]
status: stable
last-scanned: 2026-06-28
related: [Feature-Payments, DM-paymentIntents, DM-escrowDeposits]
---

# `payments` Collection

Ledger of completed financial transactions on the platform (both deposits and withdrawals).

## Fields (Inferred)
- `userId` (string) — User who made or received the payment.
- `type` (string) — e.g. `deposit`, `withdrawal`, `commission_payout`.
- `amount` (number)
- `currency` (string) — Usually `BDT`.
- `provider` (string) — `bkash`, `nagad`, `rocket`.
- `transactionId` (string) — Provider's TrxID.
- `status` (string) — `completed`, `refunded`.
- `relatedId` (string) — Link to `escrowDeposits` or `paymentIntents`.
- `createdAt` (timestamp)

## Flow
- Written primarily by `/api/sms-webhook.js` or `/api/request-withdrawal.js`.
- Rendered in the UI via `MyPayments.jsx`.
