---
tags: [page]
status: complete
last-updated: 2026-06-29
related: [Account-Page, InvoiceModal-Component]
---

# Page: MyPayments

## Purpose
Displays a comprehensive history of a user's financial transactions on the platform, including subscriptions, listing fees, escrow deposits, and verification payments. It aggregates data from completed `payments` and pending/expired `paymentIntents` collections.

## Route
`/my-payments` (or similar) — Requires Auth

## What the User Can Do Here
1. View all their transaction history in a reverse-chronological list.
2. See a summary of Total Paid, Verified payments count, Pending count, and Invoices count.
3. Filter payments by status: All, Verified (completed), Pending, Expired (failed/expired).
4. Refresh the payments list manually using the "Refresh" button.
5. Click "Details" on a payment card to open a bottom-sheet with full transaction details (Invoice No., Transaction ID, Date, Provider, Amount).
6. Click "Invoice" on a completed payment to view and download a PDF invoice (via `InvoiceModal`).
7. Navigate back to the Account page.

## Features & Functionality

### Data Aggregation
Fetches from two Firestore collections concurrently:
1. `payments`: Completed payments where `userId == currentUser.uid` (max 50).
2. `paymentIntents`: Pending or expired payment intents where `uid == currentUser.uid` and `status == 'pending'` (max 50). Checks `expiresAt` against `Date.now()` to determine if an intent is 'pending' or 'expired'.
Merges both lists and sorts by `createdAt` descending.

### Framer Motion Animations
Heavily utilizes Framer Motion for UI state transitions:
- `pageV` — Staggered list entry.
- `heroV`, `statV` — Spring-based entrance for header and stat cards.
- `sheetV`, `backdropV` — Animated bottom sheet for payment details.
- Respects `useReducedMotion()` to disable heavy animations for accessibility.

### Invoice Generation
Delegates invoice rendering and downloading to the `InvoiceModal` component.

### Dynamic Rendering
- Badges and colors are dynamically assigned based on `type` (Subscription, Listing Fee, Booking, Escrow Deposit, Verification) and `status` (Completed, Pending, Expired, Failed).
- Provider icons natively support `bkash`, `nagad`, and `rocket`.

## UI Elements
- `PaymentSkeleton` — Animated loading state.
- Stat Bar (`StatCard`) — Horizontal scrolling stats (Total Paid, Verified, Pending).
- Filter Pills — All, Verified, Pending, Expired.
- `PaymentCard` — Individual transaction row with dynamic badges.
- `PaymentDetailSheet` — Bottom sheet drawer showing full transaction details.
- `InvoiceModal` — [InvoiceModal.jsx](vscode://file/Users/safihasan/Desktop/AnyLet%20Web/src/components/InvoiceModal.jsx:1) — PDF invoice viewer/downloader.

## Data & State
### Firestore Collections Used
- `payments` — Read (query by `userId`).
- `paymentIntents` — Read (query by `uid`, `status == 'pending'`).

### Local State
- `payments` — Merged array of all transaction objects.
- `loading` — Boolean for skeleton state.
- `error` — String for error messages.
- `detailPayment` — Object (the selected payment for the bottom sheet).
- `invoicePayment` — Object (the selected payment for the invoice modal).
- `filter` — String ('all', 'completed', 'pending', 'failed').

### External Hooks
- [useAuth](vscode://file/Users/safihasan/Desktop/AnyLet%20Web/src/contexts/AuthContext.jsx:1) — Provides `currentUser` and `userData` (used by InvoiceModal).

## Navigation
### Enters From
- Account page → "My Payments" link.

### Exits To
- `/profile` (Account page) — Via the back button in the hero header.
- `/` — Via "Explore Properties" on the empty state.

## Permissions & Auth
- **Requires Auth:** Yes. Wait... there is no explicit redirect in `useEffect` if `currentUser` is null. `fetchPayments` just returns early if `!currentUser`. If accessed unauthenticated, it will show the empty state indefinitely.

## Known Issues & What to Fix
- [ ] No explicit authentication guard redirect. If a user lands on this page without being logged in, they see the empty state instead of being redirected to `/login`. A `useEffect` with `navigate('/login')` should be added. — [Code Link](vscode://file/Users/safihasan/Desktop/AnyLet%20Web/src/pages/MyPayments.jsx:433)
- [ ] Hardcoded limit of 50 per collection (`limit(QUERY_LIMIT)`). There is no pagination implemented. A user with >50 payments will never see older ones. — [Code Link](vscode://file/Users/safihasan/Desktop/AnyLet%20Web/src/pages/MyPayments.jsx:452)
