/**
 * commissionService.js — DEPRECATED
 *
 * ⚠️  This file is INTENTIONALLY LEFT EMPTY.
 *
 * All commission and withdrawal logic has been moved to the secure backend:
 *
 *   • Commission crediting → api/sms-webhook.js (atomically inside the payment transaction)
 *   • Withdrawal requests  → api/request-withdrawal.js (server-side, authenticated)
 *
 * Allowing financial writes from the client was a critical security vulnerability:
 *   1. Firestore rules correctly block writes to 'commissions' and 'withdrawals' from clients.
 *   2. The client-side wallet increment was subject to race conditions and manipulation.
 *
 * DO NOT re-add client-side Firestore writes to financial collections.
 */

export {}; // empty module — keeps any stale imports from crashing
