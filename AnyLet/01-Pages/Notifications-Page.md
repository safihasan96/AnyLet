---
tags: [page]
status: complete
last-updated: 2026-06-29
related: [Home-Page, Account-Page]
---

# Page: Notifications

## Purpose
Displays a real-time list of in-app system notifications for the current user. Allows the user to view notification details, mark them as read individually or all at once, and navigate to the relevant deep-link embedded in the notification.

## Route
`/notifications` (implied by typical usage, though not explicitly defined in the file) — Requires Auth

## What the User Can Do Here
1. View a chronological list of their notifications (newest first).
2. See unread notifications styled prominently (un-dimmed, blue dot).
3. Click a notification to mark it as read and navigate to its `link` destination.
4. Click "Mark all as read" to bulk-update all unread notifications.
5. See categorized icons based on the notification type (Request, Booking, Approval, Review, System).

## Features & Functionality

### Real-Time Query
Uses `onSnapshot` on the `notifications` collection where `userId == currentUser.uid`.

### Mark As Read
Clicking a notification updates `isRead: true` on the specific document and triggers a `navigate(notif.link)`.

### Bulk Update
"Mark all as read" triggers a Firestore `writeBatch`. It iterates through all locally cached unread notifications, updating `isRead: true` in a single network request.

### Dynamic Icons & Colours
- `request_received` → Blue message icon.
- `booking_confirmed` → Emerald credit card icon.
- `property_approved` → Indigo shield icon.
- `review_received` → Amber star icon.
- `system` → Slate info icon.
- If `isRead` is true, the icon turns grey regardless of type.

### Framer Motion Animations
- `containerVariants` and `itemVariants` for staggered list entrance.
- Honours `useReducedMotion()` for accessibility.

## UI Elements
- `Skeleton` — Animated loading placeholder.
- "Mark all as read" button.
- Notification List Item (Icon, Title, Message, Date, Unread Dot).
- Empty State placeholder.

## Data & State
### Firestore Collections Used
- `notifications` — Read (query by `userId`) / Write (individual `updateDoc`, bulk `writeBatch`).

### Local State
- `notifications` — Array of notification documents.
- `loading` — Boolean for skeleton state.

### External Hooks
- [useAuth](vscode://file/Users/safihasan/Desktop/AnyLet%20Web/src/contexts/AuthContext.jsx:1) — Provides `currentUser`.

## Navigation
### Enters From
- Home Header → Bell Icon.
- Account Header → Bell Icon.

### Exits To
- Any route specified in `notif.link` (e.g. `/requests`, `/property/123`).

## Permissions & Auth
- **Requires Auth:** Yes. Returns early if `!currentUser` but doesn't explicitly redirect.

## Known Issues & What to Fix
- [ ] Like several other pages, this lacks an explicit redirect to `/login` if `currentUser` is null, which could result in a blank screen if accessed directly via URL while logged out. — [Code Link](vscode://file/Users/safihasan/Desktop/AnyLet%20Web/src/pages/Notifications.jsx:18)
- [ ] There is no limit on the Firestore query (e.g., `limit(50)`), meaning a user with hundreds of past notifications will download them all every time they visit the page. — [Code Link](vscode://file/Users/safihasan/Desktop/AnyLet%20Web/src/pages/Notifications.jsx:20)
