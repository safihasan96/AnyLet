import { ShieldAlert, ShieldCheck, Clock, CheckCircle2 } from 'lucide-react';
import { auth } from '../../firebase';
import { sendEmailVerification } from 'firebase/auth';

/**
 * DynamicMemberBadge — a live verification-status pill driven by the Firestore
 * user doc (email verified → KYC approved → pending → member). When the email
 * isn't verified it doubles as a "resend verification" button.
 */
export default function DynamicMemberBadge({ userData, isEmailVerified, toast }) {
  const isKycApproved = userData?.verification?.isKycApproved === true;
  const kycPending = userData?.onboardingStatus === 'PENDING_VERIFICATION';

  // Verification pill
  const verificationPill = (() => {
    if (!isEmailVerified) return (
      <button
        onClick={async () => {
          try { await sendEmailVerification(auth.currentUser); toast.success('Verification email sent!'); }
          catch { toast.error('Failed to send. Try again later.'); }
        }}
        className="flex items-center gap-1 bg-amber-400/15 border border-amber-400/30 rounded-full px-2.5 py-0.5 hover:bg-amber-400/25 transition-all active:scale-95"
      >
        <ShieldAlert size={10} className="text-amber-500 animate-pulse" />
        <span className="text-[9.5px] font-black text-amber-500 uppercase tracking-wider">Verify Email</span>
      </button>
    );
    if (isKycApproved) return (
      <div className="flex items-center gap-1 bg-emerald-400/15 border border-emerald-400/30 rounded-full px-2.5 py-0.5">
        <ShieldCheck size={10} className="text-emerald-500" />
        <span className="text-[9.5px] font-black text-emerald-500 uppercase tracking-wider">Verified</span>
      </div>
    );
    if (kycPending) return (
      <div className="flex items-center gap-1 bg-sky-400/15 border border-sky-400/30 rounded-full px-2.5 py-0.5">
        <Clock size={10} className="text-sky-500 animate-pulse" />
        <span className="text-[9.5px] font-black text-sky-500 uppercase tracking-wider">Under Review</span>
      </div>
    );
    return (
      <div className="flex items-center gap-1 bg-slate-100 dark:bg-white/10 border border-slate-200 dark:border-white/15 rounded-full px-2.5 py-0.5">
        <CheckCircle2 size={10} className="text-slate-400 dark:text-slate-500" />
        <span className="text-[9.5px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-wider">Member</span>
      </div>
    );
  })();

  return (
    <div className="flex justify-center">
      {/* Verification status pill */}
      {verificationPill}
    </div>
  );
}
