---
title: DM — Conversations
type: data-model
tags: [data-models, firestore, conversations, messaging]
status: stable
last-scanned: 2026-06-28
related: [Feature-Messaging]
---

# `conversations` Collection

Stores messaging threads between users (typically tenant and owner). Actual messages are likely stored as a subcollection, though `messageService.js` handles the abstraction.

## Fields (Inferred)
- `participants` (array of strings) — UIDs of involved users (for querying `where('participants', 'array-contains', uid)`).
- `propertyId` (string) — Associated listing.
- `lastMessage` (string) — Text of most recent message (for inbox previews).
- `lastMessageAt` (timestamp) — Sort key for inbox.
- `unreadCount` (map/number) — Tracking unread states per participant.
- `createdAt` (timestamp)
- `updatedAt` (timestamp)

## Subcollections
- `messages/`
  - `senderId` (string)
  - `text` (string)
  - `timestamp` (timestamp)
  - `readBy` (array of strings)
