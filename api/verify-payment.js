import { db } from './_lib/firebase-admin.js';
import { Timestamp, FieldValue } from 'firebase-admin/firestore';
import { withMiddleware } from './_lib/middleware.js';
// ─── Single Source of Truth for fee calculation ────────────────────────────
// ⚠️  Do NOT add fee constants here. All amounts come from feeCalculator.js.
import { computeExpectedAmount, getPlatformFees } from './_lib/feeCalculator.js';

// ─── Amount tolerance tiers ───────────────────────────────────────────────
// AMOUNT_TOLERANCE  : diff ≤ this → auto-approve (absorbs BDT rounding)
// REVIEW_THRESHOLD  : diff ≤ this → flag for manual admin review (near-miss)
// diff > REVIEW_THRESHOLD → hard reject (amount is too far off to be legitimate)
const AMOUNT_TOLERANCE  = 1;   // ±1 BDT
const REVIEW_THRESHOLD  = 50;  // ±50 BDT

// ─── Rejects any fields the client should never be allowed to set ──────────
function rejectClientControlledFields(body) {
  const blocked = ['amount', 'expectedAmount', 'status', 'verified', 'verifiedAt', 'verifiedBy'];
  return blocked.filter((f) => Object.prototype.hasOwnProperty.call(body, f));
}

function positiveInteger(value, fallback = 1) {
  const n = Number(value ?? fallback);
  if (!Number.isInteger(n) || n < 1 || n > 12) return fallback;
  return n;
}

// ─── Apply business logic inside an ACID Firestore transaction ────────────
// This runs AFTER the TxnID has been verified as genuine.
async function applyBusinessLogic(tx, {
  unclaimedRef, txData, uid, bookingType, propertyId, months, onsiteVerification,
  expectedAmount, propertySnapshot, commissionRate
}) {
  const now = Timestamp.now();

  // ── PRE-FETCH ALL READS BEFORE ANY WRITES ─────────────────────────────────
  // Firestore ACID rules require all reads to happen before any writes in a transaction.
  const payerRef  = db.collection('users').doc(uid);
  const payerSnap = await tx.get(payerRef);
  let referrerSnap = null;
  let referrerRef  = null;

  if (payerSnap.exists) {
    const referrerId = payerSnap.data().referredBy ?? null;
    if (referrerId) {
      referrerRef  = db.collection('users').doc(referrerId);
      referrerSnap = await tx.get(referrerRef);
    }
  }
  // ──────────────────────────────────────────────────────────────────────────

  // Mark the unclaimed transaction as claimed — prevents replay attacks.
  tx.update(unclaimedRef, {
    status:    'claimed',
    claimedBy: uid,
    claimedAt: now,
    bookingType,
  });

  // Write a permanent payment record.
  const paymentRef = db.collection('payments').doc();
  tx.set(paymentRef, {
    uid,
    transactionId:     txData.transactionId,
    amount:            txData.amount,
    provider:          txData.provider || null,
    expectedAmount,
    bookingType,
    propertyId:        propertyId || null,
    months:            months || null,
    onsiteVerification: onsiteVerification || false,
    status:            'completed',
    verifiedAt:        now,
    verifiedBy:        'manual-trxid',
  });

  // ── Booking-type-specific logic ───────────────────────────────────────────
  if (bookingType === 'subscription') {
    const expiry = new Date();
    expiry.setMonth(expiry.getMonth() + Number(months || 1));
    tx.update(db.collection('users').doc(uid), {
      subscriptionTier:        'Premium',
      subscriptionPlan:        'Premium',
      subscriptionExpiry:      Timestamp.fromDate(expiry),
      subscriptionActiveUntil: Timestamp.fromDate(expiry),
      updatedAt:               now,
    });

  } else if (bookingType === 'listing') {
    tx.update(db.collection('users').doc(uid), {
      listingEntitlement: FieldValue.increment(1),
      updatedAt:          now,
    });
    if (propertyId) {
      tx.update(db.collection('properties').doc(propertyId), {
        paymentVerified: true,
        paymentId:       paymentRef.id,
        status:          'Pending', // ← Admin must approve before it goes live.
        updatedAt:       now,
      });
    }

  } else if (bookingType === 'verification') {
    if (propertyId) {
      tx.update(db.collection('properties').doc(propertyId), {
        verificationPaymentId:      paymentRef.id,
        verificationStatus:         'pending',
        onsiteVerificationRequested: true,
        updatedAt:                  now,
      });
    }

  } else if (['booking', 'deposit'].includes(bookingType)) {
    const ownerId       = propertySnapshot?.ownerId || null;
    const propertyTitle = propertySnapshot?.title || `Property ${(propertyId || '').slice(0, 6)}`;

    const bookingRef = db.collection('bookings').doc();
    tx.set(bookingRef, {
      paymentId:        paymentRef.id,
      tenantId:         uid,
      ownerId,
      propertyId,
      propertyName:     propertyTitle,
      bookingType,
      amount:           txData.amount,
      status:           'confirmed',
      createdAt:        now,
      paymentVerified:  true,
      paymentVerifiedAt: now,
    });

    if (bookingType === 'deposit') {
      const escrowRef = db.collection('escrowDeposits').doc();
      tx.set(escrowRef, {
        bookingId:         bookingRef.id,
        paymentId:         paymentRef.id,
        tenantId:          uid,
        ownerId,
        propertyId,
        propertyName:      propertyTitle,
        amount:            txData.amount,
        depositAmount:     propertySnapshot?.securityDeposit ?? 0,
        status:            'held',
        provider:          txData.provider || null,
        createdAt:         now,
        verifiedAt:        now,
        confirmedByTenant: false,
        confirmedByOwner:  false,
        releaseRequested:  false,
      });
      if (propertyId) {
        tx.update(db.collection('properties').doc(propertyId), {
          status:    'Booked',
          updatedAt: now,
        });
      }
    }
  }

  // ── Referral Commission ───────────────────────────────────────────────────
  if (payerSnap.exists) {
    const referrerId = payerSnap.data().referredBy ?? null;
    if (referrerId && referrerSnap && referrerSnap.exists) {
      // Uses pre-fetched commission rate to avoid async transaction violations
      const actualCommissionRate = Number(commissionRate) || 0.02;
      const commissionAmount = parseFloat((txData.amount * actualCommissionRate).toFixed(2));

      const wallet = referrerSnap.data().referralWallet ?? { available: 0 };
      tx.update(referrerRef, {
        'referralWallet.available': (wallet.available ?? 0) + commissionAmount,
      });
      const commissionRef = db.collection('commissions').doc();
      tx.set(commissionRef, {
        referrerId,
        refereeId:     uid,
        paymentId:     paymentRef.id,
        transactionId: txData.transactionId,
        amount:        commissionAmount,
        baseAmount:    txData.amount,
        rate:          commissionRate,
        bookingType,
        description:   `Commission on ${bookingType} payment`,
        status:        'credited',
        createdAt:     now,
        creditedBy:    'verify-payment',
      });
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
//   3. Compute the expected price on the server (via feeCalculator.js).
//   4. Look up the unclaimed transaction by TxnID.
//   5. Inside a Firestore ACID transaction:
//      a. Verify the document exists and is still 'unclaimed'.
//      b. Verify the provider matches.
//      c. Apply tiered amount check:
//         • diff ≤ AMOUNT_TOLERANCE  → auto-approve (normal path)
//         • diff ≤ REVIEW_THRESHOLD  → flag for admin review (202 response)
//         • diff >  REVIEW_THRESHOLD → hard reject (422)
//      d. Atomically claim it and apply all business logic.
// ─────────────────────────────────────────────────────────────────────────────
export default withMiddleware(async (req, res) => {
  const body = req.body || {};

  // ── 1. Reject forbidden client-controlled fields ──────────────────────────
  const rejected = rejectClientControlledFields(body);
  if (rejected.length > 0) {
    return res.status(400).json({ error: `Rejected fields: ${rejected.join(', ')}` });
  }

  // ── 2. Extract and validate inputs ────────────────────────────────────────
  const transactionId = typeof body.transactionId === 'string'
    ? body.transactionId.replace(/[^a-zA-Z0-9]/g, '').toUpperCase()
    : '';
  const bookingType        = typeof body.bookingType === 'string' ? body.bookingType.trim() : '';
  const propertyId         = typeof body.propertyId === 'string' ? body.propertyId.trim() : null;
  const months             = positiveInteger(body.months, 1);
  const onsiteVerification = body.onsiteVerification === true;
  const uid                = req.user.uid;

  // Provider validation — user must declare which MFS they used.
  // The server will reject if it doesn't match what the SMS webhook recorded.
  const ALLOWED_PROVIDERS = new Set(['bkash', 'nagad', 'rocket']);
  const provider = typeof body.provider === 'string'
    ? body.provider.toLowerCase().trim()
    : '';
  if (!provider || !ALLOWED_PROVIDERS.has(provider)) {
    return res.status(400).json({ error: 'provider must be one of: bkash, nagad, rocket.' });
  }

  if (!transactionId || transactionId.length < 6) {
    return res.status(400).json({ error: 'transactionId must be at least 6 alphanumeric characters.' });
  }

  // ── 3. Compute required price server-side — client cannot fake this ────────
  // Calls feeCalculator.js (Single Source of Truth). No local fee constants.
  let expectedAmount, propertySnapshot, feesData;
  try {
    ({ expectedAmount, propertySnapshot, fees } = await computeExpectedAmount({
      bookingType, propertyId, months, onsiteVerification, uid,
    }));
    feesData = fees;
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

      // ── Replay attack guard — already claimed or held ──────────────────────
      if (txData.status === 'claimed') {
        const err = new Error('This Transaction ID has already been used for a payment.');
        err.statusCode = 409;
        throw err;
      }

      if (txData.status === 'held_for_review') {
        const err = new Error('This transaction is already under manual review. Our team will contact you shortly.');
        err.statusCode = 409;
        throw err;
      }

      if (txData.status === 'suspicious') {
        const err = new Error('This transaction was flagged as suspicious by our system. Please contact support.');
        err.statusCode = 422;
        throw err;
      }

      if (txData.status !== 'unclaimed') {
        const err = new Error('This transaction cannot be processed in its current state.');
        err.statusCode = 409;
        throw err;
      }

      // ── Provider match ─────────────────────────────────────────────────────
      // If the webhook stored no provider (older SMS format), we skip for backwards compat.
      if (txData.provider && txData.provider !== provider) {
        const err = new Error(
          `Provider mismatch. You selected ${provider.toUpperCase()} but the transaction was made via ${(txData.provider || '').toUpperCase()}.`
        );
        err.statusCode = 422;
        throw err;
      }

      // ── Tiered amount check ────────────────────────────────────────────────
      const diff = Math.abs(txData.amount - expectedAmount);

      if (diff > REVIEW_THRESHOLD) {
        // Hard reject — amount is too far off to be a rounding error.
        const err = new Error(
          `Amount mismatch. Expected ৳${expectedAmount.toLocaleString()} but transaction shows ৳${txData.amount.toLocaleString()}.`
        );
        err.statusCode = 422;
        throw err;
      }

      if (diff > AMOUNT_TOLERANCE) {
        // Near-miss — flag for manual admin review instead of hard-rejecting.
        // This path exits the transaction early; no business logic is applied.
        const flagRef = db.collection('flagged_transactions').doc(transactionId);
        tx.set(flagRef, {
          transactionId,
          uid,
          bookingType,
          propertyId:     propertyId || null,
          expectedAmount,
          receivedAmount: txData.amount,
          diff,
          provider,
          status:         'needs_review',
          flaggedAt:      Timestamp.now(),
          reason:         `Amount differs by ৳${diff.toFixed(2)} (auto-approve tolerance: ±৳${AMOUNT_TOLERANCE}, max: ±৳${REVIEW_THRESHOLD})`,
        });
        // Lock the transaction so it can't be claimed or re-submitted by another attempt.
        tx.update(unclaimedRef, {
          status:              'held_for_review',
          reviewRequestedBy:   uid,
          reviewRequestedAt:   Timestamp.now(),
        });
        // Signal to the outer handler to return 202 (not an error, but not success).
        const reviewErr = new Error('FLAGGED_FOR_REVIEW');
        reviewErr.statusCode = 202;
        reviewErr.receivedAmount = txData.amount;
        throw reviewErr;
      }

      // ── diff ≤ AMOUNT_TOLERANCE: proceed with normal approval ──────────────
      const preFetchedCommissionRate = Number(feesData?.commissionRate?.value) || 0.02;
      paymentId = await applyBusinessLogic(tx, {
        unclaimedRef, txData, uid, bookingType, propertyId, months, onsiteVerification,
        expectedAmount, propertySnapshot, commissionRate: preFetchedCommissionRate,
      });
    });

    // ── 5. Return the confirmed invoice to the frontend ───────────────────────
    return res.status(200).json({
      success:     true,
      paymentId,
      transactionId,
      amount:      expectedAmount,
      provider,
      bookingType,
      propertyId:  propertyId || null,
      verifiedAt:  new Date().toISOString(),
      message:     bookingType === 'listing'
        ? 'Payment verified. Your listing is now pending admin approval.'
        : 'Payment verified successfully.',
    });

  } catch (err) {
    // ── Manual review path — not a real error, return 202 ───────────────────
    if (err.message === 'FLAGGED_FOR_REVIEW') {
      return res.status(202).json({
        success:      false,
        needsReview:  true,
        transactionId,
        expectedAmount,
        receivedAmount: err.receivedAmount,
        message: `Your payment of ৳${(err.receivedAmount || 0).toLocaleString()} is under manual review. Our team will confirm within 24 hours. You will be notified via app.`,
      });
    }

    const statusCode = err.statusCode || 500;
    if (statusCode >= 500) {
      console.error('[verify-payment] Unhandled error:', err);
    }
    return res.status(statusCode).json({
      success: false,
      error:   statusCode >= 500 ? 'Internal server error. Please contact support.' : err.message,
    });
  }

}, {
  methods:      ['POST'],
  requireAuth:  true,      // User MUST be logged in — no anonymous verification
  requireAdmin: false,
  bodyLimit:    '10kb',
});
