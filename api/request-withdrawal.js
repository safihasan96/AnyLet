import { db, admin } from './_lib/firebase-admin.js';
import { withMiddleware } from './_lib/middleware.js';

const MIN_WITHDRAWAL = 100;  // BDT
const MAX_WITHDRAWAL = 50000; // BDT — anti-abuse cap per request

function validateBankDetails(details) {
  if (!details || typeof details !== 'object') return 'bankDetails is required';
  if (!details.bankName || typeof details.bankName !== 'string' || details.bankName.trim().length < 2)
    return 'bankName must be at least 2 characters';
  if (!details.accountNumber || typeof details.accountNumber !== 'string' || details.accountNumber.trim().length < 5)
    return 'accountNumber must be at least 5 characters';
  if (!details.accountName || typeof details.accountName !== 'string' || details.accountName.trim().length < 2)
    return 'accountName must be at least 2 characters';
  // Simple injection guard — no HTML or special chars allowed
  const dangerousChars = /[<>"'\\]/;
  for (const val of [details.bankName, details.accountNumber, details.accountName]) {
    if (dangerousChars.test(val)) return 'bankDetails contains invalid characters';
  }
  return null; // valid
}

export default withMiddleware(async (req, res) => {
  const uid    = req.user.uid;
  const email  = req.user.email || null;
  const body   = req.body || {};
  const amount = Number(body.amount);

  // ── 1. Input validation ─────────────────────────────────────────────────────
  if (!Number.isFinite(amount) || amount < MIN_WITHDRAWAL) {
    return res.status(400).json({ error: `Minimum withdrawal amount is ৳${MIN_WITHDRAWAL}` });
  }
  if (amount > MAX_WITHDRAWAL) {
    return res.status(400).json({ error: `Maximum withdrawal per request is ৳${MAX_WITHDRAWAL}` });
  }

  const bankDetailsError = validateBankDetails(body.bankDetails);
  if (bankDetailsError) {
    return res.status(400).json({ error: bankDetailsError });
  }

  const bankDetails = {
    bankName:      String(body.bankDetails.bankName).trim(),
    accountNumber: String(body.bankDetails.accountNumber).trim(),
    accountName:   String(body.bankDetails.accountName).trim(),
  };

  const userRef = db.collection('users').doc(uid);

  try {
    // ── 2. Atomic deduct-and-create ─────────────────────────────────────────
    // Using a Firestore transaction ensures that:
    //   a) the user's balance is read and deducted atomically (no race condition)
    //   b) if the withdrawal record write fails, the balance deduction is rolled back
    //   c) two concurrent withdrawal requests cannot both succeed if there is
    //      only enough balance for one
    let withdrawalId;
    await db.runTransaction(async (tx) => {
      const snap = await tx.get(userRef);
      if (!snap.exists) throw Object.assign(new Error('User not found'), { statusCode: 404 });

      const userData  = snap.data();
      const wallet    = userData.referralWallet ?? { available: 0, withdrawn: 0 };
      const available = Number(wallet.available ?? 0);

      if (available < amount) {
        throw Object.assign(
          new Error(`Insufficient balance. Available: ৳${available.toFixed(2)}`),
          { statusCode: 400 }
        );
      }

      // Deduct atomically
      tx.update(userRef, {
        'referralWallet.available': admin.firestore.FieldValue.increment(-amount),
        'referralWallet.withdrawn': admin.firestore.FieldValue.increment(amount),
      });

      // Write pending withdrawal record
      const withdrawalRef = db.collection('withdrawals').doc();
      withdrawalId = withdrawalRef.id;
      tx.set(withdrawalRef, {
        uid,
        userEmail: email,
        userName: userData.displayName || `${userData.personalDetails?.firstName || ''} ${userData.personalDetails?.lastName || ''}`.trim() || email,
        amount,
        bankDetails,
        status:    'pending',   // admin reviews → 'approved' | 'rejected'
        createdAt: admin.firestore.Timestamp.now(),
        requestedBy: 'user',   // audit trail
      });
    });

    // ── 3. Notify admins via in-app notification ───────────────────────────
    // Query for admin users and create notifications for each
    // This runs AFTER the transaction so a notification failure never rolls
    // back a successful withdrawal request.
    try {
      const adminsSnap = await db.collection('users')
        .where('role', '==', 'admin')
        .limit(10)
        .get();

      if (!adminsSnap.empty) {
        const notifBatch = db.batch();
        const now = admin.firestore.Timestamp.now();
        const userName = (await db.collection('users').doc(uid).get()).data()?.displayName || email || uid;

        adminsSnap.docs.forEach((adminDoc) => {
          const notifRef = db.collection('notifications').doc();
          notifBatch.set(notifRef, {
            userId: adminDoc.id,
            type: 'withdrawal_request',
            title: '💰 New Withdrawal Request',
            body: `${userName} has requested a withdrawal of ৳${amount.toLocaleString()}. Requires admin approval.`,
            link: `/admin/withdrawals?id=${withdrawalId}`,
            isRead: false,
            createdAt: now,
            metadata: {
              withdrawalId,
              requestingUid: uid,
              amount,
            },
          });
        });

        await notifBatch.commit();
      }
    } catch (notifErr) {
      // Notification failure should NOT surface to the user — the withdrawal itself succeeded.
      console.error('[request-withdrawal] Admin notification failed (non-fatal):', notifErr);
    }

    return res.status(200).json({ success: true, message: 'Withdrawal request submitted. Processing within 1–3 business days.' });

  } catch (err) {
    const statusCode = err.statusCode || 500;
    if (statusCode >= 500) console.error('[request-withdrawal] Error:', err);
    return res.status(statusCode).json({
      error: statusCode >= 500 ? 'Withdrawal request failed. Please try again.' : err.message,
    });
  }
}, {
  methods:      ['POST'],
  requireAuth:  true,
  requireAdmin: false,
  bodyLimit:    '4kb',
});
