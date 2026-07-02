---
tags: [page]
status: complete
last-updated: 2026-06-29
related: [AdminUsers-Page, Account-Page, MyListings-Page, MyPayments-Page, Enquiry-Page, PropertyReviews-Page]
---

# Page: AdminPanel

## Purpose
The AdminPanel is the full back-office control centre for AnyLet platform administrators. It provides real-time monitoring and management of all platform entities: users, property listings, payments, escrow deposits, enquiries, KYC verification, user reports, admin access control, and system health. It is a highly privileged page only accessible to admins.

## Route
`/admin` (with sub-routes: `/admin/users`, `/admin/properties`, `/admin/requests`, `/admin/payments`, `/admin/enquiries`, `/admin/reviews`, `/admin/kyc`, `/admin/reports`, `/admin/claims`, `/admin/settings`) — Requires Auth + `isAdmin` role

## What the User Can Do Here
1. View the platform Overview dashboard with key statistics (total users, listings, pending requests, verified landlords, successful move-ins, and monthly revenue).
2. Browse and search all platform users.
3. Deactivate or reactivate a user account.
4. Permanently delete a user from Firestore.
5. Toggle admin access for users (redirects to the Admin Claims tab).
6. Browse all property listings with tabs for All / Pending / Approved / Rejected.
7. Search listings by title, location, or document ID.
8. Open a listing detail drawer to view full property info and owner details.
9. Approve a pending property listing (marks `isApproved: true`, notifies owner).
10. Reject a property listing (marks `isRejected: true`, notifies owner).
11. Toggle on-site verification badge on a listing.
12. Load more properties (paginated via `propertiesLimit`).
13. View the Live Pipeline of viewing requests and filter by status.
14. Review and approve or reject listing fee, subscription, verification fee, and escrow deposit payments.
15. Release an escrow deposit to the owner (confirms tenant move-in).
16. View enquiry threads with full conversation history and reply to users.
17. Mark enquiries as resolved or delete them.
18. Review property reports submitted by users.
19. Dismiss a report or delete the reported property.
20. Approve or reject user KYC documents (via `AdminKycTab` component).
21. Manage admin access claims (via `AdminClaimsTab` component).
22. Monitor system health and run a data migration/cleanup utility.
23. Collapse or expand the sidebar for more screen real estate.
24. Log out of the admin session.

## Features & Functionality

### Real-Time Listeners
On mount, six `onSnapshot` listeners are attached to: `users`, `viewing_requests`, `enquiries`, `reports`, `payments`, and `escrowDeposits`. A separate `useEffect` re-subscribes to `properties` whenever `propertiesLimit` changes to support "Load More" pagination. All listeners are properly cleaned up via their unsubscribe functions.

### Overview Dashboard
Displays key platform KPIs: Total Users, Total Listings, Pending Requests, Verified Landlords, Successful Move-Ins, and Monthly Revenue. Revenue is calculated from completed `payments` plus a 1% commission deduction from `released` `escrowDeposits`.

### Properties Tab
Listings can be filtered by Pending / Approved / Rejected. Approve/Reject actions update Firestore and send a `createNotification` to the property owner. On-site verification badge can be toggled. Clicking a listing opens a full-detail slide-out drawer that resolves and displays the owner's user profile.

### Payments & Escrow Tab
Admins can approve or reject manually submitted bKash/Nagad payments. Approval logic is polymorphic — based on `payment.type`, it triggers downstream actions:
- `subscription` → activates user's `subscriptionPlan` for 30 days.
- `listing_fee` → approves the related property.
- `verification_fee` → marks property `isOnsiteVerified: true`.
- `escrow_deposit` → sets property status to `Booked` and escrow to `held`.

### Enquiry Thread Manager
`EnquiryCard` (a local sub-component) renders a full conversation between users and admins. It merges a legacy single `adminReply` field with the newer `replies[]` array for backward compatibility. Admins can send replies, mark as resolved, or delete threads.

### Report Manager
Reports submitted by users can be reviewed. Admins can dismiss a report (deletes the report doc) or delete the offending property (notifies the owner, deletes the property doc, and deletes the report doc).

### System Cleanup Utility
A dangerous "Run System Cleanup" action migrates data from legacy collection names (`listings`, `Listings`, `Users`, `Profiles`, `user_profiles`) into the canonical `properties` and `users` collections, then deletes the old documents.

### Delegated Tabs
- `AdminKycTab` — Handles KYC document review.
- `AdminReviewsTab` — Handles review moderation.
- `AdminClaimsTab` — Handles admin custom claim grants/revocations.

## UI Elements
- `ConfirmationModal` — [ConfirmationModal.jsx](vscode://file/Users/safihasan/Desktop/AnyLet%20Web/src/components/ConfirmationModal.jsx:1) — Used for all destructive action confirmations.
- `AdminKycTab` — [AdminKycTab.jsx](vscode://file/Users/safihasan/Desktop/AnyLet%20Web/src/components/AdminKycTab.jsx:1)
- `AdminReviewsTab` — [AdminReviewsTab.jsx](vscode://file/Users/safihasan/Desktop/AnyLet%20Web/src/components/AdminReviewsTab.jsx:1)
- `AdminClaimsTab` — [AdminClaimsTab.jsx](vscode://file/Users/safihasan/Desktop/AnyLet%20Web/src/components/AdminClaimsTab.jsx:1)
- `EnquiryCard` — Local sub-component within `AdminPanel.jsx` for enquiry threads.
- Collapsible Sidebar — `zinc-950` dark sidebar with NavLink-based navigation.
- Listing Detail Drawer — Slide-over panel showing full listing details and owner profile.

## Data & State
### Firestore Collections Used
- `users` — Read (real-time) / Write (deactivate, delete, update subscription).
- `properties` — Read (real-time, paginated) / Write (approve, reject, verify, delete).
- `viewing_requests` — Read (real-time).
- `enquiries` — Read (real-time) / Write (reply, resolve, delete).
- `reports` — Read (real-time) / Write (dismiss/delete).
- `payments` — Read (real-time) / Write (approve/reject, downstream effects).
- `escrowDeposits` — Read (real-time) / Write (release, update status).
- `notifications` — Write (via `createNotification` utility for all admin actions).

### Local State
- `users`, `listings`, `viewingReqs`, `enquiries`, `reports`, `payments`, `escrowDeposits` — Arrays of real-time data.
- `stats` — Platform KPI summary object.
- `isCollapsed` — Boolean for sidebar collapsed state.
- `searchQuery`, `listingSearch` — Strings for filtering users and listings.
- `propertiesTab` — String (`'pending'`/`'approved'`/`'rejected'`/`'all'`) controlling which listings are displayed.
- `selectedListing` / `listingOwner` — Objects for the listing detail drawer.
- `selectedUser` — Object for user detail panel.
- `propertiesLimit` — Number controlling pagination of property queries.
- `modal` — Object controlling the shared `ConfirmationModal`.

### External Hooks
- [useAuth](vscode://file/Users/safihasan/Desktop/AnyLet%20Web/src/contexts/AuthContext.jsx:1) — Provides `currentUser`, `isAdmin`, and `logout`.
- [useToast](vscode://file/Users/safihasan/Desktop/AnyLet%20Web/src/contexts/ToastContext.jsx:1) — Toast notifications.

## Navigation
### Enters From
- Account page → Admin Panel link (only shown to admins).

### Exits To
- All sub-routes are rendered via nested React Router `<Routes>` within this component.
- `/login` — On logout.
- `/admin/claims` — When admin toggle is clicked on a user.

## Permissions & Auth
- **Requires Auth:** Yes.
- **Requires `isAdmin` role:** Enforced by the `useAuth()` context. If `isAdmin` is false, the user should be redirected by the router guard.

## Known Issues & What to Fix
- [ ] `totalListings` stat in the Overview is bounded by `propertiesLimit` (not the true total count). A proper aggregate count should be fetched separately. — [Code Link](vscode://file/Users/safihasan/Desktop/AnyLet%20Web/src/pages/AdminPanel.jsx:301)
- [ ] `handleSystemCleanup` is a destructive migration tool left accessible in the Settings tab. It should be gated behind a secondary confirmation (e.g., type "CONFIRM" to proceed) to prevent accidental data loss. — [Code Link](vscode://file/Users/safihasan/Desktop/AnyLet%20Web/src/pages/AdminPanel.jsx:413)
- [ ] `handleToggleAdmin` no longer toggles admin in-place; it just navigates to the Claims tab. The button's label may be misleading to admins expecting an immediate toggle. — [Code Link](vscode://file/Users/safihasan/Desktop/AnyLet%20Web/src/pages/AdminPanel.jsx:315)
