import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { doc, onSnapshot, collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import {
  subscribeToMessages, sendMessage, markConversationRead,
  acceptViewingRequest, rejectViewingRequest,
  deleteMessageForUser, deleteMessagesBulk
} from '../utils/messageService';
import { Phone, ArrowLeft, Send, CheckCheck, Clock, X, Check, Reply, Trash2, ListChecks, CornerDownRight } from 'lucide-react';
import { motion, AnimatePresence, useMotionValue, useTransform, useSpring } from 'framer-motion';

// ── Variants (all decoupled from JSX) ────────────────────────────────────────

const headerVariants = {
  hidden: { opacity: 0, y: -20 },
  visible: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 100, damping: 20 } },
};

const messageBubbleVariants = {
  hidden: (isMine) => ({
    opacity: 0,
    scale: 0.7,
    x: isMine ? 20 : -20,
    y: 12,
  }),
  visible: {
    opacity: 1,
    scale: 1,
    x: 0,
    y: 0,
    transition: { type: 'spring', stiffness: 300, damping: 22 },
  },
  exit: {
    opacity: 0,
    scale: 0.8,
    transition: { duration: 0.15 },
  },
};

const requestCardVariants = {
  hidden: { opacity: 0, y: 24, scale: 0.95 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { type: 'spring', stiffness: 90, damping: 18, delay: 0.2 },
  },
};

const dateLabelVariants = {
  hidden: { opacity: 0, y: 8 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.3 } },
};

const inputBarVariants = {
  hidden: { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 120, damping: 22 } },
};

const sendButtonVariants = {
  idle: { scale: 1 },
  active: { scale: 1.12, rotate: 6 },
  sending: { scale: 0.9, rotate: 0 },
};

// ── Format helpers ────────────────────────────────────────────────────────────
function fmtTime(ts) {
  if (!ts) return '';
  const d = ts.toDate ? ts.toDate() : new Date(ts);
  return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}
function fmtDateLabel(ts) {
  if (!ts) return '';
  const d = ts.toDate ? ts.toDate() : new Date(ts);
  const today = new Date();
  const yesterday = new Date(); yesterday.setDate(today.getDate() - 1);
  if (d.toDateString() === today.toDateString()) return 'Today';
  if (d.toDateString() === yesterday.toDateString()) return 'Yesterday';
  return d.toLocaleDateString([], { weekday: 'long', month: 'short', day: 'numeric' });
}

// ── 3D Request Card ───────────────────────────────────────────────────────────
function RequestCard({ request, isOwner, actioning, onAccept, onReject }) {
  const ref = useRef(null);
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const rotateX = useTransform(y, [-0.5, 0.5], [5, -5]);
  const rotateY = useTransform(x, [-0.5, 0.5], [-8, 8]);
  const sRotateX = useSpring(rotateX, { stiffness: 300, damping: 25 });
  const sRotateY = useSpring(rotateY, { stiffness: 300, damping: 25 });

  function onMouseMove(e) {
    const rect = ref.current.getBoundingClientRect();
    x.set((e.clientX - rect.left) / rect.width - 0.5);
    y.set((e.clientY - rect.top) / rect.height - 0.5);
  }
  function onMouseLeave() { x.set(0); y.set(0); }

  const statusConfig = {
    accepted: { bg: 'bg-emerald-50 dark:bg-emerald-950/40', border: 'border-emerald-200 dark:border-emerald-800', icon: <Check size={14} />, color: 'text-emerald-600', label: 'Request Accepted' },
    rejected: { bg: 'bg-rose-50 dark:bg-rose-950/40', border: 'border-rose-200 dark:border-rose-800', icon: <X size={14} />, color: 'text-rose-600', label: 'Request Declined' },
    pending: { bg: 'bg-amber-50 dark:bg-amber-950/40', border: 'border-amber-200 dark:border-amber-800', icon: <Clock size={14} />, color: 'text-amber-600', label: 'Awaiting Response' },
  };
  const status = statusConfig[request.status] || statusConfig.pending;

  return (
    <motion.div
      ref={ref}
      variants={requestCardVariants}
      initial="hidden"
      animate="visible"
      onMouseMove={onMouseMove}
      onMouseLeave={onMouseLeave}
      style={{
        rotateX: sRotateX,
        rotateY: sRotateY,
        transformStyle: 'preserve-3d',
        perspective: 800,
        willChange: 'transform',
      }}
      className={`rounded-3xl border p-4 mb-5 ${status.bg} ${status.border} shadow-lg`}
    >
      <div className="font-black text-sm text-slate-700 dark:text-slate-200 mb-3 tracking-wide uppercase" style={{ translateZ: 10 }}>
        📋 Viewing Request
      </div>

      {request.propertyImage && (
        <div className="rounded-2xl overflow-hidden mb-3 h-32" style={{ translateZ: 6 }}>
          <img loading="lazy" src={request.propertyImage} alt="" className="w-full h-full object-cover" />
        </div>
      )}

      {/* Tenant details (owner-only view) */}
      {isOwner && request.tenantDetails && (
        <div className="bg-white/60 dark:bg-slate-900/40 rounded-xl p-3 text-xs space-y-1 mb-3 backdrop-blur-sm" style={{ translateZ: 4 }}>
          {[['Name', request.tenantDetails.name], ['Phone', request.tenantDetails.phone], ['Profession', request.tenantDetails.profession], ['Marital Status', request.tenantDetails.maritalStatus], ['Occupants', request.tenantDetails.numberOfOccupants], ['Date', request.tenantDetails.preferredDate]]
            .filter(([, v]) => v)
            .map(([label, val]) => (
              <div key={label} className="flex gap-2">
                <span className="text-slate-400 w-20 shrink-0">{label}</span>
                <span className="font-semibold text-slate-700 dark:text-slate-200">{val}</span>
              </div>
            ))}
          {request.tenantDetails.message && (
            <p className="mt-2 pt-2 border-t border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 italic">
              "{request.tenantDetails.message}"
            </p>
          )}
        </div>
      )}

      {/* Status / Actions */}
      {request.status === 'pending' && isOwner ? (
        <div className="flex gap-2" style={{ translateZ: 12 }}>
          <motion.button
            whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.96 }}
            onClick={onAccept} disabled={actioning}
            className="flex-1 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white font-black rounded-xl text-sm flex items-center justify-center gap-1.5 shadow-md shadow-emerald-500/30 transition-colors"
          >
            <Check size={14} /> Accept
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.96 }}
            onClick={onReject} disabled={actioning}
            className="flex-1 py-2.5 bg-white dark:bg-slate-800 text-rose-500 font-black rounded-xl text-sm border border-rose-200 dark:border-rose-800 flex items-center justify-center gap-1.5 transition-colors"
          >
            <X size={14} /> Decline
          </motion.button>
        </div>
      ) : (
        <div className={`flex items-center justify-center gap-2 py-2.5 rounded-xl font-black text-sm ${status.color} bg-white/50 dark:bg-slate-900/30`} style={{ translateZ: 10 }}>
          {status.icon}
          {status.label}
        </div>
      )}
    </motion.div>
  );
}

// ── Message Bubble Component ────────────────────────────────────────────────
function MessageBubble({ msg, isMine, onReply, onDelete, isSelected, onToggleSelect, selectionMode, currentUid }) {
  const x = useMotionValue(0);
  const opacityLeft = useTransform(x, [0, 50], [0, 1]);
  const opacityRight = useTransform(x, [0, -50], [0, 1]);

  const holdTimeout = useRef(null);

  const handlePointerDown = () => {
    holdTimeout.current = setTimeout(() => {
      onToggleSelect(msg.id, true);
      if (window.navigator.vibrate) window.navigator.vibrate(50);
    }, 500);
  };
  const cancelHold = () => {
    if (holdTimeout.current) clearTimeout(holdTimeout.current);
  };

  const handleDragEnd = (event, info) => {
    if (info.offset.x > 80) {
      onDelete(msg.id);
    } else if (info.offset.x < -80) {
      onReply(msg);
    }
  };

  return (
    <motion.div
      layout
      custom={isMine}
      variants={messageBubbleVariants}
      initial="hidden"
      animate="visible"
      exit="exit"
      className={`relative flex items-center w-full mb-2 group ${selectionMode ? 'pl-8' : ''}`}
      onPointerDown={handlePointerDown}
      onPointerUp={cancelHold}
      onPointerMove={cancelHold}
      onPointerLeave={cancelHold}
    >
      {/* Selection Checkbox */}
      {selectionMode && (
        <div className="absolute left-0 w-8 h-full flex items-center justify-center cursor-pointer" onClick={() => onToggleSelect(msg.id)}>
          <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors ${isSelected ? 'bg-indigo-600 border-indigo-600' : 'border-slate-300 dark:border-slate-600'}`}>
            {isSelected && <Check size={12} className="text-white" />}
          </div>
        </div>
      )}

      {/* Swipe Action Backgrounds */}
      <div className="absolute inset-0 flex justify-between items-center px-4 overflow-hidden pointer-events-none rounded-2xl">
        <motion.div style={{ opacity: opacityLeft }} className="text-rose-500 flex items-center gap-2">
          <Trash2 size={18} />
        </motion.div>
        <motion.div style={{ opacity: opacityRight }} className="text-indigo-500 flex items-center gap-2">
          <Reply size={18} />
        </motion.div>
      </div>

      {/* Desktop Hover Actions */}
      {!selectionMode && (
        <div className={`absolute top-0 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity hidden md:flex ${isMine ? 'right-[100%] pr-2' : 'left-[100%] pl-2'}`}>
          <button onClick={() => onReply(msg)} className="p-1.5 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-slate-400 transition-colors"><Reply size={14}/></button>
          <button onClick={() => onDelete(msg.id)} className="p-1.5 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-slate-400 transition-colors"><Trash2 size={14}/></button>
          <button onClick={() => onToggleSelect(msg.id, true)} className="p-1.5 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-slate-400 transition-colors"><ListChecks size={14}/></button>
        </div>
      )}

      {/* Draggable Bubble */}
      <motion.div
        className={`flex flex-col flex-1 ${isMine ? 'items-end' : 'items-start'}`}
        drag="x"
        dragConstraints={{ left: 0, right: 0 }}
        dragElastic={0.2}
        onDragEnd={handleDragEnd}
        style={{ x }}
      >
        <div className={`relative max-w-[85%] sm:max-w-[75%] px-4 py-2.5 shadow-sm transition-all ${isMine ? 'bg-[#1a227f] text-white rounded-2xl rounded-br-md' : 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white rounded-2xl rounded-bl-md border border-slate-100 dark:border-slate-700'} ${isSelected ? 'ring-2 ring-indigo-500 opacity-90 scale-[0.98]' : ''}`}>
          {msg.replyTo && (
            <div className={`mb-2 pl-2 border-l-2 text-xs opacity-80 ${isMine ? 'border-white/50' : 'border-[#1a227f]/50 dark:border-indigo-400/50'}`}>
              <p className="font-bold truncate">{msg.replyTo.senderId === currentUid ? 'You' : 'Them'}</p>
              <p className="truncate opacity-90 line-clamp-2">{msg.replyTo.text}</p>
            </div>
          )}
          <p className="text-sm leading-relaxed">{msg.text}</p>
          <div className={`text-[10px] mt-1 flex items-center gap-1 ${isMine ? 'justify-end text-indigo-200' : 'text-slate-400'}`}>
            {fmtTime(msg.createdAt)}
            {isMine && <CheckCheck size={11} />}
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

// ── Main ConversationDetail component ────────────────────────────────────────
export default function ConversationDetail({ embedded = false, conversationId: propConvId, onClose }) {
  const params = useParams();
  const conversationId = propConvId || params.conversationId;
  const requestId = params.requestId;
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const { showToast } = useToast();

  const [request, setRequest] = useState(null);
  const [conversation, setConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [actioning, setActioning] = useState(false);
  const [loading, setLoading] = useState(true);
  const bottomRef = useRef(null);

  const [replyingTo, setReplyingTo] = useState(null);
  const [selectedMessages, setSelectedMessages] = useState(new Set());
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(null);

  // ── Redirect old request routes ────────────────────────────────────────────
  useEffect(() => {
    if (!requestId) return;
    const findConversation = async () => {
      try {
        const q = query(collection(db, 'conversations'), where('requestId', '==', requestId), where('participants', 'array-contains', currentUser?.uid || ''));
        const snap = await getDocs(q);
        if (!embedded) navigate(snap.empty ? '/messages' : `/messages/${snap.docs[0].id}`, { replace: true });
      } catch {
        if (!embedded) navigate('/messages', { replace: true });
      }
    };
    if (currentUser) findConversation();
  }, [requestId, navigate, currentUser]);

  // ── Load conversation ──────────────────────────────────────────────────────
  useEffect(() => {
    if (!conversationId) return;
    const unsub = onSnapshot(doc(db, 'conversations', conversationId), (snap) => {
      if (!snap.exists()) { if (!embedded) navigate('/messages', { replace: true }); return; }
      setConversation({ id: snap.id, ...snap.data() });
      setLoading(false);
    });
    return unsub;
  }, [conversationId, navigate]);

  // ── Load request details ───────────────────────────────────────────────────
  useEffect(() => {
    if (!conversation?.requestId) return;
    const unsub = onSnapshot(doc(db, 'viewing_requests', conversation.requestId), (snap) => {
      if (snap.exists()) setRequest({ id: snap.id, ...snap.data() });
    });
    return unsub;
  }, [conversation?.requestId]);

  // ── Subscribe messages ─────────────────────────────────────────────────────
  useEffect(() => {
    if (!conversationId || !currentUser) return;
    const unsub = subscribeToMessages(conversationId, currentUser.uid, setMessages);
    markConversationRead(conversationId, currentUser.uid).catch(() => {});
    return unsub;
  }, [conversationId, currentUser]);

  // ── Scroll to bottom ───────────────────────────────────────────────────────
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  async function handleAccept() {
    if (!request || !conversation) return;
    setActioning(true);
    try {
      await acceptViewingRequest({ requestId: request.id, ownerId: request.ownerId, tenantId: request.tenantId, propertyId: request.propertyId, propertyTitle: request.propertyName, propertyImage: request.propertyImage, propertyPrice: request.propertyPrice, conversationId: conversation.id });
      showToast('Request accepted!', 'success');
    } catch {
      showToast('Failed to accept request.', 'error');
    } finally { setActioning(false); }
  }

  async function handleReject() {
    if (!request) return;
    setActioning(true);
    try {
      await rejectViewingRequest(request.id);
      showToast('Request declined.', 'info');
    } catch {
      showToast('Failed to decline request.', 'error');
    } finally { setActioning(false); }
  }

  async function handleSend() {
    if (!input.trim() || !conversationId || !conversation) return;
    setSending(true);
    try {
      const replyData = replyingTo ? { id: replyingTo.id, text: replyingTo.text, senderId: replyingTo.senderId } : null;
      await sendMessage(conversationId, currentUser.uid, input, conversation.participants, replyData);
      setInput('');
      setReplyingTo(null);
    } catch {
      showToast('Failed to send message.', 'error');
    } finally { setSending(false); }
  }

  function toggleMessageSelection(id, forceSelect = false) {
    setSelectedMessages(prev => {
      const newSet = new Set(prev);
      if (forceSelect) newSet.add(id);
      else if (newSet.has(id)) newSet.delete(id);
      else newSet.add(id);
      return newSet;
    });
  }

  function handleReply(msg) {
    setReplyingTo(msg);
  }

  function handleDeletePrompt(id) {
    setShowDeleteConfirm(id);
  }

  async function confirmDelete() {
    if (showDeleteConfirm === 'bulk') {
      await deleteMessagesBulk(conversationId, Array.from(selectedMessages), currentUser.uid);
      setSelectedMessages(new Set());
    } else if (showDeleteConfirm) {
      await deleteMessageForUser(conversationId, showDeleteConfirm, currentUser.uid);
      setSelectedMessages(prev => {
        const newSet = new Set(prev);
        newSet.delete(showDeleteConfirm);
        return newSet;
      });
    }
    setShowDeleteConfirm(null);
    showToast('Message(s) deleted.', 'success');
  }

  function groupMessages(msgs) {
    const groups = [];
    let lastLabel = null;
    for (const msg of msgs) {
      const label = fmtDateLabel(msg.createdAt);
      if (label !== lastLabel) { groups.push({ type: 'label', label, id: `label-${label}` }); lastLabel = label; }
      groups.push({ type: 'message', msg });
    }
    return groups;
  }

  if (loading || requestId) {
    return (
      <motion.div
        initial={{ opacity: 0 }} animate={{ opacity: 1 }}
        className="flex items-center justify-center h-screen"
      >
        <div className="w-8 h-8 border-4 border-[#1a227f] border-t-transparent rounded-full animate-spin" />
      </motion.div>
    );
  }

  if (!conversation) return null;

  const isOwner = request ? request.ownerId === currentUser?.uid : conversation.participants?.[0] === currentUser?.uid;
  const otherId = conversation.participants.find((uid) => uid !== currentUser?.uid);
  const otherInfo = conversation.participantInfo?.[otherId] ?? {};
  const grouped = groupMessages(messages);
  const isLocked = request && request.status !== 'accepted';
  const lockedPlaceholder = request?.status === 'rejected' ? 'Request declined — messaging disabled.' : 'Locked until request is accepted.';

  return (
    <div
      className="flex flex-col bg-slate-50 dark:bg-slate-950"
      style={embedded ? { height: '100%' } : { maxWidth: 600, margin: '0 auto', height: '100dvh' }}
    >
      {/* ── Header (receives shared layoutId elements from Inbox) ─────────── */}
      {selectedMessages.size > 0 ? (
        <motion.div
          key="selection-header"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="sticky top-0 z-50 flex items-center justify-between px-4 py-3 border-b border-slate-100 dark:border-slate-800 bg-[#1a227f] text-white backdrop-blur-md shrink-0 shadow-sm pt-[calc(0.75rem+env(safe-area-inset-top))]"
        >
          <div className="flex items-center gap-3">
            <button onClick={() => setSelectedMessages(new Set())} className="p-2 -ml-2 rounded-xl hover:bg-white/10 transition-colors">
              <X size={18} />
            </button>
            <span className="font-bold">{selectedMessages.size} Selected</span>
          </div>
          <button onClick={() => setShowDeleteConfirm('bulk')} className="p-2 -mr-2 rounded-xl hover:bg-rose-500 hover:text-white text-rose-300 transition-colors">
            <Trash2 size={18} />
          </button>
        </motion.div>
      ) : (
        <motion.div
          variants={headerVariants}
          initial="hidden"
          animate="visible"
          className="sticky top-0 z-50 flex items-center gap-3 px-4 py-3 border-b border-slate-100 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md shrink-0 shadow-sm pt-[calc(0.75rem+env(safe-area-inset-top))]"
        >
          <motion.button
            whileHover={{ scale: 1.1, x: -2 }}
            whileTap={{ scale: 0.9 }}
            onClick={() => embedded ? onClose?.() : navigate('/messages')}
            className="w-9 h-9 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-600 dark:text-slate-300 transition-colors hover:bg-[#1a227f]/10 dark:hover:bg-[#1a227f]/20 hover:text-[#1a227f]"
          >
            <ArrowLeft size={18} />
          </motion.button>

          {/* Avatar & Name (shared layout transition FROM Inbox) */}
          <motion.div
            onClick={() => navigate(`/owner/${otherId}`)}
            className="flex items-center gap-3 flex-1 cursor-pointer min-w-0"
          >
            <motion.div
              layoutId={`avatar-${conversationId}`}
              className="w-10 h-10 rounded-full overflow-hidden shrink-0 shadow-md"
              style={{ background: '#1a227f' }}
            >
              {otherInfo.photo
                ? <img loading="lazy" src={otherInfo.photo} alt="" className="w-full h-full object-cover" />
                : <span className="w-full h-full flex items-center justify-center text-white font-bold">{(otherInfo.name ?? 'U')[0].toUpperCase()}</span>
              }
            </motion.div>
            <div className="min-w-0">
              <motion.p layoutId={`name-${conversationId}`} className="font-black text-sm text-slate-900 dark:text-white truncate">
                {otherInfo.name ?? 'User'}
              </motion.p>
              {conversation.propertyTitle && (
                <p className="text-xs text-[#1a227f] dark:text-indigo-400 truncate">{conversation.propertyTitle}</p>
              )}
            </div>
          </motion.div>

          {otherInfo.phone && (
            <motion.a
              href={`tel:${otherInfo.phone}`}
              whileHover={{ scale: 1.1, rotate: 8 }}
              whileTap={{ scale: 0.9 }}
              className="w-9 h-9 rounded-xl bg-[#1a227f]/10 dark:bg-[#1a227f]/20 flex items-center justify-center text-[#1a227f] dark:text-indigo-400 shadow-sm"
            >
              <Phone size={16} />
            </motion.a>
          )}
        </motion.div>
      )}

      {/* ── Messages area ──────────────────────────────────────────────────── */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-1">
        {/* Request Details Card */}
        {request && (
          <RequestCard
            request={request}
            isOwner={isOwner}
            actioning={actioning}
            onAccept={handleAccept}
            onReject={handleReject}
          />
        )}

        {/* Messages */}
        <AnimatePresence initial={false}>
          {grouped.map((item) => {
            if (item.type === 'label') {
              return (
                <motion.div
                  key={item.id}
                  variants={dateLabelVariants}
                  initial="hidden"
                  animate="visible"
                  className="text-center my-4"
                >
                  <span className="text-[11px] font-semibold text-slate-400 dark:text-slate-500 bg-slate-100 dark:bg-slate-800 px-3 py-1 rounded-full">
                    {item.label}
                  </span>
                </motion.div>
              );
            }

            const { msg } = item;
            const isMine = msg.senderId === currentUser?.uid;

            return (
              <MessageBubble
                key={msg.id}
                msg={msg}
                isMine={isMine}
                currentUid={currentUser?.uid}
                isSelected={selectedMessages.has(msg.id)}
                selectionMode={selectedMessages.size > 0}
                onReply={handleReply}
                onDelete={handleDeletePrompt}
                onToggleSelect={toggleMessageSelection}
              />
            );
          })}
        </AnimatePresence>
        <div ref={bottomRef} />
      </div>

      {/* ── Input bar ──────────────────────────────────────────────────────── */}
      <motion.div
        variants={inputBarVariants}
        initial="hidden"
        animate="visible"
        className={`sticky bottom-0 z-50 flex flex-col shrink-0 pb-[env(safe-area-inset-bottom)] ${isLocked ? 'bg-slate-50 dark:bg-slate-900' : 'bg-white dark:bg-slate-900'} border-t border-slate-100 dark:border-slate-800`}
      >
        <AnimatePresence>
          {replyingTo && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="px-4 py-2 bg-slate-50 dark:bg-slate-800/50 flex items-center justify-between overflow-hidden border-b border-slate-100 dark:border-slate-800"
            >
              <div className="flex items-center gap-2 overflow-hidden">
                <CornerDownRight size={16} className="text-[#1a227f] dark:text-indigo-400 shrink-0" />
                <div className="min-w-0">
                  <p className="text-xs font-bold text-[#1a227f] dark:text-indigo-400">Replying to {replyingTo.senderId === currentUser?.uid ? 'Yourself' : otherInfo.name}</p>
                  <p className="text-xs text-slate-500 truncate">{replyingTo.text}</p>
                </div>
              </div>
              <button onClick={() => setReplyingTo(null)} className="p-1 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors">
                <X size={14} />
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="px-3 py-3 flex items-end gap-2">
          <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
          placeholder={isLocked ? lockedPlaceholder : 'Type a message...'}
          disabled={isLocked}
          rows={1}
          className={`flex-1 px-4 py-2.5 rounded-2xl border text-sm resize-none outline-none font-inherit transition-all ${
            isLocked
              ? 'bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-400 cursor-not-allowed'
              : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-[#1a227f] focus:bg-white dark:focus:bg-slate-700'
          }`}
          style={{ fontFamily: 'inherit' }}
        />
        <motion.button
          variants={sendButtonVariants}
          initial="idle"
          animate={sending ? 'sending' : input.trim() && !isLocked ? 'active' : 'idle'}
          whileTap={{ scale: 0.85 }}
          onClick={handleSend}
          disabled={sending || !input.trim() || isLocked}
          className={`w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 shadow-md transition-colors ${
            sending || !input.trim() || isLocked
              ? 'bg-slate-200 dark:bg-slate-700 text-slate-400'
              : 'bg-[#1a227f] text-white shadow-[#1a227f]/30'
          }`}
        >
          <Send size={18} />
        </motion.button>
        </div>
      </motion.div>

      {/* ── Delete Confirmation Modal ─────────────────────────────────────── */}
      <AnimatePresence>
        {showDeleteConfirm && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center px-4">
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
              onClick={() => setShowDeleteConfirm(null)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative bg-white dark:bg-slate-900 rounded-3xl shadow-2xl p-6 w-full max-w-sm border border-slate-100 dark:border-slate-800"
            >
              <div className="w-12 h-12 rounded-full bg-rose-50 dark:bg-rose-500/10 flex items-center justify-center text-rose-500 mb-4 mx-auto">
                <Trash2 size={24} />
              </div>
              <h3 className="text-xl font-black text-center text-slate-900 dark:text-white mb-2">Delete Message{showDeleteConfirm === 'bulk' ? 's' : ''}?</h3>
              <p className="text-sm text-center text-slate-500 dark:text-slate-400 mb-6">
                This will delete the selected message{showDeleteConfirm === 'bulk' ? 's' : ''} from your account only. This action cannot be undone.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowDeleteConfirm(null)}
                  className="flex-1 py-3 px-4 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold rounded-2xl hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmDelete}
                  className="flex-1 py-3 px-4 bg-rose-500 text-white font-bold rounded-2xl hover:bg-rose-600 shadow-lg shadow-rose-500/30 transition-colors"
                >
                  Delete
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
