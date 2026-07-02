---
tags: [page]
status: complete
last-updated: 2026-06-29
related: [ConversationDetail-Page, PropertyDetails-Page]
---

# Page: Inbox

## Purpose
The Inbox is the platform's full-featured messaging hub. It presents all of the user's conversations in a real-time list and, on desktop, renders a split-pane layout with the conversation list on the left and the active chat on the right. It supports search, archiving, multi-select bulk actions, and seamless Framer Motion animated transitions with `layoutId` hero continuity from list to detail.

## Route
`/messages` — Requires Auth  
`/messages/:conversationId` — Also supported; sets the initial active conversation.

## What the User Can Do Here
1. View a real-time list of all conversations sorted by last message time.
2. Search conversations by participant name or property title.
3. Click a conversation to open it (mobile: navigates to `/messages/:id`; desktop: opens in right panel).
4. View unread message count badge on each conversation row.
5. Open the options (⋮) menu to enter multi-select mode or switch to the Archive view.
6. Switch to "Archive List" view to see archived conversations.
7. In multi-select mode: toggle checkboxes on individual conversations.
8. Archive selected conversations.
9. Delete selected conversations (with `window.confirm` prompt).
10. Exit multi-select mode via Cancel Select in the ⋮ menu.
11. On desktop: view the "Select a conversation" animated placeholder when no chat is active.

## Features & Functionality

### Real-Time Conversation List
Uses `subscribeToConversations(currentUser.uid, callback)` from `messageService` which attaches an `onSnapshot` listener. Results are filtered client-side by:
- `deletedBy` — excludes conversations the user has deleted.
- `archivedBy` — excludes archived conversations in "recent" view, or shows only archived in "archive" view.
- `search` string — matches against `participantInfo` JSON and `propertyTitle`.

### Responsive Layout
- **Mobile:** Renders only the sidebar/list. Clicking a conversation navigates to `/messages/:id` (full-page `ConversationDetail`).
- **Desktop:** 2-column split layout. Left sidebar (320px fixed) + right `ConversationPanel`. `ConversationPanel` dynamically imports `ConversationDetail` via `React.lazy`-style pattern to avoid a circular dependency and enable code splitting.

### Framer Motion Hero Continuity
`ConvRow` uses `layoutId={avatar-${conv.id}}` and `ConversationDetail` uses the same `layoutId` on its header avatar. This creates a shared element transition: the avatar smoothly morphs from the list row to the chat header on click (desktop, using Framer Motion's `AnimatePresence` + `layout` system).

### 3D Tilt Cards
Each `ConvRow` is wrapped in a `TiltCard` which uses `useMotionValue` + `useTransform` + `useSpring` for a subtle 3D parallax tilt effect on mouse hover. Respects `useReducedMotion` accessibility preference.

### Multi-Select Mode
Entering selection mode via the ⋮ menu shows animated checkboxes on each row. The `selectedIds` Set tracks selected conversation IDs. A floating action bar animates up from the bottom with Archive and Delete buttons.

### Archive / Delete
- `archiveConversations()` and `deleteConversations()` from `messageService` handle the server-side updates (these add the user's UID to `archivedBy[]` or `deletedBy[]` arrays on the conversation documents — soft delete/archive pattern).
- Delete requires `window.confirm()` — a native browser dialog.

## UI Elements
- `ConvRow` — Local sub-component for each conversation thread row.
- `TiltCard` — Local 3D tilt wrapper component.
- `SkeletonRow` — Local animated skeleton for loading state.
- `ConversationPanel` — Local wrapper that lazy-loads `ConversationDetail` as an embedded component.
- Search input.
- Options dropdown (Archive List / Mark mode toggle).
- Multi-select action bar (Archive + Delete).

## Data & State
### Firestore Collections Used
- `conversations` — Read (real-time via `subscribeToConversations`) / Write (via `archiveConversations`, `deleteConversations`).

### Local State
- `conversations` — Array of real-time conversation documents.
- `search` — Controlled string for the search filter.
- `loading` — Boolean for skeleton display.
- `activeConvId` — String ID of the currently open conversation (desktop only).
- `isDesktop` — Boolean from a `resize` event listener.
- `viewMode` — String (`'recent'`/`'archived'`).
- `isSelectMode` — Boolean for multi-select mode.
- `selectedIds` — Set of selected conversation IDs.
- `menuOpen` — Boolean for the ⋮ dropdown.

### External Hooks
- [useAuth](vscode://file/Users/safihasan/Desktop/AnyLet%20Web/src/contexts/AuthContext.jsx:1) — Provides `currentUser`.
- [subscribeToConversations, archiveConversations, deleteConversations, getOtherParticipantId](vscode://file/Users/safihasan/Desktop/AnyLet%20Web/src/utils/messageService.js:1) — Conversation service functions.

## Navigation
### Enters From
- Bottom navigation bar (Messages tab).
- Notification taps.
- PropertyDetails page → "Message Owner" button.

### Exits To
- `/messages/:conversationId` — Mobile navigation to full-page chat.
- `/owner/:uid` — Via avatar/name click in `ConversationDetail`.

## Permissions & Auth
- **Requires Auth:** Yes. `subscribeToConversations` uses `currentUser.uid`.

## Known Issues & What to Fix
- [ ] `handleDeleteSelected` uses `window.confirm()` (a native blocking browser dialog) for deletion confirmation. This is inconsistent with the rest of the app which uses the `ConfirmationModal` component. Should be replaced with the modal. — [Code Link](vscode://file/Users/safihasan/Desktop/AnyLet%20Web/src/pages/Inbox.jsx:380)
- [ ] `isDesktop` is determined by a manual `window.innerWidth >= 768` check and `resize` listener, instead of using the existing `useIsDesktop` hook. This creates duplication. — [Code Link](vscode://file/Users/safihasan/Desktop/AnyLet%20Web/src/pages/Inbox.jsx:308)
