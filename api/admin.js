import { auth, db, admin } from './_lib/firebase-admin.js';
import { withMiddleware } from './_lib/middleware.js';

// ─────────────────────────────────────────────────────────────────────────────
// ACTION: review-kyc
// Migrated from /api/admin-review-kyc.js
// ─────────────────────────────────────────────────────────────────────────────
async function handleReviewKyc(req, res) {
  const { uid, decision, reason = '' } = req.body || {};

  if (!uid || typeof uid !== 'string') {
    return res.status(400).json({ error: 'uid is required' });
  }
  if (!['approved', 'rejected'].includes(decision)) {
    return res.status(400).json({ error: 'decision must be approved or rejected' });
  }

  const submissionRef = db.collection('kycSubmissions').doc(uid);
  const submissionSnap = await submissionRef.get();

  if (!submissionSnap.exists) {
    return res.status(404).json({ error: 'KYC submission not found' });
  }

  await submissionRef.update({
    status: decision,
    reviewedAt: admin.firestore.FieldValue.serverTimestamp(),
    reviewedBy: req.user.uid,
    reason: decision === 'rejected' ? String(reason).slice(0, 500) : '',
  });

  if (decision === 'approved') {
    const user = await auth.getUser(uid);
    await auth.setCustomUserClaims(uid, {
      ...(user.customClaims || {}),
      kycVerified: true,
    });
    await db.collection('users').doc(uid).set({
      kycStatus: 'verified',
      isVerified: true,
      onboardingStatus: 'VERIFIED',
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    }, { merge: true });
  } else {
    const user = await auth.getUser(uid);
    await auth.setCustomUserClaims(uid, {
      ...(user.customClaims || {}),
      kycVerified: false,
    });
    await db.collection('users').doc(uid).set({
      kycStatus: 'rejected',
      onboardingStatus: 'REJECTED',
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    }, { merge: true });
  }

  return res.status(200).json({ success: true, status: decision });
}

// ─────────────────────────────────────────────────────────────────────────────
// ACTION: set-claim
// Migrated from /api/set-admin-claim.js
// ─────────────────────────────────────────────────────────────────────────────
async function handleSetClaim(req, res) {
  const { targetUid, grantAdmin } = req.body || {};

  if (!targetUid || typeof targetUid !== 'string') {
    return res.status(400).json({ error: 'targetUid is required' });
  }
  if (typeof grantAdmin !== 'boolean') {
    return res.status(400).json({ error: 'grantAdmin must be a boolean' });
  }
  if (req.user.uid === targetUid && grantAdmin === false) {
    return res.status(400).json({ error: 'Admins cannot revoke their own admin claim' });
  }

  try {
    await auth.getUser(targetUid);
  } catch {
    return res.status(404).json({ error: 'Target user not found' });
  }

  await auth.setCustomUserClaims(targetUid, {
    admin: grantAdmin,
    role: grantAdmin ? 'admin' : 'user',
  });
  await auth.revokeRefreshTokens(targetUid);

  await db.collection('adminAuditLogs').add({
    action: grantAdmin ? 'GRANT_ADMIN' : 'REVOKE_ADMIN',
    performedByUid: req.user.uid,
    targetUid: targetUid,
    timestamp: admin.firestore.Timestamp.now(),
    ipAddress: req.headers['x-forwarded-for']?.split(',')[0].trim() || req.socket?.remoteAddress || 'unknown',
  });

  return res.status(200).json({
    success: true,
    message: `Admin claim ${grantAdmin ? 'granted' : 'revoked'}`,
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// ACTION: chat-review
// Security model:
//   1. Admin must supply a bookingId.
//   2. An active dispute document linked to that bookingId must exist in
//      the 'disputes' collection with status === 'open'.
//   3. A conversation linked to that bookingId via requestId field must exist.
//   4. Every access attempt (success OR denial) is written to adminAuditLogs.
//   5. Response is read-only data — no editing capability whatsoever.
// ─────────────────────────────────────────────────────────────────────────────
async function handleChatReview(req, res) {
  const { bookingId } = req.body || {};
  const adminUid = req.user.uid;
  const ipAddress = req.headers['x-forwarded-for']?.split(',')[0].trim() || req.socket?.remoteAddress || 'unknown';

  if (!bookingId || typeof bookingId !== 'string' || bookingId.length > 128) {
    return res.status(400).json({ error: 'A valid bookingId is required.' });
  }

  // ── Step 1: Verify an active dispute exists for this booking ──
  const disputesSnap = await db
    .collection('disputes')
    .where('bookingId', '==', bookingId)
    .where('status', '==', 'open')
    .limit(1)
    .get();

  const hasActiveDispute = !disputesSnap.empty;

  // Also check escrowDeposits with 'disputed' status as a secondary source of truth
  let hasDisputedEscrow = false;
  if (!hasActiveDispute) {
    const escrowSnap = await db
      .collection('escrowDeposits')
      .where('bookingId', '==', bookingId)
      .where('status', '==', 'disputed')
      .limit(1)
      .get();
    hasDisputedEscrow = !escrowSnap.empty;
  }

  if (!hasActiveDispute && !hasDisputedEscrow) {
    // Log the denied access attempt
    await db.collection('adminAuditLogs').add({
      action: 'CHAT_REVIEW_DENIED',
      performedByUid: adminUid,
      bookingId,
      reason: 'No active dispute or disputed escrow found for this bookingId',
      timestamp: admin.firestore.Timestamp.now(),
      ipAddress,
    });
    return res.status(403).json({
      error: 'Access denied. No active dispute found for this booking. Chat review is only permitted for bookings with an open dispute.',
    });
  }

  // Grab the dispute document to return with the response
  const disputeDoc = hasActiveDispute ? disputesSnap.docs[0].data() : null;

  // ── Step 2: Find the conversation linked to this booking ──
  // Conversations are linked via requestId field (set when created from a viewing_request)
  const convSnap = await db
    .collection('conversations')
    .where('requestId', '==', bookingId)
    .limit(1)
    .get();

  // Also try matching by bookingId field directly (escrow flow may set this)
  let conversationDoc = convSnap.empty ? null : { id: convSnap.docs[0].id, ...convSnap.docs[0].data() };

  if (!conversationDoc) {
    const convSnap2 = await db
      .collection('conversations')
      .where('bookingId', '==', bookingId)
      .limit(1)
      .get();
    if (!convSnap2.empty) {
      conversationDoc = { id: convSnap2.docs[0].id, ...convSnap2.docs[0].data() };
    }
  }

  // ── Step 3: Fetch messages if conversation was found ──
  let messages = [];
  if (conversationDoc) {
    const messagesSnap = await db
      .collection('conversations')
      .doc(conversationDoc.id)
      .collection('messages')
      .orderBy('createdAt', 'asc')
      .get();

    messages = messagesSnap.docs.map(d => {
      const data = d.data();
      return {
        id: d.id,
        text: data.text || '',
        senderId: data.senderId || '',
        // Return timestamp as ISO string so it's JSON-serialisable
        createdAt: data.createdAt?.toDate?.()?.toISOString() || null,
        attachments: data.attachments || [],
        imageUrl: data.imageUrl || null,
      };
    });
  }

  // ── Step 4: Write the successful access audit log ──
  await db.collection('adminAuditLogs').add({
    action: 'CHAT_REVIEW_ACCESSED',
    performedByUid: adminUid,
    bookingId,
    conversationId: conversationDoc?.id || null,
    messageCount: messages.length,
    timestamp: admin.firestore.Timestamp.now(),
    ipAddress,
  });

  // ── Step 5: Return read-only data ──
  return res.status(200).json({
    success: true,
    bookingId,
    dispute: disputeDoc,
    conversation: conversationDoc
      ? {
          id: conversationDoc.id,
          participants: conversationDoc.participants || [],
          requestId: conversationDoc.requestId || null,
          bookingId: conversationDoc.bookingId || null,
          lastMessage: conversationDoc.lastMessage || null,
          createdAt: conversationDoc.createdAt?.toDate?.()?.toISOString() || null,
        }
      : null,
    messages,
    accessedAt: new Date().toISOString(),
    accessedBy: adminUid,
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// UNIFIED ROUTER
// ─────────────────────────────────────────────────────────────────────────────
export default withMiddleware(async (req, res) => {
  const action = req.query.action;

  switch (action) {
    case 'review-kyc':
      return handleReviewKyc(req, res);
    case 'set-claim':
      return handleSetClaim(req, res);
    case 'chat-review':
      return handleChatReview(req, res);
    default:
      return res.status(400).json({
        error: `Unknown action: "${action}". Use ?action=review-kyc|set-claim|chat-review`,
      });
  }
}, {
  methods: ['POST'],
  requireAuth: true,
  requireAdmin: true,
  bodyLimit: '10kb',
});
