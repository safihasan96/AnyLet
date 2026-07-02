---
tags: [page]
status: complete
last-updated: 2026-06-29
related: [MyBookings-Page, WriteReviewModal-Component, Requests-Page]
---

# Page: MyMoveIns

## Purpose
Displays a history of properties where the current tenant has successfully moved in (based on the `tenantMoveIns` collection). Allows tenants to track their past rentals and provides a direct call-to-action to write a verified review for the property/landlord if they haven't already.

## Route
`/my-move-ins` (or similar) — Requires Auth

## What the User Can Do Here
1. View a chronological list of all properties they've officially moved into.
2. See the property image, name, landlord's name, and the move-in date.
3. Click on the landlord's profile to view `OwnerProfile`.
4. Click "Write a Review" to open the `WriteReviewModal` for a specific move-in.
5. See a "Review Submitted" status if they have already reviewed that move-in.
6. If no move-ins exist, see an empty state with a button to view their pending requests.

## Features & Functionality

### Real-Time Move-Ins Query
Uses `onSnapshot` on the `tenantMoveIns` collection where `tenantId == currentUser.uid`. Results are sorted client-side by `movedInAt` (descending).

### Owner Name Hydration
The `tenantMoveIns` documents store the `ownerId`, but not necessarily the owner's latest name. A `useEffect` hook intercepts the snapshot data, identifies unique `ownerId`s, and performs secondary `getDoc` lookups on the `users` collection to fetch and cache the `ownerName`s.

### Write Review Modal
Delegates review creation to the `WriteReviewModal` component. Passes the `moveIn` object, `ownerId`, and `ownerName`. The `hasReviewed` flag on the `moveIn` document determines if the "Write a Review" button is active.

### Framer Motion Animations
Extensive use of Framer Motion for micro-interactions and page transitions:
- `containerVariants`, `cardVariants` for staggered list entrance.
- `cardHoverVariants` for 3D spring-based hover effects on desktop.
- `emptyIconVariants`, `emptyTextVariants` for the empty state entrance.
- Honours `useReducedMotion()` for accessibility.

## UI Elements
- `Skeleton` — Animated loading state.
- `MoveInCard` — Rich card showing property image, badge (Moved In / Reviewed), owner profile link, and CTA.
- `EmptyState` — Animated placeholder with navigation to `/requests`.
- `WriteReviewModal` — [WriteReviewModal.jsx](vscode://file/Users/safihasan/Desktop/AnyLet%20Web/src/components/WriteReviewModal.jsx:1) — Handles review submission.

## Data & State
### Firestore Collections Used
- `tenantMoveIns` — Read (real-time via `onSnapshot`, filtered by `tenantId`).
- `users` — Read (`getDoc` to resolve `ownerId` to `ownerName`).

### Local State
- `moveIns` — Array of move-in documents.
- `loading` — Boolean for skeleton state.
- `ownerNames` — Dictionary caching `{ [ownerId]: "Full Name" }`.
- `reviewModal` — Object `{ isOpen, moveIn, ownerId, ownerName }`.

### External Hooks
- [useAuth](vscode://file/Users/safihasan/Desktop/AnyLet%20Web/src/contexts/AuthContext.jsx:1) — Provides `currentUser`.
- `useReducedMotion` (Framer Motion) — Disables heavy animations if requested by OS.

## Navigation
### Enters From
- Account page → "My Move-Ins" link.

### Exits To
- `/owner/:id` — Via the landlord profile link on the card.
- `/requests` — Via the Empty State CTA.

## Permissions & Auth
- **Requires Auth:** Yes. Redirects to `/login` if `currentUser` is null.

## Known Issues & What to Fix
- [ ] **N+1 Query Issue:** The owner name hydration loop `await Promise.all(missing.map(async (ownerId) => getDoc(...)))` performs a separate read for each unique owner. While `Promise.all` parallelizes it, a user with many distinct landlords will trigger many reads. — [Code Link](vscode://file/Users/safihasan/Desktop/AnyLet%20Web/src/pages/MyMoveIns.jsx:68)
