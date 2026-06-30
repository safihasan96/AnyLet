import { auth, db, admin } from './_lib/firebase-admin.js';
import { withMiddleware } from './_lib/middleware.js';

export default withMiddleware(async (req, res) => {
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

  // Write audit log for accountability
  const now = admin.firestore.Timestamp.now();
  await db.collection('adminAuditLogs').add({
    action: grantAdmin ? 'GRANT_ADMIN' : 'REVOKE_ADMIN',
    performedByUid: req.user.uid,
    targetUid: targetUid,
    timestamp: now,
    ipAddress: req.headers['x-forwarded-for']?.split(',')[0].trim() || req.socket?.remoteAddress || 'unknown'
  });

  return res.status(200).json({
    success: true,
    message: `Admin claim ${grantAdmin ? 'granted' : 'revoked'}`,
  });
}, {
  methods: ['POST'],
  requireAuth: true,
  requireAdmin: true,
  bodyLimit: '10kb',
});
