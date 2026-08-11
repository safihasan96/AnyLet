import { useEffect, useState } from 'react';
import { collection, onSnapshot, query, orderBy, limit } from 'firebase/firestore';
import { db } from '../firebase';
import QUERY_LIMITS from '../config/queryLimits';
import logger from '../utils/logger';

/**
 * useAdminData — centralizes every real-time Firestore listener the admin panel
 * needs, plus the derived platform stats. Extracted verbatim from AdminPanel so
 * the panel can stay a thin presentational shell.
 *
 * Returns the raw collections, the computed `stats`, a `loadingStats` flag, and
 * the `propertiesLimit` controls used for the properties "Load More" pagination.
 */
export default function useAdminData() {
    const [users, setUsers] = useState([]);
    const [listings, setListings] = useState([]);
    const [enquiries, setEnquiries] = useState([]);
    const [reports, setReports] = useState([]);
    const [payments, setPayments] = useState([]);
    const [webhookTxns, setWebhookTxns] = useState([]);
    const [escrowDeposits, setEscrowDeposits] = useState([]);
    const [loadingStats, setLoadingStats] = useState(true);
    const [propertiesLimit, setPropertiesLimit] = useState(QUERY_LIMITS.ADMIN_PROPERTIES);
    const [stats, setStats] = useState({
        totalUsers: 0,
        totalListings: 0,
        pendingRequests: 0,
        verifiedListings: 0,
        verifiedLandlords: 0,
        successfulMoveIns: 0,
        monthlyRevenue: 0,
    });

    /* ── Real-time listeners ────────────────────────────────────────────────── */
    useEffect(() => {
        setLoadingStats(true);

        // Users
        const unsubUsers = onSnapshot(
            query(collection(db, 'users'), orderBy('createdAt', 'desc'), limit(QUERY_LIMITS.ADMIN_USERS)),
            snap => {
                const list = snap.docs.map(d => ({ id: d.id, ...d.data() }));
                setUsers(list);
                setStats(p => ({
                    ...p,
                    totalUsers: snap.size,
                    verifiedLandlords: list.filter(u => u.role === 'owner' && u.isVerified).length,
                }));
            });

        // Leads / viewing requests (list value unused — only feeds pendingRequests)
        const unsubLeads = onSnapshot(
            query(collection(db, 'viewing_requests'), orderBy('createdAt', 'desc'), limit(QUERY_LIMITS.ADMIN_REQUESTS)),
            snap => {
                const list = snap.docs.map(d => ({ id: d.id, ...d.data() }));
                setStats(p => ({ ...p, pendingRequests: list.filter(r => r.status === 'pending').length }));
                setLoadingStats(false);
            }, err => {
                logger.error('FIRESTORE (viewing_requests):', err.message);
                setLoadingStats(false);
            });

        // Enquiries
        const unsubEnquiries = onSnapshot(
            query(collection(db, 'enquiries'), orderBy('createdAt', 'desc'), limit(QUERY_LIMITS.ADMIN_ENQUIRIES)),
            snap => {
                setEnquiries(snap.docs.map(d => ({ id: d.id, ...d.data() })));
            }, err => logger.error('FIRESTORE (enquiries):', err.message));

        // Reports
        const unsubReports = onSnapshot(
            query(collection(db, 'reports'), orderBy('createdAt', 'desc'), limit(QUERY_LIMITS.ADMIN_REPORTS)),
            snap => {
                setReports(snap.docs.map(d => ({ id: d.id, ...d.data() })));
            }, err => logger.error('FIRESTORE (reports):', err.message));

        // Payments
        const unsubPayments = onSnapshot(
            query(collection(db, 'payments'), orderBy('createdAt', 'desc'), limit(QUERY_LIMITS.ADMIN_PAYMENTS)),
            snap => {
                const list = snap.docs.map(d => ({ id: d.id, ...d.data() }));
                list.sort((a, b) => (b.createdAt?.toMillis() || 0) - (a.createdAt?.toMillis() || 0));
                setPayments(list);
            });

        // Escrow Deposits
        const unsubEscrow = onSnapshot(
            query(collection(db, 'escrowDeposits'), orderBy('createdAt', 'desc'), limit(QUERY_LIMITS.ADMIN_ESCROW || 50)),
            snap => {
                const list = snap.docs.map(d => ({ id: d.id, ...d.data() }));
                list.sort((a, b) => (b.createdAt?.toMillis() || 0) - (a.createdAt?.toMillis() || 0));
                setEscrowDeposits(list);
            });

        // Webhook Txns
        const unsubWebhookTxns = onSnapshot(
            query(collection(db, 'unclaimed_transactions'), orderBy('receivedAt', 'desc'), limit(QUERY_LIMITS.ADMIN_PAYMENTS || 100)),
            snap => {
                setWebhookTxns(snap.docs.map(d => ({ id: d.id, ...d.data() })));
            });

        return () => { unsubUsers(); unsubLeads(); unsubEnquiries(); unsubReports(); unsubPayments(); unsubEscrow(); unsubWebhookTxns(); };
    }, []);

    // Revenue + move-ins are derived from payments + escrow deposits
    useEffect(() => {
        let rev = 0;
        payments.forEach(p => {
            if (p.status === 'completed') rev += Number(p.amount) || 0;
        });

        let moveIns = 0;
        escrowDeposits.forEach(e => {
            if (e.status === 'released') {
                moveIns++;
                rev += (Number(e.amount) || 0) * 0.01; // 1% deduction
            }
        });

        setStats(p => ({ ...p, monthlyRevenue: rev, successfulMoveIns: moveIns }));
    }, [payments, escrowDeposits]);

    // Separate properties listener to support 'Load More' pagination
    useEffect(() => {
        const unsubListings = onSnapshot(
            query(collection(db, 'properties'), orderBy('createdAt', 'desc'), limit(propertiesLimit)),
            snap => {
                const list = snap.docs.map(d => ({ id: d.id, ...d.data() }));
                setListings(list);
                setStats(p => ({
                    ...p,
                    totalListings: snap.size,
                    verifiedListings: list.filter(l => l.isVerified || l.verificationStatus === 'verified').length,
                }));
            },
            err => logger.error('FIRESTORE (properties):', err.message)
        );
        return () => unsubListings();
    }, [propertiesLimit]);

    return {
        users, listings, enquiries, reports, payments, webhookTxns, escrowDeposits,
        stats, loadingStats, propertiesLimit, setPropertiesLimit,
    };
}
