---
title: Service — Firebase (Client)
type: service
tags: [services, firebase, auth, firestore]
status: stable
last-scanned: 2026-06-28
related: [Arch-Auth-and-Security, MOC-Data-Models]
---

# Service: Firebase (Client SDK)

The backbone of the application state and persistence.

## Configuration
- Initialized in `src/firebase.js` using standard `initializeApp()`.
- Exposed exports: `auth`, `db` (Firestore instance), `storage` (if used), `googleProvider`.

## Authentication
- Utilizes `firebase/auth`.
- Handles persistence automatically (users stay logged in across sessions).
- Configured to use standard password auth alongside Google OAuth.

## Firestore Data Access
- Heavy usage of Modular SDK (`getDoc`, `setDoc`, `updateDoc`, `query`, `collection`, `where`).
- Data access is strictly client-side for 95% of the application.
- Relies heavily on Firestore Security Rules to prevent unauthorized read/writes (e.g. tenants tampering with escrow records).
- Subcollections (`messages` under `conversations`) used for real-time `onSnapshot` subscriptions.
