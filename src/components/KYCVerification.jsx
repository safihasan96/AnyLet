import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { doc, serverTimestamp, setDoc } from 'firebase/firestore';
import { CheckCircle2, Clock, FileText, Loader2, ShieldCheck, Upload, X } from 'lucide-react';
import { db } from '../firebase';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import logger from '../utils/logger';
import { getApiUrl } from '../utils/api';

const DOC_TYPES = [
  { id: 'nid', label: 'National ID' },
  { id: 'passport', label: 'Passport' },
  { id: 'license', label: 'License' },
];

const overlayVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.2 } },
  exit: { opacity: 0, transition: { duration: 0.16 } },
};

const modalVariants = {
  hidden: { opacity: 0, scale: 0.9, y: 24 },
  visible: { opacity: 1, scale: 1, y: 0, transition: { type: 'spring', stiffness: 380, damping: 30 } },
  exit: { opacity: 0, scale: 0.9, y: 24, transition: { duration: 0.16 } },
};

function FilePicker({ label, file, preview, onPick, onRemove }) {
  const inputRef = useRef(null);

  return (
    <div>
      <label className="mb-2 ml-1 block text-[10px] font-black uppercase tracking-widest text-slate-400">
        {label}
      </label>
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="hidden"
        onChange={(event) => {
          const nextFile = event.target.files?.[0];
          if (nextFile) onPick(nextFile);
        }}
      />
      {preview ? (
        <div className="relative overflow-hidden rounded-2xl border-2 border-dashed border-primary/30 dark:border-primary/40">
          <img src={preview} alt={`${label} preview`} className="h-44 w-full bg-white object-contain p-2 dark:bg-slate-950" />
          <button
            type="button"
            onClick={onRemove}
            aria-label={`Remove ${label}`}
            className="absolute right-2 top-2 rounded-lg bg-rose-600 p-1.5 text-white shadow-lg transition hover:bg-rose-700"
          >
            <X size={14} />
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className="flex w-full flex-col items-center gap-3 rounded-2xl border-2 border-dashed border-slate-200 py-8 text-slate-400 transition hover:border-primary hover:text-primary active:scale-[0.99] dark:border-slate-700"
        >
          <span className="flex size-12 items-center justify-center rounded-2xl bg-slate-100 dark:bg-slate-800">
            <Upload size={22} />
          </span>
          <span className="text-center">
            <span className="block text-sm font-black">Tap to upload</span>
            <span className="block text-[11px] font-medium">JPG, PNG, WEBP - max 5MB</span>
          </span>
        </button>
      )}
      {file && <p className="mt-2 truncate text-[11px] font-bold text-slate-400">{file.name}</p>}
    </div>
  );
}

export default function KYCVerification({ isOpen, onClose, userData, onSubmitted }) {
  const { currentUser } = useAuth();
  const toast = useToast();
  const [docType, setDocType] = useState('nid');
  const [frontFile, setFrontFile] = useState(null);
  const [backFile, setBackFile] = useState(null);
  const [frontPreview, setFrontPreview] = useState(null);
  const [backPreview, setBackPreview] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const isApproved = userData?.verification?.isKycApproved || userData?.kycVerified || userData?.kycStatus === 'verified';
  const isPending = userData?.onboardingStatus === 'PENDING_VERIFICATION' || userData?.kycStatus === 'pending';
  const isRejected = userData?.onboardingStatus === 'REJECTED' || userData?.kycStatus === 'rejected';

  useEffect(() => {
    return () => {
      if (frontPreview) URL.revokeObjectURL(frontPreview);
      if (backPreview) URL.revokeObjectURL(backPreview);
    };
  }, [frontPreview, backPreview]);

  function resetFiles() {
    setFrontFile(null);
    setBackFile(null);
    setFrontPreview(null);
    setBackPreview(null);
  }

  function pickFront(file) {
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Front image must be under 5MB.');
      return;
    }
    if (frontPreview) URL.revokeObjectURL(frontPreview);
    setFrontFile(file);
    setFrontPreview(URL.createObjectURL(file));
  }

  function pickBack(file) {
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Back image must be under 5MB.');
      return;
    }
    if (backPreview) URL.revokeObjectURL(backPreview);
    setBackFile(file);
    setBackPreview(URL.createObjectURL(file));
  }

  async function uploadSigned(file) {
    const userToken = await currentUser.getIdToken();
    const sigRes = await fetch(getApiUrl('/api/cloudinary-sign'), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${userToken}`,
      },
      body: JSON.stringify({ isKyc: true }),
    });

    if (!sigRes.ok) throw new Error('Failed to secure upload signature');
    const { signature, timestamp, folder, apiKey, cloudName } = await sigRes.json();

    const formData = new FormData();
    formData.append('file', file);
    formData.append('api_key', apiKey);
    formData.append('timestamp', timestamp);
    formData.append('signature', signature);
    formData.append('folder', folder);

    const uploadRes = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
      method: 'POST',
      body: formData,
    });
    const uploadData = await uploadRes.json();

    if (!uploadRes.ok || !uploadData.public_id) {
      throw new Error(uploadData.error?.message || 'Cloudinary upload failed.');
    }

    return uploadData.public_id;
  }

  async function handleSubmit() {
    if (!currentUser || !frontFile || !backFile) return;

    setSubmitting(true);
    try {
      logger.debug('[KYC] submission received');
      const [frontPublicId, backPublicId] = await Promise.all([
        uploadSigned(frontFile, 'front'),
        uploadSigned(backFile, 'back'),
      ]);

      await setDoc(doc(db, 'kycSubmissions', currentUser.uid), {
        uid: currentUser.uid,
        status: 'pending',
        docType,
        submittedAt: serverTimestamp(),
        cloudinaryPublicIds: [frontPublicId, backPublicId],
        rejectionReason: null,
      });

      resetFiles();
      onSubmitted?.();
      toast.success('KYC submitted. Our team will review it within 24-48 hours.');
    } catch (error) {
      logger.error('KYC submission failed:', error);
      toast.error(error.message || 'KYC submission failed. Please try again.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          variants={overlayVariants}
          initial="hidden"
          animate="visible"
          exit="exit"
          onClick={() => {
            if (!submitting) onClose?.();
          }}
          className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/55 px-4"
          role="dialog"
          aria-modal="true"
          aria-label="Identity verification"
        >
          <motion.div
            variants={modalVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            onClick={(event) => event.stopPropagation()}
            className="max-h-[90dvh] w-full max-w-md overflow-y-auto rounded-[28px] border border-slate-100 bg-white shadow-2xl dark:border-slate-800 dark:bg-slate-900"
          >
            <div className="flex justify-center pb-0 pt-3">
              <div className="h-1 w-10 rounded-full bg-slate-200 dark:bg-slate-700" />
            </div>

            <div className="flex items-center justify-between p-6 pb-0">
              <div className="flex items-center gap-3">
                <div className="flex size-11 items-center justify-center rounded-2xl bg-primary/10 dark:bg-primary/20">
                  <ShieldCheck size={22} className="text-primary dark:text-indigo-400" />
                </div>
                <div>
                  <h2 className="text-lg font-black tracking-tight text-slate-900 dark:text-white">Identity Verification</h2>
                  <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">KYC Process</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => onClose?.()}
                disabled={submitting}
                aria-label="Close modal"
                className="rounded-xl bg-slate-100 p-2 text-slate-400 transition hover:scale-110 hover:text-slate-600 disabled:opacity-50 dark:bg-slate-800"
              >
                <X size={18} />
              </button>
            </div>

            <div className="space-y-6 p-6">
                {isApproved && (
                  <div className="py-8 text-center">
                    <div className="mx-auto mb-5 flex size-20 items-center justify-center rounded-full bg-emerald-50 dark:bg-emerald-500/10">
                      <ShieldCheck size={40} className="text-emerald-500" />
                    </div>
                    <h3 className="mb-2 text-xl font-black text-slate-900 dark:text-white">Identity Verified</h3>
                    <p className="text-sm font-medium text-slate-400">Your identity has been approved.</p>
                  </div>
                )}

                {!isApproved && isPending && (
                  <div className="py-8 text-center">
                    <div className="mx-auto mb-5 flex size-20 items-center justify-center rounded-full bg-sky-50 dark:bg-sky-500/10">
                      <Clock size={40} className="animate-pulse text-sky-500" />
                    </div>
                    <h3 className="mb-2 text-xl font-black text-slate-900 dark:text-white">Under Review</h3>
                    <p className="text-sm font-medium text-slate-400">Your documents are being reviewed by our team.</p>
                  </div>
                )}

                {!isApproved && !isPending && (
                  <>
                    {isRejected && (
                      <div className="rounded-2xl border border-rose-100 bg-rose-50 p-4 dark:border-rose-800/30 dark:bg-rose-500/10">
                        <p className="text-xs font-bold text-rose-600 dark:text-rose-300">
                          Your previous submission was rejected. Upload clear front and back images to resubmit.
                        </p>
                      </div>
                    )}

                    <div className="rounded-2xl border border-primary/10 bg-primary/5 p-5 dark:bg-primary/10">
                      <h4 className="mb-3 text-xs font-black uppercase tracking-wider text-primary dark:text-indigo-300">Why Verify?</h4>
                      <ul className="space-y-2 text-xs font-medium text-slate-600 dark:text-slate-400">
                        <li className="flex items-center gap-2"><CheckCircle2 size={13} className="shrink-0 text-emerald-500" /> Build trust with owners and tenants</li>
                        <li className="flex items-center gap-2"><CheckCircle2 size={13} className="shrink-0 text-emerald-500" /> Keep high-risk accounts out of AnyLet</li>
                        <li className="flex items-center gap-2"><CheckCircle2 size={13} className="shrink-0 text-emerald-500" /> Unlock stronger profile verification signals</li>
                      </ul>
                    </div>

                    <div>
                      <label className="mb-2 ml-1 block text-[10px] font-black uppercase tracking-widest text-slate-400">Document Type</label>
                      <div className="grid grid-cols-3 gap-2">
                        {DOC_TYPES.map((item) => (
                          <button
                            key={item.id}
                            type="button"
                            onClick={() => setDocType(item.id)}
                            className={`rounded-xl py-3 text-xs font-black transition ${
                              docType === item.id
                                ? 'bg-primary text-white shadow-lg shadow-primary/20'
                                : 'bg-slate-50 text-slate-500 hover:bg-slate-100 dark:bg-slate-800 dark:text-slate-400'
                            }`}
                          >
                            {item.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    <FilePicker label="NID Front" file={frontFile} preview={frontPreview} onPick={pickFront} onRemove={() => { setFrontFile(null); setFrontPreview(null); }} />
                    <FilePicker label="NID Back" file={backFile} preview={backPreview} onPick={pickBack} onRemove={() => { setBackFile(null); setBackPreview(null); }} />

                    <button
                      type="button"
                      disabled={!frontFile || !backFile || submitting}
                      onClick={handleSubmit}
                      className="flex w-full items-center justify-center gap-2 rounded-2xl bg-primary py-4 text-sm font-black text-white shadow-xl shadow-primary/20 transition active:scale-95 disabled:opacity-50 disabled:shadow-none"
                    >
                      {submitting ? <><Loader2 size={18} className="animate-spin" /> Submitting...</> : <><FileText size={18} /> Submit for Review</>}
                    </button>
                  </>
                )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
