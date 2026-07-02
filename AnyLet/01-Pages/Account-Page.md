---
tags: [page]
status: complete
last-updated: 2026-06-29
related: []
---

# Page: Account

## Purpose
The Account page serves as the central hub for authenticated users to manage their personal profile, view high-level activity statistics, and navigate to all account-specific features (listings, bookings, reviews, settings). It acts as the primary user dashboard on mobile and desktop.

## Route
`/account` (or `/profile`) — Requires Auth

## What the User Can Do Here
1. View their profile picture, name, and email.
2. Upload or change their profile avatar via a hidden file input (Camera icon).
3. View high-level statistics: total listings, active bookings, and total reviews.
4. Complete their KYC verification by uploading an ID document if their onboarding status is incomplete.
5. Navigate to "My Listings" to manage their properties.
6. Navigate to "My Bookings" to view their tenant agreements/escrows.
7. Navigate to "Inbox" to view messages.
8. Navigate to "Saved Properties" (Favorites).
9. Navigate to "My Reviews".
10. Navigate to "Referral Dashboard" to track their earnings.
11. Navigate to "Account Settings" (Edit Profile, Change Password).
12. Navigate to "Admin Panel" (only visible if the user has admin rights).
13. Log out of the application.

## Features & Functionality

### Profile Header & Avatar Upload
Displays the user's name and email. Contains a clickable avatar that opens a file picker. When an image is selected, it securely uploads to Cloudinary (using a signed request via `/api/cloudinary-sign`), updates the `photoURL` on the user's Firebase Auth profile, and merges it into the `users` Firestore document.

### Activity Statistics
Fetches real-time counts from Firestore to display:
- **Listings:** Count of properties where `ownerId` matches the user.
- **Bookings:** Count of `escrowDeposits` where `tenantId` matches the user.
- **Reviews:** Combined count of `propertyReviews` and `ownerReviews` written by the user.

### KYC Verification Modal
If the user's `onboardingStatus` is `PENDING_VERIFICATION` or not approved, a prompt is displayed. The user can open a modal to select a document type (NID, Passport, etc.), upload the file (securely to Cloudinary via a signed request), and submit it for admin review. Updates the `verification` map in the `users` collection.

### Navigation Menu
A scrollable list of categorized links (Settings, Activity, Support) leading to sub-pages. The "Admin Panel" link is conditionally rendered based on the user's custom JWT claims or role.

## UI Elements
- [Accordion / Collapsible Menus] — Used to group navigation links.
- KYC Upload Modal — An inline modal for document submission.
- Avatar Component — Circular image with a camera overlay.
- Quick Stats Row — Three-column layout for listings, bookings, and reviews.

## Data & State
### Firestore Collections Used
- `users` — Read (to fetch profile, KYC status, and preferences) / Write (to update `photoURL` and `verification` data).
- `properties` — Read (aggregation query to count listings).
- `escrowDeposits` — Read (aggregation query to count bookings).
- `propertyReviews` & `ownerReviews` — Read (aggregation queries to count reviews).

### Local State
- `userData` — Stores the currently fetched Firestore user document.
- `stats` — Object containing `listings`, `bookings`, `reviews` counts.
- `statsLoading` — Boolean for skeleton loading state of statistics.
- `uploadingAvatar` — Boolean for avatar upload spinner.
- `showKycModal` — Boolean controlling the KYC modal visibility.
- `kycDocType` — String (e.g., 'nid') for the selected document type.
- `kycFile` — File object for the uploaded KYC document.

### External Hooks
- [useAuth](vscode://file/Users/safihasan/Desktop/AnyLet%20Web/src/contexts/AuthContext.jsx:1) — Provides `currentUser`, `logout`, and `refreshUser`.

## Navigation
### Enters From
- Bottom Navigation Bar (Profile tab)
- Header User Icon

### Exits To
- `/edit-profile` (Account Settings)
- `/my-listings` (My Listings)
- `/my-bookings` (My Bookings)
- `/inbox` (Inbox)
- `/favorites` (Saved)
- `/my-reviews` (Reviews)
- `/referrals` (Referral Dashboard)
- `/admin` (Admin Panel)
- `/login` (On Logout)

## Permissions & Auth
- **Requires Auth:** Users must be logged in to view this page. Handled by a `<ProtectedRoute>` wrapper at the router level.

## Known Issues & What to Fix
_None identified._ (Avatar and KYC uploads have been securely migrated to signed uploads).
