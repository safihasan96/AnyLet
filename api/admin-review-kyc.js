import { db, auth, admin } from './_lib/firebase-admin.js';
import { withMiddleware } from './_lib/middleware.js';

export default withMiddleware(async (req, res) => {
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
}, {
  methods: ['POST'],
  requireAuth: true,
  requireAdmin: true,
  bodyLimit: '10kb',
});
