---
title: Feature — Referral System
type: feature
tags: [features, referrals, commissions]
status: stable
last-scanned: 2026-06-28
related: [DM-commissions, DM-users]
---

# Feature: Referral System

Incentivizes platform growth by paying commissions to users who refer active property owners.

## Files Involved
- `src/pages/ReferralDashboard.jsx`
- `src/utils/referral.js`
- `api/sms-webhook.js`

## Collections Touched
- `users` (updates `referralWallet`)
- `commissions`

## Mechanics
- **Code Generation**: New users generate a unique 6-character referral code on signup (`src/utils/referral.js`).
- **Linking**: When User B signs up using User A's code (e.g. via Google login lookup or manual entry), User B's `referredBy` field is set to User A's UID. User A gets User B pushed to their `refereeIds`.
- **Payout**: When a tenant pays an escrow deposit for User B's property, `sms-webhook.js` detects the `referredBy` field on the owner. It automatically credits 2% (`COMMISSION_RATE`) of the deposit amount to User A's `referralWallet.available` and logs a record in `commissions`.
- **Withdrawal**: User A requests payout via `ReferralDashboard.jsx`.
