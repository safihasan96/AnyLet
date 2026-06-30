import crypto from 'crypto';
import { db } from './_lib/firebase-admin.js';
import { Timestamp } from 'firebase-admin/firestore';
import { withMiddleware } from './_lib/middleware.js';

const BOOKING_TYPES = new Set(['booking', 'subscription', 'deposit', 'listing', 'verification']);
const DEPOSIT_SERVICE_FEE = 99;
const SUBSCRIPTION_MONTHLY_PRICE = 999;
const LISTING_FEE = 49;
const ONSITE_VERIFICATION_FEE = 299;
const STANDALONE_VERIFICATION_FEE = 199;
const INTENT_TTL_MS = 30 * 60 * 1000;

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
  // and could theoretically be predicted or seeded by an attacker.
  return `ANYLET-${crypto.randomBytes(4).toString('hex').toUpperCase()}`;
}

async function calculateExpectedAmount({ bookingType, propertyId, months, onsiteVerification, uid }) {
  if (!BOOKING_TYPES.has(bookingType)) {
    const allowed = Array.from(BOOKING_TYPES).join(', ');
    const error = new Error(`bookingType must be one of: ${allowed}`);
    error.statusCode = 400;
    throw error;
  }

  if (bookingType === 'subscription') {
    return {
      expectedAmount: SUBSCRIPTION_MONTHLY_PRICE * months,
      propertySnapshot: null,
    };
  }

  if (bookingType === 'listing') {
    return {
      expectedAmount: LISTING_FEE + (onsiteVerification ? ONSITE_VERIFICATION_FEE : 0),
      propertySnapshot: null,
    };
  }

  if (!propertyId || typeof propertyId !== 'string') {
    const error = new Error('propertyId is required for this payment type');
    error.statusCode = 400;
    throw error;
  }

  const propertyRef = db.collection('properties').doc(propertyId);
  const propertySnap = await propertyRef.get();

  if (!propertySnap.exists) {
    const error = new Error('Property not found');
    error.statusCode = 404;
    throw error;
  }

  const property = propertySnap.data();
  if (bookingType === 'verification' && (property.ownerId || property.userId) !== uid) {
    const error = new Error('Only the property owner can request verification');
    error.statusCode = 403;
    throw error;
  }
  const securityDeposit = Number(property.securityDeposit || 0);
  const rent = Number(property.rent || 0);

  if (bookingType === 'verification') {
    return {
      expectedAmount: STANDALONE_VERIFICATION_FEE,
      propertySnapshot: {
        id: propertyId,
        title: property.title || propertyNameFallback(propertyId),
        ownerId: property.ownerId || property.userId || null,
        rent,
        securityDeposit,
      },
    };
  }

  if (bookingType === 'deposit') {
    return {
      expectedAmount: Math.max(0, securityDeposit) + DEPOSIT_SERVICE_FEE,
      propertySnapshot: {
        id: propertyId,
        title: property.title || propertyNameFallback(propertyId),
        ownerId: property.ownerId || property.userId || null,
        rent,
        securityDeposit,
      },
    };
  }

  return {
    expectedAmount: Math.max(0, rent),
    propertySnapshot: {
      id: propertyId,
      title: property.title || propertyNameFallback(propertyId),
      ownerId: property.ownerId || property.userId || null,
      rent,
      securityDeposit,
    },
  };
}

function propertyNameFallback(propertyId) {
  return `Property ${propertyId.slice(0, 6)}`;
}

export default withMiddleware(async (req, res) => {
  const body = req.body || {};
  const rejected = rejectClientControlledFields(body);

  if (rejected.length > 0) {
    return res.status(400).json({ error: `Client-controlled fields rejected: ${rejected.join(', ')}` });
  }

  const propertyId = typeof body.propertyId === 'string' ? body.propertyId.trim() : null;
  const bookingType = typeof body.bookingType === 'string' ? body.bookingType.trim() : '';
  const months = positiveInteger(body.months, 1);
  const onsiteVerification = body.onsiteVerification === true;
  const uid = req.user.uid;

  try {
    const { expectedAmount, propertySnapshot } = await calculateExpectedAmount({
      bookingType,
      propertyId,
      months,
      onsiteVerification,
      uid,
    });

    if (!Number.isFinite(expectedAmount) || expectedAmount <= 0) {
      return res.status(400).json({ error: 'Unable to calculate a valid payment amount' });
    }

    const paymentIntentRef = db.collection('paymentIntents').doc();
    const now = Timestamp.now();
    const expiresAt = Timestamp.fromMillis(Date.now() + INTENT_TTL_MS);
    const referenceCode = buildReferenceCode();

    await paymentIntentRef.set({
      uid,
      propertyId: propertyId || null,
      expectedAmount,
      bookingType,
      months,
      onsiteVerification,
      status: 'pending',
      createdAt: now,
      expiresAt,
      used: false,
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
    const statusCode = error.statusCode || 500;
    if (statusCode >= 500) console.error('[create-payment-intent] Failed:', error);
    return res.status(statusCode).json({
      error: statusCode >= 500 ? 'Unable to create payment intent' : error.message,
    });
  }
}, {
  methods: ['POST'],
  requireAuth: true,
  requireAdmin: false,
  bodyLimit: '10kb',
});
