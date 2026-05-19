/**
 * ReferralDashboard.jsx
 *
 * A full-page dedicated "Earn Money" / referral screen.
 * Placed at route /referral (protected).
 *
 * Sections:
 *   1. Your referral link + copy button
 *   2. Stats overview (Referred, Total Earned, Available Balance)
 *   3. Commission history table
 *   4. Referred Friends list
 *   5. Withdraw / Claim button + modal
 */

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    ArrowLeft, Copy, Check, Gift, Users, TrendingUp,
    Wallet, ChevronRight, Clock, AlertCircle, Share2,
    ExternalLink, BadgeCheck, Banknote, X, RefreshCw
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useReferral } from '../hooks/useReferral';
import { useAuth } from '../contexts/AuthContext';
import { requestWithdrawal } from '../utils/commissionService';
import { formatBDT } from '../utils/referral';

// ─── helpers ──────────────────────────────────────────────────────────────────

function relativeTime(ts) {
    if (!ts) return '';
    const date = ts?.toDate ? ts.toDate() : new Date(ts);
    const diff  = (Date.now() - date.getTime()) / 1000;
    if (diff < 60)   return 'just now';
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    return `${Math.floor(diff / 86400)}d ago`;
}

// ─── Withdraw Modal ────────────────────────────────────────────────────────────

function WithdrawModal({ available, onClose, uid }) {
    const [amount, setAmount]         = useState('');
    const [bankName, setBankName]     = useState('');
    const [accNo, setAccNo]           = useState('');
    const [accName, setAccName]       = useState('');
    const [loading, setLoading]       = useState(false);
    const [success, setSuccess]       = useState(false);
    const [error, setError]           = useState('');

    const minWithdraw = 100;

    async function submit(e) {
        e.preventDefault();
        setError('');
        const amt = parseFloat(amount);
        if (isNaN(amt) || amt < minWithdraw) {
            setError(`Minimum withdrawal is ${formatBDT(minWithdraw)}`);
            return;
        }
        if (amt > available) {
            setError('Amount exceeds your available balance.');
            return;
        }
        setLoading(true);
        try {
            await requestWithdrawal(uid, amt, { bankName, accountNumber: accNo, accountName: accName });
            setSuccess(true);
        } catch (err) {
            setError(err.message || 'Withdrawal failed. Please try again.');
        } finally {
            setLoading(false);
        }
    }

    return (
        <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-black/50 backdrop-blur-sm flex items-end sm:items-center justify-center p-4"
            onClick={onClose}
        >
            <motion.div
                initial={{ y: 100, opacity: 0 }} animate={{ y: 0, opacity: 1 }}
                exit={{ y: 100, opacity: 0 }} transition={{ type: 'spring', damping: 22 }}
                className="bg-white dark:bg-slate-900 rounded-[32px] p-7 w-full max-w-md shadow-2xl"
                onClick={e => e.stopPropagation()}
            >
                {success ? (
                    <div className="text-center py-6">
                        <div className="size-20 bg-emerald-100 dark:bg-emerald-900/30 rounded-full flex items-center justify-center mx-auto mb-5">
                            <BadgeCheck size={40} className="text-emerald-500" />
                        </div>
                        <h3 className="text-xl font-black text-slate-900 dark:text-white mb-2">Request Submitted!</h3>
                        <p className="text-sm text-slate-500 font-medium mb-6">
                            Your withdrawal request is under review. We'll process it within 1-3 business days.
                        </p>
                        <button onClick={onClose} className="w-full bg-primary text-white font-black py-4 rounded-2xl">
                            Done
                        </button>
                    </div>
                ) : (
                    <>
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="text-lg font-black text-slate-900 dark:text-white">Withdraw Earnings</h3>
                            <button onClick={onClose} className="size-9 bg-slate-100 dark:bg-slate-800 rounded-xl flex items-center justify-center text-slate-500">
                                <X size={18} />
                            </button>
                        </div>

                        <div className="bg-indigo-50 dark:bg-indigo-950/30 rounded-2xl p-4 mb-6 flex items-center justify-between">
                            <div>
                                <p className="text-[10px] font-black uppercase tracking-widest text-indigo-500 mb-0.5">Available Balance</p>
                                <p className="text-2xl font-black text-indigo-700 dark:text-indigo-300">{formatBDT(available)}</p>
                            </div>
                            <Wallet size={28} className="text-indigo-400" />
                        </div>

                        {error && (
                            <div className="flex items-center gap-2 bg-rose-50 dark:bg-rose-950/30 border border-rose-100 dark:border-rose-900 rounded-2xl p-4 mb-4 text-rose-600 text-sm font-bold">
                                <AlertCircle size={16} className="shrink-0" /> {error}
                            </div>
                        )}

                        <form onSubmit={submit} className="space-y-3">
                            <input
                                type="number" required min={minWithdraw} max={available}
                                placeholder={`Amount (min ${formatBDT(minWithdraw)})`}
                                value={amount} onChange={e => setAmount(e.target.value)}
                                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl px-4 py-3.5 font-bold text-slate-900 dark:text-white placeholder:text-slate-400 outline-none focus:border-primary transition-all"
                            />
                            <input
                                type="text" required placeholder="Bank / bKash / Nagad Name"
                                value={bankName} onChange={e => setBankName(e.target.value)}
                                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl px-4 py-3.5 font-bold text-slate-900 dark:text-white placeholder:text-slate-400 outline-none focus:border-primary transition-all"
                            />
                            <input
                                type="text" required placeholder="Account / Mobile Number"
                                value={accNo} onChange={e => setAccNo(e.target.value)}
                                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl px-4 py-3.5 font-bold text-slate-900 dark:text-white placeholder:text-slate-400 outline-none focus:border-primary transition-all"
                            />
                            <input
                                type="text" required placeholder="Account Holder Name"
                                value={accName} onChange={e => setAccName(e.target.value)}
                                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl px-4 py-3.5 font-bold text-slate-900 dark:text-white placeholder:text-slate-400 outline-none focus:border-primary transition-all"
                            />
                            <button
                                disabled={loading}
                                className="w-full bg-primary text-white font-black py-4 rounded-2xl flex items-center justify-center gap-2 shadow-lg shadow-primary/20 disabled:opacity-70 mt-2"
                            >
                                {loading ? <><RefreshCw size={18} className="animate-spin" /> Processing...</> : <><Banknote size={18} /> Request Withdrawal</>}
                            </button>
                        </form>
                    </>
                )}
            </motion.div>
        </motion.div>
    );
}

// ─── Stat Card ─────────────────────────────────────────────────────────────────

function StatCard({ icon: Icon, label, value, accent = 'indigo' }) {
    const colors = {
        indigo: 'bg-indigo-50 dark:bg-indigo-950/30 text-indigo-600 dark:text-indigo-400',
        emerald:'bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400',
        violet: 'bg-violet-50 dark:bg-violet-950/30 text-violet-600 dark:text-violet-400',
    };
    return (
        <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-[24px] p-5 flex flex-col gap-3">
            <div className={`size-10 rounded-2xl flex items-center justify-center ${colors[accent]}`}>
                <Icon size={20} />
            </div>
            <div>
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">{label}</p>
                <p className="text-xl font-black text-slate-900 dark:text-white">{value}</p>
            </div>
        </div>
    );
}

// ─── Main Page ─────────────────────────────────────────────────────────────────

export default function ReferralDashboard() {
    const navigate = useNavigate();
    const { currentUser } = useAuth();

    const {
        referralLink, referralCode,
        referees, commissions,
        totalEarned, availableBalance, withdrawn,
        loading,
    } = useReferral();

    const [copied, setCopied]           = useState(false);
    const [showWithdraw, setShowWithdraw] = useState(false);

    function copyLink() {
        navigator.clipboard.writeText(referralLink).then(() => {
            setCopied(true);
            setTimeout(() => setCopied(false), 2500);
        });
    }

    function shareLink() {
        if (navigator.share) {
            navigator.share({
                title: 'Join Any.Let',
                text: 'Find & rent properties easily in Bangladesh. Use my link to sign up!',
                url: referralLink,
            }).catch(() => {});
        } else {
            copyLink();
        }
    }

    if (loading) {
        return (
            <div className="flex flex-col min-h-screen items-center justify-center bg-white dark:bg-slate-950">
                <RefreshCw size={28} className="animate-spin text-primary mb-3" />
                <p className="text-sm font-bold text-slate-400">Loading your earnings...</p>
            </div>
        );
    }

    return (
        <>
            <div className="flex flex-col min-h-screen bg-[#f8fafc] dark:bg-slate-950 pb-32">
                {/* ── Header ── */}
                <header className="flex items-center justify-between p-6 bg-white dark:bg-slate-950 sticky top-0 z-10 border-b border-slate-100 dark:border-slate-800">
                    <button onClick={() => navigate(-1)} className="text-[#1a227f] dark:text-white p-2">
                        <ArrowLeft size={20} strokeWidth={2.5} />
                    </button>
                    <h1 className="text-[14px] font-[900] text-[#1a227f] dark:text-white tracking-[0.2em] uppercase">Earn Money</h1>
                    <div className="w-10" />
                </header>

                <div className="p-6 space-y-6 max-w-lg mx-auto w-full">

                    {/* ── Hero Banner ── */}
                    <div className="relative bg-gradient-to-br from-[#1a227f] to-[#3730a3] rounded-[28px] p-7 overflow-hidden text-white">
                        <div className="absolute -right-8 -top-8 size-36 rounded-full bg-white/5" />
                        <div className="absolute -right-2 top-12 size-20 rounded-full bg-white/5" />
                        <Gift size={32} className="mb-4 opacity-90" />
                        <h2 className="text-2xl font-black mb-1 leading-tight">Refer & Earn</h2>
                        <p className="text-white/70 text-sm font-medium leading-relaxed">
                            Share your link. Earn a <strong className="text-white">5% lifetime commission</strong> on every purchase your referred friends make.
                        </p>
                    </div>

                    {/* ── Referral Link Box ── */}
                    <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-[24px] p-5 space-y-4">
                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Your Referral Link</p>

                        <div className="flex items-center gap-2 bg-slate-50 dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-1 pl-4">
                            <p className="text-xs font-bold text-slate-600 dark:text-slate-300 truncate flex-1">{referralLink}</p>
                            <button
                                onClick={copyLink}
                                className={`shrink-0 flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-black transition-all ${copied ? 'bg-emerald-500 text-white' : 'bg-primary text-white hover:bg-primary/90'}`}
                            >
                                {copied ? <><Check size={14} /> Copied!</> : <><Copy size={14} /> Copy</>}
                            </button>
                        </div>

                        <div className="flex items-center gap-2 pt-1">
                            <p className="text-[10px] font-bold text-slate-400">Code:</p>
                            <span className="font-black text-xs text-primary bg-primary/10 px-3 py-1 rounded-lg tracking-wide">{referralCode}</span>
                            <button onClick={shareLink} className="ml-auto flex items-center gap-1.5 text-xs font-black text-primary hover:text-primary/80 transition-colors">
                                <Share2 size={14} /> Share
                            </button>
                        </div>
                    </div>

                    {/* ── Stats Grid ── */}
                    <div className="grid grid-cols-3 gap-3">
                        <StatCard icon={Users}     label="Friends Referred"  value={referees.length}        accent="indigo"  />
                        <StatCard icon={TrendingUp} label="Total Earned"      value={formatBDT(totalEarned)} accent="violet"  />
                        <StatCard icon={Wallet}    label="Available"         value={formatBDT(availableBalance)} accent="emerald" />
                    </div>

                    {/* ── Withdraw Button ── */}
                    <motion.button
                        whileTap={{ scale: 0.97 }}
                        onClick={() => setShowWithdraw(true)}
                        disabled={availableBalance < 100}
                        className="w-full flex items-center justify-between bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-[24px] p-5 shadow-sm disabled:opacity-50 group"
                    >
                        <div className="flex items-center gap-4">
                            <div className="size-11 bg-emerald-100 dark:bg-emerald-900/30 rounded-2xl flex items-center justify-center text-emerald-600">
                                <Banknote size={22} />
                            </div>
                            <div className="text-left">
                                <p className="text-sm font-black text-slate-900 dark:text-white">Claim Rewards</p>
                                <p className="text-[11px] font-bold text-slate-400">{availableBalance < 100 ? 'Min. ৳100 required to withdraw' : `৳${availableBalance.toFixed(2)} ready to withdraw`}</p>
                            </div>
                        </div>
                        <ChevronRight size={18} className="text-slate-300 group-hover:translate-x-1 transition-transform" />
                    </motion.button>

                    {/* ── Commission History ── */}
                    {commissions.length > 0 && (
                        <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-[24px] overflow-hidden">
                            <div className="p-5 pb-3">
                                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Commission History</p>
                            </div>
                            <div className="divide-y divide-slate-50 dark:divide-slate-800">
                                {commissions.slice(0, 10).map(c => (
                                    <div key={c.id} className="flex items-center justify-between px-5 py-4">
                                        <div className="flex items-center gap-3">
                                            <div className="size-9 bg-violet-50 dark:bg-violet-950/30 rounded-xl flex items-center justify-center text-violet-500">
                                                <TrendingUp size={16} />
                                            </div>
                                            <div>
                                                <p className="text-xs font-black text-slate-900 dark:text-white">{c.description || 'Commission'}</p>
                                                <p className="text-[10px] font-bold text-slate-400 flex items-center gap-1">
                                                    <Clock size={10} /> {relativeTime(c.createdAt)}
                                                </p>
                                            </div>
                                        </div>
                                        <span className="text-sm font-black text-emerald-600">+{formatBDT(c.amount)}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* ── Referred Friends List ── */}
                    {referees.length > 0 ? (
                        <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-[24px] overflow-hidden">
                            <div className="p-5 pb-3">
                                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Your Referrals ({referees.length})</p>
                            </div>
                            <div className="divide-y divide-slate-50 dark:divide-slate-800">
                                {referees.map(r => (
                                    <div key={r.id} className="flex items-center gap-3 px-5 py-4">
                                        <div className="size-9 bg-primary rounded-full flex items-center justify-center text-white text-xs font-black shrink-0">
                                            {(r.fullName?.[0] || r.email?.[0] || '?').toUpperCase()}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-xs font-black text-slate-900 dark:text-white truncate">{r.fullName || 'Anonymous'}</p>
                                            <p className="text-[10px] font-bold text-slate-400 truncate">{r.email}</p>
                                        </div>
                                        <BadgeCheck size={16} className="text-emerald-500 shrink-0" />
                                    </div>
                                ))}
                            </div>
                        </div>
                    ) : (
                        <div className="text-center py-12 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-[24px]">
                            <div className="size-16 bg-slate-50 dark:bg-slate-800 rounded-2xl flex items-center justify-center mx-auto mb-4 text-slate-300">
                                <Users size={28} />
                            </div>
                            <p className="text-sm font-black text-slate-400">No referrals yet</p>
                            <p className="text-xs font-bold text-slate-300 mt-1">Share your link above to start earning!</p>
                        </div>
                    )}

                    {/* ── How It Works ── */}
                    <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-[24px] p-5 space-y-4">
                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">How It Works</p>
                        {[
                            { step: '01', text: 'Copy your unique referral link above.' },
                            { step: '02', text: 'Share it with friends, family, or on social media.' },
                            { step: '03', text: 'When they sign up and make any purchase, you earn 5%.' },
                            { step: '04', text: 'Withdraw your earnings anytime (min. ৳100).' },
                        ].map(({ step, text }) => (
                            <div key={step} className="flex items-start gap-4">
                                <span className="text-[10px] font-black text-primary bg-primary/10 px-2.5 py-1 rounded-lg shrink-0">{step}</span>
                                <p className="text-xs font-bold text-slate-600 dark:text-slate-400 leading-relaxed">{text}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* ── Withdraw Modal ── */}
            <AnimatePresence>
                {showWithdraw && (
                    <WithdrawModal
                        available={availableBalance}
                        uid={currentUser?.uid}
                        onClose={() => setShowWithdraw(false)}
                    />
                )}
            </AnimatePresence>
        </>
    );
}
