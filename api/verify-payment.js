import { db, admin } from './_lib/firebase-admin.js';
import { Timestamp, FieldValue } from 'firebase-admin/firestore';
import { withMiddleware } from './_lib/middleware.js';

// ─── Server-side price list — client CANNOT influence these ──────────────────
const BOOKING_TYPES     = new Set(['booking', 'subscription', 'deposit', 'listing', 'verification']);
const LISTING_FEE                = 49;
const ONSITE_VERIFICATION_FEE   = 299;
const STANDALONE_VERIFICATION_FEE = 199;
const SUBSCRIPTION_MONTHLY_PRICE = 999;
const DEPOSIT_SERVICE_FEE        = 99;
const AMOUNT_TOLERANCE           = 1;   // ±1 BDT rounding tolerance
const COMMISSION_RATE            = 0.02; // 2% referral commission

// ─── Rejects any fields the client should never be allowed to set ─────────────
function rejectClientControlledFields(body) {
  const blocked = ['amount', 'expectedAmount', 'status', 'verified', 'verifiedAt', 'verifiedBy'];
  return blocked.filter((f) => Object.prototype.hasOwnProperty.call(body, f));
}

function positiveInteger(value, fallback = 1) {
  const n = Number(value ?? fallback);
  if (!Number.isInteger(n) || n < 1 || n > 12) return fallback;
  return n;
}

// ─── Compute the required payment amount fully server-side ────────────────────
async function computeExpectedAmount({ bookingType, propertyId, months, onsiteVerification, uid }) {
  if (!BOOKING_TYPES.has(bookingType)) {
    const err = new Error(`bookingType must be one of: ${[...BOOKING_TYPES].join(', ')}`);
    err.statusCode = 400;
    throw err;
  }

  if (bookingType === 'subscription') {
    return { expectedAmount: SUBSCRIPTION_MONTHLY_PRICE * months, propertySnapshot: null };
  }

  if (bookingType === 'listing') {
    return {
      expectedAmount: LISTING_FEE + (onsiteVerification ? ONSITE_VERIFICATION_FEE : 0),
      propertySnapshot: null,
    };
  }

  if (!propertyId || typeof propertyId !== 'string') {
    const err = new Error('propertyId is required for this payment type');
    err.statusCode = 400;
    throw err;
  }

  const snap = await db.collection('properties').doc(propertyId).get();
  if (!snap.exists) {
    const err = new Error('Property not found');
    err.statusCode = 404;
    throw err;
  }

  const property = snap.data();

  if (bookingType === 'verification' && (property.ownerId || property.userId) !== uid) {
    const err = new Error('Only the property owner can request verification');
    err.statusCode = 403;
    throw err;
  }

  const securityDeposit = Number(property.securityDeposit || 0);
  const rent            = Number(property.rent || 0);
  const snapshot = {
    id: propertyId,
    title: property.title || `Property ${propertyId.slice(0, 6)}`,
    ownerId: property.ownerId || property.userId || null,
    rent,
    securityDeposit,
  };

  if (bookingType === 'verification') {
    return { expectedAmount: STANDALONE_VERIFICATION_FEE, propertySnapshot: snapshot };
  }
  if (bookingType === 'deposit') {
    return { expectedAmount: Math.max(0, securityDeposit) + DEPOSIT_SERVICE_FEE, propertySnapshot: snapshot };
  }
  // booking
  return { expectedAmount: Math.max(0, rent), propertySnapshot: snapshot };
}

// ─── Apply business logic inside an ACID Firestore transaction ────────────────
// This runs AFTER the TxnID has been verified as genuine.
async function applyBusinessLogic(tx, {
  unclaimedRef, txData, uid, bookingType, propertyId, months, onsiteVerification,
  expectedAmount, propertySnapshot,
}) {
  const now = Timestamp.now();

  // Mark the unclaimed transaction as claimed — prevents replay attacks.
  tx.update(unclaimedRef, {
    status: 'claimed',
    claimedBy: uid,
    claimedAt: now,
    bookingType,
  });

  // Write a permanent payment record.
  const paymentRef = db.collection('payments').doc();
  tx.set(paymentRef, {
    uid,
    transactionId: txData.transactionId,
    amount: txData.amount,
    provider: txData.provider || null,
    expectedAmount,
    bookingType,
    propertyId: propertyId || null,
    months: months || null,
    onsiteVerification: onsiteVerification || false,
    status: 'completed',
    verifiedAt: now,
    verifiedBy: 'manual-trxid',
  });

  // ── Booking-type-specific logic ───────────────────────────────────────────
  if (bookingType === 'subscription') {
    const expiry = new Date();
    expiry.setMonth(expiry.getMonth() + Number(months || 1));
    tx.update(db.collection('users').doc(uid), {
      subscriptionTier: 'Premium',
      subscriptionPlan: 'Premium',
      subscriptionExpiry: Timestamp.fromDate(expiry),
      subscriptionActiveUntil: Timestamp.fromDate(expiry),
      updatedAt: now,
    });

  } else if (bookingType === 'listing') {
    // Grant a listing entitlement — the listing itself still needs admin approval.
    tx.update(db.collection('users').doc(uid), {
      listingEntitlement: FieldValue.increment(1),
      updatedAt: now,
    });
    // If a propertyId was provided, mark it as payment-verified & pending admin review.
    if (propertyId) {
      tx.update(db.collection('properties').doc(propertyId), {
        paymentVerified: true,
        paymentId: paymentRef.id,
        status: 'Pending',   // ← Admin must approve before it goes live.
        updatedAt: now,
      });
    }

  } else if (bookingType === 'verification') {
    if (propertyId) {
      tx.update(db.collection('properties').doc(propertyId), {
        verificationPaymentId: paymentRef.id,
        verificationStatus: 'pending',
        onsiteVerificationRequested: true,
        updatedAt: now,
      });
    }

  } else if (['booking', 'deposit'].includes(bookingType)) {
    const ownerId = propertySnapshot?.ownerId || null;
    const propertyTitle = propertySnapshot?.title || `Property ${(propertyId || '').slice(0, 6)}`;

    const bookingRef = db.collection('bookings').doc();
    tx.set(bookingRef, {
      paymentId: paymentRef.id,
      tenantId: uid,
      ownerId,
      propertyId,
      propertyName: propertyTitle,
      bookingType,
      amount: txData.amount,
      status: 'confirmed',
      createdAt: now,
      paymentVerified: true,
      paymentVerifiedAt: now,
    });

    if (bookingType === 'deposit') {
      const escrowRef = db.collection('escrowDeposits').doc();
      tx.set(escrowRef, {
        bookingId: bookingRef.id,
        paymentId: paymentRef.id,
        tenantId: uid,
        ownerId,
        propertyId,
        propertyName: propertyTitle,
        amount: txData.amount,
        depositAmount: propertySnapshot?.securityDeposit ?? 0,
        status: 'held',
        provider: txData.provider || null,
        createdAt: now,
        verifiedAt: now,
        confirmedByTenant: false,
        confirmedByOwner: false,
        releaseRequested: false,
      });
      if (propertyId) {
        tx.update(db.collection('properties').doc(propertyId), {
          status: 'Booked',
          updatedAt: now,
        });
      }
    }
  }

  // ── Referral Commission ───────────────────────────────────────────────────
  const payerSnap = await tx.get(db.collection('users').doc(uid));
  if (payerSnap.exists) {
    const referrerId = payerSnap.data().referredBy ?? null;
    if (referrerId) {
      const commissionAmount = parseFloat((txData.amount * COMMISSION_RATE).toFixed(2));
      const referrerRef = db.collection('users').doc(referrerId);
      const referrerSnap = await tx.get(referrerRef);
      if (referrerSnap.exists) {
        const wallet = referrerSnap.data().referralWallet ?? { available: 0 };
        tx.update(referrerRef, {
          'referralWallet.available': (wallet.available ?? 0) + commissionAmount,
        });
        const commissionRef = db.collection('commissions').doc();
        tx.set(commissionRef, {
          referrerId,
          refereeId: uid,
          paymentId: paymentRef.id,
          transactionId: txData.transactionId,
          amount: commissionAmount,
          baseAmount: txData.amount,
          rate: COMMISSION_RATE,
          bookingType,
          description: `2% commission on ${bookingType} payment`,
          status: 'credited',
          createdAt: now,
          creditedBy: 'verify-payment',
        });
      }
    }
  }

  return paymentRef.id;
}

// ─────────────────────────────────────────────────────────────────────────────
// MAIN HANDLER
//
// Flow:
//   1. Validate and authenticate the request (JWT via middleware).
//   2. Reject any client-controlled fields.
//   3. Compute the expected price on the server.
//   4. Look up the unclaimed transaction by TxnID.
//   5. Inside a Firestore ACID transaction:
//      a. Verify the document exists and is still 'unclaimed'.
//      b. Verify the amount matches (within tolerance).
//      c. Atomically claim it and apply all business logic.
// ─────────────────────────────────────────────────────────────────────────────
export default withMiddleware(async (req, res) => {
  const body = req.body || {};

  // ── 1. Reject forbidden client-controlled fields ──────────────────────────
  const rejected = rejectClientControlledFields(body);
  if (rejected.length > 0) {
    return res.status(400).json({ error: `Rejected fields: ${rejected.join(', ')}` });
  }

  // ── 2. Extract and validate inputs ────────────────────────────────────────
  const transactionId   = typeof body.transactionId === 'string'
    ? body.transactionId.replace(/[^a-zA-Z0-9]/g, '').toUpperCase()
    : '';
  const bookingType     = typeof body.bookingType === 'string' ? body.bookingType.trim() : '';
  const propertyId      = typeof body.propertyId === 'string' ? body.propertyId.trim() : null;
  const months          = positiveInteger(body.months, 1);
  const onsiteVerification = body.onsiteVerification === true;
  const uid             = req.user.uid;

  if (!transactionId || transactionId.length < 6) {
    return res.status(400).json({ error: 'transactionId must be at least 6 alphanumeric characters.' });
  }

  // ── 3. Compute required price server-side — client cannot fake this ────────
  let expectedAmount, propertySnapshot;
  try {
    ({ expectedAmount, propertySnapshot } = await computeExpectedAmount({
      bookingType, propertyId, months, onsiteVerification, uid,
    }));
  } catch (err) {
    return res.status(err.statusCode || 400).json({ error: err.message });
  }

  // ── 4. ACID Transaction — find, verify, and claim the unclaimed TxnID ─────
  const unclaimedRef = db.collection('unclaimed_transactions').doc(transactionId);

  try {
    let paymentId;

    await db.runTransaction(async (tx) => {
      const unclaimedSnap = await tx.get(unclaimedRef);

      if (!unclaimedSnap.exists) {
        const err = new Error('Transaction ID not found. Make sure your SMS watcher is running and the payment has been received.');
        err.statusCode = 404;
        throw err;
      }

      const txData = unclaimedSnap.data();

      if (txData.status !== 'unclaimed') {
        const err = new Error('This Transaction ID has already been used for a payment.');
        err.statusCode = 409;
        throw err;
      }

      if (Math.abs(txData.amount - expectedAmount) > AMOUNT_TOLERANCE) {
        const err = new Error(
          `Amount mismatch. Expected ৳${expectedAmount.toLocaleString()} but transaction shows ৳${txData.amount.toLocaleString()}.`
        );
        err.statusCode = 422;
        throw err;
      }

      paymentId = await applyBusinessLogic(tx, {
        unclaimedRef, txData, uid, bookingType, propertyId, months, onsiteVerification,
        expectedAmount, propertySnapshot,
      });
    });

    // ── 5. Return the confirmed invoice to the frontend ───────────────────────
    return res.status(200).json({
      success: true,
      paymentId,
      transactionId,
      amount: expectedAmount,
      bookingType,
      propertyId: propertyId || null,
      verifiedAt: new Date().toISOString(),
      message: bookingType === 'listing'
        ? 'Payment verified. Your listing is now pending admin approval.'
        : 'Payment verified successfully.',
    });

  } catch (err) {
    const statusCode = err.statusCode || 500;
    if (statusCode >= 500) {
      console.error('[verify-payment] Unhandled error:', err);
    }
    return res.status(statusCode).json({
      success: false,
      error: statusCode >= 500 ? 'Internal server error. Please contact support.' : err.message,
    });
  }

}, {
  methods: ['POST'],
  requireAuth: true,      // User MUST be logged in — no anonymous verification
  requireAdmin: false,
  bodyLimit: '10kb',
});
