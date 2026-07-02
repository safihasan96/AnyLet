---
title: Feature — Admin Panel
type: feature
tags: [features, admin, moderation]
status: stable
last-scanned: 2026-06-28
related: [Arch-Auth-and-Security, Service-Firebase-Admin]
---

# Feature: Admin Panel

Restricted dashboard for platform moderation and operational overrides.

## Files Involved
- `src/pages/Admin.jsx`
- `src/components/AdminRoute.jsx`
- `api/set-admin-claim.js`
- `api/admin-review-kyc.js`

## Access Control
- Protected client-side by `<AdminRoute>`, which checks if the user's ID token contains the `role: 'admin'` custom claim.
- Provisioned via hitting the `/api/set-admin-claim.js` serverless function with a hardcoded developer secret.

## Capabilities
1. **Dashboard Overview**: System-wide metrics (Total Users, Escrow Volume, Pending KYC).
2. **KYC Moderation**: Review uploaded identity documents and approve/reject them. Triggers backend function to securely update user profile flags.
3. **Dispute Resolution**: Override escrow holds in case of landlord/tenant conflict (inferred).
4. **Content Moderation**: Review `reports` and unlist `properties`.
