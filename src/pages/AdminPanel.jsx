import { useNavigate, useLocation, Link, Routes, Route } from 'react-router-dom';
import { useState } from 'react';

import { Users, Bell, ChevronRight, Database, Star, FileCheck } from 'lucide-react';
import { collection, updateDoc, deleteDoc, doc, getDoc, getDocs, addDoc, serverTimestamp, setDoc, query, where, limit } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../contexts/AuthContext';
import QUERY_LIMITS from '../config/queryLimits';
import useAdminData from '../hooks/useAdminData';
import ConfirmationModal from '../components/ConfirmationModal';
import { useToast } from '../contexts/ToastContext';
import { createNotification } from '../utils/notificationService';
import { getApiUrl } from '../utils/api';
import AdminReviewsTab from '../components/admin/AdminReviewsTab';
import AdminKycTab from '../components/admin/AdminKycTab';
import AdminClaimsTab from '../components/admin/AdminClaimsTab';
import AdminFeesTab from '../components/admin/AdminFeesTab';
import AdminEnquiriesTab from '../components/admin/AdminEnquiriesTab';
import AdminReportsTab from '../components/admin/AdminReportsTab';
import ListingDetailDrawer from '../components/admin/ListingDetailDrawer';
import AdminPaymentsTab from '../components/admin/AdminPaymentsTab';
import AdminPaymentDetailsTab from '../components/admin/AdminPaymentDetailsTab';
import AdminUsersTab from '../components/admin/AdminUsersTab';
import AdminPropertiesTab from '../components/admin/AdminPropertiesTab';
import AdminOverviewSection from '../components/admin/AdminOverviewSection';
import AdminSidebar from '../components/admin/AdminSidebar';
import UserDetailDrawer from '../components/admin/UserDetailDrawer';
import '../index.css';
import logger from '../utils/logger';


/* ─────────────────────────────────────────────────────────────────────────────
   COMPONENT
───────────────────────────────────────────────────────────────────────────── */
export default function AdminPanel() {
    const { currentUser, logout } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();

    const activeTab = location.pathname.split('/').pop() || 'admin';
    const toast = useToast();

    /* ── Data (real-time listeners + derived stats) ─────────────────────────── */
    const {
        users, listings, enquiries, reports, payments, webhookTxns, escrowDeposits,
        stats, loadingStats, propertiesLimit, setPropertiesLimit,
    } = useAdminData();

    /* ── UI state ──────────────────────────────────────────────────────────── */
    const [isCollapsed, setIsCollapsed] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [listingSearch, setListingSearch] = useState('');
    const [propertiesTab, setPropertiesTab] = useState('pending'); // 'all' | 'pending' | 'approved'
    const [selectedListing, setSelectedListing] = useState(null);
    const [listingOwner, setListingOwner] = useState(null);
    const [ownerLoading, setOwnerLoading] = useState(false);
    const [selectedUser, setSelectedUser] = useState(null);

    const [modal, setModal] = useState({
        isOpen: false, title: '', message: '',
        confirmText: 'Confirm', confirmColor: '#10b981',
        isSuccess: false, isLoading: false, onConfirm: null,
    });
    const closeModal = () => setModal(p => ({ ...p, isOpen: false, isSuccess: false }));
    const showModal = (cfg) => setModal({ ...cfg, isOpen: true, isSuccess: false, isLoading: false });

    /* ── User actions ─────────────────────────────────────────────────────── */
    const handleLogout = async () => {
        try { await logout(); navigate('/login'); } catch (e) { logger.error(e); }
    };

    const handleToggleAdmin = () => {
        // The toggle admin feature is now handled securely in the AdminClaimsTab
        navigate('/admin/claims');
    };

    const handleToggleStatus = user => {
        const active = user.accountStatus !== 'deactivated';
        showModal({
            title: active ? 'Deactivate User' : 'Reactivate User',
            message: active ? `Suspend ${user.email}?` : `Restore ${user.email}?`,
            confirmText: active ? 'Deactivate' : 'Reactivate',
            confirmColor: active ? '#ef4444' : '#10b981',
            onConfirm: async () => {
                setModal(p => ({ ...p, isLoading: true }));
                try {
                    await updateDoc(doc(db, 'users', user.id), { accountStatus: active ? 'deactivated' : 'active' });
                    setModal(p => ({ ...p, isLoading: false, isSuccess: true }));
                    setTimeout(closeModal, 1500);
                } catch (e) { logger.error(e); setModal(p => ({ ...p, isLoading: false, isOpen: false })); }
            }
        });
    };

    const handleDeleteUser = user => {
        showModal({
            title: 'Delete User', message: `Permanently delete ${user.email}?`,
            confirmText: 'Delete Forever', confirmColor: '#dc2626',
            onConfirm: async () => {
                setModal(p => ({ ...p, isLoading: true }));
                try {
                    await deleteDoc(doc(db, 'users', user.id));
                    setModal(p => ({ ...p, isLoading: false, isSuccess: true }));
                    setTimeout(closeModal, 1500);
                } catch (e) { logger.error(e); setModal(p => ({ ...p, isLoading: false, isOpen: false })); }
            }
        });
    };

    /* ── Listing approval ─────────────────────────────────────────────────── */
    const handleApproveListing = async listing => {
        try {
            await updateDoc(doc(db, 'properties', listing.id), { isApproved: true, isActive: true, isRejected: false });
            // Update selectedListing in-place so the drawer reflects approval instantly
            if (selectedListing?.id === listing.id) {
                setSelectedListing(prev => ({ ...prev, isApproved: true, isActive: true, isRejected: false }));
            }

            // Notify owner
            const targetOwner = listing.ownerId || listing.userId;
            if (targetOwner) {
                await createNotification(
                    targetOwner,
                    'property_approved',
                    'Property Approved! 🎉',
                    `Your property "${listing.title}" has been approved and is now live on the platform.`,
                    '/my-listings',
                    { propertyId: listing.id }
                );
            }
            toast.success('Listing approved successfully!');
        } catch (e) { logger.error('Approve listing error:', e); }
    };

    const handleRejectListing = async listing => {
        try {
            await updateDoc(doc(db, 'properties', listing.id), { isApproved: false, isActive: false, isRejected: true });
            if (selectedListing?.id === listing.id) {
                setSelectedListing(prev => ({ ...prev, isApproved: false, isActive: false, isRejected: true }));
            }

            // Notify owner
            const targetOwner = listing.ownerId || listing.userId;
            if (targetOwner) {
                await createNotification(
                    targetOwner,
                    'property_rejected',
                    'Property Rejected ⚠️',
                    `Your property "${listing.title}" has been rejected during review. Please update the details.`,
                    '/my-listings',
                    { propertyId: listing.id }
                );
            }
            toast.success('Listing rejected successfully!');
        } catch (e) { logger.error('Reject listing error:', e); }
    };

    /* ── Verification ─────────────────────────────────────────────────────── */
    const handleToggleVerification = async listing => {
        const newStatus = !listing.isVerified;
        try {
            await updateDoc(doc(db, 'properties', listing.id), { isVerified: newStatus });
            if (selectedListing?.id === listing.id) {
                setSelectedListing(prev => ({ ...prev, isVerified: newStatus }));
            }
        } catch (e) { logger.error('Toggle verification error:', e); }
    };

    /* ── System Cleanup & Migration ── */
    const handleSystemCleanup = async () => {
        showModal({
            title: 'Run System Cleanup',
            message: 'This will migrate data from redundant collections (listings, Listings, Users, Profiles) to the active ones (properties, users) and delete the old ones. Are you sure?',
            confirmText: 'Start Cleanup',
            confirmColor: '#10b981',
            onConfirm: async () => {
                setModal(p => ({ ...p, isLoading: true }));
                try {
                    let listingCount = 0;
                    let userCount = 0;

                    // 1. Listings Cleanup
                    const listingSources = ['listings', 'Listings'];
                    for (const source of listingSources) {
                        const snap = await getDocs(query(collection(db, source), limit(QUERY_LIMITS.HARD_CAP)));
                        for (const lDoc of snap.docs) {
                            const data = lDoc.data();
                            await addDoc(collection(db, 'properties'), {
                                ...data,
                                ownerId: data.ownerId || data.landlordId || data.userId || data.creatorId,
                                isApproved: data.isApproved ?? true,
                                migratedAt: serverTimestamp(),
                                migrationSource: source
                            });
                            await deleteDoc(doc(db, source, lDoc.id));
                            listingCount++;
                        }
                    }

                    // 2. Users Cleanup
                    const userSources = ['Users', 'Profiles', 'user_profiles'];
                    for (const source of userSources) {
                        const snap = await getDocs(query(collection(db, source), limit(QUERY_LIMITS.HARD_CAP)));
                        for (const uDoc of snap.docs) {
                            const data = uDoc.data();
                            await setDoc(doc(db, 'users', uDoc.id), {
                                ...data,
                                migratedAt: serverTimestamp(),
                                migrationSource: source
                            }, { merge: true });
                            await deleteDoc(doc(db, source, uDoc.id));
                            userCount++;
                        }
                    }

                    setModal(p => ({ 
                        ...p, 
                        isLoading: false, 
                        isSuccess: true, 
                        message: `Cleanup successful! Moved ${listingCount} listings and ${userCount} users.` 
                    }));
                    setTimeout(closeModal, 4000);
                } catch (e) {
                    logger.error(e);
                    setModal(p => ({ ...p, isLoading: false, message: 'Cleanup failed. Check console.' }));
                }
            }
        });
    };

    /* ── Listing detail with owner lookup ─────────────────────────────────── */
    const openListingDetail = async listing => {
        setSelectedListing(listing);
        setListingOwner(null);
        // Try to resolve ownerId / landlordId / userId to a real user record
        const ownerId = listing.ownerId || listing.landlordId || listing.userId || listing.creatorId;
        if (!ownerId) return;
        setOwnerLoading(true);
        try {
            const userSnap = await getDoc(doc(db, 'users', ownerId));
            if (userSnap.exists()) setListingOwner({ id: userSnap.id, ...userSnap.data() });
        } catch (e) { logger.error('Owner lookup error:', e); }
        finally { setOwnerLoading(false); }
    };

    const closeDetail = () => { setSelectedListing(null); setListingOwner(null); };

    /* ── Enquiry actions ──────────────────────────────────────────────────── */
    const handleReplyEnquiry = async (enquiryId, reply, formRef) => {
        try {
            const newMessage = {
                text: reply,
                sender: 'admin',
                sentAt: new Date().toISOString(),
            };
            const enquiryRef = doc(db, 'enquiries', enquiryId);
            const snap = await getDoc(enquiryRef);
            const existing = snap.exists() ? (snap.data().replies || []) : [];
            await updateDoc(enquiryRef, {
                replies: [...existing, newMessage],
                lastReplyAt: serverTimestamp(),
                // keep legacy field in sync for backward compat
                adminReply: reply,
            });
            if (formRef?.current) formRef.current.reset();
            toast.success('Reply sent!');
        } catch (e) {
            logger.error('Reply enquiry error:', e);
            toast.error('Failed to send reply.');
        }
    };

    const handleResolveEnquiry = async (enquiryId) => {
        try {
            await updateDoc(doc(db, 'enquiries', enquiryId), {
                status: 'resolved',
                resolvedAt: serverTimestamp()
            });
            toast.success('Enquiry marked as resolved!');
        } catch (e) {
            logger.error('Resolve enquiry error:', e);
        }
    };

    const handleDeleteEnquiry = async (enquiryId) => {
        showModal({
            title: 'Delete Enquiry',
            message: 'Are you sure you want to delete this enquiry?',
            confirmText: 'Delete',
            confirmColor: '#ef4444',
            onConfirm: async () => {
                setModal(p => ({ ...p, isLoading: true }));
                try {
                    await deleteDoc(doc(db, 'enquiries', enquiryId));
                    setModal(p => ({ ...p, isLoading: false, isSuccess: true }));
                    setTimeout(closeModal, 1500);
                } catch (e) {
                    logger.error(e);
                    setModal(p => ({ ...p, isLoading: false, isOpen: false }));
                }
            }
        });
    };
    
    /* ── Report actions ───────────────────────────────────────────────────── */
    const handleDismissReport = async (reportId) => {
        try {
            await deleteDoc(doc(db, 'reports', reportId));
        } catch (e) {
            logger.error('Dismiss report error:', e);
        }
    };

    const handleDeleteReportedProperty = async (report) => {
        showModal({
            title: 'Delete Reported Property',
            message: `This will permanently delete the property "${report.propertyTitle}" and dismiss this report. Continue?`,
            confirmText: 'Delete Property',
            confirmColor: '#ef4444',
            onConfirm: async () => {
                setModal(p => ({ ...p, isLoading: true }));
                try {
                    // Notify owner before deleting
                    const propSnap = await getDoc(doc(db, 'properties', report.propertyId));
                    if (propSnap.exists()) {
                        const propData = propSnap.data();
                        const ownerId = propData.ownerId || propData.userId;
                        if (ownerId) {
                            await createNotification(
                                ownerId,
                                'system',
                                'Listing Removed',
                                `Your property "${report.propertyTitle}" has been removed by our team due to a violation report.`,
                                '/my-listings'
                            );
                        }
                    }

                    // Delete the property
                    await deleteDoc(doc(db, 'properties', report.propertyId));
                    // Delete the report
                    await deleteDoc(doc(db, 'reports', report.id));
                    
                    setModal(p => ({ ...p, isLoading: false, isSuccess: true }));
                    setTimeout(closeModal, 1500);
                } catch (e) {
                    logger.error(e);
                    setModal(p => ({ ...p, isLoading: false, isOpen: false }));
                    toast.error("Error deleting property. It might have been already deleted.");
                }
            }
        });
    };

    /* ── Finance actions ───────────────────────────────────────────────────── */
    const handleApprovePayment = async (payment) => {
        try {
            await updateDoc(doc(db, 'payments', payment.id), { status: 'completed' });
            
            // If it's a subscription fee, update the user
            if (payment.type === 'subscription' && payment.userId) {
                const expiryDate = new Date();
                expiryDate.setDate(expiryDate.getDate() + 30);
                await updateDoc(doc(db, 'users', payment.userId), {
                    subscriptionPlan: payment.metadata?.plan || 'Premium',
                    subscriptionExpiry: expiryDate,
                });
                await createNotification(
                    payment.userId,
                    'system',
                    'Subscription Activated! 🎉',
                    `Your ${payment.metadata?.plan || 'Premium'} subscription is now active for 30 days.`,
                    '/pricing'
                );
            }

            // If it's a listing fee, approve the property
            if (payment.type === 'listing_fee' && payment.propertyId) {
                await updateDoc(doc(db, 'properties', payment.propertyId), { isApproved: true });
                // Notify owner
                if (payment.userId) {
                    await createNotification(
                        payment.userId,
                        'property_approved',
                        'Property Approved! 🎉',
                        `Your payment has been confirmed and your property is now live on the platform.`,
                        '/my-listings',
                        { propertyId: payment.propertyId }
                    );
                }
            }
            // If it's a verification fee, set property to onsite verified
            if (payment.type === 'verification_fee' && payment.propertyId) {
                await updateDoc(doc(db, 'properties', payment.propertyId), { 
                    verificationStatus: 'verified',
                    isOnsiteVerified: true
                });
                if (payment.userId) {
                    await createNotification(
                        payment.userId,
                        'property_approved',
                        'Property Verified ✅',
                        `Your property has been onsite verified by our team.`,
                        '/my-listings',
                        { propertyId: payment.propertyId }
                    );
                }
            }
            // If it's an escrow deposit, set property status to Booked
            if (payment.type === 'escrow_deposit' && payment.propertyId) {
                await updateDoc(doc(db, 'properties', payment.propertyId), { status: 'Booked' });
                
                // Also find the associated escrow deposit to mark it as held (if it wasn't already)
                const escrowRef = query(collection(db, 'escrowDeposits'), where('paymentId', '==', payment.id));
                const escrowSnap = await getDocs(escrowRef);
                if (!escrowSnap.empty) {
                    await updateDoc(doc(db, 'escrowDeposits', escrowSnap.docs[0].id), { status: 'held' });
                }
            }
            toast.success('Payment approved!');
        } catch (e) { logger.error('Approve payment error:', e); }
    };

    const handleRejectPayment = async (payment) => {
        try {
            await updateDoc(doc(db, 'payments', payment.id), { status: 'failed' });
            
            if (payment.type === 'escrow_deposit') {
                const escrowRef = query(collection(db, 'escrowDeposits'), where('paymentId', '==', payment.id));
                const escrowSnap = await getDocs(escrowRef);
                if (!escrowSnap.empty) {
                    await updateDoc(doc(db, 'escrowDeposits', escrowSnap.docs[0].id), { status: 'failed' });
                }
            }
            toast.success('Payment rejected.');
        } catch (e) { logger.error('Reject payment error:', e); }
    };

    const handleReleaseEscrow = async (escrowId) => {
        showModal({
            title: 'Release Escrow Funds',
            message: 'Are you sure you want to release these funds to the owner? This confirms the tenant has moved in.',
            confirmText: 'Release Funds',
            confirmColor: '#10b981',
            onConfirm: async () => {
                setModal(p => ({ ...p, isLoading: true }));
                try {
                    const escrowSnap = await getDoc(doc(db, 'escrowDeposits', escrowId));
                    await updateDoc(doc(db, 'escrowDeposits', escrowId), { 
                        status: 'released',
                        releasedAt: serverTimestamp() 
                    });

                    // Notify both tenant and owner
                    if (escrowSnap.exists()) {
                        const escrow = escrowSnap.data();
                        if (escrow.tenantId) {
                            await createNotification(
                                escrow.tenantId,
                                'booking_confirmed',
                                'Deposit Released',
                                `Your escrow deposit for ${escrow.propertyName || 'the property'} has been released.`,
                                '/my-bookings'
                            );
                        }
                        if (escrow.ownerId) {
                            await createNotification(
                                escrow.ownerId,
                                'booking_confirmed',
                                'Escrow Funds Released',
                                `The deposit for ${escrow.propertyName || 'your property'} has been released to you.`,
                                '/my-listings'
                            );
                        }
                    }

                    setModal(p => ({ ...p, isLoading: false, isSuccess: true }));
                    setTimeout(closeModal, 1500);
                } catch (e) {
                    logger.error(e);
                    setModal(p => ({ ...p, isLoading: false, isOpen: false }));
                    toast.error("Error releasing funds.");
                }
            }
        });
    };

    const handleApproveWebhookTxn = async (txn) => {
        showModal({
            title: 'Manually Approve Webhook Transaction',
            message: `This will mark transaction ${txn.transactionId} as claimed by an admin. Users will no longer be able to use this transaction to verify payments. Proceed?`,
            confirmText: 'Approve Transaction',
            confirmColor: '#10b981',
            onConfirm: async () => {
                setModal(p => ({ ...p, isLoading: true }));
                try {
                    const token = await currentUser.getIdToken(true);
                    const response = await fetch(getApiUrl('/api/admin-claim-webhook-transaction'), {
                        method: 'POST',
                        headers: {
                            Authorization: `Bearer ${token}`,
                            'Content-Type': 'application/json',
                        },
                        body: JSON.stringify({ transactionId: txn.transactionId || txn.id }),
                    });
                    const data = await response.json().catch(() => ({}));
                    if (!response.ok || !data.success) {
                        throw new Error(data.error || 'Unable to mark transaction as claimed.');
                    }
                    setModal(p => ({ ...p, isLoading: false, isSuccess: true }));
                    setTimeout(closeModal, 1500);
                    toast.success('Webhook transaction marked as claimed!');
                } catch (e) {
                    logger.error(e);
                    setModal(p => ({ ...p, isLoading: false, isOpen: false }));
                    toast.error("Error approving transaction.");
                }
            }
        });
    };

    /* ── Derived ──────────────────────────────────────────────────────────── */
    const filteredUsers = users.filter(u =>
        (u.fullName || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (u.email || '').toLowerCase().includes(searchQuery.toLowerCase())
    );
    const filteredListings = listings.filter(l => {
        const matchesSearch = (l.title || '').toLowerCase().includes(listingSearch.toLowerCase()) ||
            (l.location || l.address || l.upazila || l.district || '').toLowerCase().includes(listingSearch.toLowerCase()) ||
            (l.id || '').toLowerCase().includes(listingSearch.toLowerCase());
        if (!matchesSearch) return false;
        
        if (propertiesTab === 'pending') return !l.isApproved && !l.isRejected;
        if (propertiesTab === 'approved') return l.isApproved;
        if (propertiesTab === 'rejected') return l.isRejected;
        return true;
    });
    const pendingListings = listings.filter(l => !l.isApproved && !l.isRejected).length;

    /* ═══════════════════════════════════════════════════════════════════════
       RENDER
    ═══════════════════════════════════════════════════════════════════════ */
    return (
        <div className="flex h-screen overflow-hidden bg-[#F8F9FA] dark:bg-[#0F1117] font-sans">

            {/* ══════════════════════════  SIDEBAR  ══════════════════════════ */}
            <AdminSidebar
                isCollapsed={isCollapsed}
                onToggleCollapse={() => setIsCollapsed(p => !p)}
                currentUser={currentUser}
                onLogout={handleLogout}
                pendingListings={pendingListings}
                unresolvedEnquiries={enquiries.filter(e => e.status !== 'resolved').length}
                reportsCount={reports.length}
            />

            {/* ══════════════════════════  MAIN  ═════════════════════════════ */}
            <main className="flex-1 flex flex-col min-w-0 overflow-y-auto">

                {/* Topbar */}
                <header className="flex-shrink-0 h-20 bg-white/80 backdrop-blur-xl flex items-center justify-between px-10 sticky top-0 z-20 border-b border-black/[0.04] shadow-sm">
                    <div>
                        <div className="flex items-center gap-2 text-zinc-400 text-[9px] font-black uppercase tracking-widest mb-0.5">
                            <span>Platform</span>
                            <ChevronRight size={8} />
                            <span className="text-emerald-500 capitalize">{activeTab === 'admin' ? 'Dashboard' : activeTab}</span>
                        </div>
                        <h2 className="text-2xl font-black text-zinc-950 tracking-tight capitalize">
                            {activeTab === 'admin' ? 'Analytics Overview' : activeTab.replace('-', ' ')}
                        </h2>
                    </div>
                    <div className="flex items-center gap-6">
                        <button className="relative w-10 h-10 rounded-xl bg-zinc-50 flex items-center justify-center text-zinc-400 hover:text-emerald-500 transition-all">
                            <Bell size={18} />
                            {pendingListings > 0 && (
                                <span className="absolute top-2 right-2 w-2 h-2 bg-amber-500 rounded-full border-2 border-white" />
                            )}
                        </button>
                        <div className="flex items-center gap-3">
                            <div className="text-right hidden sm:block">
                                <p className="text-sm font-black text-zinc-950 leading-none">{currentUser?.email?.split('@')[0]}</p>
                                <p className="text-[9px] font-black text-emerald-500 uppercase tracking-widest mt-0.5">Management</p>
                            </div>
                            <div className="w-10 h-10 bg-zinc-950 rounded-xl flex items-center justify-center font-black text-white text-sm">
                                {currentUser?.email?.[0]?.toUpperCase() || 'A'}
                            </div>
                        </div>
                    </div>
                </header>

                {/* Page Content */}
                <div className="flex-1 p-8">
                    <div className="max-w-7xl mx-auto space-y-8">
                        <Routes>

                            {/* ── Overview ── */}
                            <Route index element={
                                <AdminOverviewSection
                                    loadingStats={loadingStats}
                                    stats={stats}
                                    pendingListings={pendingListings}
                                    users={users}
                                    onSystemCleanup={handleSystemCleanup}
                                />
                            } />

                            {/* ── Users ── */}
                            <Route path="users" element={
                                <AdminUsersTab
                                    users={filteredUsers}
                                    searchQuery={searchQuery}
                                    onSearchChange={setSearchQuery}
                                    onSelectUser={setSelectedUser}
                                    onToggleAdmin={handleToggleAdmin}
                                    onToggleStatus={handleToggleStatus}
                                    onDeleteUser={handleDeleteUser}
                                />
                            } />

                            {/* ── Listings ── */}
                            <Route path="properties" element={
                                <AdminPropertiesTab
                                    listings={listings}
                                    filteredListings={filteredListings}
                                    pendingListings={pendingListings}
                                    propertiesTab={propertiesTab}
                                    onPropertiesTabChange={setPropertiesTab}
                                    listingSearch={listingSearch}
                                    onSearchChange={setListingSearch}
                                    onOpenDetail={openListingDetail}
                                    onApprove={handleApproveListing}
                                    onReject={handleRejectListing}
                                    propertiesLimit={propertiesLimit}
                                    onLoadMore={() => setPropertiesLimit(prev => prev + 50)}
                                />
                            } />

                            {/* ── Enquiries ── */}
                            <Route path="enquiries" element={
                                <AdminEnquiriesTab
                                    enquiries={enquiries}
                                    onReply={handleReplyEnquiry}
                                    onResolve={handleResolveEnquiry}
                                    onDelete={handleDeleteEnquiry}
                                />
                            } />

                            {/* ── Payments & Escrow ── */}
                            <Route path="payments" element={
                                <AdminPaymentsTab
                                    payments={payments}
                                    escrowDeposits={escrowDeposits}
                                    webhookTxns={webhookTxns}
                                    onApprovePayment={handleApprovePayment}
                                    onRejectPayment={handleRejectPayment}
                                    onReleaseEscrow={handleReleaseEscrow}
                                    onApproveWebhookTxn={handleApproveWebhookTxn}
                                />
                            } />

                            {/* ── Payment Details (SMS Webhook) ── */}
                            <Route path="payment-details" element={
                                <AdminPaymentDetailsTab
                                    webhookTxns={webhookTxns}
                                    onApproveWebhookTxn={handleApproveWebhookTxn}
                                />
                            } />

                            {/* ── Reviews ── */}
                            <Route path="reviews" element={
                                <div className="space-y-6">
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 rounded-2xl bg-amber-50 flex items-center justify-center text-amber-500 shadow-inner">
                                            <Star size={24} className="fill-amber-500" />
                                        </div>
                                        <div>
                                            <h2 className="text-2xl font-black text-zinc-950 tracking-tight">Review Moderation</h2>
                                            <p className="text-sm font-bold text-zinc-400">Manage property and landlord reviews</p>
                                        </div>
                                    </div>
                                    <AdminReviewsTab openModal={showModal} />
                                </div>
                            } />

                            {/* ── KYC Verification ── */}
                            <Route path="kyc" element={
                                <div className="space-y-6">
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 rounded-2xl bg-emerald-50 flex items-center justify-center text-emerald-500 shadow-inner">
                                            <FileCheck size={24} />
                                        </div>
                                        <div>
                                            <h2 className="text-2xl font-black text-zinc-950 tracking-tight">KYC Verification</h2>
                                            <p className="text-sm font-bold text-zinc-400">Review and approve user identity documents</p>
                                        </div>
                                    </div>
                                    <AdminKycTab openModal={showModal} />
                                </div>
                            } />

                            {/* ── Reports ── */}
                            <Route path="reports" element={
                                <AdminReportsTab
                                    reports={reports}
                                    onViewProperty={(propertyId) => navigate(`/property/${propertyId}`)}
                                    onDeleteReported={handleDeleteReportedProperty}
                                    onDismiss={handleDismissReport}
                                />
                            } />

                            {/* ── Catch-all ── */}
                            <Route path="*" element={
                                <div className="h-[50vh] bg-white rounded-3xl border border-dashed border-zinc-200 flex flex-col items-center justify-center gap-6 group">
                                    <div className="w-20 h-20 bg-emerald-50 rounded-3xl flex items-center justify-center text-emerald-500 group-hover:scale-105 transition-transform duration-500">
                                        <Database size={40} />
                                    </div>
                                    <div className="text-center">
                                        <p className="text-xl font-black text-zinc-950 mb-2 uppercase tracking-wide">Module Operational</p>
                                        <p className="text-sm font-bold text-zinc-400 max-w-sm">This module is live and monitoring connections within the cluster.</p>
                                    </div>
                                    <Link to="/admin"
                                        className="px-8 py-3 bg-zinc-950 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-emerald-600 transition-all duration-300">
                                        Return to Command Center
                                    </Link>
                                </div>
                            } />

                            <Route path="claims" element={<AdminClaimsTab />} />

                        </Routes>
                    </div>
                </div>
            </main>

            {/* ─── Listing Detail Drawer ─────────────────────────────────────── */}
            <ListingDetailDrawer
                listing={selectedListing}
                owner={listingOwner}
                ownerLoading={ownerLoading}
                onClose={closeDetail}
                onToggleVerification={handleToggleVerification}
                onApprove={handleApproveListing}
                onReject={handleRejectListing}
            />

            <ConfirmationModal
                isOpen={modal.isOpen}
                title={modal.title}
                message={modal.message}
                confirmText={modal.confirmText}
                confirmColor={modal.confirmColor}
                isSuccess={modal.isSuccess}
                isLoading={modal.isLoading}
                onConfirm={modal.onConfirm}
                onCancel={closeModal}
            />

            {/* ─── User Detail Modal ─────────────────────────────────────────── */}
            <UserDetailDrawer user={selectedUser} onClose={() => setSelectedUser(null)} />
        </div>
    );
}
