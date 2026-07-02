import crypto from 'crypto';
import { db } from './_lib/firebase-admin.js';
import { Timestamp } from 'firebase-admin/firestore';
import { withMiddleware } from './_lib/middleware.js';

// ── Guard: fail loudly at startup if the webhook secret is not configured ──
// Without this, an empty/weak string would match any request — completely
// opening the payment endpoint to forged confirmations.
const WEBHOOK_SECRET = process.env.SMS_WEBHOOK_SECRET;
if (!WEBHOOK_SECRET || WEBHOOK_SECRET.trim().length < 16) {
  throw new Error(
    '[sms-webhook] FATAL: SMS_WEBHOOK_SECRET env var is missing or too short (min 16 chars). ' +
    'Set it in your Vercel environment variables before deploying.'
  );
}

const ALLOWED_PROVIDERS = new Set(['bkash', 'nagad', 'rocket']);

// Sanity bounds: amounts outside this window are stored as 'suspicious' and
// will never be auto-claimed — they require admin review before processing.
// This does NOT reject the webhook call (always 200) so the SMS watcher app
// does not retry. It only affects the stored document's status.
const SANITY_MIN =      1; // ৳1  — no legit AnyLet fee is below this
const SANITY_MAX = 100000; // ৳1 lakh — no legit AnyLet transaction exceeds this

// Constant-time string comparison — prevents timing attacks on the secret key.
function safeCompare(a, b) {
  const left  = Buffer.from(String(a || ''), 'utf8');
  const right = Buffer.from(String(b || ''), 'utf8');
  const maxLen = Math.max(left.length, right.length);
  const paddedLeft  = Buffer.concat([left,  Buffer.alloc(maxLen - left.length)]);
  const paddedRight = Buffer.concat([right, Buffer.alloc(maxLen - right.length)]);
  return crypto.timingSafeEqual(paddedLeft, paddedRight) && left.length === right.length;
}

// Sanitize the TxnID to only alphanumeric, uppercase characters.
function sanitizeTransactionId(value) {
  return String(value || '').replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
}

// Parse a BDT amount from various formats ("1200", "1,200", "1200.00")
function parseAmount(value) {
  if (typeof value === 'number') return value;
  const cleaned = String(value || '').replace(/,/g, '').match(/\d+(\.\d+)?/);
  return cleaned ? Number(cleaned[0]) : NaN;
}

// Extract the three critical fields — transactionId, amount, provider — from
// whatever format the SMS watcher app sends. We do NOT trust any other fields.
function extractSmsPayload(body) {
  const text = String(body.smsText || body.message || body.text || '');

  const transactionId =
    body.transactionId ||
    body.txnId ||
    body.trxId ||
    text.match(/(?:trxid|txnid|transaction id|trx id)[:\s#-]*([a-zA-Z0-9]{6,20})/i)?.[1];

  const amount =
    body.amount ??
    text.match(/(?:tk|bdt|৳)\s*([0-9,]+(?:\.\d+)?)/i)?.[1] ??
    text.match(/([0-9,]+(?:\.\d+)?)\s*(?:tk|bdt|৳)/i)?.[1];

  const senderNumber = String(body.sender || body.number || body.from || 'Unknown').trim();

  return {
    transactionId: sanitizeTransactionId(transactionId),
    amount: parseAmount(amount),
    provider: String(body.provider || '').toLowerCase().trim(),
    senderNumber: senderNumber,
  };
}

function ok(res, reason) {
  // Always return 200 to the SMS watcher app so it doesn't retry.
  // Log the real reason internally.
  if (reason) console.warn('[sms-webhook] SMS received but not stored:', reason);
  return res.status(200).json({ received: true });
}

// ─────────────────────────────────────────────────────────────────────────────
// MAIN HANDLER
//
// This endpoint does ONE thing and ONE thing only:
//   1. Verify the webhook secret.
//   2. Extract transactionId, amount, provider.
//   3. Store them in `unclaimed_transactions/{transactionId}`.
//
// No business logic. No booking creation. No user lookup.
// All of that happens in /api/verify-payment when the user submits their TxnID.
// ─────────────────────────────────────────────────────────────────────────────
export default withMiddleware(async (req, res) => {
  // ── 1. Authenticate the webhook call ──────────────────────────────────────
  const authHeader = req.headers.authorization || '';
  if (!authHeader.startsWith('Bearer ') || !safeCompare(authHeader.slice(7), WEBHOOK_SECRET)) {
    return ok(res, 'invalid or missing webhook secret');
  }

  // ── 2. Extract exactly three fields ──────────────────────────────────────
  const source = req.method === 'GET' ? req.query : (req.body || {});
  const payload = extractSmsPayload(source);

  // ── 3. Validate the three fields ─────────────────────────────────────────
  if (!payload.transactionId || payload.transactionId.length < 6) {
    return ok(res, 'missing or invalid transactionId (must be ≥6 alphanumeric chars)');
  }
  if (!Number.isFinite(payload.amount) || payload.amount <= 0) {
    return ok(res, 'missing or invalid amount');
  }
  if (payload.provider && !ALLOWED_PROVIDERS.has(payload.provider)) {
    return ok(res, `unsupported provider: ${payload.provider}`);
  }

  // ── 4. Store atomically — idempotent write using TxnID as the document ID ─
  // Using the TxnID as the Firestore document ID guarantees that the same
  // transaction can never be inserted twice. A second write with the same ID
  // would be caught by the `create` rule (fails if document already exists).
  const txRef = db.collection('unclaimed_transactions').doc(payload.transactionId);

  try {
    await db.runTransaction(async (tx) => {
      const existing = await tx.get(txRef);
      if (existing.exists) {
        // Idempotent — silently ignore duplicate. This protects against the
        // SMS watcher retrying on a timeout.
        return;
      }
      tx.create(txRef, {
        transactionId:   payload.transactionId,
        amount:          payload.amount,
        provider:        payload.provider || null,
        senderNumber:    payload.senderNumber,
        // Sanity check: flag amounts outside expected range for admin review.
        // verify-payment.js will reject 'suspicious' transactions at claim time.
        status:          (payload.amount < SANITY_MIN || payload.amount > SANITY_MAX)
          ? 'suspicious'
          : 'unclaimed',
        suspiciousReason: (payload.amount < SANITY_MIN || payload.amount > SANITY_MAX)
          ? `Amount ৳${payload.amount} is outside expected range [৳${SANITY_MIN}, ৳${SANITY_MAX}]`
          : null,
        receivedAt:      Timestamp.now(),
      });
    });
  } catch (err) {
    console.error('[sms-webhook] Firestore write failed:', err);
    // Return 200 anyway so the watcher does not retry infinitely.
    // The console error will surface in Vercel logs.
    return res.status(200).json({ received: true, warning: 'storage_failed' });
  }

  console.info(`[sms-webhook] Stored unclaimed transaction: ${payload.transactionId} amount=${payload.amount} provider=${payload.provider}`);
  return res.status(200).json({ received: true });

}, {
  methods: ['GET', 'POST', 'PUT', 'PATCH'],
  requireAuth: false,
  requireAdmin: false,
  bodyLimit: '10kb',
});
