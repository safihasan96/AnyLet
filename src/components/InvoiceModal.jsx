import { useRef } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { X, Download, CheckCircle2, Building2, Calendar, Hash, Smartphone, Shield } from 'lucide-react';

/* ─────────────────────────────────────────────────────────────
   VARIANTS — decoupled from JSX (Framer Motion rule #1)
───────────────────────────────────────────────────────────────*/
const backdropV = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.22 } },
  exit:   { opacity: 0, transition: { duration: 0.2 } },
};

const sheetV = {
  hidden:  { opacity: 0, y: '100%' },
  visible: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 320, damping: 36, mass: 0.9 } },
  exit:    { opacity: 0, y: '100%', transition: { duration: 0.22, ease: [0.4, 0, 1, 1] } },
};

const desktopV = {
  hidden:  { opacity: 0, scale: 0.88, y: 32 },
  visible: { opacity: 1, scale: 1,    y: 0,  transition: { type: 'spring', stiffness: 380, damping: 28, mass: 0.9 } },
  exit:    { opacity: 0, scale: 0.88, y: 32,  transition: { duration: 0.18 } },
};

const stampV = {
  hidden:  { scale: 0, rotate: -30, opacity: 0 },
  visible: { scale: 1, rotate: -12, opacity: 1, transition: { type: 'spring', stiffness: 420, damping: 18, delay: 0.55 } },
};

/* ─────────────────────────────────────────────────────────────
   HELPERS
───────────────────────────────────────────────────────────────*/
function formatDate(ts) {
  if (!ts) return '—';
  const d = ts?.toDate ? ts.toDate() : new Date(ts);
  return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

function formatAmount(n) {
  return Number(n || 0).toLocaleString('en-BD');
}

function paymentLabel(type) {
  const map = {
    subscription: 'Monthly Subscription — Premium Plan',
    listing:      'Property Listing Fee',
    booking:      'Property Booking Fee',
    deposit:      'Security Deposit (Escrow)',
    verification: 'Property Onsite Verification Fee',
  };
  return map[type] || type || 'Platform Service';
}

function invoiceNumber(id) {
  return `INV-${(id || '').slice(0, 8).toUpperCase()}`;
}

function providerName(p) {
  const map = { bkash: 'bKash', nagad: 'Nagad', rocket: 'Rocket' };
  return map[(p || '').toLowerCase()] || p || 'Mobile Banking';
}

/* ─────────────────────────────────────────────────────────────
   PRINT INVOICE STYLES — injected once into <head>
   These rules are only active during window.print()
───────────────────────────────────────────────────────────────*/
const PRINT_STYLE_ID = 'anylet-invoice-print-styles';

function ensurePrintStyles() {
  if (document.getElementById(PRINT_STYLE_ID)) return;
  const style = document.createElement('style');
  style.id = PRINT_STYLE_ID;
  style.textContent = `
    @media print {
      body * { visibility: hidden !important; }
      #anylet-invoice-print-root,
      #anylet-invoice-print-root * { visibility: visible !important; }
      #anylet-invoice-print-root {
        position: fixed !important;
        inset: 0 !important;
        z-index: 9999999 !important;
        background: #fff !important;
        padding: 0 !important;
        overflow: visible !important;
      }
      @page {
        size: A4;
        margin: 12mm 12mm;
      }
    }
  `;
  document.head.appendChild(style);
}

/* ─────────────────────────────────────────────────────────────
   INVOICE DOCUMENT COMPONENT (rendered as HTML, printable)
───────────────────────────────────────────────────────────────*/
function InvoiceDocument({ payment, userData }) {
  const invNum   = invoiceNumber(payment?.id || payment?.paymentIntentId);
  const label    = paymentLabel(payment?.type || payment?.bookingType);
  const amount   = Number(payment?.amount || payment?.paidAmount || payment?.expectedAmount || 0);
  const provider = providerName(payment?.paymentMethod || payment?.provider);
  const txnId    = payment?.transactionId || '—';
  const refCode  = payment?.paymentIntentId || payment?.referenceCode || '—';
  const verifiedAt = payment?.verifiedAt || payment?.createdAt;
  const propertyName = payment?.propertyName || payment?.propertySnapshot?.title || null;

  const userName  = userData?.displayName || userData?.fullName ||
    [userData?.personalDetails?.firstName, userData?.personalDetails?.lastName].filter(Boolean).join(' ') ||
    'Valued Customer';
  const userEmail = userData?.email || '—';

  return (
    <div
      id="anylet-invoice-print-root"
      style={{
        fontFamily: "'Inter', 'Plus Jakarta Sans', system-ui, sans-serif",
        background: '#ffffff',
        color: '#0f172a',
        width: '100%',
        maxWidth: '720px',
        margin: '0 auto',
      }}
    >
      {/* ── HEADER GRADIENT ── */}
      <div style={{
        background: 'linear-gradient(135deg, #1a237e 0%, #4c56af 55%, #6366f1 100%)',
        padding: '36px 40px 32px',
        borderRadius: '16px 16px 0 0',
        color: '#fff',
        position: 'relative',
        overflow: 'hidden',
      }}>
        {/* Decorative circle */}
        <div style={{
          position: 'absolute', top: -40, right: -40, width: 180, height: 180,
          borderRadius: '50%', background: 'rgba(255,255,255,0.06)',
        }} />
        <div style={{
          position: 'absolute', bottom: -20, right: 60, width: 100, height: 100,
          borderRadius: '50%', background: 'rgba(255,255,255,0.04)',
        }} />

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', position: 'relative' }}>
          {/* Brand */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
              <div style={{
                width: 40, height: 40, borderRadius: 12,
                background: 'rgba(255,255,255,0.18)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                border: '1px solid rgba(255,255,255,0.25)',
              }}>
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/>
                </svg>
              </div>
              <span style={{ fontSize: 26, fontWeight: 900, letterSpacing: '-0.03em', color: '#fff' }}>AnyLet</span>
            </div>
            <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.65)', letterSpacing: '0.08em', textTransform: 'uppercase', fontWeight: 600 }}>
              any-let.vercel.app · Bangladesh
            </p>
          </div>

          {/* Invoice number */}
          <div style={{ textAlign: 'right' }}>
            <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.6)', letterSpacing: '0.1em', textTransform: 'uppercase', fontWeight: 700, marginBottom: 4 }}>Invoice</p>
            <p style={{ fontSize: 22, fontWeight: 900, letterSpacing: '-0.02em', color: '#fff' }}>{invNum}</p>
            <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.55)', marginTop: 4 }}>
              {formatDate(verifiedAt)}
            </p>
          </div>
        </div>

        {/* Status pill */}
        <div style={{ marginTop: 24, display: 'inline-flex', alignItems: 'center', gap: 7, background: 'rgba(52,211,153,0.18)', border: '1px solid rgba(52,211,153,0.4)', borderRadius: 999, padding: '5px 14px' }}>
          <span style={{ fontSize: 13, color: '#34d399' }}>✓</span>
          <span style={{ fontSize: 11, fontWeight: 700, color: '#6ee7b7', letterSpacing: '0.06em', textTransform: 'uppercase' }}>Payment Verified · Automated</span>
        </div>
      </div>

      {/* ── BILLED TO + PAYMENT METHOD ── */}
      <div style={{
        display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 0,
        background: '#f8fafc', borderLeft: '1px solid #e2e8f0', borderRight: '1px solid #e2e8f0',
      }}>
        {/* Billed To */}
        <div style={{ padding: '24px 28px', borderRight: '1px solid #e2e8f0' }}>
          <p style={{ fontSize: 9, fontWeight: 800, color: '#94a3b8', letterSpacing: '0.14em', textTransform: 'uppercase', marginBottom: 10 }}>Billed To</p>
          <p style={{ fontSize: 15, fontWeight: 700, color: '#0f172a', marginBottom: 3 }}>{userName}</p>
          <p style={{ fontSize: 12, color: '#64748b', marginBottom: 2 }}>{userEmail}</p>
          <p style={{ fontSize: 12, color: '#64748b' }}>Bangladesh</p>
          {propertyName && (
            <div style={{ marginTop: 10, background: '#eef2ff', borderRadius: 8, padding: '6px 10px', display: 'inline-block' }}>
              <p style={{ fontSize: 11, color: '#4f46e5', fontWeight: 600 }}>🏠 {propertyName}</p>
            </div>
          )}
        </div>

        {/* Payment Method */}
        <div style={{ padding: '24px 28px' }}>
          <p style={{ fontSize: 9, fontWeight: 800, color: '#94a3b8', letterSpacing: '0.14em', textTransform: 'uppercase', marginBottom: 10 }}>Payment Details</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
            {[
              ['Method', provider],
              ['Transaction ID', txnId],
              ['Reference Code', typeof refCode === 'string' ? refCode.slice(0, 18) : '—'],
              ['Verified By', 'AnyLet SMS Webhook'],
            ].map(([k, v]) => (
              <div key={k} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                <span style={{ fontSize: 11, color: '#94a3b8', fontWeight: 600 }}>{k}</span>
                <span style={{ fontSize: 11, fontWeight: 700, color: '#334155', maxWidth: 160, textAlign: 'right', wordBreak: 'break-all' }}>{v}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── LINE ITEMS TABLE ── */}
      <div style={{ border: '1px solid #e2e8f0', borderTop: 'none' }}>
        {/* Table header */}
        <div style={{
          display: 'grid', gridTemplateColumns: '1fr 80px 110px 110px',
          padding: '10px 28px',
          background: '#1e293b',
          color: '#94a3b8',
        }}>
          {['Description', 'Qty', 'Unit Price', 'Total'].map((h, i) => (
            <p key={h} style={{ fontSize: 9, fontWeight: 800, letterSpacing: '0.12em', textTransform: 'uppercase', textAlign: i > 0 ? 'right' : 'left' }}>{h}</p>
          ))}
        </div>

        {/* Line item */}
        <div style={{
          display: 'grid', gridTemplateColumns: '1fr 80px 110px 110px',
          padding: '18px 28px',
          borderBottom: '1px solid #f1f5f9',
          alignItems: 'center',
        }}>
          <div>
            <p style={{ fontSize: 13, fontWeight: 700, color: '#0f172a', marginBottom: 3 }}>{label}</p>
            {propertyName && <p style={{ fontSize: 11, color: '#94a3b8' }}>Property: {propertyName}</p>}
            <p style={{ fontSize: 10, color: '#94a3b8', marginTop: 2 }}>Platform service fee — AnyLet</p>
          </div>
          <p style={{ fontSize: 13, fontWeight: 600, color: '#475569', textAlign: 'right' }}>1</p>
          <p style={{ fontSize: 13, fontWeight: 600, color: '#475569', textAlign: 'right' }}>৳{formatAmount(amount)}</p>
          <p style={{ fontSize: 14, fontWeight: 800, color: '#1e293b', textAlign: 'right' }}>৳{formatAmount(amount)}</p>
        </div>

        {/* Subtotals */}
        <div style={{ padding: '16px 28px 20px', background: '#fafafa' }}>
          {[
            ['Subtotal', `৳${formatAmount(amount)}`, false],
            ['Service Tax (0%)', '৳0.00', false],
            ['Processing Fee', '৳0.00', false],
          ].map(([k, v]) => (
            <div key={k} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
              <span style={{ fontSize: 12, color: '#94a3b8', fontWeight: 500 }}>{k}</span>
              <span style={{ fontSize: 12, color: '#64748b', fontWeight: 600 }}>{v}</span>
            </div>
          ))}
          {/* Total divider */}
          <div style={{ borderTop: '2px solid #1e293b', marginTop: 10, paddingTop: 12, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: 14, fontWeight: 800, color: '#0f172a', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Total Paid</span>
            <span style={{ fontSize: 22, fontWeight: 900, color: '#1a237e', letterSpacing: '-0.02em' }}>৳{formatAmount(amount)}</span>
          </div>
        </div>
      </div>

      {/* ── VERIFICATION SECTION ── */}
      <div style={{
        margin: '0',
        padding: '20px 28px',
        background: 'linear-gradient(135deg, #f0fdf4, #ecfdf5)',
        border: '1px solid #bbf7d0',
        borderTop: 'none',
        display: 'flex',
        alignItems: 'center',
        gap: 16,
        position: 'relative',
      }}>
        <div style={{
          width: 44, height: 44, borderRadius: '50%',
          background: '#22c55e', display: 'flex', alignItems: 'center',
          justifyContent: 'center', flexShrink: 0,
          boxShadow: '0 4px 12px rgba(34,197,94,0.3)',
        }}>
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="20 6 9 17 4 12"/>
          </svg>
        </div>
        <div style={{ flex: 1 }}>
          <p style={{ fontSize: 13, fontWeight: 800, color: '#15803d', marginBottom: 2 }}>Payment Successfully Verified</p>
          <p style={{ fontSize: 11, color: '#4ade80', fontWeight: 500 }}>
            Verified automatically via AnyLet SMS Webhook System · {formatDate(verifiedAt)}
          </p>
        </div>
        {/* Stamp watermark */}
        <div style={{
          position: 'absolute', right: 24, top: '50%', transform: 'translateY(-50%) rotate(-8deg)',
          border: '3px solid rgba(34,197,94,0.35)', borderRadius: 8,
          padding: '5px 12px', opacity: 0.7,
        }}>
          <p style={{ fontSize: 11, fontWeight: 900, color: '#16a34a', letterSpacing: '0.1em', textTransform: 'uppercase' }}>PAID</p>
        </div>
      </div>

      {/* ── FOOTER ── */}
      <div style={{
        padding: '18px 28px',
        background: '#f8fafc',
        border: '1px solid #e2e8f0',
        borderTop: '1px dashed #cbd5e1',
        borderRadius: '0 0 16px 16px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        gap: 16,
      }}>
        <div>
          <p style={{ fontSize: 10, color: '#94a3b8', lineHeight: 1.6 }}>
            This is a computer-generated invoice and does not require a physical signature.<br />
            For support, contact us at <strong style={{ color: '#6366f1' }}>support@any-let.vercel.app</strong>
          </p>
        </div>
        <div style={{ textAlign: 'right', flexShrink: 0 }}>
          <p style={{ fontSize: 10, fontWeight: 800, color: '#1a237e', letterSpacing: '0.04em' }}>AnyLet Payments</p>
          <p style={{ fontSize: 9, color: '#94a3b8' }}>Powered by bKash · Nagad · Rocket</p>
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────
   MAIN EXPORT
───────────────────────────────────────────────────────────────*/
export default function InvoiceModal({ isOpen, onClose, payment, userData }) {
  const printRef = useRef(null);
  const reduced = useReducedMotion();

  if (!payment) return null;

  const handleDownload = () => {
    ensurePrintStyles();
    window.print();
  };

  const bV = reduced
    ? { hidden: { opacity: 0 }, visible: { opacity: 1 }, exit: { opacity: 0 } }
    : backdropV;

  if (typeof document === 'undefined') return null;

  return createPortal(
    <AnimatePresence mode="wait">
      {isOpen && (
        <motion.div
          key="invoice-backdrop"
          variants={bV} initial="hidden" animate="visible" exit="exit"
          onClick={onClose}
          className="fixed inset-0 z-[90] flex items-end md:items-center justify-center"
          aria-modal="true"
          role="dialog"
          aria-label="Invoice"
        >
          <div className="absolute inset-0 bg-slate-900/75 backdrop-blur-xl" />

          {/* Mobile: bottom sheet / Desktop: centered modal */}
          <motion.div
            key="invoice-card"
            variants={reduced ? bV : window.innerWidth < 768 ? sheetV : desktopV}
            initial="hidden" animate="visible" exit="exit"
            onClick={e => e.stopPropagation()}
            className="relative w-full md:max-w-3xl md:mx-4 max-h-[92dvh] md:max-h-[90dvh] flex flex-col bg-white dark:bg-slate-900 md:rounded-[28px] rounded-t-[28px] shadow-2xl overflow-hidden transform-gpu will-change-transform"
          >
            {/* Top handle (mobile) */}
            <div className="flex justify-center pt-3 pb-0 md:hidden">
              <div className="w-10 h-1 rounded-full bg-slate-200 dark:bg-slate-700" />
            </div>

            {/* Modal toolbar */}
            <div className="flex items-center justify-between px-5 md:px-7 py-4 border-b border-slate-100 dark:border-slate-800 flex-shrink-0">
              <div className="flex items-center gap-3">
                <div className="size-10 bg-indigo-50 dark:bg-indigo-900/40 rounded-2xl flex items-center justify-center">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-indigo-600 dark:text-indigo-400">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/>
                  </svg>
                </div>
                <div>
                  <p className="text-[14px] font-black text-slate-900 dark:text-white">Payment Invoice</p>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                    {payment?.id ? `#INV-${payment.id.slice(0, 8).toUpperCase()}` : 'Enterprise Receipt'}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <motion.button
                  onClick={handleDownload}
                  whileHover={{ scale: 1.04, y: -1 }}
                  whileTap={{ scale: 0.96 }}
                  className="flex items-center gap-2 px-4 py-2.5 bg-primary text-white rounded-xl font-bold text-xs shadow-lg shadow-primary/25 transition-all"
                >
                  <Download size={15} strokeWidth={2.5} />
                  <span className="hidden sm:inline">Download PDF</span>
                  <span className="sm:hidden">PDF</span>
                </motion.button>
                <motion.button
                  onClick={onClose}
                  whileHover={{ scale: 1.1, rotate: 90 }}
                  whileTap={{ scale: 0.9 }}
                  transition={{ type: 'spring', stiffness: 500, damping: 18 }}
                  className="size-9 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors"
                  aria-label="Close invoice"
                >
                  <X size={17} strokeWidth={2.5} />
                </motion.button>
              </div>
            </div>

            {/* Invoice scroll area */}
            <div className="flex-1 overflow-y-auto overscroll-contain p-4 md:p-8 bg-slate-50 dark:bg-slate-950">
              <motion.div
                ref={printRef}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ type: 'spring', stiffness: 280, damping: 28, delay: 0.1 }}
                className="rounded-2xl overflow-hidden shadow-xl border border-slate-200 dark:border-slate-700"
              >
                <InvoiceDocument payment={payment} userData={userData} />
              </motion.div>

              {/* Verified stamp overlay (decorative, in-app only) */}
              <div className="relative">
                <motion.div
                  variants={stampV}
                  initial="hidden"
                  animate="visible"
                  className="absolute -top-16 right-4 md:right-12 pointer-events-none"
                >
                  <div className="border-4 border-emerald-500/50 rounded-xl p-2 px-4 rotate-[-12deg]">
                    <p className="text-emerald-500/70 font-black text-xl tracking-[0.2em] uppercase">PAID</p>
                  </div>
                </motion.div>
              </div>

              <p className="text-center text-xs text-slate-400 dark:text-slate-600 mt-6 mb-2 font-medium">
                Tap "Download PDF" to save · Powered by AnyLet Automated Payments
              </p>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body
  );
}
