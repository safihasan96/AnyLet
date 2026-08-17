import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate, useParams } from 'react-router-dom';
import { subscribeToConversations, getOtherParticipantId, archiveConversations, deleteConversations } from '../utils/messageService';
import { cn } from '../lib/cn';
import { Icon } from '../lib/icons';
import {
  Card, Avatar, Badge, Input, IconButton, Spinner, EmptyState,
  Dropdown, DropdownItem,
} from '../components/ui';

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

function ConvRow({ conv, currentUid, onClick, isActive, isSelectMode, isSelected }) {
  const otherId = getOtherParticipantId(conv.participants, currentUid);
  const other = conv.participantInfo?.[otherId] ?? {};
  const unread = conv.unreadCount?.[currentUid] ?? 0;

  return (
    <Card
      as="button" type="button" padding="none" variant="sunken" onClick={onClick}
      className={cn('flex w-full items-center gap-3 rounded-2xl border-0 px-3 py-2.5 text-left transition-colors',
        isActive ? 'bg-primary shadow-card' : isSelected ? 'bg-primary-subtle' : 'bg-transparent hover:bg-surface-sunken')}
    >
      {isSelectMode && (
        <span className={cn('grid size-5 shrink-0 place-items-center rounded-[6px] border transition-colors',
          isSelected ? 'border-primary bg-primary text-on-primary' : 'border-border-strong')}>
          {isSelected && <Icon name="check" className="size-3.5" strokeWidth={3} />}
        </span>
      )}
      <Avatar src={other.photo} name={other.name || 'U'} size="md" />
      <div className="min-w-0 flex-1">
        <div className="flex items-baseline justify-between gap-2">
          <span className={cn('truncate text-body-sm', isActive ? 'font-semibold text-white' : unread > 0 ? 'font-semibold text-content' : 'font-medium text-content')}>
            {other.name ?? 'User'}
          </span>
          <span className={cn('shrink-0 text-caption', isActive ? 'text-white/70' : 'text-subtle')}>{timeAgo(conv.lastMessageAt)}</span>
        </div>
        <p className={cn('mt-0.5 truncate text-body-sm', isActive ? 'text-white/80' : unread > 0 ? 'text-content' : 'text-muted')}>
          {conv.propertyTitle && !isActive && <span className="font-medium text-primary">{conv.propertyTitle} · </span>}
          {conv.lastMessage || 'No messages yet'}
        </p>
      </div>
      {unread > 0 && !isActive && !isSelectMode && <Badge tone="primary" size="sm">{unread > 99 ? '99+' : unread}</Badge>}
    </Card>
  );
}

/* Desktop side panel — lazily embeds ConversationDetail (router-safe). */
function ConversationPanel({ conversationId, onClose }) {
  const [Panel, setPanel] = useState(null);
  useEffect(() => {
    import('../pages/ConversationDetail').then((mod) => setPanel(() => mod.default));
  }, []);
  if (!Panel) return <div className="flex flex-1 items-center justify-center"><Spinner size="lg" className="text-primary" /></div>;
  return <Panel embedded onClose={onClose} conversationId={conversationId} />;
}

export default function Inbox() {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const { conversationId: paramConvId } = useParams();

  const [conversations, setConversations] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [activeConvId, setActiveConvId] = useState(paramConvId || null);
  const [isDesktop, setIsDesktop] = useState(() => window.innerWidth >= 768);

  const [viewMode, setViewMode] = useState('recent');
  const [isSelectMode, setIsSelectMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState(new Set());

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

  useEffect(() => {
    // Sync URL → active conversation (preserved verbatim).
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (paramConvId) setActiveConvId(paramConvId);
  }, [paramConvId]);

  const handleSelectConv = useCallback((convId) => {
    if (isSelectMode) {
      setSelectedIds((prev) => {
        const next = new Set(prev);
        if (next.has(convId)) next.delete(convId);
        else next.add(convId);
        return next;
      });
      return;
    }
    setActiveConvId(convId);
    if (!isDesktop) navigate(`/messages/${convId}`);
    else window.history.replaceState(null, '', `/messages/${convId}`);
  }, [isDesktop, navigate, isSelectMode]);

  const handleArchiveSelected = async () => {
    if (selectedIds.size === 0) return;
    await archiveConversations(Array.from(selectedIds), currentUser.uid);
    setIsSelectMode(false);
    setSelectedIds(new Set());
    if (selectedIds.has(activeConvId)) { setActiveConvId(null); window.history.replaceState(null, '', '/messages'); }
  };

  const handleDeleteSelected = async () => {
    if (selectedIds.size === 0) return;
    if (!window.confirm('Are you sure you want to delete these conversations?')) return;
    await deleteConversations(Array.from(selectedIds), currentUser.uid);
    setIsSelectMode(false);
    setSelectedIds(new Set());
    if (selectedIds.has(activeConvId)) { setActiveConvId(null); window.history.replaceState(null, '', '/messages'); }
  };

  const filtered = conversations.filter((c) => {
    if (c.deletedBy?.includes(currentUser.uid)) return false;
    const isArchived = c.archivedBy?.includes(currentUser.uid);
    if (viewMode === 'recent' && isArchived) return false;
    if (viewMode === 'archived' && !isArchived) return false;
    if (search) {
      const s = search.toLowerCase();
      return JSON.stringify(c.participantInfo ?? {}).toLowerCase().includes(s) || (c.propertyTitle ?? '').toLowerCase().includes(s);
    }
    return true;
  });

  const sidebarContent = (
    <div className={cn('relative flex h-full flex-col', isDesktop ? 'w-[340px] shrink-0 border-r border-border' : 'w-full')}>
      {/* Desktop header */}
      <div className="hidden shrink-0 items-center justify-between px-5 pb-3 pt-5 md:flex">
        <div className="flex items-center gap-2.5">
          {viewMode === 'archived' ? (
            <IconButton label="Back to messages" variant="surface" size="sm" onClick={() => { setViewMode('recent'); setIsSelectMode(false); }}><Icon name="chevronLeft" /></IconButton>
          ) : (
            <span className="grid size-9 place-items-center rounded-control bg-primary text-on-primary"><Icon name="messages" className="size-5" /></span>
          )}
          <div>
            <h1 className="text-title-md text-content">{viewMode === 'archived' ? 'Archived' : 'Messages'}</h1>
            {!loading && <p className="text-caption text-subtle">{filtered.length} conversation{filtered.length !== 1 ? 's' : ''}</p>}
          </div>
        </div>
      </div>

      {/* Search + options */}
      <div className="flex shrink-0 items-center gap-2 px-4 pb-3" style={{ paddingTop: 'calc(0.75rem + env(safe-area-inset-top))' }}>
        {!isDesktop && viewMode === 'archived' && (
          <IconButton label="Back to messages" variant="surface" onClick={() => { setViewMode('recent'); setIsSelectMode(false); }}><Icon name="chevronLeft" /></IconButton>
        )}
        <Input className="flex-1" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search conversations…" disabled={isSelectMode} leftIcon={<Icon name="search" />} />
        <Dropdown align="end" trigger={<IconButton label="Options" variant="surface"><Icon name="moreVertical" /></IconButton>}>
          <DropdownItem icon={<Icon name="check" />} onSelect={() => { setIsSelectMode((v) => !v); setSelectedIds(new Set()); }}>{isSelectMode ? 'Cancel select' : 'Select messages'}</DropdownItem>
          {viewMode === 'recent' && <DropdownItem icon={<Icon name="document" />} onSelect={() => { setViewMode('archived'); setIsSelectMode(false); }}>Archived list</DropdownItem>}
        </Dropdown>
      </div>

      {/* List */}
      <div className="relative z-0 flex-1 space-y-0.5 overflow-y-auto px-2 pb-20">
        {loading ? (
          <div className="space-y-1 p-2">
            {[0, 1, 2, 3].map((i) => (
              <div key={i} className="flex items-center gap-3 px-2 py-2.5">
                <span className="size-11 shrink-0 animate-pulse rounded-full bg-surface-sunken" />
                <div className="flex-1 space-y-2"><span className="block h-3 w-2/5 animate-pulse rounded-full bg-surface-sunken" /><span className="block h-2.5 w-3/4 animate-pulse rounded-full bg-surface-sunken" /></div>
              </div>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <EmptyState
            icon={<Icon name={viewMode === 'archived' ? 'document' : 'messages'} />}
            title={viewMode === 'archived' ? 'No archived messages' : 'No messages yet'}
            description={viewMode === 'archived' ? 'Archived conversations appear here.' : 'Browse properties and send a viewing request to start chatting.'}
          />
        ) : (
          filtered.map((conv) => (
            <ConvRow
              key={conv.id} conv={conv} currentUid={currentUser.uid}
              onClick={() => handleSelectConv(conv.id)}
              isActive={activeConvId === conv.id && isDesktop && !isSelectMode}
              isSelectMode={isSelectMode} isSelected={selectedIds.has(conv.id)}
            />
          ))
        )}
      </div>

      {/* Multi-select action bar */}
      {isSelectMode && (
        <div className="absolute inset-x-0 bottom-0 z-20 flex items-center justify-between border-t border-border surface-blur p-4">
          <span className="text-body-sm font-medium text-content">{selectedIds.size} selected</span>
          <div className="flex gap-2">
            {viewMode === 'recent' && (
              <IconButton label="Archive selected" variant="surface" onClick={handleArchiveSelected} disabled={selectedIds.size === 0}><Icon name="document" /></IconButton>
            )}
            <IconButton label="Delete selected" variant="danger" onClick={handleDeleteSelected} disabled={selectedIds.size === 0}><Icon name="delete" /></IconButton>
          </div>
        </div>
      )}
    </div>
  );

  if (!isDesktop) {
    return <div className="min-h-screen bg-bg pb-24">{sidebarContent}</div>;
  }

  return (
    <div className="flex bg-bg" style={{ height: 'calc(100dvh - 64px)' }}>
      {sidebarContent}
      <div className="relative z-0 flex flex-1 flex-col overflow-hidden">
        {activeConvId ? (
          <ConversationPanel conversationId={activeConvId} onClose={() => { setActiveConvId(null); window.history.replaceState(null, '', '/messages'); }} />
        ) : (
          <div className="flex flex-1 flex-col items-center justify-center gap-4 px-12 text-center">
            <span className="grid size-20 place-items-center rounded-modal bg-primary-subtle text-primary"><Icon name="messages" className="size-9" /></span>
            <div>
              <h2 className="font-display text-title-lg text-content">Select a conversation</h2>
              <p className="mt-1 max-w-xs text-body-sm text-muted">Choose a conversation from the list to start messaging.</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
