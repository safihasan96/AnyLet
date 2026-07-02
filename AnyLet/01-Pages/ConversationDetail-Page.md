---
tags: [page]
status: complete
last-updated: 2026-06-29
related: [Inbox-Page, PropertyDetails-Page]
---

# Page: ConversationDetail

## Purpose
Renders a real-time, full-featured messaging chat view between two users (a property owner and a potential tenant). It is the core communication interface of AnyLet, supporting message threading, message deletion, viewing request acceptance/rejection, and swipe/long-press gestures for power-user actions.

## Route
`/messages/:conversationId` — Requires Auth
Also accepts an `embedded` prop (no route) for rendering inline inside the `Inbox` page.

## What the User Can Do Here
1. Read a full real-time message thread with date labels separating messages by day.
2. Send a text message using the input bar (press Enter or click the Send button).
3. Reply to a specific message (swipe right on mobile, or hover action button on desktop).
4. Delete a specific message for themselves only (swipe left on mobile, or hover action button on desktop).
5. Long-press a message to enter selection mode.
6. Select multiple messages in bulk and delete them all at once.
7. Navigate to the other participant's owner profile by clicking their avatar/name in the header.
8. Call the other participant if their phone number is available (via a `tel:` link).
9. View the attached Viewing Request card at the top of the conversation.
10. **If owner:** Accept or Decline a pending viewing request directly from the chat.
11. Navigate back to the Inbox.

## Features & Functionality

### Real-Time Architecture
Three `onSnapshot` listeners are attached:
- `conversations/{conversationId}` — Tracks conversation metadata.
- `viewing_requests/{requestId}` — If the conversation has a linked request, tracks its live status.
- `subscribeToMessages(conversationId, uid)` — Streams all messages in the sub-collection.
On load, `markConversationRead` is also called to clear the unread badge in Inbox.

### Viewing Request Card (`RequestCard`)
A 3D-tilt interactive card (using Framer Motion's `useMotionValue` and `useTransform`) appears at the top of the chat if the conversation has a linked `viewing_request`. It shows property image, tenant details (visible only to the owner), and status badge. For pending requests, the owner sees Accept / Decline buttons. On acceptance, `acceptViewingRequest` is called, which transitions the booking to the next phase.

### Message Locking
If the linked viewing request has a status of `rejected` or is `pending`, the input bar is locked. Users cannot send new messages until the owner accepts the request.

### Swipe Gestures (Mobile)
`MessageBubble` components are `drag="x"` Framer Motion elements. Swiping right >80px triggers delete, swiping left >80px triggers reply. Haptic feedback (`navigator.vibrate(50)`) fires on long-press to enter selection mode.

### Desktop Hover Actions
On hover, action buttons appear beside each bubble (Reply, Delete, Select All).

### Bulk Delete Mode
Long-pressing or clicking the Select icon enters multi-select mode. A selection header replaces the chat header showing the count. A bulk delete confirmation modal fires.

### Message Grouping
Messages are grouped by date, with a date label separator injected between groups (Today, Yesterday, or full date).

### Old Route Migration
If a legacy `requestId` URL param is present (old routing format), the component queries `conversations` collection to find the matching conversation and redirects.

## UI Elements
- `RequestCard` — Local sub-component with 3D parallax tilt effect for viewing request.
- `MessageBubble` — Local sub-component with drag gestures, reply indicators, and selection state.
- Message input bar — `<textarea>` with auto-resize, lock state, and reply preview.
- Selection header — Contextual header shown during multi-select mode.
- Delete Confirmation Modal — Animated modal for single/bulk message delete.

## Data & State
### Firestore Collections Used
- `conversations` — Read (real-time via `onSnapshot`).
- `viewing_requests` — Read (real-time via `onSnapshot`) / Write (via `acceptViewingRequest`, `rejectViewingRequest`).
- `messages` (sub-collection) — Read (via `subscribeToMessages`) / Write (via `sendMessage`, `deleteMessageForUser`, `deleteMessagesBulk`) / Read-mark (via `markConversationRead`).
- `notifications` — Write (via `acceptViewingRequest` utility, indirectly).

### Local State
- `conversation` — The conversation document.
- `request` — The linked viewing request document.
- `messages` — Array of message documents.
- `input` — Controlled textarea string.
- `sending`, `actioning`, `loading` — Boolean flags.
- `replyingTo` — Message object for reply threading.
- `selectedMessages` — Set of message IDs in selection mode.
- `showDeleteConfirm` — String ID or `'bulk'` to control delete confirmation modal.

### External Hooks
- [useAuth](vscode://file/Users/safihasan/Desktop/AnyLet%20Web/src/contexts/AuthContext.jsx:1) — Provides `currentUser`.
- [useToast](vscode://file/Users/safihasan/Desktop/AnyLet%20Web/src/contexts/ToastContext.jsx:1) — Toast notifications.
- [subscribeToMessages, sendMessage, markConversationRead, acceptViewingRequest, rejectViewingRequest, deleteMessageForUser, deleteMessagesBulk](vscode://file/Users/safihasan/Desktop/AnyLet%20Web/src/utils/messageService.js:1) — All message-related service functions.

## Navigation
### Enters From
- Inbox page → clicking a conversation thread.
- Notifications → tapping a message notification.
- `/messages/:requestId` (legacy redirect) → redirects to correct conversation.

### Exits To
- `/messages` — Via the back button.
- `/owner/:uid` — Via clicking the other participant's name/avatar in the header.

## Permissions & Auth
- **Requires Auth:** Yes. All real-time queries depend on `currentUser.uid`.
- **Conversation Access:** Only the two `participants` listed in the conversation document can view the messages (enforced by Firestore security rules).

## Known Issues & What to Fix
- [ ] `handleSend` has an empty `catch` block with no argument. Any send error is silently caught and the toast fires regardless. The error should be logged. — [Code Link](vscode://file/Users/safihasan/Desktop/AnyLet%20Web/src/pages/ConversationDetail.jsx:378)
- [ ] `handleReject` has an empty `catch` block with no argument. — [Code Link](vscode://file/Users/safihasan/Desktop/AnyLet%20Web/src/pages/ConversationDetail.jsx:365)
