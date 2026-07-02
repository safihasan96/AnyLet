import crypto from 'crypto';
import { db } from './_lib/firebase-admin.js';
import { Timestamp } from 'firebase-admin/firestore';
import { withMiddleware } from './_lib/middleware.js';
// ─── Single Source of Truth for fee calculation ────────────────────────────
// ⚠️  Do NOT add fee constants here. All amounts come from feeCalculator.js.
import { computeExpectedAmount } from './_lib/feeCalculator.js';

const BOOKING_TYPES  = new Set(['booking', 'subscription', 'deposit', 'listing', 'verification']);
const INTENT_TTL_MS  = 30 * 60 * 1000; // 30-minute window to complete payment

function rejectClientControlledFields(body) {
  const blocked = ['amount', 'expectedAmount', 'status', 'used', 'verifiedAt', 'verifiedBy'];
  return blocked.filter((field) => Object.prototype.hasOwnProperty.call(body, field));
}

function positiveInteger(value, fallback = 1) {
  const parsed = Number(value ?? fallback);
  if (!Number.isInteger(parsed) || parsed < 1 || parsed > 12) return fallback;
  return parsed;
}

function buildReferenceCode() {
  // crypto.randomBytes is cryptographically secure — Math.random() is NOT
  return `ANYLET-${crypto.randomBytes(4).toString('hex').toUpperCase()}`;
}

function propertyNameFallback(propertyId) {
  return `Property ${propertyId.slice(0, 6)}`;
}

export default withMiddleware(async (req, res) => {
  const body = req.body || {};

  // ── 1. Reject forbidden client-controlled fields ──────────────────────────
  const rejected = rejectClientControlledFields(body);
  if (rejected.length > 0) {
    return res.status(400).json({ error: `Client-controlled fields rejected: ${rejected.join(', ')}` });
  }

  const propertyId         = typeof body.propertyId === 'string' ? body.propertyId.trim() : null;
  const bookingType        = typeof body.bookingType === 'string' ? body.bookingType.trim() : '';
  const months             = positiveInteger(body.months, 1);
  const onsiteVerification = body.onsiteVerification === true;
  const uid                = req.user.uid;

  // ── 2. Compute expected amount server-side (via shared feeCalculator) ──────
  // DISPLAY ONLY values in the frontend are never used here.
  let expectedAmount, propertySnapshot;
  try {
    ({ expectedAmount, propertySnapshot } = await computeExpectedAmount({
      bookingType,
      propertyId,
      months,
      onsiteVerification,
      uid,
    }));
  } catch (error) {
    const statusCode = error.statusCode || 400;
    if (statusCode >= 500) console.error('[create-payment-intent] Fee computation failed:', error);
    return res.status(statusCode).json({ error: error.message });
  }

  if (!Number.isFinite(expectedAmount) || expectedAmount <= 0) {
    return res.status(400).json({ error: 'Unable to calculate a valid payment amount' });
  }

  // ── 3. Store the payment intent in Firestore ──────────────────────────────
  try {
    const paymentIntentRef = db.collection('paymentIntents').doc();
    const now              = Timestamp.now();
    const expiresAt        = Timestamp.fromMillis(Date.now() + INTENT_TTL_MS);
    const referenceCode    = buildReferenceCode();

    await paymentIntentRef.set({
      uid,
      propertyId:         propertyId || null,
      expectedAmount,
      bookingType,
      months,
      onsiteVerification,
      status:             'pending',
      createdAt:          now,
      expiresAt,
      used:               false,
      referenceCode,
      propertySnapshot,
    });

    return res.status(201).json({
      paymentIntentId: paymentIntentRef.id,
      expectedAmount,
      referenceCode,
      expiresAt: expiresAt.toDate().toISOString(),
    });
  } catch (error) {
    console.error('[create-payment-intent] Firestore write failed:', error);
    return res.status(500).json({ error: 'Unable to create payment intent' });
  }
}, {
  methods:      ['POST'],
  requireAuth:  true,
  requireAdmin: false,
  bodyLimit:    '10kb',
});
