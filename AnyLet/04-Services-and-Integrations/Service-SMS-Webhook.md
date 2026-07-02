---
title: Service — SMS Webhook
type: service
tags: [services, payments, webhook, bkash]
status: stable
last-scanned: 2026-06-28
related: [Feature-Payments, DM-paymentIntents, DM-escrowDeposits]
---

# Service: SMS Webhook (bKash/Nagad/Rocket)

The core mechanism bridging offline mobile money payments in Bangladesh to the digital AnyLet ledger.

## File: `api/sms-webhook.js`

## Flow
1. AnyLet uses an Android phone running an SMS forwarding app (e.g. Tasker or a dedicated app) that receives texts from mobile banking providers (bKash, Nagad, Rocket).
2. The phone forwards the raw SMS payload via HTTP POST to `https://anylet.example.com/api/sms-webhook`.
3. The webhook uses Regex to extract:
   - `transactionId` (TrxID)
   - `amount` (BDT)
   - `senderNumber` (01XXXXXX)
   - `referenceCode` (e.g. `ANYLET-XXXXXX`)
4. It queries the `paymentIntents` collection looking for a matching pending intent by `referenceCode` or `transactionId`.
5. If found and the `amount` matches exactly (within 1 BDT tolerance), it commits the transaction:
   - Updates intent to `completed`.
   - Creates `escrowDeposits` document.
   - Calculates and creates `commissions` if the owner was referred.
   - Triggers `notifications`.

## Security Measures
- **`SMS_WEBHOOK_SECRET`**: Required environment variable. Requests without it are dropped to prevent forged payloads.
- **Timing Safe Equal**: Uses `crypto.timingSafeEqual` with padded buffers to prevent timing attacks when comparing secrets or transaction IDs.
