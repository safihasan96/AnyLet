import { useState, useEffect, useRef, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate, useParams } from 'react-router-dom';
import { subscribeToConversations, getOtherParticipantId, archiveConversations, deleteConversations } from '../utils/messageService';
import {
  motion, AnimatePresence, useMotionValue, useTransform, useSpring,
  useReducedMotion,
} from 'framer-motion';
import { MessageSquare, Search, PenSquare, MoreVertical, CheckSquare, Archive, Trash2, X, ChevronLeft } from 'lucide-react';

// ─────────────────────────────────────────────────────────────────────────────
//  All animation variants — ZERO inline objects in JSX
// ─────────────────────────────────────────────────────────────────────────────
const sidebarVariants = {
  hidden: { opacity: 0, x: -32 },
  visible: {
    opacity: 1, x: 0,
    transition: { type: 'spring', stiffness: 90, damping: 20 },
  },
};

const searchVariants = {
  hidden: { opacity: 0, scaleX: 0.9 },
  visible: {
    opacity: 1, scaleX: 1,
    transition: { type: 'spring', stiffness: 120, damping: 20, delay: 0.08 },
  },
};

const listContainerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.06, delayChildren: 0.1 },
  },
};

const rowVariants = {
  hidden: { opacity: 0, x: -20 },
  visible: {
    opacity: 1, x: 0,
    transition: { type: 'spring', stiffness: 200, damping: 24 },
  },
  exit: {
    opacity: 0, x: -16,
    transition: { duration: 0.18 },
  },
};

const emptyVariants = {
  hidden: { opacity: 0, scale: 0.88 },
  visible: {
    opacity: 1, scale: 1,
    transition: { type: 'spring', stiffness: 140, damping: 22, delay: 0.15 },
  },
};

const skeletonVariants = {
  hidden: { opacity: 0 },
  visible: (i) => ({ opacity: 1, transition: { delay: i * 0.07 } }),
};

const panelVariants = {
  hidden: { opacity: 0, x: 24 },
  visible: {
    opacity: 1, x: 0,
    transition: { type: 'spring', stiffness: 100, damping: 22 },
  },
  exit: {
    opacity: 0, x: 24,
    transition: { duration: 0.2 },
  },
};

const noChatVariants = {
  hidden: { opacity: 0, scale: 0.9 },
  visible: {
    opacity: 1, scale: 1,
    transition: { type: 'spring', stiffness: 120, damping: 20, delay: 0.2 },
  },
};

const dropdownVariants = {
  hidden: { opacity: 0, scale: 0.95, y: -4 },
  visible: { opacity: 1, scale: 1, y: 0, transition: { type: 'spring', stiffness: 300, damping: 25 } },
  exit: { opacity: 0, scale: 0.95, y: -4, transition: { duration: 0.15 } }
};

const actionBarVariants = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 200, damping: 22 } },
  exit: { opacity: 0, y: 30, transition: { duration: 0.2 } }
};

const checkboxVariants = {
  hidden: { opacity: 0, scale: 0.5, width: 0, marginRight: 0 },
  visible: { opacity: 1, scale: 1, width: 20, marginRight: 12, transition: { type: 'spring', stiffness: 300, damping: 25 } },
  exit: { opacity: 0, scale: 0.5, width: 0, marginRight: 0, transition: { duration: 0.2 } }
};

// ─────────────────────────────────────────────────────────────────────────────
//  Relative timestamp helper
// ─────────────────────────────────────────────────────────────────────────────
function timeAgo(ts) {
  if (!ts) return '';
  const date = ts.toDate ? ts.toDate() : new Date(ts);
  const diff = Date.now() - date.getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days}d`;
  return date.toLocaleDateString();
}

// ─────────────────────────────────────────────────────────────────────────────
//  3D Tilt wrapper
// ─────────────────────────────────────────────────────────────────────────────
function TiltCard({ children, onClick, isActive, className }) {
  const ref = useRef(null);
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const shouldReduce = useReducedMotion();

  const rotateX = useTransform(y, [-0.5, 0.5], [3, -3]);
  const rotateY = useTransform(x, [-0.5, 0.5], [-5, 5]);
  const sRotateX = useSpring(rotateX, { stiffness: 400, damping: 30 });
  const sRotateY = useSpring(rotateY, { stiffness: 400, damping: 30 });

  function handleMouseMove(e) {
    if (shouldReduce) return;
    const rect = ref.current.getBoundingClientRect();
    x.set((e.clientX - rect.left) / rect.width - 0.5);
    y.set((e.clientY - rect.top) / rect.height - 0.5);
  }
  function handleMouseLeave() { x.set(0); y.set(0); }

  return (
    <motion.div
      ref={ref}
      variants={rowVariants}
      onClick={onClick}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      whileTap={{ scale: 0.98 }}
      style={{
        rotateX: shouldReduce ? 0 : sRotateX,
        rotateY: shouldReduce ? 0 : sRotateY,
        perspective: 800,
        transformStyle: 'preserve-3d',
        willChange: 'transform',
      }}
      className={`cursor-pointer ${className || ''}`}
    >
      {children}
    </motion.div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
//  Skeleton loader row
// ─────────────────────────────────────────────────────────────────────────────
function SkeletonRow({ index }) {
  return (
    <motion.div
      custom={index}
      variants={skeletonVariants}
      initial="hidden"
      animate="visible"
      className="flex items-center gap-3 px-4 py-3 animate-pulse"
    >
      <div className="w-11 h-11 rounded-full bg-slate-200 dark:bg-slate-700 shrink-0" />
      <div className="flex-1 space-y-2">
        <div className="h-3 bg-slate-200 dark:bg-slate-700 rounded-full w-2/5" />
        <div className="h-2.5 bg-slate-200 dark:bg-slate-700 rounded-full w-3/4" />
      </div>
    </motion.div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
//  Single conversation row
// ─────────────────────────────────────────────────────────────────────────────
function ConvRow({ conv, currentUid, onClick, isActive, isSelectMode, isSelected }) {
  const otherId = getOtherParticipantId(conv.participants, currentUid);
  const other = conv.participantInfo?.[otherId] ?? {};
  const unread = conv.unreadCount?.[currentUid] ?? 0;

  return (
    <TiltCard onClick={onClick} isActive={isActive}>
      <div
        className={`flex items-center gap-3 px-4 py-3 mx-2 rounded-2xl transition-all duration-200 ${
          isActive
            ? 'bg-[#1a227f] shadow-lg shadow-[#1a227f]/25'
            : isSelected
              ? 'bg-[#1a227f]/10 dark:bg-[#1a227f]/20 shadow-inner'
              : 'hover:bg-slate-100 dark:hover:bg-slate-700/50'
        }`}
      >
        <AnimatePresence>
          {isSelectMode && (
            <motion.div
              variants={checkboxVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              className="flex items-center shrink-0 overflow-hidden"
            >
              <div className={`w-5 h-5 rounded-md border flex items-center justify-center transition-colors ${
                isSelected ? 'bg-[#1a227f] border-[#1a227f]' : 'border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800'
              }`}>
                {isSelected && <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }}><CheckSquare size={14} className="text-white" /></motion.div>}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Avatar */}
        <div className="relative shrink-0">
          <motion.div
            layoutId={`avatar-${conv.id}`}
            className="w-11 h-11 rounded-full overflow-hidden flex items-center justify-center shadow-sm"
            style={{ background: '#1a227f' }}
          >
            {other.photo
              ? <img loading="lazy" src={other.photo} alt="" className="w-full h-full object-cover" />
              : <span className="text-white font-bold">{(other.name ?? 'U')[0].toUpperCase()}</span>
            }
          </motion.div>
          {unread > 0 && !isSelectMode && (
            <motion.span
              initial={{ scale: 0 }} animate={{ scale: 1 }}
              transition={{ type: 'spring', stiffness: 500, damping: 20 }}
              className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] rounded-full bg-rose-500 text-white text-[9px] font-black flex items-center justify-center px-1 shadow"
            >
              {unread > 99 ? '99+' : unread}
            </motion.span>
          )}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex justify-between items-baseline gap-2">
            <span className={`text-[14px] font-bold truncate ${
              isActive ? 'text-white' : unread > 0 ? 'text-slate-900 dark:text-white' : 'text-slate-700 dark:text-slate-300'
            }`}>
              {other.name ?? 'User'}
            </span>
            <span className={`text-[10px] shrink-0 ${isActive ? 'text-indigo-200' : 'text-slate-400'}`}>
              {timeAgo(conv.lastMessageAt)}
            </span>
          </div>
          <p className={`text-[12px] mt-0.5 truncate ${
            isActive ? 'text-indigo-200' : unread > 0 ? 'font-semibold text-slate-700 dark:text-slate-200' : 'text-slate-500 dark:text-slate-400'
          }`}>
            {conv.propertyTitle && !isActive && (
              <span className="text-[#1a227f] dark:text-indigo-400 font-semibold">{conv.propertyTitle} · </span>
            )}
            {conv.lastMessage || 'No messages yet'}
          </p>
        </div>

        {unread > 0 && !isActive && !isSelectMode && (
          <span className="w-2 h-2 rounded-full bg-[#1a227f] shrink-0" />
        )}
      </div>
    </TiltCard>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
//  Lazy-loaded ConversationPanel (desktop side panel)
// ─────────────────────────────────────────────────────────────────────────────
import('../pages/ConversationDetail').then(() => {}); // hint bundler

function ConversationPanel({ conversationId, onClose }) {
  const [Panel, setPanel] = useState(null);

  useEffect(() => {
    import('../pages/ConversationDetail').then((mod) => setPanel(() => mod.default));
  }, []);

  if (!Panel) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-[#1a227f] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return <Panel embedded onClose={onClose} conversationId={conversationId} />;
}

// ─────────────────────────────────────────────────────────────────────────────
//  Main Inbox component
// ─────────────────────────────────────────────────────────────────────────────
export default function Inbox() {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const { conversationId: paramConvId } = useParams();

  const [conversations, setConversations] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [activeConvId, setActiveConvId] = useState(paramConvId || null);
  const [isDesktop, setIsDesktop] = useState(() => window.innerWidth >= 768);
  
  // Selection & View State
  const [viewMode, setViewMode] = useState('recent'); // 'recent' | 'archived'
  const [isSelectMode, setIsSelectMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef();

  useEffect(() => {
    const check = () => setIsDesktop(window.innerWidth >= 768);
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  useEffect(() => {
    if (!currentUser) return;
    const unsub = subscribeToConversations(currentUser.uid, (convs) => {
      setConversations(convs);
      setLoading(false);
    });
    return unsub;
  }, [currentUser]);

  // Click outside menu handler
  useEffect(() => {
    function handleClickOutside(event) {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Sync URL → activeConvId (handles direct URL navigation)
  useEffect(() => {
    if (paramConvId) setActiveConvId(paramConvId);
  }, [paramConvId]);

  const handleSelectConv = useCallback((convId) => {
    if (isSelectMode) {
      setSelectedIds(prev => {
        const next = new Set(prev);
        if (next.has(convId)) next.delete(convId);
        else next.add(convId);
        return next;
      });
      return;
    }

    setActiveConvId(convId);
    if (!isDesktop) {
      navigate(`/messages/${convId}`);
    } else {
      window.history.replaceState(null, '', `/messages/${convId}`);
    }
  }, [isDesktop, navigate, isSelectMode]);

  const handleArchiveSelected = async () => {
    if (selectedIds.size === 0) return;
    await archiveConversations(Array.from(selectedIds), currentUser.uid);
    setIsSelectMode(false);
    setSelectedIds(new Set());
    if (selectedIds.has(activeConvId)) {
        setActiveConvId(null);
        window.history.replaceState(null, '', '/messages');
    }
  };

  const handleDeleteSelected = async () => {
    if (selectedIds.size === 0) return;
    if (!window.confirm('Are you sure you want to delete these conversations?')) return;
    await deleteConversations(Array.from(selectedIds), currentUser.uid);
    setIsSelectMode(false);
    setSelectedIds(new Set());
    if (selectedIds.has(activeConvId)) {
        setActiveConvId(null);
        window.history.replaceState(null, '', '/messages');
    }
  };

  const filtered = conversations.filter((c) => {
    const isDeleted = c.deletedBy?.includes(currentUser.uid);
    if (isDeleted) return false;

    const isArchived = c.archivedBy?.includes(currentUser.uid);
    if (viewMode === 'recent' && isArchived) return false;
    if (viewMode === 'archived' && !isArchived) return false;

    if (search) {
      const s = search.toLowerCase();
      const matchInfo = JSON.stringify(c.participantInfo ?? {}).toLowerCase().includes(s);
      const matchTitle = (c.propertyTitle ?? '').toLowerCase().includes(s);
      return matchInfo || matchTitle;
    }
    return true;
  });

  // ── Mobile: just show the list (detail navigates to /messages/:id) ─────────
  // ── Desktop: 2-column split layout ────────────────────────────────────────

  const sidebarContent = (
    <motion.div
      variants={sidebarVariants}
      initial="hidden"
      animate="visible"
      className={`flex flex-col ${isDesktop ? 'w-[320px] border-r border-slate-100 dark:border-slate-800 shrink-0' : 'w-full'} h-full relative`}
    >
      {/* Sidebar header - Desktop Only */}
      <div className="hidden md:flex px-5 pt-5 pb-3 items-center justify-between shrink-0 relative z-10">
        <div className="flex items-center gap-2.5">
          {viewMode === 'archived' ? (
            <motion.button
              initial={{ scale: 0 }} animate={{ scale: 1 }}
              whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}
              onClick={() => { setViewMode('recent'); setIsSelectMode(false); }}
              className="w-9 h-9 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
            >
              <ChevronLeft size={18} className="text-slate-600 dark:text-slate-300" />
            </motion.button>
          ) : (
            <div className="w-9 h-9 rounded-xl bg-[#1a227f] flex items-center justify-center shadow-md shadow-[#1a227f]/30">
              <MessageSquare size={18} className="text-white" />
            </div>
          )}
          <div>
            <h1 className="text-[17px] font-black text-slate-900 dark:text-white tracking-tight">
              {viewMode === 'archived' ? 'Archived' : 'Messages'}
            </h1>
            {!loading && (
              <p className="text-[11px] text-slate-400">
                {filtered.length} conversation{filtered.length !== 1 ? 's' : ''}
              </p>
            )}
          </div>
        </div>
        
        <div className="flex items-center gap-1 relative" ref={menuRef}>
          <motion.button
            whileHover={{ scale: 1.08 }} whileTap={{ scale: 0.92 }}
            onClick={() => setMenuOpen(!menuOpen)}
            className="w-9 h-9 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-500 hover:text-[#1a227f] hover:bg-[#1a227f]/10 transition-colors"
            aria-label="Options"
          >
            <MoreVertical size={16} />
          </motion.button>

          <AnimatePresence>
            {menuOpen && (
              <motion.div
                variants={dropdownVariants}
                initial="hidden"
                animate="visible"
                exit="exit"
                className="absolute right-0 top-11 w-44 bg-white dark:bg-slate-800 rounded-2xl shadow-xl border border-slate-100 dark:border-slate-700 overflow-hidden z-50 origin-top-right"
              >
                <div className="p-1.5 flex flex-col gap-0.5">
                  <button
                    onClick={() => {
                      setIsSelectMode(!isSelectMode);
                      setSelectedIds(new Set());
                      setMenuOpen(false);
                    }}
                    className="flex items-center gap-2.5 w-full text-left px-3 py-2.5 text-sm font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700/50 rounded-xl transition-colors"
                  >
                    <CheckSquare size={16} className="text-[#1a227f] dark:text-indigo-400" />
                    {isSelectMode ? 'Cancel Select' : 'Mark'}
                  </button>
                  {viewMode === 'recent' && (
                    <button
                      onClick={() => {
                        setViewMode('archived');
                        setIsSelectMode(false);
                        setMenuOpen(false);
                      }}
                      className="flex items-center gap-2.5 w-full text-left px-3 py-2.5 text-sm font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700/50 rounded-xl transition-colors"
                    >
                      <Archive size={16} className="text-slate-400" />
                      Archive List
                    </button>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Search and Mobile Actions */}
      <motion.div variants={searchVariants} className="px-4 pb-3 md:pt-0 shrink-0 relative z-0 flex items-center gap-2" style={{ paddingTop: 'calc(1rem + env(safe-area-inset-top))' }}>
        {/* Mobile Archived Back Button */}
        {!isDesktop && viewMode === 'archived' && (
          <motion.button
            initial={{ scale: 0 }} animate={{ scale: 1 }}
            whileTap={{ scale: 0.9 }}
            onClick={() => { setViewMode('recent'); setIsSelectMode(false); }}
            className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center shrink-0 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
          >
            <ChevronLeft size={18} className="text-slate-600 dark:text-slate-300" />
          </motion.button>
        )}

        <div className="relative flex-1">
          <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search conversations..."
            disabled={isSelectMode}
            className={`w-full pl-9 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-[13px] text-slate-900 dark:text-white placeholder:text-slate-400 outline-none focus:ring-2 focus:ring-[#1a227f] focus:bg-white dark:focus:bg-slate-700 transition-all ${isSelectMode ? 'opacity-50' : ''}`}
          />
        </div>

        {/* Mobile Options Menu */}
        {!isDesktop && (
          <div className="relative shrink-0 flex items-center" ref={menuRef}>
            <motion.button
              whileTap={{ scale: 0.92 }}
              onClick={() => setMenuOpen(!menuOpen)}
              className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-500 hover:text-[#1a227f] hover:bg-[#1a227f]/10 transition-colors"
              aria-label="Options"
            >
              <MoreVertical size={16} />
            </motion.button>

            <AnimatePresence>
              {menuOpen && (
                <motion.div
                  variants={dropdownVariants}
                  initial="hidden"
                  animate="visible"
                  exit="exit"
                  className="absolute right-0 top-12 w-44 bg-white dark:bg-slate-800 rounded-2xl shadow-xl border border-slate-100 dark:border-slate-700 overflow-hidden z-50 origin-top-right"
                >
                  <div className="p-1.5 flex flex-col gap-0.5">
                    <button
                      onClick={() => {
                        setIsSelectMode(!isSelectMode);
                        setSelectedIds(new Set());
                        setMenuOpen(false);
                      }}
                      className="flex items-center gap-2.5 w-full text-left px-3 py-2.5 text-sm font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700/50 rounded-xl transition-colors"
                    >
                      <CheckSquare size={16} className="text-[#1a227f] dark:text-indigo-400" />
                      {isSelectMode ? 'Cancel Select' : 'Mark'}
                    </button>
                    {viewMode === 'recent' && (
                      <button
                        onClick={() => {
                          setViewMode('archived');
                          setIsSelectMode(false);
                          setMenuOpen(false);
                        }}
                        className="flex items-center gap-2.5 w-full text-left px-3 py-2.5 text-sm font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700/50 rounded-xl transition-colors"
                      >
                        <Archive size={16} className="text-slate-400" />
                        Archive List
                      </button>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}
      </motion.div>

      {/* Conversation list */}
      <div className="flex-1 overflow-y-auto pb-20 space-y-0.5 relative z-0">
        {loading ? (
          <div>
            {[0, 1, 2, 3].map((i) => <SkeletonRow key={i} index={i} />)}
          </div>
        ) : (
          <>
            <motion.div
              variants={listContainerVariants}
              initial="hidden"
              animate="visible"
            >
              <AnimatePresence mode="popLayout">
                {filtered.map((conv) => (
                  <ConvRow
                    key={conv.id}
                    conv={conv}
                    currentUid={currentUser.uid}
                    onClick={() => handleSelectConv(conv.id)}
                    isActive={activeConvId === conv.id && isDesktop && !isSelectMode}
                    isSelectMode={isSelectMode}
                    isSelected={selectedIds.has(conv.id)}
                  />
                ))}
              </AnimatePresence>
            </motion.div>

            {filtered.length === 0 && (
              <motion.div
                variants={emptyVariants}
                initial="hidden"
                animate="visible"
                className="flex flex-col items-center gap-3 pt-16 text-center px-6"
              >
                <motion.div
                  className="w-16 h-16 rounded-2xl bg-slate-50 dark:bg-slate-800/40 flex items-center justify-center"
                  animate={{ y: [0, -7, 0] }}
                  transition={{ repeat: Infinity, duration: 3, ease: 'easeInOut' }}
                >
                  {viewMode === 'archived' ? <Archive size={28} className="text-slate-400" /> : <MessageSquare size={28} className="text-slate-400" />}
                </motion.div>
                <p className="font-black text-sm text-slate-900 dark:text-white">
                  {viewMode === 'archived' ? 'No archived messages' : 'No messages yet'}
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                  {viewMode === 'archived' ? 'Archived conversations will appear here.' : 'Browse properties and send a viewing request to start chatting.'}
                </p>
              </motion.div>
            )}
          </>
        )}
      </div>

      {/* Multi-Select Action Bar */}
      <AnimatePresence>
        {isSelectMode && (
          <motion.div
            variants={actionBarVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            className="absolute bottom-0 left-0 right-0 p-4 bg-[#F8F9FA]/90 dark:bg-[#0F1117]/90 backdrop-blur-md border-t border-slate-200 dark:border-slate-800 z-20 flex items-center justify-between shadow-2xl"
          >
            <span className="text-sm font-bold text-slate-700 dark:text-slate-200">
              {selectedIds.size} selected
            </span>
            <div className="flex gap-2">
              {viewMode === 'recent' && (
                <button
                  onClick={handleArchiveSelected}
                  disabled={selectedIds.size === 0}
                  className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-600 dark:text-slate-300 hover:bg-[#1a227f] hover:text-white disabled:opacity-50 disabled:hover:bg-slate-100 disabled:hover:text-slate-600 transition-colors"
                >
                  <Archive size={16} />
                </button>
              )}
              <button
                onClick={handleDeleteSelected}
                disabled={selectedIds.size === 0}
                className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-rose-500 hover:bg-rose-500 hover:text-white disabled:opacity-50 disabled:hover:bg-slate-100 disabled:hover:text-rose-500 transition-colors"
              >
                <Trash2 size={16} />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );

  // ── MOBILE layout ────────────────────────────────────────────────────────
  if (!isDesktop) {
    return (
      <div className="min-h-screen bg-[#F8F9FA] dark:bg-[#0F1117] pb-24">
        {sidebarContent}
      </div>
    );
  }

  // ── DESKTOP 2-column layout ───────────────────────────────────────────────
  return (
    <div
      className="flex bg-[#F8F9FA] dark:bg-[#0F1117]"
      style={{ height: 'calc(100dvh - 64px)' }}
    >
      {/* Left sidebar */}
      {sidebarContent}

      {/* Right chat panel */}
      <div className="flex-1 flex flex-col overflow-hidden relative z-0">
        <AnimatePresence mode="wait">
          {activeConvId ? (
            <motion.div
              key={activeConvId}
              variants={panelVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              className="flex-1 flex flex-col overflow-hidden"
              style={{ willChange: 'transform, opacity' }}
            >
              <ConversationPanel
                conversationId={activeConvId}
                onClose={() => {
                  setActiveConvId(null);
                  window.history.replaceState(null, '', '/messages');
                }}
              />
            </motion.div>
          ) : (
            <motion.div
              key="no-chat"
              variants={noChatVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              className="flex-1 flex flex-col items-center justify-center gap-4 text-center px-12"
            >
              <motion.div
                className="w-20 h-20 rounded-3xl bg-gradient-to-br from-[#1a227f]/10 to-[#1a227f]/5 dark:from-[#1a227f]/40 dark:to-[#1a227f]/10 flex items-center justify-center shadow-xl shadow-[#1a227f]/10"
                animate={{ y: [0, -10, 0], rotate: [0, 3, -3, 0] }}
                transition={{ repeat: Infinity, duration: 5, ease: 'easeInOut' }}
              >
                <MessageSquare size={36} className="text-[#1a227f]" />
              </motion.div>
              <div>
                <h2 className="font-black text-xl text-slate-900 dark:text-white mb-2">
                  Select a conversation
                </h2>
                <p className="text-sm text-slate-500 dark:text-slate-400 max-w-xs leading-relaxed">
                  Choose a conversation from the list to start messaging.
                </p>
              </div>
              <div className="flex gap-1.5 mt-1">
                {[0, 1, 2].map((i) => (
                  <motion.div
                    key={i}
                    className="w-1.5 h-1.5 rounded-full bg-[#1a227f]/40"
                    animate={{ scale: [1, 1.4, 1], opacity: [0.5, 1, 0.5] }}
                    transition={{ repeat: Infinity, duration: 1.4, delay: i * 0.2 }}
                  />
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
