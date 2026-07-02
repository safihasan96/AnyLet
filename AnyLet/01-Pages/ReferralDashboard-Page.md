---
tags: [page]
status: complete
last-updated: 2026-06-29
related: [useReferral-Hook, Account-Page]
---

# Page: ReferralDashboard

## Purpose
A dedicated "Earn Money" page where users can access their unique referral link, track friends they have referred, monitor their lifetime commission earnings, and request a withdrawal of their available balance to a local bank or mobile financial service (bKash/Nagad).

## Route
`/referral` (implied by typical usage) — Requires Auth

## What the User Can Do Here
1. View their unique referral link and referral code.
2. Click "Copy" to copy the link to their clipboard, or "Share" to invoke the native Web Share API.
3. View high-level statistics (Friends Referred, Total Earned, Available Balance).
4. Click "Claim Rewards" to open the `WithdrawModal` (only active if balance ≥ ৳100).
5. Within the `WithdrawModal`, enter their withdrawal amount and banking/MFS details, and submit a secure withdrawal request.
6. View a chronological history of their earned commissions.
7. View a list of friends who have successfully signed up using their link.
8. Read a brief "How It Works" tutorial section.

## Features & Functionality

### Data Hook Integration
Relies heavily on the custom `useReferral` hook to fetch and subscribe to:
- `referralLink`, `referralCode`
- `referees` (array of user objects who used the code)
- `commissions` (history of earnings)
- Financial aggregates (`totalEarned`, `availableBalance`, `withdrawn`)

### Secure Withdrawal Flow
The `WithdrawModal` component handles payout requests securely:
1. Validates that the requested amount is ≥ ৳100 and ≤ the user's available balance.
2. Retrieves a fresh Firebase ID Token via `auth.currentUser.getIdToken(true)`.
3. Makes a `POST` request to a secure backend endpoint (`/api/request-withdrawal`), passing the token in the `Authorization` header.
4. The server-side endpoint validates the balance atomically and writes the withdrawal request to Firestore using the Admin SDK, bypassing client-side rules to prevent tampering.

### Animations & UI
- Framer Motion `AnimatePresence` for the modal entrance/exit.
- `StatCard` sub-components for consistent metric display.
- Dynamic relative time formatting (`relativeTime` utility).
- Uses `react-dom` `createPortal` to render the `WithdrawModal` at the document body level, preventing z-index issues.

## UI Elements
- Hero Banner (Gradient background with promotional text).
- Link Box (Input-like display with Copy and Share buttons).
- Stats Grid (3 columns).
- "Claim Rewards" Button (disabled state if below threshold).
- History Tables (Commissions and Referrals, capped at 10 for commissions).
- `WithdrawModal` — Sub-component rendered via portal.

## Data & State
### External Hooks
- [useReferral](vscode://file/Users/safihasan/Desktop/AnyLet%20Web/src/hooks/useReferral.js:1) — Manages all referral-related data fetching and aggregation.
- [useAuth](vscode://file/Users/safihasan/Desktop/AnyLet%20Web/src/contexts/AuthContext.jsx:1) — Provides `currentUser` for authentication tokens.

### Local State (Modal)
- `amount`, `bankName`, `accNo`, `accName` — Form inputs.
- `loading`, `success`, `error` — Form submission state.

## Navigation
### Enters From
- Account Page → "Earn Money" menu item.

### Exits To
- `/api/request-withdrawal` (Network request, does not navigate away).

## Permissions & Auth
- **Requires Auth:** Yes. The withdrawal flow explicitly requires a valid ID token.

## Known Issues & What to Fix
- [ ] No explicit route guard in the component itself to kick out unauthenticated users (likely handled by a global `<ProtectedRoute>` wrapper, but worth noting).
- [ ] The `useReferral` hook path implies it handles the complex Firestore queries, keeping this component clean.
