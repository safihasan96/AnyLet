import { useEffect, useState } from 'react';
import { collection, doc, getDoc, onSnapshot, orderBy, query, where } from 'firebase/firestore';
import { CheckCircle, Clock, ExternalLink, FileCheck, ShieldCheck, User, XCircle } from 'lucide-react';
import { db } from '../firebase';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import logger from '../utils/logger';

const STATUS_MAP = {
  pending: { label: 'Pending Review', icon: Clock },
  approved: { label: 'Approved', icon: CheckCircle },
  rejected: { label: 'Rejected', icon: XCircle },
};

const DOC_TYPE_LABELS = {
  nid: 'National ID',
  passport: 'Passport',
  license: 'Driving License',
};

export default function AdminKycTab({ openModal }) {
  const { currentUser } = useAuth();
  const toast = useToast();
  const [submissions, setSubmissions] = useState([]);
  const [filter, setFilter] = useState('pending');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    const q = query(
      collection(db, 'kycSubmissions'),
      where('status', 'in', ['pending', 'approved', 'rejected']),
      orderBy('submittedAt', 'desc')
    );

    const unsub = onSnapshot(q, async (snap) => {
      try {
        const rows = await Promise.all(snap.docs.map(async (submissionDoc) => {
          const submission = { id: submissionDoc.id, ...submissionDoc.data() };
          const userSnap = await getDoc(doc(db, 'users', submission.uid));
          return {
            ...submission,
            user: userSnap.exists() ? { id: userSnap.id, ...userSnap.data() } : null,
          };
        }));
        setSubmissions(rows);
      } catch (error) {
        logger.error('KYC admin load failed:', error);
      } finally {
        setLoading(false);
      }
    }, (error) => {
      logger.error('KYC admin listener failed:', error);
      setLoading(false);
    });

    return unsub;
  }, []);

  const filtered = submissions.filter(item => item.status === filter);

  async function reviewSubmission(submission, decision, reason = '') {
    const token = await currentUser.getIdToken();
    const res = await fetch('/api/admin-review-kyc', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        uid: submission.uid,
        decision,
        reason,
      }),
    });

    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      throw new Error(body.error || 'KYC review failed');
    }
  }

  async function approve(submission) {
    try {
      await reviewSubmission(submission, 'approved');
      toast.success(`${submission.user?.fullName || submission.user?.email || submission.uid} approved`);
    } catch (error) {
      logger.error('KYC approve failed:', error);
      toast.error(error.message || 'Failed to approve');
    }
  }

  function reject(submission) {
    openModal({
      title: 'Reject KYC Submission',
      message: `Reject the ID submission from ${submission.user?.fullName || submission.user?.email || submission.uid}?`,
      confirmText: 'Reject',
      confirmColor: '#f43f5e',
      onConfirm: async () => {
        try {
          await reviewSubmission(submission, 'rejected', 'Please upload clear front and back images of a valid government ID.');
          toast.success('Rejection saved');
        } catch (error) {
          logger.error('KYC reject failed:', error);
          toast.error(error.message || 'Failed to reject');
        }
      },
    });
  }

  function publicIdToCloudinaryUrl(publicId) {
    const cloudName = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME || 'dmkbsddqk';
    return `https://res.cloudinary.com/${cloudName}/image/upload/${publicId}`;
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-2 border-b border-zinc-100 pb-4">
        {Object.entries(STATUS_MAP).map(([key, { label }]) => (
          <button
            key={key}
            onClick={() => setFilter(key)}
            className={`rounded-xl px-5 py-2 text-xs font-black uppercase tracking-widest transition-all ${filter === key ? 'bg-zinc-950 text-white' : 'bg-zinc-50 text-zinc-500 hover:bg-zinc-100'}`}
          >
            {label}
            <span className={`ml-2 rounded-full px-1.5 py-0.5 text-[10px] ${filter === key ? 'bg-white/20' : 'bg-white text-zinc-500'}`}>
              {submissions.filter(item => item.status === key).length}
            </span>
          </button>
        ))}
      </div>

      <div className="overflow-hidden rounded-3xl border border-zinc-100 bg-white shadow-sm">
        {loading ? (
          <div className="p-12 text-center text-sm font-bold text-zinc-400">Loading submissions...</div>
        ) : filtered.length === 0 ? (
          <div className="p-12 text-center">
            <FileCheck size={32} className="mx-auto mb-3 text-zinc-200" />
            <p className="text-sm font-bold text-zinc-400">No {STATUS_MAP[filter].label.toLowerCase()} submissions</p>
          </div>
        ) : (
          <table className="w-full border-collapse text-left">
            <thead>
              <tr className="border-b border-zinc-100 bg-zinc-50/50">
                <th className="p-4 text-[10px] font-black uppercase tracking-widest text-zinc-400">User</th>
                <th className="p-4 text-[10px] font-black uppercase tracking-widest text-zinc-400">Document</th>
                <th className="p-4 text-[10px] font-black uppercase tracking-widest text-zinc-400">Submitted</th>
                <th className="p-4 text-[10px] font-black uppercase tracking-widest text-zinc-400">Status</th>
                <th className="p-4 text-right text-[10px] font-black uppercase tracking-widest text-zinc-400">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((submission) => {
                const user = submission.user || {};
                const docType = DOC_TYPE_LABELS[submission.docType] || 'Document';
                const submittedAt = submission.submittedAt?.toDate?.()
                  ? submission.submittedAt.toDate().toLocaleDateString('en-BD', { day: 'numeric', month: 'short', year: 'numeric' })
                  : '-';
                const StatusIcon = STATUS_MAP[submission.status]?.icon || Clock;

                return (
                  <tr key={submission.id} className="border-b border-zinc-50 transition-colors hover:bg-zinc-50/50">
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        {user.photoURL ? (
                          <img src={user.photoURL} alt="" className="size-9 rounded-xl object-cover" />
                        ) : (
                          <div className="flex size-9 items-center justify-center rounded-xl bg-zinc-100">
                            <User size={14} className="text-zinc-400" />
                          </div>
                        )}
                        <div>
                          <p className="text-sm font-bold text-zinc-900">{user.fullName || user.name || '-'}</p>
                          <p className="text-xs font-medium text-zinc-400">{user.email || submission.uid}</p>
                        </div>
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-2">
                        <FileCheck size={14} className="text-zinc-400" />
                        <span className="text-xs font-bold text-zinc-700">{docType}</span>
                        {(submission.cloudinaryPublicIds || []).map((publicId, index) => (
                          <a
                            key={publicId}
                            href={publicIdToCloudinaryUrl(publicId)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="rounded-lg bg-zinc-100 p-1 transition-colors hover:bg-zinc-200"
                            aria-label={`Open document image ${index + 1}`}
                          >
                            <ExternalLink size={11} className="text-zinc-500" />
                          </a>
                        ))}
                      </div>
                    </td>
                    <td className="p-4">
                      <span className="text-xs font-medium text-zinc-500">{submittedAt}</span>
                    </td>
                    <td className="p-4">
                      <span className="inline-flex items-center gap-1.5 rounded-lg bg-zinc-100 px-2 py-1 text-[10px] font-black uppercase tracking-wider text-zinc-600">
                        <StatusIcon size={12} /> {STATUS_MAP[submission.status]?.label || submission.status}
                      </span>
                    </td>
                    <td className="p-4 text-right">
                      {submission.status === 'pending' && (
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => approve(submission)}
                            className="flex items-center gap-1.5 rounded-xl bg-emerald-50 px-3 py-2 text-xs font-black text-emerald-700 transition-colors hover:bg-emerald-100"
                          >
                            <ShieldCheck size={13} /> Approve
                          </button>
                          <button
                            onClick={() => reject(submission)}
                            className="flex items-center gap-1.5 rounded-xl bg-rose-50 px-3 py-2 text-xs font-black text-rose-600 transition-colors hover:bg-rose-100"
                          >
                            <XCircle size={13} /> Reject
                          </button>
                        </div>
                      )}
                      {submission.status === 'approved' && (
                        <span className="flex items-center justify-end gap-1 text-xs font-black text-emerald-600">
                          <CheckCircle size={13} /> Approved
                        </span>
                      )}
                      {submission.status === 'rejected' && (
                        <button
                          onClick={() => approve(submission)}
                          className="ml-auto flex items-center gap-1.5 rounded-xl bg-emerald-50 px-3 py-2 text-xs font-black text-emerald-700 transition-colors hover:bg-emerald-100"
                        >
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
