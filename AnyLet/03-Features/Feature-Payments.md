---
title: Feature — Payments & Escrow
type: feature
tags: [features, payments, escrow, bkash]
status: stable
last-scanned: 2026-06-28
related: [DM-paymentIntents, DM-escrowDeposits, Service-SMS-Webhook]
---

# Feature: Payments & Escrow

The core financial engine of AnyLet. Allows tenants to deposit booking amounts into an escrow system via mobile money providers (bKash, Nagad, Rocket).

## Files Involved
- `src/components/PaymentModal.jsx`
- `src/components/BookPropertyModal.jsx`
- `api/create-payment-intent.js`
- `api/sms-webhook.js`
- `api/request-withdrawal.js`
- `src/pages/MyPayments.jsx`

## Collections Touched
- `paymentIntents`
- `escrowDeposits`
- `payments`
- `commissions`

## The Booking Flow

```mermaid
flowchart TD
    A[Tenant clicks Book Now] --> B[BookPropertyModal]
    B --> C[Selects dates & confirms amount]
    C --> D[PaymentModal opens]
    
    D --> E[API: create-payment-intent]
    E --> F[Generate 'ANYLET-XXXX' code]
    F --> G[Tenant sends mobile money to AnyLet]
    G --> H[Tenant inputs expected TrxID]
    
    I[SMS Webhook receives carrier SMS] --> J[Matches TrxID or Reference Code]
    J -->|Match Found| K[Update PaymentIntent to 'completed']
    K --> L[Create EscrowDeposit status 'held']
    K --> M[Pay 2% Referral Commission if applicable]
```

## Security & Edge Cases
- **No Direct Transfers**: Tenants never send money directly to owners. All funds route through the AnyLet escrow system.
- **Timing Attacks**: The `sms-webhook.js` uses `crypto.timingSafeEqual` with padded buffers to prevent attackers from guessing valid transaction IDs via response times.
- **Provider Validation**: Strictly validates that the parsed amount in the SMS matches the expected escrow amount (with a small 1 BDT tolerance for edge cases).
