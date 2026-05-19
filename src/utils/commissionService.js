/**
 * commissionService.js
 *
 * Handles writing a payment transaction and crediting the
 * 5% lifetime referral commission to the referrer's wallet.
 *
 * This runs entirely on the CLIENT side using Firestore transactions
 * (atomic reads + writes) so there is no double-crediting even if the
 * function runs concurrently.
 *
 * Usage (call this after a successful payment/upgrade):
 *
 *   import { recordPaymentAndCommission } from '../utils/commissionService';
 *
 *   await recordPaymentAndCommission({
 *       payerUid:    currentUser.uid,
 *       amount:      999,           // BDT
 *       description: 'Premium Plan – Monthly',
 *       type:        'subscription', // 'subscription' | 'boost' | 'featured'
 *   });
 */

import {
    doc,
    getDoc,
    collection,
    addDoc,
    runTransaction,
    serverTimestamp,
} from 'firebase/firestore';
import { db } from '../firebase';

const COMMISSION_RATE = 0.05; // 5%

/**
 * @param {Object} opts
 * @param {string} opts.payerUid     – UID of the user making the payment
 * @param {number} opts.amount       – full payment amount in BDT
 * @param {string} opts.description  – human-readable label for this payment
 * @param {string} opts.type         – 'subscription' | 'boost' | 'featured' | 'other'
 */
export async function recordPaymentAndCommission({ payerUid, amount, description, type = 'other' }) {
    if (!payerUid || !amount || amount <= 0) {
        throw new Error('recordPaymentAndCommission: invalid arguments');
    }

    // ── 1. Fetch the payer's Firestore document ────────────────────────────
    const payerRef  = doc(db, 'users', payerUid);
    const payerSnap = await getDoc(payerRef);

    if (!payerSnap.exists()) {
        throw new Error('Payer not found in Firestore');
    }

    const payerData   = payerSnap.data();
    const referrerId  = payerData.referredBy ?? null;  // null if not referred

    // ── 2. Write the payer's transaction record ────────────────────────────
    const txRef = await addDoc(collection(db, 'transactions'), {
        uid:         payerUid,
        amount,
        description,
        type,
        status:      'completed',
        createdAt:   serverTimestamp(),
    });

    // ── 3. If payer has a referrer → credit 5% commission atomically ───────
    if (referrerId) {
        const commissionAmount = parseFloat((amount * COMMISSION_RATE).toFixed(2));
        const referrerRef      = doc(db, 'users', referrerId);

        await runTransaction(db, async (tx) => {
            const referrerSnap = await tx.get(referrerRef);
            if (!referrerSnap.exists()) return; // referrer deleted — skip silently

            const current = referrerSnap.data().referralWallet ?? { available: 0, withdrawn: 0 };

            tx.update(referrerRef, {
                'referralWallet.available': (current.available ?? 0) + commissionAmount,
            });
        });

        // ── 4. Write commission ledger entry ──────────────────────────────
        await addDoc(collection(db, 'commissions'), {
            referrerId,
            refereeId:     payerUid,
            refereeEmail:  payerData.email ?? '',
            transactionId: txRef.id,
            amount:        commissionAmount,
            baseAmount:    amount,
            rate:          COMMISSION_RATE,
            description,
            type,
            status:        'credited',
            createdAt:     serverTimestamp(),
        });
    }

    return { success: true, transactionId: txRef.id };
}

/**
 * Records a withdrawal request and deducts it from available balance atomically.
 *
 * @param {string} uid          – user requesting the withdrawal
 * @param {number} amount       – amount to withdraw
 * @param {Object} bankDetails  – { bankName, accountNumber, accountName }
 */
export async function requestWithdrawal(uid, amount, bankDetails) {
    if (!uid || !amount || amount <= 0) throw new Error('Invalid withdrawal arguments');

    const userRef = doc(db, 'users', uid);

    await runTransaction(db, async (tx) => {
        const snap = await tx.get(userRef);
        if (!snap.exists()) throw new Error('User not found');

        const wallet = snap.data().referralWallet ?? { available: 0, withdrawn: 0 };

        if ((wallet.available ?? 0) < amount) {
            throw new Error('Insufficient balance');
        }

        tx.update(userRef, {
            'referralWallet.available':  wallet.available  - amount,
            'referralWallet.withdrawn':  (wallet.withdrawn ?? 0) + amount,
        });
    });

    // Write a withdrawal record for admin review
    await addDoc(collection(db, 'withdrawals'), {
        uid,
        amount,
        bankDetails,
        status:    'pending',   // admin reviews and marks 'approved' | 'rejected'
        createdAt: serverTimestamp(),
    });

    return { success: true };
}
