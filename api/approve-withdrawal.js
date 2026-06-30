import { db, admin } from './_lib/firebase-admin.js';
import { withMiddleware } from './_lib/middleware.js';

// Admin-only endpoint to approve or reject a pending withdrawal request.
// Requires: requireAdmin: true (JWT must have admin == true custom claim).
export default withMiddleware(async (req, res) => {
  const adminUid   = req.user.uid;
  const adminEmail = req.user.email || 'unknown-admin';
  const body       = req.body || {};

  const { withdrawalId, action } = body;

  // ── 1. Input validation ─────────────────────────────────────────────────────
  if (!withdrawalId || typeof withdrawalId !== 'string') {
    return res.status(400).json({ error: 'withdrawalId is required' });
  }
  if (action !== 'approve' && action !== 'reject') {
    return res.status(400).json({ error: "action must be 'approve' or 'reject'" });
  }

  const withdrawalRef = db.collection('withdrawals').doc(withdrawalId);

  try {
    let finalStatus;
    let targetUid;
    let rejectedAmount;

    await db.runTransaction(async (tx) => {
      const withdrawalSnap = await tx.get(withdrawalRef);
      if (!withdrawalSnap.exists) {
        throw Object.assign(new Error('Withdrawal record not found'), { statusCode: 404 });
      }

      const withdrawal = withdrawalSnap.data();
      if (withdrawal.status !== 'pending') {
        throw Object.assign(
          new Error(`Withdrawal is already '${withdrawal.status}'. Cannot change a finalized withdrawal.`),
          { statusCode: 409 }
        );
      }

      targetUid      = withdrawal.uid;
      rejectedAmount = Number(withdrawal.amount);
      finalStatus    = action === 'approve' ? 'approved' : 'rejected';

      // Update the withdrawal record
      tx.update(withdrawalRef, {
        status:       finalStatus,
        resolvedAt:   admin.firestore.Timestamp.now(),
        resolvedBy:   adminEmail,
        resolverUid:  adminUid,
      });

      // If rejected, reverse the balance deduction so the user gets their money back
      if (action === 'reject') {
        const userRef = db.collection('users').doc(targetUid);
        tx.update(userRef, {
          'referralWallet.available': admin.firestore.FieldValue.increment(rejectedAmount),
          'referralWallet.withdrawn': admin.firestore.FieldValue.increment(-rejectedAmount),
        });
      }

      // Write an immutable audit log entry
      const auditRef = db.collection('adminAuditLogs').doc();
      tx.set(auditRef, {
        action:        `withdrawal_${finalStatus}`,
        performedBy:   adminEmail,
        performerUid:  adminUid,
        targetUid,
        withdrawalId,
        amount:        rejectedAmount,
        timestamp:     admin.firestore.Timestamp.now(),
      });
    });

    // ── 2. Notify the user of the outcome (non-fatal) ───────────────────────
    try {
      const notifRef = db.collection('notifications').doc();
      await notifRef.set({
        userId:    targetUid,
        type:      `withdrawal_${finalStatus}`,
        title:     action === 'approve' ? '✅ Withdrawal Approved' : '❌ Withdrawal Rejected',
        body:      action === 'approve'
          ? `Your withdrawal of ৳${rejectedAmount.toLocaleString()} has been approved and will be transferred within 1-3 business days.`
          : `Your withdrawal of ৳${rejectedAmount.toLocaleString()} has been rejected. The amount has been returned to your wallet. Please contact support if you have questions.`,
        link:      '/referral',
        isRead:    false,
        createdAt: admin.firestore.Timestamp.now(),
        metadata:  { withdrawalId, amount: rejectedAmount },
      });
    } catch (notifErr) {
      console.error('[approve-withdrawal] User notification failed (non-fatal):', notifErr);
    }

    return res.status(200).json({ success: true, status: finalStatus, withdrawalId });

  } catch (err) {
    const statusCode = err.statusCode || 500;
    if (statusCode >= 500) console.error('[approve-withdrawal] Error:', err);
    return res.status(statusCode).json({
      error: statusCode >= 500 ? 'Operation failed. Please try again.' : err.message,
    });
  }
}, {
  methods:      ['POST'],
  requireAuth:  true,
  requireAdmin: true,   // 🔒 JWT must contain `admin: true` custom claim
  bodyLimit:    '4kb',
});
