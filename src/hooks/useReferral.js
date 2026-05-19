/**
 * useReferral.js
 *
 * Provides real-time referral stats for the logged-in user:
 *   - Their own referral code & shareable link
 *   - List of referred users (referees)
 *   - Total earnings, available (withdrawable) balance, and withdrawal history
 *
 * All data comes directly from Firestore with live onSnapshot listeners,
 * so the UI updates the moment anything changes in the database.
 */

import { useState, useEffect } from 'react';
import {
    doc, collection, query, where,
    onSnapshot, getDocs
} from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../contexts/AuthContext';
import {
    generateReferralCode,
    getReferralLink
} from '../utils/referral';

export function useReferral() {
    const { currentUser } = useAuth();

    const [referralCode, setReferralCode]         = useState('');
    const [referralLink, setReferralLink]         = useState('');
    const [referees, setReferees]                 = useState([]);
    const [commissions, setCommissions]           = useState([]);
    const [totalEarned, setTotalEarned]           = useState(0);
    const [availableBalance, setAvailableBalance] = useState(0);
    const [withdrawn, setWithdrawn]               = useState(0);
    const [loading, setLoading]                   = useState(true);

    // ── 1. Derive referral code from email ──────────────────────────────────
    useEffect(() => {
        if (!currentUser?.email) return;
        const code = generateReferralCode(currentUser.email);
        setReferralCode(code);
        setReferralLink(getReferralLink(code));
    }, [currentUser]);

    // ── 2. Live-listen to user doc for wallet balances ──────────────────────
    useEffect(() => {
        if (!currentUser?.uid) { setLoading(false); return; }

        const userRef = doc(db, 'users', currentUser.uid);
        const unsubUser = onSnapshot(userRef, (snap) => {
            if (snap.exists()) {
                const d = snap.data();
                setAvailableBalance(d.referralWallet?.available ?? 0);
                setWithdrawn(d.referralWallet?.withdrawn ?? 0);
            }
        });

        return () => unsubUser();
    }, [currentUser]);

    // ── 3. Live-listen to referees (users who signed up via this user's code) ─
    useEffect(() => {
        if (!currentUser?.uid) return;

        const refereesQ = query(
            collection(db, 'users'),
            where('referredBy', '==', currentUser.uid)
        );

        const unsubReferees = onSnapshot(refereesQ, (snap) => {
            setReferees(snap.docs.map(d => ({ id: d.id, ...d.data() })));
        });

        return () => unsubReferees();
    }, [currentUser]);

    // ── 4. Live-listen to commissions ledger for this referrer ───────────────
    useEffect(() => {
        if (!currentUser?.uid) return;

        const comQ = query(
            collection(db, 'commissions'),
            where('referrerId', '==', currentUser.uid)
        );

        const unsubCom = onSnapshot(comQ, (snap) => {
            const rows = snap.docs.map(d => ({ id: d.id, ...d.data() }));
            setCommissions(rows);

            // Recalculate total earned from all commission records
            const total = rows.reduce((sum, r) => sum + (r.amount ?? 0), 0);
            setTotalEarned(total);
            setLoading(false);
        }, () => setLoading(false));

        return () => unsubCom();
    }, [currentUser]);

    return {
        referralCode,
        referralLink,
        referees,
        commissions,
        totalEarned,
        availableBalance,
        withdrawn,
        loading,
    };
}
