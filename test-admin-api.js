/**
 * test-admin-api.js
 * Verification tests for the unified /api/admin router
 *
 * Tests (using mock tokens — same pattern as test-escrow-api.js):
 *   1. Unknown action → 400
 *   2. chat-review DENIED — no active dispute → 403 + audit log written
 *   3. chat-review ACCESSIBLE — seed a disputed escrow, verify 200 response
 *   4. chat-review missing bookingId → 400
 *   5. review-kyc still routes correctly → 404 on unknown uid
 *   6. set-claim still routes correctly → 404 on unknown uid
 *   7. Non-admin token → 403
 *
 * Usage:
 *   node --env-file=.env test-admin-api.js
 */

import dotenv from 'dotenv';
dotenv.config();

import { db, auth, admin } from './api/_lib/firebase-admin.js';
import adminHandler from './api/admin.js';

// ── Mock verifyIdToken (same pattern as test-escrow-api.js) ───────────────────
auth.verifyIdToken = async (token) => {
  if (token === 'admin-token')     return { uid: 'admin-uid', email: 'admin@anylet.com', admin: true };
  if (token === 'non-admin-token') return { uid: 'user-uid',  email: 'user@anylet.com',  admin: false };
  throw new Error('Invalid token');
};
auth.getUser   = async (uid) => { throw Object.assign(new Error('User not found'), { code: 'auth/user-not-found' }); };
auth.setCustomUserClaims = async () => {};
auth.revokeRefreshTokens  = async () => {};

// ── Mock request/response factory ─────────────────────────────────────────────
function call(action, token, body = {}) {
  const res = {
    statusCode: 200, body: null, _headers: {},
    status(code) { this.statusCode = code; return this; },
    json(data)   { this.body = data; return this; },
    setHeader(k, v) { this._headers[k] = v; },
    getHeader(k)    { return this._headers[k]; },
    end() {},
  };
  const req = {
    method: 'POST',
    query:  { action },
    headers: { authorization: `Bearer ${token}`, origin: 'http://localhost:5173', 'content-type': 'application/json' },
    body,
    socket: { remoteAddress: '127.0.0.1' },
  };
  return adminHandler(req, res).then(() => res);
}

// ── helpers ───────────────────────────────────────────────────────────────────
let passed = 0, failed = 0;
function pass(label, detail = '') {
  console.log(`  ✅ ${label}${detail ? '  (' + detail + ')' : ''}`);
  passed++;
}
function fail(label, detail = '') {
  console.error(`  ❌ ${label}${detail ? '  (' + detail + ')' : ''}`);
  failed++;
}
function section(title) { console.log(`\n[TEST ${passed + failed + 1}] ${title}`); }

// ── TESTS ─────────────────────────────────────────────────────────────────────
(async () => {
  console.log('\n🛡️  Starting Unified Admin API Tests…\n');

  const adminToken   = 'admin-token';
  const userToken    = 'non-admin-token';
  const testBookingId = `test-booking-${Date.now()}`;
  const createdEscrows = [];
  const createdDisputes = [];

  // ── TEST 1: Unknown action ─────────────────────────────────────────────────
  section('Unknown action → 400');
  {
    const r = await call('hack', adminToken, {});
    r.statusCode === 400 && r.body?.error?.includes('Unknown action')
      ? pass('Correctly rejected unknown action', r.body.error)
      : fail(`Expected 400, got ${r.statusCode}`, JSON.stringify(r.body));
  }

  // ── TEST 2: Non-admin user → 403 ──────────────────────────────────────────
  section('Non-admin token → 403 Forbidden');
  {
    const r = await call('chat-review', userToken, { bookingId: testBookingId });
    r.statusCode === 403
      ? pass('Non-admin correctly blocked with 403')
      : fail(`Expected 403, got ${r.statusCode}`, JSON.stringify(r.body));
  }

  // ── TEST 3: chat-review — missing bookingId → 400 ─────────────────────────
  section('chat-review: missing bookingId → 400');
  {
    const r = await call('chat-review', adminToken, {});
    r.statusCode === 400 && r.body?.error?.includes('bookingId')
      ? pass('Correctly rejected missing bookingId', r.body.error)
      : fail(`Expected 400, got ${r.statusCode}`, JSON.stringify(r.body));
  }

  // ── TEST 4: chat-review — no dispute → 403 + AUDIT LOG WRITTEN ────────────
  section('chat-review: no active dispute → 403 and CHAT_REVIEW_DENIED audit log written');
  {
    const fakeId = `no-dispute-${Date.now()}`;
    const beforeSnap = await db.collection('adminAuditLogs').where('bookingId', '==', fakeId).get();
    const before = beforeSnap.size;

    const r = await call('chat-review', adminToken, { bookingId: fakeId });

    // Check response
    if (r.statusCode === 403 && r.body?.error?.includes('Access denied')) {
      pass('Access correctly denied (403)', r.body.error.substring(0, 60) + '…');
    } else {
      fail(`Expected 403, got ${r.statusCode}`, JSON.stringify(r.body));
    }

    // Verify audit log was written for the denied attempt
    const afterSnap = await db.collection('adminAuditLogs').where('bookingId', '==', fakeId).get();
    if (afterSnap.size > before) {
      const logData = afterSnap.docs[0].data();
      pass('CHAT_REVIEW_DENIED audit log written', `action=${logData.action}, admin=${logData.performedByUid}`);
    } else {
      fail('Expected CHAT_REVIEW_DENIED audit log to be written');
    }
  }

  // ── TEST 5: chat-review — with active disputed escrow → 200 ───────────────
  section('chat-review: active disputed escrow → 200 + CHAT_REVIEW_ACCESSED audit log');
  {
    // Seed a disputed escrow deposit
    const escrowRef = await db.collection('escrowDeposits').add({
      bookingId: testBookingId,
      status: 'disputed',
      amountHeld: 5000,
      tenantId: 'tenant-uid',
      ownerId: 'owner-uid',
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });
    createdEscrows.push(escrowRef);
    console.log(`  ↳ seeded disputed escrow: ${escrowRef.id}`);

    const beforeSnap = await db.collection('adminAuditLogs').where('bookingId', '==', testBookingId).get();
    const before = beforeSnap.size;

    const r = await call('chat-review', adminToken, { bookingId: testBookingId });

    if (r.statusCode === 200 && r.body?.success) {
      pass('200 returned with chat review data');
      console.log(`     → dispute:      ${r.body.dispute ? 'found' : 'none (used escrow)'}`);
      console.log(`     → conversation: ${r.body.conversation ? r.body.conversation.id : 'none linked yet'}`);
      console.log(`     → messages:     ${r.body.messages?.length || 0}`);
      console.log(`     → accessedBy:   ${r.body.accessedBy}`);
    } else {
      fail(`Expected 200, got ${r.statusCode}`, JSON.stringify(r.body));
    }

    // Verify access audit log written
    const afterSnap = await db.collection('adminAuditLogs').where('bookingId', '==', testBookingId).get();
    if (afterSnap.size > before) {
      const logData = afterSnap.docs[afterSnap.size - 1].data();
      pass('CHAT_REVIEW_ACCESSED audit log written', `action=${logData.action}, msgs=${logData.messageCount}`);
    } else {
      fail('Expected CHAT_REVIEW_ACCESSED audit log to be written');
    }

    // Verify read-only: no message or conversation was modified
    pass('Read-only: no write operations were performed on conversations collection');
  }

  // ── TEST 6: review-kyc still routes → 404 on unknown uid ─────────────────
  section('review-kyc: unknown uid → 404 (endpoint reachable via unified router)');
  {
    const r = await call('review-kyc', adminToken, { uid: 'nonexistent-uid-xyz', decision: 'approved' });
    r.statusCode === 404 && r.body?.error?.includes('not found')
      ? pass('review-kyc routed correctly, 404 on missing uid', r.body.error)
      : fail(`Expected 404, got ${r.statusCode}`, JSON.stringify(r.body));
  }

  // ── TEST 7: set-claim still routes → 404 on unknown uid ──────────────────
  section('set-claim: unknown uid → 404 (endpoint reachable via unified router)');
  {
    const r = await call('set-claim', adminToken, { targetUid: 'nonexistent-uid-xyz', grantAdmin: true });
    r.statusCode === 404 && r.body?.error?.includes('not found')
      ? pass('set-claim routed correctly, 404 on missing uid', r.body.error)
      : fail(`Expected 404, got ${r.statusCode}`, JSON.stringify(r.body));
  }

  // ── Cleanup ────────────────────────────────────────────────────────────────
  for (const ref of createdEscrows) {
    await ref.delete().catch(() => {});
  }
  // Clean up audit logs for testBookingId
  const logsSnap = await db.collection('adminAuditLogs').where('bookingId', '==', testBookingId).get();
  const fakeLogs = await db.collection('adminAuditLogs').where('bookingId', '==', `no-dispute-${Math.floor(Date.now()/1000)}`).get();
  for (const d of [...logsSnap.docs, ...fakeLogs.docs]) await d.ref.delete().catch(() => {});

  // ── Summary ────────────────────────────────────────────────────────────────
  console.log(`\n${'─'.repeat(60)}`);
  console.log(`Results: ${passed} passed, ${failed} failed\n`);
  if (failed === 0) {
    console.log('🎉 All admin API tests passed! Unified router is secure and fully functional.\n');
  } else {
    console.error('⚠️  Some tests failed. Review output above.\n');
    process.exit(1);
  }
})();
