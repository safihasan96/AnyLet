import { db, admin } from './_lib/firebase-admin.js';
import { withMiddleware } from './_lib/middleware.js';

export default withMiddleware(async (req, res) => {
  const uid = req.user.uid;
  const { cloudinaryPublicIds = [], docType = 'nid' } = req.body || {};

  if (!Array.isArray(cloudinaryPublicIds) || cloudinaryPublicIds.length === 0) {
    return res.status(400).json({ error: 'cloudinaryPublicIds are required' });
  }

  await db.collection('kycSubmissions').doc(uid).set({
    uid,
    status: 'pending',
    docType,
    submittedAt: admin.firestore.FieldValue.serverTimestamp(),
    cloudinaryPublicIds,
  }, { merge: false });

  return res.status(201).json({ success: true, status: 'pending' });
}, {
  methods: ['POST'],
  requireAuth: true,
  requireAdmin: false,
  bodyLimit: '10kb',
});
