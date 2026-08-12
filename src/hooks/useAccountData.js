import { useState, useEffect } from 'react';
import { doc, onSnapshot, collection, query, where, setDoc, getCountFromServer } from 'firebase/firestore';
import { db } from '../firebase';
import logger from '../utils/logger';

/**
 * useAccountData — live profile document (real-time via onSnapshot) plus the
 * user's listing/booking/review counts. Extracted from Account so the page can
 * stay a thin shell.
 *
 * Returns `setUserData`/`setAvatarUrl` too: the shell updates them optimistically
 * after a KYC submission and an avatar upload respectively.
 */
export default function useAccountData(currentUser, navigate) {
    const [userData, setUserData] = useState(() => currentUser ? { fullName: currentUser.displayName, email: currentUser.email } : null);
    const [loading, setLoading] = useState(false);
    const [avatarUrl, setAvatarUrl] = useState(null);
    const [stats, setStats] = useState({ listings: 0, bookings: 0, reviews: 0 });
    const [statsLoading, setStatsLoading] = useState(true);

    /* ── Live Firestore listener — updates profile data instantly ── */
    useEffect(() => {
        if (!currentUser) { navigate('/login'); return; }

        setLoading(true);
        const userRef = doc(db, 'users', currentUser.uid);

        // onSnapshot gives real-time updates without a page reload
        const unsubscribe = onSnapshot(userRef, async (snap) => {
            try {
                let ud = snap.exists()
                    ? { ...snap.data(), email: currentUser.email }
                    : { fullName: currentUser.displayName || '', email: currentUser.email };

                // Bootstrap membership fields if new user
                if (!ud.membershipTier || !ud.membershipLevel) {
                    const defaults = { membershipTier: 'Standard', membershipLevel: 1 };
                    Object.assign(ud, defaults);
                    // Write defaults to Firestore (only if doc exists, avoids creating phantom docs)
                    if (snap.exists()) {
                        await setDoc(userRef, defaults, { merge: true });
                    }
                }

                setUserData(ud);
                if (ud.photoURL) setAvatarUrl(ud.photoURL);
            } catch (err) {
                logger.error('Firestore snapshot error:', err);
            } finally {
                setLoading(false);
            }
        }, (err) => {
            logger.error('Firestore listener error:', err);
            setLoading(false);
        });

        return () => unsubscribe(); // cleanup on unmount
    }, [currentUser, navigate]);

    /* ── Fetch stats separately in background with getCountFromServer ── */
    useEffect(() => {
        if (!currentUser) return;

        let isMounted = true;
        setStatsLoading(true);

        async function fetchStats() {
            try {
                const [listingsCount, bookingsCount, propertyReviewsCount, ownerReviewsCount] = await Promise.all([
                    // 'ownerId' is the exact field saved by AddProperty.jsx — no or() needed, no index required
                    getCountFromServer(query(
                        collection(db, 'properties'),
                        where('ownerId', '==', currentUser.uid)
                    )),
                    getCountFromServer(query(collection(db, 'escrowDeposits'), where('tenantId', '==', currentUser.uid))),
                    getCountFromServer(query(collection(db, 'propertyReviews'), where('reviewerId', '==', currentUser.uid))),
                    getCountFromServer(query(collection(db, 'ownerReviews'), where('reviewerId', '==', currentUser.uid))),
                ]);

                if (isMounted) {
                    setStats({
                        listings: listingsCount.data().count,
                        bookings: bookingsCount.data().count,
                        reviews: propertyReviewsCount.data().count + ownerReviewsCount.data().count,
                    });
                }
            } catch (err) {
                logger.error('Error fetching stats count:', err);
            } finally {
                if (isMounted) {
                    setStatsLoading(false);
                }
            }
        }

        fetchStats();
        return () => { isMounted = false; };
    }, [currentUser]);

    return { userData, setUserData, avatarUrl, setAvatarUrl, loading, stats, statsLoading };
}
