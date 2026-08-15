import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { doc, onSnapshot, collection, query, where, getDocs } from 'firebase/firestore';
import { motion, AnimatePresence, useMotionValue, useTransform } from 'framer-motion';
import { db } from '../firebase';
import { useAuth } from '../contexts/AuthContext';
import {
  subscribeToMessages, sendMessage, markConversationRead,
  acceptViewingRequest, rejectViewingRequest,
  deleteMessageForUser, deleteMessagesBulk,
} from '../utils/messageService';
import { cn } from '../lib/cn';
import { Icon } from '../lib/icons';
import {
  Modal, ModalFooter, Card, Badge, Button, IconButton, Avatar, Textarea, Spinner, useToast,
} from '../components/ui';

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

const REQUEST_STATUS = {
  accepted: { tone: 'success', icon: 'check', label: 'Request accepted' },
  rejected: { tone: 'danger', icon: 'close', label: 'Request declined' },
  pending: { tone: 'warning', icon: 'pending', label: 'Awaiting response' },
};

function RequestCard({ request, isOwner, actioning, onAccept, onReject }) {
  const status = REQUEST_STATUS[request.status] || REQUEST_STATUS.pending;
  return (
    <Card variant="raised" padding="md" className="mb-5">
      <p className="mb-3 flex items-center gap-2 text-overline uppercase text-subtle"><Icon name="calendar" className="size-4 text-primary" /> Viewing request</p>
      {request.propertyImage && (
        <div className="mb-3 h-32 overflow-hidden rounded-card">
          <img loading="lazy" src={request.propertyImage} alt="" className="size-full object-cover" />
        </div>
      )}
      {isOwner && request.tenantDetails && (
        <div className="mb-3 space-y-1 rounded-card bg-surface-sunken p-3 text-caption">
          {[['Name', request.tenantDetails.name], ['Phone', request.tenantDetails.phone], ['Profession', request.tenantDetails.profession], ['Occupants', request.tenantDetails.numberOfOccupants], ['Date', request.tenantDetails.preferredDate]]
            .filter(([, v]) => v)
            .map(([label, val]) => (
              <div key={label} className="flex gap-2">
                <span className="w-20 shrink-0 text-subtle">{label}</span>
                <span className="font-medium text-content">{val}</span>
              </div>
            ))}
          {request.tenantDetails.message && (
            <p className="mt-2 border-t border-border pt-2 italic text-muted">“{request.tenantDetails.message}”</p>
          )}
        </div>
      )}
      {request.status === 'pending' && isOwner ? (
        <div className="flex gap-2">
          <Button fullWidth loading={actioning} onClick={onAccept} leftIcon={<Icon name="check" />} className="bg-success text-on-success hover:brightness-105">Accept</Button>
          <Button fullWidth variant="secondary" disabled={actioning} onClick={onReject} leftIcon={<Icon name="close" />} className="text-danger">Decline</Button>
        </div>
      ) : (
        <div className="flex items-center justify-center py-1">
          <Badge tone={status.tone} size="md" icon={<Icon name={status.icon} />}>{status.label}</Badge>
        </div>
      )}
    </Card>
  );
}

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
  const cancelHold = () => { if (holdTimeout.current) clearTimeout(holdTimeout.current); };
  const handleDragEnd = (event, info) => {
    if (info.offset.x > 80) onDelete(msg.id);
    else if (info.offset.x < -80) onReply(msg);
  };

  return (
    <motion.div
      layout
      className={cn('group relative mb-2 flex w-full items-center', selectionMode && 'pl-8')}
      onPointerDown={handlePointerDown}
      onPointerUp={cancelHold}
      onPointerMove={cancelHold}
      onPointerLeave={cancelHold}
    >
      {selectionMode && (
        <div className="absolute left-0 flex h-full w-8 cursor-pointer items-center justify-center" onClick={() => onToggleSelect(msg.id)}>
          <span className={cn('grid size-5 place-items-center rounded-full border-2 transition-colors', isSelected ? 'border-primary bg-primary text-on-primary' : 'border-border-strong')}>
            {isSelected && <Icon name="check" className="size-3" strokeWidth={3} />}
          </span>
        </div>
      )}

      {/* Swipe hint backgrounds */}
      <div className="pointer-events-none absolute inset-0 flex items-center justify-between overflow-hidden rounded-card px-4">
        <motion.span style={{ opacity: opacityLeft }} className="text-danger"><Icon name="delete" className="size-[18px]" /></motion.span>
        <motion.span style={{ opacity: opacityRight }} className="text-primary"><Icon name="reply" className="size-[18px]" /></motion.span>
      </div>

      {/* Desktop hover actions */}
      {!selectionMode && (
        <div className={cn('absolute top-0 hidden gap-1 opacity-0 transition-opacity group-hover:opacity-100 md:flex', isMine ? 'right-full pr-2' : 'left-full pl-2')}>
          <IconButton label="Reply" size="sm" variant="surface" onClick={() => onReply(msg)}><Icon name="reply" /></IconButton>
          <IconButton label="Delete" size="sm" variant="surface" onClick={() => onDelete(msg.id)}><Icon name="delete" /></IconButton>
          <IconButton label="Select" size="sm" variant="surface" onClick={() => onToggleSelect(msg.id, true)}><Icon name="check" /></IconButton>
        </div>
      )}

      {/* Draggable bubble */}
      <motion.div
        className={cn('flex flex-1 flex-col', isMine ? 'items-end' : 'items-start')}
        drag="x" dragConstraints={{ left: 0, right: 0 }} dragElastic={0.2} onDragEnd={handleDragEnd} style={{ x }}
      >
        <div className={cn('relative max-w-[85%] px-4 py-2.5 shadow-card sm:max-w-[75%]',
          isMine ? 'rounded-2xl rounded-br-md bg-primary text-on-primary' : 'rounded-2xl rounded-bl-md border border-border bg-surface-raised text-content',
          isSelected && 'scale-[0.98] opacity-90 ring-2 ring-ring')}>
          {msg.replyTo && (
            <div className={cn('mb-2 border-l-2 pl-2 text-caption opacity-80', isMine ? 'border-white/50' : 'border-primary/50')}>
              <p className="truncate font-semibold">{msg.replyTo.senderId === currentUid ? 'You' : 'Them'}</p>
              <p className="line-clamp-2 truncate opacity-90">{msg.replyTo.text}</p>
            </div>
          )}
          <p className="text-body-sm leading-relaxed">{msg.text}</p>
          <div className={cn('mt-1 flex items-center gap-1 text-[0.625rem]', isMine ? 'justify-end text-white/70' : 'text-subtle')}>
            {fmtTime(msg.createdAt)}
            {isMine && <Icon name="checkCheck" className="size-3" />}
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

export default function ConversationDetail({ embedded = false, conversationId: propConvId, onClose }) {
  const params = useParams();
  const conversationId = propConvId || params.conversationId;
  const requestId = params.requestId;
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const toast = useToast();

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

  // ── Redirect old request routes ──
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
    // deps preserved verbatim (embedded is stable per mount)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [requestId, navigate, currentUser]);

  // ── Load conversation ──
  useEffect(() => {
    if (!conversationId) return;
    const unsub = onSnapshot(doc(db, 'conversations', conversationId), (snap) => {
      if (!snap.exists()) { if (!embedded) navigate('/messages', { replace: true }); return; }
      setConversation({ id: snap.id, ...snap.data() });
      setLoading(false);
    });
    return unsub;
    // deps preserved verbatim
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [conversationId, navigate]);

  // ── Load request details ──
  useEffect(() => {
    if (!conversation?.requestId) return;
    const unsub = onSnapshot(doc(db, 'viewing_requests', conversation.requestId), (snap) => {
      if (snap.exists()) setRequest({ id: snap.id, ...snap.data() });
    });
    return unsub;
  }, [conversation?.requestId]);

  // ── Subscribe messages ──
  useEffect(() => {
    if (!conversationId || !currentUser) return;
    const unsub = subscribeToMessages(conversationId, currentUser.uid, setMessages);
    markConversationRead(conversationId, currentUser.uid).catch(() => {});
    return unsub;
  }, [conversationId, currentUser]);

  // ── Scroll to bottom ──
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  async function handleAccept() {
    if (!request || !conversation) return;
    setActioning(true);
    try {
      await acceptViewingRequest({ requestId: request.id, ownerId: request.ownerId, tenantId: request.tenantId, propertyId: request.propertyId, propertyTitle: request.propertyName, propertyImage: request.propertyImage, propertyPrice: request.propertyPrice, conversationId: conversation.id });
      toast.success('Request accepted!');
    } catch {
      toast.error('Failed to accept request.');
    } finally { setActioning(false); }
  }

  async function handleReject() {
    if (!request) return;
    setActioning(true);
    try {
      await rejectViewingRequest(request.id);
      toast.info('Request declined.');
    } catch {
      toast.error('Failed to decline request.');
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
      toast.error('Failed to send message.');
    } finally { setSending(false); }
  }

  function toggleMessageSelection(id, forceSelect = false) {
    setSelectedMessages((prev) => {
      const newSet = new Set(prev);
      if (forceSelect) newSet.add(id);
      else if (newSet.has(id)) newSet.delete(id);
      else newSet.add(id);
      return newSet;
    });
  }
  function handleReply(msg) { setReplyingTo(msg); }
  function handleDeletePrompt(id) { setShowDeleteConfirm(id); }

  async function confirmDelete() {
    if (showDeleteConfirm === 'bulk') {
      await deleteMessagesBulk(conversationId, Array.from(selectedMessages), currentUser.uid);
      setSelectedMessages(new Set());
    } else if (showDeleteConfirm) {
      await deleteMessageForUser(conversationId, showDeleteConfirm, currentUser.uid);
      setSelectedMessages((prev) => { const s = new Set(prev); s.delete(showDeleteConfirm); return s; });
    }
    setShowDeleteConfirm(null);
    toast.success('Message(s) deleted.');
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
    return <div className="flex h-screen items-center justify-center"><Spinner size="lg" className="text-primary" /></div>;
  }
  if (!conversation) return null;

  const isOwner = request ? request.ownerId === currentUser?.uid : conversation.participants?.[0] === currentUser?.uid;
  const otherId = conversation.participants.find((uid) => uid !== currentUser?.uid);
  const otherInfo = conversation.participantInfo?.[otherId] ?? {};
  const grouped = groupMessages(messages);
  const isLocked = request && request.status !== 'accepted';
  const lockedPlaceholder = request?.status === 'rejected' ? 'Request declined — messaging disabled.' : 'Locked until request is accepted.';

  return (
    <div className="flex flex-col bg-bg" style={embedded ? { height: '100%' } : { maxWidth: 640, margin: '0 auto', height: '100dvh' }}>
      {/* Header */}
      {selectedMessages.size > 0 ? (
        <div className="sticky top-0 z-40 flex shrink-0 items-center justify-between border-b border-border bg-primary px-4 py-3 text-on-primary pt-[calc(0.75rem+env(safe-area-inset-top))]">
          <div className="flex items-center gap-3">
            <IconButton label="Clear selection" variant="ghost" size="sm" onClick={() => setSelectedMessages(new Set())} className="-ml-2 text-on-primary hover:bg-white/10"><Icon name="close" /></IconButton>
            <span className="text-body-sm font-semibold">{selectedMessages.size} selected</span>
          </div>
          <IconButton label="Delete selected" variant="ghost" size="sm" onClick={() => setShowDeleteConfirm('bulk')} className="-mr-2 text-on-primary hover:bg-white/10"><Icon name="delete" /></IconButton>
        </div>
      ) : (
        <div className="sticky top-0 z-40 flex shrink-0 items-center gap-3 border-b border-border surface-blur px-4 py-3 pt-[calc(0.75rem+env(safe-area-inset-top))]">
          <IconButton label="Back" variant="surface" size="sm" onClick={() => (embedded ? onClose?.() : navigate('/messages'))}><Icon name="back" /></IconButton>
          <Button variant="ghost" onClick={() => navigate(`/owner/${otherId}`)} className="h-auto min-w-0 flex-1 justify-start gap-3 px-2 py-1">
            <Avatar src={otherInfo.photo} name={otherInfo.name || 'User'} size="md" />
            <span className="flex min-w-0 flex-col text-left">
              <span className="truncate text-title-sm text-content">{otherInfo.name ?? 'User'}</span>
              {conversation.propertyTitle && <span className="truncate text-caption text-primary">{conversation.propertyTitle}</span>}
            </span>
          </Button>
          {otherInfo.phone && (
            <IconButton as="a" href={`tel:${otherInfo.phone}`} label="Call" variant="soft"><Icon name="phone" /></IconButton>
          )}
        </div>
      )}

      {/* Messages */}
      <div className="flex-1 space-y-1 overflow-y-auto px-4 py-4">
        {request && <RequestCard request={request} isOwner={isOwner} actioning={actioning} onAccept={handleAccept} onReject={handleReject} />}
        <AnimatePresence initial={false}>
          {grouped.map((item) => {
            if (item.type === 'label') {
              return (
                <div key={item.id} className="my-4 text-center">
                  <span className="rounded-pill bg-surface-sunken px-3 py-1 text-caption font-medium text-subtle">{item.label}</span>
                </div>
              );
            }
            const { msg } = item;
            return (
              <MessageBubble
                key={msg.id} msg={msg} isMine={msg.senderId === currentUser?.uid} currentUid={currentUser?.uid}
                isSelected={selectedMessages.has(msg.id)} selectionMode={selectedMessages.size > 0}
                onReply={handleReply} onDelete={handleDeletePrompt} onToggleSelect={toggleMessageSelection}
              />
            );
          })}
        </AnimatePresence>
        <div ref={bottomRef} />
      </div>

      {/* Composer */}
      <div className="sticky bottom-0 z-40 flex shrink-0 flex-col border-t border-border bg-surface pb-[max(env(safe-area-inset-bottom),1rem)]">
        <AnimatePresence>
          {replyingTo && (
            <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}
              className="flex items-center justify-between overflow-hidden border-b border-border bg-surface-sunken px-4 py-2">
              <div className="flex min-w-0 items-center gap-2">
                <Icon name="reply" className="size-4 shrink-0 text-primary" />
                <div className="min-w-0">
                  <p className="text-caption font-semibold text-primary">Replying to {replyingTo.senderId === currentUser?.uid ? 'yourself' : otherInfo.name}</p>
                  <p className="truncate text-caption text-muted">{replyingTo.text}</p>
                </div>
              </div>
              <IconButton label="Cancel reply" size="sm" variant="ghost" onClick={() => setReplyingTo(null)}><Icon name="close" /></IconButton>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="flex items-end gap-2 px-3 py-3">
          <Textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
            placeholder={isLocked ? lockedPlaceholder : 'Type a message…'}
            disabled={isLocked}
            rows={1}
            className="min-h-0 flex-1 resize-none rounded-2xl py-2.5"
          />
          <IconButton label="Send message" variant="primary" size="lg" shape="control" disabled={sending || !input.trim() || isLocked} loading={sending} onClick={handleSend}>
            <Icon name="send" />
          </IconButton>
        </div>
      </div>

      {/* Delete confirm */}
      <Modal
        open={!!showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(null)}
        title={`Delete message${showDeleteConfirm === 'bulk' ? 's' : ''}?`}
        description={`This deletes the selected message${showDeleteConfirm === 'bulk' ? 's' : ''} from your account only. This can’t be undone.`}
        size="sm"
      >
        <ModalFooter>
          <Button variant="ghost" onClick={() => setShowDeleteConfirm(null)}>Cancel</Button>
          <Button variant="danger" onClick={confirmDelete} leftIcon={<Icon name="delete" />}>Delete</Button>
        </ModalFooter>
      </Modal>
    </div>
  );
}
