import crypto from 'crypto';
import { db, admin } from './_lib/firebase-admin.js';
import { withMiddleware } from './_lib/middleware.js';

// Constant-time comparison so the cron secret can't be recovered via timing.
function safeEqual(a, b) {
  const left = Buffer.from(String(a || ''), 'utf8');
  const right = Buffer.from(String(b || ''), 'utf8');
  if (left.length !== right.length) return false;
  return crypto.timingSafeEqual(left, right);
}

// Cron job to send rent-due reminders to tenants.
// Triggered by Vercel Cron — protected by CRON_SECRET env var.
//
// IDEMPOTENCY GUARANTEE:
// Each notification is keyed as:
//   `rent_reminder_{moveInId}_{YYYY}_{MM}`
// The document is created only if it does not already exist (checked before
// batch.set()). This means Vercel can fire the cron twice in rapid succession
// or after a retry and tenants will NEVER receive duplicate reminders.

export default withMiddleware(async (req, res) => {
  // Verify cron secret — this endpoint does not use Firebase JWT auth
  // because it is called by the Vercel scheduler, not a browser client.
  const authHeader = req.headers.authorization || '';
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret || !safeEqual(authHeader, `Bearer ${cronSecret}`)) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const moveInsSnap = await db.collection('tenantMoveIns')
    .where('status', '==', 'active')
    .limit(100)
    .get();

  if (moveInsSnap.empty) {
    return res.status(200).json({ success: true, count: 0 });
  }

  const today = new Date();
  const currentMonth = today.getMonth();
  const currentYear  = today.getFullYear();
  // Pad to ensure consistent key formatting regardless of locale
  const monthKey = String(currentMonth).padStart(2, '0');
  let remindersSent = 0;
  const batch = db.batch();

  for (const docSnap of moveInsSnap.docs) {
    const data = docSnap.data();
    const nextDueDate = new Date(currentYear, currentMonth + 1, 1);
    const diffDays    = Math.ceil(Math.abs(nextDueDate - today) / (1000 * 60 * 60 * 24));

    if (diffDays <= 3) {
      // ── IDEMPOTENCY KEY: deterministic per move-in per calendar month ──────
      // If Vercel fires this cron twice, the second run finds the doc exists
      // and skips creation — no duplicate notification is ever written.
      const notificationId  = `rent_reminder_${docSnap.id}_${currentYear}_${monthKey}`;
      const notificationRef = db.collection('notifications').doc(notificationId);
      const notificationDoc = await notificationRef.get();

      if (!notificationDoc.exists) {
        batch.set(notificationRef, {
          userId:    data.tenantId,
          type:      'rent_reminder',
          title:     'Rent Due Soon',
          body:      `Your rent for ${data.propertyName || 'your property'} is due in ${diffDays} day${diffDays !== 1 ? 's' : ''}.`,
          link:      '/my-bookings',
          isRead:    false,
          createdAt: admin.firestore.FieldValue.serverTimestamp(),
          metadata: {
            propertyId: data.propertyId || null,
            moveInId:   docSnap.id,
            dueInDays:  diffDays,
            // Mark that this was written by the cron — useful for audit queries
            source:     'cron-rent-reminders',
          },
        });
        remindersSent += 1;
      }
    }
  }

  if (remindersSent > 0) await batch.commit();

  return res.status(200).json({ success: true, count: remindersSent });
}, {
  methods:      ['POST', 'GET'],
  requireAuth:  false,
  requireAdmin: false,
  bodyLimit:    '2kb',
});
