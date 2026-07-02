---
tags: [page]
status: complete
last-updated: 2026-06-29
related: [MyMoveIns-Page, MyPayments-Page, PropertyDetails-Page, Escrow-Page]
---

# Page: MyBookings

## Purpose
The tenant-facing view of all escrow deposit records. Shows each deposit the current user has placed as a tenant, with full status tracking (Held, Released, Disputed, Refunded). Allows tenants to confirm their move-in, which triggers the escrow release workflow.

## Route
`/bookings` (or `/my-bookings`) — Requires Auth

## What the User Can Do Here
1. View a real-time list of all their escrow deposit records.
2. See the status badge for each booking (Deposit Held, Released, Disputed, Refunded).
3. Click on a booking to view its full details in a `PaymentStatusModal`.
4. Click "Confirm Move-In" on a `held` booking to confirm they have moved in.
5. Search / filter bookings (if implemented in the UI).

## Features & Functionality

### Real-Time Escrow List
An `onSnapshot` listener queries the `escrowDeposits` collection where `tenantId == currentUser.uid`. Results are sorted by `createdAt` descending (client-side).

### Move-In Confirmation
Clicking "Confirm Move-In" opens a `ConfirmationModal`. On confirm:
1. `updateDoc` sets `confirmedByTenant: true` on the `escrowDeposits/{id}` document.
2. A notification is created for the owner via `createNotification(ownerId, ...)` with a link to `/requests`.
3. The toast confirms the action.
The deposit is only fully released when the owner ALSO confirms from their side (dual-confirmation pattern).

### Status Display
A `STATUS_MAP` object maps status strings to visual config:
- `held` → Blue "Deposit Held" badge with Lock icon.
- `released` → Emerald "Released" badge with CheckCircle2 icon.
- `disputed` → Amber "Disputed" badge with AlertTriangle icon.
- `refunded` → Slate "Refunded" badge with Banknote icon.

### PaymentStatusModal
Clicking a booking card opens a `PaymentStatusModal` component with the full deposit details.

## UI Elements
- `Skeleton` — [Skeleton.jsx](vscode://file/Users/safihasan/Desktop/AnyLet%20Web/src/components/Skeleton.jsx:1) — Loading state.
- Booking cards with status badge, property name, amount, and date.
- `ConfirmationModal` — [ConfirmationModal.jsx](vscode://file/Users/safihasan/Desktop/AnyLet%20Web/src/components/ConfirmationModal.jsx:1) — For move-in confirmation.
- `PaymentStatusModal` — [PaymentStatusModal.jsx](vscode://file/Users/safihasan/Desktop/AnyLet%20Web/src/components/PaymentStatusModal.jsx:1) — Full deposit detail view.

## Data & State
### Firestore Collections Used
- `escrowDeposits` — Read (real-time via `onSnapshot`, filtered by `tenantId`) / Write (`updateDoc` to set `confirmedByTenant: true`).
- `notifications` — Write (via `createNotification` utility on move-in confirm).

### Local State
- `bookings` — Array of escrow deposit documents.
- `loading` — Boolean for initial skeleton.
- `confirmModal` — Object `{ isOpen, bookingId }` for the move-in confirmation modal.
- `statusModal` — Object `{ isOpen, booking }` for the payment status detail modal.
- `confirming` — Boolean for move-in confirm button loading state.

### External Hooks
- [useAuth](vscode://file/Users/safihasan/Desktop/AnyLet%20Web/src/contexts/AuthContext.jsx:1) — Provides `currentUser`.
- [useToast](vscode://file/Users/safihasan/Desktop/AnyLet%20Web/src/contexts/ToastContext.jsx:1) — Toast notifications.

## Navigation
### Enters From
- Account page → "My Bookings" link.

### Exits To
_None identified from list._ (Opens modals in-place.)

## Permissions & Auth
- **Requires Auth:** Yes. Redirects to `/login` if `currentUser` is null.

## Known Issues & What to Fix
- [ ] The `PaymentStatusModal`/`ConfirmationModal` `confirmModal` state uses `bookingId` but the variable is named `confirmModal.bookingId`. Verify this matches the modal's `isOpen` trigger correctly for all status types. — [Code Link](vscode://file/Users/safihasan/Desktop/AnyLet%20Web/src/pages/MyBookings.jsx:30)
