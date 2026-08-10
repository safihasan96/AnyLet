import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { doc, getDoc } from 'firebase/firestore';
import { db, auth } from '../../firebase';
import { getApiUrl } from '../../utils/api';
import {
  ArrowLeft, Shield, MessageSquare, Search, AlertTriangle,
  Clock, User, Lock, Info, ChevronDown, ChevronUp,
} from 'lucide-react';
import './AdminDesignSystem.css';

// ─── helpers ──────────────────────────────────────────────────────────────────
function formatTs(iso) {
  if (!iso) return '—';
  const d = new Date(iso);
  return d.toLocaleString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}

// ─── sub-components ───────────────────────────────────────────────────────────
function MessageBubble({ msg, participantNames }) {
  const isA = participantNames[0] === msg.senderId; // first participant = left
  const name = participantNames[msg.senderId] || msg.senderId.substring(0, 8) + '…';
  return (
    <div className={`flex gap-3 ${isA ? '' : 'flex-row-reverse'} group`}>
      {/* Avatar */}
      <div className="w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center text-xs font-bold"
        style={{ background: isA ? 'hsla(222,100%,83%,0.15)' : 'hsla(155,69%,59%,0.15)',
                 color:      isA ? 'hsl(222,100%,83%)'       : 'hsl(155,69%,59%)' }}>
        {name.charAt(0).toUpperCase()}
      </div>
      {/* Bubble */}
      <div className={`max-w-[70%] ${isA ? '' : 'items-end flex flex-col'}`}>
        <p className="text-[10px] text-[hsl(var(--on-surface-variant))] mb-1 px-1">{name}</p>
        <div className={`rounded-2xl px-4 py-2.5 text-sm leading-relaxed
          ${isA
            ? 'rounded-tl-sm bg-[hsla(var(--surface-container-high),0.8)]'
            : 'rounded-tr-sm bg-[hsla(var(--primary),0.12)] text-[hsl(var(--primary))]'
          }`}>
          {msg.text || <span className="italic text-[hsl(var(--on-surface-variant))]">[attachment]</span>}
        </div>
        {msg.imageUrl && (
          <img src={msg.imageUrl} alt="attachment" className="mt-2 max-w-[200px] rounded-lg border border-[hsla(0,0%,100%,0.08)]" />
        )}
        <p className="text-[10px] text-[hsl(var(--on-surface-variant))] mt-1 px-1 opacity-0 group-hover:opacity-100 transition-opacity">
          {formatTs(msg.createdAt)}
        </p>
      </div>
    </div>
  );
}

function CasePanel({ dispute, bookingId, conversation, collapsed, onToggle }) {
  return (
    <div className="glass-panel p-5 flex flex-col gap-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Shield size={16} className="text-rose-400" />
          <h2 className="font-semibold text-sm">Case Details</h2>
        </div>
        <button
          onClick={onToggle}
          className="md:hidden text-[hsl(var(--on-surface-variant))] p-1"
        >
          {collapsed ? <ChevronDown size={16} /> : <ChevronUp size={16} />}
        </button>
      </div>

      <div className={`${collapsed ? 'hidden' : 'flex'} md:flex flex-col gap-3`}>
        {/* Booking ID */}
        <InfoRow label="Booking ID" value={bookingId} mono />

        {/* Dispute Status */}
        {dispute ? (
          <>
            <InfoRow label="Status" value={<span className="status-pill error">Open Dispute</span>} />
            <InfoRow label="Raised By" value={`${dispute.role || '—'}`} />
            <InfoRow label="Reason" value={dispute.reason || '—'} />
            <InfoRow label="Amount Held" value={dispute.amountHeld ? `৳${dispute.amountHeld.toLocaleString()}` : '—'} />
            {dispute.raisedAt && (
              <InfoRow label="Raised At" value={formatTs(dispute.raisedAt?.seconds ? new Date(dispute.raisedAt.seconds * 1000).toISOString() : null)} />
            )}
          </>
        ) : (
          <InfoRow label="Status" value={<span className="status-pill warning">Disputed Escrow</span>} />
        )}

        {/* Conversation */}
        {conversation && (
          <>
            <div className="border-t border-[hsla(0,0%,100%,0.06)] pt-3 mt-1" />
            <InfoRow label="Conv. ID" value={conversation.id} mono />
            <InfoRow label="Participants" value={`${conversation.participants?.length || 0} users`} />
          </>
        )}

        {/* Read-only notice */}
        <div className="mt-2 p-3 rounded-xl bg-[hsla(var(--warning),0.07)] border border-[hsla(var(--warning),0.15)] flex gap-2">
          <Lock size={13} className="text-[hsl(var(--warning))] flex-shrink-0 mt-0.5" />
          <p className="text-[11px] text-[hsl(var(--on-surface-variant))] leading-relaxed">
            This is a <strong className="text-[hsl(var(--warning))]">read-only</strong> forensic view. Messaging is disabled and access is logged.
          </p>
        </div>
      </div>
    </div>
  );
}

function InfoRow({ label, value, mono }) {
  return (
    <div className="flex flex-col gap-0.5">
      <p className="text-label-caps text-[hsl(var(--on-surface-variant))]">{label}</p>
      <p className={`text-sm text-[hsl(var(--on-surface))] break-all ${mono ? 'font-mono text-[11px]' : ''}`}>{value}</p>
    </div>
  );
}

// ─── main component ───────────────────────────────────────────────────────────
export default function AdminChatReview() {
  const { bookingId } = useParams();
  const navigate = useNavigate();

  const [state, setState] = useState({ loading: !!bookingId, error: null, data: null });
  const [search, setSearch] = useState('');
  const [caseCollapsed, setCaseCollapsed] = useState(false);
  const [userNames, setUserNames] = useState({});
  const [inputBookingId, setInputBookingId] = useState('');
  const chatEndRef = useRef(null);

  // Fetch chat via secure backend
  useEffect(() => {
    if (!bookingId) return;
    let cancelled = false;

    async function load() {
      setState({ loading: true, error: null, data: null });
      try {
        const token = await auth.currentUser.getIdToken();
        const res = await fetch(getApiUrl('/api/admin?action=chat-review'), {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ bookingId }),
        });
        const json = await res.json();
        if (!res.ok) throw new Error(json.error || 'Failed to load chat review');
        if (!cancelled) setState({ loading: false, error: null, data: json });
      } catch (e) {
        if (!cancelled) setState({ loading: false, error: e.message, data: null });
      }
    }

    load();
    return () => { cancelled = true; };
  }, [bookingId]);

  // Resolve participant display names from Firestore users collection
  useEffect(() => {
    const participants = state.data?.conversation?.participants || [];
    if (!participants.length) return;
    const resolve = async (uid) => {
      try {
        const snap = await getDoc(doc(db, 'users', uid));
        return snap.exists() ? (snap.data().displayName || snap.data().name || uid.substring(0, 8)) : uid.substring(0, 8);
      } catch { return uid.substring(0, 8); }
    };
    Promise.all(participants.map(uid => resolve(uid).then(name => [uid, name])))
      .then(entries => setUserNames(Object.fromEntries(entries)));
  }, [state.data]);

  // Filter messages by search keyword
  const filteredMessages = useMemo(() => {
    const msgs = state.data?.messages || [];
    if (!search.trim()) return msgs;
    const q = search.toLowerCase();
    return msgs.filter(m => m.text?.toLowerCase().includes(q));
  }, [state.data?.messages, search]);

  // Scroll to bottom when messages load
  useEffect(() => {
    if (!state.loading && state.data?.messages?.length) {
      chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [state.loading]);

  const participantOrder = state.data?.conversation?.participants || [];

  // ── Render ─────────────────────────────────────────────────────────────────
  
  if (!bookingId) {
    return (
      <div className="admin-datahub min-h-screen p-4 md:p-8 flex items-center justify-center">
        <div className="glass-panel p-8 flex flex-col items-center gap-6 max-w-md w-full text-center">
          <div className="w-16 h-16 rounded-full bg-[hsla(var(--primary),0.15)] flex items-center justify-center">
            <Shield size={32} className="text-[hsl(var(--primary))]" />
          </div>
          <div>
            <h2 className="text-xl font-bold mb-2">Forensic Chat Review</h2>
            <p className="text-sm text-[hsl(var(--on-surface-variant))] leading-relaxed">
              Enter a Booking ID to review the associated chat. Access is strictly logged and restricted to bookings with an active dispute.
            </p>
          </div>
          <form 
            onSubmit={(e) => { e.preventDefault(); if (inputBookingId.trim()) navigate(`/admin/chat-review/${inputBookingId.trim()}`); }}
            className="w-full flex flex-col gap-3"
          >
            <input
              type="text"
              placeholder="e.g. bk_123456789"
              value={inputBookingId}
              onChange={e => setInputBookingId(e.target.value)}
              className="glass-input px-4 py-3 text-sm w-full text-center"
              autoFocus
            />
            <button 
              type="submit" 
              disabled={!inputBookingId.trim()}
              className="glass-button-primary py-3 w-full disabled:opacity-50"
            >
              Review Conversation
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-datahub min-h-screen p-4 md:p-8">
      {/* Back + Title */}
      <div className="flex items-center gap-3 mb-6">
        <button
          onClick={() => navigate(-1)}
          className="p-2 rounded-lg hover:bg-[hsla(0,0%,100%,0.05)] text-[hsl(var(--on-surface-variant))] transition-colors"
        >
          <ArrowLeft size={20} />
        </button>
        <div>
          <h1 className="text-xl font-bold tracking-tight flex items-center gap-2">
            <Shield size={20} className="text-rose-400" />
            Chat Review — Forensic Mode
          </h1>
          <p className="text-xs text-[hsl(var(--on-surface-variant))] mt-0.5">
            Case-gated access · Audit logged · Read-only
          </p>
        </div>
      </div>

      {/* Loading */}
      {state.loading && (
        <div className="flex flex-col items-center justify-center min-h-[40vh] gap-4">
          <div className="w-10 h-10 rounded-full border-2 border-[hsl(var(--primary))] border-t-transparent animate-spin" />
          <p className="text-sm text-[hsl(var(--on-surface-variant))]">Verifying case access…</p>
        </div>
      )}

      {/* Error / Access Denied */}
      {!state.loading && state.error && (
        <div className="glass-panel p-8 flex flex-col items-center gap-4 text-center max-w-lg mx-auto">
          <div className="w-16 h-16 rounded-full bg-rose-500/10 flex items-center justify-center">
            <AlertTriangle size={32} className="text-rose-400" />
          </div>
          <h2 className="font-bold text-lg">Access Denied</h2>
          <p className="text-sm text-[hsl(var(--on-surface-variant))] leading-relaxed">{state.error}</p>
          <button
            onClick={() => navigate(-1)}
            className="glass-button-ghost px-6 py-2 text-sm"
          >
            Go Back
          </button>
        </div>
      )}

      {/* Main Layout */}
      {!state.loading && state.data && (
        <div className="flex flex-col md:flex-row gap-6 h-full">

          {/* ── LEFT: Case Panel ── */}
          <div className="w-full md:w-80 flex-shrink-0 space-y-4">
            <CasePanel
              dispute={state.data.dispute}
              bookingId={state.data.bookingId}
              conversation={state.data.conversation}
              collapsed={caseCollapsed}
              onToggle={() => setCaseCollapsed(v => !v)}
            />

            {/* Participants */}
            {participantOrder.length > 0 && (
              <div className="glass-panel p-5">
                <h3 className="font-semibold text-sm flex items-center gap-2 mb-3">
                  <User size={14} className="text-[hsl(var(--primary))]" />
                  Participants
                </h3>
                <div className="space-y-2">
                  {participantOrder.map((uid, i) => (
                    <div key={uid} className="flex items-center gap-3">
                      <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0`}
                        style={{
                          background: i === 0 ? 'hsla(222,100%,83%,0.15)' : 'hsla(155,69%,59%,0.15)',
                          color:      i === 0 ? 'hsl(222,100%,83%)'       : 'hsl(155,69%,59%)',
                        }}>
                        {(userNames[uid] || uid).charAt(0).toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-medium truncate">{userNames[uid] || '…'}</p>
                        <p className="text-[10px] font-mono text-[hsl(var(--on-surface-variant))]">{uid}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Access log notice */}
            <div className="glass-panel p-4 flex gap-3">
              <Info size={14} className="text-[hsl(var(--primary))] flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-xs font-semibold text-[hsl(var(--on-surface))] mb-0.5">Access Logged</p>
                <p className="text-[11px] text-[hsl(var(--on-surface-variant))] leading-relaxed">
                  Accessed at {formatTs(state.data.accessedAt)} by {state.data.accessedBy?.substring(0, 8)}…
                </p>
              </div>
            </div>
          </div>

          {/* ── RIGHT: Chat Transcript ── */}
          <div className="flex-1 glass-panel flex flex-col overflow-hidden min-h-[60vh]">
            {/* Search bar */}
            <div className="p-4 border-b border-[hsla(0,0%,100%,0.06)] flex items-center gap-3">
              <div className="relative flex-1">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[hsl(var(--on-surface-variant))]" />
                <input
                  id="chat-search"
                  type="text"
                  placeholder='Search within conversation… (e.g. "refund", "promise")'
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  className="glass-input pl-8 pr-4 py-2 text-sm w-full"
                />
              </div>
              <div className="flex items-center gap-2">
                <MessageSquare size={14} className="text-[hsl(var(--on-surface-variant))]" />
                <span className="text-xs text-[hsl(var(--on-surface-variant))]">
                  {filteredMessages.length} / {state.data.messages?.length || 0} msgs
                </span>
              </div>
            </div>

            {/* No conversation found */}
            {!state.data.conversation && (
              <div className="flex-1 flex flex-col items-center justify-center gap-3 p-8 text-center">
                <MessageSquare size={40} className="text-[hsl(var(--on-surface-variant))]" />
                <h3 className="font-semibold">No Conversation Found</h3>
                <p className="text-sm text-[hsl(var(--on-surface-variant))] max-w-sm">
                  A dispute exists for this booking, but no chat thread is linked to it yet. The parties may have communicated outside the platform.
                </p>
              </div>
            )}

            {/* Empty search results */}
            {state.data.conversation && filteredMessages.length === 0 && search && (
              <div className="flex-1 flex flex-col items-center justify-center gap-3 p-8 text-center">
                <Search size={32} className="text-[hsl(var(--on-surface-variant))]" />
                <p className="text-sm text-[hsl(var(--on-surface-variant))]">
                  No messages match "<strong>{search}</strong>"
                </p>
                <button onClick={() => setSearch('')} className="text-xs text-[hsl(var(--primary))] hover:underline">
                  Clear search
                </button>
              </div>
            )}

            {/* Messages */}
            {state.data.conversation && filteredMessages.length > 0 && (
              <div className="flex-1 overflow-y-auto p-5 space-y-4">
                {/* Forensic watermark banner */}
                <div className="flex items-center gap-2 p-3 rounded-xl bg-[hsla(var(--warning),0.06)] border border-[hsla(var(--warning),0.12)] mb-2">
                  <Lock size={12} className="text-[hsl(var(--warning))]" />
                  <p className="text-[11px] text-[hsl(var(--on-surface-variant))]">
                    Forensic review — Read-only transcript · Messages cannot be edited, deleted, or sent
                  </p>
                </div>

                {/* Group by date */}
                {filteredMessages.map((msg, i) => {
                  const prevMsg = i > 0 ? filteredMessages[i - 1] : null;
                  const showDate = !prevMsg || new Date(msg.createdAt).toDateString() !== new Date(prevMsg.createdAt).toDateString();
                  return (
                    <React.Fragment key={msg.id}>
                      {showDate && msg.createdAt && (
                        <div className="flex items-center gap-3 my-2">
                          <div className="flex-1 border-t border-[hsla(0,0%,100%,0.06)]" />
                          <span className="text-[11px] text-[hsl(var(--on-surface-variant))] flex items-center gap-1">
                            <Clock size={10} />
                            {new Date(msg.createdAt).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                          </span>
                          <div className="flex-1 border-t border-[hsla(0,0%,100%,0.06)]" />
                        </div>
                      )}
                      <MessageBubble msg={msg} participantNames={userNames} />
                    </React.Fragment>
                  );
                })}
                <div ref={chatEndRef} />
              </div>
            )}

            {/* Frozen input — enforces read-only */}
            {state.data.conversation && (
              <div className="p-4 border-t border-[hsla(0,0%,100%,0.06)]">
                <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-[hsla(0,0%,100%,0.03)] border border-[hsla(0,0%,100%,0.05)]">
                  <Lock size={14} className="text-[hsl(var(--on-surface-variant))]" />
                  <p className="text-sm text-[hsl(var(--on-surface-variant))] italic">
                    Messaging disabled — Admin view is read-only
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
