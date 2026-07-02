---
title: Service — Firebase Admin
type: service
tags: [services, firebase-admin, backend]
status: stable
last-scanned: 2026-06-28
related: [Service-Firebase, Service-SMS-Webhook]
---

# Service: Firebase Admin SDK

Used exclusively in the Vercel Node.js Serverless Functions (`/api/*`).

## Configuration
- Initialized in `api/_lib/firebase-admin.js`.
- Uses a Service Account credentials JSON string, likely passed in via Vercel Environment Variables (`FIREBASE_SERVICE_ACCOUNT`).

## Responsibilities
- **Bypassing Security Rules**: Escrow payments, Webhook execution, and Commission payouts cannot be done client-side because they require writing to protected collections (`escrowDeposits`, `payments`, `commissions`). The Admin SDK writes these directly as a privileged caller.
- **Custom Claims**: Assigning the `role: 'admin'` claim to moderator accounts.
- **Data Integrity**: Enforcing constraints (like rejecting an SMS payment if the amount doesn't match the intent exactly) securely on the backend.
