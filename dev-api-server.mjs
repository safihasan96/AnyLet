/**
 * Local development API server
 * Mirrors the Vercel serverless functions so /api/* routes work with `npm run dev`.
 * This file is ONLY used in local development — never deployed to production.
 *
 * Security: All production security (auth, rate-limiting, body limits) is preserved
 * via the shared withMiddleware() wrapper in api/_lib/middleware.js.
 *
 * Env vars: loaded via `node --env-file=.env` in the npm dev script (no dotenv needed).
 */

import express from 'express';
import { createServer } from 'node:http';

// ── Import each API handler (same files Vercel uses in prod) ─────────────────
import adminClaimWebhookTransactionHandler from './api/admin-claim-webhook-transaction.js';
import adminHandler from './api/admin.js';
import approveWithdrawalHandler from './api/approve-withdrawal.js';
import cloudinarySignHandler from './api/cloudinary-sign.js';
import createPaymentIntentHandler from './api/create-payment-intent.js';
import cronRentRemindersHandler from './api/cron-rent-reminders.js';
import escrowHandler from './api/escrow.js';
import requestWithdrawalHandler from './api/request-withdrawal.js';
import smsWebhookHandler from './api/sms-webhook.js';
import verifyKycHandler from './api/verify-kyc.js';
import verifyPaymentHandler from './api/verify-payment.js';

const app = express();
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true, limit: '10kb' }));

/**
 * Adapts an express (req, res) pair to the simple Vercel-style req/res
 * the withMiddleware wrapper expects. This is a thin shim — no security
 * is bypassed; it just maps Express objects to the same interface.
 */
function vercelAdapter(handler) {
    return (req, res) => handler(req, res);
}

// ── Register routes ──────────────────────────────────────────────────────────
app.post('/api/admin-claim-webhook-transaction', vercelAdapter(adminClaimWebhookTransactionHandler));
app.all('/api/admin', vercelAdapter(adminHandler)); // admin.js uses GET/POST, so .all() is safe
app.post('/api/approve-withdrawal', vercelAdapter(approveWithdrawalHandler));
app.post('/api/cloudinary-sign', vercelAdapter(cloudinarySignHandler));
app.post('/api/create-payment-intent', vercelAdapter(createPaymentIntentHandler));
app.get('/api/cron-rent-reminders', vercelAdapter(cronRentRemindersHandler));
app.post('/api/escrow', vercelAdapter(escrowHandler));
app.post('/api/request-withdrawal', vercelAdapter(requestWithdrawalHandler));
app.post('/api/sms-webhook', vercelAdapter(smsWebhookHandler));
app.post('/api/verify-kyc', vercelAdapter(verifyKycHandler));
app.post('/api/verify-payment', vercelAdapter(verifyPaymentHandler));

// ── Start ────────────────────────────────────────────────────────────────────
const PORT = process.env.LOCAL_API_PORT || 3001;
createServer(app).listen(PORT, () => {
    console.log(`[dev-api] Local API server running on http://localhost:${PORT}`);
    console.log(`[dev-api] Vite proxy will forward /api/* requests here.`);
});
