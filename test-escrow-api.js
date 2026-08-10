import dotenv from 'dotenv';
dotenv.config();

import { db, auth, admin } from './api/_lib/firebase-admin.js';
import escrowHandler from './api/escrow.js';

// Mock verifyIdToken so we don't need real Google JWTs
auth.verifyIdToken = async (token) => {
    if (token === 'admin-123') return { uid: token, email: 'admin@anylet.com', admin: true };
    return { uid: token, email: `${token}@anylet.com`, admin: false };
};
// Mock getUser for admin double-check
auth.getUser = async (uid) => {
    if (uid === 'admin-123') return { customClaims: { admin: true } };
    return { customClaims: {} };
};

// Helper: call the unified handler with a simulated request
function call(action, uid, body) {
    const res = {
        statusCode: 200, body: null, headers: {},
        status(code) { this.statusCode = code; return this; },
        json(data)   { this.body = data; return this; },
        setHeader(k, v) { this.headers[k] = v; },
        end() {}
    };
    const req = {
        method: 'POST',
        query: { action },
        headers: { authorization: `Bearer ${uid}`, origin: 'http://localhost:5173' },
        body,
        socket: { remoteAddress: '127.0.0.1' }
    };
    return escrowHandler(req, res).then(() => res);
}

async function runTests() {
    console.log("🚀 Starting Unified Escrow API Integration Tests...\n");

    const tenantId = 'test-tenant-uid';
    const ownerId  = 'test-owner-uid';
    const adminId  = 'admin-123';

    // Hard-reset test users (no merge — ensure wallet starts at 0)
    await db.collection('users').doc(ownerId).set({ referralWallet: { available: 0 } });
    await db.collection('users').doc(tenantId).set({ referralWallet: { available: 0 } });

    // ─── TEST 1: Dual-confirmation auto-release ───────────────────────────────
    console.log("[TEST 1] Dual-Confirmation Auto-Release");
    const ref1 = db.collection('escrowDeposits').doc();
    await ref1.set({ tenantId, ownerId, amount: 10000, status: 'held', createdAt: admin.firestore.Timestamp.now() });
    console.log("  ↳ escrow created:", ref1.id);

    const r1 = await call('confirm', tenantId, { bookingId: ref1.id });
    console.log("  Tenant confirm →", r1.statusCode, r1.body);
    if (r1.statusCode !== 200 || r1.body.status !== 'held') throw new Error("Tenant confirm failed");

    const r2 = await call('confirm', ownerId, { bookingId: ref1.id });
    console.log("  Owner confirm  →", r2.statusCode, r2.body);
    if (r2.statusCode !== 200 || r2.body.status !== 'released') throw new Error("Auto-release failed");

    const ownerWallet = (await db.collection('users').doc(ownerId).get()).data().referralWallet.available;
    console.log(`  💰 Owner wallet: ৳${ownerWallet}  (expected 9500 = 10000 × 95%)\n`);
    if (ownerWallet !== 9500) throw new Error(`Wallet mismatch: got ${ownerWallet}, want 9500`);

    // ─── TEST 2: Double-confirm guard ─────────────────────────────────────────
    console.log("[TEST 2] Double-Confirm Guard");
    const r3 = await call('confirm', tenantId, { bookingId: ref1.id });
    console.log("  Re-confirm attempt →", r3.statusCode, r3.body?.error);
    if (r3.statusCode !== 400) throw new Error("Should have rejected double-confirm");
    console.log("  ✅ Correctly rejected\n");

    // ─── TEST 3: Dispute + Admin force-refund ─────────────────────────────────
    console.log("[TEST 3] Dispute & Admin Force Refund");
    const ref2 = db.collection('escrowDeposits').doc();
    await ref2.set({ tenantId, ownerId, amount: 5000, status: 'held', createdAt: admin.firestore.Timestamp.now() });
    console.log("  ↳ escrow created:", ref2.id);

    const r4 = await call('dispute', tenantId, { bookingId: ref2.id, reason: "Property was not as described, owner did not show up." });
    console.log("  Dispute raised  →", r4.statusCode, r4.body);
    if (r4.statusCode !== 200) throw new Error("Dispute failed");

    const r5 = await call('admin-action', adminId, { bookingId: ref2.id, action: 'refund', reason: "Investigated. Tenant claim is valid." });
    console.log("  Admin refund    →", r5.statusCode, r5.body);
    if (r5.statusCode !== 200) throw new Error("Admin refund failed");

    const tenantWallet = (await db.collection('users').doc(tenantId).get()).data().referralWallet.available;
    console.log(`  💸 Tenant wallet: ৳${tenantWallet}  (expected 5000 = full refund)\n`);
    if (tenantWallet !== 5000) throw new Error(`Wallet mismatch: got ${tenantWallet}, want 5000`);

    // ─── TEST 4: Unauthorized action guard ────────────────────────────────────
    console.log("[TEST 4] Unauthorized User Guard");
    const ref3 = db.collection('escrowDeposits').doc();
    await ref3.set({ tenantId: 'someone-else', ownerId: 'another-owner', amount: 1000, status: 'held', createdAt: admin.firestore.Timestamp.now() });
    const r6 = await call('confirm', tenantId, { bookingId: ref3.id });
    console.log("  Unrelated confirm →", r6.statusCode, r6.body?.error);
    if (r6.statusCode !== 403) throw new Error("Should have returned 403 Forbidden");
    console.log("  ✅ Correctly rejected\n");

    // ─── TEST 5: Unknown action guard ────────────────────────────────────────
    console.log("[TEST 5] Unknown Action Guard");
    const r7 = await call('hack', tenantId, { bookingId: ref3.id });
    console.log("  Unknown action  →", r7.statusCode, r7.body?.error);
    if (r7.statusCode !== 400) throw new Error("Should have returned 400 for unknown action");
    console.log("  ✅ Correctly rejected\n");

    console.log("🎉 All 5 tests passed! The unified escrow API is secure and fully functional.");
    process.exit(0);
}

runTests().catch((err) => { console.error("❌ Test failed:", err.message); process.exit(1); });
