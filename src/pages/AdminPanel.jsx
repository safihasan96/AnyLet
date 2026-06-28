import { useNavigate, useLocation, NavLink, Link, Routes, Route } from 'react-router-dom';
import React, { useState, useEffect } from 'react';

import {
    Users, Home, ClipboardList, Search, LayoutDashboard, Settings,
    LogOut, UserCheck, UserMinus, Trash2, TrendingUp, ShieldCheck,
    Bell, ChevronRight, ChevronLeft, Activity, Database, Lock,
    Menu, CheckCircle, Clock, Building2, MessageSquare, Flag, AlertCircle,
    CreditCard, Banknote, HelpCircle, Star, FileCheck
} from 'lucide-react';
import { collection, onSnapshot, updateDoc, deleteDoc, doc, getDoc, getDocs, addDoc, serverTimestamp, setDoc, query, where, limit, orderBy } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../contexts/AuthContext';
import QUERY_LIMITS from '../config/queryLimits';
import ConfirmationModal from '../components/ConfirmationModal';
import { useToast } from '../contexts/ToastContext';
import { createNotification } from '../utils/notificationService';
import AdminReviewsTab from '../components/AdminReviewsTab';
import AdminKycTab from '../components/AdminKycTab';
import AdminClaimsTab from '../components/AdminClaimsTab';
import '../index.css';
import logger from '../utils/logger';

/* ─────────────────────────────────────────────────────────────────────────────
   NAV ITEMS
───────────────────────────────────────────────────────────────────────────── */
const NAV_ITEMS = [
    { path: '/admin', icon: LayoutDashboard, label: 'Overview', end: true },
    { path: '/admin/users', icon: Users, label: 'Platform Users' },
    { path: '/admin/properties', icon: Building2, label: 'Properties' },
    { path: '/admin/requests', icon: ClipboardList, label: 'Live Pipeline' },
    { path: '/admin/payments', icon: CreditCard, label: 'Payments & Escrow' },
    { path: '/admin/enquiries', icon: MessageSquare, label: 'Enquiries' },
    { path: '/admin/reviews', icon: Star, label: 'Reviews' },
    { path: '/admin/kyc', icon: FileCheck, label: 'KYC Verification' },
    { path: '/admin/reports', icon: Flag, label: 'Reports' },
    { path: '/admin/claims', icon: Lock, label: 'Admin Access' },
    { path: '/admin/settings', icon: Settings, label: 'System Health' },
];

/* ─────────────────────────────────────────────────────────────────────────────
   ENQUIRY CARD  (self-contained sub-component for multi-message threads)
───────────────────────────────────────────────────────────────────────────── */
function EnquiryCard({ enquiry, onReply, onResolve, onDelete }) {
    const formRef = React.useRef(null);

    // Build conversation: merge legacy adminReply + new replies array
    const thread = React.useMemo(() => {
        const msgs = [];
        // User's original message
        msgs.push({ text: enquiry.description, sender: 'user', sentAt: enquiry.createdAt?.toDate?.()?.toISOString() || '' });
        // Legacy single reply (only if no replies array yet)
        if (enquiry.adminReply && (!enquiry.replies || enquiry.replies.length === 0)) {
            msgs.push({ text: enquiry.adminReply, sender: 'admin', sentAt: enquiry.repliedAt?.toDate?.()?.toISOString() || '' });
        }
        // New multi-message replies
        if (enquiry.replies?.length) {
            enquiry.replies.forEach(r => msgs.push(r));
        }
        return msgs;
    }, [enquiry]);

    const handleSubmit = (e) => {
        e.preventDefault();
        const reply = e.target.reply.value.trim();
        if (reply) onReply(enquiry.id, reply, formRef);
    };

    return (
        <div className="p-6 md:p-8 hover:bg-slate-50/60 dark:hover:bg-white/[0.02] transition-all border-b border-slate-100 dark:border-white/[0.05] last:border-0">
            {/* Header */}
            <div className="flex justify-between items-start mb-5">
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-slate-100 dark:bg-white/[0.06] rounded-2xl flex items-center justify-center font-black text-slate-500 dark:text-slate-400 text-lg">
                        {enquiry.userEmail?.[0]?.toUpperCase() || '?'}
                    </div>
                    <div>
                        <div className="flex items-center gap-2 flex-wrap">
                            <p className="font-black text-zinc-950">{enquiry.topic}</p>
                            <span className={`text-[9px] font-black px-2 py-0.5 rounded-md uppercase tracking-widest ${enquiry.type === 'support' ? 'bg-amber-50 text-amber-600' : 'bg-blue-50 text-blue-600'}`}>
                                {enquiry.type || 'Support'}
                            </span>
                            {enquiry.status === 'resolved' ? (
                                <span className="text-[9px] font-black px-2 py-0.5 rounded-md uppercase tracking-widest bg-emerald-50 text-emerald-600">
                                    ✓ Resolved
                                </span>
                            ) : (
                                <span className="text-[9px] font-black px-2 py-0.5 rounded-md uppercase tracking-widest bg-red-50 text-red-500">
                                    Pending
                                </span>
                            )}
                        </div>
                        <p className="text-xs font-bold text-slate-400 dark:text-slate-500 mt-0.5">{enquiry.userEmail}</p>
                        <p className="text-[10px] font-medium text-slate-300 dark:text-slate-600 mt-0.5">
                            {enquiry.createdAt?.toDate().toLocaleString()}
                        </p>
                    </div>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                    {enquiry.status !== 'resolved' && (
                        <button
                            onClick={() => onResolve(enquiry.id)}
                            className="text-[10px] font-black px-3 py-1.5 rounded-full uppercase tracking-widest bg-emerald-500 hover:bg-emerald-600 text-white transition-colors"
                        >
                            ✓ Resolve
                        </button>
                    )}
                    <button onClick={() => onDelete(enquiry.id)} className="p-2 text-zinc-300 hover:text-red-500 transition-colors">
                        <Trash2 size={16} />
                    </button>
                </div>
            </div>

            {/* Conversation thread */}
            <div className="space-y-3 mb-5 ml-4 border-l-2 border-slate-100 dark:border-white/[0.06] pl-5">
                {thread.map((msg, idx) => (
                    <div key={idx} className={`${msg.sender === 'admin' ? 'ml-4' : ''}`}>
                        <p className={`text-[9px] font-black uppercase tracking-widest mb-1 ${msg.sender === 'admin' ? 'text-emerald-600' : 'text-zinc-400'}`}>
                            {msg.sender === 'admin' ? '🔷 Admin' : '💬 User'}
                            {msg.sentAt && (
                                <span className="ml-2 font-medium lowercase tracking-normal">
                                    · {new Date(msg.sentAt).toLocaleString()}
                                </span>
                            )}
                        </p>
                        <p className={`text-sm font-medium leading-relaxed p-4 rounded-xl ${msg.sender === 'admin' ? 'bg-emerald-50/70 dark:bg-emerald-500/10 text-emerald-900 dark:text-emerald-300' : 'bg-slate-50 dark:bg-white/[0.04] text-slate-600 dark:text-slate-300'}`}>
                            {msg.text}
                        </p>
                    </div>
                ))}
            </div>

            {/* Reply form — always visible unless resolved */}
            {enquiry.status !== 'resolved' && (
                <div className="ml-4 pl-5 border-l-2 border-dashed border-slate-200 dark:border-white/[0.08]">
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2">Send a Reply</p>
                    <form ref={formRef} onSubmit={handleSubmit} className="flex gap-3">
                        <input
                            name="reply"
                            placeholder="Type your reply here..."
                            className="flex-1 bg-slate-50 dark:bg-white/[0.04] border border-slate-200 dark:border-white/[0.08] rounded-xl px-4 py-2.5 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-400 dark:focus:border-emerald-500 transition-all"
                        />
                        <button
                            type="submit"
                            className="px-5 py-2.5 bg-slate-900 dark:bg-white/[0.08] text-white text-xs font-black rounded-xl hover:bg-emerald-600 dark:hover:bg-emerald-600 transition-all whitespace-nowrap"
                        >
                            Send Reply
                        </button>
                    </form>
                </div>
            )}
        </div>
    );
}

/* ─────────────────────────────────────────────────────────────────────────────
   COMPONENT
───────────────────────────────────────────────────────────────────────────── */
export default function AdminPanel() {
    const { currentUser, isAdmin, logout } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();

    const activeTab = location.pathname.split('/').pop() || 'admin';
    const toast = useToast();

    /* ── State ─────────────────────────────────────────────────────────────── */
    const [isCollapsed, setIsCollapsed] = useState(false);
    const [users, setUsers] = useState([]);
    const [listings, setListings] = useState([]);
    const [viewingReqs, setViewingReqs] = useState([]);
    const [enquiries, setEnquiries] = useState([]);
    const [reports, setReports] = useState([]);
    const [payments, setPayments] = useState([]);
    const [escrowDeposits, setEscrowDeposits] = useState([]);
    const [loadingUsers, setLoadingUsers] = useState(true);
    const [loadingStats, setLoadingStats] = useState(true);
    const [stats, setStats] = useState({ 
        totalUsers: 0, 
        totalListings: 0, 
        pendingRequests: 0,
        verifiedListings: 0,
        verifiedLandlords: 0,
        successfulMoveIns: 0,
        monthlyRevenue: 0
    });
    const [searchQuery, setSearchQuery] = useState('');
    const [listingSearch, setListingSearch] = useState('');
    const [propertiesTab, setPropertiesTab] = useState('pending'); // 'all' | 'pending' | 'approved'
    const [selectedListing, setSelectedListing] = useState(null);
    const [listingOwner, setListingOwner] = useState(null);
    const [ownerLoading, setOwnerLoading] = useState(false);
    const [selectedUser, setSelectedUser] = useState(null);
    const [propertiesLimit, setPropertiesLimit] = useState(QUERY_LIMITS.ADMIN_PROPERTIES);

    const [modal, setModal] = useState({
        isOpen: false, title: '', message: '',
        confirmText: 'Confirm', confirmColor: '#10b981',
        isSuccess: false, isLoading: false, onConfirm: null,
    });
    const closeModal = () => setModal(p => ({ ...p, isOpen: false, isSuccess: false }));
    const showModal = (cfg) => setModal({ ...cfg, isOpen: true, isSuccess: false, isLoading: false });

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
                verifiedLandlords: list.filter(u => u.role === 'owner' && u.isVerified).length 
            }));
            setLoadingUsers(false);
        });

        // Leads / viewing requests
        const unsubLeads = onSnapshot(
            query(collection(db, 'viewing_requests'), orderBy('createdAt', 'desc'), limit(QUERY_LIMITS.ADMIN_REQUESTS)),
            snap => {
            const list = snap.docs.map(d => ({ id: d.id, ...d.data() }));
            setViewingReqs(list);
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
            const list = snap.docs.map(d => ({ id: d.id, ...d.data() }));
            setEnquiries(list);
        }, err => logger.error('FIRESTORE (enquiries):', err.message));

        // Reports
        const unsubReports = onSnapshot(
            query(collection(db, 'reports'), orderBy('createdAt', 'desc'), limit(QUERY_LIMITS.ADMIN_REPORTS)),
            snap => {
            const list = snap.docs.map(d => ({ id: d.id, ...d.data() }));
            setReports(list);
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

        return () => { unsubUsers(); unsubLeads(); unsubEnquiries(); unsubReports(); unsubPayments(); unsubEscrow(); };
    }, []);

    useEffect(() => {
        let rev = 0;
        payments.forEach(p => {
            if (p.status === 'completed') {
                rev += Number(p.amount) || 0;
            }
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

    // Separated properties listener to support 'Load More' pagination
    useEffect(() => {
        const unsubListings = onSnapshot(
            query(collection(db, 'properties'), orderBy('createdAt', 'desc'), limit(propertiesLimit)),
            snap => {
                const list = snap.docs.map(d => ({ id: d.id, ...d.data() }));
                setListings(list);
                // Keep the stats updated but note snap.size is bounded by propertiesLimit
                setStats(p => ({ 
                    ...p, 
                    totalListings: snap.size,
                    verifiedListings: list.filter(l => l.isVerified || l.verificationStatus === 'verified').length 
                }));
            }, 
            err => logger.error('FIRESTORE (properties):', err.message)
        );
        return () => unsubListings();
    }, [propertiesLimit]);

    /* ── User actions ─────────────────────────────────────────────────────── */
    const handleLogout = async () => {
        try { await logout(); navigate('/login'); } catch (e) { logger.error(e); }
    };

    const handleToggleAdmin = user => {
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
            <aside
                className={`
                    relative flex-shrink-0 flex flex-col
                    ${isCollapsed ? 'w-20' : 'w-64'}
                    bg-zinc-950 text-white h-full
                    transition-all duration-300 ease-in-out
                    shadow-[4px_0_24px_rgba(0,0,0,0.15)] z-30 overflow-hidden
                `}
            >
                {/* Brand + Toggle */}
                <div className={`flex items-center ${isCollapsed ? 'justify-center px-2' : 'justify-between px-5'} py-5 border-b border-zinc-800/60`}>
                    {!isCollapsed && (
                        <div className="flex items-center gap-3 min-w-0">
                            <div className="w-8 h-8 bg-emerald-500 rounded-xl flex items-center justify-center shadow-[0_4px_12px_rgba(16,185,129,0.35)] flex-shrink-0">
                                <ShieldCheck size={16} className="text-white" />
                            </div>
                            <div className="overflow-hidden">
                                <h1 className="text-sm font-black text-white leading-none tracking-tight">Architect</h1>
                                <div className="flex items-center gap-1.5 mt-1">
                                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                    <p className="text-zinc-500 text-[9px] uppercase font-black tracking-widest">Live Control</p>
                                </div>
                            </div>
                        </div>
                    )}
                    <button
                        onClick={() => setIsCollapsed(p => !p)}
                        className="w-8 h-8 rounded-lg flex items-center justify-center text-zinc-400 hover:text-white hover:bg-zinc-800 transition-all duration-200 flex-shrink-0"
                        title={isCollapsed ? 'Expand' : 'Collapse'}
                    >
                        {isCollapsed ? <Menu size={16} /> : <ChevronLeft size={16} />}
                    </button>
                </div>

                {/* Nav */}
                <div className="flex-1 px-2 py-4 overflow-y-auto">
                    {!isCollapsed && (
                        <p className="text-zinc-600 text-[9px] font-black uppercase tracking-widest px-3 mb-3">Main Core</p>
                    )}
                    <nav className="space-y-1">
                        {NAV_ITEMS.map(item => (
                            <NavLink
                                key={item.path}
                                to={item.path}
                                end={item.end}
                                title={isCollapsed ? item.label : undefined}
                                className={({ isActive }) =>
                                    `flex items-center gap-3 w-full p-3 rounded-xl transition-all duration-200 group border-l-4
                                    ${isCollapsed ? 'justify-center' : ''}
                                    ${isActive
                                        ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500 shadow-[inset_0_0_16px_rgba(16,185,129,0.06)]'
                                        : 'text-zinc-500 hover:text-white hover:bg-zinc-900 border-transparent'
                                    }`
                                }
                            >
                                <item.icon size={20} className="w-5 h-5 flex-shrink-0" />
                                {!isCollapsed && (
                                    <>
                                        <span className="font-semibold text-sm">{item.label}</span>
                                        {item.label === 'Properties' && pendingListings > 0 && (
                                            <span className="ml-auto bg-amber-500 text-white text-[9px] font-black px-1.5 py-0.5 rounded-full">
                                                {pendingListings}
                                            </span>
                                        )}
                                        {item.label === 'Enquiries' && enquiries.filter(e => e.status !== 'resolved').length > 0 && (
                                            <span className="ml-auto bg-red-500 text-white text-[9px] font-black px-1.5 py-0.5 rounded-full">
                                                {enquiries.filter(e => e.status !== 'resolved').length}
                                            </span>
                                        )}
                                        {item.label === 'Reports' && reports.length > 0 && (
                                            <span className="ml-auto bg-rose-500 text-white text-[9px] font-black px-1.5 py-0.5 rounded-full">
                                                {reports.length}
                                            </span>
                                        )}
                                        {item.label !== 'Listings' && (
                                            <ChevronRight size={13} className="ml-auto opacity-0 group-hover:opacity-60 transition-opacity" />
                                        )}
                                    </>
                                )}
                            </NavLink>
                        ))}
                    </nav>
                </div>

                {/* Footer */}
                <div className={`${isCollapsed ? 'p-2' : 'p-4'} border-t border-zinc-800/60`}>
                    {isCollapsed ? (
                        <button onClick={handleLogout} title="Sign Out"
                            className="flex items-center justify-center w-full p-2.5 text-red-400 hover:bg-red-500 hover:text-white rounded-xl transition-all">
                            <LogOut size={18} />
                        </button>
                    ) : (
                        <div className="bg-zinc-900/60 rounded-2xl p-3 border border-zinc-800/50">
                            <div className="flex items-center gap-3 mb-3">
                                <div className="w-8 h-8 bg-zinc-800 rounded-xl flex items-center justify-center font-black text-zinc-300 uppercase text-sm flex-shrink-0">
                                    {currentUser?.email?.[0] || 'A'}
                                </div>
                                <div className="overflow-hidden">
                                    <p className="text-xs font-black text-white truncate">{currentUser?.email?.split('@')[0]}</p>
                                    <p className="text-[9px] font-black text-zinc-500 uppercase tracking-widest">SuperAdmin</p>
                                </div>
                            </div>
                            <button onClick={handleLogout}
                                className="flex items-center justify-center w-full gap-2 px-3 py-2 text-red-400 hover:text-white hover:bg-red-500 rounded-xl font-bold text-xs transition-all">
                                <LogOut size={13} /> Sign Out
                            </button>
                        </div>
                    )}
                </div>
            </aside>

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
                                loadingStats ? (
                                    <div className="h-[50vh] flex flex-col items-center justify-center gap-4">
                                        <div className="w-12 h-12 border-4 border-zinc-100 border-t-emerald-500 rounded-full animate-spin" />
                                        <p className="text-zinc-400 font-black text-xs uppercase tracking-widest animate-pulse">Syncing data...</p>
                                    </div>
                                ) : (
                                    <div className="space-y-8">
                                        {/* Stat Cards */}
                                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                                            {[
                                                { label: 'Platform Users', value: stats.totalUsers, icon: Users, growth: 'Live' },
                                                { label: 'Total Properties', value: stats.totalListings, icon: Building2, growth: `${pendingListings} pending` },
                                                { label: 'Verified Listings', value: stats.verifiedListings, icon: ShieldCheck, growth: 'Moat' },
                                                { label: 'Verified Landlords', value: stats.verifiedLandlords, icon: CheckCircle, growth: 'Moat' },
                                                { label: 'Pipeline Queue', value: stats.pendingRequests, icon: ClipboardList, growth: 'Live' },
                                                { label: 'Move-Ins (Escrow)', value: stats.successfulMoveIns, icon: Home, growth: 'Scale' },
                                                { label: 'Est. Revenue', value: `৳${stats.monthlyRevenue.toLocaleString()}`, icon: Banknote, growth: 'Total' },
                                            ].map((s, i) => (
                                                <div key={i} className="group bg-white p-8 rounded-3xl shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all duration-500 border border-zinc-100">
                                                    <div className="flex justify-between items-start mb-6">
                                                        <div className="p-3 bg-emerald-50 text-emerald-500 rounded-2xl group-hover:bg-emerald-500 group-hover:text-white transition-all duration-400">
                                                            <s.icon size={20} />
                                                        </div>
                                                        <div className="flex items-center gap-1 text-[10px] font-black text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full">
                                                            <TrendingUp size={10} />
                                                            <span>{s.growth}</span>
                                                        </div>
                                                    </div>
                                                    <p className="text-zinc-400 text-[10px] font-black uppercase tracking-widest mb-1">{s.label}</p>
                                                    <div className="text-4xl font-black text-zinc-950 tabular-nums group-hover:text-emerald-600 transition-colors duration-400">{s.value}</div>
                                                </div>
                                            ))}
                                        </div>

                                        {/* Activity + Security */}
                                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                                            <div className="lg:col-span-2 bg-white rounded-3xl border border-zinc-100 shadow-sm overflow-hidden">
                                                <div className="px-8 py-6 border-b border-zinc-50 flex items-center justify-between">
                                                    <h3 className="font-black text-zinc-950 flex items-center gap-2">
                                                        <Activity size={18} className="text-emerald-500" /> Active Events
                                                    </h3>
                                                    <span className="text-[10px] font-black text-zinc-400 uppercase tracking-widest px-2.5 py-1 bg-zinc-50 rounded-lg">Live</span>
                                                </div>
                                                <div className="divide-y divide-zinc-50">
                                                    {users.slice(0, 5).map((user, i) => (
                                                        <div key={i} className="flex items-center justify-between px-8 py-4 hover:bg-zinc-50/50 transition-colors">
                                                            <div className="flex items-center gap-4">
                                                                <div className="w-9 h-9 bg-zinc-100 rounded-xl flex items-center justify-center font-black text-zinc-400 text-xs uppercase">{user.email?.[0]}</div>
                                                                <div>
                                                                    <p className="text-sm font-bold text-zinc-900">{user.email}</p>
                                                                    <p className="text-[10px] text-zinc-400 font-bold uppercase tracking-widest">Authenticated</p>
                                                                </div>
                                                            </div>
                                                            <span className="text-[10px] font-black text-zinc-400 tracking-widest">LIVE</span>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>

                                            <div className="bg-zinc-950 rounded-3xl p-8 text-white shadow-xl relative overflow-hidden group">
                                                <div className="absolute -top-16 -right-16 w-64 h-64 bg-emerald-500/10 rounded-full blur-[80px] group-hover:bg-emerald-500/20 transition-all duration-700" />
                                                <div className="relative z-10 space-y-6">
                                                    <div>
                                                        <p className="text-emerald-400 text-[9px] font-black uppercase tracking-widest mb-3 flex items-center gap-2">
                                                            <Lock size={10} /> Security Status
                                                        </p>
                                                        <div className="flex items-baseline gap-2">
                                                            <span className="text-4xl font-black">AES-256</span>
                                                            <span className="text-emerald-500 text-[9px] font-black animate-pulse uppercase tracking-widest">Active</span>
                                                        </div>
                                                    </div>
                                                    <button
                                                        onClick={handleSystemCleanup}
                                                        className="w-full py-4 bg-emerald-500 hover:bg-emerald-600 text-white font-black rounded-2xl transition-all text-[10px] uppercase tracking-[0.2em] shadow-lg shadow-emerald-500/20 active:scale-[0.98] flex items-center justify-center gap-2"
                                                    >
                                                        <Database size={14} /> Synchronize & Cleanup Data
                                                    </button>
                                                    <div>
                                                        <div className="flex justify-between text-[9px] font-black uppercase tracking-widest mb-2">
                                                            <span className="text-zinc-500">Firewall</span>
                                                            <span className="text-emerald-500">100%</span>
                                                        </div>
                                                        <div className="w-full h-1 bg-zinc-800 rounded-full overflow-hidden">
                                                            <div className="w-full h-full bg-emerald-500 rounded-full" />
                                                        </div>
                                                    </div>
                                                    <div className="p-4 bg-zinc-900/60 rounded-2xl border border-white/5 flex items-start gap-3">
                                                        <ShieldCheck size={16} className="text-emerald-500 flex-shrink-0 mt-0.5" />
                                                        <p className="text-[11px] text-zinc-400 font-bold leading-relaxed">All operations encrypted and audited.</p>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )
                            } />

                            {/* ── Users ── */}
                            <Route path="users" element={
                                <div className="bg-white rounded-3xl border border-zinc-100 shadow-sm overflow-hidden">
                                    <div className="px-8 py-8 flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 border-b border-zinc-50">
                                        <div>
                                            <h3 className="text-2xl font-black text-zinc-950">Platform Directory</h3>
                                            <p className="text-sm text-zinc-400 font-bold mt-1">{filteredUsers.length} authenticated identities</p>
                                        </div>
                                        <div className="relative w-full lg:w-96">
                                            <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-zinc-400" size={16} />
                                            <input
                                                type="text" placeholder="Search name or email..."
                                                value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
                                                className="w-full pl-12 pr-5 py-3 bg-zinc-50 rounded-2xl text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-500/20 placeholder:text-zinc-300"
                                            />
                                        </div>
                                    </div>
                                    <div className="overflow-x-auto">
                                        <table className="w-full text-left">
                                            <thead>
                                                <tr className="text-zinc-400 text-[10px] font-black uppercase tracking-widest border-b border-zinc-50">
                                                    <th className="px-8 py-5">Identity</th>
                                                    <th className="px-8 py-5 text-center">Status</th>
                                                    <th className="px-8 py-5 text-center">Actions</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-zinc-50">
                                                {filteredUsers.map(user => (
                                                    <tr key={user.id} onClick={() => setSelectedUser(user)} className="group hover:bg-zinc-50/50 transition-colors cursor-pointer">
                                                        <td className="px-8 py-6">
                                                            <div className="flex items-center gap-5">
                                                                <div className="w-12 h-12 bg-zinc-100 rounded-2xl flex items-center justify-center font-black text-zinc-300 text-lg uppercase group-hover:border-emerald-500 group-hover:text-emerald-500 border border-transparent transition-all">
                                                                    {user.email?.[0]}
                                                                </div>
                                                                <div>
                                                                    <p className="font-black text-zinc-950 tracking-tight group-hover:text-emerald-600 transition-colors">{user.fullName || 'Anonymous'}</p>
                                                                    <p className="text-xs font-bold text-zinc-400 mt-0.5">{user.email}</p>
                                                                </div>
                                                            </div>
                                                        </td>
                                                        <td className="px-8 py-6 text-center">
                                                            <div className="flex flex-col items-center gap-1.5">
                                                                <span className={`text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-widest ${user.accountStatus === 'deactivated' ? 'bg-red-50 text-red-600' : 'bg-emerald-50 text-emerald-600'}`}>
                                                                    {user.accountStatus === 'deactivated' ? 'Inactive' : 'Active'}
                                                                </span>
                                                                <span className="text-[9px] font-black text-zinc-400 uppercase tracking-widest">{user.role || 'client'}</span>
                                                            </div>
                                                        </td>
                                                        <td className="px-8 py-6">
                                                            <div className="flex justify-center gap-3">
                                                                <button onClick={(e) => { e.stopPropagation(); handleToggleAdmin(user); }}
                                                                    className={`p-3 rounded-xl transition-all border ${user.role === 'admin' ? 'bg-zinc-950 text-white border-zinc-950 hover:bg-emerald-500 hover:border-emerald-500' : 'bg-white text-zinc-400 border-zinc-100 hover:text-emerald-500 hover:border-emerald-200'}`}
                                                                    title="Toggle Admin">
                                                                    <ShieldCheck size={18} />
                                                                </button>
                                                                <button onClick={(e) => { e.stopPropagation(); handleToggleStatus(user); }}
                                                                    className={`p-3 rounded-xl transition-all border ${user.accountStatus === 'deactivated' ? 'bg-emerald-50 text-emerald-600 border-emerald-100 hover:bg-emerald-600 hover:text-white' : 'bg-white text-zinc-400 border-zinc-100 hover:text-red-500 hover:border-red-100'}`}
                                                                    title="Toggle Status">
                                                                    {user.accountStatus === 'deactivated' ? <UserCheck size={18} /> : <UserMinus size={18} />}
                                                                </button>
                                                                <button onClick={(e) => { e.stopPropagation(); handleDeleteUser(user); }}
                                                                    className="p-3 bg-white text-zinc-200 hover:text-red-500 hover:border-red-100 rounded-xl border border-zinc-100 transition-all"
                                                                    title="Delete">
                                                                    <Trash2 size={18} />
                                                                </button>
                                                            </div>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            } />

                            {/* ── Listings ── */}
                            <Route path="properties" element={
                                <div className="space-y-6">
                                    <div className="bg-white rounded-3xl border border-zinc-100 shadow-sm overflow-hidden">
                                        <div className="px-8 py-8 flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 border-b border-zinc-50">
                                            <div>
                                                <h3 className="text-2xl font-black text-zinc-950">Property Approvals</h3>
                                                <p className="text-sm text-zinc-400 font-bold mt-1">
                                                    {listings.length} total · <span className="text-amber-500">{pendingListings} pending approval</span>
                                                </p>
                                            </div>
                                            <div className="flex flex-col sm:flex-row w-full lg:w-auto items-center gap-4">
                                                <div className="bg-zinc-100 p-1 rounded-xl flex items-center w-full sm:w-auto">
                                                    <button onClick={() => setPropertiesTab('pending')} className={`flex-1 sm:flex-none px-4 py-2 rounded-lg text-xs font-black transition-all ${propertiesTab === 'pending' ? 'bg-white shadow-sm text-amber-500' : 'text-zinc-400 hover:text-zinc-600'}`}>Pending ({pendingListings})</button>
                                                    <button onClick={() => setPropertiesTab('approved')} className={`flex-1 sm:flex-none px-4 py-2 rounded-lg text-xs font-black transition-all ${propertiesTab === 'approved' ? 'bg-white shadow-sm text-emerald-500' : 'text-zinc-400 hover:text-zinc-600'}`}>Approved</button>
                                                    <button onClick={() => setPropertiesTab('rejected')} className={`flex-1 sm:flex-none px-4 py-2 rounded-lg text-xs font-black transition-all ${propertiesTab === 'rejected' ? 'bg-white shadow-sm text-rose-500' : 'text-zinc-400 hover:text-zinc-600'}`}>Rejected</button>
                                                    <button onClick={() => setPropertiesTab('all')} className={`flex-1 sm:flex-none px-4 py-2 rounded-lg text-xs font-black transition-all ${propertiesTab === 'all' ? 'bg-white shadow-sm text-zinc-900' : 'text-zinc-400 hover:text-zinc-600'}`}>All</button>
                                                </div>
                                                <div className="relative w-full sm:w-64">
                                                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400" size={16} />
                                                    <input
                                                        type="text" placeholder="Search..."
                                                        value={listingSearch} onChange={e => setListingSearch(e.target.value)}
                                                        className="w-full pl-10 pr-4 py-2.5 bg-zinc-50 rounded-xl text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-500/20 placeholder:text-zinc-300"
                                                    />
                                                </div>
                                            </div>
                                        </div>

                                        <div className="overflow-x-auto">
                                            <table className="w-full text-left">
                                                <thead>
                                                    <tr className="text-zinc-400 text-[10px] font-black uppercase tracking-widest border-b border-zinc-50">
                                                        <th className="px-8 py-5">Property</th>
                                                        <th className="px-8 py-5 text-center">Approval Status</th>
                                                        <th className="px-8 py-5 text-center">Action</th>
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y divide-zinc-50">
                                                    {filteredListings.length === 0 ? (
                                                        <tr>
                                                            <td colSpan={3} className="px-8 py-16 text-center text-zinc-400 font-bold">
                                                                No listings found.
                                                            </td>
                                                        </tr>
                                                    ) : filteredListings.map(listing => (
                                                        <tr
                                                            key={listing.id}
                                                            onClick={() => openListingDetail(listing)}
                                                            className="group hover:bg-zinc-50/80 transition-colors cursor-pointer"
                                                        >
                                                            <td className="px-8 py-5">
                                                                <div className="flex items-center gap-4">
                                                                    {listing.images?.[0] ? (
                                                                        <img loading="lazy" src={listing.images[0]} alt="listing" className="w-14 h-14 rounded-2xl object-cover flex-shrink-0 border border-zinc-100" />
                                                                    ) : (
                                                                        <div className="w-14 h-14 bg-zinc-100 rounded-2xl flex items-center justify-center flex-shrink-0">
                                                                            <Building2 size={20} className="text-zinc-300" />
                                                                        </div>
                                                                    )}
                                                                    <div>
                                                                        <div className="flex items-center gap-2">
                                                                            <p className="font-black text-zinc-950 group-hover:text-emerald-600 transition-colors">
                                                                                {listing.title || 'Untitled Listing'}
                                                                            </p>
                                                                            <span className="text-[10px] font-mono font-black text-zinc-400 bg-zinc-100 px-1.5 py-0.5 rounded uppercase">
                                                                                #{listing.id ? listing.id.slice(0, 8) : 'N/A'}
                                                                            </span>
                                                                        </div>
                                                                        <p className="text-xs font-bold text-zinc-400 mt-0.5">
                                                                            {listing.upazila || listing.location || listing.address || 'No location set'}
                                                                        </p>
                                                                        {listing.rent && (
                                                                            <p className="text-xs font-black text-emerald-600 mt-0.5">৳{Number(listing.rent).toLocaleString()}/mo</p>
                                                                        )}
                                                                    </div>
                                                                </div>
                                                            </td>
                                                            <td className="px-8 py-5 text-center">
                                                                {listing.isApproved ? (
                                                                    <span className="inline-flex items-center gap-1.5 text-[10px] font-black px-3 py-1.5 rounded-full bg-emerald-50 text-emerald-600 uppercase tracking-widest">
                                                                        <CheckCircle size={11} /> Verified
                                                                    </span>
                                                                ) : listing.isRejected ? (
                                                                    <span className="inline-flex items-center gap-1.5 text-[10px] font-black px-3 py-1.5 rounded-full bg-rose-50 text-rose-600 uppercase tracking-widest">
                                                                        <X size={11} /> Rejected
                                                                    </span>
                                                                ) : (
                                                                    <span className="inline-flex items-center gap-1.5 text-[10px] font-black px-3 py-1.5 rounded-full bg-amber-50 text-amber-600 uppercase tracking-widest">
                                                                        <Clock size={11} /> Pending
                                                                    </span>
                                                                )}
                                                            </td>
                                                            <td className="px-8 py-5 text-center">
                                                                {listing.isApproved ? (
                                                                    <span className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Live ✓</span>
                                                                ) : (
                                                                    <div className="flex items-center justify-center gap-2">
                                                                        <button
                                                                            onClick={e => { e.stopPropagation(); handleApproveListing(listing); }}
                                                                            className="px-3 py-1.5 bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-black rounded-xl transition-all shadow-sm active:scale-95 flex items-center gap-1"
                                                                        >
                                                                            Approve
                                                                        </button>
                                                                        {!listing.isRejected && (
                                                                            <button
                                                                                onClick={e => { e.stopPropagation(); handleRejectListing(listing); }}
                                                                                className="px-3 py-1.5 bg-rose-500 hover:bg-rose-600 text-white text-xs font-black rounded-xl transition-all shadow-sm active:scale-95 flex items-center gap-1"
                                                                            >
                                                                                Reject
                                                                            </button>
                                                                        )}
                                                                    </div>
                                                                )}
                                                            </td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                        {listings.length >= propertiesLimit && (
                                            <div className="p-6 border-t border-zinc-50 flex justify-center bg-zinc-50/30">
                                                <button
                                                    onClick={() => setPropertiesLimit(prev => prev + 50)}
                                                    className="px-6 py-2.5 bg-white border border-zinc-200 text-zinc-600 font-black text-xs uppercase tracking-widest rounded-xl shadow-sm hover:bg-zinc-50 transition-all active:scale-95"
                                                >
                                                    Load More
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            } />

                            {/* ── Enquiries ── */}
                            <Route path="enquiries" element={
                                <div className="space-y-6">
                                    <div className="bg-white rounded-3xl border border-zinc-100 shadow-sm overflow-hidden">
                                        <div className="px-8 py-8 border-b border-zinc-50">
                                            <h3 className="text-2xl font-black text-zinc-950">Support Enquiries</h3>
                                            <p className="text-sm text-zinc-400 font-bold mt-1">
                                                {enquiries.length} total tickets · <span className="text-red-500">{enquiries.filter(e => e.status !== 'resolved').length} needs attention</span>
                                            </p>
                                        </div>

                                        <div className="divide-y divide-zinc-50">
                                            {enquiries.length === 0 ? (
                                                <div className="px-8 py-16 text-center text-zinc-400 font-bold">
                                                    No enquiries found.
                                                </div>
                                            ) : enquiries.map(enquiry => (
                                                <EnquiryCard
                                                    key={enquiry.id}
                                                    enquiry={enquiry}
                                                    onReply={handleReplyEnquiry}
                                                    onResolve={handleResolveEnquiry}
                                                    onDelete={handleDeleteEnquiry}
                                                />
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            } />

                            {/* ── Payments & Escrow ── */}
                            <Route path="payments" element={
                                <div className="space-y-8">
                                    <div className="bg-white rounded-3xl border border-zinc-100 shadow-sm overflow-hidden">
                                        <div className="px-8 py-8 border-b border-zinc-50">
                                            <h3 className="text-2xl font-black text-zinc-950">Payment Verification</h3>
                                            <p className="text-sm text-zinc-400 font-bold mt-1">
                                                {payments.filter(p => p.status === 'pending').length} pending verifications
                                            </p>
                                        </div>
                                        <div className="overflow-x-auto">
                                            <table className="w-full text-left">
                                                <thead>
                                                    <tr className="text-zinc-400 text-[10px] font-black uppercase tracking-widest border-b border-zinc-50">
                                                        <th className="px-8 py-5">Payment Type & Package</th>
                                                        <th className="px-8 py-5">Amount & Method</th>
                                                        <th className="px-8 py-5">Transaction ID</th>
                                                        <th className="px-8 py-5 text-center">Status</th>
                                                        <th className="px-8 py-5 text-center">Actions</th>
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y divide-zinc-50">
                                                    {payments.length === 0 ? (
                                                        <tr><td colSpan="5" className="text-center py-8 text-zinc-400">No payments found.</td></tr>
                                                    ) : payments.map(payment => (
                                                        <tr key={payment.id} className="group hover:bg-zinc-50/50 transition-colors">
                                                            <td className="px-8 py-6">
                                                                <p className="font-black text-zinc-950 tracking-tight">{(payment.type || '').replace('_', ' ').toUpperCase()}</p>
                                                                {payment.type === 'subscription' && payment.metadata?.plan ? (
                                                                    <p className="text-[10px] font-black text-emerald-600 uppercase tracking-widest mt-1">Package: {payment.metadata.plan}</p>
                                                                ) : (
                                                                    <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest mt-1">Prop: {payment.propertyName || 'N/A'}</p>
                                                                )}
                                                            </td>
                                                            <td className="px-8 py-6">
                                                                <span className="font-black text-emerald-600">৳{payment.amount?.toLocaleString()}</span>
                                                                <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest mt-0.5">{payment.paymentMethod || payment.method || 'Unknown'}</p>
                                                            </td>
                                                            <td className="px-8 py-6">
                                                                <p className="text-sm font-bold text-zinc-950 tracking-wider font-mono">{payment.transactionId}</p>
                                                                {payment.metadata?.userEmail && <p className="text-[10px] text-zinc-400 font-bold mt-1">{payment.metadata.userEmail}</p>}
                                                                {payment.verifiedBy === 'sms-watcher' && (
                                                                    <div className="mt-2 p-1.5 bg-emerald-50 rounded-md border border-emerald-100 inline-block">
                                                                        <span className="text-[9px] font-black uppercase tracking-widest text-emerald-600 flex items-center gap-1">
                                                                            <CheckCircle size={10} /> Auto-Verified ({payment.smsProvider || 'SMS'})
                                                                        </span>
                                                                        <span className="text-[10px] font-bold text-emerald-600/70 mt-0.5 block">
                                                                            Sender: {payment.smsSenderNumber || 'Unknown'}
                                                                        </span>
                                                                    </div>
                                                                )}
                                                            </td>
                                                            <td className="px-8 py-6 text-center">
                                                                <span className={`text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-widest ${payment.status === 'completed' ? 'bg-emerald-50 text-emerald-600' : payment.status === 'failed' ? 'bg-red-50 text-red-600' : 'bg-amber-50 text-amber-600'}`}>
                                                                    {payment.status}
                                                                </span>
                                                            </td>
                                                            <td className="px-8 py-6">
                                                                {payment.status === 'pending' && (
                                                                    <div className="flex justify-center gap-2">
                                                                        <button onClick={() => handleApprovePayment(payment)} className="p-2 bg-emerald-50 text-emerald-600 rounded-xl hover:bg-emerald-500 hover:text-white transition-colors" title="Approve">
                                                                            <CheckCircle size={16} />
                                                                        </button>
                                                                        <button onClick={() => handleRejectPayment(payment)} className="p-2 bg-red-50 text-red-600 rounded-xl hover:bg-red-500 hover:text-white transition-colors" title="Reject">
                                                                            <Trash2 size={16} />
                                                                        </button>
                                                                    </div>
                                                                )}
                                                            </td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>
                                    
                                    <div className="bg-white rounded-3xl border border-zinc-100 shadow-sm overflow-hidden">
                                        <div className="px-8 py-8 border-b border-zinc-50">
                                            <h3 className="text-2xl font-black text-zinc-950">Escrow Management</h3>
                                            <p className="text-sm text-zinc-400 font-bold mt-1">
                                                {escrowDeposits.filter(e => e.status === 'held').length} deposits currently held
                                            </p>
                                        </div>
                                        <div className="overflow-x-auto">
                                            <table className="w-full text-left">
                                                <thead>
                                                    <tr className="text-zinc-400 text-[10px] font-black uppercase tracking-widest border-b border-zinc-50">
                                                        <th className="px-8 py-5">Property & Tenant</th>
                                                        <th className="px-8 py-5">Deposit</th>
                                                        <th className="px-8 py-5 text-center">Status</th>
                                                        <th className="px-8 py-5 text-center">Confirmations</th>
                                                        <th className="px-8 py-5 text-center">Actions</th>
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y divide-zinc-50">
                                                    {escrowDeposits.length === 0 ? (
                                                        <tr><td colSpan="5" className="text-center py-8 text-zinc-400">No escrow deposits.</td></tr>
                                                    ) : escrowDeposits.map(escrow => (
                                                        <tr key={escrow.id} className="group hover:bg-zinc-50/50 transition-colors">
                                                            <td className="px-8 py-6">
                                                                <p className="font-black text-zinc-950 tracking-tight">{escrow.propertyName}</p>
                                                                <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest mt-1">Tenant ID: {escrow.tenantId?.slice(0,6)}...</p>
                                                            </td>
                                                            <td className="px-8 py-6">
                                                                <span className="font-black text-emerald-600">৳{escrow.depositAmount?.toLocaleString()}</span>
                                                            </td>
                                                            <td className="px-8 py-6 text-center">
                                                                <span className={`text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-widest ${escrow.status === 'released' ? 'bg-emerald-50 text-emerald-600' : 'bg-blue-50 text-blue-600 dark:text-blue-400'}`}>
                                                                    {escrow.status}
                                                                </span>
                                                            </td>
                                                            <td className="px-8 py-6 text-center">
                                                                <div className="flex flex-col gap-1 items-center">
                                                                    <span className={`text-[9px] font-black uppercase tracking-widest ${escrow.confirmedByTenant ? 'text-emerald-500' : 'text-zinc-400'}`}>
                                                                        Tenant: {escrow.confirmedByTenant ? 'Yes' : 'No'}
                                                                    </span>
                                                                    <span className={`text-[9px] font-black uppercase tracking-widest ${escrow.confirmedByOwner ? 'text-emerald-500' : 'text-zinc-400'}`}>
                                                                        Owner: {escrow.confirmedByOwner ? 'Yes' : 'No'}
                                                                    </span>
                                                                </div>
                                                            </td>
                                                            <td className="px-8 py-6">
                                                                {escrow.status === 'held' && escrow.confirmedByTenant && escrow.confirmedByOwner && (
                                                                    <div className="flex justify-center">
                                                                        <button onClick={() => handleReleaseEscrow(escrow.id)} className="px-4 py-2 bg-emerald-500 text-white font-black text-[10px] uppercase tracking-widest rounded-xl hover:bg-emerald-600 transition-colors shadow-lg shadow-emerald-500/20">
                                                                            Release Funds
                                                                        </button>
                                                                    </div>
                                                                )}
                                                            </td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>
                                </div>
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
                                <div className="space-y-6">
                                    <div className="bg-white rounded-3xl border border-zinc-100 shadow-sm overflow-hidden">
                                        <div className="px-8 py-8 border-b border-zinc-50">
                                            <h3 className="text-2xl font-black text-zinc-950">Property Reports</h3>
                                            <p className="text-sm text-zinc-400 font-bold mt-1">
                                                {reports.length} active reports · <span className="text-rose-500">Security & Content Moderation</span>
                                            </p>
                                        </div>

                                        <div className="divide-y divide-zinc-50">
                                            {reports.length === 0 ? (
                                                <div className="px-8 py-16 text-center text-zinc-400 font-bold">
                                                    No property reports found. Excellent!
                                                </div>
                                            ) : reports.sort((a, b) => (b.createdAt?.toMillis() || 0) - (a.createdAt?.toMillis() || 0)).map(report => (
                                                <div key={report.id} className="p-8 hover:bg-rose-50/[0.02] transition-all border-l-4 border-transparent hover:border-rose-500">
                                                    <div className="flex flex-col lg:flex-row justify-between items-start gap-6">
                                                        <div className="flex-1 space-y-4">
                                                            <div className="flex items-center gap-4">
                                                                <div className="w-12 h-12 bg-rose-50 rounded-2xl flex items-center justify-center text-rose-500">
                                                                    <Flag size={24} />
                                                                </div>
                                                                <div>
                                                                    <p className="text-[10px] font-black text-rose-500 uppercase tracking-widest mb-1">Reason: {report.reason}</p>
                                                                    <h4 className="text-lg font-black text-zinc-950 leading-tight">
                                                                        {report.propertyTitle}
                                                                    </h4>
                                                                    <p className="text-xs font-bold text-zinc-400 mt-1">Property ID: {report.propertyId}</p>
                                                                </div>
                                                            </div>
                                                            
                                                            <div className="bg-zinc-50 rounded-2xl p-6 border border-zinc-100">
                                                                <p className="text-sm text-zinc-600 font-medium leading-relaxed italic">
                                                                    "{report.details || 'No additional details provided.'}"
                                                                </p>
                                                            </div>

                                                            <div className="flex flex-wrap gap-6 items-center">
                                                                <div className="flex items-center gap-2">
                                                                    <div className="w-6 h-6 bg-zinc-200 rounded-lg flex items-center justify-center text-[10px] font-black text-zinc-600 uppercase">
                                                                        {report.reporterName?.[0] || 'U'}
                                                                    </div>
                                                                    <p className="text-xs font-bold text-zinc-500">Reporter: <span className="text-zinc-900">{report.reporterName}</span></p>
                                                                </div>
                                                                <p className="text-xs font-bold text-zinc-400">
                                                                    Email: <span className="text-zinc-700">{report.reporterEmail}</span>
                                                                </p>
                                                                <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">
                                                                    {report.createdAt?.toDate()?.toLocaleString() || 'Just now'}
                                                                </p>
                                                            </div>
                                                        </div>

                                                        <div className="flex flex-row lg:flex-col gap-3 w-full lg:w-48">
                                                            <button 
                                                                onClick={() => navigate(`/property/${report.propertyId}`)}
                                                                className="flex-1 py-3 px-4 bg-zinc-950 text-white text-[10px] font-black uppercase tracking-widest rounded-xl hover:bg-zinc-800 transition-all flex items-center justify-center gap-2"
                                                            >
                                                                <Search size={14} /> View Ad
                                                            </button>
                                                            <button 
                                                                onClick={() => handleDeleteReportedProperty(report)}
                                                                className="flex-1 py-3 px-4 bg-rose-500 text-white text-[10px] font-black uppercase tracking-widest rounded-xl hover:bg-rose-600 transition-all shadow-lg shadow-rose-500/20 flex items-center justify-center gap-2"
                                                            >
                                                                <Trash2 size={14} /> Delete Ad
                                                            </button>
                                                            <button 
                                                                onClick={() => handleDismissReport(report.id)}
                                                                className="flex-1 py-3 px-4 bg-zinc-100 text-zinc-500 text-[10px] font-black uppercase tracking-widest rounded-xl hover:bg-zinc-200 transition-all flex items-center justify-center gap-2"
                                                            >
                                                                <CheckCircle size={14} /> Dismiss
                                                            </button>
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
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
            {selectedListing && (
                <>
                    {/* Backdrop */}
                    <div
                        className="fixed inset-0 bg-black/30 backdrop-blur-sm z-40"
                        onClick={closeDetail}
                    />
                    {/* Drawer */}
                    <aside className="fixed right-0 top-0 h-full w-full max-w-xl bg-white z-50 shadow-2xl flex flex-col overflow-hidden">
                        {/* Drawer Header */}
                        <div className="flex items-center justify-between px-8 py-6 border-b border-zinc-100">
                            <div>
                                <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest mb-1">Listing Detail</p>
                                <h3 className="text-xl font-black text-zinc-950 leading-tight">{selectedListing.title || 'Untitled Listing'}</h3>
                            </div>
                            <div className="flex items-center gap-3">
                                {selectedListing.isApproved ? (
                                    <span className="inline-flex items-center gap-1.5 text-[10px] font-black px-3 py-1.5 rounded-full bg-emerald-50 text-emerald-600 uppercase tracking-widest">
                                        <CheckCircle size={11} /> Verified
                                    </span>
                                ) : (
                                    <span className="inline-flex items-center gap-1.5 text-[10px] font-black px-3 py-1.5 rounded-full bg-amber-50 text-amber-600 uppercase tracking-widest">
                                        <Clock size={11} /> Pending
                                    </span>
                                )}
                                <button onClick={closeDetail} className="w-9 h-9 rounded-xl bg-zinc-50 flex items-center justify-center text-zinc-400 hover:text-zinc-900 hover:bg-zinc-100 transition-all">
                                    <ChevronRight size={18} />
                                </button>
                            </div>
                        </div>

                        {/* Scrollable body */}
                        <div className="flex-1 overflow-y-auto">
                            {/* Image */}
                            {selectedListing.images?.[0] ? (
                                <img loading="lazy"
                                    src={selectedListing.images[0]}
                                    alt="listing"
                                    className="w-full h-56 object-cover"
                                />
                            ) : (
                                <div className="w-full h-40 bg-zinc-100 flex items-center justify-center">
                                    <Building2 size={40} className="text-zinc-300" />
                                </div>
                            )}

                            <div className="p-8 space-y-6">
                                {/* Location grid */}
                                <div>
                                    <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest mb-3">Location</p>
                                    <div className="grid grid-cols-2 gap-3">
                                        {[
                                            { label: 'Division', value: selectedListing.division },
                                            { label: 'District', value: selectedListing.district },
                                            { label: 'Area', value: selectedListing.area || selectedListing.upazila },
                                            { label: 'Address', value: selectedListing.address || selectedListing.location },
                                        ].map(({ label, value }) => value ? (
                                            <div key={label} className="bg-zinc-50 rounded-2xl p-3">
                                                <p className="text-[9px] font-black text-zinc-400 uppercase tracking-widest">{label}</p>
                                                <p className="text-sm font-bold text-zinc-950 mt-0.5">{value}</p>
                                            </div>
                                        ) : null)}
                                    </div>
                                </div>

                                {/* Rent & Details */}
                                <div>
                                    <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest mb-3">Pricing & Details</p>
                                    <div className="grid grid-cols-2 gap-3">
                                        {[
                                            { label: 'Monthly Rent', value: selectedListing.rent ? `৳${Number(selectedListing.rent).toLocaleString()}` : null },
                                            { label: 'Bedrooms', value: selectedListing.bedrooms || selectedListing.beds },
                                            { label: 'Bathrooms', value: selectedListing.bathrooms },
                                            { label: 'Area (sq ft)', value: selectedListing.area_sqft || selectedListing.size },
                                        ].map(({ label, value }) => value ? (
                                            <div key={label} className="bg-zinc-50 rounded-2xl p-3">
                                                <p className="text-[9px] font-black text-zinc-400 uppercase tracking-widest">{label}</p>
                                                <p className="text-sm font-bold text-zinc-950 mt-0.5">{value}</p>
                                            </div>
                                        ) : null)}
                                    </div>
                                </div>

                                {/* Features */}
                                {selectedListing.features?.length > 0 && (
                                    <div>
                                        <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest mb-3">Features</p>
                                        <div className="flex flex-wrap gap-2">
                                            {selectedListing.features.map((f, i) => (
                                                <span key={i} className="px-3 py-1.5 bg-emerald-50 text-emerald-700 text-xs font-bold rounded-xl">{f}</span>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* Description */}
                                {selectedListing.description && (
                                    <div>
                                        <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest mb-2">Description</p>
                                        <p className="text-sm text-zinc-600 font-medium leading-relaxed">{selectedListing.description}</p>
                                    </div>
                                )}

                                {/* Owner Info */}
                                <div className="border-t border-zinc-100 pt-6">
                                    <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest mb-3">Owner / Landlord</p>
                                    {ownerLoading ? (
                                        <div className="flex items-center gap-3 p-4 bg-zinc-50 rounded-2xl">
                                            <div className="w-5 h-5 border-2 border-zinc-200 border-t-emerald-500 rounded-full animate-spin" />
                                            <p className="text-sm text-zinc-400 font-bold">Looking up owner...</p>
                                        </div>
                                    ) : listingOwner ? (
                                        <div className="bg-zinc-50 rounded-2xl p-4 flex items-start gap-4">
                                            <div className="w-11 h-11 bg-zinc-200 rounded-xl flex items-center justify-center font-black text-zinc-500 text-sm uppercase flex-shrink-0">
                                                {listingOwner.email?.[0] || '?'}
                                            </div>
                                            <div className="space-y-0.5">
                                                <p className="font-black text-zinc-950">{listingOwner.fullName || listingOwner.name || 'No name'}</p>
                                                <p className="text-sm text-zinc-500 font-bold">{listingOwner.email}</p>
                                                {(listingOwner.phone || listingOwner.contact) && (
                                                    <p className="text-sm text-emerald-600 font-bold">{listingOwner.phone || listingOwner.contact}</p>
                                                )}
                                                <p className="text-[9px] font-black text-zinc-400 uppercase tracking-widest pt-1">{listingOwner.role || 'user'} · ID: {listingOwner.id?.slice(0, 10)}...</p>
                                            </div>
                                        </div>
                                    ) : (
                                        <p className="text-sm text-zinc-400 font-bold p-4 bg-zinc-50 rounded-2xl">No owner ID linked to this listing.</p>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Drawer Footer */}
                        <div className="flex-shrink-0 px-8 py-5 border-t border-zinc-100 bg-white flex flex-col gap-3">
                            <button
                                onClick={() => handleToggleVerification(selectedListing)}
                                className={`w-full py-3.5 font-black rounded-2xl transition-all text-sm active:scale-[0.98] flex items-center justify-center gap-2 ${selectedListing.isVerified ? 'bg-amber-50 text-amber-600 hover:bg-amber-100' : 'bg-emerald-50 text-emerald-600 hover:bg-emerald-100 border border-emerald-100'}`}
                            >
                                <ShieldCheck size={18} />
                                {selectedListing.isVerified ? 'Remove Verification' : 'Verify Landlord'}
                            </button>

                            {!selectedListing.isApproved && (
                                <div className="flex gap-3">
                                    <button
                                        onClick={() => handleApproveListing(selectedListing)}
                                        className="flex-1 py-3.5 bg-emerald-500 hover:bg-emerald-600 text-white font-black rounded-2xl transition-all text-sm shadow-lg shadow-emerald-500/20 active:scale-[0.98]"
                                    >
                                        ✓ Approve
                                    </button>
                                    {!selectedListing.isRejected && (
                                        <button
                                            onClick={() => handleRejectListing(selectedListing)}
                                            className="flex-1 py-3.5 bg-rose-500 hover:bg-rose-600 text-white font-black rounded-2xl transition-all text-sm shadow-lg shadow-rose-500/20 active:scale-[0.98]"
                                        >
                                            ✕ Reject
                                        </button>
                                    )}
                                </div>
                            )}
                        </div>
                    </aside>
                </>
            )}

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
            {selectedUser && (
                <>
                    {/* Backdrop */}
                    <div
                        className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4"
                        onClick={() => setSelectedUser(null)}
                    >
                        {/* Modal Card */}
                        <div
                            className="bg-white dark:bg-slate-900 rounded-[32px] w-full max-w-lg overflow-hidden shadow-2xl border border-zinc-100 dark:border-slate-800"
                            onClick={e => e.stopPropagation()}
                        >
                            {/* Header */}
                            <div className="px-8 py-6 border-b border-zinc-100 dark:border-slate-800 flex items-center justify-between">
                                <div>
                                    <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest mb-1">User Profile Card</p>
                                    <h3 className="text-xl font-black text-zinc-950 dark:text-white leading-tight">Identity Details</h3>
                                </div>
                                <button
                                    onClick={() => setSelectedUser(null)}
                                    className="w-9 h-9 rounded-xl bg-zinc-50 dark:bg-slate-800 flex items-center justify-center text-zinc-400 hover:text-zinc-900 dark:hover:text-white transition-all"
                                >
                                    <X size={18} />
                                </button>
                            </div>

                            {/* Body */}
                            <div className="p-8 space-y-6 max-h-[70vh] overflow-y-auto">
                                {/* Profile Head */}
                                <div className="flex items-center gap-5 bg-zinc-50 dark:bg-slate-800/50 p-6 rounded-3xl">
                                    {selectedUser.photoURL ? (
                                        <img loading="lazy" src={selectedUser.photoURL} alt="Profile" className="w-16 h-16 rounded-2xl object-cover" />
                                    ) : (
                                        <div className="w-16 h-16 bg-emerald-500 rounded-2xl flex items-center justify-center font-black text-white text-2xl uppercase">
                                            {selectedUser.fullName?.[0] || selectedUser.email?.[0] || '?'}
                                        </div>
                                    )}
                                    <div>
                                        <h4 className="text-lg font-black text-zinc-950 dark:text-white">{selectedUser.fullName || 'Anonymous User'}</h4>
                                        <p className="text-sm font-bold text-zinc-500 dark:text-zinc-400">{selectedUser.email}</p>
                                        <span className="inline-block mt-2 text-[9px] font-black px-2.5 py-1 bg-emerald-100 text-emerald-800 rounded-full uppercase tracking-widest">
                                            {selectedUser.role || 'client'}
                                        </span>
                                    </div>
                                </div>

                                {/* Main details */}
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="bg-zinc-50 dark:bg-slate-800/30 p-4 rounded-2xl">
                                        <p className="text-[9px] font-black text-zinc-400 dark:text-zinc-500 uppercase tracking-widest">Account Status</p>
                                        <p className="text-sm font-bold text-zinc-950 dark:text-white mt-1 capitalize">{selectedUser.accountStatus || 'Active'}</p>
                                    </div>
                                    <div className="bg-zinc-50 dark:bg-slate-800/30 p-4 rounded-2xl">
                                        <p className="text-[9px] font-black text-zinc-400 dark:text-zinc-500 uppercase tracking-widest">Contact Phone</p>
                                        <p className="text-sm font-bold text-zinc-950 dark:text-white mt-1">{selectedUser.phone || selectedUser.contact || 'Not provided'}</p>
                                    </div>
                                    <div className="bg-zinc-50 dark:bg-slate-800/30 p-4 rounded-2xl">
                                        <p className="text-[9px] font-black text-zinc-400 dark:text-zinc-500 uppercase tracking-widest">Subscription Plan</p>
                                        <p className="text-sm font-bold text-zinc-950 dark:text-white mt-1">{selectedUser.subscriptionPlan || 'Free'}</p>
                                    </div>
                                    <div className="bg-zinc-50 dark:bg-slate-800/30 p-4 rounded-2xl">
                                        <p className="text-[9px] font-black text-zinc-400 dark:text-zinc-500 uppercase tracking-widest">KYC Status</p>
                                        <p className="text-sm font-bold text-zinc-950 dark:text-white mt-1">
                                            {selectedUser.verification?.isKycApproved ? '✅ Verified' : selectedUser.onboardingStatus === 'PENDING_VERIFICATION' ? '⏳ Under Review' : '❌ Unverified'}
                                        </p>
                                    </div>
                                </div>

                                {/* Documents / ID Verification */}
                                {selectedUser.verification?.idDocumentUrl && (
                                    <div className="border-t border-zinc-100 dark:border-slate-800 pt-6">
                                        <p className="text-[10px] font-black text-zinc-400 dark:text-zinc-500 uppercase tracking-widest mb-3">Government Issued ID</p>
                                        <a
                                            href={selectedUser.verification.idDocumentUrl}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="block overflow-hidden rounded-2xl border border-zinc-200 dark:border-slate-800 hover:opacity-90 transition-opacity"
                                        >
                                            <img loading="lazy" src={selectedUser.verification.idDocumentUrl} alt="Government ID" className="w-full h-40 object-cover bg-zinc-50" />
                                        </a>
                                    </div>
                                )}
                            </div>

                            {/* Footer */}
                            <div className="px-8 py-5 border-t border-zinc-100 dark:border-slate-800 bg-zinc-50 dark:bg-slate-800/50 flex justify-end gap-3">
                                <button
                                    onClick={() => setSelectedUser(null)}
                                    className="px-6 py-2.5 bg-zinc-950 hover:bg-zinc-800 text-white font-black rounded-xl text-sm transition-all"
                                >
                                    Close Details
                                </button>
                            </div>
                        </div>
                    </div>
                </>
            )}/m;
        </div>
    );
}
