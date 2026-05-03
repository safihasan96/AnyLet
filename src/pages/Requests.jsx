import { useState, useEffect } from 'react';
import { collection, query, where, onSnapshot, doc, deleteDoc, updateDoc } from 'firebase/firestore';

import { db } from '../firebase';
import { useAuth } from '../contexts/AuthContext';
import { ArrowLeft, Search, Eye, MessageSquare, Clock, Trash2, Home, Phone } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import ConfirmationModal from '../components/ConfirmationModal';
import TenantDetailsModal from '../components/TenantDetailsModal';
import ListingPreviewModal from '../components/ListingPreviewModal';

export default function Requests() {
    const { currentUser } = useAuth();
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState('received'); // 'sent' or 'received'
    const [requests, setRequests] = useState([]);
    const [loading, setLoading] = useState(true);

    // Modal State
    const [deleteModalOpen, setDeleteModalOpen] = useState(false);
    const [requestToDelete, setRequestToDelete] = useState(null);
    const [isDeleting, setIsDeleting] = useState(false);

    const [isTenantModalOpen, setIsTenantModalOpen] = useState(false);
    const [selectedRequest, setSelectedRequest] = useState(null);

    const [isListingModalOpen, setIsListingModalOpen] = useState(false);
    const [selectedListingRequest, setSelectedListingRequest] = useState(null);

    const [callModalOpen, setCallModalOpen] = useState(false);
    const [phoneNumberToCall, setPhoneNumberToCall] = useState('');

    useEffect(() => {
        if (!currentUser) return;

        setLoading(true);
        const requestsRef = collection(db, 'viewing_requests');
        let q;

        if (activeTab === 'received') {
            q = query(requestsRef, where('ownerId', '==', currentUser.uid));
        } else {
            q = query(requestsRef, where('tenantId', '==', currentUser.uid));
        }

        const unsubscribe = onSnapshot(q, (snapshot) => {
            let reqData = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data(),
                createdAt: doc.data().createdAt?.toDate() || new Date()
            }));

            // Client-side sort to avoid requiring composite indexes in Firestore
            reqData.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

            setRequests(reqData);
            setLoading(false);
        }, (error) => {
            console.error("Error fetching requests:", error);
            setLoading(false);
        });

        return () => unsubscribe();
    }, [currentUser, activeTab]);

    const promptDeleteRequest = (requestId) => {
        setRequestToDelete(requestId);
        setDeleteModalOpen(true);
    };

    const handleDeleteRequest = async () => {
        if (!requestToDelete) return;
        setIsDeleting(true);
        try {
            await deleteDoc(doc(db, 'viewing_requests', requestToDelete));
            // Snapshot listener will automatically remove it from the list
            setDeleteModalOpen(false);
            setRequestToDelete(null);
        } catch (error) {
            console.error("Error deleting request:", error);
            alert("Failed to delete request. Please try again.");
        } finally {
            setIsDeleting(false);
        }
    };

    const formatDate = (date) => {
        return new Intl.DateTimeFormat('en-US', {
            month: 'short', day: 'numeric', year: 'numeric',
            hour: 'numeric', minute: '2-digit', hour12: true
        }).format(date);
    };

    return (
        <div className="flex flex-col min-h-screen bg-slate-50 dark:bg-slate-900 pb-24">
            {/* Header */}
            <header className="flex items-center justify-between p-4 bg-white dark:bg-slate-800 sticky top-0 z-10 border-b border-slate-100 dark:border-slate-700">
                <button onClick={() => navigate(-1)} className="text-slate-700 dark:text-slate-300 p-2">
                    <ArrowLeft size={24} />
                </button>
                <h1 className="text-xl font-black text-slate-900 dark:text-white tracking-tight">Rental Requests</h1>
                <button className="text-slate-700 dark:text-slate-300 p-2">
                    <Search size={24} />
                </button>
            </header>

            {/* Tabs */}
            <div className="flex bg-white dark:bg-slate-800 border-b border-slate-100 dark:border-slate-700">
                <button
                    onClick={() => setActiveTab('sent')}
                    className={`flex-1 py-4 text-sm font-bold transition-all relative ${activeTab === 'sent'
                        ? 'text-[#3E2B88] dark:text-[#6a54bd]'
                        : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
                        }`}
                >
                    Sent
                    {activeTab === 'sent' && (
                        <div className="absolute bottom-0 left-0 right-0 h-1 bg-[#3E2B88] dark:bg-[#6a54bd]" />
                    )}
                </button>
                <button
                    onClick={() => setActiveTab('received')}
                    className={`flex-1 py-4 text-sm font-bold transition-all relative ${activeTab === 'received'
                        ? 'text-[#3E2B88] dark:text-[#6a54bd]'
                        : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
                        }`}
                >
                    Received
                    {activeTab === 'received' && (
                        <div className="absolute bottom-0 left-0 right-0 h-1 bg-[#3E2B88] dark:bg-[#6a54bd]" />
                    )}
                </button>
            </div>

            {/* Content */}
            <div className="p-4 space-y-4">
                {loading ? (
                    <div className="space-y-4">
                        {[1, 2, 3].map(i => (
                            <div key={i} className="bg-white dark:bg-slate-800 p-5 rounded-3xl animate-pulse h-40" />
                        ))}
                    </div>
                ) : requests.length === 0 ? (
                    <div className="flex flex-col items-center justify-center p-10 text-center space-y-4">
                        <div className="w-20 h-20 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center text-slate-400">
                            <Clock size={32} />
                        </div>
                        <div>
                            <h3 className="text-lg font-black text-slate-900 dark:text-white">No requests yet</h3>
                            <p className="text-slate-500 text-sm mt-1">You haven't {activeTab === 'sent' ? 'sent' : 'received'} any rental requests.</p>
                        </div>
                    </div>
                ) : (
                    requests.map(request => (
                        <RequestCard
                            key={request.id}
                            request={request}
                            isReceived={activeTab === 'received'}
                            formatDate={formatDate}
                            onDelete={() => promptDeleteRequest(request.id)}
                            onReview={async () => {
                                setSelectedRequest(request);
                                setIsTenantModalOpen(true);
                                if (!request.isRead && activeTab === 'received') {
                                    try {
                                        await updateDoc(doc(db, 'viewing_requests', request.id), { isRead: true });
                                    } catch (err) {
                                        console.error("Error marking as read:", err);
                                    }
                                }
                            }}
                            onListingClick={() => {
                                if (activeTab === 'sent') {
                                    setSelectedListingRequest(request);
                                    setIsListingModalOpen(true);
                                }
                            }}
                            onCallClick={(phone) => {
                                if (phone) {
                                    setPhoneNumberToCall(phone);
                                    setCallModalOpen(true);
                                } else {
                                    alert("Phone number not available");
                                }
                            }}
                        />
                    ))
                )}
            </div>

            <ConfirmationModal
                isOpen={deleteModalOpen}
                title="Withdraw Request"
                message="Are you sure you want to withdraw this viewing request? The property owner will no longer see it."
                confirmText="Withdraw"
                confirmColor="#ef4444"
                isLoading={isDeleting}
                onConfirm={handleDeleteRequest}
                onCancel={() => {
                    setDeleteModalOpen(false);
                    setRequestToDelete(null);
                }}
            />

            <TenantDetailsModal
                isOpen={isTenantModalOpen}
                request={selectedRequest}
                onClose={() => {
                    setIsTenantModalOpen(false);
                    setSelectedRequest(null);
                }}
            />

            <ListingPreviewModal
                isOpen={isListingModalOpen}
                request={selectedListingRequest}
                onClose={() => {
                    setIsListingModalOpen(false);
                    setSelectedListingRequest(null);
                }}
            />

            <ConfirmationModal
                isOpen={callModalOpen}
                title="Make a Call to Tenant"
                message="Are you sure you want to call this tenant? Your phone dialer will be launched."
                confirmText="Call"
                confirmColor="#16a34a"
                onConfirm={() => {
                    window.location.href = `tel:${phoneNumberToCall}`;
                    setCallModalOpen(false);
                }}
                onCancel={() => setCallModalOpen(false)}
            />
        </div>
    );
}

function RequestCard({ request, isReceived, formatDate, onDelete, onReview, onListingClick, onCallClick }) {
    // Generate a placeholder avatar if none exists
    const seed = request.tenantId || Math.random();
    const avatarUrl = `https://api.dicebear.com/7.x/notionists/svg?seed=${seed}&backgroundColor=f1f5f9`;

    return (
        <div 
            className={`bg-white dark:bg-slate-800 p-5 rounded-[2rem] shadow-[0_2px_10px_-4px_rgba(0,0,0,0.1)] dark:shadow-none border border-transparent dark:border-slate-700 space-y-5 ${!isReceived ? 'cursor-pointer hover:border-slate-200 dark:hover:border-slate-600 transition-colors' : ''}`}
            onClick={() => {
                if (!isReceived && onListingClick) {
                    onListingClick();
                }
            }}
        >
            <div className="flex items-start gap-4">
                {isReceived ? (
                    <img
                        src={avatarUrl}
                        alt="Avatar"
                        className="w-14 h-14 rounded-full bg-slate-100 object-cover shrink-0"
                    />
                ) : (
                    <div className="w-16 h-16 rounded-2xl bg-slate-100 dark:bg-slate-700 overflow-hidden shrink-0 shadow-sm border border-slate-200 dark:border-slate-600">
                        {request.propertyImage ? (
                            <img
                                src={request.propertyImage}
                                alt={request.propertyName || 'Property'}
                                className="w-full h-full object-cover"
                            />
                        ) : (
                            <div className="w-full h-full flex items-center justify-center text-slate-400">
                                <Home size={24} />
                            </div>
                        )}
                    </div>
                )}

                <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-start">
                        <h3 className="font-black text-slate-900 dark:text-white text-lg truncate pr-2">
                            {isReceived ? (request.tenantName || 'Tenant user') : (request.propertyName || 'Property details unavailable')}
                        </h3>
                        {request.status === 'pending' && (
                            <span className="bg-[#ede9fe] text-[#5b21b6] px-2 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider shrink-0 mt-1">
                                Pending
                            </span>
                        )}
                    </div>
                    {isReceived && (
                        <p className="text-slate-600 dark:text-slate-400 text-sm mt-1">
                            Interested in <span className="font-bold text-[#3E2B88] dark:text-[#a78bfa]">{request.propertyName}</span>
                        </p>
                    )}
                    <p className="text-xs text-slate-400 font-medium mt-1">
                        {isReceived ? 'Received' : 'Sent'} {formatDate(request.createdAt)}
                    </p>
                </div>
            </div>

            <div className="flex gap-3">
                {isReceived ? (
                    <>
                        <button
                            onClick={onReview}
                            className="flex-1 flex items-center justify-center gap-2 bg-[#3E2B88] text-white font-bold py-3.5 rounded-2xl transition-transform active:scale-95 shadow-md shadow-[#3E2B88]/20"
                        >
                            <Eye size={18} />
                            Review
                        </button>
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                onCallClick(request?.tenantDetails?.phone || request?.userPhone || request?.phone || '');
                            }}
                            className="flex-1 flex items-center justify-center gap-2 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold py-3.5 rounded-2xl transition-transform active:scale-95"
                        >
                            <Phone size={18} />
                            Call
                        </button>
                    </>
                ) : (
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            onDelete();
                        }}
                        className="flex-1 flex items-center justify-center gap-2 bg-rose-50 dark:bg-rose-900/20 text-rose-600 dark:text-rose-400 font-bold py-3.5 rounded-2xl transition-colors hover:bg-rose-100 dark:hover:bg-rose-900/40 active:scale-95 border border-rose-100 dark:border-rose-900/50"
                    >
                        <Trash2 size={18} />
                        Withdraw Request
                    </button>
                )}
            </div>
        </div>
    );
}
