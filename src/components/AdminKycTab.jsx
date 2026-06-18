import { useState, useEffect } from 'react';
import { collection, query, where, onSnapshot, updateDoc, doc } from 'firebase/firestore';
import { db } from '../firebase';
import { ShieldCheck, XCircle, Clock, CheckCircle, FileCheck, ExternalLink, User } from 'lucide-react';
import { useToast } from '../contexts/ToastContext';
import { createNotification } from '../utils/notificationService';
import logger from '../utils/logger';

const STATUS_MAP = {
    PENDING_VERIFICATION: { label: 'Pending Review', color: 'amber', icon: Clock },
    COMPLETED: { label: 'Approved', color: 'emerald', icon: CheckCircle },
    REJECTED: { label: 'Rejected', color: 'rose', icon: XCircle },
};

const DOC_TYPE_LABELS = { nid: 'National ID', passport: 'Passport', license: 'Driving License' };

export default function AdminKycTab({ openModal }) {
    const [users, setUsers] = useState([]);
    const [filter, setFilter] = useState('PENDING_VERIFICATION'); // | 'COMPLETED' | 'REJECTED'
    const [loading, setLoading] = useState(true);
    const toast = useToast();

    useEffect(() => {
        setLoading(true);
        const q = query(
            collection(db, 'users'),
            where('onboardingStatus', 'in', ['PENDING_VERIFICATION', 'COMPLETED', 'REJECTED'])
        );
        const unsub = onSnapshot(q, snap => {
            setUsers(snap.docs.map(d => ({ id: d.id, ...d.data() })));
            setLoading(false);
        }, err => {
            logger.error(err);
            setLoading(false);
        });
        return unsub;
    }, []);

    const filtered = users.filter(u => u.onboardingStatus === filter);

    async function approve(user) {
        try {
            await updateDoc(doc(db, 'users', user.id), {
                'verification.isKycApproved': true,
                onboardingStatus: 'COMPLETED',
            });
            await createNotification(
                user.id,
                'kyc_approved',
                'Identity Verified ✅',
                'Your identity has been verified. You now have full access to all AnyLet features.',
                '/profile'
            );
            toast.success(`${user.fullName || user.email} approved`);
        } catch (err) {
            logger.error(err);
            toast.error('Failed to approve');
        }
    }

    function reject(user) {
        openModal({
            title: 'Reject KYC Submission',
            message: `Are you sure you want to reject the ID submission from ${user.fullName || user.email}? They will be notified to resubmit.`,
            confirmText: 'Reject',
            confirmColor: '#f43f5e',
            onConfirm: async () => {
                try {
                    await updateDoc(doc(db, 'users', user.id), {
                        'verification.isKycApproved': false,
                        onboardingStatus: 'REJECTED',
                    });
                    await createNotification(
                        user.id,
                        'kyc_rejected',
                        'ID Verification Failed',
                        'We couldn\'t verify your ID. Please re-upload a clearer, valid document.',
                        '/profile'
                    );
                    toast.success('Rejection sent');
                } catch (err) {
                    logger.error(err);
                    toast.error('Failed to reject');
                }
            }
        });
    }

    return (
        <div className="space-y-5">
            {/* Filter tabs */}
            <div className="flex items-center gap-2 border-b border-zinc-100 pb-4">
                {Object.entries(STATUS_MAP).map(([key, { label, color }]) => (
                    <button
                        key={key}
                        onClick={() => setFilter(key)}
                        className={`px-5 py-2 rounded-xl font-black text-xs uppercase tracking-widest transition-all ${filter === key ? 'bg-zinc-950 text-white' : 'bg-zinc-50 text-zinc-500 hover:bg-zinc-100'}`}
                    >
                        {label}
                        <span className={`ml-2 px-1.5 py-0.5 rounded-full text-[10px] ${filter === key ? 'bg-white/20' : `bg-${color}-50 text-${color}-600`}`}>
                            {users.filter(u => u.onboardingStatus === key).length}
                        </span>
                    </button>
                ))}
            </div>

            <div className="bg-white rounded-3xl border border-zinc-100 shadow-sm overflow-hidden">
                {loading ? (
                    <div className="p-12 text-center text-zinc-400 font-bold text-sm">Loading submissions...</div>
                ) : filtered.length === 0 ? (
                    <div className="p-12 text-center">
                        <FileCheck size={32} className="text-zinc-200 mx-auto mb-3" />
                        <p className="text-zinc-400 font-bold text-sm">No {STATUS_MAP[filter].label.toLowerCase()} submissions</p>
                    </div>
                ) : (
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="border-b border-zinc-100 bg-zinc-50/50">
                                <th className="p-4 text-[10px] font-black text-zinc-400 uppercase tracking-widest">User</th>
                                <th className="p-4 text-[10px] font-black text-zinc-400 uppercase tracking-widest">Document</th>
                                <th className="p-4 text-[10px] font-black text-zinc-400 uppercase tracking-widest">Submitted</th>
                                <th className="p-4 text-[10px] font-black text-zinc-400 uppercase tracking-widest">Role</th>
                                <th className="p-4 text-[10px] font-black text-zinc-400 uppercase tracking-widest text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filtered.map(user => {
                                const docType = DOC_TYPE_LABELS[user.verification?.docType] || 'Document';
                                const submittedAt = user.verification?.submittedAt
                                    ? new Date(user.verification.submittedAt).toLocaleDateString('en-BD', { day: 'numeric', month: 'short', year: 'numeric' })
                                    : '—';
                                const docUrl = user.verification?.idDocumentUrl;
                                return (
                                    <tr key={user.id} className="border-b border-zinc-50 hover:bg-zinc-50/50 transition-colors">
                                        <td className="p-4">
                                            <div className="flex items-center gap-3">
                                                {user.photoURL
                                                    ? <img src={user.photoURL} alt="" className="size-9 rounded-xl object-cover" />
                                                    : <div className="size-9 rounded-xl bg-zinc-100 flex items-center justify-center"><User size={14} className="text-zinc-400" /></div>
                                                }
                                                <div>
                                                    <p className="font-bold text-sm text-zinc-900">{user.fullName || '—'}</p>
                                                    <p className="text-xs text-zinc-400 font-medium">{user.email}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="p-4">
                                            <div className="flex items-center gap-2">
                                                <FileCheck size={14} className="text-zinc-400" />
                                                <span className="text-xs font-bold text-zinc-700">{docType}</span>
                                                {docUrl && (
                                                    <a href={docUrl} target="_blank" rel="noopener noreferrer" className="p-1 rounded-lg bg-zinc-100 hover:bg-zinc-200 transition-colors">
                                                        <ExternalLink size={11} className="text-zinc-500" />
                                                    </a>
                                                )}
                                            </div>
                                        </td>
                                        <td className="p-4">
                                            <span className="text-xs font-medium text-zinc-500">{submittedAt}</span>
                                        </td>
                                        <td className="p-4">
                                            <span className="px-2 py-1 bg-zinc-100 text-zinc-600 text-[10px] font-black rounded-lg uppercase tracking-wider">
                                                {user.userRole || 'tenant'}
                                            </span>
                                        </td>
                                        <td className="p-4 text-right">
                                            {filter === 'PENDING_VERIFICATION' && (
                                                <div className="flex items-center justify-end gap-2">
                                                    <button
                                                        onClick={() => approve(user)}
                                                        className="flex items-center gap-1.5 px-3 py-2 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 rounded-xl text-xs font-black transition-colors"
                                                    >
                                                        <ShieldCheck size={13} /> Approve
                                                    </button>
                                                    <button
                                                        onClick={() => reject(user)}
                                                        className="flex items-center gap-1.5 px-3 py-2 bg-rose-50 text-rose-600 hover:bg-rose-100 rounded-xl text-xs font-black transition-colors"
                                                    >
                                                        <XCircle size={13} /> Reject
                                                    </button>
                                                </div>
                                            )}
                                            {filter === 'COMPLETED' && (
                                                <span className="flex items-center gap-1 justify-end text-xs font-black text-emerald-600">
                                                    <CheckCircle size={13} /> Approved
                                                </span>
                                            )}
                                            {filter === 'REJECTED' && (
                                                <button onClick={() => approve(user)} className="flex items-center gap-1.5 px-3 py-2 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 rounded-xl text-xs font-black transition-colors ml-auto">
                                                    <ShieldCheck size={13} /> Override & Approve
                                                </button>
                                            )}
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                )}
            </div>
        </div>
    );
}
