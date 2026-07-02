---
title: Feature — Notifications
type: feature
tags: [features, notifications, alerts]
status: stable
last-scanned: 2026-06-28
related: [DM-notifications, Component-Header, Component-BottomNav]
---

# Feature: Notifications

In-app alerting system for transactional events.

## Files Involved
- `src/pages/Notifications.jsx`
- `src/utils/notificationService.js`
- `src/components/Header.jsx`, `src/components/BottomNav.jsx`

## Collections Touched
- `notifications`

## Architecture
- **Service Abstraction**: `notificationService.js` provides centralized methods for creating notifications (`sendNotification`) and marking them read.
- **Real-time Badge**: The bell icon in the Header and BottomNav listens to an `onSnapshot` query on `notifications` `where('userId', '==', uid)` and `where('read', '==', false)` to display a red unread counter badge.
- **Routing**: Clicking a notification marks it as read and redirects the user using `react-router-dom` based on the notification's embedded `link` property.
