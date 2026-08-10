/**
 * api/escrow.js — Unified Escrow Endpoint
 *
 * Routes:
 *   POST /api/escrow?action=confirm      → Tenant or Owner confirms move-in
 *   POST /api/escrow?action=dispute      → Tenant or Owner raises a dispute
 *   POST /api/escrow?action=admin-action → Admin force-releases or force-refunds
 *
 * Collapses three separate Vercel functions into one to stay within the Hobby
 * plan's 12-function limit while keeping all auth, rate-limiting, and CORS
 * behaviour identical to the original per-file implementation.
 */

import { db, auth } from './_lib/firebase-admin.js';
import { Timestamp } from 'firebase-admin/firestore';
import { withMiddleware } from './_lib/middleware.js';
import { getPlatformFees } from './_lib/feeCalculator.js';

/**
 * Reads the escrow-specific release fee from Firestore.
 * Falls back to 5% if the field is absent so a mis-config never causes
 * 50% listing commissions to be accidentally applied to tenant deposits.
 */
async function getEscrowFeeRate() {
    try {
        const fees = await getPlatformFees();
        // Prefer a dedicated escrow key; fall back to 5 % hard-coded
        const rate = fees?.escrowReleaseFee?.value ?? fees?.escrowCommissionRate?.value ?? 0.05;
        const parsed = Number(rate);
        if (isNaN(parsed) || parsed < 0 || parsed >= 1) return 0.05; // sanity guard
        return parsed;
    } catch {
        console.warn('[escrow] Could not fetch platform fees, defaulting to 5%');
        return 0.05;
    }
}

async function handleConfirm(req, res) {
    const { bookingId, evidence } = req.body || {};
    const uid = req.user.uid;

    if (!bookingId || typeof bookingId !== 'string') {
        return res.status(400).json({ error: 'bookingId is required' });
    }

    // Fetch fee schedule BEFORE the transaction (no async I/O inside tx writes)
    const commissionRate = await getEscrowFeeRate();

    let isReleased = false;
    let finalStatus = 'held';

    try {
        await db.runTransaction(async (tx) => {
            // ── ALL READS FIRST ──────────────────────────────────────────────
            const escrowRef = db.collection('escrowDeposits').doc(bookingId);
            const escrowSnap = await tx.get(escrowRef);

            if (!escrowSnap.exists) throw Object.assign(new Error('Escrow record not found'), { statusCode: 404 });

            const data = escrowSnap.data();

            if (data.status !== 'held')
                throw Object.assign(new Error(`Cannot confirm. Escrow is currently: ${data.status}`), { statusCode: 400 });

            const isTenant = data.tenantId === uid;
            const isOwner  = data.ownerId  === uid;

            if (!isTenant && !isOwner)
                throw Object.assign(new Error('Unauthorized to confirm this escrow'), { statusCode: 403 });

            if (isTenant && data.confirmedByTenant)
                throw Object.assign(new Error('Tenant has already confirmed'), { statusCode: 400 });

            if (isOwner && data.confirmedByOwner)
                throw Object.assign(new Error('Owner has already confirmed'), { statusCode: 400 });

            const tenantConfirmed = isTenant ? true : !!data.confirmedByTenant;
            const ownerConfirmed  = isOwner  ? true : !!data.confirmedByOwner;
            const willRelease     = tenantConfirmed && ownerConfirmed;

            let ownerRef  = null;
            let ownerSnap = null;
            if (willRelease && data.ownerId) {
                ownerRef  = db.collection('users').doc(data.ownerId);
                ownerSnap = await tx.get(ownerRef);
            }

            // ── ALL WRITES ──────────────────────────────────────────────────
            const now     = Timestamp.now();
            const updates = {};

            // Immutable confirmation sub-document
            const logRef = escrowRef.collection('confirmations').doc();
            tx.set(logRef, { uid, role: isTenant ? 'tenant' : 'owner', evidence: evidence || null, confirmedAt: now });

            if (isTenant) { updates.confirmedByTenant = true; updates.tenantConfirmedAt = now; }
            if (isOwner)  { updates.confirmedByOwner  = true; updates.ownerConfirmedAt  = now; }

            if (willRelease) {
                isReleased   = true;
                finalStatus  = 'released';
                const grossAmount = Number(data.amount) || 0;
                const commission  = grossAmount * commissionRate;
                const netRelease  = grossAmount - commission;

                Object.assign(updates, {
                    status:    'released',
                    releasedAt: now,
                    auditLog:  `Dual-confirmed and auto-released at ${new Date().toISOString()} (commission: ${(commissionRate * 100).toFixed(1)}%)`
                });

                if (ownerSnap?.exists) {
                    const wallet = ownerSnap.data().referralWallet ?? { available: 0 };
                    tx.update(ownerRef, { 'referralWallet.available': (wallet.available ?? 0) + netRelease });

                    const txnRef = db.collection('transactions').doc();
                    tx.set(txnRef, {
                        uid: data.ownerId, bookingId,
                        type: 'escrow_release',
                        grossAmount, commission, netAmount: netRelease,
                        createdAt: now
                    });
                }
            }

            tx.update(escrowRef, updates);
        });

        return res.status(200).json({
            success: true,
            status:  finalStatus,
            message: isReleased ? 'Escrow successfully released to owner.' : 'Confirmation recorded.'
        });
    } catch (err) {
        const code = err.statusCode || 500;
        if (code >= 500) console.error('[escrow/confirm] Error:', err);
        return res.status(code).json({ error: err.message || 'Internal server error' });
    }
}

// ─── Handler: raise dispute ──────────────────────────────────────────────────
async function handleDispute(req, res) {
    const { bookingId, reason } = req.body || {};
    const uid = req.user.uid;

    if (!bookingId || typeof bookingId !== 'string')
        return res.status(400).json({ error: 'bookingId is required' });

    if (!reason || typeof reason !== 'string' || reason.length < 10)
        return res.status(400).json({ error: 'A valid reason of at least 10 characters is required.' });

    try {
        await db.runTransaction(async (tx) => {
            const escrowRef  = db.collection('escrowDeposits').doc(bookingId);
            const escrowSnap = await tx.get(escrowRef);

            if (!escrowSnap.exists) throw Object.assign(new Error('Escrow record not found'), { statusCode: 404 });

            const data = escrowSnap.data();

            if (data.status !== 'held')
                throw Object.assign(new Error(`Cannot dispute. Escrow is currently: ${data.status}`), { statusCode: 400 });

            const isTenant = data.tenantId === uid;
            const isOwner  = data.ownerId  === uid;

            if (!isTenant && !isOwner)
                throw Object.assign(new Error('Unauthorized to dispute this escrow'), { statusCode: 403 });

            const now = Timestamp.now();

            tx.update(escrowRef, {
                status:      'disputed',
                disputedBy:  uid,
                disputedAt:  now,
                auditLog:    `Dispute raised by ${isTenant ? 'tenant' : 'owner'} at ${new Date().toISOString()}`
            });

            const disputeRef = db.collection('disputes').doc();
            tx.set(disputeRef, {
                bookingId,
                escrowId:    bookingId,
                raisedBy:    uid,
                role:        isTenant ? 'tenant' : 'owner',
                reason,
                status:      'open',
                createdAt:   now,
                propertyId:  data.propertyId || null,
                amountHeld:  data.amount || 0
            });
        });

        return res.status(200).json({ success: true, message: 'Dispute raised successfully. Funds have been frozen.' });
    } catch (err) {
        const code = err.statusCode || 500;
        if (code >= 500) console.error('[escrow/dispute] Error:', err);
        return res.status(code).json({ error: err.message || 'Internal server error' });
    }
}

// ─── Handler: admin force action ─────────────────────────────────────────────
async function handleAdminAction(req, res) {
    const { bookingId, action, reason } = req.body || {};
    const adminUid = req.user.uid;

    if (!bookingId || typeof bookingId !== 'string')
        return res.status(400).json({ error: 'bookingId is required' });

    if (!['release', 'refund'].includes(action))
        return res.status(400).json({ error: 'action must be "release" or "refund"' });

    if (!reason || typeof reason !== 'string' || reason.length < 5)
        return res.status(400).json({ error: 'A valid reason is required for admin actions.' });

    // Verify admin claim — extra layer beyond middleware requireAdmin flag
    const adminToken = await auth.getUser(adminUid).catch(() => null);
    if (!adminToken?.customClaims?.admin && req.user.role !== 'admin') {
        return res.status(403).json({ error: 'Forbidden: admin privilege required' });
    }

    // Fetch fee schedule before transaction
    const commissionRate = await getEscrowFeeRate();

    try {
        await db.runTransaction(async (tx) => {
            // ── ALL READS FIRST ──────────────────────────────────────────────
            const escrowRef  = db.collection('escrowDeposits').doc(bookingId);
            const escrowSnap = await tx.get(escrowRef);

            if (!escrowSnap.exists) throw Object.assign(new Error('Escrow record not found'), { statusCode: 404 });

            const data = escrowSnap.data();

            if (['released', 'refunded'].includes(data.status))
                throw Object.assign(new Error(`Escrow is already ${data.status}.`), { statusCode: 400 });

            let walletRef  = null;
            let walletSnap = null;

            if (action === 'release' && data.ownerId) {
                walletRef  = db.collection('users').doc(data.ownerId);
                walletSnap = await tx.get(walletRef);
            } else if (action === 'refund' && data.tenantId) {
                walletRef  = db.collection('users').doc(data.tenantId);
                walletSnap = await tx.get(walletRef);
            }

            const disputesSnap = await tx.get(
                db.collection('disputes')
                    .where('bookingId', '==', bookingId)
                    .where('status',    '==', 'open')
            );

            // ── ALL WRITES ──────────────────────────────────────────────────
            const now     = Timestamp.now();
            const updates = {
                status:             action === 'release' ? 'released' : 'refunded',
                [`${action}At`]:   now,
                auditLog:          `Admin forced ${action} at ${new Date().toISOString()}. Reason: ${reason}. AdminUID: ${adminUid}`
            };

            const grossAmount = Number(data.amount) || 0;

            if (action === 'release') {
                const commission = grossAmount * commissionRate;
                const netRelease = grossAmount - commission;

                if (walletSnap?.exists) {
                    const wallet = walletSnap.data().referralWallet ?? { available: 0 };
                    tx.update(walletRef, { 'referralWallet.available': (wallet.available ?? 0) + netRelease });
                    const txnRef = db.collection('transactions').doc();
                    tx.set(txnRef, {
                        uid: data.ownerId, bookingId,
                        type: 'admin_force_release',
                        grossAmount, commission, netAmount: netRelease,
                        createdAt: now, adminId: adminUid
                    });
                }
            } else if (action === 'refund') {
                if (walletSnap?.exists) {
                    const wallet = walletSnap.data().referralWallet ?? { available: 0 };
                    tx.update(walletRef, { 'referralWallet.available': (wallet.available ?? 0) + grossAmount });
                    const txnRef = db.collection('transactions').doc();
                    tx.set(txnRef, {
                        uid: data.tenantId, bookingId,
                        type: 'admin_force_refund',
                        amount: grossAmount,
                        createdAt: now, adminId: adminUid
                    });
                }
            }

            // Auto-resolve any linked disputes
            disputesSnap.forEach(docSnap => {
                tx.update(docSnap.ref, {
                    status:     'resolved',
                    resolvedAt:  now,
                    resolution: `Admin forced ${action}. Reason: ${reason}`
                });
            });

            tx.update(escrowRef, updates);
        });

        return res.status(200).json({
            success: true,
            message: `Escrow successfully ${action === 'release' ? 'released' : 'refunded'} via admin override.`
        });
    } catch (err) {
        const code = err.statusCode || 500;
        if (code >= 500) console.error('[escrow/admin-action] Error:', err);
        return res.status(code).json({ error: err.message || 'Internal server error' });
    }
}

// ─── Route dispatcher ────────────────────────────────────────────────────────
export default withMiddleware(async (req, res) => {
    const action = (req.query?.action || req.body?.routeAction || '').toString().toLowerCase().trim();

    switch (action) {
        case 'confirm':       return handleConfirm(req, res);
        case 'dispute':       return handleDispute(req, res);
        case 'admin-action':  return handleAdminAction(req, res);
        default:
            return res.status(400).json({ error: `Unknown action: "${action}". Use ?action=confirm|dispute|admin-action` });
    }
}, {
    methods:      ['POST'],
    requireAuth:  true,
    requireAdmin: false,   // Per-action admin check is done inside handleAdminAction
    bodyLimit:    '10kb'
});
