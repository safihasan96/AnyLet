---
tags: [page]
status: complete
last-updated: 2026-06-29
related: [AdminPanel-Page, Account-Page]
---

# Page: AdminUsers

## Purpose
AdminUsers is a focused sub-tab rendered inside the AdminPanel layout that gives platform administrators a real-time, searchable table of all registered users. Admins can manage user account status and roles directly from this view without navigating away.

## Route
`/admin/users` — Requires Auth + admin role

## What the User Can Do Here
1. Search for a user by name or email using a live search input.
2. View each user's avatar initial, full name, email, account status (Active/Deactivated), and current role.
3. Deactivate an active user account (sets `accountStatus: 'deactivated'`).
4. Reactivate a previously deactivated user account.
5. Permanently delete a user document from Firestore.
6. Change a user's role via a dropdown (User / Adviser / Admin).

## Features & Functionality

### Real-Time User List
On mount, an `onSnapshot` listener is attached to the `users` collection (bounded by `QUERY_LIMITS.ADMIN_USERS`). All user cards update in real-time without requiring a page refresh.

### Search & Filter
Client-side filtering of the `users` array by `fullName` or `email`. The result count is displayed inline.

### Toggle Account Status
Clicking the activate/deactivate icon opens a `ConfirmationModal` with appropriate messaging. On confirm, `accountStatus` is set to `'deactivated'` or `'active'` in Firestore.

### Delete User
Opens a `ConfirmationModal` with a destructive warning. On confirm, the user document is permanently deleted from the `users` collection via `deleteDoc`. **Note: This does not delete the user from Firebase Auth.**

### Role Change
A `<select>` dropdown in the Role column allows immediate in-place role changes (User / Adviser / Admin). Selecting a new role calls `handleChangeRole`, which updates both the `role` field and the `isAdmin` boolean on the user document.

## UI Elements
- `ConfirmationModal` — [ConfirmationModal.jsx](vscode://file/Users/safihasan/Desktop/AnyLet%20Web/src/components/ConfirmationModal.jsx:1) — Used for destructive action confirmations.
- Data Table — Standard HTML `<table>` with responsive horizontal scroll.
- Search Input — Text input with `Search` icon from Lucide.
- Role Dropdown — `<select>` with options: User, Adviser, Admin.

## Data & State
### Firestore Collections Used
- `users` — Read (real-time via `onSnapshot`) / Write (update `accountStatus`, update `role`/`isAdmin`, delete document).

### Local State
- `users` — Array of user documents from Firestore.
- `loading` — Boolean for initial load spinner.
- `searchQuery` — String for the client-side search filter.
- `modal` — Object controlling the shared `ConfirmationModal`.

### External Hooks
_None identified beyond React built-ins._

## Navigation
### Enters From
- AdminPanel sidebar → "Platform Users" nav link.

### Exits To
_None identified._ (Self-contained tab, all actions happen in-place.)

## Permissions & Auth
- **Requires Auth:** Yes.
- **Requires Admin Role:** This page is only accessible as a sub-route of `/admin`, which is guarded.

## Known Issues & What to Fix
- [ ] Deleting a user from Firestore does NOT delete their Firebase Auth account. A cloud function or Admin SDK call should be triggered to fully remove the user. — [Code Link](vscode://file/Users/safihasan/Desktop/AnyLet%20Web/src/pages/AdminUsers.jsx:72)
- [ ] Setting `role: 'admin'` via the dropdown directly in Firestore sets `isAdmin: true` on the document, but this does NOT grant the user a Firebase Custom Claim. The AdminClaimsTab should be the authoritative source for admin access. This creates a potential inconsistency. — [Code Link](vscode://file/Users/safihasan/Desktop/AnyLet%20Web/src/pages/AdminUsers.jsx:84)
- [ ] The search is entirely client-side; with a large user base exceeding `QUERY_LIMITS.ADMIN_USERS`, users beyond the limit cannot be found. A server-side search solution should be implemented. — [Code Link](vscode://file/Users/safihasan/Desktop/AnyLet%20Web/src/pages/AdminUsers.jsx:95)
