---
tags: [page]
status: complete
last-updated: 2026-06-29
related: [PropertyDetails-Page, MyMoveIns-Page, WriteReviewModal-Component]
---

# Page: OwnerProfile

## Purpose
Displays a public-facing profile for a landlord/owner on the AnyLet platform. It showcases their details, a grid of all their active (approved) properties, their response rate, and a dedicated section for reviews left by past tenants.

## Route
`/owner/:id` — Public (but actions like voting/replying require Auth)

## What the User Can Do Here
1. View the owner's cover photo, profile picture, full name, location, membership tier, and bio.
2. See the "Member Since" year and the number of active properties managed.
3. View the owner's average response rate.
4. Click "Share Profile" to trigger the native Web Share API (mobile) or copy the URL to clipboard (desktop).
5. View a grid of the owner's active property listings (clicking one navigates to `PropertyDetails`).
6. Read reviews left by previous tenants for this owner, including star ratings, text, and category breakdowns.
7. Click the "Helpful" thumbs-up button on a review to vote it up.
8. If the viewer is the owner themselves: click "Reply" on a review to post a public response.
9. If the viewer is a tenant who has moved into one of this owner's properties (and hasn't reviewed yet): see a prominent banner CTA to "Write Review".

## Features & Functionality

### Concurrent Data Fetching
`useEffect` uses `Promise.all` to fetch multiple streams of data simultaneously:
- Owner user document (`users/:id`).
- Two property queries: `ownerId == id` and `userId == id` (both filtering for `isApproved == true`), merged using a Map to ensure uniqueness.
- Checks if the `currentUser` has an eligible `tenantMoveIns` record with this owner that hasn't been reviewed yet.

### Reviews Aggregation
A separate `useEffect` fetches `ownerReviews` where `ownerId == id` and `isApproved == true`.
The `useMemo` hook computes aggregate statistics (overall average, category averages, and star distribution) which power the review summary UI.

### Review Interactions
- **Helpful Vote:** Calls `toggleHelpfulVote` from `reviewService`. Implements optimistic UI updates so the button reacts instantly before the Firestore write completes.
- **Landlord Reply:** Calls `submitLandlordReply` from `reviewService`. Only available if `currentUser.uid === id` (the owner is viewing their own profile) and no reply exists yet.

### Share API
Uses `navigator.share` if available (typically mobile browsers) to open the native share sheet. Falls back to `navigator.clipboard.writeText` (with a toast notification) on unsupported devices.

### Framer Motion Animations
- `fadeUp`, `reviewCardVariants`, `ctaBannerVariants` for smooth staggered entrances.

## UI Elements
- `OwnerProfileSkeleton` — Loading state.
- Profile Header (Cover image, Avatar with verification badge, Name, Share Button).
- Eligible Review CTA Banner (conditional).
- Bento Grid Layout (Bio, Listings grid, Stats column, Reviews section).
- `PropertyCard` — [PropertyCard.jsx](vscode://file/Users/safihasan/Desktop/AnyLet%20Web/src/components/PropertyCard.jsx:1) — Reusable property display.
- `ReviewCard` — Sub-component for individual reviews with inline reply UI.
- `WriteReviewModal` — [WriteReviewModal.jsx](vscode://file/Users/safihasan/Desktop/AnyLet%20Web/src/components/WriteReviewModal.jsx:1) — Triggered by the CTA banner.

## Data & State
### Firestore Collections Used
- `users` — Read (`getDoc` for the owner profile).
- `properties` — Read (query by `ownerId` and `userId`).
- `tenantMoveIns` — Read (query to check review eligibility).
- `ownerReviews` — Read (query by `ownerId`) / Write (via `reviewService` for votes/replies).

### Local State
- `owner` — Object (the owner's user data).
- `properties` — Array of approved property documents.
- `reviews` — Array of owner review documents.
- `eligibleMoveIn` — Object (the specific `tenantMoveIn` doc unlocking the review CTA).
- `loading`, `reviewsLoading` — Booleans for loading states.
- `reviewModal` — Boolean controlling the `WriteReviewModal`.

### External Hooks
- [useAuth](vscode://file/Users/safihasan/Desktop/AnyLet%20Web/src/contexts/AuthContext.jsx:1) — Provides `currentUser`.
- [useToast](vscode://file/Users/safihasan/Desktop/AnyLet%20Web/src/contexts/ToastContext.jsx:1) — Toast notifications.

## Navigation
### Enters From
- `PropertyDetails` page → "View Profile".
- `MyMoveIns` page → "View Profile".
- `MyReviews` page → Clicking an owner review.

### Exits To
- `/property/:id` — Via clicking a `PropertyCard`.

## Permissions & Auth
- **Public Profile:** Unauthenticated users can view the profile, properties, and reviews.
- **Protected Actions:** Voting on a review redirects unauthenticated users to `/login`. Replying to a review requires the user's UID to match the profile ID.

## Known Issues & What to Fix
- [ ] The dual query for properties (`ownerId` and `userId`) suggests inconsistent data modelling across older vs newer properties. A single canonical field should be enforced to avoid double queries. — [Code Link](vscode://file/Users/safihasan/Desktop/AnyLet%20Web/src/pages/OwnerProfile.jsx:90)
- [ ] If a user navigates directly to `/owner/invalid-id`, the component gracefully catches it but renders a blank-looking "User not found" screen. A styled 404 Empty State would be better. — [Code Link](vscode://file/Users/safihasan/Desktop/AnyLet%20Web/src/pages/OwnerProfile.jsx:212)
