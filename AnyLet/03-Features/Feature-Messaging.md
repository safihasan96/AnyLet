---
title: Feature — Messaging & Inbox
type: feature
tags: [features, messaging, inbox]
status: stable
last-scanned: 2026-06-28
related: [DM-conversations, Service-Firebase]
---

# Feature: Messaging & Inbox

Real-time chat functionality between tenants and owners.

## Files Involved
- `src/pages/Inbox.jsx`
- `src/pages/ConversationDetail.jsx`
- `src/utils/messageService.js`

## Collections Touched
- `conversations` (and `messages` subcollection)

## Flow
1. **Inbox View**: `Inbox.jsx` lists all threads where `participants` array contains the current user. Sorted by `lastMessageAt`.
2. **Detail View**: `ConversationDetail.jsx` listens to the `messages` subcollection via `onSnapshot` for real-time updates.
3. **Utility Abstraction**: All Firestore reads/writes for messaging are abstracted into `src/utils/messageService.js`, keeping the React components clean.
