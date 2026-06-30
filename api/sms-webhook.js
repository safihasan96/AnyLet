import crypto from 'crypto';
import { db, admin } from './_lib/firebase-admin.js';
import { withMiddleware } from './_lib/middleware.js';

// ── Guard: fail loudly at startup if the webhook secret is not configured ──
// Without this, an empty string would match any request — leaving the
// payment webhook completely open to forged confirmations.
const WEBHOOK_SECRET = process.env.SMS_WEBHOOK_SECRET;
if (!WEBHOOK_SECRET || WEBHOOK_SECRET.trim().length < 16) {
  throw new Error(
    '[sms-webhook] FATAL: SMS_WEBHOOK_SECRET env var is missing or too short (min 16 chars). ' +
    'Set it in your environment before deploying.'
  );
}

const AMOUNT_TOLERANCE = 1;
const ALLOWED_PROVIDERS = new Set(['bkash', 'nagad', 'rocket']);

// Constant-time string comparison — prevents timing attacks.
// Pads both buffers to the same length before comparing so no
// length information is leaked via timing.
function safeCompare(a, b) {
  const left  = Buffer.from(String(a || ''), 'utf8');
  const right = Buffer.from(String(b || ''), 'utf8');
  const maxLen = Math.max(left.length, right.length);
  const paddedLeft  = Buffer.concat([left,  Buffer.alloc(maxLen - left.length)]);
  const paddedRight = Buffer.concat([right, Buffer.alloc(maxLen - right.length)]);
  // timingSafeEqual always takes same time regardless of content
  const equal = crypto.timingSafeEqual(paddedLeft, paddedRight);
  // also reject if lengths differ (padded comparison would pass if only one is empty)
  return equal && left.length === right.length;
}

function sanitizeTransactionId(value) {
  return String(value || '').replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
}

function parseAmount(value) {
  if (typeof value === 'number') return value;
  const cleaned = String(value || '').replace(/,/g, '').match(/\d+(\.\d+)?/);
  return cleaned ? Number(cleaned[0]) : NaN;
}

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

  const senderNumber =
    body.senderNumber ||
    body.from ||
    text.match(/(?:from|sender)[:\s-]*(\+?88)?(01[0-9]{9})/i)?.[0];

  const referenceCode =
    body.referenceCode ||
    body.paymentIntentId ||
    text.match(/ANYLET-[A-Z0-9]{6}/i)?.[0];

  return {
    provider: String(body.provider || '').toLowerCase(),
    transactionId: sanitizeTransactionId(transactionId),
    amount: parseAmount(amount),
    senderNumber: senderNumber || null,
    referenceCode: referenceCode ? String(referenceCode).toUpperCase() : null,
  };
}

async function findPaymentIntent(payload) {
  if (payload.referenceCode) {
    const snap = await db.collection('paymentIntents')
      .where('referenceCode', '==', payload.referenceCode)
      .where('status', '==', 'pending')
      .limit(1)
      .get();
    if (!snap.empty) return snap.docs[0].ref;
  }

  const byTransaction = await db.collection('paymentIntents')
    .where('transactionId', '==', payload.transactionId)
    .where('status', '==', 'pending')
    .limit(1)
    .get();

  return byTransaction.empty ? null : byTransaction.docs[0].ref;
}

function ok(res, reason) {
  if (reason) console.warn('[sms-webhook] Ignored payment SMS:', reason);
  return res.status(200).json({ received: true });
}

const COMMISSION_RATE = 0.02; // 2% lifetime referral commission

async function createBusinessRecords(tx, intentRef, intent, payload, processedRef, propertyContext = null) {
  const now = admin.firestore.Timestamp.now();
  const paymentRecordRef = db.collection('payments').doc(intentRef.id);

  tx.set(processedRef, {
    transactionId: payload.transactionId,
    paymentIntentId: intentRef.id,
    uid: intent.uid,
    amount: payload.amount,
    senderNumber: payload.senderNumber,
    processedAt: now,
  });

  tx.update(intentRef, {
    used: true,
    status: 'completed',
    transactionId: payload.transactionId,
    paidAmount: payload.amount,
    senderNumber: payload.senderNumber,
    completedAt: now,
    verifiedAt: now,
    verifiedBy: 'sms-webhook',
  });

  tx.set(paymentRecordRef, {
    uid: intent.uid,
    userId: intent.uid,
    propertyId: intent.propertyId || null,
    expectedAmount: intent.expectedAmount,
    paidAmount: payload.amount,
    amount: payload.amount,
    transactionId: payload.transactionId,
    paymentMethod: payload.provider,
    type: intent.bookingType,
    status: 'completed',
    paymentIntentId: intentRef.id,
    createdAt: intent.createdAt || now,
    verifiedAt: now,
    verifiedBy: 'sms-webhook',
  });

  if (intent.bookingType === 'subscription') {
    const userRef = db.collection('users').doc(intent.uid);
    const expiry = new Date();
    expiry.setMonth(expiry.getMonth() + Number(intent.months || 1));
    tx.update(userRef, {
      subscriptionTier: 'Premium',
      subscriptionPlan: 'Premium',
      subscriptionExpiry: admin.firestore.Timestamp.fromDate(expiry),
      subscriptionActiveUntil: admin.firestore.Timestamp.fromDate(expiry),
      updatedAt: now,
    });
    // Fall through to commission credit below
  } else if (intent.bookingType === 'listing') {
    tx.set(paymentRecordRef, {
      listingEntitlement: true,
      onsiteVerificationIncluded: intent.onsiteVerification === true,
    }, { merge: true });
    // Fall through to commission credit below
  } else {
    // booking, deposit, or verification — requires a property
    const propertyId = intent.propertyId;
    if (!propertyId) throw new Error('payment intent missing propertyId');

    const propertyRef = db.collection('properties').doc(propertyId);
    const property = propertyContext;
    if (!property) throw new Error('property missing during webhook processing');

    // ── TOCTOU FIX: Use snapshot locked at payment-intent creation time ──────
    // We NEVER read the live property's rent/deposit here.
    // The amounts were sealed into intent.propertySnapshot when the intent was
    // created, so a landlord changing the price mid-payment cannot affect the
    // escrow amount recorded in the ledger.
    const snapshot = intent.propertySnapshot || {};
    const ownerId = snapshot.ownerId || property.ownerId || property.userId || null;
    const lockedDepositAmount = Number(snapshot.securityDeposit ?? 0);
    const propertyTitle = snapshot.title || property.title || `Property ${propertyId.slice(0, 6)}`;

    const bookingRef = db.collection('bookings').doc();
    tx.set(bookingRef, {
      paymentIntentId: intentRef.id,
      paymentId: paymentRecordRef.id,
      tenantId: intent.uid,
      ownerId,
      propertyId,
      propertyName: propertyTitle,
      bookingType: intent.bookingType,
      amount: payload.amount,
      status: 'confirmed',
      createdAt: now,
      paymentVerified: true,
      paymentVerifiedAt: now,
    });

    if (intent.bookingType === 'deposit') {
      const escrowRef = db.collection('escrowDeposits').doc();
      tx.set(escrowRef, {
        bookingId: bookingRef.id,
        paymentIntentId: intentRef.id,
        paymentId: paymentRecordRef.id,
        tenantId: intent.uid,
        ownerId,
        propertyId,
        propertyName: propertyTitle,
        amount: payload.amount,
        // ── Snapshot-locked: this is what the tenant agreed to pay ──
        depositAmount: lockedDepositAmount,
        status: 'held',
        provider: payload.provider,
        createdAt: now,
        verifiedAt: now,
        confirmedByTenant: false,
        confirmedByOwner: false,
        releaseRequested: false,
      });

      tx.update(propertyRef, {
        status: 'Booked',
        updatedAt: now,
      });
    } else if (intent.bookingType === 'verification') {
      tx.update(propertyRef, {
        verificationPaymentId: paymentRecordRef.id,
        verificationStatus: 'pending',
        onsiteVerificationRequested: true,
        updatedAt: now,
      });
    }
  }

  // ── SERVER-SIDE COMMISSION: Credit referrer atomically ─────────────────────
  // We look up the payer's document (already fetched by the caller) to check
  // if they were referred. If so, we credit 2% to the referrer inside this
  // same atomic transaction — guaranteeing no double-credit and no missed credit.
  const payerRef = db.collection('users').doc(intent.uid);
  const payerSnap = await tx.get(payerRef);

  if (payerSnap.exists) {
    const referrerId = payerSnap.data().referredBy ?? null;
    if (referrerId) {
      const commissionAmount = parseFloat((payload.amount * COMMISSION_RATE).toFixed(2));
      const referrerRef = db.collection('users').doc(referrerId);
      const referrerSnap = await tx.get(referrerRef);

      if (referrerSnap.exists) {
        const wallet = referrerSnap.data().referralWallet ?? { available: 0, withdrawn: 0 };
        // Increment atomically — this is inside a Firestore transaction so
        // concurrent webhooks will be serialized and cannot double-credit.
        tx.update(referrerRef, {
          'referralWallet.available': (wallet.available ?? 0) + commissionAmount,
        });

        // Write an immutable commission ledger entry for transparency.
        const commissionRef = db.collection('commissions').doc();
        tx.set(commissionRef, {
          referrerId,
          refereeId: intent.uid,
          transactionId: intentRef.id,
          paymentIntentId: intentRef.id,
          amount: commissionAmount,
          baseAmount: payload.amount,
          rate: COMMISSION_RATE,
          bookingType: intent.bookingType,
          description: `2% commission on ${intent.bookingType} payment`,
          status: 'credited',
          createdAt: now,
          creditedBy: 'sms-webhook',
        });
      }
    }
  }
}

export default withMiddleware(async (req, res) => {
  // WEBHOOK_SECRET is validated at module load time (above).
  // Here we only verify the incoming request's Bearer token.
  const authHeader = req.headers.authorization || '';
  if (!authHeader.startsWith('Bearer ') || !safeCompare(authHeader.slice(7), WEBHOOK_SECRET)) {
    return ok(res, 'unauthorized webhook request');
  }

  const payload = extractSmsPayload(req.method === 'GET' ? req.query : (req.body || {}));

  if (payload.provider && !ALLOWED_PROVIDERS.has(payload.provider)) {
    return ok(res, 'unsupported provider');
  }
  if (!payload.transactionId || payload.transactionId.length < 6) {
    return ok(res, 'missing transaction id');
  }
  if (!Number.isFinite(payload.amount) || payload.amount <= 0) {
    return ok(res, 'invalid amount');
  }

  const intentRef = await findPaymentIntent(payload);
  if (!intentRef) return ok(res, 'no matching payment intent');

  const processedRef = db.collection('processedTransactions').doc(payload.transactionId);

  try {
    await db.runTransaction(async (tx) => {
      const [intentSnap, processedSnap] = await Promise.all([
        tx.get(intentRef),
        tx.get(processedRef),
      ]);

      if (processedSnap.exists) throw new Error('duplicate transaction');
      if (!intentSnap.exists) throw new Error('payment intent missing');

      const intent = intentSnap.data();
      const expiresAt = intent.expiresAt?.toMillis?.() || 0;
      const now = Date.now();

      if (intent.status !== 'pending') throw new Error('payment intent not pending');
      if (intent.used !== false) throw new Error('payment intent already used');
      if (expiresAt <= now) throw new Error('payment intent expired');
      if (Math.abs(Number(intent.expectedAmount) - payload.amount) > AMOUNT_TOLERANCE) {
        throw new Error('amount mismatch');
      }

      let propertyContext = null;
      if (['booking', 'deposit', 'verification'].includes(intent.bookingType)) {
        if (!intent.propertyId) throw new Error('payment intent missing propertyId');
        const propertySnap = await tx.get(db.collection('properties').doc(intent.propertyId));
        if (!propertySnap.exists) throw new Error('property missing during webhook processing');
        propertyContext = propertySnap.data();
      }

      await createBusinessRecords(tx, intentRef, intent, payload, processedRef, propertyContext);
    });

    return res.status(200).json({ received: true });
  } catch (error) {
    return ok(res, error.message);
  }
}, {
  methods: ['GET', 'POST'],
  requireAuth: false,
  requireAdmin: false,
  bodyLimit: '10kb',
});
