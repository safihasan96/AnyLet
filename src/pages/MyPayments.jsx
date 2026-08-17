import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { collection, query, where, limit, getDocs } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../contexts/AuthContext';
import { useFees } from '../hooks/useFees';
import logger from '../utils/logger';
import InvoiceModal from '../components/InvoiceModal';
import Container from '../components/layout/Container';
import Grid from '../components/layout/Grid';
import {
  Card, Badge, Button, IconButton, Icon, EmptyState, ErrorState, Skeleton, Drawer,
} from '../components/ui';

const QUERY_LIMIT = 50;

/* ── Helpers (preserved) ─────────────────────────────────────────────────── */
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
const formatAmount = (n) => Number(n || 0).toLocaleString('en-BD');
function paymentTypeLabel(type) {
  return { subscription: 'Subscription', listing: 'Listing Fee', booking: 'Booking', deposit: 'Escrow Deposit', verification: 'Verification' }[type] || type || 'Payment';
}
const TYPE_TONE = { subscription: 'primary', listing: 'info', booking: 'info', deposit: 'primary', verification: 'warning' };
function statusInfo(status) {
  return {
    completed: { tone: 'success', icon: 'success', label: 'Verified' },
    pending: { tone: 'warning', icon: 'pending', label: 'Pending' },
    expired: { tone: 'danger', icon: 'error', label: 'Expired' },
    failed: { tone: 'danger', icon: 'warning', label: 'Failed' },
  }[status] || { tone: 'warning', icon: 'pending', label: 'Pending' };
}
const providerIcon = (m) => ({ bkash: '🅱', nagad: '🇳', rocket: '🚀' }[(m || '').toLowerCase()] || '💳');
const providerName = (p) => ({ bkash: 'bKash', nagad: 'Nagad', rocket: 'Rocket' }[(p || '').toLowerCase()] || (p ? p.charAt(0).toUpperCase() + p.slice(1) : 'Mobile Banking'));
const invoiceNum = (id) => `INV-${(id || '').slice(0, 8).toUpperCase()}`;

export default function MyPayments() {
  const { currentUser, userData } = useAuth();
  const navigate = useNavigate();
  const { fees } = useFees();

  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [detailPayment, setDetailPayment] = useState(null);
  const [invoicePayment, setInvoicePayment] = useState(null);
  const [filter, setFilter] = useState('all');

  const fetchPayments = useCallback(async () => {
    if (!currentUser) return;
    setLoading(true);
    setError(null);
    try {
      const uid = currentUser.uid;
      const pSnap = await getDocs(query(collection(db, 'payments'), where('uid', '==', uid), limit(QUERY_LIMIT)));
      const completedPayments = pSnap.docs.map((d) => ({ id: d.id, ...d.data(), _source: 'payments', status: 'completed' }));

      const iSnap = await getDocs(query(collection(db, 'paymentIntents'), where('uid', '==', uid), where('status', '==', 'pending'), limit(QUERY_LIMIT)));
      const now = Date.now();
      const pendingPayments = iSnap.docs.map((d) => {
        const data = d.data();
        const expiresAt = data.expiresAt?.toMillis?.() || 0;
        const isExpired = expiresAt > 0 && expiresAt < now;
        return { id: d.id, ...data, type: data.bookingType, amount: data.expectedAmount, _source: 'paymentIntents', status: isExpired ? 'expired' : 'pending' };
      });

      const pDraftSnap = await getDocs(query(collection(db, 'properties'), where('ownerId', '==', uid), where('status', '==', 'pending_payment'), limit(QUERY_LIMIT)));
      const pendingDrafts = pDraftSnap.docs.map((d) => {
        const data = d.data();
        const LISTING_FEE = Number(fees.listingFee.value);
        const onsiteRequested = !!data.onsiteVerificationRequested;
        const displayAmount = LISTING_FEE + (onsiteRequested ? Number(fees.onsiteVerificationFee.value) : 0);
        return { id: d.id, ...data, type: 'listing', bookingType: 'listing', amount: displayAmount, propertyName: data.title, _source: 'properties', status: 'pending', isDraftPayment: true };
      });

      const merged = [...completedPayments, ...pendingPayments, ...pendingDrafts].sort((a, b) => {
        const aTime = a.createdAt?.toMillis?.() || new Date(a.createdAt).getTime() || 0;
        const bTime = b.createdAt?.toMillis?.() || new Date(b.createdAt).getTime() || 0;
        return bTime - aTime;
      });
      setPayments(merged);
    } catch (err) {
      logger.error('[MyPayments] fetch error:', err);
      setError('Could not load payments. Please try again.');
    } finally {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentUser]);

  useEffect(() => { fetchPayments(); }, [fetchPayments]);

  const completed = payments.filter((p) => p.status === 'completed');
  const pending = payments.filter((p) => p.status === 'pending');
  const failed = payments.filter((p) => p.status === 'expired' || p.status === 'failed');
  const totalPaid = completed.reduce((s, p) => s + Number(p.amount || p.paidAmount || 0), 0);
  const filtered = filter === 'all' ? payments : filter === 'completed' ? completed : filter === 'pending' ? pending : failed;
  const FILTERS = [
    { id: 'all', label: 'All', count: payments.length },
    { id: 'completed', label: 'Verified', count: completed.length },
    { id: 'pending', label: 'Pending', count: pending.length },
    { id: 'failed', label: 'Expired', count: failed.length },
  ];

  return (
    <div className="min-h-screen bg-bg pb-24">
      <Container size="narrow" className="pt-[max(env(safe-area-inset-top),1.5rem)] md:pt-10">
        <header className="mb-6">
          <h1 className="font-display text-display-md text-content">My payments</h1>
          <p className="mt-1 text-body-sm text-muted">A complete history of all your transactions.</p>
        </header>

        {/* Stats */}
        {!loading && !error && (
          <Grid cols={4} gap="sm" className="mb-6 grid-cols-2 sm:grid-cols-4">
            <StatCard icon="payments" label="Total paid" value={`৳${totalPaid.toLocaleString('en-BD')}`} tone="primary" />
            <StatCard icon="success" label="Verified" value={completed.length} tone="success" />
            <StatCard icon="pending" label="Pending" value={pending.length} tone="warning" />
            <StatCard icon="document" label="Invoices" value={completed.length} tone="info" />
          </Grid>
        )}

        {/* Filters */}
        <div className="mb-5 flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
          {FILTERS.map((f) => (
            <Button key={f.id} size="sm" variant={filter === f.id ? 'primary' : 'secondary'} onClick={() => setFilter(f.id)} className="shrink-0">
              {f.label}{f.count > 0 ? ` (${f.count})` : ''}
            </Button>
          ))}
          <IconButton label="Refresh" size="sm" variant="ghost" loading={loading} onClick={fetchPayments} className="ml-auto shrink-0"><Icon name="refresh" /></IconButton>
        </div>

        {/* Content */}
        {loading ? (
          <div className="flex flex-col gap-3">{[0, 1, 2].map((i) => <Skeleton key={i} className="h-28 w-full" rounded="rounded-card" />)}</div>
        ) : error ? (
          <ErrorState title="Couldn’t load payments" description={error} onRetry={fetchPayments} />
        ) : filtered.length === 0 ? (
          <EmptyState
            icon={<Icon name="payments" />}
            title="No payments yet"
            description="Your payment history appears here once you subscribe, post a listing, or make a booking."
            action={<Button onClick={() => navigate('/')} leftIcon={<Icon name="search" />}>Explore properties</Button>}
          />
        ) : (
          <div className="space-y-3">
            {filtered.map((p) => (
              <PaymentCard key={p.id} payment={p} onViewDetails={setDetailPayment} onViewInvoice={setInvoicePayment} />
            ))}
            {filtered.length >= QUERY_LIMIT && (
              <p className="py-2 text-center text-caption text-subtle">Showing {QUERY_LIMIT} most recent transactions</p>
            )}
          </div>
        )}
      </Container>

      <PaymentDetailDrawer payment={detailPayment} onClose={() => setDetailPayment(null)} onViewInvoice={setInvoicePayment} />
      <InvoiceModal isOpen={!!invoicePayment} onClose={() => setInvoicePayment(null)} payment={invoicePayment} userData={userData} />
    </div>
  );
}

function StatCard({ icon, label, value, tone }) {
  const tones = { primary: 'bg-primary-subtle text-primary', success: 'bg-success-subtle text-success', warning: 'bg-warning-subtle text-warning', info: 'bg-info-subtle text-info' };
  return (
    <Card padding="md" className="flex flex-col gap-2">
      <span className={`grid size-9 place-items-center rounded-control ${tones[tone]}`}><Icon name={icon} className="size-5" /></span>
      <span className="font-display text-title-md text-content">{value}</span>
      <span className="text-caption text-subtle">{label}</span>
    </Card>
  );
}

function PaymentCard({ payment, onViewDetails, onViewInvoice }) {
  const status = payment.status || (payment.used ? 'completed' : 'pending');
  const s = statusInfo(status);
  const type = payment.type || payment.bookingType || '';
  const amount = Number(payment.amount || payment.paidAmount || payment.expectedAmount || 0);
  const provider = payment.paymentMethod || payment.provider;

  return (
    <Card padding="md">
      <div className="mb-3.5 flex items-start gap-3">
        <span className="grid size-11 shrink-0 place-items-center rounded-card bg-surface-sunken text-xl">{providerIcon(provider)}</span>
        <div className="min-w-0 flex-1">
          <div className="mb-1 flex flex-wrap items-center gap-2">
            <Badge tone={TYPE_TONE[type] || 'neutral'} size="sm">{paymentTypeLabel(type)}</Badge>
            {payment.propertyName && <span className="truncate text-caption text-muted">{payment.propertyName}</span>}
          </div>
          <p className="text-caption text-subtle">{formatDate(payment.createdAt)} · {providerName(provider)}</p>
        </div>
        <Badge tone={s.tone} size="md" dot>{s.label}</Badge>
      </div>

      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="font-display text-title-lg text-content">৳{formatAmount(amount)}</p>
          {payment.transactionId && <p className="mt-0.5 truncate text-caption text-subtle">TxnID: {payment.transactionId}</p>}
        </div>
        <div className="flex shrink-0 items-center gap-2">
          {status === 'completed' && (
            <Button size="sm" onClick={() => onViewInvoice(payment)} leftIcon={<Icon name="download" />}>Invoice</Button>
          )}
          {payment.isDraftPayment && status === 'pending' && (
            <Button size="sm" onClick={() => window.location.assign(`/post-ad?draftId=${payment.id}&step=3`)} leftIcon={<Icon name="payments" />}>Pay now</Button>
          )}
          <Button size="sm" variant="secondary" onClick={() => onViewDetails(payment)} leftIcon={<Icon name="show" />}>Details</Button>
        </div>
      </div>
    </Card>
  );
}

function PaymentDetailDrawer({ payment, onClose, onViewInvoice }) {
  if (!payment) return null;
  const status = payment.status || (payment.used ? 'completed' : 'pending');
  const s = statusInfo(status);
  const type = payment.type || payment.bookingType || '';
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
    <Drawer open={!!payment} onClose={onClose} side="bottom" title="Payment details">
      <div className="mb-4 rounded-card bg-surface-sunken p-5">
        <p className="text-overline uppercase text-subtle">Amount paid</p>
        <p className="mt-1 font-display text-display-md text-content">৳{formatAmount(amount)}</p>
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <Badge tone={TYPE_TONE[type] || 'neutral'} size="md">{paymentTypeLabel(type)}</Badge>
          <Badge tone={s.tone} size="md" dot>{s.label}</Badge>
          <span className="text-caption text-muted">via {providerName(payment.paymentMethod || payment.provider)}</span>
        </div>
      </div>

      <dl className="divide-y divide-border">
        {rows.map(([key, val]) => (
          <div key={key} className="flex items-center justify-between gap-4 py-3">
            <dt className="text-caption uppercase text-subtle">{key}</dt>
            <dd className="max-w-[55%] break-all text-right text-body-sm font-medium text-content">{val}</dd>
          </div>
        ))}
      </dl>

      <div className="mt-4 space-y-2">
        {status === 'completed' && (
          <Button fullWidth size="lg" leftIcon={<Icon name="document" />} onClick={() => { onClose(); onViewInvoice(payment); }}>View &amp; download invoice</Button>
        )}
        {payment.isDraftPayment && status === 'pending' && (
          <Button fullWidth size="lg" leftIcon={<Icon name="payments" />} onClick={() => { onClose(); window.location.assign(`/post-ad?draftId=${payment.id}&step=3`); }}>Proceed to payment</Button>
        )}
        <Button fullWidth variant="ghost" onClick={onClose}>Close</Button>
      </div>
    </Drawer>
  );
}
