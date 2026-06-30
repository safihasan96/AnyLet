import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { db } from '../firebase';
import { collection, query, where, orderBy, limit, getDocs } from 'firebase/firestore';
import { useAuth } from '../contexts/AuthContext';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import {
  ArrowLeft, Receipt, CreditCard, CheckCircle2, Clock,
  XCircle, AlertCircle, Download, Eye, Building2, ChevronRight,
  Wallet, TrendingUp, FileText, Loader2, RefreshCw, X,
  Smartphone, Calendar, Hash, Shield, ExternalLink
} from 'lucide-react';
import InvoiceModal from '../components/InvoiceModal';

/* ─────────────────────────────────────────────────────────────
   VARIANTS — decoupled from JSX (FM rule #1)
───────────────────────────────────────────────────────────────*/
const pageV = {
  hidden:  { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.06, delayChildren: 0.05 }
  }
};

const heroV = {
  hidden:  { opacity: 0, y: -20 },
  visible: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 280, damping: 28 } }
};

const cardV = {
  hidden:  { opacity: 0, x: -24, scale: 0.97 },
  visible: { opacity: 1, x: 0, scale: 1, transition: { type: 'spring', stiffness: 300, damping: 30 } }
};

const statV = {
  hidden:  { opacity: 0, y: 16, scale: 0.92 },
  visible: { opacity: 1, y: 0, scale: 1, transition: { type: 'spring', stiffness: 380, damping: 26 } }
};

const sheetV = {
  hidden:  { opacity: 0, y: '100%' },
  visible: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 320, damping: 36, mass: 0.9 } },
  exit:    { opacity: 0, y: '100%', transition: { duration: 0.22, ease: [0.4, 0, 1, 1] } },
};

const backdropV = {
  hidden:  { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.2 } },
  exit:    { opacity: 0, transition: { duration: 0.18 } },
};

/* ─────────────────────────────────────────────────────────────
   HELPERS
───────────────────────────────────────────────────────────────*/
const QUERY_LIMIT = 50;

function formatDate(ts) {
  if (!ts) return '—';
  const d = ts?.toDate ? ts.toDate() : new Date(ts);
  if (isNaN(d)) return '—';
  return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
}

function formatTime(ts) {
  if (!ts) return '';
  const d = ts?.toDate ? ts.toDate() : new Date(ts);
  if (isNaN(d)) return '';
  return d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
}

function formatAmount(n) {
  return Number(n || 0).toLocaleString('en-BD');
}

function paymentTypeLabel(type) {
  const map = {
    subscription: 'Subscription',
    listing:      'Listing Fee',
    booking:      'Booking',
    deposit:      'Escrow Deposit',
    verification: 'Verification',
  };
  return map[type] || type || 'Payment';
}

function paymentTypeBadge(type) {
  const map = {
    subscription: { bg: 'bg-violet-100 dark:bg-violet-900/40', text: 'text-violet-700 dark:text-violet-300', label: 'Subscription' },
    listing:      { bg: 'bg-blue-100 dark:bg-blue-900/40',   text: 'text-blue-700 dark:text-blue-300',   label: 'Listing Fee'  },
    booking:      { bg: 'bg-sky-100 dark:bg-sky-900/40',     text: 'text-sky-700 dark:text-sky-300',     label: 'Booking'      },
    deposit:      { bg: 'bg-indigo-100 dark:bg-indigo-900/40', text: 'text-indigo-700 dark:text-indigo-300', label: 'Deposit'  },
    verification: { bg: 'bg-amber-100 dark:bg-amber-900/40', text: 'text-amber-700 dark:text-amber-300', label: 'Verification' },
  };
  return map[type] || { bg: 'bg-slate-100 dark:bg-slate-800', text: 'text-slate-600 dark:text-slate-300', label: paymentTypeLabel(type) };
}

function statusConfig(status) {
  const map = {
    completed: { icon: CheckCircle2, bg: 'bg-emerald-100 dark:bg-emerald-900/40', text: 'text-emerald-700 dark:text-emerald-400', label: 'Verified', dot: 'bg-emerald-500' },
    pending:   { icon: Clock,        bg: 'bg-amber-100 dark:bg-amber-900/40',     text: 'text-amber-600 dark:text-amber-400',    label: 'Pending',  dot: 'bg-amber-400'  },
    expired:   { icon: XCircle,      bg: 'bg-rose-100 dark:bg-rose-900/40',       text: 'text-rose-600 dark:text-rose-400',      label: 'Expired',  dot: 'bg-rose-400'   },
    failed:    { icon: AlertCircle,  bg: 'bg-rose-100 dark:bg-rose-900/40',       text: 'text-rose-600 dark:text-rose-400',      label: 'Failed',   dot: 'bg-rose-400'   },
  };
  return map[status] || map['pending'];
}

function providerIcon(method) {
  const map = { bkash: '🅱', nagad: '🇳', rocket: '🚀' };
  return map[(method || '').toLowerCase()] || '💳';
}

function providerName(p) {
  const map = { bkash: 'bKash', nagad: 'Nagad', rocket: 'Rocket' };
  return map[(p || '').toLowerCase()] || (p ? p.charAt(0).toUpperCase() + p.slice(1) : 'Mobile Banking');
}

function invoiceNum(id) {
  return `INV-${(id || '').slice(0, 8).toUpperCase()}`;
}

/* ─────────────────────────────────────────────────────────────
   SKELETON LOADER
───────────────────────────────────────────────────────────────*/
function PaymentSkeleton() {
  return (
    <div className="space-y-3">
      {[1, 2, 3].map(i => (
        <div key={i} className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-100 dark:border-slate-800 shadow-sm animate-pulse">
          <div className="flex items-center gap-3 mb-3">
            <div className="size-11 rounded-2xl bg-slate-200 dark:bg-slate-700" />
            <div className="flex-1 space-y-2">
              <div className="h-3.5 bg-slate-200 dark:bg-slate-700 rounded-full w-2/3" />
              <div className="h-2.5 bg-slate-100 dark:bg-slate-800 rounded-full w-1/2" />
            </div>
            <div className="h-5 w-16 bg-slate-200 dark:bg-slate-700 rounded-full" />
          </div>
          <div className="flex justify-between">
            <div className="h-7 w-24 bg-slate-200 dark:bg-slate-700 rounded-lg" />
            <div className="h-8 w-28 bg-slate-100 dark:bg-slate-800 rounded-xl" />
          </div>
        </div>
      ))}
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────
   DETAIL SHEET — full payment detail bottom sheet
───────────────────────────────────────────────────────────────*/
function PaymentDetailSheet({ payment, isOpen, onClose, onViewInvoice }) {
  const reduced = useReducedMotion();
  if (!payment) return null;

  const status = payment.status || (payment.used ? 'completed' : 'pending');
  const sc = statusConfig(status);
  const StatusIcon = sc.icon;
  const type = payment.type || payment.bookingType || '';
  const tb = paymentTypeBadge(type);
  const amount = Number(payment.amount || payment.paidAmount || payment.expectedAmount || 0);

  const rows = [
    ['Invoice No.', invoiceNum(payment.id || payment.paymentIntentId)],
    ['Type', paymentTypeLabel(type)],
    ['Amount', `৳${formatAmount(amount)}`],
    ['Provider', providerName(payment.paymentMethod || payment.provider)],
    ['Transaction ID', payment.transactionId || '—'],
    ['Reference', (payment.referenceCode || payment.paymentIntentId || '—').slice(0, 20)],
    ['Date', `${formatDate(payment.createdAt)} · ${formatTime(payment.createdAt)}`],
    payment.verifiedAt ? ['Verified At', `${formatDate(payment.verifiedAt)} · ${formatTime(payment.verifiedAt)}`] : null,
    payment.propertyName ? ['Property', payment.propertyName] : null,
  ].filter(Boolean);

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          key="detail-backdrop"
          variants={reduced ? {} : backdropV}
          initial="hidden" animate="visible" exit="exit"
          onClick={onClose}
          className="fixed inset-0 z-[85] flex items-end justify-center"
        >
          <div className="absolute inset-0 bg-slate-900/70 backdrop-blur-lg" />

          <motion.div
            key="detail-sheet"
            variants={reduced ? {} : sheetV}
            initial="hidden" animate="visible" exit="exit"
            onClick={e => e.stopPropagation()}
            className="relative w-full max-w-lg bg-white dark:bg-slate-900 rounded-t-[28px] shadow-2xl border-t border-slate-200 dark:border-slate-700 max-h-[88dvh] flex flex-col overflow-hidden transform-gpu will-change-transform"
          >
            {/* Handle */}
            <div className="flex justify-center pt-3 pb-1 flex-shrink-0">
              <div className="w-10 h-1 rounded-full bg-slate-200 dark:bg-slate-700" />
            </div>

            {/* Header */}
            <div className="px-6 py-4 flex items-center justify-between flex-shrink-0 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-3">
                <div className={`size-10 rounded-2xl flex items-center justify-center ${sc.bg}`}>
                  <StatusIcon size={20} className={sc.text} />
                </div>
                <div>
                  <p className="text-[14px] font-black text-slate-900 dark:text-white">Payment Details</p>
                  <div className={`inline-flex items-center gap-1.5 mt-0.5`}>
                    <div className={`size-1.5 rounded-full ${sc.dot}`} />
                    <p className={`text-[10px] font-bold uppercase tracking-widest ${sc.text}`}>{sc.label}</p>
                  </div>
                </div>
              </div>
              <motion.button
                onClick={onClose}
                whileHover={{ scale: 1.1, rotate: 90 }}
                whileTap={{ scale: 0.9 }}
                transition={{ type: 'spring', stiffness: 500, damping: 18 }}
                className="size-9 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors"
              >
                <X size={17} strokeWidth={2.5} />
              </motion.button>
            </div>

            {/* Scrollable content */}
            <div className="overflow-y-auto overscroll-contain flex-1">
              {/* Amount hero */}
              <div className="px-6 py-6 bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-800/60 dark:to-slate-900 border-b border-slate-100 dark:border-slate-800">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Amount Paid</p>
                <p className="text-4xl font-black text-slate-900 dark:text-white tracking-tight">
                  ৳{formatAmount(amount)}
                </p>
                <div className="flex items-center gap-2 mt-3">
                  <span className={`text-sm font-black px-2.5 py-1 rounded-full ${tb.bg} ${tb.text}`}>{tb.label}</span>
                  <span className="text-xs text-slate-400 dark:text-slate-500 font-medium">via {providerName(payment.paymentMethod || payment.provider)}</span>
                </div>
              </div>

              {/* Detail rows */}
              <div className="px-6 py-4 space-y-0">
                {rows.map(([key, val]) => (
                  <div key={key} className="flex items-center justify-between py-3.5 border-b border-slate-50 dark:border-slate-800/60 last:border-b-0">
                    <span className="text-[11.5px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">{key}</span>
                    <span className="text-[13px] font-bold text-slate-800 dark:text-slate-200 text-right max-w-[55%] break-all">{val}</span>
                  </div>
                ))}
              </div>

              {/* Actions */}
              <div className="px-6 pb-8 pt-2 space-y-2.5">
                {status === 'completed' && (
                  <motion.button
                    onClick={() => { onClose(); onViewInvoice(payment); }}
                    whileHover={{ scale: 1.01, y: -1 }}
                    whileTap={{ scale: 0.98 }}
                    className="w-full flex items-center justify-center gap-2.5 py-4 bg-primary text-white rounded-2xl font-black text-sm shadow-xl shadow-primary/25"
                  >
                    <FileText size={17} strokeWidth={2.5} />
                    View & Download Invoice
                  </motion.button>
                )}
                <button
                  onClick={onClose}
                  className="w-full py-3.5 text-slate-400 font-bold text-sm text-center hover:text-slate-600 transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

/* ─────────────────────────────────────────────────────────────
   PAYMENT CARD — single list item
───────────────────────────────────────────────────────────────*/
function PaymentCard({ payment, onViewDetails, onViewInvoice, index }) {
  const reduced = useReducedMotion();
  const status = payment.status || (payment.used ? 'completed' : 'pending');
  const sc = statusConfig(status);
  const StatusIcon = sc.icon;
  const type = payment.type || payment.bookingType || '';
  const tb = paymentTypeBadge(type);
  const amount = Number(payment.amount || payment.paidAmount || payment.expectedAmount || 0);
  const provider = payment.paymentMethod || payment.provider;

  return (
    <motion.div
      variants={cardV}
      whileHover={reduced ? {} : { y: -2, boxShadow: '0 8px 32px rgba(0,0,0,0.09)' }}
      className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden transform-gpu will-change-transform cursor-pointer transition-shadow"
      onClick={() => onViewDetails(payment)}
    >
      {/* Top accent stripe for completed */}
      {status === 'completed' && (
        <div className="h-0.5 w-full bg-gradient-to-r from-emerald-400 via-primary to-indigo-500" />
      )}

      <div className="p-4 md:p-5">
        {/* Row 1: type + provider + status */}
        <div className="flex items-start gap-3 mb-3.5">
          {/* Provider icon */}
          <div className={`size-11 rounded-2xl flex items-center justify-center text-xl shrink-0 ${
            provider === 'bkash' ? 'bg-pink-50 dark:bg-pink-900/30' :
            provider === 'nagad' ? 'bg-orange-50 dark:bg-orange-900/30' :
            provider === 'rocket' ? 'bg-purple-50 dark:bg-purple-900/30' :
            'bg-slate-100 dark:bg-slate-800'
          }`}>
            {providerIcon(provider)}
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap mb-1">
              <span className={`text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full ${tb.bg} ${tb.text}`}>
                {tb.label}
              </span>
              {payment.propertyName && (
                <span className="text-[10px] text-slate-400 font-medium truncate max-w-[120px]">
                  {payment.propertyName}
                </span>
              )}
            </div>
            <p className="text-[11px] text-slate-400 dark:text-slate-500 font-medium">
              {formatDate(payment.createdAt)} · {providerName(provider)}
            </p>
          </div>

          {/* Status badge */}
          <div className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-full shrink-0 ${sc.bg}`}>
            <div className={`size-1.5 rounded-full ${sc.dot}`} />
            <span className={`text-[9px] font-black uppercase tracking-widest ${sc.text}`}>{sc.label}</span>
          </div>
        </div>

        {/* Row 2: amount + action buttons */}
        <div className="flex items-center justify-between">
          <div>
            <p className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
              ৳{formatAmount(amount)}
            </p>
            {payment.transactionId && (
              <p className="text-[10px] text-slate-400 font-mono mt-0.5">TxnID: {payment.transactionId}</p>
            )}
          </div>

          <div className="flex items-center gap-2" onClick={e => e.stopPropagation()}>
            {status === 'completed' && (
              <motion.button
                onClick={() => onViewInvoice(payment)}
                whileHover={reduced ? {} : { scale: 1.05, y: -1 }}
                whileTap={{ scale: 0.95 }}
                className="flex items-center gap-1.5 px-3.5 py-2.5 bg-primary text-white rounded-xl font-black text-[11px] shadow-md shadow-primary/20"
                aria-label="View invoice"
              >
                <Download size={13} strokeWidth={2.5} />
                Invoice
              </motion.button>
            )}
            <motion.button
              onClick={() => onViewDetails(payment)}
              whileHover={reduced ? {} : { scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="flex items-center gap-1 px-3 py-2.5 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-xl font-bold text-[11px]"
              aria-label="View details"
            >
              <Eye size={13} />
              Details
            </motion.button>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

/* ─────────────────────────────────────────────────────────────
   STAT CARD
───────────────────────────────────────────────────────────────*/
function StatCard({ icon: Icon, label, value, sub, gradient, iconBg, iconColor }) {
  return (
    <motion.div
      variants={statV}
      whileHover={{ y: -2 }}
      className={`relative flex-1 min-w-[130px] rounded-2xl p-4 overflow-hidden ${gradient} border border-white/20 shadow-sm`}
    >
      <div className={`size-9 rounded-xl flex items-center justify-center mb-3 ${iconBg}`}>
        <Icon size={17} className={iconColor} strokeWidth={2.5} />
      </div>
      <p className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">{value}</p>
      <p className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest mt-0.5">{label}</p>
      {sub && <p className="text-[10px] text-slate-400 mt-0.5">{sub}</p>}
    </motion.div>
  );
}

/* ─────────────────────────────────────────────────────────────
   EMPTY STATE
───────────────────────────────────────────────────────────────*/
function EmptyState({ onExplore }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: 'spring', stiffness: 280, damping: 28, delay: 0.2 }}
      className="flex flex-col items-center text-center py-16 px-6"
    >
      <div className="size-20 bg-slate-100 dark:bg-slate-800 rounded-3xl flex items-center justify-center mb-5 shadow-inner">
        <Receipt size={32} className="text-slate-300 dark:text-slate-600" strokeWidth={1.5} />
      </div>
      <h3 className="text-xl font-black text-slate-800 dark:text-white mb-2">No Payments Yet</h3>
      <p className="text-sm text-slate-400 font-medium mb-8 max-w-xs leading-relaxed">
        Your payment history will appear here once you subscribe, post a listing, or make a booking.
      </p>
      <motion.button
        onClick={onExplore}
        whileHover={{ scale: 1.04, y: -1 }}
        whileTap={{ scale: 0.97 }}
        className="px-6 py-3.5 bg-primary text-white rounded-2xl font-black text-sm shadow-xl shadow-primary/25 flex items-center gap-2"
      >
        <ExternalLink size={16} />
        Explore Properties
      </motion.button>
    </motion.div>
  );
}

/* ─────────────────────────────────────────────────────────────
   MAIN PAGE
───────────────────────────────────────────────────────────────*/
export default function MyPayments() {
  const { currentUser, userData } = useAuth();
  const navigate = useNavigate();
  const reduced = useReducedMotion();

  const [payments, setPayments]           = useState([]);
  const [loading, setLoading]             = useState(true);
  const [error, setError]                 = useState(null);
  const [detailPayment, setDetailPayment] = useState(null);
  const [invoicePayment, setInvoicePayment] = useState(null);
  const [filter, setFilter]               = useState('all'); // all | completed | pending | failed

  const fetchPayments = useCallback(async () => {
    if (!currentUser) return;
    setLoading(true);
    setError(null);
    try {
      const uid = currentUser.uid;

      // 1. Completed payments from 'payments' collection
      const pSnap = await getDocs(
        query(collection(db, 'payments'), where('userId', '==', uid), limit(QUERY_LIMIT))
      );
      const completedPayments = pSnap.docs.map(d => ({
        id: d.id,
        ...d.data(),
        _source: 'payments',
        status: 'completed',
      }));

      // 2. Pending / expired payment intents
      const iSnap = await getDocs(
        query(
          collection(db, 'paymentIntents'),
          where('uid', '==', uid),
          where('status', '==', 'pending'),
          limit(QUERY_LIMIT)
        )
      );
      const now = Date.now();
      const pendingPayments = iSnap.docs.map(d => {
        const data = d.data();
        const expiresAt = data.expiresAt?.toMillis?.() || 0;
        const isExpired = expiresAt > 0 && expiresAt < now;
        return {
          id: d.id,
          ...data,
          type: data.bookingType,
          amount: data.expectedAmount,
          _source: 'paymentIntents',
          status: isExpired ? 'expired' : 'pending',
        };
      });

      // Merge & sort by createdAt desc
      const merged = [...completedPayments, ...pendingPayments].sort((a, b) => {
        const aTime = a.createdAt?.toMillis?.() || new Date(a.createdAt).getTime() || 0;
        const bTime = b.createdAt?.toMillis?.() || new Date(b.createdAt).getTime() || 0;
        return bTime - aTime;
      });

      setPayments(merged);
    } catch (err) {
      console.error('[MyPayments] fetch error:', err);
      setError('Could not load payments. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [currentUser]);

  useEffect(() => { fetchPayments(); }, [fetchPayments]);

  // ── Derived stats
  const completed = payments.filter(p => p.status === 'completed');
  const pending   = payments.filter(p => p.status === 'pending');
  const failed    = payments.filter(p => p.status === 'expired' || p.status === 'failed');
  const totalPaid = completed.reduce((s, p) => s + Number(p.amount || p.paidAmount || 0), 0);

  // ── Filtered list
  const filtered = filter === 'all'       ? payments
                 : filter === 'completed' ? completed
                 : filter === 'pending'   ? pending
                 : failed;

  const FILTERS = [
    { id: 'all',       label: 'All',       count: payments.length },
    { id: 'completed', label: 'Verified',  count: completed.length },
    { id: 'pending',   label: 'Pending',   count: pending.length },
    { id: 'failed',    label: 'Expired',   count: failed.length },
  ];

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#0A0C10]">
      {/* ── HERO HEADER ── */}
      <div className="bg-gradient-to-br from-[#1a237e] via-[#283593] to-[#4c56af] text-white">
        <div className="max-w-2xl mx-auto px-4 pt-[max(env(safe-area-inset-top),16px)] pb-0">
          {/* Back button */}
          <motion.button
            onClick={() => navigate('/profile')}
            initial={{ opacity: 0, x: -12 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ type: 'spring', stiffness: 300, damping: 28 }}
            className="flex items-center gap-2 mb-6 py-2 pr-3 text-white/70 hover:text-white transition-colors font-bold text-sm"
            whileHover={{ x: -3 }}
            whileTap={{ scale: 0.97 }}
          >
            <ArrowLeft size={18} strokeWidth={2.5} />
            Account
          </motion.button>

          <motion.div variants={heroV} initial="hidden" animate="visible">
            <div className="flex items-center gap-3 mb-2">
              <div className="size-10 bg-white/15 rounded-2xl flex items-center justify-center border border-white/20">
                <Receipt size={20} strokeWidth={2} />
              </div>
              <h1 className="text-2xl font-black tracking-tight">My Payments</h1>
            </div>
            <p className="text-white/60 text-sm font-medium mb-6">Complete history of all your transactions</p>
          </motion.div>

          {/* ── Stat bar ── */}
          {!loading && (
            <motion.div
              className="flex gap-3 overflow-x-auto scrollbar-none pb-5 -mx-4 px-4"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ type: 'spring', stiffness: 280, damping: 28, delay: 0.12 }}
            >
              <StatCard
                icon={Wallet}
                label="Total Paid"
                value={`৳${totalPaid.toLocaleString('en-BD')}`}
                gradient="bg-white/10 backdrop-blur-sm"
                iconBg="bg-white/20"
                iconColor="text-white"
              />
              <StatCard
                icon={CheckCircle2}
                label="Verified"
                value={completed.length}
                gradient="bg-emerald-500/20 backdrop-blur-sm"
                iconBg="bg-emerald-500/25"
                iconColor="text-emerald-300"
              />
              <StatCard
                icon={Clock}
                label="Pending"
                value={pending.length}
                gradient="bg-amber-500/15 backdrop-blur-sm"
                iconBg="bg-amber-500/20"
                iconColor="text-amber-300"
              />
              <StatCard
                icon={FileText}
                label="Invoices"
                value={completed.length}
                gradient="bg-indigo-500/15 backdrop-blur-sm"
                iconBg="bg-indigo-500/20"
                iconColor="text-indigo-300"
              />
            </motion.div>
          )}
        </div>
      </div>

      {/* ── CONTENT ── */}
      <div className="max-w-2xl mx-auto px-4 pt-5 pb-24">
        {/* Filter pills */}
        <div className="flex gap-2 overflow-x-auto scrollbar-none mb-5">
          {FILTERS.map(f => (
            <motion.button
              key={f.id}
              onClick={() => setFilter(f.id)}
              whileTap={{ scale: 0.95 }}
              className={`flex-shrink-0 flex items-center gap-1.5 px-4 py-2 rounded-full font-bold text-xs transition-all ${
                filter === f.id
                  ? 'bg-primary text-white shadow-md shadow-primary/25'
                  : 'bg-white dark:bg-slate-900 text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-700 hover:border-slate-300'
              }`}
            >
              {f.label}
              {f.count > 0 && (
                <span className={`text-[9px] font-black px-1.5 py-0.5 rounded-full ${
                  filter === f.id ? 'bg-white/20 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-500'
                }`}>
                  {f.count}
                </span>
              )}
            </motion.button>
          ))}

          <motion.button
            onClick={fetchPayments}
            whileTap={{ scale: 0.92 }}
            className="flex-shrink-0 flex items-center gap-1.5 px-3.5 py-2 rounded-full font-bold text-xs bg-white dark:bg-slate-900 text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-700 hover:border-slate-300 ml-auto"
            aria-label="Refresh"
          >
            <RefreshCw size={12} className={loading ? 'animate-spin' : ''} />
            Refresh
          </motion.button>
        </div>

        {/* Content area */}
        {loading ? (
          <PaymentSkeleton />
        ) : error ? (
          <div className="flex flex-col items-center text-center py-12">
            <AlertCircle size={36} className="text-rose-400 mb-3" />
            <p className="text-rose-500 font-bold text-sm mb-4">{error}</p>
            <button
              onClick={fetchPayments}
              className="px-4 py-2.5 bg-rose-50 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400 rounded-xl font-bold text-sm"
            >
              Try Again
            </button>
          </div>
        ) : filtered.length === 0 ? (
          <EmptyState onExplore={() => navigate('/')} />
        ) : (
          <motion.div
            variants={reduced ? {} : pageV}
            initial="hidden"
            animate="visible"
            className="space-y-3"
          >
            {filtered.map((p, i) => (
              <PaymentCard
                key={p.id}
                payment={p}
                index={i}
                onViewDetails={setDetailPayment}
                onViewInvoice={setInvoicePayment}
              />
            ))}

            {filtered.length >= QUERY_LIMIT && (
              <p className="text-center text-xs text-slate-400 dark:text-slate-600 py-2 font-medium">
                Showing {QUERY_LIMIT} most recent transactions
              </p>
            )}
          </motion.div>
        )}
      </div>

      {/* ── DETAIL SHEET ── */}
      <PaymentDetailSheet
        payment={detailPayment}
        isOpen={!!detailPayment}
        onClose={() => setDetailPayment(null)}
        onViewInvoice={setInvoicePayment}
      />

      {/* ── INVOICE MODAL ── */}
      <InvoiceModal
        isOpen={!!invoicePayment}
        onClose={() => setInvoicePayment(null)}
        payment={invoicePayment}
        userData={userData}
      />
    </div>
  );
}
