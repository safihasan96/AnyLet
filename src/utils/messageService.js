import {
  collection, query, where, orderBy, onSnapshot,
  addDoc, updateDoc, doc, getDocs, getDoc,
  serverTimestamp, increment, writeBatch,
  arrayUnion, arrayRemove
} from 'firebase/firestore';
import { db } from '../firebase';
import { createNotification } from './notificationService';
import DOMPurify from 'dompurify';

// ── Resolve the other participant in a 2-person chat ────────────────────
export function getOtherParticipantId(participants, currentUid) {
  return participants.find((uid) => uid !== currentUid) ?? null;
}

// ── Create or fetch an existing conversation ─────────────────────────────
// initialOwnerUnread: set to 1 when creating from a new viewing request
//                     so the owner sees an unread badge immediately
export async function getOrCreateConversation({
  currentUid, ownerId, tenantId, propertyId, propertyTitle, propertyImage, propertyPrice,
  requestId, ownerInfo, tenantInfo,
  initialOwnerUnread = 0,
}) {
  // Use currentUid to satisfy Firestore security rules (must query by own uid)
  const queryUid = currentUid || tenantId; 
  
  // Look for existing conversation
  const q = query(
    collection(db, 'conversations'),
    where('participants', 'array-contains', queryUid)
  );
  const snap = await getDocs(q);
  const existing = snap.docs.find((d) => {
      const data = d.data();
      const p = data.participants || [];
      return p.includes(ownerId) && p.includes(tenantId) && data.propertyId === propertyId;
  });
  if (existing) {
      if (requestId) {
          const convRef = doc(db, 'conversations', existing.id);
          await updateDoc(convRef, {
              requestId: requestId,
              lastMessage: '📋 Sent a viewing request',
              lastMessageAt: serverTimestamp(),
              [`unreadCount.${ownerId}`]: increment(initialOwnerUnread),
              archivedBy: arrayRemove(ownerId, tenantId),
              deletedBy: arrayRemove(ownerId, tenantId),
          });
          
          // Also add a message to the subcollection so it appears in the chat history
          await addDoc(collection(db, 'conversations', existing.id, 'messages'), {
              senderId: tenantId,
              text: '📋 I have sent a viewing request for this property.',
              createdAt: serverTimestamp(),
              readBy: [tenantId],
              deletedFor: []
          });
      }
      return existing.id;
  }

  // Create new
  const ref = await addDoc(collection(db, 'conversations'), {
    participants: [ownerId, tenantId],
    participantInfo: {
      [ownerId]: ownerInfo ?? { name: 'Owner', photo: null, phone: null },
      [tenantId]: tenantInfo ?? { name: 'Tenant', photo: null, phone: null },
    },
    propertyId: propertyId ?? null,
    propertyTitle: propertyTitle ?? null,
    propertyImage: propertyImage ?? null,
    propertyPrice: propertyPrice ?? null,
    requestId: requestId ?? null,
    lastMessage: requestId ? '📋 Sent a viewing request' : '',
    lastMessageAt: serverTimestamp(),
    lastSenderId: null,
    unreadCount: { [ownerId]: initialOwnerUnread, [tenantId]: 0 },
    createdAt: serverTimestamp(),
  });

  if (requestId) {
      await addDoc(collection(db, 'conversations', ref.id, 'messages'), {
          senderId: tenantId,
          text: '📋 I have sent a viewing request for this property.',
          createdAt: serverTimestamp(),
          readBy: [tenantId],
          deletedFor: []
      });
  }

  return ref.id;
}

// ── Subscribe to all conversations for a user (inbox list) ──────────────
export function subscribeToConversations(currentUid, callback) {
  const q = query(
    collection(db, 'conversations'),
    where('participants', 'array-contains', currentUid)
  );
  return onSnapshot(q, (snap) => {
    const convs = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
    // Sort in memory to avoid requiring a composite index
    convs.sort((a, b) => {
      const timeA = a.lastMessageAt?.toMillis?.() || 0;
      const timeB = b.lastMessageAt?.toMillis?.() || 0;
      return timeB - timeA;
    });
    callback(convs);
  });
}

// ── Subscribe to messages in a specific conversation ────────────────────
export function subscribeToMessages(conversationId, currentUid, callback) {
  const q = query(
    collection(db, 'conversations', conversationId, 'messages'),
    orderBy('createdAt', 'asc'),
  );
  return onSnapshot(q, (snap) => {
    const msgs = snap.docs
      .map((d) => ({ id: d.id, ...d.data() }))
      .filter((m) => !m.deletedFor?.includes(currentUid));
    callback(msgs);
  });
}

// ── Send a message ───────────────────────────────────────────────────────
export async function sendMessage(conversationId, senderId, text, participants, replyTo = null) {
  const batch = writeBatch(db);

  // Sanitize message text to prevent Stored XSS before writing to DB
  const cleanText = DOMPurify.sanitize(text.trim(), { ALLOWED_TAGS: [] });
  if (!cleanText) return; // Prevent empty messages if XSS tags were stripped

  const msgRef = doc(collection(db, 'conversations', conversationId, 'messages'));
  batch.set(msgRef, {
    senderId,
    text: cleanText,
    createdAt: serverTimestamp(),
    readBy: [senderId],
    deletedFor: [],
    ...(replyTo && { replyTo }),
  });

  const convRef = doc(db, 'conversations', conversationId);
  const unreadUpdates = {};
  for (const uid of participants) {
    if (uid !== senderId) {
      unreadUpdates[`unreadCount.${uid}`] = increment(1);
    }
  }
  batch.update(convRef, {
    lastMessage: cleanText,
    lastMessageAt: serverTimestamp(),
    lastSenderId: senderId,
    archivedBy: arrayRemove(...participants),
    deletedBy: arrayRemove(...participants),
    ...unreadUpdates,
  });

  await batch.commit();
}

// ── Soft Delete Messages ──────────────────────────────────────────────────
export async function deleteMessageForUser(conversationId, messageId, userId) {
  const msgRef = doc(db, 'conversations', conversationId, 'messages', messageId);
  await updateDoc(msgRef, {
    deletedFor: arrayUnion(userId)
  });
}

export async function deleteMessagesBulk(conversationId, messageIds, userId) {
  if (!messageIds?.length) return;
  const batch = writeBatch(db);
  for (const id of messageIds) {
    const msgRef = doc(db, 'conversations', conversationId, 'messages', id);
    batch.update(msgRef, {
      deletedFor: arrayUnion(userId)
    });
  }
  await batch.commit();
}

// ── Archive/Delete multiple conversations ────────────────────────────────
export async function archiveConversations(conversationIds, userId) {
  if (!conversationIds?.length) return;
  const batch = writeBatch(db);
  for (const id of conversationIds) {
    batch.update(doc(db, 'conversations', id), {
      archivedBy: arrayUnion(userId),
    });
  }
  await batch.commit();
}

export async function deleteConversations(conversationIds, userId) {
  if (!conversationIds?.length) return;
  const batch = writeBatch(db);
  for (const id of conversationIds) {
    batch.update(doc(db, 'conversations', id), {
      deletedBy: arrayUnion(userId),
    });
  }
  await batch.commit();
}

// ── Mark conversation as read for a user ────────────────────────────────
export async function markConversationRead(conversationId, currentUid) {
  const convRef = doc(db, 'conversations', conversationId);
  await updateDoc(convRef, {
    [`unreadCount.${currentUid}`]: 0,
  });
}

// ── Subscribe to TOTAL unread count across all conversations ─────────────
// All requests are now conversations, so we only need to watch conversations.
export function subscribeToUnreadCount(currentUid, callback) {
  return onSnapshot(
    query(
      collection(db, 'conversations'),
      where('participants', 'array-contains', currentUid),
    ),
    (snap) => {
      const total = snap.docs.reduce((sum, d) => {
        const count = d.data()?.unreadCount?.[currentUid] ?? 0;
        return sum + count;
      }, 0);
      callback(total);
    },
  );
}

// ── Fetch a single viewing request by ID ────────────────────────────────
export async function getViewingRequest(requestId) {
  const ref = doc(db, 'viewing_requests', requestId);
  const snap = await getDoc(ref);
  if (!snap.exists()) return null;
  return { id: snap.id, ...snap.data() };
}

// ── Accept a viewing request ─────────────────────────────────────────────
// Conversation is created at request time, so we just update request status.
export async function acceptViewingRequest({
  requestId, ownerId, tenantId,
  propertyId, propertyTitle, propertyImage, propertyPrice,
  ownerInfo, tenantInfo,
  conversationId: passedConversationId,
}) {
  // Use existing conversation or create one as fallback
  const conversationId = passedConversationId || await getOrCreateConversation({
    currentUid: ownerId,
    ownerId, tenantId, propertyId,
    propertyTitle, propertyImage, propertyPrice,
    requestId, ownerInfo, tenantInfo,
  });

  const reqRef = doc(db, 'viewing_requests', requestId);
  await updateDoc(reqRef, {
    status: 'accepted',
    isRead: true,
    conversationId,
  });

  await createNotification(
    tenantId,
    'request_accepted',
    'Viewing Request Accepted!',
    `Your request for ${propertyTitle} has been accepted. Start chatting now!`,
    `/messages/${conversationId}`
  );

  return conversationId;
}

// ── Reject a viewing request ─────────────────────────────────────────────
export async function rejectViewingRequest(requestId) {
  const reqRef = doc(db, 'viewing_requests', requestId);
  await updateDoc(reqRef, { status: 'rejected', isRead: true });
}
