import { db } from './_lib/firebase-admin.js';
import { Timestamp } from 'firebase-admin/firestore';
import { withMiddleware } from './_lib/middleware.js';

function sanitizeTransactionId(value) {
  return String(value || '').replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
}

export default withMiddleware(async (req, res) => {
  const transactionId = sanitizeTransactionId(req.body?.transactionId);

  if (!transactionId || transactionId.length < 6) {
    return res.status(400).json({ error: 'transactionId must be at least 6 alphanumeric characters.' });
  }

  const txRef = db.collection('unclaimed_transactions').doc(transactionId);

  try {
    await db.runTransaction(async (tx) => {
      const snap = await tx.get(txRef);

      if (!snap.exists) {
        const err = new Error('Transaction not found.');
        err.statusCode = 404;
        throw err;
      }

      const txData = snap.data();
      if (txData.status !== 'unclaimed') {
        const err = new Error('Transaction is already claimed.');
        err.statusCode = 409;
        throw err;
      }

      tx.update(txRef, {
        status: 'claimed',
        claimedBy: req.user.uid,
        claimedAt: Timestamp.now(),
        bookingType: 'manual_admin',
        manualClaim: true,
      });
    });

    return res.status(200).json({ success: true });
  } catch (err) {
    const statusCode = err.statusCode || 500;
    if (statusCode >= 500) {
      console.error('[admin-claim-webhook-transaction] Failed:', err);
    }
    return res.status(statusCode).json({
      success: false,
      error: statusCode >= 500 ? 'Internal server error.' : err.message,
    });
  }
}, {
  methods: ['POST'],
  requireAuth: true,
  requireAdmin: true,
  bodyLimit: '5kb',
});
